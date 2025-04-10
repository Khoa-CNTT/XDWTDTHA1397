const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateJob = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('requirements').isArray().withMessage('Requirements must be an array'),
  body('responsibilities').isArray().withMessage('Responsibilities must be an array'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship'])
    .withMessage('Invalid job type'),
  body('experienceLevel').isIn(['entry', 'intermediate', 'senior', 'lead'])
    .withMessage('Invalid experience level'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number')
    .custom((value, { req }) => {
      if (value < req.body.salary.min) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),
  body('skills').isArray().withMessage('Skills must be an array')
    .custom(skills => skills.length > 0).withMessage('At least one skill is required'),
  handleValidationErrors
];

const validateJobApplication = [
  body('resume').trim().notEmpty().withMessage('Resume link is required'),
  body('coverLetter').trim().notEmpty().withMessage('Cover letter is required'),
  handleValidationErrors
];

module.exports = {
  validateJob,
  validateJobApplication
}; 