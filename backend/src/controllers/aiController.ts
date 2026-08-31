import { Request, Response } from 'express';
import { z } from 'zod';
import { runEmployeeAssistant } from '../ai/langgraph/employeeAssistantGraph.js';
import { runHRInsightsAgent } from '../ai/langgraph/hrInsightGraph.js';
import { AppError } from '../middleware/errorHandler.js';

const EmployeeAssistantSchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters long'),
});

export async function askEmployeeAssistant(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated with this account', 400);

  const { question } = EmployeeAssistantSchema.parse(req.body);

  const response = await runEmployeeAssistant({
    employeeId,
    question,
  });

  res.status(200).json({
    success: true,
    data: response,
    requestId: req.id,
  });
}

export async function getHRInsights(req: Request, res: Response): Promise<void> {
  const insights = await runHRInsightsAgent();

  res.status(200).json({
    success: true,
    data: insights,
    requestId: req.id,
  });
}
