
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an AI Academic Evaluation Assistant for Medical Anatomy Education.

MISSION:
Analyze two primary inputs:
1. "Artifact Repository": Contains the Question Paper, Official Marking Scheme, and the Student's Handwritten Script (PDF).
2. "Evaluator feedback": Contains the human teacher's scores and initial comments (Word or PDF).

TASK OBJECTIVES:
A. DATA EXTRACTION: Extract individual marks and comments per question exactly as provided by the human evaluator.
B. AI ENHANCEMENT: Cross-reference the student's handwritten answer sheet against the marking scheme. Add a new "AI Feedback Addition" for EACH question. This must be a concise (one line) technical anatomical suggestion or clarification that adds value to the student's learning.
C. FEEDBACK ELABORATION: Locate the generalized overall feedback in the manual evaluator report. ELABORATE this summary into a 3-5 sentence formal academic synthesis. It should maintain the original human evaluator's sentiment but refine it into professional medical education language.
D. SCORE VERIFICATION: Audit the reported total by summing up the extracted individual question marks.
E. PATTERN RECOGNITION: Summarize 4 critical high-level performance observations.

OUTPUT: Return strictly valid JSON matching the expected report structure.
`;

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { artifact, humanFeedback } = JSON.parse(event.body);
    
    // The API key is retrieved from Netlify's environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { text: SYSTEM_INSTRUCTION },
            { text: `Artifact: ${artifact.name}. Human Feedback: ${humanFeedback.name}.` },
            { inlineData: { data: artifact.data, mimeType: artifact.mimeType } },
            { inlineData: { data: humanFeedback.data, mimeType: humanFeedback.mimeType } }
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
            elaboratedGeneralisedFeedback: { type: Type.STRING },
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
                  aiFeedbackAddition: { type: Type.STRING }
                }
              }
            },
            scoreVerification: {
              type: Type.OBJECT,
              properties: {
                calculatedTotal: { type: Type.NUMBER },
                reportedTotal: { type: Type.NUMBER },
                status: { type: Type.STRING },
                discrepancyExplanation: { type: Type.STRING }
              }
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
          required: ["examReference", "evaluationType", "aiModelRole", "elaboratedGeneralisedFeedback", "questionWiseFeedback", "scoreVerification", "finalizedFeedback", "actionSummary"]
        },
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const result = response.text ? JSON.parse(response.text.trim()) : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An internal error occurred during evaluation." })
    };
  }
};
