import { Response, NextFunction } from 'express';
import { opportunityService } from '../services/opportunity.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination, getParam } from '../utils/response';

export class OpportunityController {
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const opportunity = await opportunityService.create(req.user!.userId, req.body, req.user!.role);
      sendSuccess(res, opportunity, 'Opportunity created', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const opportunity = await opportunityService.getById(getParam(req.params.id));
      sendSuccess(res, opportunity);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const opportunity = await opportunityService.update(
        getParam(req.params.id),
        req.user!.userId,
        req.body,
        req.user!.role
      );
      sendSuccess(res, opportunity, 'Opportunity updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await opportunityService.delete(getParam(req.params.id), req.user!.userId, req.user!.role);
      sendSuccess(res, undefined, 'Opportunity deleted');
    } catch (error) {
      next(error);
    }
  };

  search = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await opportunityService.search({
        search: req.query.search as string,
        type: req.query.type as 'internship' | 'job' | 'referral' | 'hackathon' | 'event',
        company: req.query.company as string,
        skills: req.query.skills as string,
        postedBy: req.query.postedBy as string,
        page,
        limit,
      }, req.user!.role);
      sendSuccess(res, result.opportunities, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  };
}

export const opportunityController = new OpportunityController();
