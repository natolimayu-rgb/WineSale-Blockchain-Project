
// SPDX-License-Identifier: MIT
// This tells Solidity which license the project uses.

// Project: WineSale Blockchain Application
// Authors: Natoli Mayu, Khadija, Aditya
// Description: A blockchain wine store that accepts ETH,
// records RSA key IDs, and allows the winery to mark orders as shipped.

// This selects the Solidity compiler version for this contract.
pragma solidity ^0.8.21;

// This is the main smart contract for our wine store.
contract WineSale {

    // This stores the Ethereum address of the winery.
    address public winery;

    // This stores how many bottles are currently available.
    uint public wineStock;

    // This stores the price of one bottle in ETH.
    uint public winePrice;

    // This counts how many purchases have been made.
    uint public totalTransactions;

    // This structure describes the information saved for one purchase.
    struct Transaction {

        // The Ethereum address of the person who bought the wine.
        address buyer;

        // The number of bottles purchased.
        uint quantity;

        // The total amount of ETH paid for the order.
        uint totalCost;

        // This is true when the winery marks the order as shipped.
        bool shipped;

        // This stores the RSA public-key fingerprint for this purchase.
        string rsaKeyId;
    }

    // This creates a list that stores all wine purchases.
    Transaction[] public transactions;

    // This mapping lets us retrieve the RSA key ID using the order number.
    mapping(uint => string) public transactionRsaKeyIds;

    // This function runs automatically when the contract is deployed.
    constructor() {

        // The account deploying the contract becomes the winery.
        winery = msg.sender;

        // The store starts with 100 bottles of wine.
        wineStock = 100;

        // Each bottle costs 0.01 ETH.
        winePrice = 0.01 ether;
    }

    // This function allows a buyer to purchase wine using ETH.
    // "payable" means this function can receive ETH.
    function buyWine(uint quantity, string memory rsaKeyId) public payable {

        // Make sure the buyer does not request zero or a negative quantity.
        require(quantity > 0, "Quantity must be greater than zero");

        // Make sure the store has enough bottles for the purchase.
        require(wineStock >= quantity, "Not enough wine in stock");

        // Make sure the RSA key ID contains exactly 64 characters.
        require(bytes(rsaKeyId).length == 64, "Invalid RSA key ID");

        // Calculate the total price by multiplying quantity by bottle price.
        uint totalCost = quantity * winePrice;

        // Check that the buyer sent the exact amount of ETH required.
        require(msg.value == totalCost, "Incorrect ETH payment");

        // Subtract the purchased bottles from the available stock.
        wineStock -= quantity;

        // Increase the total number of purchases by one.
        totalTransactions++;

        // Create a new transaction record and add it to the list.
        transactions.push(
            Transaction(msg.sender, quantity, totalCost, false, rsaKeyId)
        );

        // Save the RSA key ID using the new transaction's list position.
        transactionRsaKeyIds[transactions.length - 1] = rsaKeyId;

        // Send the buyer's ETH payment to the winery's address.
        payable(winery).transfer(msg.value);
    }

    // This function allows the winery to mark an order as shipped.
    // The index identifies which order should be updated.
    function shipOrder(uint index) public {

        // Only the winery account is allowed to ship orders.
        require(msg.sender == winery, "Only winery can ship orders");

        // Make sure the requested order number exists.
        require(index < transactions.length, "Invalid transaction");

        // Make sure the order has not already been shipped.
        require(!transactions[index].shipped, "Order already shipped");

        // Change the order's shipping status to true.
        transactions[index].shipped = true;
    }
}
