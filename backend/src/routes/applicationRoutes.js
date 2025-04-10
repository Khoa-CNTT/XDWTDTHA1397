const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    createApplication,
    getMyApplications,
    getApplicationsForRecruiter,
    updateApplicationStatus,
    deleteApplication
} = require('../controllers/applicationController');

// Các routes cho ứng viên
router.post('/', protect, createApplication);
router.get('/my-applications', protect, getMyApplications);
router.delete('/:id', protect, deleteApplication);

// Các routes cho nhà tuyển dụng
router.get('/recruiter', protect, authorize('RECRUITER', 'ADMIN'), getApplicationsForRecruiter);
router.patch('/:id/status', protect, authorize('RECRUITER', 'ADMIN'), updateApplicationStatus);

module.exports = router; 