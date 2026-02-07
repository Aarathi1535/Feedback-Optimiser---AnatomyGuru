import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { EvaluationReport } from "../types.ts";

const PROMPT_INSTRUCTION = `
You are an AI academic evaluation assistant for medical anatomy education.
Your role is to provide structured, concise, grounded, and audit-safe feedback that SUPPLEMENTS human evaluator feedback.

INPUTS PROVIDED:
1. Merged PDF Content (Primary Reference): Contains Question paper, Official answer key, and Student handwritten answer sheet (OCR).
2. Human Feedback PDF Content: Contains marks awarded, human comments, and reported total score.

TASK OBJECTIVES:
A. Alignment Analysis:
   - Compare student OCR text with official answer key requirements.
   - Identify specific anatomical omissions or inaccuracies.

B. Feedback Augmentation:
   - Read the existing human feedback provided in the second PDF.
   - Create an "AI Feedback Addition" for each question that is exactly ONE LINE.
   - This line must clarify a specific missing anatomical detail from the key and suggest improvement.

C. Generalised Feedback Synthesis:
   - Locate the overall/generalised manual feedback provided in the Human Feedback PDF.
   - Elaborate on this feedback to provide a more comprehensive, academically professional summary of the student's performance. 
   - Ensure it stays grounded in the actual evidence found in both PDFs.

D. Score Summation Verification:
   - Extract individual question marks from the Feedback PDF.
   - Recalculate the total. Compare with the reported total.

STRICT OPERATING RULES:
1. NO HALLUCINATION: Do not add anatomy facts not in the key.
2. NO MARK MODIFICATION: Report marks as given by the human evaluator.
3. FILENAME: Use the merged PDF's filename as the 'Exam Reference'.
4. STYLE: Neutral, academic, professional.

OUTPUT FORMAT:
Generate a JSON object matching the provided schema.
`;

export async function generateEvaluationReport(
  mergedFile: { name: string; data: string; mimeType: string },
  feedbackFile: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { text: PROMPT_INSTRUCTION },
          { text: `Merged PDF Filename: ${mergedFile.name}` },
          { inlineData: { data: mergedFile.data, mimeType: mergedFile.mimeType } },
          { inlineData: { data: feedbackFile.data, mimeType: feedbackFile.mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          examReference: { type: Type.STRING },
          evaluationType: { type: Type.STRING },
          aiModelRole: { type: Type.STRING },
          generalisedFeedback: { type: Type.STRING, description: "Elaborated version of the manual general feedback found in the Human Feedback PDF." },
          questionWiseFeedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionNo: { type: Type.STRING },
                maxMarks: { type: Type.STRING },
                marksAwarded: { type: Type.STRING },
                keyAnswerPoints: { type: Type.STRING },
                studentAnswerSummary: { type: Type.STRING },
                humanFeedback: { type: Type.STRING },
                aiFeedbackAddition: { type: Type.STRING, description: "A concise one-line suggestion based on alignment analysis." }
              },
              required: ["questionNo", "maxMarks", "marksAwarded", "keyAnswerPoints", "studentAnswerSummary", "humanFeedback", "aiFeedbackAddition"]
            }
          },
          scoreVerification: {
            type: Type.OBJECT,
            properties: {
              calculatedTotal: { type: Type.NUMBER },
              reportedTotal: { type: Type.NUMBER },
              status: { type: Type.STRING },
              discrepancyExplanation: { type: Type.STRING }
            },
            required: ["calculatedTotal", "reportedTotal", "status"]
          },
          finalizedFeedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                observation: { type: Type.STRING }
              }
            }
          },
          actionSummary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                status: { type: Type.STRING },
                evidence: { type: Type.STRING }
              }
            }
          }
        },
        required: ["examReference", "evaluationType", "aiModelRole", "generalisedFeedback", "questionWiseFeedback", "scoreVerification", "finalizedFeedback", "actionSummary"]
      },
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text) as EvaluationReport;
}