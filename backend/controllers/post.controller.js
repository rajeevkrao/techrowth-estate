import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { checkCredits, deductCredits, refundCredits } from "../utils/creditHelpers.js";

export const getPosts = async (req, res) => {
    const query = req.query;

    try {
        const {
            city,
            type,
            property,
            bedroom,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status = 'ACTIVE'
        } = query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {
            status: status || 'ACTIVE', // Default to only show active posts
            ...(city && { city }),
            ...(type && { type }),
            ...(property && { property }),
            ...(bedroom && { bedroom: parseInt(bedroom) }),
            ...(minPrice || maxPrice ? {
                price: {
                    ...(minPrice && { gte: parseInt(minPrice) }),
                    ...(maxPrice && { lte: parseInt(maxPrice) })
                }
            } : {})
        };

        // Build orderBy clause
        const orderBy = {};
        if (sortBy === 'price') {
            orderBy.price = sortOrder;
        } else if (sortBy === 'viewCount') {
            orderBy.viewCount = sortOrder;
        } else {
            orderBy.createdAt = sortOrder;
        }

        // Fetch posts with pagination
        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    user: {
                        select: {
                            username: true,
                            avatar: true
                        }
                    }
                },
                orderBy: [
                    { isFeatured: 'desc' }, // Featured posts first
                    orderBy
                ],
                skip,
                take: parseInt(limit)
            }),
            prisma.post.count({ where })
        ]);

        res.status(200).json({
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to Fetch Posts." });
    }
}

export const getPost = async (req, res) => {
    const id = req.params.id;
    try {
        // Increment view count
        const post = await prisma.post.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1
                }
            },
            include: {
                postDetail: true,
                user: {
                    select: {
                        username: true,
                        avatar: true,
                    },
                },
            },
        });

        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
                if (!err) {
                    const saved = await prisma.savedPost.findUnique({
                        where: {
                            userId_postId: {
                                postId: id,
                                userId: payload.id,
                            },
                        },
                    });
                    return res.status(200).json({ ...post, isSaved: saved ? true : false });
                }
                // If there's an error in token verification, return a default response
                return res.status(200).json({ ...post, isSaved: false });
            });
        } else {
            // No token provided, return a default response
            res.status(200).json({ ...post, isSaved: false });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to Fetch Post." });
    }
};

export const addPost = async (req, res) => {
    const body = req.body;
    const tokenUserId = req.userId;
    const { publish = false } = body; // Check if user wants to publish immediately

    try {
        // If publishing, check and deduct credits
        if (publish) {
            const { hasCredits, currentBalance } = await checkCredits(tokenUserId, 1);

            if (!hasCredits) {
                return res.status(400).json({
                    message: "Insufficient credits. Please purchase credits to publish property.",
                    currentBalance
                });
            }
        }

        // Calculate expiration date (30 days from now)
        const expiresAt = publish ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

        // Create the post
        const newPost = await prisma.post.create({
            data: {
                ...body.postData,
                userId: tokenUserId,
                status: publish ? 'ACTIVE' : 'DRAFT',
                expiresAt,
                postDetail: {
                    create: body.postDetail
                }
            }
        });

        // Deduct credits if publishing
        if (publish) {
            const { newBalance } = await deductCredits(
                tokenUserId,
                1,
                `Published property: ${newPost.title}`,
                newPost.id
            );

            return res.status(200).json({
                post: newPost,
                message: "Property published successfully!",
                creditsRemaining: newBalance
            });
        }

        res.status(200).json({
            post: newPost,
            message: "Property saved as draft. Publish it when you're ready!"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to Create Post." });
    }
}

export const updatePost = async (req, res) => {
    const id = req.params.id;
    const { formData } = req.body; // Extract formData from the request body

    console.log({ formData: req.body });

    if (!formData) {
        return res.status(400).json({ message: "Invalid request format." });
    }

    const {
        title,
        price,
        address,
        city,
        bedroom,
        bathroom,
        type,
        property,
        postDetail: { desc },
    } = formData;

    try {
        // Validate and parse incoming data
        if (
            !title ||
            !price ||
            !address ||
            !city ||
            !bedroom ||
            !bathroom ||
            !type ||
            !property ||
            !desc
        ) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Upsert postDetail first, assuming postId is unique in PostDetail schema
        const postDetailUpsert = await prisma.postDetail.upsert({
            where: { postId: id },  // Requires @unique([postId]) in schema
            update: { desc },
            create: { 
                desc,
                post: { connect: { id } }  // Link to post
            },
        });

        // Update post and connect the postDetail
        const updatedPost = await prisma.$transaction(async (tx) => {
            return tx.post.update({
                where: { id },
                data: {
                    title,
                    price: parseInt(price),
                    address,
                    city,
                    bedroom: parseInt(bedroom),
                    bathroom: parseInt(bathroom),
                    type,
                    property,
                    postDetail: { connect: { id: postDetailUpsert.id } },
                },
                include: { postDetail: true },  // Optional: Include to return updated detail
            });
        });

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).json({ message: "Failed to update post.", error: err.message });
    }
};


export const deletePost = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: { postDetail: true }, // Include postDetail to delete it
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId !== tokenUserId) {
            return res.status(403).json({ message: "Not Authorized" });
        }

        // Refund credit if post was active and not expired
        let refunded = false;
        if (post.status === 'ACTIVE' && post.expiresAt && new Date(post.expiresAt) > new Date()) {
            try {
                await refundCredits(
                    tokenUserId,
                    1,
                    `Refund for deleted property: ${post.title}`,
                    post.id
                );
                refunded = true;
            } catch (refundError) {
                console.error("Refund failed:", refundError);
                // Continue with deletion even if refund fails
            }
        }

        // Delete the associated PostDetail if it exists
        if (post.postDetail) {
            await prisma.postDetail.delete({
                where: { id: post.postDetail.id },
            });
        }

        // Delete the Post
        await prisma.post.delete({
            where: { id },
        });

        res.status(200).json({
            message: "Post deleted successfully!",
            refunded
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete post." });
    }
};


