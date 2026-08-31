import { z } from 'zod';
import { searchKnowledgeBase } from '../vectorStore.js';
import { executeStructuredInference } from '../groqClient.js';
import { LateReasonCategory } from '../../models/LateReason.js';

export const LateAssistantOutputSchema = z.object({
  lateMinutes: z.number(),
  category: z.enum(['MEDICAL', 'TRAFFIC_TRANSIT', 'FAMILY_EMERGENCY', 'CLIENT_MEETING', 'TECHNICAL_GLITCH', 'OTHER']),
  requiresDocument: z.boolean(),
  requiresHRReview: z.boolean(),
  recommendation: z.enum(['ACCEPT', 'REJECT', 'NEEDS_MORE_INFO', 'NO_ACTION']),
  reason: z.string(),
  policySources: z.array(z.string()),
});

export type LateAssistantOutput = z.infer<typeof LateAssistantOutputSchema>;

export async function evaluateLateArrivalExplanation(input: {
  employeeId: string;
  attendanceId: string;
  lateMinutes: number;
  reasonCategory: LateReasonCategory;
  employeeExplanation: string;
  hasSupportingDocument: boolean;
}): Promise<LateAssistantOutput> {
  const { lateMinutes, reasonCategory, employeeExplanation, hasSupportingDocument } = input;

  // Retrieve relevant late arrival policy chunks
  const policyDocs = await searchKnowledgeBase({
    query: `late arrival policy grace period thresholds supporting documents ${reasonCategory}`,
    limit: 2,
    accessScope: ['EMPLOYEE', 'HR'],
    documentType: 'policy',
  });

  const policySources = policyDocs.map((d) => d.documentId);

  // Policy rules:
  // 1. Mandatory document for MEDICAL or lateness > 60 mins
  const requiresDoc = reasonCategory === 'MEDICAL' || lateMinutes > 60;

  return await executeStructuredInference<LateAssistantOutput>({
    systemPrompt: `You are an enterprise HR Late-Arrival Adjudication Assistant.
Analyze the employee's explanation for late arrival based on company policy.
Policy constraints:
- Medical excuses or lateness > 60 minutes require verified supporting documents.
- If mandatory document is missing, recommendation MUST be 'NEEDS_MORE_INFO'.
- Genuine unexpected transit disruptions with clear details can be recommended for 'ACCEPT'.
- Vague or unverified excuses should be recommended for 'REJECT' or 'NEEDS_MORE_INFO'.
- Output MUST strictly match the schema.`,
    userPrompt: JSON.stringify({
      lateMinutes,
      reasonCategory,
      employeeExplanation,
      hasSupportingDocument,
      documentRequiredByPolicy: requiresDoc,
      retrievedPolicyExcerpts: policyDocs.map((d) => d.content.slice(0, 300)),
    }),
    schema: LateAssistantOutputSchema,
    fallbackGenerator: () => {
      let rec: 'ACCEPT' | 'REJECT' | 'NEEDS_MORE_INFO' = 'ACCEPT';
      let reasoning = 'Valid operational explanation provided.';

      if (requiresDoc && !hasSupportingDocument) {
        rec = 'NEEDS_MORE_INFO';
        reasoning = `Policy requires a supporting document for ${reasonCategory} reasons or lateness exceeding 60 minutes.`;
      } else if (employeeExplanation.trim().length < 10) {
        rec = 'NEEDS_MORE_INFO';
        reasoning = 'Explanation is too brief. Please provide more context.';
      }

      return {
        lateMinutes,
        category: reasonCategory,
        requiresDocument: requiresDoc,
        requiresHRReview: true,
        recommendation: rec,
        reason: reasoning,
        policySources,
      };
    },
  });
}
