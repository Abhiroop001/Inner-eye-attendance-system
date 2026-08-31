import { z } from 'zod';
import { executeStructuredInference } from '../groqClient.js';
import { getHRDashboardData } from '../../services/dashboardService.js';

export const HRInsightsResponseSchema = z.object({
  summary: z.string(),
  keyObservations: z.array(z.string()),
  punctualityRiskDepartments: z.array(z.string()),
  actionRecommendations: z.array(z.string()),
  suggestedFocusAreas: z.array(z.string()),
});

export type HRInsightsResponse = z.infer<typeof HRInsightsResponseSchema>;

export async function runHRInsightsAgent(): Promise<HRInsightsResponse> {
  const hrData = await getHRDashboardData();

  return await executeStructuredInference<HRInsightsResponse>({
    systemPrompt: `You are an Executive People Analytics and HR Operations Intelligence Advisor.
Analyze high-level organization attendance metrics, late patterns, pending reviews, and department trends.
Provide clear, actionable insights for HR leaders to optimize workforce punctuality and streamline exception reviews.`,
    userPrompt: JSON.stringify({
      metrics: hrData.kpi,
      departmentHeadcounts: hrData.departmentStats,
      sevenDayTrend: hrData.trend7Days,
    }),
    schema: HRInsightsResponseSchema,
    fallbackGenerator: () => ({
      summary: `Organization attendance is operating at ${hrData.kpi.averageAttendanceRate}% efficiency with ${hrData.kpi.presentToday} employees present and ${hrData.kpi.lateToday} late arrivals recorded today.`,
      keyObservations: [
        `Overall attendance rate is holding steady at ${hrData.kpi.averageAttendanceRate}%.`,
        `${hrData.kpi.pendingExceptions} late arrival exception submissions require HR adjudication.`,
        `${hrData.kpi.pendingLeaves} leave requests are awaiting manager approval.`,
      ],
      punctualityRiskDepartments: ['Operations', 'Engineering'],
      actionRecommendations: [
        'Adjudicate open late arrival explanations with attached transit slips.',
        'Review leave requests before weekly shift schedule freeze.',
        'Send gentle punctuality reminder for employees logging > 3 late check-ins this month.',
      ],
      suggestedFocusAreas: ['Punctuality Coaching', 'Automated Exception Resolution', 'Shift Distribution'],
    }),
  });
}
