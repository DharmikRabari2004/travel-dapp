const hre = require("hardhat");

async function main() {
  const TravelPlanner = await hre.ethers.getContractFactory("TravelPlanner");
  const travelPlanner = await TravelPlanner.deploy();

  await travelPlanner.waitForDeployment();

  console.log("TravelPlanner deployed to:", await travelPlanner.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});   