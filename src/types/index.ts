import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'hod' | 'alumni' | 'developer';

export type ContentStatus = 'pending' | 'approved' | 'rejected';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export type OpportunityType =
  | 'internship'
  | 'job'
  | 'referral'
  | 'hackathon'
  | 'event';

export type NotificationType =
  | 'connection'
  | 'message'
  | 'comment'
  | 'like'
  | 'opportunity'
  | 'event';

export type EventRsvpStatus = 'interested' | 'going';

export type FeedSort = 'latest' | 'trending';

export type FeedItemType = 'post' | 'opportunity' | 'event';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  college: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationResult;
  errors?: unknown[];
}

export interface UserFilterQuery {
  search?: string;
  role?: UserRole;
  department?: string;
  batch?: string;
  skills?: string | string[];
  page?: number;
  limit?: number;
  college?: string;
}

export interface OpportunityFilterQuery {
  search?: string;
  type?: OpportunityType;
  skills?: string | string[];
  company?: string;
  postedBy?: string;
  page?: number;
  limit?: number;
  college?: string;
}

export interface FeedQuery {
  sort?: FeedSort;
  page?: number;
  limit?: number;
}

export type ObjectId = Types.ObjectId;
