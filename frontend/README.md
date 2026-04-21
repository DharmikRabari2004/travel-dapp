# Travel DApp

A decentralized travel planning application built using:
- Solidity (Smart Contract)
- Hardhat (Blockchain development)
- React + Ethers.js (Frontend)

## Features
- Create travel trips
- View all trips
- Add expenses to trips
- Wallet connection using MetaMask

## How to Run
1. Run local blockchain:
   npx hardhat node

2. Deploy contract:
   npx hardhat run scripts/deploy.js --network localhost

3. Start frontend:
   cd frontend
   npm run dev