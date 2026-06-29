import { sendResponse } from '../../../../utils/response.js';
import { addFundByAdmin } from '../../user/services/userWallet.service.js';
import { WalletBonus } from '../models/walletBonus.model.js';
import { WithdrawMethod } from '../models/withdrawMethod.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// ---- Add Fund ----

export const addFundToCustomer = async (req, res, next) => {
    try {
        const { customer, amount, reference } = req.body;
        if (!customer) throw new ValidationError("Customer ID is required");
        if (!amount || amount <= 0) throw new ValidationError("Valid amount is required");

        const result = await addFundByAdmin(customer, amount, reference);
        return sendResponse(res, 200, "Fund added successfully", result);
    } catch (error) {
        next(error);
    }
};

// ---- Wallet Bonuses ----

export const getWalletBonuses = async (req, res, next) => {
    try {
        const bonuses = await WalletBonus.find().sort({ createdAt: -1 });
        return sendResponse(res, 200, "Wallet bonuses fetched", bonuses);
    } catch (error) {
        next(error);
    }
};

export const createWalletBonus = async (req, res, next) => {
    try {
        const bonus = await WalletBonus.create(req.body);
        return sendResponse(res, 201, "Wallet bonus created", bonus);
    } catch (error) {
        next(error);
    }
};

export const updateWalletBonus = async (req, res, next) => {
    try {
        const bonus = await WalletBonus.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bonus) throw new ValidationError("Bonus not found");
        return sendResponse(res, 200, "Wallet bonus updated", bonus);
    } catch (error) {
        next(error);
    }
};

export const deleteWalletBonus = async (req, res, next) => {
    try {
        const bonus = await WalletBonus.findByIdAndDelete(req.params.id);
        if (!bonus) throw new ValidationError("Bonus not found");
        return sendResponse(res, 200, "Wallet bonus deleted", null);
    } catch (error) {
        next(error);
    }
};

export const toggleWalletBonusStatus = async (req, res, next) => {
    try {
        const bonus = await WalletBonus.findById(req.params.id);
        if (!bonus) throw new ValidationError("Bonus not found");
        bonus.status = !bonus.status;
        await bonus.save();
        return sendResponse(res, 200, "Wallet bonus status toggled", bonus);
    } catch (error) {
        next(error);
    }
};

// ---- Withdraw Methods ----

export const getWithdrawMethods = async (req, res, next) => {
    try {
        const methods = await WithdrawMethod.find().sort({ createdAt: -1 });
        return sendResponse(res, 200, "Withdraw methods fetched", methods);
    } catch (error) {
        next(error);
    }
};

export const createWithdrawMethod = async (req, res, next) => {
    try {
        const method = await WithdrawMethod.create(req.body);
        return sendResponse(res, 201, "Withdraw method created", method);
    } catch (error) {
        next(error);
    }
};

export const updateWithdrawMethod = async (req, res, next) => {
    try {
        const method = await WithdrawMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!method) throw new ValidationError("Method not found");
        return sendResponse(res, 200, "Withdraw method updated", method);
    } catch (error) {
        next(error);
    }
};

export const deleteWithdrawMethod = async (req, res, next) => {
    try {
        const method = await WithdrawMethod.findByIdAndDelete(req.params.id);
        if (!method) throw new ValidationError("Method not found");
        return sendResponse(res, 200, "Withdraw method deleted", null);
    } catch (error) {
        next(error);
    }
};

export const toggleWithdrawMethodStatus = async (req, res, next) => {
    try {
        const method = await WithdrawMethod.findById(req.params.id);
        if (!method) throw new ValidationError("Method not found");
        method.status = !method.status;
        await method.save();
        return sendResponse(res, 200, "Withdraw method status toggled", method);
    } catch (error) {
        next(error);
    }
};
