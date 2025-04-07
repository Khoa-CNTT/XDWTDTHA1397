const JobCategory = require('../models/JobCategory');
const { Op } = require('sequelize');

// Get all categories with tree structure
exports.getCategories = async (req, res) => {
    try {
        const categories = await JobCategory.findAll({
            where: {
                parentId: null // Get root categories
            },
            include: [{
                model: JobCategory,
                as: 'children',
                include: {
                    model: JobCategory,
                    as: 'children'
                }
            }],
            order: [
                ['order', 'ASC'],
                ['name', 'ASC'],
                [{ model: JobCategory, as: 'children' }, 'order', 'ASC'],
                [{ model: JobCategory, as: 'children' }, 'name', 'ASC'],
                [{ model: JobCategory, as: 'children' }, { model: JobCategory, as: 'children' }, 'order', 'ASC'],
                [{ model: JobCategory, as: 'children' }, { model: JobCategory, as: 'children' }, 'name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get all categories (flat structure with filters and pagination)
exports.getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Build filter conditions
        const filter = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.search) {
            filter[Op.or] = [
                { name: { [Op.like]: `%${req.query.search}%` } },
                { description: { [Op.like]: `%${req.query.search}%` } }
            ];
        }

        if (req.query.parentId) {
            filter.parentId = req.query.parentId;
        }

        const categories = await JobCategory.findAndCountAll({
            where: filter,
            limit,
            offset,
            order: [
                ['order', 'ASC'],
                ['name', 'ASC']
            ],
            include: [{
                model: JobCategory,
                as: 'parent',
                attributes: ['id', 'name']
            }]
        });

        res.status(200).json({
            success: true,
            data: {
                categories: categories.rows,
                currentPage: page,
                totalPages: Math.ceil(categories.count / limit),
                totalCategories: categories.count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get single category
exports.getCategory = async (req, res) => {
    try {
        const category = await JobCategory.findByPk(req.params.id, {
            include: [
                {
                    model: JobCategory,
                    as: 'parent',
                    attributes: ['id', 'name']
                },
                {
                    model: JobCategory,
                    as: 'children',
                    attributes: ['id', 'name', 'totalJobs']
                }
            ]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const categoryData = { ...req.body };

        // If parent category is specified, validate and set level
        if (categoryData.parentId) {
            const parentCategory = await JobCategory.findByPk(categoryData.parentId);
            if (!parentCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent category not found'
                });
            }
            categoryData.level = parentCategory.level + 1;
        }

        const category = await JobCategory.create(categoryData);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const category = await JobCategory.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updateData = { ...req.body };

        // If parent category is being changed
        if (updateData.parentId !== undefined && updateData.parentId !== category.parentId) {
            // Prevent setting parent to self
            if (updateData.parentId === category.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Category cannot be its own parent'
                });
            }

            // If parent is being set (not removed)
            if (updateData.parentId) {
                const parentCategory = await JobCategory.findByPk(updateData.parentId);
                if (!parentCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Parent category not found'
                    });
                }
                updateData.level = parentCategory.level + 1;
            } else {
                updateData.level = 1;
            }
        }

        await category.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await JobCategory.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has children
        const childrenCount = await JobCategory.count({
            where: { parentId: category.id }
        });

        if (childrenCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with subcategories. Please delete subcategories first.'
            });
        }

        await category.destroy();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

// Update category order
exports.updateOrder = async (req, res) => {
    try {
        const { categories } = req.body;

        if (!Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of categories with their new orders'
            });
        }

        // Update orders in transaction
        await sequelize.transaction(async (t) => {
            for (const item of categories) {
                await JobCategory.update(
                    { order: item.order },
                    { 
                        where: { id: item.id },
                        transaction: t
                    }
                );
            }
        });

        res.status(200).json({
            success: true,
            message: 'Category orders updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category orders',
            error: error.message
        });
    }
};

// Get category statistics
exports.getCategoryStats = async (req, res) => {
    try {
        const totalCategories = await JobCategory.count();
        
        const levelDistribution = await JobCategory.findAll({
            attributes: ['level', [sequelize.fn('COUNT', 'level'), 'count']],
            group: ['level']
        });

        const topCategories = await JobCategory.findAll({
            order: [['totalJobs', 'DESC']],
            limit: 10,
            attributes: ['id', 'name', 'totalJobs']
        });

        const stats = {
            totalCategories,
            levelDistribution: levelDistribution.reduce((acc, curr) => {
                acc[`Level ${curr.level}`] = curr.get('count');
                return acc;
            }, {}),
            topCategories
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category statistics',
            error: error.message
        });
    }
}; 