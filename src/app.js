
// Project: WineSale Blockchain Application
// Authors: Natoli , Khadija, Aditya
// Description: Connects the website to the WineSale smart contract,
// handles RSA authentication, ETH purchases, transaction history, and shipping.

// These variables are shared by the functions in this file.
let web3;                 // Connects JavaScript to the Ethereum blockchain.
let contract;             // Represents our deployed WineSale smart contract.
let accounts;             // Holds the Ethereum accounts provided by Ganache.
let buyerAccount;         // Stores the account used to purchase wine.
let wineryAccount;        // Stores the account used by the winery.

// This function creates and verifies an RSA signature for one purchase.
async function createPurchaseAuthentication(quantity, totalCostWei) {

    // Generate a new RSA public and private key pair for this purchase.
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-PSS",                 // Select the RSA-PSS signing method.
            modulusLength: 2048,             // Use a 2048-bit RSA key.
            publicExponent: new Uint8Array([1, 0, 1]), // Standard RSA exponent.
            hash: "SHA-256"                  // Use SHA-256 for hashing.
        },
        true,                                // Allow the public key to be exported.
        ["sign", "verify"]                   // Allow signing and verification.
    );

    // Convert the public key into a format that can be exported.
    const publicKeyData = await window.crypto.subtle.exportKey(
        "spki",                              // Standard format for public keys.
        keyPair.publicKey                    // The public key from our key pair.
    );

    // Create a SHA-256 fingerprint from the public key.
    const digest = await window.crypto.subtle.digest(
        "SHA-256",                           // Select the SHA-256 hash algorithm.
        publicKeyData                        // Use the exported public key as input.
    );

    // Convert the fingerprint into a readable hexadecimal string.
    const rsaKeyId = Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

    // Combine the buyer, quantity, payment, and key ID into one message.
    const purchaseDetails =
        buyerAccount + "|" + quantity + "|" + totalCostWei + "|" + rsaKeyId;

    // Convert the purchase information into data that RSA can sign.
    const data = new TextEncoder().encode(purchaseDetails);

    // Use the private key to create a digital signature.
    const signature = await window.crypto.subtle.sign(
        {
            name: "RSA-PSS",                 // Use RSA-PSS for signing.
            saltLength: 32                   // Set the signature salt length.
        },
        keyPair.privateKey,                  // Sign using the private key.
        data                                 // Sign the purchase information.
    );

    // Check the signature using the matching public key.
    const verified = await window.crypto.subtle.verify(
        {
            name: "RSA-PSS",                 // Use the same signing method.
            saltLength: 32                   // Use the same salt length.
        },
        keyPair.publicKey,                   // Verify using the public key.
        signature,                           // The signature we just created.
        data                                 // The original purchase information.
    );

    // Return the verification result and the RSA key ID.
    return {
        verified: verified,
        rsaKeyId: rsaKeyId
    };
}

// This function starts the application and connects it to Ganache.
async function startApp() {
    try {

        // Connect Web3.js to the local Ganache blockchain.
        web3 = new Web3("http://127.0.0.1:8545");

        // Get the Ethereum accounts available in Ganache.
        accounts = await web3.eth.getAccounts();

        // Use the first account as the winery.
        wineryAccount = accounts[0];

        // Use the second account as the buyer.
        buyerAccount = accounts[1];

        // Load the contract information created by Truffle.
        const response = await fetch("../build/contracts/WineSale.json");

        // Check whether the contract file was loaded successfully.
        if (!response.ok) {
            throw new Error("Could not load the WineSale contract file.");
        }

        // Convert the contract file into a JavaScript object.
        const contractData = await response.json();

        // Find the network ID of the connected Ganache blockchain.
        const networkId = await web3.eth.net.getId();

        // Find the deployed contract address for that network.
        const deployedNetwork = contractData.networks[networkId];

        // Make sure the contract has been deployed to this network.
        if (!deployedNetwork) {
            throw new Error(
                "Contract not deployed on this Ganache network. Please migrate again."
            );
        }

        // Connect to the deployed contract using its ABI and address.
        contract = new web3.eth.Contract(
            contractData.abi,
            deployedNetwork.address
        );

        // Print connection information in the browser console.
        console.log("Connected to Ganache!");
        console.log("Connected to WineSale contract!");
        console.log("Winery:", wineryAccount);
        console.log("Buyer:", buyerAccount);
        console.log("Contract address:", deployedNetwork.address);

        // Find the Buy Wine button on the webpage.
        // Run buyWine whenever the buyer clicks that button.
        document.getElementById("buyButton")
            .addEventListener("click", buyWine);

        // Update the stock, price, balance, and order displays.
        await updateDisplay();

    } catch (error) {

        // Print the error in the browser console for troubleshooting.
        console.error(error);

        // Show the connection error on the webpage.
        document.getElementById("message").textContent =
            "Application connection failed: " + error.message;
    }
}

