const { diamondAddress } = require('../constants/web3');
const OpenOracleContract = require('../blockchain/abis/OracleOpen.json');
const { sendTransaction, getWeb3 } = require('./transaction');

const liquidationTrigger = (address, loanId) => {
    const web3 = getWeb3();
    oracleOpenContract = new web3.eth.Contract(
        OpenOracleContract.abi,
        diamondAddress
    );
    return sendTransaction(diamondAddress, oracleOpenContract, "liquidationTrigger", address, loanId);
}

module.exports = {
    liquidationTrigger
}