import { Request, Response, NextFunction } from 'express';
import { compilerService } from '../services/compiler.service';
import { sendSuccess } from '../utils/response';

export class CompilerController {
  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { language, version, files, stdin } = req.body;
      if (!language || !files || !Array.isArray(files)) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: language and files (array) are required.',
        });
        return;
      }

      const result = await compilerService.executeCode({
        language,
        version,
        files,
        stdin,
      });

      sendSuccess(res, result, 'Code executed successfully');
    } catch (error: any) {
      const match = error.message?.match(/Compiler API error \((\d+)\): (.*)/);
      if (match) {
        const statusCode = parseInt(match[1], 10);
        try {
          // If the message is a JSON string, parse and return the message body
          const parsed = JSON.parse(match[2]);
          res.status(statusCode).json({
            success: false,
            message: parsed.message || match[2],
          });
        } catch {
          res.status(statusCode).json({
            success: false,
            message: match[2],
          });
        }
        return;
      }
      next(error);
    }
  };
}

export const compilerController = new CompilerController();
