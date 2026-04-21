import { useEffect, useState } from "react";
import { ethers } from "ethers";

const today = new Date().toISOString().split("T")[0];
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const contractABI = [
  "function createTrip(string,string,string,string)",
  "function tripCount() view returns (uint256)",
  "function getTrip(uint256) view returns (uint256,string,string,string,string,address,bool)",
  "function addExpense(uint256,string,uint256)",
  "function deleteTrip(uint256)",
  "function getExpenseCount(uint256) view returns (uint256)",
  "function getExpense(uint256,uint256) view returns (string,uint256,address)"
];

function App() {
  const [plannerName, setPlannerName] = useState("");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripCount, setTripCount] = useState("0");
  const [trips, setTrips] = useState([]);
  const [expenseInputs, setExpenseInputs] = useState({});

  const plannerStorageKey = `plannerNames_${contractAddress}`;
  const payerStorageKey = `payerNames_${contractAddress}`;

  function getPlannerNames() {
    return JSON.parse(localStorage.getItem(plannerStorageKey) || "{}");
  }

  function savePlannerName(tripId, name) {
    const data = getPlannerNames();
    data[tripId] = name;
    localStorage.setItem(plannerStorageKey, JSON.stringify(data));
  }

  function getPayerNames() {
    return JSON.parse(localStorage.getItem(payerStorageKey) || "{}");
  }

  function savePayerName(tripId, expenseIndex, name) {
    const data = getPayerNames();
    data[`${tripId}-${expenseIndex}`] = name;
    localStorage.setItem(payerStorageKey, JSON.stringify(data));
  }

  async function getContract(readOnly = true) {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.BrowserProvider(window.ethereum);

    if (readOnly) {
      return new ethers.Contract(contractAddress, contractABI, provider);
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  }

  async function loadTrips() {
  try {
    const contract = await getContract(true);
    const count = await contract.tripCount();
    const countNumber = Number(count);
    const plannerNames = getPlannerNames();
    const payerNames = getPayerNames();

    setTripCount(count.toString());

    const loadedTrips = [];

    for (let i = 1; i <= countNumber; i++) {
      try {
        const trip = await contract.getTrip(i);

        const isDeleted = trip[6];
        if (isDeleted) {
          continue;
        }

        const expenseCount = await contract.getExpenseCount(i);

        const expenses = [];
        for (let j = 0; j < Number(expenseCount); j++) {
          const expense = await contract.getExpense(i, j);
          expenses.push({
            description: expense[0],
            amount: expense[1].toString(),
            paidBy: payerNames[`${i}-${j}`] || "Unknown",
          });
        }

        loadedTrips.push({
          id: trip[0].toString(),
          title: trip[1],
          destination: trip[2],
          startDate: trip[3],
          endDate: trip[4],
          planner: plannerNames[i] || "Unknown",
          expenseCount: expenseCount.toString(),
          expenses,
        });
      } catch (innerError) {
        console.error(`Error loading trip ${i}:`, innerError);
      }
    }

    setTrips(loadedTrips);
      } catch (error) {
        console.error(error);
        alert("Error loading trips.");
      }
    }

  async function createTrip() {
  try {
    if (
      !plannerName.trim() ||
      !title.trim() ||
      !destination.trim() ||
      !startDate.trim() ||
      !endDate.trim()
    ) {
      alert("Please fill in all trip fields.");
      return;
    }

    if (startDate < today) {
      alert("Start date cannot be in the past.");
      return;
    }

    if (endDate < today) {
      alert("End date cannot be in the past.");
      return;
    }

    if (endDate < startDate) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const contract = await getContract(false);
    const tx = await contract.createTrip(
      title.trim(),
      destination.trim(),
      startDate,
      endDate
    );

    await tx.wait();

    const newTripId = Number(tripCount) + 1;
    savePlannerName(newTripId, plannerName.trim());

    alert("Trip created successfully.");

    setPlannerName("");
    setTitle("");
    setDestination("");
    setStartDate("");
    setEndDate("");

    await loadTrips();
    } catch (error) {
      console.error(error);
      alert("Error creating trip.");
    }
  }

  async function deleteTrip(tripId) {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const contract = await getContract(false);
    const tx = await contract.deleteTrip(Number(tripId));

    await tx.wait();

    alert("Trip deleted successfully.");
    await loadTrips();
    } catch (error) {
      console.error(error);
      alert("Error deleting trip.");
    }
  }

  function handleExpenseInputChange(tripId, field, value) {
    setExpenseInputs((prev) => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        [field]: value,
      },
    }));
  }

  async function addExpense(tripId) {
  try {
    const description = expenseInputs[tripId]?.description?.trim() || "";
    const amount = expenseInputs[tripId]?.amount || "";
    const payer = expenseInputs[tripId]?.payer?.trim() || "";

    if (!description || !amount || !payer) {
      alert("Please enter description, amount, and paid by.");
      return;
    }

    if (Number(amount) <= 0 || Number.isNaN(Number(amount))) {
      alert("Expense amount must be a valid number greater than 0.");
      return;
    }

    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    const currentTrip = trips.find((trip) => trip.id === String(tripId));
    const nextExpenseIndex = currentTrip ? currentTrip.expenses.length : 0;

    const contract = await getContract(false);
    const tx = await contract.addExpense(
      Number(tripId),
      description,
      Number(amount)
    );

    await tx.wait();

    savePayerName(tripId, nextExpenseIndex, payer);

    alert("Expense added successfully.");

    setExpenseInputs((prev) => ({
      ...prev,
      [tripId]: { description: "", amount: "", payer: "" },
    }));

    await loadTrips();
    } catch (error) {
      console.error(error);
      alert("Error adding expense.");
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  const pageStyle = {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#ffffff",
    padding: "24px 16px",
    fontFamily: "Arial, sans-serif",
  };

  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
  };

  const sectionStyle = {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
  };

  const inputStyle = {
    width: "260px",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #475569",
    backgroundColor: "#334155",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
    display: "block",
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "white",
    fontSize: "14px",
    cursor: "pointer",
    marginRight: "8px",
  };

  const greenButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#10b981",
  };

  const redButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ef4444",
  };

  const tripCardStyle = {
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "18px",
    backgroundColor: "#0f172a",
  };

  const tripInnerLayout = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "flex-start",
  };

  const tripInfoBox = {
    flex: "1",
    minWidth: "260px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "16px",
  };

  const expenseBox = {
    flex: "1",
    minWidth: "260px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "16px",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={{ textAlign: "center", fontSize: "42px", marginBottom: "10px" }}>
          Travel DApp ✈️
        </h1>

        <div style={{ ...sectionStyle, textAlign: "center" }}>
          <p style={{ fontSize: "20px", marginTop: "0" }}>
            <strong>Active Trips:</strong> {trips.length}
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Create Trip</h2>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <input
              placeholder="Planner Name"
              value={plannerName}
              onChange={(e) => setPlannerName(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Trip Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={inputStyle}
            />

            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />

            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />

            <button onClick={createTrip} style={buttonStyle}>
              Create Trip
            </button>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>All Trips</h2>

          {trips.length === 0 ? (
            <p style={{ textAlign: "center" }}>No trips found.</p>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} style={tripCardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "16px" }}>{trip.title}</h3>

                <div style={tripInnerLayout}>
                  <div style={tripInfoBox}>
                    <h4>Trip Info</h4>
                    <p><strong>Planner:</strong> {trip.planner}</p>
                    <p><strong>Destination:</strong> {trip.destination}</p>
                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                    <p><strong>End Date:</strong> {trip.endDate}</p>
                    <p><strong>Expense Count:</strong> {trip.expenseCount}</p>

                    <button
                      onClick={() => deleteTrip(trip.id)}
                      style={redButtonStyle}
                    >
                      Delete Trip
                    </button>
                  </div>

                  <div style={expenseBox}>
                    <h4>Add Expense</h4>

                    <input
                      placeholder="Expense Description"
                      value={expenseInputs[trip.id]?.description || ""}
                      onChange={(e) =>
                        handleExpenseInputChange(trip.id, "description", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <input
                      placeholder="Amount"
                      value={expenseInputs[trip.id]?.amount || ""}
                      onChange={(e) =>
                        handleExpenseInputChange(trip.id, "amount", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <input
                      placeholder="Paid By"
                      value={expenseInputs[trip.id]?.payer || ""}
                      onChange={(e) =>
                        handleExpenseInputChange(trip.id, "payer", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <button
                      onClick={() => addExpense(trip.id)}
                      style={greenButtonStyle}
                    >
                      Add Expense
                    </button>

                    {trip.expenses.length > 0 && (
                      <div style={{ marginTop: "18px" }}>
                        <h4>Expenses</h4>
                        {trip.expenses.map((expense, index) => (
                          <div
                            key={index}
                            style={{
                              backgroundColor: "#334155",
                              padding: "10px",
                              borderRadius: "8px",
                              marginBottom: "10px",
                            }}
                          >
                            <p><strong>Description:</strong> {expense.description}</p>
                            <p><strong>Amount:</strong> {expense.amount}</p>
                            <p><strong>Paid By:</strong> {expense.paidBy}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;