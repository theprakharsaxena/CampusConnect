import { userRepository } from '../repositories/user.repository';
import { AppError, buildPagination } from '../utils/response';
import { IUser } from '../models';
import { UserFilterQuery } from '../types';
import { uploadToCloudinary } from '../utils/cloudinary';
import {
  assertCanActivateUser,
  assertCanManageUser,
  isManagementRole,
} from '../utils/permissions';

const sanitizeUser = (user: IUser): Partial<IUser> => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

const MANAGER_EDITABLE_FIELDS = [
  'name',
  'department',
  'batch',
  'bio',
  'company',
  'designation',
  'skills',
  'linkedinUrl',
  'githubUrl',
  'rollNumber',
] as const;

export class UserService {
  async getUserById(id: string): Promise<Partial<IUser>> {
    const user = await userRepository.findById(id);
    if (!user || user.isBlocked) {
      throw new AppError('User not found', 404);
    }
    return sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: Partial<IUser>,
    imageBuffer?: Buffer
  ): Promise<Partial<IUser>> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (
      existingUser.isActive &&
      (existingUser.role === 'student' || existingUser.role === 'alumni') &&
      data.rollNumber !== undefined &&
      data.rollNumber !== existingUser.rollNumber
    ) {
      throw new AppError('Roll number cannot be changed after account activation', 400);
    }

    const updateData = { ...data };
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isBlocked;
    delete updateData.isActive;

    if (imageBuffer) {
      const { url } = await uploadToCloudinary(imageBuffer, 'campusconnect/profiles');
      updateData.profileImage = url;
    }

    const user = await userRepository.update(userId, updateData);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return sanitizeUser(user);
  }

  async searchUsers(filters: UserFilterQuery) {
    const { users, total } = await userRepository.findWithFilters(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    return {
      users: users.map(sanitizeUser),
      pagination: buildPagination(page, limit, total),
    };
  }
}

export class UserManagementService {
  private async getActor(actorId: string): Promise<IUser> {
    const actor = await userRepository.findById(actorId);
    if (!actor) throw new AppError('User not found', 404);
    if (!isManagementRole(actor.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    return actor;
  }

  private async getTarget(targetId: string): Promise<IUser> {
    const target = await userRepository.findById(targetId);
    if (!target) throw new AppError('User not found', 404);
    return target;
  }

  async getManageableUsers(
    actorId: string,
    page: number,
    limit: number,
    isActive?: boolean
  ) {
    const actor = await this.getActor(actorId);
    const { users, total } = await userRepository.findManageableByRole(actor.role, {
      isActive,
      page,
      limit,
    });
    return {
      users: users.map(sanitizeUser),
      pagination: buildPagination(page, limit, total),
    };
  }

  async getPendingUsers(actorId: string, page: number, limit: number) {
    return this.getManageableUsers(actorId, page, limit, false);
  }

  async updateUser(
    actorId: string,
    targetId: string,
    data: Partial<IUser>
  ): Promise<Partial<IUser>> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(targetId);
    assertCanManageUser(actor, target);

    const updateData: Partial<IUser> = {};
    for (const field of MANAGER_EDITABLE_FIELDS) {
      if (data[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = data[field];
      }
    }

    if (actor.role === 'admin' && data.role) {
      updateData.role = data.role;
    }

    const updated = await userRepository.update(targetId, updateData);
    if (!updated) throw new AppError('User not found', 404);
    return sanitizeUser(updated);
  }

  async deleteUser(actorId: string, targetId: string): Promise<void> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(targetId);
    assertCanManageUser(actor, target);

    const deleted = await userRepository.delete(targetId);
    if (!deleted) throw new AppError('User not found', 404);
  }

  async activateUser(actorId: string, targetId: string): Promise<Partial<IUser>> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(targetId);
    assertCanActivateUser(actor, target);

    if (target.isActive) {
      throw new AppError('User is already active', 400);
    }

    const updated = await userRepository.update(targetId, { isActive: true });
    if (!updated) throw new AppError('User not found', 404);
    return sanitizeUser(updated);
  }

  async deactivateUser(actorId: string, targetId: string): Promise<Partial<IUser>> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(targetId);
    assertCanActivateUser(actor, target);

    if (!target.isActive) {
      throw new AppError('User is already inactive', 400);
    }

    const updated = await userRepository.update(targetId, { isActive: false });
    if (!updated) throw new AppError('User not found', 404);
    return sanitizeUser(updated);
  }
}

export class AdminService {
  async getAllUsers(page: number, limit: number) {
    const { users, total } = await userRepository.findAll(page, limit);
    return {
      users: users.map(sanitizeUser),
      pagination: buildPagination(page, limit, total),
    };
  }

  async blockUser(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.update(userId, { isBlocked: true });
    if (!user) throw new AppError('User not found', 404);
    return sanitizeUser(user);
  }

  async unblockUser(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.update(userId, { isBlocked: false });
    if (!user) throw new AppError('User not found', 404);
    return sanitizeUser(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await userRepository.delete(userId);
    if (!user) throw new AppError('User not found', 404);
  }

  async getAnalytics() {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAlumni,
      totalPosts,
      totalOpportunities,
      totalEvents,
      blockedUsers,
      inactiveUsers,
      pendingStudents,
      pendingTeachers,
    ] = await Promise.all([
      userRepository.countDocuments(),
      userRepository.countDocuments({ role: 'student' }),
      userRepository.countDocuments({ role: 'teacher' }),
      userRepository.countDocuments({ role: 'alumni' }),
      (await import('../repositories/post.repository')).postRepository.countDocuments(),
      (await import('../repositories/opportunity.repository')).opportunityRepository.countDocuments(),
      (await import('../repositories/event.repository')).eventRepository.countDocuments(),
      userRepository.countDocuments({ isBlocked: true }),
      userRepository.countDocuments({ isActive: false }),
      userRepository.countDocuments({ role: 'student', isActive: false }),
      userRepository.countDocuments({ role: 'teacher', isActive: false }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        alumni: totalAlumni,
        blocked: blockedUsers,
        inactive: inactiveUsers,
        pendingStudents,
        pendingTeachers,
      },
      content: {
        posts: totalPosts,
        opportunities: totalOpportunities,
        events: totalEvents,
      },
    };
  }
}

export const userService = new UserService();
export const userManagementService = new UserManagementService();
export const adminService = new AdminService();
