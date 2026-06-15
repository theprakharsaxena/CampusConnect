export const authPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
            example: {
              name: 'Test Student',
              email: 'test@student.campusconnect.edu',
              password: 'Student@123',
              role: 'student',
              department: 'Computer Science',
              batch: '2025',
            },
          },
        },
      },
      responses: {
        '201': { description: 'User registered successfully' },
        '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        '409': { description: 'Email already registered' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login user',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            example: {
              email: 'alice.williams@student.campusconnect.edu',
              password: 'Student@123',
            },
          },
        },
      },
      responses: {
        '200': { description: 'Login successful' },
        '401': { description: 'Invalid email or password' },
      },
    },
  },
  '/auth/refresh-token': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
          },
        },
      },
      responses: {
        '200': { description: 'Token refreshed' },
        '401': { description: 'Invalid refresh token' },
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'alice.williams@student.campusconnect.edu' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Reset email sent if account exists' },
      },
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password with token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: { type: 'string' },
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Password reset successful' },
        '400': { description: 'Invalid or expired token' },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout user',
      responses: {
        '200': { description: 'Logged out successfully' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/auth/change-password': {
    post: {
      tags: ['Auth'],
      summary: 'Change password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Password changed successfully' },
        '400': { description: 'Current password incorrect' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user',
      responses: {
        '200': {
          description: 'Current user profile',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
