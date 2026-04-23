# Travel DApp

A decentralized travel planning application built for a university project.

## Features
- Create a trip
- View all active trips
- Add expenses to a trip
- Delete trips
- Planner and payer names shown in the frontend

## Tech Stack
- Solidity
- Hardhat
- React
- Ethers.js
- MetaMask

## How to Run

### Backend
1. Start local blockchain:
   npx hardhat node

2. Deploy contract:
   npx hardhat run scripts/deploy.js --network localhost

### Frontend
1. Go to frontend folder:
   cd frontend

2. Install dependencies:
   npm install

3. Start app:
   npm run dev