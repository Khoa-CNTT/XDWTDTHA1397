const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    createComment,
    getCommentsByBlogId,
    updateComment,
    deleteComment
} = require('../controllers/commentController');

// Public routes
router.get('/blog/:blogId', getCommentsByBlogId);

// Protected routes
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router; 