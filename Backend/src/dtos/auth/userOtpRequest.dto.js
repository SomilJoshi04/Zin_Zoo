import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const schema = z.object({
    phone: z
        .string()
        .min(1, 'Phone is required')
        .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
});

export const validateUserOtpRequestDto = (body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

