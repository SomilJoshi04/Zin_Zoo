import mongoose from 'mongoose';

const walletBonusSchema = new mongoose.Schema(
    {
        bonusTitle: { type: String, required: true },
        shortDescription: { type: String, default: '' },
        bonusType: { type: String, enum: ['Percentage', 'Amount'], default: 'Percentage' },
        bonusAmount: { type: Number, required: true, min: 0 },
        minAddMoney: { type: Number, default: 0, min: 0 },
        maxBonus: { type: Number, default: 0, min: 0 },
        startDate: { type: Date, required: true },
        expireDate: { type: Date, required: true },
        status: { type: Boolean, default: true }
    },
    { collection: 'food_wallet_bonuses', timestamps: true }
);

export const WalletBonus = mongoose.model('WalletBonus', walletBonusSchema);