// This function refreshes the information displayed on the webpage.
async function updateDisplay() {

    // Read the remaining wine stock from the smart contract.
    const stock = await contract.methods.wineStock().call();

    // Read the price of one bottle from the smart contract.
    const priceWei = await contract.methods.winePrice().call();

    // Get the buyer's current ETH balance.
    const buyerBalanceWei = await web3.eth.getBalance(buyerAccount);

    // Display the available stock on the webpage.
    document.getElementById("stock").textContent = stock;

    // Convert the bottle price from Wei into ETH and display it.
    document.getElementById("price").textContent =
        web3.utils.fromWei(priceWei.toString(), "ether");

    // Convert the buyer's balance from Wei into ETH.
    // Display the balance with four digits after the decimal point.
    document.getElementById("balance").textContent =
        Number(web3.utils.fromWei(buyerBalanceWei, "ether")).toFixed(4);

    // Refresh the list of completed purchases.
    await displayTransactions();

    // Refresh the winery's order management section.
    await displayAdminOrders();
}

// This function displays all purchases recorded on the blockchain.
async function displayTransactions() {

    // Get the total number of purchases from the smart contract.
    const total = await contract.methods.totalTransactions().call();

    // Find the transaction history section on the webpage.
    const transactionList = document.getElementById("transactionList");

    // Clear the old list before displaying updated information.
    transactionList.innerHTML = "";

    // If there are no purchases, display a message.
    if (Number(total) === 0) {
        transactionList.textContent = "No purchases yet.";
        return;                              // Stop running this function.
    }

    // Repeat this loop once for every purchase.
    for (let i = 0; i < Number(total); i++) {

        // Get the details of the purchase at this position.
        const transaction = await contract.methods.transactions(i).call();

        // Get the RSA key ID saved for this purchase.
        const rsaKeyId = await contract.methods
            .transactionRsaKeyIds(i)
            .call();

        // Create a new HTML container for this order.
        const order = document.createElement("div");

        // Convert the payment amount from Wei into ETH.
        const costETH = web3.utils.fromWei(
            transaction.totalCost.toString(),
            "ether"
        );

        // Create a heading showing the order number.
        const heading = document.createElement("h3");
        heading.textContent = "Order #" + (i + 1);

        // Create a paragraph showing how many bottles were purchased.
        const quantity = document.createElement("p");
        quantity.textContent =
            "Quantity: " + transaction.quantity + " bottles";

        // Create a paragraph showing the total ETH payment.
        const payment = document.createElement("p");
        payment.textContent = "Total payment: " + costETH + " ETH";

        // Create a paragraph showing the buyer's Ethereum address.
        const buyer = document.createElement("p");
        buyer.textContent = "Buyer: " + transaction.buyer;

        // Show whether the winery has shipped the order.
        const status = document.createElement("p");
        status.textContent =
            "Status: " + (transaction.shipped ? "Shipped" : "Not shipped yet");

        // Create a paragraph showing the RSA key ID.
        const keyId = document.createElement("p");
        keyId.textContent = "RSA Key ID: " + rsaKeyId;

        // Allow the long key ID to wrap onto multiple lines.
        keyId.style.wordBreak = "break-all";

        // Add the order information to the order container.
        order.appendChild(heading);
        order.appendChild(quantity);
        order.appendChild(payment);
        order.appendChild(buyer);
        order.appendChild(status);
        order.appendChild(keyId);

        // Add a horizontal line to separate this order from the next.
        order.appendChild(document.createElement("hr"));

        // Add the completed order to the transaction history.
        transactionList.appendChild(order);
    }
}