// Publish a draft post
export const publishDraft = async (req, res) => {
    const { id } = req.params;
    const tokenUserId = req.userId;

    try {
        // Find the post
        const post = await prisma.post.findUnique({
            where: { id }
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId !== tokenUserId) {
            return res.status(403).json({ message: "Not Authorized" });
        }

        if (post.status !== 'DRAFT') {
            return res.status(400).json({ message: "Post is not a draft" });
        }

        // Check credits
        const { hasCredits, currentBalance } = await checkCredits(tokenUserId, 1);

        if (!hasCredits) {
            return res.status(400).json({
                message: "Insufficient credits. Please purchase credits to publish property.",
                currentBalance
            });
        }

        // Calculate expiration date (30 days from now)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update post status
        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                expiresAt
            }
        });

        // Deduct credits
        const { newBalance } = await deductCredits(
            tokenUserId,
            1,
            `Published property: ${updatedPost.title}`,
            updatedPost.id
        );

        res.status(200).json({
            post: updatedPost,
            message: "Property published successfully!",
            creditsRemaining: newBalance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to publish post." });
    }
};


// Renew an expired post
export const renewPost = async (req, res) => {
    const { id } = req.params;
    const tokenUserId = req.userId;

    try {
        // Find the post
        const post = await prisma.post.findUnique({
            where: { id }
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId !== tokenUserId) {
            return res.status(403).json({ message: "Not Authorized" });
        }

        if (post.status !== 'EXPIRED') {
            return res.status(400).json({ message: "Post is not expired" });
        }

        // Check credits
        const { hasCredits, currentBalance } = await checkCredits(tokenUserId, 1);

        if (!hasCredits) {
            return res.status(400).json({
                message: "Insufficient credits. Please purchase credits to renew property.",
                currentBalance
            });
        }

        // Calculate new expiration date (30 days from now)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update post status
        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                expiresAt
            }
        });

        // Deduct credits
        const { newBalance } = await deductCredits(
            tokenUserId,
            1,
            `Renewed property: ${updatedPost.title}`,
            updatedPost.id
        );

        res.status(200).json({
            post: updatedPost,
            message: "Property renewed successfully!",
            creditsRemaining: newBalance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to renew post." });
    }
};


// Get similar properties based on city, type, and property
export const getSimilarPosts = async (req, res) => {
    const { id } = req.params;

    try {
        // Get the current post
        const currentPost = await prisma.post.findUnique({
            where: { id }
        });

        if (!currentPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find similar posts
        const similarPosts = await prisma.post.findMany({
            where: {
                AND: [
                    { id: { not: id } }, // Exclude current post
                    { status: 'ACTIVE' }, // Only active posts
                    {
                        OR: [
                            { city: currentPost.city },
                            { type: currentPost.type },
                            { property: currentPost.property }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        username: true,
                        avatar: true
                    }
                }
            },
            take: 4,
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(similarPosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch similar posts." });
    }
};