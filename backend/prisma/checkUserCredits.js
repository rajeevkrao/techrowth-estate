import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCredits() {
    const username = process.argv[2] || 'pmdnawaz1';

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            creditTransactions: {
                orderBy: { createdAt: 'desc' },
                take: 10
            },
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    if (!user) {
        console.log(`❌ User '${username}' not found`);
        return;
    }

    console.log('\n👤 User Information:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   💳 Credits: ${user.credits}`);
    console.log(`   Verified: ${user.isVerified ? '✓' : '✗'}`);

    console.log('\n📊 Recent Credit Transactions:');
    if (user.creditTransactions.length === 0) {
        console.log('   No credit transactions yet');
    } else {
        user.creditTransactions.forEach((tx, i) => {
            const symbol = tx.credits > 0 ? '+' : '';
            console.log(`   ${i + 1}. ${symbol}${tx.credits} credits - ${tx.type} - ${tx.description}`);
            console.log(`      Date: ${tx.createdAt.toLocaleString()}`);
        });
    }

    console.log('\n💰 Recent Payment Transactions:');
    if (user.transactions.length === 0) {
        console.log('   No payment transactions yet');
    } else {
        user.transactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.packageName} - ₹${tx.amount / 100} - ${tx.status}`);
            console.log(`      Order ID: ${tx.razorpayOrderId}`);
            console.log(`      Date: ${tx.createdAt.toLocaleString()}`);
        });
    }

    console.log('\n✅ Check complete!\n');
}

checkCredits()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