// This function displays orders that the winery can manage.
async function displayAdminOrders() {

    // Get the total number of purchases from the contract.
    const total = await contract.methods.totalTransactions().call();

    // Find the winery's order management section.
    const adminOrderList = document.getElementById("adminOrderList");

    // Clear the old order list before showing updated information.
    adminOrderList.innerHTML = "";

    // Display a message if no orders have been placed.
    if (Number(total) === 0) {
        adminOrderList.textContent = "No orders to manage yet.";
        return;                              // Stop running this function.
    }

    // Go through each purchase one at a time.
    for (let i = 0; i < Number(total); i++) {

        // Read the purchase details from the contract.
        const transaction = await contract.methods.transactions(i).call();

        // Create a container for this order.
        const order = document.createElement("div");

        // Create a heading showing the order number.
        const heading = document.createElement("h3");
        heading.textContent = "Order #" + (i + 1);

        // Display the number of bottles in the order.
        const quantity = document.createElement("p");
        quantity.textContent =
            "Quantity: " + transaction.quantity + " bottles";

        // Display how much ETH the buyer paid.
        const cost = document.createElement("p");
        cost.textContent =
            "Payment: " +
            web3.utils.fromWei(transaction.totalCost.toString(), "ether") +
            " ETH";

        // Display the current shipping status.
        const status = document.createElement("p");
        status.textContent =
            "Status: " + (transaction.shipped ? "Shipped" : "Not shipped yet");

        // Add the order information to its container.
        order.appendChild(heading);
        order.appendChild(quantity);
        order.appendChild(cost);
        order.appendChild(status);

        // Only show the shipping button if the order is not shipped.
        if (!transaction.shipped) {

            // Create a button for the winery to mark the order as shipped.
            const button = document.createElement("button");
            button.textContent = "Mark as Shipped";

            // Run this code when the winery clicks the shipping button.
            button.addEventListener("click", async function () {
                try {

                    // Disable the button while the shipping request is running.
                    button.disabled = true;

                    // Call the smart contract to mark this order as shipped.
                    // The transaction is sent from the winery's account.
                    await contract.methods.shipOrder(i).send({
                        from: wineryAccount,
                        gas: 300000
                    });

                    // Display a message confirming the shipping update.
                    document.getElementById("adminMessage").textContent =
                        "Order #" + (i + 1) + " marked as shipped!";

                    // Refresh the webpage to show the new shipping status.
                    await updateDisplay();

                } catch (error) {

                    // Show an error if the shipping transaction fails.
                    document.getElementById("adminMessage").textContent =
                        "Shipping failed: " + error.message;

                    // Enable the button again so the winery can retry.
                    button.disabled = false;
                }
            });

            // Add the shipping button to the order container.
            order.appendChild(button);
        }

        // Add a separator after the order.
        order.appendChild(document.createElement("hr"));

        // Display the order in the winery's order list.
        adminOrderList.appendChild(order);
    }
}

// This function runs when the buyer clicks the Buy Wine button.
async function buyWine() {

    // Read the quantity entered by the buyer.
    const quantity = Number(document.getElementById("quantity").value);

    // Find the message area used to show purchase results.
    const message = document.getElementById("message");

    // Find the Buy Wine button.
    const buyButton = document.getElementById("buyButton");

    try {

        // Check that the quantity is a positive whole number.
        if (!Number.isInteger(quantity) || quantity <= 0) {
            message.textContent = "Please enter a valid quantity.";
            return;                          // Stop if the quantity is invalid.
        }

        // Get the current price of one bottle from the contract.
        const priceWei = await contract.methods.winePrice().call();

        // Multiply the bottle price by the requested quantity.
        // The result is kept in Wei, Ethereum's smallest unit.
        const totalCostWei = web3.utils
            .toBN(priceWei)
            .mul(web3.utils.toBN(quantity));

        // Tell the buyer that RSA authentication is starting.
        message.textContent = "Generating RSA key and verifying signature...";

        // Disable the button to prevent another click during the purchase.
        buyButton.disabled = true;

        // Generate a new RSA key pair, sign the purchase details,
        // and check that the signature is valid.
        const authentication = await createPurchaseAuthentication(
            quantity,
            totalCostWei.toString()
        );

        // Display whether RSA signature verification succeeded.
        document.getElementById("rsaStatus").textContent =
            "RSA verification: " +
            (authentication.verified ? "Successful" : "Failed");

        // Do not continue if the RSA signature could not be verified.
        if (!authentication.verified) {
            message.textContent =
                "RSA verification failed. Purchase rejected.";
            return;
        }

        // Tell the buyer that authentication succeeded and payment is starting.
        message.textContent = "RSA verified. Processing ETH payment...";

        // Call the smart contract to purchase wine.
        // Send the quantity, RSA key ID, and exact ETH payment.
        const receipt = await contract.methods
            .buyWine(quantity, authentication.rsaKeyId)
            .send({
                from: buyerAccount,          // Send the purchase from the buyer.
                value: totalCostWei.toString(), // Send the required ETH amount.
                gas: 400000                  // Set the transaction gas limit.
            });

        // Print the blockchain transaction hash in the browser console.
        console.log("Blockchain transaction:", receipt.transactionHash);

        // Print the RSA key ID saved for this purchase.
        console.log("RSA Key ID:", authentication.rsaKeyId);

        // Show a success message to the buyer.
        message.textContent =
            "Purchase successful! ETH payment received and RSA Key ID recorded.";

        // Refresh stock, balance, purchase history, and winery orders.
        await updateDisplay();

    } catch (error) {

        // Print the error details in the browser console.
        console.error(error);

        // Show a purchase error on the webpage.
        message.textContent =
            "Purchase failed: " +
            (error.message || "Please check your ETH balance and stock.");

    } finally {

        // Enable the Buy Wine button again after the purchase attempt.
        buyButton.disabled = false;
    }
}

// Start the application when this JavaScript file is loaded.
startApp();
