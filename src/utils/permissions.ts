import { UserRole } from '../types';
import { IUser } from '../models';
import { AppError } from './response';

/** Roles each role is allowed to manage (view list, edit, delete, activate/deactivate) */
export const MANAGEABLE_ROLES: Record<UserRole, UserRole[]> = {
  admin: ['student', 'teacher', 'hod', 'alumni', 'admin'],
  hod: ['student', 'teacher', 'alumni'],
  teacher: ['student', 'alumni'],
  student: [],
  alumni: [],
};

/** Roles each role can activate/deactivate */
export const ACTIVATION_ROLES: Record<UserRole, UserRole[]> = {
  admin: ['student', 'teacher', 'hod', 'alumni'],
  hod: ['student', 'teacher', 'alumni'],
  teacher: ['student', 'alumni'],
  student: [],
  alumni: [],
};

export const canManageRole = (actorRole: UserRole, targetRole: UserRole): boolean =>
  MANAGEABLE_ROLES[actorRole].includes(targetRole);

export const canActivateRole = (actorRole: UserRole, targetRole: UserRole): boolean =>
  ACTIVATION_ROLES[actorRole].includes(targetRole);

export const isManagementRole = (role: UserRole): boolean =>
  role === 'admin' || role === 'hod' || role === 'teacher';

export const assertCanManageUser = (
  actor: Pick<IUser, '_id' | 'role'>,
  target: Pick<IUser, '_id' | 'role'>
): void => {
  if (actor._id.toString() === target._id.toString()) {
    throw new AppError('You cannot perform this action on your own account', 400);
  }
  if (!canManageRole(actor.role, target.role)) {
    throw new AppError('You do not have permission to manage this user', 403);
  }
};

export const assertCanActivateUser = (
  actor: Pick<IUser, 'role'>,
  target: Pick<IUser, 'role'>
): void => {
  if (!canActivateRole(actor.role, target.role)) {
    throw new AppError('You do not have permission to activate or deactivate this user', 403);
  }
};

export const getDefaultIsActiveForRole = (role: UserRole): boolean => role === 'admin';
