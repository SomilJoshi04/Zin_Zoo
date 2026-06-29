import mongoose from 'mongoose';

const withdrawFieldSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['Text', 'Number', 'Date', 'Email', 'Phone'], default: 'Text' },
        placeholder: { type: String, default: '' },
        isRequired: { type: Boolean, default: true }
    },
    { _id: false }
);

const withdrawMethodSchema = new mongoose.Schema(
    {
        methodName: { type: String, required: true },
        fields: { type: [withdrawFieldSchema], default: [] },
        status: { type: Boolean, default: true }
    },
    { collection: 'food_withdraw_methods', timestamps: true }
);

export const WithdrawMethod = mongoose.model('WithdrawMethod', withdrawMethodSchema);
