import express from 'express';
import {verifyToken} from '../middleware/verifyToken.js';
import {
    addPost,
    deletePost,
    getPost,
    getPosts,
    updatePost,
    publishDraft,
    renewPost,
    getSimilarPosts
} from '../controllers/post.controller.js';

const router = express.Router();

router.get("/", getPosts);
router.get("/:id", getPost);
router.get("/:id/similar", getSimilarPosts);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.put("/:id/publish", verifyToken, publishDraft);
router.put("/:id/renew", verifyToken, renewPost);
router.delete("/:id", verifyToken, deletePost);

export default router;