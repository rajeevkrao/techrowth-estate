import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting complete database seeding...');

    // 1. Seed Credit Packages
    console.log('\n1. Seeding Credit Packages...');
    const packages = [
        {
            name: 'Basic',
            price: 50000, // ₹500 in paise
            credits: 10,
            description: 'Perfect for individual sellers. List up to 10 properties.',
            isActive: true
        },
        {
            name: 'Pro',
            price: 100000, // ₹1000 in paise
            credits: 25,
            description: 'Great for small agencies. List up to 25 properties with 20% savings.',
            isActive: true
        },
        {
            name: 'Premium',
            price: 200000, // ₹2000 in paise
            credits: 50,
            description: 'Best value for large agencies. List up to 50 properties with maximum savings.',
            isActive: true
        }
    ];

    for (const pkg of packages) {
        await prisma.creditPackage.upsert({
            where: { name: pkg.name },
            update: pkg,
            create: pkg
        });
    }
    console.log('✓ Credit packages created');

    // 2. Update existing user or create test users with credits
    console.log('\n2. Updating/Creating users...');

    // Find user pmdnawaz1
    const existingUser = await prisma.user.findUnique({
        where: { username: 'pmdnawaz1' }
    });

    if (existingUser) {
        // Update existing user with 50 credits for testing
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                credits: 50,
                role: 'ADMIN', // Make admin for testing
                isVerified: true
            }
        });
        console.log(`✓ Updated user pmdnawaz1 with 50 credits and ADMIN role`);

        // Create a credit transaction record
        await prisma.creditTransaction.create({
            data: {
                userId: existingUser.id,
                credits: 50,
                type: 'PURCHASE',
                description: 'Initial seed credits for testing'
            }
        });
    } else {
        console.log('✗ User pmdnawaz1 not found - please register first');
    }

    // 3. Create sample users
    console.log('\n3. Creating sample users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const sampleUsers = [
        {
            username: 'john_agent',
            email: 'john@example.com',
            password: hashedPassword,
            credits: 25,
            role: 'AGENT',
            isVerified: true,
            avatar: '/noavatar.jpg'
        },
        {
            username: 'sarah_seller',
            email: 'sarah@example.com',
            password: hashedPassword,
            credits: 10,
            role: 'USER',
            isVerified: true,
            avatar: '/noavatar.jpg'
        },
        {
            username: 'mike_owner',
            email: 'mike@example.com',
            password: hashedPassword,
            credits: 15,
            role: 'USER',
            isVerified: true,
            avatar: '/noavatar.jpg'
        }
    ];

    const createdUsers = [];
    for (const user of sampleUsers) {
        try {
            const created = await prisma.user.upsert({
                where: { email: user.email },
                update: { credits: user.credits },
                create: user
            });
            createdUsers.push(created);
            console.log(`✓ Created/Updated user: ${user.username}`);
        } catch (error) {
            console.log(`✗ User ${user.username} already exists`);
        }
    }

    // 4. Create sample properties with different statuses
    console.log('\n4. Creating sample properties...');

    const allUsers = await prisma.user.findMany();

    if (allUsers.length === 0) {
        console.log('✗ No users found to create properties');
        return;
    }

    const sampleProperties = [
        // ACTIVE properties
        {
            title: 'Luxury Villa in Whitefield',
            price: 25000000,
            images: ['/house1.jpg', '/house2.jpg', '/house3.jpg'],
            address: 'Whitefield, Bangalore',
            city: 'Bangalore',
            bedroom: 4,
            bathroom: 3,
            latitude: '12.9698',
            longitude: '77.7500',
            type: 'buy',
            property: 'house',
            status: 'ACTIVE',
            isFeatured: true,
            viewCount: 45,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            userId: allUsers[0].id,
            postDetail: {
                desc: '<p>Beautiful luxury villa with modern amenities, spacious garden, and excellent connectivity. Perfect for families looking for a peaceful yet well-connected location.</p>',
                utilities: 'owner',
                pet: 'allowed',
                income: '₹50,000/month minimum',
                size: 2500,
                school: 1200,
                bus: 300,
                restaurant: 500
            }
        },
        {
            title: '2BHK Apartment in Koramangala',
            price: 8500000,
            images: ['/house2.jpg', '/house3.jpg'],
            address: 'Koramangala, Bangalore',
            city: 'Bangalore',
            bedroom: 2,
            bathroom: 2,
            latitude: '12.9352',
            longitude: '77.6245',
            type: 'buy',
            property: 'apartment',
            status: 'ACTIVE',
            isFeatured: false,
            viewCount: 23,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId: allUsers[Math.min(1, allUsers.length - 1)].id,
            postDetail: {
                desc: '<p>Modern 2BHK apartment in prime location. Close to tech parks, restaurants, and shopping centers.</p>',
                utilities: 'renter',
                pet: 'not allowed',
                income: '₹30,000/month minimum',
                size: 1200,
                school: 800,
                bus: 200,
                restaurant: 150
            }
        },
        {
            title: 'Commercial Space in MG Road',
            price: 15000000,
            images: ['/house3.jpg'],
            address: 'MG Road, Bangalore',
            city: 'Bangalore',
            bedroom: 0,
            bathroom: 2,
            latitude: '12.9716',
            longitude: '77.5946',
            type: 'rent',
            property: 'condo',
            status: 'ACTIVE',
            isFeatured: true,
            viewCount: 67,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId: allUsers[Math.min(2, allUsers.length - 1)].id,
            postDetail: {
                desc: '<p>Prime commercial space in the heart of Bangalore. High footfall area, perfect for retail or office.</p>',
                utilities: 'owner',
                pet: 'not allowed',
                income: 'No income requirement',
                size: 1800,
                school: 2000,
                bus: 100,
                restaurant: 50
            }
        },
        // DRAFT properties
        {
            title: '3BHK House in HSR Layout',
            price: 12000000,
            images: ['/house1.jpg'],
            address: 'HSR Layout, Bangalore',
            city: 'Bangalore',
            bedroom: 3,
            bathroom: 2,
            latitude: '12.9121',
            longitude: '77.6446',
            type: 'buy',
            property: 'house',
            status: 'DRAFT',
            isFeatured: false,
            viewCount: 0,
            userId: allUsers[0].id,
            postDetail: {
                desc: '<p>Spacious 3BHK house with parking. Needs some renovation work.</p>',
                utilities: 'owner',
                pet: 'allowed',
                income: '₹40,000/month minimum',
                size: 1600,
                school: 600,
                bus: 400,
                restaurant: 300
            }
        },
        // EXPIRED property
        {
            title: 'Studio Apartment in Indiranagar',
            price: 4500000,
            images: ['/house2.jpg'],
            address: 'Indiranagar, Bangalore',
            city: 'Bangalore',
            bedroom: 1,
            bathroom: 1,
            latitude: '12.9719',
            longitude: '77.6412',
            type: 'rent',
            property: 'apartment',
            status: 'EXPIRED',
            isFeatured: false,
            viewCount: 12,
            expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            userId: allUsers[Math.min(1, allUsers.length - 1)].id,
            postDetail: {
                desc: '<p>Cozy studio apartment, perfect for singles or couples.</p>',
                utilities: 'renter',
                pet: 'allowed',
                income: '₹25,000/month minimum',
                size: 600,
                school: 1000,
                bus: 250,
                restaurant: 200
            }
        },
        // More ACTIVE properties for pagination testing
        {
            title: 'Penthouse in Jayanagar',
            price: 35000000,
            images: ['/house1.jpg', '/house2.jpg'],
            address: 'Jayanagar, Bangalore',
            city: 'Bangalore',
            bedroom: 5,
            bathroom: 4,
            latitude: '12.9250',
            longitude: '77.5838',
            type: 'buy',
            property: 'apartment',
            status: 'ACTIVE',
            isFeatured: true,
            viewCount: 89,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId: allUsers[Math.min(2, allUsers.length - 1)].id,
            postDetail: {
                desc: '<p>Ultra-luxury penthouse with panoramic city views. Premium fixtures and fittings throughout.</p>',
                utilities: 'owner',
                pet: 'allowed',
                income: '₹1,00,000/month minimum',
                size: 3500,
                school: 1500,
                bus: 500,
                restaurant: 300
            }
        }
    ];

    for (const property of sampleProperties) {
        const { postDetail, ...postData } = property;

        try {
            const post = await prisma.post.create({
                data: {
                    ...postData,
                    postDetail: {
                        create: postDetail
                    }
                }
            });
            console.log(`✓ Created property: ${property.title} (${property.status})`);
        } catch (error) {
            console.log(`✗ Error creating property ${property.title}:`, error.message);
        }
    }

    // 5. Summary
    console.log('\n📊 Seeding Summary:');
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const activeCount = await prisma.post.count({ where: { status: 'ACTIVE' } });
    const draftCount = await prisma.post.count({ where: { status: 'DRAFT' } });
    const expiredCount = await prisma.post.count({ where: { status: 'EXPIRED' } });
    const packageCount = await prisma.creditPackage.count();

    console.log(`✓ Total Users: ${userCount}`);
    console.log(`✓ Total Properties: ${postCount}`);
    console.log(`  - Active: ${activeCount}`);
    console.log(`  - Draft: ${draftCount}`);
    console.log(`  - Expired: ${expiredCount}`);
    console.log(`✓ Credit Packages: ${packageCount}`);

    // Display user credentials
    console.log('\n🔐 Test User Credentials:');
    console.log('Username: pmdnawaz1 (ADMIN) - 50 credits');
    console.log('Username: john_agent (AGENT) - 25 credits');
    console.log('Username: sarah_seller (USER) - 10 credits');
    console.log('Username: mike_owner (USER) - 15 credits');
    console.log('Password for all test users: password123');

    console.log('\n✅ Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
