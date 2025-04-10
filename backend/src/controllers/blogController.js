const Blog = require('../models/Blog');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Tạo bài viết mới
exports.createBlog = async (req, res) => {
    try {
        const { title, content, thumbnail, tags, status } = req.body;
        const authorId = req.user.id;

        const blog = await Blog.create({
            title,
            content,
            thumbnail,
            tags,
            status,
            authorId
        });

        res.status(201).json({
            success: true,
            data: blog
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách bài viết
exports.getBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'PUBLISHED' } = req.query;
        const offset = (page - 1) * limit;

        const blogs = await Blog.findAndCountAll({
            where: { status },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'avatar']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: blogs.rows,
            pagination: {
                total: blogs.count,
                page: parseInt(page),
                totalPages: Math.ceil(blogs.count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy chi tiết bài viết
exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Comment,
                    as: 'comments',
                    where: { status: 'ACTIVE' },
                    required: false,
                    include: [{
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    }]
                }
            ]
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Tăng lượt xem
        blog.viewCount += 1;
        await blog.save();

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cập nhật bài viết
exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, thumbnail, tags, status } = req.body;

        const blog = await Blog.findByPk(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Kiểm tra quyền
        if (blog.authorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật bài viết này'
            });
        }

        // Cập nhật thông tin
        await blog.update({
            title,
            content,
            thumbnail,
            tags,
            status
        });

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa bài viết
exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Kiểm tra quyền
        if (blog.authorId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bài viết này'
            });
        }

        await blog.destroy();

        res.status(200).json({
            success: true,
            message: 'Đã xóa bài viết thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 