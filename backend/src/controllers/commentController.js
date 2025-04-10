const Comment = require('../models/Comment');
const User = require('../models/User');

// Tạo bình luận mới
exports.createComment = async (req, res) => {
    try {
        const { content, blogId, parentId } = req.body;
        const userId = req.user.id;

        const comment = await Comment.create({
            content,
            blogId,
            userId,
            parentId
        });

        const commentWithUser = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'avatar']
            }]
        });

        res.status(201).json({
            success: true,
            data: commentWithUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách bình luận của bài viết
exports.getCommentsByBlogId = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const comments = await Comment.findAndCountAll({
            where: {
                blogId,
                parentId: null,
                status: 'ACTIVE'
            },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Comment,
                    as: 'replies',
                    where: { status: 'ACTIVE' },
                    required: false,
                    include: [{
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'avatar']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: comments.rows,
            pagination: {
                total: comments.count,
                page: parseInt(page),
                totalPages: Math.ceil(comments.count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cập nhật bình luận
exports.updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const comment = await Comment.findByPk(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }

        // Kiểm tra quyền
        if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật bình luận này'
            });
        }

        await comment.update({ content });

        const updatedComment = await Comment.findByPk(id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'avatar']
            }]
        });

        res.status(200).json({
            success: true,
            data: updatedComment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa bình luận (soft delete)
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await Comment.findByPk(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }

        // Kiểm tra quyền
        if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bình luận này'
            });
        }

        await comment.update({ status: 'DELETED' });

        res.status(200).json({
            success: true,
            message: 'Đã xóa bình luận thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 