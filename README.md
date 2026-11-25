# WineSale Winery – Blockchain Wine Store

**Project:** WineSale Blockchain Application  
**Authors:** Natoli Mayu, Khadija, Aditya

## 1. Project Overview

WineSale Winery is a blockchain-based online wine store developed using Solidity, Ethereum, and Web3.js.

The application allows customers to purchase wine using ETH. It records purchases on the Ethereum blockchain, generates and verifies RSA signatures in the browser, and allows the winery administrator to update the shipping status of customer orders.

## 2. Technologies Used

- Solidity – Smart contract development
- Ethereum – Blockchain platform
- Ganache – Local Ethereum blockchain for testing
- Truffle – Smart contract compilation and deployment
- Web3.js – Communication between the website and blockchain
- HTML, CSS, and JavaScript – Website interface
- RSA-PSS with SHA-256 – Browser-based digital signatures

## 3. Project Requirements

Before running the application, install:

- Node.js and npm
- Ganache CLI
- Truffle
- A web browser
- Git (optional, for downloading the project)

## 4. Download the Project

Clone the GitHub repository:

```bash
git clone https://github.com/natolimayu-rgb/WineSale-Blockchain-Project.git
```

Enter the project folder:

```bash
cd WineSale-Blockchain-Project
```

Install the project dependencies:

```bash
npm install
```

Install Truffle and Ganache CLI if they are not already installed:

```bash
npm install -g truffle ganache
```

## 5. Run the Application

The application requires three terminal sessions.

### Step 1: Start Ganache

Open the first terminal and run:

```bash
ganache
```

Ganache starts a local Ethereum blockchain and provides test accounts with ETH.

Keep this terminal running.

### Step 2: Compile and Deploy the Smart Contract

Open a second terminal.

Navigate to the project folder:

```bash
cd WineSale-Blockchain-Project
```

Compile the smart contract:

```bash
truffle compile
```

Deploy the contract to the local Ganache blockchain:

```bash
truffle migrate --reset --network development
```

Wait for the deployment to finish successfully.

**Important:** Deploying with `--reset` creates a fresh deployment and resets the contract's application history. Do not run it again if you want to preserve existing test transactions.

### Step 3: Start the Website

Open a third terminal.

Navigate to the project folder:

```bash
cd WineSale-Blockchain-Project
```

Start the local website:

```bash
npm start
```

Open the following address in your browser:

http://localhost:3000/src/index.html

The WineSale Winery website should now appear.

## 6. How to Use the Application

### 6.1 Purchase Wine

1. Open the WineSale Winery website.
2. Review the wine price and available stock.
3. Enter the quantity of wine you want to purchase.
4. Click **Buy Wine**.
5. The application generates a new RSA key pair in the browser.
6. It signs and verifies the purchase information.
7. The smart contract checks the quantity, available stock, and ETH payment.
8. If the transaction is successful, the payment is transferred to the winery and the purchase is recorded on the blockchain.

### 6.2 View Transaction History

After a successful purchase, the Transaction History section displays:

- Order number
- Quantity purchased
- Total ETH payment
- Buyer's blockchain address
- Shipping status
- RSA Key ID

Each purchase receives its own RSA Key ID.

### 6.3 Manage Shipping (Winery Administrator)

1. Locate the Winery Admin section.
2. Find the order you want to update.
3. Click **Mark as Shipped**.
4. The smart contract checks that the transaction is being sent by the winery account.
5. If the transaction succeeds, the order status changes to Shipped.

The winery account is the account that deployed the smart contract.

## 7. RSA Authentication

The application uses RSA-PSS with SHA-256 for browser-based digital signatures.

For each purchase:

1. A new RSA key pair is generated.
2. The private key signs the purchase information.
3. The browser verifies the signature using the public key.
4. A SHA-256 fingerprint of the public key is recorded as the RSA Key ID on the blockchain.

The private key is not stored on the blockchain. RSA signature creation and verification take place in the browser; the smart contract stores the key fingerprint rather than independently verifying the RSA signature.

## 8. Initial Smart Contract Settings

When the contract is deployed:

- Initial wine stock: 100 bottles
- Price per bottle: 0.01 ETH
- Payment method: ETH
- Shipping status: Not shipped until updated by the winery administrator

## 9. Troubleshooting

**Problem: Website does not open**

- Check that Ganache is running.
- Check that the smart contract has been deployed.
- Check that `npm start` is running.
- Confirm that you are using the correct website address.

**Problem: Purchase fails**

- Check that the quantity is greater than zero.
- Check that enough wine is available.
- Make sure the ETH payment matches the purchase total.
- Check that Ganache is running.

**Problem: Shipping fails**

- Make sure the winery account is being used.
- Check that the order exists.
- Check that the order has not already been shipped.

**Problem: Contract cannot be found**

- Run `truffle compile`.
- Deploy the contract to Ganache again if you are starting a fresh test session.
- Make sure the website is connected to the same Ganache blockchain where the contract was deployed.

## 10. Important Notes

This project is configured for local development and demonstration using Ganache. The ETH used during testing is provided by Ganache and is not real cryptocurrency.

The blockchain transaction history belongs to the local Ganache instance. Restarting Ganache with a fresh chain or redeploying the contract can result in a new application history.

The project is intended for educational demonstration, not real wine sales or production financial transactions.

## 11. GitHub Repository

Source code:

https://github.com/natolimayu-rgb/WineSale-Blockchain-Project