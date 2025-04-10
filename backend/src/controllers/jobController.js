const Job = require('../models/Job');
const JobCategory = require('../models/JobCategory');
const User = require('../models/User');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const { Op } = require('sequelize');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

// Public routes
exports.getAllJobs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            categoryId,
            jobType,
            experienceLevel,
            location,
            minSalary,
            maxSalary,
            skills
        } = req.query;

        const whereClause = {};
        
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (categoryId) whereClause.categoryId = categoryId;
        if (jobType) whereClause.jobType = jobType;
        if (experienceLevel) whereClause.experienceLevel = experienceLevel;
        if (location) whereClause.location = { [Op.like]: `%${location}%` };
        if (minSalary) whereClause.salary = { ...whereClause.salary, [Op.gte]: Number(minSalary) };
        if (maxSalary) whereClause.salary = { ...whereClause.salary, [Op.lte]: Number(maxSalary) };
        if (skills) {
            const skillsArray = skills.split(',');
            whereClause.skills = {
                [Op.like]: skillsArray.map(skill => `%${skill}%`)
            };
        }

        const offset = (page - 1) * limit;
        
        const { rows: jobs, count: total } = await Job.findAndCountAll({
            where: whereClause,
            include: [{
                model: JobCategory,
                as: 'category',
                attributes: ['id', 'name']
            }],
            offset,
            limit: Number(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: jobs,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalJobs: total
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id, {
            include: [{
                model: JobCategory,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });

        if (!job) {
            throw new NotFoundError('Job not found');
        }

        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Candidate routes
exports.applyForJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user.id;

        const job = await Job.findByPk(jobId);
        if (!job) {
            throw new NotFoundError('Job not found');
        }

        const existingApplication = await Application.findOne({
            where: {
                jobId,
                userId
            }
        });

        if (existingApplication) {
            throw new ForbiddenError('You have already applied for this job');
        }

        const application = await Application.create({
            jobId,
            userId,
            cvUrl: req.body.cvUrl,
            coverLetter: req.body.coverLetter,
            status: 'PENDING'
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

exports.saveJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user.id;

        const job = await Job.findByPk(jobId);
        if (!job) {
            throw new NotFoundError('Job not found');
        }

        const [savedJob, created] = await SavedJob.findOrCreate({
            where: {
                jobId,
                userId
            }
        });

        if (!created) {
            throw new ForbiddenError('Job already saved');
        }

        res.status(201).json({
            success: true,
            data: savedJob
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.unsaveJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user.id;

        const result = await SavedJob.destroy({
            where: {
                jobId,
                userId
            }
        });

        if (!result) {
            throw new NotFoundError('Saved job not found');
        }

        res.status(204).send();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getSavedJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        const offset = (page - 1) * limit;

        const { rows: savedJobs, count: total } = await SavedJob.findAndCountAll({
            where: { userId },
            include: [{
                model: Job,
                as: 'job',
                include: [{
                    model: JobCategory,
                    as: 'category',
                    attributes: ['id', 'name']
                }]
            }],
            offset,
            limit: Number(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: savedJobs,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalSavedJobs: total
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Recruiter routes
exports.createJob = async (req, res) => {
    try {
        const {
            title,
            description,
            requirements,
            salary,
            location,
            employmentType,
            experienceLevel,
            deadline,
            categoryId
        } = req.body;

        const job = await Job.create({
            title,
            description,
            requirements,
            salary,
            location,
            employmentType,
            experienceLevel,
            deadline,
            categoryId,
            recruiterId: req.user.id
        });

        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findOne({
            where: {
                id,
                recruiterId: req.user.id
            }
        });

        if (!job) {
            throw new NotFoundError('Job not found');
        }

        const updatedJob = await job.update(req.body);

        res.json({
            success: true,
            data: updatedJob
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findOne({
            where: {
                id,
                recruiterId: req.user.id
            }
        });

        if (!job) {
            throw new NotFoundError('Job not found');
        }

        await Promise.all([
            job.destroy(),
            Application.destroy({ where: { jobId: id } }),
            SavedJob.destroy({ where: { jobId: id } })
        ]);

        res.status(204).send();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getJobApplications = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const job = await Job.findOne({
            where: {
                id: jobId,
                recruiterId: req.user.id
            }
        });

        if (!job) {
            throw new NotFoundError('Job not found');
        }

        const whereClause = { jobId };
        if (status) whereClause.status = status;

        const { rows: applications, count: total } = await Application.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'applicant',
                attributes: ['id', 'name', 'email']
            }],
            offset,
            limit: Number(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: applications,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalApplications: total
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id: jobId, applicationId } = req.params;
        const { status } = req.body;

        const job = await Job.findOne({
            where: {
                id: jobId,
                recruiterId: req.user.id
            }
        });

        if (!job) {
            throw new NotFoundError('Job not found');
        }

        const application = await Application.findOne({
            where: {
                id: applicationId,
                jobId
            }
        });

        if (!application) {
            throw new NotFoundError('Application not found');
        }

        await application.update({ status });

        res.json({
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

// Lấy danh sách việc làm
exports.getJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'ACTIVE' } = req.query;
        const offset = (page - 1) * limit;

        const jobs = await Job.findAndCountAll({
            where: { status },
            include: [
                {
                    model: User,
                    as: 'recruiter',
                    attributes: ['id', 'name', 'companyName', 'avatar']
                },
                {
                    model: JobCategory,
                    as: 'category'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: jobs.rows,
            pagination: {
                total: jobs.count,
                page: parseInt(page),
                totalPages: Math.ceil(jobs.count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Tìm kiếm việc làm
exports.searchJobs = async (req, res) => {
    try {
        const {
            keyword,
            location,
            categoryId,
            employmentType,
            experienceLevel,
            page = 1,
            limit = 10
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = { status: 'ACTIVE' };

        if (keyword) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
            ];
        }

        if (location) {
            whereClause.location = { [Op.like]: `%${location}%` };
        }

        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        if (employmentType) {
            whereClause.employmentType = employmentType;
        }

        if (experienceLevel) {
            whereClause.experienceLevel = experienceLevel;
        }

        const jobs = await Job.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'recruiter',
                    attributes: ['id', 'name', 'companyName', 'avatar']
                },
                {
                    model: JobCategory,
                    as: 'category'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: jobs.rows,
            pagination: {
                total: jobs.count,
                page: parseInt(page),
                totalPages: Math.ceil(jobs.count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy danh sách việc làm của nhà tuyển dụng
exports.getJobsByRecruiter = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const jobs = await Job.findAndCountAll({
            where: { recruiterId: req.user.id },
            include: [
                {
                    model: JobCategory,
                    as: 'category'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: jobs.rows,
            pagination: {
                total: jobs.count,
                page: parseInt(page),
                totalPages: Math.ceil(jobs.count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 