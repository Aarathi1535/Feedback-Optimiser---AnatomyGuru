import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
// Import shared types from the corrected types.ts module
import { 
  ProcessingStatus, 
  EvaluationReport, 
  QuestionFeedback, 
  ScoreVerification, 
  AIObservation, 
  ActionSummary 
} from './types';

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
  // Always initialize GoogleGenAI with the required named parameter and the API key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use the recommended gemini-3-pro-preview model for complex text/reasoning tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { text: PROMPT_INSTRUCTION },
          { text: `Reference Files Provided: ${mergedFile.name}, ${feedbackFile.name}` },
          { inlineData: { data: mergedFile.data, mimeType: 'application/pdf' } },
          { inlineData: { data: feedbackFile.data, mimeType: 'application/pdf' } }
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
      // Using thinkingConfig for deep medical reasoning with gemini-3-pro-preview
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  // Extract the text output from the GenerateContentResponse object directly via the .text property
  const responseText = response.text;
  if (!responseText) throw new Error("The AI model failed to generate a response.");
  return JSON.parse(responseText.trim()) as EvaluationReport;
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
    <label htmlFor={id} className="text-sm font-bold text-slate-700 uppercase tracking-wide">{label}</label>
    <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${fileName ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' : 'border-slate-300 hover:border-indigo-400 bg-white shadow-sm'}`}>
      <input type="file" id={id} accept="application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        {fileName ? (
          <>
            <div className="w-12 h-12 bg-indigo-900 rounded-xl flex items-center justify-center text-white mb-1 shadow-lg transform scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-extrabold text-indigo-950 truncate max-w-[220px]">{fileName}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-1 border border-slate-100">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{description}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ReportDisplay: React.FC<{ report: EvaluationReport }> = ({ report }) => (
  <div className="w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
    {/* Hero Banner */}
    <div className="bg-indigo-950 text-white rounded-[2rem] p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full -mr-[20rem] -mt-[20rem] blur-[100px]"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-indigo-800/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 border border-indigo-700/50">Verification Protocol Activated</div>
          <h2 className="text-5xl font-black tracking-tighter leading-none">{report.examReference}</h2>
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest opacity-60">
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{report.evaluationType}</span>
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{report.aiModelRole}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-2">Final Validated Score</p>
          <div className="flex items-baseline justify-end">
            <span className="text-7xl font-black tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
            <span className="text-2xl font-black opacity-30 ml-2">PTS</span>
          </div>
        </div>
      </div>
    </div>

    {/* Summary Card */}
    <section className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden group">
      <div className="bg-slate-50/50 border-b border-slate-100 px-10 py-6 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center mr-4 shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          Executive Academic Synthesis
        </h3>
      </div>
      <div className="p-12 leading-[1.8] text-slate-700 text-xl font-medium italic border-l-[6px] border-indigo-900 bg-slate-50/30 m-10 rounded-2xl shadow-inner group-hover:bg-slate-50 transition-colors">
        "{report.generalisedFeedback}"
      </div>
    </section>

    {/* Primary Analysis Table */}
    <section className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          Detailed Alignment Audit
          <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-200">Question Wise</span>
        </h3>
      </div>
      <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
              <th className="p-8 w-24 text-center">Reference</th>
              <th className="p-8 w-36 text-center">Score Delta</th>
              <th className="p-8">Required Criteria (Key)</th>
              <th className="p-8">Student Contribution (OCR)</th>
              <th className="p-8 bg-indigo-50/30 text-indigo-950 border-l-4 border-indigo-900">AI Augmented Insight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.questionWiseFeedback.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-300 group">
                <td className="p-8 font-black text-slate-400 text-center text-lg group-hover:text-indigo-900 group-hover:scale-110 transition-transform">#{q.questionNo}</td>
                <td className="p-8 text-center">
                  <div className="inline-flex flex-col">
                    <span className="text-xl font-black text-slate-900 tabular-nums">{q.marksAwarded}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">OF {q.maxMarks}</span>
                  </div>
                </td>
                <td className="p-8 text-sm text-slate-500 italic max-w-xs leading-relaxed font-medium">{q.keyAnswerPoints}</td>
                <td className="p-8 text-sm text-slate-700 leading-relaxed max-w-sm font-semibold">{q.studentAnswerSummary}</td>
                <td className="p-8 bg-indigo-50/10 font-bold text-indigo-950 border-l-4 border-indigo-900/40 group-hover:border-indigo-900 leading-relaxed text-sm">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center mr-4 flex-shrink-0 mt-0.5 shadow-md">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    </div>
                    {q.aiFeedbackAddition}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {/* Verification Blocks */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <section className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-12">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Integrity Matrix</h3>
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">Calculated AI Sum</span>
            <span className="font-black text-4xl tabular-nums tracking-tighter">{report.scoreVerification.calculatedTotal}</span>
          </div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">Human Reported Total</span>
            <span className="font-black text-4xl tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
          </div>
          <div className={`mt-8 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center border-2 shadow-sm ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
             <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={report.scoreVerification.status === 'Correct' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
             Verification Status: {report.scoreVerification.status}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-[80px]"></div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-10">AI Pattern Observations</h4>
          <div className="space-y-8">
            {report.finalizedFeedback.slice(0, 3).map((obs, i) => (
              <div key={i} className="flex space-x-6 group/obs">
                <span className="text-indigo-500 font-black text-xl opacity-20 group-hover/obs:opacity-100 transition-opacity">0{i+1}</span>
                <div>
                  <h5 className="font-black text-[10px] text-indigo-300 uppercase tracking-widest mb-2">{obs.section}</h5>
                  <p className="text-base text-slate-400 leading-relaxed font-medium group-hover/obs:text-slate-200 transition-colors">{obs.observation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 relative z-10">
          <button onClick={() => window.print()} className="w-full px-8 py-4 bg-indigo-700 hover:bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]">Commit to Official Records</button>
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
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 500);
    }
  }, []);

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) return setError("System requires both Artifact Reference and Evaluator Feedback PDFs.");

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
      setError(e.message || "Extraction Protocol Failure. Ensure PDF integrity.");
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-900/20 rotate-3">🛡️</div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">AnatomyGuard</h1>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em] mt-2">Evaluation Verification Core</p>
          </div>
        </div>
        {report && (
          <button onClick={reset} className="px-8 py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-900 hover:text-white transition-all shadow-sm">
            Recalibrate Audit
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-16">
        {!report || status === ProcessingStatus.ANALYZING ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16 space-y-4">
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Academic Verification Portal</h2>
               <p className="text-slate-500 font-bold text-lg max-w-lg mx-auto leading-relaxed">Cross-analyze handwritten scripts against marking keys and human evaluator feedback.</p>
            </div>

            <div className="bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-12 py-10 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Artifact Intake</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Multi-Document Analysis Enabled</p>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </div>
              </div>
              <div className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <FileUpload id="m" label="Ref Reference" description="Question + Answer Key + Student Work" onChange={setMergedFile} fileName={mergedFile?.name || null} />
                  <FileUpload id="f" label="Human Audit" description="Teacher's Scored Sheets + Comments" onChange={setFeedbackFile} fileName={feedbackFile?.name || null} />
                </div>

                {error && (
                  <div className="p-6 bg-rose-50 border border-rose-100 text-rose-800 text-sm font-bold rounded-[1.5rem] flex items-start space-x-4 shadow-sm animate-shake">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p>{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleProcess} 
                  disabled={status === ProcessingStatus.ANALYZING || !mergedFile || !feedbackFile} 
                  className="w-full py-6 bg-indigo-900 text-white rounded-[1.75rem] font-black text-xl shadow-[0_20px_40px_-10px_rgba(49,46,129,0.3)] hover:bg-indigo-950 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center space-x-5 hover:-translate-y-1"
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="tracking-tight uppercase text-base">Running Verification Protocol...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight uppercase text-base">Initiate AI Audit Analysis</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </div>
              {status === ProcessingStatus.ANALYZING && (
                <div className="h-1.5 bg-slate-100 relative overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out_infinite] w-[40%] absolute top-0 left-0 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                </div>
              )}
            </div>
          </div>
        ) : <ReportDisplay report={report} />}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-16 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Medical Academic Audit Platform v1.0.4 - Secure Protocol</p>
      </footer>

      <style>{`
        @keyframes progress { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

// --- RENDER ---

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
