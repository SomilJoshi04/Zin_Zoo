import crypto from 'crypto';
import mongoose from 'mongoose';
import { FoodOrder } from '../../../modules/food/orders/models/order.model.js';
import * as foodTransactionService from '../../../modules/food/orders/services/foodTransaction.service.js';
import { config } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

/**
 * ✅ NEW: Centralized Razorpay Webhook Handler (Core Layer)
 * Manages atomic updates for order payments and refunds across all modules.
 */
export const handleRazorpayWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const secret = config.razorpayWebhookSecret;

    // 1. Verify Signature using raw body buffer
    if (!signature || !secret || !req.rawBody) {
        logger.warn('Razorpay Webhook: Missing signature or rawBody buffer.');
        return res.status(400).send('Invalid signature');
    }

    const expected = crypto
        .createHmac('sha256', secret)
        .update(req.rawBody)
        .digest('hex');

    if (expected !== signature) {
        logger.warn('Razorpay Webhook: Signature verification failed.');
        return res.status(400).send('Invalid signature');
    }

    const { event, payload } = req.body;
    logger.info(`Razorpay Webhook Received: ${event}`);

    try {
        // --- 🟢 Handle Payment Captured (Success) ---
        if (event === 'payment.captured') {
            const paymentObj = payload.payment.entity;
            const rzOrderId = paymentObj.order_id;
            const rzPaymentId = paymentObj.id;

            // 1. Try finding and updating FoodOrder
            let order = await FoodOrder.findOne({ "payment.razorpay.orderId": rzOrderId });
            let isGrocery = false;

            if (!order) {
                const { GroceryOrder } = await import('../../../modules/food/orders/models/groceryOrder.model.js');
                order = await GroceryOrder.findOne({ "payment.razorpay.orderId": rzOrderId });
                if (order) isGrocery = true;
            }

            if (order) {
                const wasPending = order.orderStatus === 'pending_payment';
                order.payment.status = 'paid';
                order.payment.razorpay.paymentId = rzPaymentId;

                if (wasPending) {
                    order.orderStatus = 'confirmed';
                    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
                    order.statusHistory.push({
                        at: new Date(),
                        byRole: "SYSTEM",
                        from: "pending_payment",
                        to: "confirmed",
                        note: "Payment synced via Webhook (payment.captured)"
                    });
                }

                await order.save();

                try {
                    await foodTransactionService.updateTransactionStatus(order._id, 'captured', {
                        status: 'captured',
                        razorpayPaymentId: rzPaymentId,
                        note: 'Payment status synced via Webhook (payment.captured)'
                    });
                } catch (ledgerErr) {
                    logger.error(`Webhook Ledger Error (Order ${order.orderId || order._id}): ${ledgerErr.message}`);
                }

                if (wasPending) {
                    try {
                        const { broadcastNewOrderToAdmin, notifyRestaurantNewOrder } = await import('../../../modules/food/orders/services/order.helpers.js');
                        await notifyRestaurantNewOrder(order);
                        await broadcastNewOrderToAdmin(order);
                        logger.info(`Webhook successfully triggered notifications for confirmed order ${order.orderId || order._id}`);
                    } catch (notifErr) {
                        logger.warn(`Webhook failed to notify admin/restaurant for order ${order._id}: ${notifErr.message}`);
                    }
                }

                logger.info(`Webhook [payment.captured]: Synced Order ${order.orderId || order._id} (Status=${order.orderStatus})`);
            } else {
                logger.warn(`Webhook [payment.captured]: Order not found for RZ-Order: ${rzOrderId}`);
            }
        }

        // --- 🔴 Handle Refund Processed ---
        if (event === 'refund.processed') {
            const refundObj = payload.refund.entity;
            const rzPaymentId = refundObj.payment_id;
            const rzRefundId = refundObj.id;
            const refundAmount = refundObj.amount / 100; // to major unit

            // Sync refund fields in the order
            const order = await FoodOrder.findOneAndUpdate(
                { 
                    "payment.razorpay.paymentId": rzPaymentId,
                    "payment.refund.status": { $ne: 'processed' }
                },
                { 
                    $set: { 
                        "payment.status": 'refunded',
                        "payment.refund": {
                            status: 'processed',
                            amount: refundAmount,
                            refundId: rzRefundId,
                            processedAt: new Date()
                        }
                    } 
                },
                { new: true }
            );

            if (order) {
                logger.info(`Webhook [refund.processed]: Synced Order ${order.orderId} (Refunded)`);
            } else {
                // ✅ ADDED: Log warn if order not found for refund
                logger.warn(`Webhook [refund.processed]: Order not found or already refunded for RZ-Payment: ${rzPaymentId}`);
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        logger.error(`Razorpay Webhook Logic Error: ${err.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
