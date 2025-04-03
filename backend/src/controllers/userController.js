const User = require('../models/User');
const { Op } = require('sequelize');

// Get all users (with filters and pagination)
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        
        // Build filter conditions
        const filter = {};
        
        // Role filter
        if (req.query.role) {
            filter.role = req.query.role;
        }

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
            };
        }

        // Search filter
        if (req.query.search) {
            filter[Op.or] = [
                { firstName: { [Op.like]: `%${req.query.search}%` } },
                { lastName: { [Op.like]: `%${req.query.search}%` } },
                { email: { [Op.like]: `%${req.query.search}%` } },
                { companyName: { [Op.like]: `%${req.query.search}%` } }
            ];
        }

        // Industry filter (for recruiters)
        if (req.query.industry) {
            filter.industry = { [Op.like]: `%${req.query.industry}%` };
        }

        // Skills filter (for candidates)
        if (req.query.skills) {
            const skills = req.query.skills.split(',');
            filter.skills = { [Op.overlap]: skills };
        }

        const users = await User.findAndCountAll({
            where: filter,
            attributes: { 
                exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires']
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                users: users.rows,
                currentPage: page,
                totalPages: Math.ceil(users.count / limit),
                totalUsers: users.count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by ID
exports.getUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Create user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const userData = { ...req.body };

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Validate role-specific data
        if (userData.role === 'recruiter') {
            if (!userData.companyName) {
                return res.status(400).json({
                    success: false,
                    message: 'Company name is required for recruiter'
                });
            }
        }

        const user = await User.create(userData);

        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status,
                ...user.role === 'recruiter' && {
                    companyName: user.companyName,
                    companyPosition: user.companyPosition,
                    industry: user.industry
                },
                ...user.role === 'candidate' && {
                    skills: user.skills,
                    education: user.education,
                    experience: user.experience
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updateData = { ...req.body };
        delete updateData.password; // Prevent password update through this endpoint

        // Validate role-specific data if role is being changed
        if (updateData.role && updateData.role !== user.role) {
            if (updateData.role === 'recruiter' && !updateData.companyName) {
                return res.status(400).json({
                    success: false,
                    message: 'Company name is required for recruiter role'
                });
            }
        }

        await user.update(updateData);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status,
                ...user.role === 'recruiter' && {
                    companyName: user.companyName,
                    companyPosition: user.companyPosition,
                    industry: user.industry
                },
                ...user.role === 'candidate' && {
                    skills: user.skills,
                    education: user.education,
                    experience: user.experience
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!['active', 'inactive', 'banned'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User status updated successfully',
            data: {
                id: user.id,
                status: user.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.destroy();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        
        // Role distribution
        const roleStats = await User.findAll({
            attributes: ['role', [sequelize.fn('COUNT', 'role'), 'count']],
            group: ['role']
        });

        // Status distribution
        const statusStats = await User.findAll({
            attributes: ['status', [sequelize.fn('COUNT', 'status'), 'count']],
            group: ['status']
        });

        // Industry distribution (for recruiters)
        const industryStats = await User.findAll({
            where: { role: 'recruiter' },
            attributes: ['industry', [sequelize.fn('COUNT', 'industry'), 'count']],
            group: ['industry']
        });

        // Recent registrations
        const recentUsers = await User.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
        });

        const stats = {
            totalUsers,
            roleDistribution: roleStats.reduce((acc, curr) => {
                acc[curr.role] = curr.get('count');
                return acc;
            }, {}),
            statusDistribution: statusStats.reduce((acc, curr) => {
                acc[curr.status] = curr.get('count');
                return acc;
            }, {}),
            industryDistribution: industryStats.reduce((acc, curr) => {
                if (curr.industry) {
                    acc[curr.industry] = curr.get('count');
                }
                return acc;
            }, {}),
            recentUsers
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

// Bulk delete users
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of user IDs'
            });
        }

        const result = await User.destroy({
            where: {
                id: {
                    [Op.in]: userIds
                }
            }
        });

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result} users`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error performing bulk delete',
            error: error.message
        });
    }
};

// Bulk update user status
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { userIds, status } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of user IDs'
            });
        }

        if (!['active', 'inactive', 'banned'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const result = await User.update(
            { status },
            {
                where: {
                    id: {
                        [Op.in]: userIds
                    }
                }
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfully updated status for ${result[0]} users`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error performing bulk status update',
            error: error.message
        });
    }
}; 