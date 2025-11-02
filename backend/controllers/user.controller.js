import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { getCreditBalance, getCreditTransactions } from "../utils/creditHelpers.js";

export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed To Fetch Users." });
    }
}


export const getUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await prisma.user.findUnique({
            where: {id}
        });
        res.status(200).json(user); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed To Fetch User." });
    }
}


export const updateUser = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const {password, avatar, ...inputs} = req.body;

    if (id !== tokenUserId) {
        return res.status(403).json({ message: "Not Authorized"});
    }

    let updatedPassword = null;

    try {

        if (password) {
            updatedPassword = await bcrypt.hash(password, 10)
        }

        const updateUser = await prisma.user.update({
            where: {id},
            data: {
                ...inputs,
                ...(updatedPassword && {password: updatedPassword}),
                ...(avatar && {avatar})
            }
        });

        const {password: userPassword, ...rest} = updateUser;
        res.status(200).json(rest);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed To Update User." });
    }
}


export const deleteUser = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    if (id !== tokenUserId) {
        return res.status(403).json({ message: "Not Authorized"});
    }

    try {
        await prisma.user.delete({
            where: {id}
        })
        res.status(200).json({ message: "User Deleted Successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed To Delete User." });
    }
}


export const savePost = async (req, res) => {
    const postId = req.body.postId;
    const tokenUserId = req.userId;

    try {
        const savedPost = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: tokenUserId,
                    postId
                }
            }
        })       
        
        if (savedPost) {
            await prisma.savedPost.delete({
                where: {
                    id: savedPost.id
                }
            });
            res.status(200).json({ message: "Post Removed From Saved List." });
        } else {
            await prisma.savedPost.create({
                data: {
                    userId: tokenUserId,
                    postId
                }
            })
            res.status(200).json({ message: "Post Saved To Saved List." });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed To Save/Remove Post." });
    }
}


export const profilePosts = async (req, res) => {
    const tokenUserId = req.userId;
    try {
      const userPosts = await prisma.post.findMany({
        where: { userId: tokenUserId },
      });
      const saved = await prisma.savedPost.findMany({
        where: { userId: tokenUserId },
        include: {
          post: true,
        },
      });
  
      const savedPosts = saved.map((item) => item.post);
      res.status(200).json({ userPosts, savedPosts });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to get profile posts!" });
    }
};


export const getNotificationNumber = async (req, res) => {
    const tokenUserId = req.userId;
    try {
      const number = await prisma.chat.count({
        where: {
          userIDs: {
            hasSome: [tokenUserId],
          },
          NOT: {
            seenBy: {
              hasSome: [tokenUserId],
            },
          },
        },
      });
      res.status(200).json(number);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to get profile posts!" });
    }
};


export const getUserCredits = async (req, res) => {
    const tokenUserId = req.userId;
    try {
        const balance = await getCreditBalance(tokenUserId);
        res.status(200).json({ credits: balance });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get credit balance!" });
    }
};


export const getUserCreditTransactions = async (req, res) => {
    const tokenUserId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    try {
        const { transactions, total } = await getCreditTransactions(
            tokenUserId,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get credit transactions!" });
    }
};