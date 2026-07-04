import { Response, NextFunction } from 'express';
import { challengeService } from '../services/challenge.service';
import { AuthRequest } from '../types';
import { sendSuccess, parsePagination } from '../utils/response';

export class ChallengeController {
  getToday = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await challengeService.getToday(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { selectedOption } = req.body;
      if (!selectedOption) {
        res.status(400).json({ success: false, message: 'selectedOption is required' });
        return;
      }
      const result = await challengeService.submitAnswer(req.user!.userId, selectedOption);
      sendSuccess(res, result, result.isCorrect ? '🎉 Correct!' : '❌ Wrong answer');
    } catch (error) {
      next(error);
    }
  };

  getHint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const level = parseInt(req.params.level as string);
      if (![1, 2, 3].includes(level)) {
        res.status(400).json({ success: false, message: 'Hint level must be 1, 2, or 3' });
        return;
      }
      const result = await challengeService.getHint(req.user!.userId, level as 1 | 2 | 3);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(
        req.query.page as string,
        req.query.limit as string
      );
      const result = await challengeService.getHistory(req.user!.userId, page, limit);
      sendSuccess(res, result.items, undefined, 200, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      next(error);
    }
  };

  getLearningPath = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await challengeService.getLearningPath(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const challengeController = new ChallengeController();
