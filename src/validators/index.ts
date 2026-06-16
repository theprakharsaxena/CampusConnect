import { body, param, query } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'hod', 'alumni', 'admin'])
    .withMessage('Invalid role'),
  body('department').optional().trim(),
  body('batch').optional().trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const sendVerificationCodeValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export const verifyEmailCodeValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .matches(/^\d+$/)
    .withMessage('Verification code must be numeric'),
];

export const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty(),
  body('bio').optional().isLength({ max: 500 }),
  body('department').optional().trim(),
  body('batch').optional().trim(),
  body('linkedinUrl').optional().isURL(),
  body('githubUrl').optional().isURL(),
  body('company').optional().trim(),
  body('designation').optional().trim(),
  body('skills').optional().isArray(),
];

export const manageUserValidator = [
  body('name').optional().trim().notEmpty(),
  body('bio').optional().isLength({ max: 500 }),
  body('department').optional().trim(),
  body('batch').optional().trim(),
  body('linkedinUrl').optional().isURL(),
  body('githubUrl').optional().isURL(),
  body('company').optional().trim(),
  body('designation').optional().trim(),
  body('skills').optional().isArray(),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'hod', 'alumni', 'admin'])
    .withMessage('Invalid role'),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const userSearchValidator = [
  ...paginationValidator,
  query('search').optional().trim(),
  query('role')
    .optional()
    .isIn(['student', 'teacher', 'hod', 'alumni', 'admin']),
  query('department').optional().trim(),
  query('batch').optional().trim(),
  query('skills').optional(),
];

export const createPostValidator = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('tags')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (_) {
          return value.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
      return value;
    })
    .isArray()
    .withMessage('Tags must be an array'),
];

export const updatePostValidator = [
  param('id').isMongoId().withMessage('Invalid post ID'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('tags')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (_) {
          return value.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
      return value;
    })
    .isArray()
    .withMessage('Tags must be an array'),
];

export const createCommentValidator = [
  param('postId').isMongoId().withMessage('Invalid post ID'),
  body('content').trim().notEmpty().withMessage('Content is required'),
];

export const mongoIdValidator = [
  param('id').isMongoId().withMessage('Invalid ID'),
];

export const connectionRequestValidator = [
  body('receiverId').isMongoId().withMessage('Invalid receiver ID'),
];

export const createOpportunityValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('type')
    .isIn(['internship', 'job', 'referral', 'hackathon', 'event'])
    .withMessage('Invalid opportunity type'),
  body('skills').optional().isArray(),
  body('applyLink').optional().isURL(),
  body('deadline').optional().isISO8601(),
];

export const opportunitySearchValidator = [
  ...paginationValidator,
  query('search').optional().trim(),
  query('type')
    .optional()
    .isIn(['internship', 'job', 'referral', 'hackathon', 'event']),
  query('company').optional().trim(),
  query('skills').optional(),
];

export const createEventValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
];

export const rsvpValidator = [
  param('id').isMongoId().withMessage('Invalid event ID'),
  body('status')
    .isIn(['interested', 'going'])
    .withMessage('Status must be interested or going'),
];

export const createConversationValidator = [
  body('participantId').isMongoId().withMessage('Invalid participant ID'),
];

export const sendMessageValidator = [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('text').trim().notEmpty().withMessage('Message text is required'),
  body('attachments').optional().isArray(),
];

export const conversationIdParamValidator = [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
];

export const feedValidator = [
  ...paginationValidator,
  query('sort').optional().isIn(['latest', 'trending']),
];
