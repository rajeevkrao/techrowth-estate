import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get all credit packages
export const getCreditPackages = async (req, res) => {
    try {
        const packages = await prisma.creditPackage.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        });

        res.status(200).json({
            success: true,
            packages
        });
    } catch (error) {
        console.error('Error fetching credit packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch credit packages',
            error: error.message
        });
    }
};

// Create order
export const createOrder = async (req, res) => {
    try {
        const { packageName } = req.body;
        const userId = req.userId;

        if (!packageName) {
            return res.status(400).json({ message: 'Package name is required' });
        }

        // Get package details
        const creditPackage = await prisma.creditPackage.findUnique({
            where: { name: packageName, isActive: true }
        });

        if (!creditPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        const options = {
            amount: creditPackage.price, // amount already in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Create pending transaction in database
        await prisma.transaction.create({
            data: {
                userId,
                razorpayOrderId: order.id,
                amount: creditPackage.price,
                credits: creditPackage.credits,
                packageName: creditPackage.name,
                status: 'PENDING'
            }
        });

        res.status(200).json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID,
            credits: creditPackage.credits,
            packageName: creditPackage.name
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.userId;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment details'
            });
        }

        // Create signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            // Find the transaction
            const transaction = await prisma.transaction.findUnique({
                where: { razorpayOrderId: razorpay_order_id }
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            if (transaction.status === 'COMPLETED') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment already processed'
                });
            }

            // Update transaction and user credits in a single transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update transaction status
                const updatedTransaction = await tx.transaction.update({
                    where: { razorpayOrderId: razorpay_order_id },
                    data: {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        status: 'COMPLETED'
                    }
                });

                // Add credits to user
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        credits: {
                            increment: transaction.credits
                        }
                    }
                });

                // Create credit transaction record
                await tx.creditTransaction.create({
                    data: {
                        userId,
                        credits: transaction.credits,
                        type: 'PURCHASE',
                        description: `Purchased ${transaction.packageName} package`
                    }
                });

                return { transaction: updatedTransaction, user: updatedUser };
            });

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                creditsAdded: transaction.credits,
                newBalance: result.user.credits
            });
        } else {
            // Update transaction status to failed
            await prisma.transaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: 'FAILED' }
            });

            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await razorpay.payments.fetch(paymentId);

        res.status(200).json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message
        });
    }
};

// Get transaction history for logged-in user
export const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.transaction.count({ where: { userId } })
        ]);

        res.status(200).json({
            success: true,
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction history',
            error: error.message
        });
    }
};

// Razorpay webhook handler
export const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        if (event === 'payment.captured') {
            // Payment was successful
            const orderId = payload.order_id;

            const transaction = await prisma.transaction.findUnique({
                where: { razorpayOrderId: orderId }
            });

            if (transaction && transaction.status !== 'COMPLETED') {
                await prisma.$transaction(async (tx) => {
                    await tx.transaction.update({
                        where: { razorpayOrderId: orderId },
                        data: {
                            razorpayPaymentId: payload.id,
                            status: 'COMPLETED'
                        }
                    });

                    await tx.user.update({
                        where: { id: transaction.userId },
                        data: {
                            credits: {
                                increment: transaction.credits
                            }
                        }
                    });

                    await tx.creditTransaction.create({
                        data: {
                            userId: transaction.userId,
                            credits: transaction.credits,
                            type: 'PURCHASE',
                            description: `Purchased ${transaction.packageName} package (webhook)`
                        }
                    });
                });
            }
        } else if (event === 'payment.failed') {
            // Payment failed
            const orderId = payload.order_id;

            await prisma.transaction.updateMany({
                where: { razorpayOrderId: orderId },
                data: { status: 'FAILED' }
            });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook handler error',
            error: error.message
        });
    }
};
