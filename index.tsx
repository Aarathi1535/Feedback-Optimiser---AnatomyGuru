import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---

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

interface EvaluationReport {
  examReference: string;
  evaluationType: string;
  aiModelRole: string;
  elaboratedGeneralisedFeedback: string;
  questionWiseFeedback: QuestionFeedback[];
  scoreVerification: ScoreVerification;
}

// --- SERVICES ---

const PROMPT_INSTRUCTION = `
You are an AI academic evaluation assistant for medical anatomy education.
Your task is to analyze documents and provide a professional augmented feedback report.

INPUTS:
1. Academic Artifacts (Question paper, Key, Student script).
2. Human Evaluator Report (Manual marks and brief teacher comments).

TASK:
- EXTRACT: Take individual marks and comments per question from Document 2.
- ENHANCE: Cross-check Document 1 (Student script) vs Marking Key. Add a concise ONE-LINE "AI Feedback Addition" per question with a specific anatomical suggestion or clarification.
- ELABORATE: Take the human evaluator's general overall feedback from Document 2 and transform it into a formal 3-5 sentence "Elaborated Generalised Feedback" that adds professional academic depth while staying true to the human intent.
- AUDIT: Recalculate the sum of marks and compare with the human reported total.

OUTPUT: Return strictly valid JSON matching the schema.
`;

