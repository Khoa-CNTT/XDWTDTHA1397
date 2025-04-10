const CV = require('../models/CV');
const User = require('../models/User');

// Tạo CV mới
exports.createCV = async (req, res) => {
    try {
        const {
            title,
            education,
            experience,
            skills,
            languages,
            certificates,
            projects,
            avatar,
            pdfUrl
        } = req.body;
        const userId = req.user.id;

        // Kiểm tra số lượng CV của user
        const cvCount = await CV.count({ where: { userId } });
        const isDefault = cvCount === 0; // CV đầu tiên sẽ là mặc định

        const cv = await CV.create({
            userId,
            title,
            education,
            experience,
            skills,
            languages,
            certificates,
            projects,
            avatar,
            pdfUrl,
            isDefault
        });

        res.status(201).json({
            success: true,
            data: cv
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách CV của user
exports.getMyCVs = async (req, res) => {
    try {
        const userId = req.user.id;

        const cvs = await CV.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: cvs
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy chi tiết CV
exports.getCVById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const cv = await CV.findOne({
            where: { id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'phone', 'address']
            }]
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy CV'
            });
        }

        // Kiểm tra quyền xem CV
        if (cv.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'RECRUITER') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem CV này'
            });
        }

        res.status(200).json({
            success: true,
            data: cv
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cập nhật CV
exports.updateCV = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            education,
            experience,
            skills,
            languages,
            certificates,
            projects,
            avatar,
            pdfUrl
        } = req.body;

        const cv = await CV.findOne({
            where: { id, userId: req.user.id }
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy CV'
            });
        }

        await cv.update({
            title,
            education,
            experience,
            skills,
            languages,
            certificates,
            projects,
            avatar,
            pdfUrl
        });

        res.status(200).json({
            success: true,
            data: cv
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa CV
exports.deleteCV = async (req, res) => {
    try {
        const { id } = req.params;
        const cv = await CV.findOne({
            where: { id, userId: req.user.id }
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy CV'
            });
        }

        // Nếu xóa CV mặc định, set CV khác làm mặc định
        if (cv.isDefault) {
            const anotherCV = await CV.findOne({
                where: { userId: req.user.id, id: { [Op.ne]: id } }
            });
            if (anotherCV) {
                await anotherCV.update({ isDefault: true });
            }
        }

        await cv.destroy();

        res.status(200).json({
            success: true,
            message: 'Đã xóa CV thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Set CV mặc định
exports.setDefaultCV = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Bỏ mặc định CV hiện tại
        await CV.update(
            { isDefault: false },
            { where: { userId, isDefault: true } }
        );

        // Set CV mới làm mặc định
        const cv = await CV.findOne({
            where: { id, userId }
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy CV'
            });
        }

        await cv.update({ isDefault: true });

        res.status(200).json({
            success: true,
            data: cv
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 