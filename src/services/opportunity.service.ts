import { opportunityRepository } from '../repositories/opportunity.repository';
import { AppError, buildPagination } from '../utils/response';
import { IOpportunity } from '../models';
import { OpportunityFilterQuery, UserRole } from '../types';
import { canManageRole } from '../utils/permissions';

export class OpportunityService {
  async create(
    postedBy: string,
    data: Partial<IOpportunity>
  ): Promise<IOpportunity> {
    return opportunityRepository.create({
      ...data,
      postedBy: postedBy as unknown as IOpportunity['postedBy'],
    });
  }

  async getById(id: string): Promise<IOpportunity> {
    const opportunity = await opportunityRepository.findById(id);
    if (!opportunity) throw new AppError('Opportunity not found', 404);
    return opportunity;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<IOpportunity>,
    userRole?: UserRole
  ): Promise<IOpportunity> {
    const opportunity = await opportunityRepository.findById(id);
    if (!opportunity) throw new AppError('Opportunity not found', 404);

    const postedBy = opportunity.postedBy._id?.toString() || opportunity.postedBy.toString();
    const isOwner = postedBy === userId;
    const canManage = userRole && opportunity.postedBy.role && canManageRole(userRole, opportunity.postedBy.role as UserRole);

    if (!isOwner && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    const updated = await opportunityRepository.update(id, data);
    if (!updated) throw new AppError('Opportunity not found', 404);
    return updated;
  }

  async delete(id: string, userId: string, userRole?: UserRole): Promise<void> {
    const opportunity = await opportunityRepository.findById(id);
    if (!opportunity) throw new AppError('Opportunity not found', 404);

    const postedBy = opportunity.postedBy._id?.toString() || opportunity.postedBy.toString();
    const isOwner = postedBy === userId;
    const canManage = userRole && opportunity.postedBy.role && canManageRole(userRole, opportunity.postedBy.role as UserRole);

    if (!isOwner && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    await opportunityRepository.delete(id);
  }

  async search(filters: OpportunityFilterQuery) {
    const { opportunities, total } = await opportunityRepository.findWithFilters(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    return {
      opportunities,
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const opportunityService = new OpportunityService();
