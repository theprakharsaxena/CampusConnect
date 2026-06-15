import { userRepository } from '../repositories/user.repository';
import { AppError, buildPagination } from '../utils/response';
import { IUser } from '../models';
import { UserFilterQuery } from '../types';
import { uploadToCloudinary } from '../utils/cloudinary';

const sanitizeUser = (user: IUser): Partial<IUser> => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

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
    const updateData = { ...data };
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isBlocked;

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
    ] = await Promise.all([
      userRepository.countDocuments(),
      userRepository.countDocuments({ role: 'student' }),
      userRepository.countDocuments({ role: 'teacher' }),
      userRepository.countDocuments({ role: 'alumni' }),
      (await import('../repositories/post.repository')).postRepository.countDocuments(),
      (await import('../repositories/opportunity.repository')).opportunityRepository.countDocuments(),
      (await import('../repositories/event.repository')).eventRepository.countDocuments(),
      userRepository.countDocuments({ isBlocked: true }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        alumni: totalAlumni,
        blocked: blockedUsers,
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
export const adminService = new AdminService();
