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

interface EvaluationReport {
  examReference: string;
  evaluationType: string;
  aiModelRole: string;
  generalisedFeedback: string;
  elaboratedHumanFeedback: string;
  questionWiseFeedback: QuestionFeedback[];
  scoreVerification: ScoreVerification;
  finalizedFeedback: AIObservation[];
}

// --- SERVICES ---

const PROMPT_INSTRUCTION = `
You are an AI academic evaluation assistant for medical anatomy education.
Your task is to analyze two PDF documents and provide a highly professional, augmented feedback report.

DOCUMENTS PROVIDED:
1. "Academic Artifacts": Question paper, Official answer key, and Student's handwritten answer sheet.
2. "Human Evaluator Report": Marks and comments already provided by a human teacher.

STRICT PROTOCOL:
A. DATA EXTRACTION: Extract the marks and feedback per question exactly as written by the human teacher in Document 2.
B. AI ENHANCEMENT: Review the student's answer sheet in Document 1 against the marking scheme. For every question, add a ONE-LINE "AI Feedback Addition". This should be a concise suggestion (e.g., "The student failed to label the sympathetic chain in the posterior mediastinum diagram" or "Excellent recall of the branches of the internal iliac artery").
C. FEEDBACK ELABORATION: Take the human evaluator's generalized overall feedback from Document 2 and ELABORATE on it. Transform it into a 3-5 sentence professional academic synthesis that captures the core sentiment but adds professional depth.
D. SCORE AUDIT: Recalculate the sum of individual question marks and compare it to the reported total in Document 2.

OUTPUT: Return a strictly valid JSON object.
`;

