const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
    updateUserStatus,
    bulkDeleteUsers,
    bulkUpdateStatus
} = require('../controllers/userController');

// Protect all routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));

// User management routes
router.route('/')
    .get(getUsers)
    .post(createUser);

// Statistics route
router.get('/stats', getUserStats);

// Bulk operations
router.post('/bulk-delete', bulkDeleteUsers);
router.put('/bulk-status', bulkUpdateStatus);

// Individual user operations
router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

// User status update
router.put('/:id/status', updateUserStatus);

module.exports = router; 