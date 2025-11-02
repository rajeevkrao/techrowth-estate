import express from 'express';
import {
    createOrder,
    verifyPayment,
    getPaymentDetails,
    getCreditPackages,
    getTransactionHistory,
    razorpayWebhook
} from '../controllers/payment.controller.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Public routes
router.get('/packages', getCreditPackages);
router.post('/webhook', razorpayWebhook);

// Protected routes (require authentication)
router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.get('/payment/:paymentId', verifyToken, getPaymentDetails);
router.get('/transactions', verifyToken, getTransactionHistory);

export default router;
