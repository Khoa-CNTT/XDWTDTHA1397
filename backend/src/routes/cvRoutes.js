const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
    createCV,
    getMyCVs,
    getCVById,
    updateCV,
    deleteCV,
    setDefaultCV
} = require('../controllers/cvController');

// Routes cho user
router.post('/', protect, createCV);
router.get('/my-cvs', protect, getMyCVs);
router.get('/:id', protect, getCVById);
router.put('/:id', protect, updateCV);
router.delete('/:id', protect, deleteCV);
router.patch('/:id/set-default', protect, setDefaultCV);

module.exports = router; 