async function generateEvaluationReport(
  mergedFile: { name: string; data: string; mimeType: string },
  feedbackFile: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  // Directly access process.env.API_KEY as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { text: PROMPT_INSTRUCTION },
          { text: `Files: ${mergedFile.name}, ${feedbackFile.name}` },
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
          }
        },
        required: ["examReference", "evaluationType", "aiModelRole", "elaboratedGeneralisedFeedback", "questionWiseFeedback", "scoreVerification"]
      },
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI response was empty.");
  return JSON.parse(text.trim());
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
    <label htmlFor={id} className="text-sm font-bold text-slate-700 uppercase tracking-widest">{label}</label>
    <div className={`relative border-2 border-dashed rounded-[1.5rem] p-8 transition-all duration-300 ${fileName ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-slate-200 hover:border-indigo-400 bg-white shadow-sm'}`}>
      <input 
        type="file" 
        id={id} 
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        onChange={(e) => onChange(e.target.files?.[0] || null)} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
      />
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        {fileName ? (
          <>
            <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-white mb-1 shadow-xl transform scale-105">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-black text-indigo-950 truncate max-w-[200px]">{fileName}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-1 border border-slate-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{description}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ReportDisplay: React.FC<{ report: EvaluationReport }> = ({ report }) => (
  <div className="w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="bg-indigo-950 text-white rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full -mr-[20rem] -mt-[20rem] blur-[100px]"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-indigo-800/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 border border-indigo-700/50">Audit Sequence Completed</div>
          <h2 className="text-5xl font-black tracking-tighter leading-none">{report.examReference}</h2>
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{report.evaluationType}</span>
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{report.aiModelRole}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2">Validated Final Grade</p>
          <div className="flex items-baseline justify-end">
            <span className="text-7xl font-black tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
            <span className="text-2xl font-black opacity-30 ml-2">PTS</span>
          </div>
        </div>
      </div>
    </div>

    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden group">
      <div className="bg-indigo-900 px-10 py-6 border-b border-indigo-800 flex items-center">
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center">
          <svg className="w-5 h-5 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ELABORATED ACADEMIC SYNTHESIS
        </h3>
      </div>
      <div className="p-12 leading-[2] text-slate-700 text-xl font-medium italic border-l-[8px] border-indigo-900 bg-slate-50/50 m-10 rounded-3xl shadow-inner group-hover:bg-slate-50 transition-colors">
        "{report.elaboratedGeneralisedFeedback}"
      </div>
    </section>

    <section className="space-y-8">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center px-2">
        Augmented Audit Analysis
        <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-200">Enriched Data</span>
      </h3>
      <div className="overflow-x-auto rounded-[3rem] border border-slate-200 shadow-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
              <th className="p-10 w-24 text-center">Ref</th>
              <th className="p-10 w-32 text-center">Score</th>
              <th className="p-10 w-72">Evaluator Comments</th>
              <th className="p-10 w-72">Script Content</th>
              <th className="p-10 bg-indigo-50/50 text-indigo-950 border-l-4 border-indigo-900">AI Enhancement (Suggestion)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.questionWiseFeedback.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-300 group">
                <td className="p-10 font-black text-slate-400 text-center text-xl">{q.questionNo}</td>
                <td className="p-10 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900">{q.marksAwarded}</span>
                    <span className="text-[10px] font-black text-slate-400">OF {q.maxMarks}</span>
                  </div>
                </td>
                <td className="p-10 text-sm text-slate-600 font-bold leading-relaxed">{q.humanFeedback}</td>
                <td className="p-10 text-sm text-slate-500 italic leading-relaxed">{q.studentAnswerSummary}</td>
                <td className="p-10 bg-indigo-50/20 font-black text-indigo-900 border-l-4 border-indigo-900/40 group-hover:border-indigo-900 transition-colors leading-relaxed text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-1 text-indigo-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    {q.aiFeedbackAddition}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section className="bg-white rounded-[3rem] border border-slate-200 shadow-xl p-14">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] mb-12">Score Integrity Audit</h3>
        <div className="space-y-10">
          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">AI Calculated Sum</span>
            <span className="font-black text-5xl tabular-nums tracking-tighter">{report.scoreVerification.calculatedTotal}</span>
          </div>
          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Human Reported Total</span>
            <span className="font-black text-5xl tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
          </div>
          <div className={`mt-10 py-8 rounded-3xl font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center border-4 ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
             Audit Status: {report.scoreVerification.status}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-[3rem] p-14 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mt-32 blur-[100px]"></div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-12">Critical Audit Patterns</h4>
          <div className="space-y-10">
            <div className="flex space-x-8">
              <span className="text-indigo-500 font-black text-2xl opacity-40">01</span>
              <div>
                <h5 className="font-black text-[10px] text-indigo-300 uppercase tracking-widest mb-2">Grounding Source</h5>
                <p className="text-base text-slate-400 leading-relaxed font-semibold">Comparison verified against medical anatomical marking schemes.</p>
              </div>
            </div>
            <div className="flex space-x-8">
              <span className="text-indigo-500 font-black text-2xl opacity-40">02</span>
              <div>
                <h5 className="font-black text-[10px] text-indigo-300 uppercase tracking-widest mb-2">Audit Safety</h5>
                <p className="text-base text-slate-400 leading-relaxed font-semibold">Integrity audit identifies discrepancies in manual mark summation.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14">
          <button onClick={() => window.print()} className="w-full px-10 py-6 bg-indigo-700 hover:bg-indigo-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-[0.98]">Commit Audit Record</button>
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
    // Robust loader removal to prevent infinite "Initializing" on Netlify
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => { if (loader.parentNode) loader.remove(); }, 500);
      }, 500);
    }
  }, []);

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) return setError("Analysis requires both Artifact Repository and Human Feedback files.");

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
      setError(e.message || "Extraction Protocol Failure. Please check your files.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-10 h-28 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-900/20 rotate-3 transition-transform hover:rotate-0">🛡️</div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">AnatomyGuard</h1>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.5em] mt-3">Advanced Academic Audit Protocol</p>
          </div>
        </div>
        {report && (
          <button onClick={reset} className="px-10 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-900 hover:text-white transition-all shadow-sm">
            Recalibrate
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-20">
        {!report || status === ProcessingStatus.ANALYZING ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-20 space-y-6">
               <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Academic Verification</h2>
               <p className="text-slate-500 font-bold text-xl max-w-lg mx-auto leading-relaxed">AI-enhanced cross-analysis of anatomical scripts vs human evaluation for grounded integrity.</p>
            </div>

            <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-16 py-12 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Artifact & Feedback Intake</h3>
              </div>
              <div className="p-16 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <FileUpload id="m" label="Artifact Repository" description="Question + Key + Student Script (PDF)" onChange={setMergedFile} fileName={mergedFile?.name || null} />
                  <FileUpload id="f" label="Evaluator Feedback" description="Human Marks + Comments (PDF/Word)" onChange={setFeedbackFile} fileName={feedbackFile?.name || null} />
                </div>

                {error && (
                  <div className="p-8 bg-rose-50 border border-rose-100 text-rose-800 text-sm font-bold rounded-[2rem] flex items-start space-x-5 shadow-sm animate-shake">
                    <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleProcess} 
                  disabled={status === ProcessingStatus.ANALYZING || !mergedFile || !feedbackFile} 
                  className="w-full py-8 bg-indigo-900 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_30px_60px_-15px_rgba(49,46,129,0.3)] hover:bg-indigo-950 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center space-x-6 hover:-translate-y-1"
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <div className="w-8 h-8 border-[5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="tracking-tight uppercase text-lg">Running Audit Sequence...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight uppercase text-lg">Initiate Evaluation Audit</span>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </div>
              {status === ProcessingStatus.ANALYZING && (
                <div className="h-3 bg-slate-100 relative overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out_infinite] w-[40%] absolute top-0 left-0 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
                </div>
              )}
            </div>
          </div>
        ) : <ReportDisplay report={report} />}
      </main>

      <footer className="max-w-7xl mx-auto px-10 py-32 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">AnatomyGuard Secure Protocol v1.5.0-PRO-SECURE</p>
      </footer>
    </div>
  );
};

// --- RENDER ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
