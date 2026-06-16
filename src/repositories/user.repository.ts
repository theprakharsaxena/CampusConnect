import { FilterQuery, UpdateQuery } from 'mongoose';
import { User, IUser } from '../models';
import { UserFilterQuery, UserRole } from '../types';
import { MANAGEABLE_ROLES } from '../utils/permissions';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password +refreshToken +passwordResetToken +passwordResetExpires');
    }
    return query;
  }

  async findByIdWithSecrets(id: string): Promise<IUser | null> {
    return User.findById(id).select(
      '+password +refreshToken +passwordResetToken +passwordResetExpires'
    );
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }

  async findWithFilters(filters: UserFilterQuery): Promise<{ users: IUser[]; total: number }> {
    const { search, role, department, batch, skills, page = 1, limit = 10 } = filters;
    const query: FilterQuery<IUser> = { isBlocked: false };

    if (search) {
      query.$text = { $search: search };
    }
    if (role) query.role = role;
    if (department) query.department = department;
    if (batch) query.batch = batch;
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillArray };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  async findAll(page = 1, limit = 10): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);
    return { users, total };
  }

  async findByRoles(
    roles: UserRole[],
    filters: { isActive?: boolean; page?: number; limit?: number }
  ): Promise<{ users: IUser[]; total: number }> {
    const { isActive, page = 1, limit = 10 } = filters;
    const query: FilterQuery<IUser> = { role: { $in: roles } };
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    return { users, total };
  }

  async findManageableByRole(
    managerRole: UserRole,
    filters: { isActive?: boolean; page?: number; limit?: number }
  ): Promise<{ users: IUser[]; total: number }> {
    return this.findByRoles(MANAGEABLE_ROLES[managerRole], filters);
  }

  async countDocuments(filter: FilterQuery<IUser> = {}): Promise<number> {
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
