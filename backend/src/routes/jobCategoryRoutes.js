const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    getCategories,
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    updateOrder,
    getCategoryStats
} = require('../controllers/jobCategoryController');

// Public routes
router.get('/', getCategories); // Get tree structure
router.get('/list', getAllCategories); // Get flat structure with pagination
router.get('/:id', getCategory);

// Protected routes (admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.put('/order/bulk', updateOrder);
router.get('/stats/overview', getCategoryStats);

module.exports = router; 