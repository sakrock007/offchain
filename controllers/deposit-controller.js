const { default: BigNumber } = require('bignumber.js');
const { symbols, commitmentHash } = require('../constants/constants');
const Deposit = require('../models/Deposit');
const { calculateAcquiredYield } = require('../utils/maths');
const logger = require("../utils/logger");

exports.createNewDepositAPI = async (req, res, next) => {
    try {
        const depositDetails = req.body;
        const depositAdded = await this.createNewDeposit(depositDetails);
        return res.status(200).json({
            success: true,
            data: depositAdded
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error Adding deposit: ${error.message}`
        })
    }
}

exports.addToDepositAPI = async (req, res, next) => {
    try {
        const depositDetails = req.body;
        const depositAdded = await this.addToDeposit(depositDetails);
        return res.status(200).json({
            success: true,
            data: depositAdded
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error adding to deposit: ${error.message}`
        })
    }
}

exports.createNewDeposit = async (depositDetails) => {
    try {
        logger.log('info','createNewDeposit with : %s', depositDetails)
        depositDetails["timestamp"] = new Date(depositDetails.time).getTime();
        depositDetails["lastModified"] = depositDetails["timestamp"];
        const depositAdded = await Deposit.create(depositDetails);
        console.log(`New deposit ${depositDetails.depositId} created`);
        return depositAdded;
    } catch (error) {
        console.error(error);
        logger.log('error','createNewDeposit retuened Error : %s', error)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            throw new Error(messages)
        } else {
            throw error;
        }
    }
}

exports.addToDeposit = async (updatedDepositDetails) => {
    try {
        logger.log('info','addToDeposit with : %s', updatedDepositDetails)
        let deposit = await Deposit.findOne({depositId: updatedDepositDetails.depositId});
        if(!deposit) {
            console.warn("No existing deposit found!");
            return;
        }
        const now = new Date().getTime();
        let acquiredYield = deposit["acquiredYield"] || 0;
        acquiredYield += calculateAcquiredYield(deposit, now);
        
        let prevAmount = new BigNumber(deposit["amount"]);
        let addedAmount = new BigNumber(updatedDepositDetails["amount"]);
        let totalAmount = prevAmount.plus(addedAmount).toString();

        let depositAdded = await Deposit.updateOne({
            depositId: updatedDepositDetails.depositId
        }, {
            acquiredYield: acquiredYield,
            lastModified: now,
            amount: totalAmount,
            depositId: updatedDepositDetails.depositId
        });
        console.log(depositAdded);
        console.log(`Added amount ${addedAmount} to deposit ${updatedDepositDetails.depositId}`);
        return depositAdded;
    } catch (error) {
        logger.log('error','addToDeposit retuened Error : %s', error)
        throw error;
    }
}

exports.updateAcquiredYield = async (deposit) => {
    try {
        await Deposit.findOneAndUpdate({ _id: deposit._id }, { acquiredYield: deposit.acquiredYield, lastModified: deposit.lastModified })
    } catch (error) {
        throw error;
    }
}

exports.getDepositsByAccountAPI = async (req, res, next) => {
    try {
        console.log("Requested list of deposits for account: ", req.query.account);
        let deposits = await Deposit.find({ account: req.query.account });
        deposits.forEach(async (deposit) => {
            const now = new Date().getTime();
            let acquiredYield = deposit["acquiredYield"] || 0;
            deposit["market"] = symbols[deposit["market"]];
            deposit["commitment"] = commitmentHash[deposit["commitment"]];
            deposit["acquiredYield"] = acquiredYield + calculateAcquiredYield(deposit, now);
            deposit["lastModified"] = now;
            await this.updateAcquiredYield(deposit);
        });
        return res.status(200).json({
            success: true,
            data: deposits
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error Getting deposits: ${error.message}`
        })
    }
}

exports.deleteAllDepositsAPI = async (req, res, next) => {
    try {
        let response = await Deposit.deleteMany({});
        return res.status(200).json({
            success: true,
            data: response
        })
    } catch(err) {
        return res.status(500).json({
            success: false,
            error: `Error deleting deposits: ${error.message}`
        })
    }
}