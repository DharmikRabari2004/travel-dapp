// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TravelPlanner {
    uint256 public tripCount = 0;

    struct Expense {
        string description;
        uint256 amount;
        address paidBy;
    }

    struct Trip {
        uint256 id;
        string title;
        string destination;
        string startDate;
        string endDate;
        address owner;
        address[] members;
        bool exists;
        bool deleted;
    }

    mapping(uint256 => Trip) public trips;
    mapping(uint256 => Expense[]) public tripExpenses;
    mapping(uint256 => mapping(address => bool)) public isMember;

    event TripCreated(
        uint256 id,
        string title,
        string destination,
        string startDate,
        string endDate,
        address owner
    );

    event MemberJoined(uint256 tripId, address member);
    event ExpenseAdded(uint256 tripId, string description, uint256 amount, address paidBy);
    event TripDeleted(uint256 tripId);

    function createTrip(
        string memory _title,
        string memory _destination,
        string memory _startDate,
        string memory _endDate
    ) public {
        tripCount++;

        Trip storage newTrip = trips[tripCount];
        newTrip.id = tripCount;
        newTrip.title = _title;
        newTrip.destination = _destination;
        newTrip.startDate = _startDate;
        newTrip.endDate = _endDate;
        newTrip.owner = msg.sender;
        newTrip.exists = true;
        newTrip.deleted = false;
        newTrip.members.push(msg.sender);

        isMember[tripCount][msg.sender] = true;

        emit TripCreated(
            tripCount,
            _title,
            _destination,
            _startDate,
            _endDate,
            msg.sender
        );
    }

    function joinTrip(uint256 _tripId) public {
        require(trips[_tripId].exists, "Trip does not exist");
        require(!trips[_tripId].deleted, "Trip is deleted");
        require(!isMember[_tripId][msg.sender], "Already a member");

        trips[_tripId].members.push(msg.sender);
        isMember[_tripId][msg.sender] = true;

        emit MemberJoined(_tripId, msg.sender);
    }

    function addExpense(
        uint256 _tripId,
        string memory _description,
        uint256 _amount
    ) public {
        require(trips[_tripId].exists, "Trip does not exist");
        require(!trips[_tripId].deleted, "Trip is deleted");
        require(isMember[_tripId][msg.sender], "Only members can add expenses");

        tripExpenses[_tripId].push(
            Expense({
                description: _description,
                amount: _amount,
                paidBy: msg.sender
            })
        );

        emit ExpenseAdded(_tripId, _description, _amount, msg.sender);
    }

    function deleteTrip(uint256 _tripId) public {
        require(trips[_tripId].exists, "Trip does not exist");
        require(!trips[_tripId].deleted, "Trip already deleted");
        require(trips[_tripId].owner == msg.sender, "Only planner can delete");

        trips[_tripId].deleted = true;

        emit TripDeleted(_tripId);
    }

    function getTrip(uint256 _tripId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            string memory,
            address,
            bool
        )
    {
        require(trips[_tripId].exists, "Trip does not exist");

        Trip memory trip = trips[_tripId];
        return (
            trip.id,
            trip.title,
            trip.destination,
            trip.startDate,
            trip.endDate,
            trip.owner,
            trip.deleted
        );
    }

    function getTripMembers(uint256 _tripId) public view returns (address[] memory) {
        require(trips[_tripId].exists, "Trip does not exist");
        return trips[_tripId].members;
    }

    function getExpenseCount(uint256 _tripId) public view returns (uint256) {
        require(trips[_tripId].exists, "Trip does not exist");
        return tripExpenses[_tripId].length;
    }

    function getExpense(
        uint256 _tripId,
        uint256 _expenseIndex
    ) public view returns (string memory, uint256, address) {
        require(trips[_tripId].exists, "Trip does not exist");
        require(_expenseIndex < tripExpenses[_tripId].length, "Expense does not exist");

        Expense memory exp = tripExpenses[_tripId][_expenseIndex];
        return (exp.description, exp.amount, exp.paidBy);
    }
}