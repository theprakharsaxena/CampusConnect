import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';
import { authPaths } from '../docs/auth.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampusConnect API',
      version: '1.0.0',
      description:
        'Private social networking platform for colleges - API documentation',
      contact: {
        name: 'CampusConnect Support',
      },
    },
    servers: [
      {
        url: config.apiBaseUrl,
        description: config.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    paths: {
      ...authPaths,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice.williams@student.campusconnect.edu' },
            password: { type: 'string', format: 'password', example: 'Student@123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Test Student' },
            email: { type: 'string', format: 'email', example: 'test@student.campusconnect.edu' },
            password: { type: 'string', minLength: 8, example: 'Student@123' },
            role: { type: 'string', enum: ['student', 'teacher', 'hod', 'alumni', 'developer'] },
            department: { type: 'string', example: 'Computer Science' },
            batch: { type: 'string', example: '2025' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'hod', 'alumni', 'developer'],
            },
            department: { type: 'string' },
            batch: { type: 'string' },
            bio: { type: 'string' },
            profileImage: { type: 'string' },
            linkedinUrl: { type: 'string' },
            githubUrl: { type: 'string' },
            company: { type: 'string' },
            designation: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            isVerified: { type: 'boolean' },
            isBlocked: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            author: { $ref: '#/components/schemas/User' },
            content: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'integer' },
            commentsCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
