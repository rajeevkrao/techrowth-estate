import cron from 'node-cron';
import prisma from '../lib/prisma.js';

/**
 * Property Expiration Cron Job
 * Runs daily at midnight (00:00) to check for expired properties
 * and update their status from ACTIVE to EXPIRED
 */

export const schedulePropertyExpiration = () => {
    // Run every day at midnight (00:00)
    // Format: "minute hour day month weekday"
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running property expiration check at', new Date().toISOString());

            // Find all ACTIVE posts where expiresAt is in the past
            const expiredPosts = await prisma.post.findMany({
                where: {
                    status: 'ACTIVE',
                    expiresAt: {
                        lte: new Date() // Less than or equal to current time
                    }
                },
                select: {
                    id: true,
                    title: true,
                    expiresAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                }
            });

            if (expiredPosts.length === 0) {
                console.log('No expired properties found');
                return;
            }

            console.log(`Found ${expiredPosts.length} expired properties`);

            // Update all expired posts to EXPIRED status
            const result = await prisma.post.updateMany({
                where: {
                    id: {
                        in: expiredPosts.map(post => post.id)
                    }
                },
                data: {
                    status: 'EXPIRED'
                }
            });

            console.log(`Successfully marked ${result.count} properties as EXPIRED`);

            // Log each expired property (useful for debugging and notifications)
            expiredPosts.forEach(post => {
                console.log(`- Property: ${post.title} (ID: ${post.id})`);
                console.log(`  Owner: ${post.user.username} (${post.user.email})`);
                console.log(`  Expired at: ${post.expiresAt}`);
            });

            // TODO: Send email notifications to property owners
            // This would require setting up an email service (e.g., Nodemailer)
            // Example:
            // for (const post of expiredPosts) {
            //     await sendExpirationEmail(post.user.email, post.title);
            // }

        } catch (error) {
            console.error('Error in property expiration cron job:', error);
        }
    });

    console.log('Property expiration cron job scheduled - runs daily at midnight');
};

/**
 * Manual function to check and expire properties immediately
 * Useful for testing or manual admin triggers
 */
export const checkExpiredPropertiesNow = async () => {
    try {
        console.log('Manually checking for expired properties...');

        const expiredPosts = await prisma.post.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lte: new Date()
                }
            }
        });

        if (expiredPosts.length === 0) {
            return { success: true, count: 0, message: 'No expired properties found' };
        }

        const result = await prisma.post.updateMany({
            where: {
                id: {
                    in: expiredPosts.map(post => post.id)
                }
            },
            data: {
                status: 'EXPIRED'
            }
        });

        return {
            success: true,
            count: result.count,
            message: `Successfully marked ${result.count} properties as EXPIRED`,
            expiredPosts: expiredPosts.map(p => ({ id: p.id, title: p.title }))
        };

    } catch (error) {
        console.error('Error checking expired properties:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Function to check properties expiring soon (within 7 days)
 * Useful for sending reminder notifications
 */
export const checkExpiringPropertiesSoon = async () => {
    try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringPosts = await prisma.post.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    gte: new Date(),
                    lte: sevenDaysFromNow
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return {
            success: true,
            count: expiringPosts.length,
            expiringPosts: expiringPosts.map(post => ({
                id: post.id,
                title: post.title,
                expiresAt: post.expiresAt,
                owner: post.user.username,
                email: post.user.email,
                daysRemaining: Math.ceil((post.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            }))
        };

    } catch (error) {
        console.error('Error checking expiring properties:', error);
        return { success: false, error: error.message };
    }
};