async function generateEvaluationReport(
  mergedFile: { name: string; data: string; mimeType: string },
  feedbackFile: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  // Use a safer way to access process.env to avoid "process is not defined" error in some environments
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).process?.env?.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { text: PROMPT_INSTRUCTION },
          { text: `Academic Files: ${mergedFile.name}. Human Feedback: ${feedbackFile.name}.` },
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
          generalisedFeedback: { type: Type.STRING, description: "The original brief human summary" },
          elaboratedHumanFeedback: { type: Type.STRING, description: "The 3-5 sentence elaborated academic synthesis" },
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
          }
        },
        required: ["examReference", "evaluationType", "aiModelRole", "generalisedFeedback", "elaboratedHumanFeedback", "questionWiseFeedback", "scoreVerification", "finalizedFeedback"]
      },
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  const responseText = response.text;
  if (!responseText) throw new Error("The AI model failed to generate a response.");
  
  try {
    return JSON.parse(responseText.trim()) as EvaluationReport;
  } catch (err) {
    console.error("JSON Parse Error:", responseText);
    throw new Error("Failed to parse AI response. Please try again.");
  }
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
    <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${fileName ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-slate-300 hover:border-indigo-400 bg-white shadow-sm'}`}>
      <input type="file" id={id} accept="application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        {fileName ? (
          <>
            <div className="w-12 h-12 bg-indigo-900 rounded-xl flex items-center justify-center text-white mb-1 shadow-lg">
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
  <div className="w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
    {/* Header Banner */}
    <div className="bg-indigo-950 text-white rounded-[2rem] p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full -mr-[20rem] -mt-[20rem] blur-[100px]"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-indigo-800/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 border border-indigo-700/50">Audit Protocol: Active</div>
          <h2 className="text-5xl font-black tracking-tighter leading-none">{report.examReference}</h2>
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest opacity-60">
            <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{report.evaluationType}</span>
            <span className="flex items-center font-mono">{report.aiModelRole}</span>
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

    {/* Elaborated Feedback Section */}
    <section className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden group">
      <div className="bg-indigo-900 px-10 py-6 flex items-center justify-between">
        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center">
          <svg className="w-5 h-5 mr-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Professional Academic Synthesis
        </h3>
      </div>
      <div className="p-12 leading-[1.8] text-slate-700 text-xl font-medium italic border-l-[6px] border-indigo-900 bg-slate-50/50 m-8 rounded-2xl shadow-inner group-hover:bg-slate-50 transition-colors">
        "{report.elaboratedHumanFeedback}"
      </div>
    </section>

    {/* Enhanced Question-Wise Table */}
    <section className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          Augmented Alignment Analysis
          <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-200">AI SUPPLEMENTED</span>
        </h3>
      </div>
      <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 shadow-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
              <th className="p-8 w-24 text-center">Q#</th>
              <th className="p-8 w-32 text-center">Marks</th>
              <th className="p-8 w-64">Human Evaluator Insight</th>
              <th className="p-8 w-72">Anatomical Content (OCR)</th>
              <th className="p-8 bg-indigo-50/50 text-indigo-950 border-l-4 border-indigo-900">AI Concieved Suggestion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.questionWiseFeedback.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-300">
                <td className="p-8 font-black text-slate-400 text-center text-lg">{q.questionNo}</td>
                <td className="p-8 text-center">
                  <span className="inline-flex flex-col">
                    <span className="text-xl font-black text-slate-900">{q.marksAwarded}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">/ {q.maxMarks}</span>
                  </span>
                </td>
                <td className="p-8 text-sm text-slate-600 font-semibold leading-relaxed">{q.humanFeedback}</td>
                <td className="p-8 text-sm text-slate-500 italic leading-relaxed">{q.studentAnswerSummary}</td>
                <td className="p-8 bg-indigo-50/20 font-bold text-indigo-900 border-l-4 border-indigo-900 leading-relaxed text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-indigo-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
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
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Score Integrity Matrix</h3>
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Calculated AI Sum</span>
            <span className="font-black text-4xl tabular-nums">{report.scoreVerification.calculatedTotal}</span>
          </div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Reported Teacher Total</span>
            <span className="font-black text-4xl tabular-nums">{report.scoreVerification.reportedTotal}</span>
          </div>
          <div className={`mt-8 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center border-2 ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
             Audit Status: {report.scoreVerification.status}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mt-32 blur-[80px]"></div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-10">AI Observed Patterns</h4>
          <div className="space-y-8">
            {report.finalizedFeedback.map((obs, i) => (
              <div key={i} className="flex space-x-6 group">
                <span className="text-indigo-500 font-black text-xl opacity-30 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                <div>
                  <h5 className="font-black text-[10px] text-indigo-300 uppercase tracking-widest mb-2">{obs.section}</h5>
                  <p className="text-base text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{obs.observation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12">
          <button onClick={() => window.print()} className="w-full px-8 py-4 bg-indigo-700 hover:bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-[0.98]">Export Audit Report</button>
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
    // Robust loader removal script
    const loader = document.getElementById('loader');
    const root = document.getElementById('root');
    
    // Safety timeout to ensure loader goes away even if there's an error
    const forceRemove = setTimeout(() => {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    }, 1500);

    return () => clearTimeout(forceRemove);
  }, []);

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) {
      return setError("Artifact Repository and Evaluator Feedback are both mandatory.");
    }

    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    try {
      const toB64 = (f: File): Promise<string> => new Promise((res, rej) => {
        const r = new FileReader(); 
        r.readAsDataURL(f); 
        r.onload = () => res((r.result as string).split(',')[1]); 
        r.onerror = rej;
      });

      const generated = await generateEvaluationReport(
        { name: mergedFile.name, data: await toB64(mergedFile), mimeType: mergedFile.type },
        { name: feedbackFile.name, data: await toB64(feedbackFile), mimeType: feedbackFile.type }
      );
      setReport(generated);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "A system protocol failure has occurred. Verify your API credentials and PDF formats.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-24 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-900/20">🛡️</div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">AnatomyGuard</h1>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em] mt-2">Med-Edu Verification Engine</p>
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
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Academic Verification</h2>
               <p className="text-slate-500 font-bold text-lg max-w-lg mx-auto leading-relaxed">
                 Leverage AI to cross-analyze student anatomical work against teacher evaluations for grounding and integrity.
               </p>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-12 py-10 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Protocol Intake</h3>
              </div>
              <div className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <FileUpload id="m" label="Artifact Core" description="Question + Key + Student Script" onChange={setMergedFile} fileName={mergedFile?.name || null} />
                  <FileUpload id="f" label="Human Feedback" description="Teacher's Scored sheets" onChange={setFeedbackFile} fileName={feedbackFile?.name || null} />
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
                  className="w-full py-6 bg-indigo-900 text-white rounded-[1.75rem] font-black text-xl shadow-xl hover:bg-indigo-950 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center space-x-5 hover:-translate-y-1"
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="tracking-tight uppercase text-base font-bold">Processing Verification...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight uppercase text-base font-bold">Initiate Audit Sequence</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </div>
              {status === ProcessingStatus.ANALYZING && (
                <div className="h-2 bg-slate-100 relative overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out_infinite] w-[40%] absolute top-0 left-0 shadow-lg shadow-indigo-500/50"></div>
                </div>
              )}
            </div>
          </div>
        ) : <ReportDisplay report={report} />}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-20 text-center border-t border-slate-100 mt-20">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">AnatomyGuard Protocol v1.2.0-PRO-SECURE</p>
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

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
