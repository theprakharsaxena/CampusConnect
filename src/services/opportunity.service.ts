import { opportunityRepository } from '../repositories/opportunity.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { connectionRepository } from '../repositories/connection.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError, buildPagination } from '../utils/response';
import { IOpportunity } from '../models';
import { IUser } from '../models/User.model';
import { OpportunityFilterQuery, UserRole } from '../types';
import { canManageRole, isManagementRole } from '../utils/permissions';
import { ContentStatus } from '../models/Post.model';
import { checkPublicContent } from '../utils/moderation';

export class OpportunityService {
  async create(
    postedBy: string,
    data: Partial<IOpportunity>,
    posterRole: UserRole = 'student'
  ): Promise<IOpportunity> {
    await checkPublicContent(data.title);
    await checkPublicContent(data.description);
    await checkPublicContent(data.company);

    const status: ContentStatus = isManagementRole(posterRole) ? 'approved' : 'pending';

    const opportunity = await opportunityRepository.create({
      ...data,
      postedBy: postedBy as unknown as IOpportunity['postedBy'],
      status,
    });

    // Notify connections when opportunity is auto-approved
    if (status === 'approved') {
      this._notifyConnectionsOfNewOpportunity(postedBy, data).catch(() => {});
    }

    return opportunity;
  }

  private async _notifyConnectionsOfNewOpportunity(
    userId: string,
    data: Partial<IOpportunity>
  ): Promise<void> {
    const author = await userRepository.findById(userId);
    if (!author) return;
    const connectedIds = await connectionRepository.findConnectedUserIds(userId);
    if (connectedIds.length === 0) return;

    const title = data.title || 'an opportunity';
    const company = data.company ? ` at ${data.company}` : '';
    const type = data.type ? `[${data.type}] ` : '';
    const authorImage = author.profileImage || '';

    for (const connId of connectedIds) {
      await notificationRepository.create({
        userId: connId,
        type: 'opportunity',
        title: author.name,
        message: `Posted ${type}${title}${company}`,
        actorImage: authorImage,
      });
    }
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
    await checkPublicContent(data.title);
    await checkPublicContent(data.description);
    await checkPublicContent(data.company);

    const opportunity = await opportunityRepository.findById(id);
    if (!opportunity) throw new AppError('Opportunity not found', 404);

    const poster = opportunity.postedBy as IUser;
    const postedBy = poster._id?.toString() || (opportunity.postedBy as unknown as string).toString();
    const isOwner = postedBy === userId;
    const canManage = userRole && poster.role && canManageRole(userRole, poster.role);

    if (!isOwner && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    // Students/alumni: any edit resets status to pending for re-review
    const updateData: Record<string, unknown> = { ...data };
    if (isOwner && !isManagementRole(userRole || 'student')) {
      updateData.status = 'pending';
      updateData.rejectionReason = null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }

    const updated = await opportunityRepository.update(id, updateData);
    if (!updated) throw new AppError('Opportunity not found', 404);
    return updated;
  }

  async delete(id: string, userId: string, userRole?: UserRole): Promise<void> {
    const opportunity = await opportunityRepository.findById(id);
    if (!opportunity) throw new AppError('Opportunity not found', 404);

    const poster = opportunity.postedBy as IUser;
    const postedBy = poster._id?.toString() || (opportunity.postedBy as unknown as string).toString();
    const isOwner = postedBy === userId;
    const canManage = userRole && poster.role && canManageRole(userRole, poster.role);

    if (!isOwner && !canManage) {
      throw new AppError('Not authorized', 403);
    }

    await opportunityRepository.delete(id);
  }

  async search(filters: OpportunityFilterQuery, _userRole?: UserRole) {
    // Opportunities listing always shows only approved content
    const { opportunities, total } = await opportunityRepository.findWithFilters(filters, true);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    return {
      opportunities,
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const opportunityService = new OpportunityService();
