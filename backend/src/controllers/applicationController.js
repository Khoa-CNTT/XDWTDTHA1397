const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Tạo đơn ứng tuyển mới
exports.createApplication = async (req, res) => {
    try {
        const { jobId, coverLetter, cvUrl } = req.body;
        const userId = req.user.id;

        const application = await Application.create({
            userId,
            jobId,
            coverLetter,
            cvUrl
        });

        // Lấy thông tin job và recruiter để gửi email
        const job = await Job.findByPk(jobId, {
            include: [{
                model: User,
                as: 'recruiter'
            }]
        });

        // Gửi email thông báo cho nhà tuyển dụng
        await sendEmail({
            to: job.recruiter.email,
            subject: `Ứng viên mới cho vị trí ${job.title}`,
            text: `Có ứng viên mới đã ứng tuyển vào vị trí ${job.title}`
        });

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách đơn ứng tuyển của ứng viên
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Job,
                as: 'job'
            }]
        });

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách đơn ứng tuyển cho nhà tuyển dụng
exports.getApplicationsForRecruiter = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { recruiterId: req.user.id }
        });

        const jobIds = jobs.map(job => job.id);

        const applications = await Application.findAll({
            where: { jobId: jobIds },
            include: [
                {
                    model: User,
                    as: 'applicant'
                },
                {
                    model: Job,
                    as: 'job'
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Cập nhật trạng thái đơn ứng tuyển
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, recruiterNotes, interviewDate } = req.body;

        const application = await Application.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'applicant'
                },
                {
                    model: Job,
                    as: 'job'
                }
            ]
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn ứng tuyển'
            });
        }

        // Cập nhật thông tin
        application.status = status;
        application.recruiterNotes = recruiterNotes;
        application.interviewDate = interviewDate;
        await application.save();

        // Gửi email thông báo cho ứng viên
        await sendEmail({
            to: application.applicant.email,
            subject: `Cập nhật trạng thái đơn ứng tuyển - ${application.job.title}`,
            text: `Đơn ứng tuyển của bạn cho vị trí ${application.job.title} đã được cập nhật sang trạng thái: ${status}`
        });

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa đơn ứng tuyển
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Application.findByPk(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn ứng tuyển'
            });
        }

        await application.destroy();

        res.status(200).json({
            success: true,
            message: 'Đã xóa đơn ứng tuyển thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 