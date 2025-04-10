const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob,
    getJobsByRecruiter,
    searchJobs
} = require('../controllers/jobController');

// Public routes
router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/:id', getJobById);

// Protected routes cho nhà tuyển dụng
router.post('/', protect, authorize('RECRUITER', 'ADMIN'), createJob);
router.get('/recruiter/jobs', protect, authorize('RECRUITER', 'ADMIN'), getJobsByRecruiter);
router.put('/:id', protect, authorize('RECRUITER', 'ADMIN'), updateJob);
router.delete('/:id', protect, authorize('RECRUITER', 'ADMIN'), deleteJob);

module.exports = router; 