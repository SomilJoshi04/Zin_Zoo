import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const phoneSchema = z
    .string()
    .min(8, 'Phone must be at least 8 digits')
    .max(15, 'Phone must be at most 15 digits');

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const aadharRegex = /^[0-9]{12}$/;
const drivingLicenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const bankAccountHolderRegex = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
const bankNameRegex = /^[A-Za-z]+(?:[ .,&'()-]*[A-Za-z]+)*$/;

const deliveryRegisterSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: phoneSchema,
    email: z.string().email().optional().or(z.literal('')),
    countryCode: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    vehicleType: z.string().optional(),
    vehicleName: z.string().optional(),
    vehicleNumber: z.string().optional(),
    drivingLicenseNumber: z
        .string()
        .regex(drivingLicenseRegex, 'Invalid driving license format')
        .optional()
        .or(z.literal('')),
    ref: z.string().trim().max(64).optional().or(z.literal('')),
    panNumber: z
        .string()
        .regex(panRegex, 'Invalid PAN format')
        .optional()
        .or(z.literal('')),
    aadharNumber: z
        .string()
        .regex(aadharRegex, 'Invalid Aadhar format')
        .optional()
        .or(z.literal('')),
    fcmToken: z.string().optional().nullable(),
    platform: z.enum(['web', 'mobile']).optional().default('web')
});

export const validateDeliveryRegisterDto = (body) => {
    const result = deliveryRegisterSchema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

const deliveryProfileUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    countryCode: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    vehicleType: z.string().optional(),
    vehicleName: z.string().optional(),
    vehicleNumber: z.string().optional(),
    drivingLicenseNumber: z
        .string()
        .regex(drivingLicenseRegex, 'Invalid driving license format')
        .optional()
        .or(z.literal('')),
    panNumber: z
        .string()
        .regex(panRegex, 'Invalid PAN format')
        .optional()
        .or(z.literal('')),
    aadharNumber: z
        .string()
        .regex(aadharRegex, 'Invalid Aadhar format')
        .optional()
        .or(z.literal('')),
    fcmToken: z.string().optional().nullable(),
    platform: z.enum(['web', 'mobile']).optional().default('web')
});

export const validateDeliveryProfileUpdateDto = (body) => {
    const result = deliveryProfileUpdateSchema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

const bankDetailsSchema = z.object({
    accountHolderName: z.string().min(1, 'Account holder name is required').optional().or(z.literal('')),
    accountNumber: z.string().min(1, 'Account number is required').optional().or(z.literal('')),
    ifscCode: z.string().min(1, 'IFSC code is required').optional().or(z.literal('')),
    bankName: z.string().min(1, 'Bank name is required').optional().or(z.literal('')),
    upiId: z.string().optional().or(z.literal('')),
    upiQrCode: z.string().optional().or(z.literal(''))
});

const bankDetailsUpdateSchema = z.object({
    documents: z.object({
        bankDetails: bankDetailsSchema.optional(),
        pan: z.object({ number: z.string().optional() }).optional()
    }).optional()
}).optional();

export const validateDeliveryBankDetailsDto = (body) => {
    // If we have flat keys from FormData (multer), reconstruct the nested object for Zod
    const processed = { ...body };
    if (!processed.documents) processed.documents = {};
    if (!processed.documents.bankDetails) {
        processed.documents.bankDetails = {
            accountHolderName: body['documents[bankDetails][accountHolderName]'],
            accountNumber: body['documents[bankDetails][accountNumber]'],
            ifscCode: body['documents[bankDetails][ifscCode]'],
            bankName: body['documents[bankDetails][bankName]'],
            upiId: body['documents[bankDetails][upiId]']
        };
    }
    if (!processed.documents.pan && body['documents[pan][number]']) {
        processed.documents.pan = { number: body['documents[pan][number]'] };
    }

    const result = bankDetailsUpdateSchema.safeParse(processed);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }

    const bankDetails = result.data?.documents?.bankDetails;
    const panNumber = String(result.data?.documents?.pan?.number || '').trim().toUpperCase();
    if (bankDetails) {
        const accountHolderName = String(bankDetails.accountHolderName || '').trim();
        const accountNumber = String(bankDetails.accountNumber || '').trim();
        const ifscCode = String(bankDetails.ifscCode || '').trim().toUpperCase();
        const bankName = String(bankDetails.bankName || '').trim();
        const upiId = String(bankDetails.upiId || '').trim();

        if (!accountHolderName) throw new ValidationError('Account holder name is required');
        if (!accountNumber) throw new ValidationError('Account number is required');
        if (!ifscCode) throw new ValidationError('IFSC code is required');
        if (!bankName) throw new ValidationError('Bank name is required');
        if (!panNumber) throw new ValidationError('PAN number is required');
        if (!upiId) throw new ValidationError('UPI ID is required');

        if (!/^\d{9,18}$/.test(accountNumber)) {
            throw new ValidationError('Account number must be 9-18 digits');
        }
        if (ifscCode && !ifscRegex.test(ifscCode)) {
            throw new ValidationError('Invalid IFSC code format');
        }
        if (accountHolderName && !bankAccountHolderRegex.test(accountHolderName)) {
            throw new ValidationError('Account holder name must contain letters only');
        }
        if (bankName && !bankNameRegex.test(bankName)) {
            throw new ValidationError('Bank name must not contain digits');
        }
        if (!panRegex.test(panNumber)) {
            throw new ValidationError('Invalid PAN format');
        }
        if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
            throw new ValidationError('Invalid UPI ID format');
        }
    }

    return result.data;
};

