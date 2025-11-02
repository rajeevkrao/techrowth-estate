import express from 'express';
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    savePost,
    profilePosts,
    getNotificationNumber,
    getUserCredits,
    getUserCreditTransactions
} from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/", getUsers);
// router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
router.post("/save", verifyToken, savePost);
router.get("/profilePosts", verifyToken, profilePosts);
router.get("/notification", verifyToken, getNotificationNumber);
router.get("/credits", verifyToken, getUserCredits);
router.get("/credit-transactions", verifyToken, getUserCreditTransactions);

export default router;