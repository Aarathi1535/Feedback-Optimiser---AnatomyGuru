import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES & INTERFACES ---

enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

interface QuestionFeedback {
  questionNo: string;
  maxMarks: string | number;
  marksAwarded: string | number;
  keyAnswerPoints: string;
  studentAnswerSummary: string;
  humanFeedback: string;
  aiFeedbackAddition: string;
}

interface ScoreVerification {
  calculatedTotal: number;
  reportedTotal: number;
  status: 'Correct' | 'Incorrect';
  discrepancyExplanation?: string;
}

interface AIObservation {
  section: string;
  observation: string;
}

interface ActionSummary {
  task: string;
  status: string;
  evidence: string;
}

interface EvaluationReport {
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
1. Merged PDF Content: Question paper, Official answer key, and Student handwritten answer sheet (OCR).
2. Human Feedback PDF Content: Marks awarded, human comments, and reported total score.

TASK OBJECTIVES:
A. Alignment Analysis: Compare student OCR with official key. Identify anatomical omissions or errors.
B. Feedback Augmentation: Create a ONE LINE "AI Feedback Addition" per question clarifying missing anatomical details from the marking scheme.
C. Generalised Synthesis: Professional academic summary of student's overall performance.
D. Verification: Recalculate total marks from individual question scores and compare with the reported total in the human feedback.

OUTPUT FORMAT: Generate a valid JSON object matching the defined schema.
`;

async function generateEvaluationReport(
  mergedFile: { name: string; data: string; mimeType: string },
  feedbackFile: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
              },
              required: ["section", "observation"]
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
              },
              required: ["task", "status", "evidence"]
            }
          }
        },
        required: ["examReference", "evaluationType", "aiModelRole", "generalisedFeedback", "questionWiseFeedback", "scoreVerification", "finalizedFeedback", "actionSummary"]
      },
      thinkingConfig: { thinkingBudget: 32768 }
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
    <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${fileName ? 'border-blue-800 bg-blue-50 shadow-inner' : 'border-slate-300 hover:border-blue-800 bg-white shadow-sm'}`}>
      <input type="file" id={id} accept="application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        {fileName ? (
          <>
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white mb-1 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-bold text-blue-900 truncate max-w-[200px]">{fileName}</p>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-medium text-slate-500">{description}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ReportDisplay: React.FC<{ report: EvaluationReport }> = ({ report }) => (
  <div className="w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
    <div className="bg-blue-950 text-white rounded-2xl p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 bg-blue-800 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-200 border border-blue-700 mb-4">Audit Verified</div>
          <h2 className="text-3xl font-black tracking-tight">{report.examReference}</h2>
          <div className="flex items-center space-x-6 text-sm font-medium opacity-70">
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>{report.evaluationType}</span>
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{report.aiModelRole}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Final Score</p>
          <p className="text-5xl font-black tabular-nums">{report.scoreVerification.reportedTotal}<span className="text-xl opacity-40 ml-1">pts</span></p>
        </div>
      </div>
    </div>

    <section className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Executive Summary
        </h3>
      </div>
      <div className="p-10 leading-relaxed text-slate-700 italic border-l-4 border-blue-900 m-8 bg-slate-50 shadow-inner">
        <p className="text-lg">{report.generalisedFeedback}</p>
      </div>
    </section>

    <section className="space-y-6">
      <h3 className="text-xl font-black text-slate-900 px-2 flex items-center">
        <span className="bg-blue-900 text-white w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-sm shadow-xl">1</span>
        Alignment Analysis
      </h3>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
              <th className="p-6 w-20 text-center">No</th>
              <th className="p-6 w-32 text-center">Marks</th>
              <th className="p-6">Requirements</th>
              <th className="p-6">Student Content</th>
              <th className="p-6 bg-blue-50/50 text-blue-950 border-l-4 border-blue-900">AI Augmented Insight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.questionWiseFeedback.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-150 group">
                <td className="p-6 font-black text-slate-400 text-center group-hover:text-blue-900">{q.questionNo}</td>
                <td className="p-6 text-center">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-black text-sm border border-emerald-100">{q.marksAwarded} / {q.maxMarks}</span>
                </td>
                <td className="p-6 text-sm text-slate-500 italic max-w-xs">{q.keyAnswerPoints}</td>
                <td className="p-6 text-sm text-slate-700 leading-relaxed max-w-sm">{q.studentAnswerSummary}</td>
                <td className="p-6 bg-blue-50/20 font-bold text-blue-950 border-l-4 border-blue-900 leading-relaxed text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-1 text-blue-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    {q.aiFeedbackAddition}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Score Integrity Check</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Recalculated Sum</span>
            <span className="font-black text-2xl tabular-nums">{report.scoreVerification.calculatedTotal}</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Reported Total</span>
            <span className="font-black text-2xl tabular-nums">{report.scoreVerification.reportedTotal}</span>
          </div>
          <div className={`mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-100' : 'bg-rose-50 text-rose-800 border-2 border-rose-100'}`}>
             {report.scoreVerification.status}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-8">System Observations</h4>
          <div className="space-y-6">
            {report.finalizedFeedback.slice(0, 3).map((obs, i) => (
              <div key={i} className="flex space-x-4">
                <span className="text-blue-500 font-black opacity-30">0{i+1}</span>
                <div>
                  <h5 className="font-black text-xs text-blue-300 uppercase mb-1">{obs.section}</h5>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">{obs.observation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <button onClick={() => window.print()} className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Print Evaluation</button>
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

  useEffect(() => {
    // Reveal application when component mounts
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }
  }, []);

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) return setError("Analysis requires both PDF artifact files.");

    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    try {
      const toB64 = (f: File): Promise<string> => new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(f); 
        r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej;
      });

      const generated = await generateEvaluationReport(
        { name: mergedFile.name, data: await toB64(mergedFile), mimeType: mergedFile.type },
        { name: feedbackFile.name, data: await toB64(feedbackFile), mimeType: feedbackFile.type }
      );
      setReport(generated);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (e: any) {
      console.error(e);
      setError("AI Analysis encountered an error. Please ensure files are valid medical PDFs.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const reset = () => {
    setReport(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setMergedFile(null);
    setFeedbackFile(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl">🛡️</div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">AnatomyGuard</h1>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">AI Academic Evaluation</p>
          </div>
        </div>
        {report && <button onClick={reset} className="px-6 py-2.5 bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">New Scan</button>}
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {!report || status === ProcessingStatus.ANALYZING ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Academic Portal</h2>
               <p className="text-slate-500 font-medium">Verify human evaluator alignment using grounded AI vision.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/80 px-10 py-8 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800">Artifact Intake</h3>
              </div>
              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FileUpload id="m" label="Primary Reference" description="Paper + Key + Answers" onChange={setMergedFile} fileName={mergedFile?.name || null} />
                  <FileUpload id="f" label="Evaluation Feedback" description="Human Marks + Comments" onChange={setFeedbackFile} fileName={feedbackFile?.name || null} />
                </div>

                {error && (
                  <div className="p-5 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-2xl flex items-start space-x-3">
                    <p className="font-semibold">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleProcess} 
                  disabled={status === ProcessingStatus.ANALYZING || !mergedFile || !feedbackFile} 
                  className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-blue-950 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center space-x-4"
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing Medical Records...</span>
                    </>
                  ) : (
                    <span>Initiate AI Evaluation</span>
                  )}
                </button>
              </div>
              {status === ProcessingStatus.ANALYZING && <div className="h-1 bg-slate-100 relative overflow-hidden"><div className="h-full bg-blue-900 animate-[progress_2s_ease-in-out_infinite] w-[40%] absolute top-0 left-0"></div></div>}
            </div>
          </div>
        ) : <ReportDisplay report={report} />}
      </main>

      <style>{`
        @keyframes progress { 0% { left: -40%; } 100% { left: 100%; } }
      `}</style>
    </div>
  );
};

// --- RENDER ---

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
