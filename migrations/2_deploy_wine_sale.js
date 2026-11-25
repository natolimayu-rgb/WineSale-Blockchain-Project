const WineSale = artifacts.require("WineSale");

module.exports = async function (deployer) {
    await deployer.deploy(WineSale);
};