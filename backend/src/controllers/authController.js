const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Register User
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            address
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in registration',
            error: error.message
        });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
        });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
        });

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findByPk(req.user.id);
        
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.id);

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

        // Create email message
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        // Send email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: `SmartHire <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Password Reset Token',
            text: message
        });

        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(500).json({
            success: false,
            message: 'Error sending reset email',
            error: error.message
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            where: {
                resetPasswordToken,
                resetPasswordExpires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
}; 