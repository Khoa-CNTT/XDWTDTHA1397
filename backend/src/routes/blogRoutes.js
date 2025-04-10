const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected routes
router.post('/', protect, authorize('ADMIN'), createBlog);
router.put('/:id', protect, authorize('ADMIN'), updateBlog);
router.delete('/:id', protect, authorize('ADMIN'), deleteBlog);

module.exports = router; 