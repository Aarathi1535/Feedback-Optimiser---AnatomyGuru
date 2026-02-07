import React, { useState, ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface QuestionFeedback {
  questionNo: string;
  maxMarks: string | number;
  marksAwarded: string | number;
  keyAnswerPoints: string;
  studentAnswerSummary: string;
  humanFeedback: string;
  aiFeedbackAddition: string;
}

export interface ScoreVerification {
  calculatedTotal: number;
  reportedTotal: number;
  status: 'Correct' | 'Incorrect';
  discrepancyExplanation?: string;
}

export interface AIObservation {
  section: string;
  observation: string;
}

export interface ActionSummary {
  task: string;
  status: string;
  evidence: string;
}

export interface EvaluationReport {
  examReference: string;
  evaluationType: string;
  aiModelRole: string;
  generalisedFeedback: string;
  questionWiseFeedback: QuestionFeedback[];
  scoreVerification: ScoreVerification;
  finalizedFeedback: AIObservation[];
  actionSummary: ActionSummary[];
}

// --- SERVICES ---

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
   - Create an "AI Feedback Addition" for each question that is exactly ONE LINE.
   - Clarify a specific missing anatomical detail from the key and suggest improvement.

C. Generalised Feedback Synthesis:
   - Locate overall feedback in the Human Feedback PDF and elaborate into a professional academic summary.

D. Score Summation Verification:
   - Recalculate total from individual marks and compare with reported total.

OUTPUT FORMAT: Generate a valid JSON object.
`;

async function generateEvaluationReport(
  mergedFile: { name: string; data: string; mimeType: string },
  feedbackFile: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  const ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });

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
          generalisedFeedback: { type: Type.STRING },
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
        required: ["examReference", "evaluationType", "aiModelRole", "generalisedFeedback", "questionWiseFeedback", "scoreVerification", "finalizedFeedback", "actionSummary"]
      },
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  return JSON.parse(response.text || "{}") as EvaluationReport;
}

// --- COMPONENTS ---

const FileUpload: React.FC<{
  id: string;
  label: string;
  description: string;
  onChange: (file: File | null) => void;
  fileName: string | null;
}> = ({ id, label, description, onChange, fileName }) => (
  <div className="flex flex-col space-y-2">
    <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
    <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${fileName ? 'border-blue-800 bg-blue-50' : 'border-slate-300 hover:border-blue-800 bg-white'}`}>
      <input type="file" id={id} accept="application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        {fileName ? (
          <>
            <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium text-blue-900 truncate max-w-xs">{fileName}</p>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-sm text-slate-500">{description}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ReportDisplay: React.FC<{ report: EvaluationReport }> = ({ report }) => (
  <div className="w-full space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-blue-950 text-white rounded-xl p-8 shadow-xl border-l-4 border-blue-400">
      <h2 className="text-xl font-bold mb-4 border-b border-blue-900 pb-2 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.414l4.586 4.586a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
        FEEDBACK REPORT HEADER
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mono text-sm opacity-90">
        <div><p className="font-bold text-slate-400 uppercase text-[10px]">Reference</p><p className="text-blue-300 truncate">{report.examReference}</p></div>
        <div><p className="font-bold text-slate-400 uppercase text-[10px]">Type</p><p>{report.evaluationType}</p></div>
        <div className="md:col-span-2"><p className="font-bold text-slate-400 uppercase text-[10px]">Model Role</p><p className="italic text-slate-300">{report.aiModelRole}</p></div>
      </div>
    </div>

    <section className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden">
      <div className="bg-blue-900 px-6 py-4 flex items-center justify-between"><h3 className="text-white font-bold">GENERALISED FEEDBACK</h3></div>
      <div className="p-8 text-slate-700 leading-relaxed italic border-l-4 border-blue-900 m-6 bg-slate-50">{report.generalisedFeedback}</div>
    </section>

    <section>
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-sm">1</span> QUESTION ANALYSIS</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-lg bg-white">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b">
            <tr><th className="p-4 w-16">No</th><th className="p-4 w-24">Marks</th><th className="p-4">Key Points</th><th className="p-4">Student Summary</th><th className="p-4">Human Feedback</th><th className="p-4 bg-blue-50/50">AI Addition</th></tr>
          </thead>
          <tbody className="divide-y text-sm">
            {report.questionWiseFeedback.map((q, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold">{q.questionNo}</td>
                <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">{q.marksAwarded} / {q.maxMarks}</span></td>
                <td className="p-4 text-xs text-slate-500">{q.keyAnswerPoints}</td>
                <td className="p-4">{q.studentAnswerSummary}</td>
                <td className="p-4 font-medium">{q.humanFeedback}</td>
                <td className="p-4 bg-blue-50/20 font-semibold text-blue-900 border-l-2 border-blue-900">{q.aiFeedbackAddition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="bg-white rounded-xl border p-6 shadow-md">
        <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Score Audit</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span>Calculated</span><span className="font-black">{report.scoreVerification.calculatedTotal}</span></div>
          <div className="flex justify-between text-sm"><span>Reported</span><span className="font-black">{report.scoreVerification.reportedTotal}</span></div>
          <div className={`text-center py-2 rounded font-bold uppercase text-xs tracking-widest ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{report.scoreVerification.status}</div>
        </div>
      </section>
      <section className="bg-white rounded-xl border p-6 shadow-md">
        <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">AI Observations</h3>
        <div className="space-y-2">
          {report.finalizedFeedback.slice(0, 3).map((obs, i) => (
            <div key={i} className="text-xs border-b pb-2 last:border-0"><span className="font-bold block text-blue-900">{obs.section}</span>{obs.observation}</div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [mergedFile, setMergedFile] = useState<File | null>(null);
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) return setError("Both PDF files required.");
    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    try {
      const toB64 = (f: File): Promise<string> => new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(f); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej;
      });
      const generated = await generateEvaluationReport(
        { name: mergedFile.name, data: await toB64(mergedFile), mimeType: mergedFile.type },
        { name: feedbackFile.name, data: await toB64(feedbackFile), mimeType: feedbackFile.type }
      );
      setReport(generated);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (e: any) {
      setError(e.message || "Analysis failed.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">AG</div>
          <div><h1 className="text-lg font-bold">AnatomyGuard</h1><p className="text-[10px] text-slate-500 uppercase font-black">AI Evaluation</p></div>
        </div>
        {report && <button onClick={() => { setReport(null); setStatus(ProcessingStatus.IDLE); }} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Reset</button>}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {!report || status === ProcessingStatus.ANALYZING ? (
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden max-w-4xl mx-auto">
            <div className="p-8 border-b bg-slate-50/50 text-center"><h2 className="text-2xl font-black text-slate-800">Academic Analysis Portal</h2></div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUpload id="m" label="Reference PDF" description="Question + Key + Answers" onChange={setMergedFile} fileName={mergedFile?.name || null} />
                <FileUpload id="f" label="Human Feedback" description="Marks + Comments" onChange={setFeedbackFile} fileName={feedbackFile?.name || null} />
              </div>
              {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg font-medium">{error}</div>}
              <button onClick={handleProcess} disabled={status === ProcessingStatus.ANALYZING} className="w-full py-4 bg-blue-900 text-white rounded-xl font-black text-lg shadow-lg hover:bg-blue-950 disabled:opacity-50 transition-all">
                {status === ProcessingStatus.ANALYZING ? 'Processing Medical Records...' : 'Generate AI Feedback'}
              </button>
            </div>
            {status === ProcessingStatus.ANALYZING && <div className="h-1 bg-slate-200 overflow-hidden"><div className="h-full bg-blue-900 animate-pulse w-[60%]"></div></div>}
          </div>
        ) : <ReportDisplay report={report} />}
      </main>
    </div>
  );
};

// --- RENDER ---

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

// Remove loader after Babel is done
setTimeout(() => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }
}, 500);
