import crypto from 'crypto';
import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { FoodUserWallet } from '../models/userWallet.model.js';
import { FoodReferralSettings } from '../../admin/models/referralSettings.model.js';
import { FoodReferralLog } from '../../admin/models/referralLog.model.js';
import { creditReferralReward } from './userWallet.service.js';
import { logger } from '../../../../utils/logger.js';

// Base32-like unambiguous character set (no 0, O, 1, I)
const REFERRAL_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const REFERRAL_PREFIX = 'ZIN';
const RANDOM_LENGTH = 5;

/**
 * Generate a cryptographically secure, collision-safe unique referral code.
 * Example format: ZIN7K4P9
 */
export const generateUniqueReferralCode = async (UserModel = FoodUser) => {
    const maxAttempts = 12;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let code = REFERRAL_PREFIX;
        for (let i = 0; i < RANDOM_LENGTH; i++) {
            const randomIndex = crypto.randomInt(0, REFERRAL_CHARSET.length);
            code += REFERRAL_CHARSET[randomIndex];
        }

        // Verify uniqueness in database
        const exists = await UserModel.exists({ referralCode: code });
        if (!exists) {
            return code;
        }
    }

    // Fallback: add extra random characters if needed
    const extra = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${REFERRAL_PREFIX}${extra}`;
};

/**
 * Check and ensure a user document has a proper alphanumeric referral code.
 * Replaces missing or legacy 24-hex ObjectId referral codes.
 */
export const ensureUserReferralCode = async (userDoc) => {
    if (!userDoc) return '';
    const currentCode = String(userDoc.referralCode || '').trim().toUpperCase();
    const isLegacyObjectId = /^[0-9A-F]{24}$/i.test(currentCode);
    const isMissingOrInvalid = !currentCode || isLegacyObjectId;

    if (isMissingOrInvalid) {
        const newCode = await generateUniqueReferralCode(FoodUser);
        userDoc.referralCode = newCode;
        if (typeof userDoc.save === 'function') {
            await userDoc.save();
        } else if (userDoc._id) {
            await FoodUser.updateOne({ _id: userDoc._id }, { $set: { referralCode: newCode } });
        }
        return newCode;
    }

    return currentCode;
};

/**
 * Safe, idempotent migration for any legacy users with missing or ObjectId referral codes.
 */
export const migrateLegacyReferralCodes = async () => {
    try {
        const users = await FoodUser.find({
            $or: [
                { referralCode: { $exists: false } },
                { referralCode: null },
                { referralCode: '' },
                { referralCode: { $regex: '^[0-9a-fA-F]{24}$' } }
            ]
        }).select('_id referralCode phone');

        let migrated = 0;
        let errors = 0;

        for (const user of users) {
            try {
                const newCode = await generateUniqueReferralCode(FoodUser);
                await FoodUser.updateOne({ _id: user._id }, { $set: { referralCode: newCode } });
                migrated++;
            } catch (err) {
                errors++;
                logger?.warn?.({ err, userId: user._id }, 'Failed to migrate referral code for user');
            }
        }

        return { scanned: users.length, migrated, errors };
    } catch (error) {
        logger?.error?.({ error }, 'Error during migrateLegacyReferralCodes');
        return { scanned: 0, migrated: 0, errors: 1 };
    }
};

/**
 * Lightweight public referral code validation (for frontend UX assistance).
 * Note: Final authoritative validation and crediting always occurs on the backend during registration.
 */
export const validateReferralCodePublic = async (rawCode, currentUserId = null) => {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
        return { valid: false, message: 'Please enter a referral code.' };
    }

    const settingsDoc = await FoodReferralSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    if (!settingsDoc || (Number(settingsDoc.referralRewardUser) || 0) <= 0) {
        return { valid: false, message: 'Referral program is currently inactive.' };
    }

    const referrer = await FoodUser.findOne({ referralCode: code })
        .select('_id name referralCount isActive isVerified')
        .lean();

    if (!referrer || referrer.isActive === false) {
        return { valid: false, message: 'Invalid referral code. Please check and try again.' };
    }

    if (currentUserId && String(referrer._id) === String(currentUserId)) {
        return { valid: false, message: 'You cannot use your own referral code.' };
    }

    const limit = Math.max(0, Number(settingsDoc.referralLimitUser) || 0);
    if (limit > 0 && Number(referrer.referralCount || 0) >= limit) {
        return { valid: false, message: 'This referral code has reached its maximum referral limit.' };
    }

    return {
        valid: true,
        message: 'Valid referral code!',
        rewardAmount: Number(settingsDoc.referralRewardUser) || 0
    };
};

/**
 * SINGLE AUTHORITATIVE REFERRAL PROCESSING SERVICE
 * Evaluates eligibility, enforces concurrency-safe limits, records audit logs,
 * links the referral relationship, and credits the referrer's wallet exactly once.
 */
export const processNewUserReferral = async ({ newUserId, referralCode }) => {
    const rawCode = String(referralCode || '').trim().toUpperCase();
    if (!rawCode) {
        return { success: false, reason: 'no_referral_code_provided' };
    }

    if (!newUserId || !mongoose.Types.ObjectId.isValid(String(newUserId))) {
        return { success: false, reason: 'invalid_user_id' };
    }

    const refereeOid = new mongoose.Types.ObjectId(String(newUserId));

    // 1. Find referrer by unique public referral code
    const referrer = await FoodUser.findOne({ referralCode: rawCode })
        .select('_id name phone referralCount isActive isVerified')
        .lean();

    if (!referrer || referrer.isActive === false) {
        await FoodReferralLog.create({
            referrerId: null,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: 0,
            status: 'rejected',
            reason: 'invalid_code'
        }).catch(() => {});
        return { success: false, reason: 'invalid_code' };
    }

    const referrerId = referrer._id;

    // 2. Self-referral prevention
    if (String(referrerId) === String(refereeOid)) {
        await FoodReferralLog.create({
            referrerId,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: 0,
            status: 'rejected',
            reason: 'self_referral'
        }).catch(() => {});
        return { success: false, reason: 'self_referral' };
    }

    // 3. Read active referral settings from backend source of truth
    const settingsDoc = await FoodReferralSettings.findOne({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();

    const reward = Math.max(0, Number(settingsDoc?.referralRewardUser) || 0);
    const limit = Math.max(0, Number(settingsDoc?.referralLimitUser) || 0);

    if (!settingsDoc || reward <= 0) {
        await FoodReferralLog.create({
            referrerId,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: reward,
            status: 'rejected',
            reason: 'reward_disabled'
        }).catch(() => {});
        return { success: false, reason: 'reward_disabled' };
    }

    if (limit <= 0) {
        await FoodReferralLog.create({
            referrerId,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: reward,
            status: 'rejected',
            reason: 'limit_disabled'
        }).catch(() => {});
        return { success: false, reason: 'limit_disabled' };
    }

    // 4. Idempotency check: Ensure this referee hasn't already been processed
    const alreadyProcessed = await FoodReferralLog.findOne({ refereeId: refereeOid, role: 'USER' }).lean();
    if (alreadyProcessed) {
        return { success: false, reason: 'already_referred' };
    }

    // 5. Concurrency-safe limit enforcement: atomically increment count ONLY IF current count < limit
    const updatedReferrer = await FoodUser.findOneAndUpdate(
        {
            _id: referrerId,
            referralCount: { $lt: limit }
        },
        { $inc: { referralCount: 1 } },
        { new: true }
    );

    if (!updatedReferrer) {
        await FoodReferralLog.create({
            referrerId,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: reward,
            status: 'rejected',
            reason: 'limit_reached'
        }).catch(() => {});
        return { success: false, reason: 'limit_reached' };
    }

    // 6. Create FoodReferralLog as the authoritative idempotency record
    let referralLogDoc;
    try {
        referralLogDoc = await FoodReferralLog.create({
            referrerId,
            refereeId: refereeOid,
            referralCode: rawCode,
            role: 'USER',
            rewardAmount: reward,
            status: 'credited'
        });
    } catch (uniqueErr) {
        // Compound unique index violation on { refereeId: 1, role: 1 } -> Rollback count increment
        await FoodUser.updateOne({ _id: referrerId }, { $inc: { referralCount: -1 } });
        return { success: false, reason: 'duplicate_referral' };
    }

    // 7. Establish permanent referral link and credit referrer's wallet
    try {
        await Promise.all([
            FoodUser.updateOne({ _id: refereeOid }, { $set: { referredBy: referrerId } }),
            creditReferralReward(referrerId, reward, {
                role: 'USER',
                refereeId: String(refereeOid),
                referralLogId: String(referralLogDoc._id)
            })
        ]);
        return { success: true, rewardAmount: reward, referrerId: String(referrerId) };
    } catch (walletErr) {
        logger?.error?.({ walletErr, referrerId, refereeOid }, 'Failed crediting wallet for referral');
        return { success: true, rewardAmount: reward, referrerId: String(referrerId), warning: 'wallet_pending' };
    }
};

/**
 * Fetch current user's referral stats and code.
 */
export const getUserReferralStats = async (userId) => {
    const id = String(userId || '');
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('User not found');
    }
    const oid = new mongoose.Types.ObjectId(id);
    let user = await FoodUser.findById(oid).select('_id referralCount referralCode').lean();

    if (user && (!user.referralCode || /^[0-9a-fA-F]{24}$/.test(user.referralCode))) {
        const freshCode = await ensureUserReferralCode(user);
        user.referralCode = freshCode;
    }

    const [wallet, settingsDoc] = await Promise.all([
        FoodUserWallet.findOne({ userId: oid }).select('referralEarnings balance').lean(),
        FoodReferralSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean()
    ]);

    return {
        referralCode: user?.referralCode || '',
        referralCount: Number(user?.referralCount) || 0,
        totalReferralEarnings: Number(wallet?.referralEarnings) || 0,
        rewardAmount: Math.max(0, Number(settingsDoc?.referralRewardUser) || 0),
        isActive: settingsDoc ? Boolean(settingsDoc.isActive) : true
    };
};

/**
 * Fetch full referral details including invited friends list for Refer & Earn page.
 */
export const getUserReferralDetails = async (userId) => {
    const id = String(userId || '');
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('User not found');
    }

    const oid = new mongoose.Types.ObjectId(id);
    let user = await FoodUser.findById(oid).select('_id referralCount referralCode').lean();

    if (user && (!user.referralCode || /^[0-9a-fA-F]{24}$/.test(user.referralCode))) {
        const freshCode = await ensureUserReferralCode(user);
        user.referralCode = freshCode;
    }

    const [wallet, settingsDoc, logs] = await Promise.all([
        FoodUserWallet.findOne({ userId: oid }).select('referralEarnings balance').lean(),
        FoodReferralSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean(),
        FoodReferralLog.find({ referrerId: oid, role: 'USER' })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
    ]);

    const refereeIds = Array.from(
        new Set(
            (Array.isArray(logs) ? logs : [])
                .map((log) => String(log?.refereeId || ''))
                .filter(Boolean)
        )
    )
        .filter((value) => mongoose.Types.ObjectId.isValid(value))
        .map((value) => new mongoose.Types.ObjectId(value));

    const referees = refereeIds.length
        ? await FoodUser.find({ _id: { $in: refereeIds } })
            .select('_id name phone profileImage')
            .lean()
        : [];

    const refereeMap = new Map(referees.map((entry) => [String(entry._id), entry]));

    const invitedFriends = (Array.isArray(logs) ? logs : []).map((log) => {
        const referee = refereeMap.get(String(log?.refereeId || ''));
        const rawPhone = String(referee?.phone || '');
        const maskedPhone = rawPhone
            ? `${rawPhone.slice(0, Math.min(3, rawPhone.length))}${'*'.repeat(Math.max(rawPhone.length - 5, 0))}${rawPhone.slice(-2)}`
            : '';

        return {
            id: String(log?._id || ''),
            refereeId: String(log?.refereeId || ''),
            name: String(referee?.name || '').trim() || 'Friend',
            phone: maskedPhone,
            profileImage: String(referee?.profileImage || '').trim() || '',
            status: String(log?.status || 'pending'),
            reason: String(log?.reason || ''),
            rewardAmount: Math.max(0, Number(log?.rewardAmount) || 0),
            earnedAmount: String(log?.status || '') === 'credited' ? Math.max(0, Number(log?.rewardAmount) || 0) : 0,
            invitedAt: log?.createdAt || null
        };
    });

    const totalInvited = invitedFriends.length;
    const creditedCount = invitedFriends.filter((entry) => entry.status === 'credited').length;
    const pendingCount = invitedFriends.filter((entry) => entry.status === 'pending').length;
    const rejectedCount = invitedFriends.filter((entry) => entry.status === 'rejected').length;

    return {
        stats: {
            referralCode: user?.referralCode || '',
            referralCount: Number(user?.referralCount) || 0,
            totalReferralEarnings: Number(wallet?.referralEarnings) || 0,
            rewardAmount: Math.max(0, Number(settingsDoc?.referralRewardUser) || 0),
            isActive: settingsDoc ? Boolean(settingsDoc.isActive) : true,
            totalInvited,
            creditedCount,
            pendingCount,
            rejectedCount
        },
        invitedFriends
    };
};
