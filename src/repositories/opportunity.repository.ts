import { FilterQuery, UpdateQuery } from 'mongoose';
import { Opportunity, IOpportunity } from '../models';
import { OpportunityFilterQuery } from '../types';

export class OpportunityRepository {
  async create(data: Partial<IOpportunity>): Promise<IOpportunity> {
    const opportunity = await Opportunity.create(data);
    return opportunity.populate('postedBy', 'name email profileImage role company');
  }

  async findById(id: string): Promise<IOpportunity | null> {
    return Opportunity.findById(id).populate(
      'postedBy',
      'name email profileImage role company'
    );
  }

  async update(id: string, data: UpdateQuery<IOpportunity>): Promise<IOpportunity | null> {
    return Opportunity.findByIdAndUpdate(id, data, { new: true }).populate(
      'postedBy',
      'name email profileImage role company'
    );
  }

  async delete(id: string): Promise<IOpportunity | null> {
    return Opportunity.findByIdAndDelete(id);
  }

  async findWithFilters(
    filters: OpportunityFilterQuery
  ): Promise<{ opportunities: IOpportunity[]; total: number }> {
    const { search, type, skills, company, page = 1, limit = 10 } = filters;
    const query: FilterQuery<IOpportunity> = {};

    if (search) query.$text = { $search: search };
    if (type) query.type = type;
    if (company) query.company = new RegExp(company, 'i');
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillArray };
    }

    const skip = (page - 1) * limit;
    const [opportunities, total] = await Promise.all([
      Opportunity.find(query)
        .populate('postedBy', 'name email profileImage role company')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Opportunity.countDocuments(query),
    ]);

    return { opportunities, total };
  }

  async findRecent(limit: number): Promise<IOpportunity[]> {
    return Opportunity.find()
      .populate('postedBy', 'name email profileImage role company')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countDocuments(filter: FilterQuery<IOpportunity> = {}): Promise<number> {
    return Opportunity.countDocuments(filter);
  }
}

export const opportunityRepository = new OpportunityRepository();
