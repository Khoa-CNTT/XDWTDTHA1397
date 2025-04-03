const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// Protected routes
router.use(protect); // All routes below this middleware will require authentication
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/changepassword', changePassword);

module.exports = router; 