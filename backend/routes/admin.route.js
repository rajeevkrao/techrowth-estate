import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import { checkExpiredPropertiesNow, checkExpiringPropertiesSoon } from '../cron/propertyExpiration.js';

const router = express.Router();

/**
 * Admin route to manually trigger property expiration check
 * POST /api/admin/expire-properties
 * Requires admin authentication
 */
router.post('/expire-properties', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await checkExpiredPropertiesNow();

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message,
                count: result.count,
                expiredPosts: result.expiredPosts || []
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to check expired properties',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in admin expire-properties route:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Admin route to check properties expiring soon (within 7 days)
 * GET /api/admin/expiring-soon
 * Requires admin authentication
 */
router.get('/expiring-soon', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await checkExpiringPropertiesSoon();

        if (result.success) {
            return res.status(200).json({
                success: true,
                count: result.count,
                expiringPosts: result.expiringPosts
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to check expiring properties',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in admin expiring-soon route:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

export default router;
