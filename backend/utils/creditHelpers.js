import prisma from '../lib/prisma.js';

/**
 * Check if user has sufficient credits
 * @param {string} userId - User ID
 * @param {number} requiredCredits - Required credits amount
 * @returns {Promise<{hasCredits: boolean, currentBalance: number}>}
 */
export const checkCredits = async (userId, requiredCredits) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return {
        hasCredits: user.credits >= requiredCredits,
        currentBalance: user.credits
    };
};

/**
 * Deduct credits from user
 * @param {string} userId - User ID
 * @param {number} credits - Number of credits to deduct
 * @param {string} description - Description of the transaction
 * @param {string} postId - Optional post ID related to transaction
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export const deductCredits = async (userId, credits, description, postId = null) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Check current balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            });

            if (!user) {
                throw new Error('User not found');
            }

            if (user.credits < credits) {
                throw new Error('Insufficient credits');
            }

            // Deduct credits
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        decrement: credits
                    }
                }
            });

            // Create credit transaction record
            await tx.creditTransaction.create({
                data: {
                    userId,
                    postId,
                    credits: -credits, // Negative for spending
                    type: 'SPEND',
                    description
                }
            });

            return { success: true, newBalance: updatedUser.credits };
        });

        return result;
    } catch (error) {
        console.error('Error deducting credits:', error);
        throw error;
    }
};

/**
 * Refund credits to user
 * @param {string} userId - User ID
 * @param {number} credits - Number of credits to refund
 * @param {string} description - Description of the refund
 * @param {string} postId - Optional post ID related to refund
 * @returns {Promise<{success: boolean, newBalance: number}>}
 */
export const refundCredits = async (userId, credits, description, postId = null) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Add credits back
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        increment: credits
                    }
                }
            });

            // Create credit transaction record
            await tx.creditTransaction.create({
                data: {
                    userId,
                    postId,
                    credits: credits, // Positive for refund
                    type: 'REFUND',
                    description
                }
            });

            return { success: true, newBalance: updatedUser.credits };
        });

        return result;
    } catch (error) {
        console.error('Error refunding credits:', error);
        throw error;
    }
};

/**
 * Get user credit balance
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export const getCreditBalance = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user.credits;
};

/**
 * Get user credit transactions
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{transactions: Array, total: number}>}
 */
export const getCreditTransactions = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
            where: { userId },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.creditTransaction.count({ where: { userId } })
    ]);

    return { transactions, total };
};
