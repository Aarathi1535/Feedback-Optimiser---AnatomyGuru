
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { EvaluationReport, ProcessingStatus } from './types';

// --- EVALUATION SERVICE PROXY ---

async function runMedicalEvaluation(
  artifact: { name: string; data: string; mimeType: string },
  humanFeedback: { name: string; data: string; mimeType: string }
): Promise<EvaluationReport> {
  const response = await fetch('/.netlify/functions/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artifact, humanFeedback }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `System Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// --- UI COMPONENTS ---

const FileInput: React.FC<{
  label: string;
  description: string;
  onChange: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
}> = ({ label, description, onChange, selectedFile, accept }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
    <div className={`relative border-2 border-dashed rounded-[1.5rem] p-8 transition-all duration-300 ${selectedFile ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' : 'border-slate-200 hover:border-indigo-400 bg-white shadow-sm'}`}>
      <input 
        type="file" 
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
      />
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        {selectedFile ? (
          <>
            <div className="w-12 h-12 bg-indigo-950 rounded-xl flex items-center justify-center text-white mb-1 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-bold text-indigo-950 truncate max-w-[200px]">{selectedFile.name}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-1 border border-slate-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">{description}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ReportUI: React.FC<{ report: EvaluationReport }> = ({ report }) => (
  <div className="w-full space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="bg-indigo-950 text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-500/10 rounded-full -mr-[25rem] -mt-[25rem] blur-[120px]"></div>
      <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-end gap-12">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-indigo-800/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 border border-indigo-700/50">Verification Protocol Success</div>
          <h2 className="text-5xl font-black tracking-tighter leading-none">{report.examReference}</h2>
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
            <span>{report.evaluationType}</span>
            <span className="font-mono text-indigo-300">{report.aiModelRole}</span>
          </div>
        </div>
        <div className="text-right border-l border-white/10 pl-12">
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2">Validated Final Grade</p>
          <div className="flex items-baseline justify-end">
            <span className="text-8xl font-black tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
            <span className="text-2xl font-black opacity-30 ml-4 tracking-[0.2em]">PTS</span>
          </div>
        </div>
      </div>
    </div>

    <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden group">
      <div className="bg-indigo-900 px-10 py-6 flex items-center justify-between border-b border-indigo-800">
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center">
          <svg className="w-5 h-5 mr-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ELABORATED ACADEMIC SYNTHESIS
        </h3>
      </div>
      <div className="p-12 leading-[2.1] text-slate-700 text-xl font-medium italic border-l-[10px] border-indigo-900 bg-slate-50/30 m-8 rounded-3xl shadow-inner group-hover:bg-white transition-all">
        "{report.elaboratedGeneralisedFeedback}"
      </div>
    </section>

    <section className="space-y-6">
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center px-2">
        Augmented Audit Analysis
        <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-200">Refined Data</span>
      </h3>
      <div className="overflow-x-auto rounded-[3.5rem] border border-slate-200 shadow-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
              <th className="p-10 w-24 text-center">Ref</th>
              <th className="p-10 w-32 text-center">Audit Score</th>
              <th className="p-10 w-80">Human Evaluator Insight</th>
              <th className="p-10 w-80">Student Script Extract (OCR)</th>
              <th className="p-10 bg-indigo-50/50 text-indigo-950 border-l-4 border-indigo-900">AI Enhancement Suggestion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.questionWiseFeedback.map((q, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-300 group">
                <td className="p-10 font-black text-slate-400 text-center text-xl group-hover:text-indigo-900">{q.questionNo}</td>
                <td className="p-10 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-900">{q.marksAwarded}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">OF {q.maxMarks}</span>
                  </div>
                </td>
                <td className="p-10 text-sm text-slate-600 font-bold leading-relaxed">{q.humanFeedback}</td>
                <td className="p-10 text-sm text-slate-500 italic leading-relaxed">{q.studentAnswerSummary}</td>
                <td className="p-10 bg-indigo-50/20 font-black text-indigo-900 border-l-4 border-indigo-900/30 group-hover:border-indigo-900 leading-relaxed text-sm">
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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <section className="bg-white rounded-[3rem] border border-slate-200 shadow-xl p-14">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12">Score Integrity Audit</h3>
        <div className="space-y-10">
          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Calculated AI Sum</span>
            <span className="font-black text-5xl tabular-nums tracking-tighter">{report.scoreVerification.calculatedTotal}</span>
          </div>
          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Reported Teacher Total</span>
            <span className="font-black text-5xl tabular-nums tracking-tighter">{report.scoreVerification.reportedTotal}</span>
          </div>
          <div className={`mt-10 py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center border-4 ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
             Audit Status: {report.scoreVerification.status}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 rounded-[3rem] p-14 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full -ml-40 -mt-40 blur-[120px]"></div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-12">Anatomical Observations</h4>
          <div className="space-y-8">
            {report.finalizedFeedback.map((obs, i) => (
              <div key={i} className="flex space-x-6">
                <span className="text-indigo-500 font-black text-2xl opacity-40">0{i+1}</span>
                <div>
                  <h5 className="font-black text-[10px] text-indigo-300 uppercase tracking-widest mb-1">{obs.section}</h5>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">{obs.observation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14">
          <button onClick={() => window.print()} className="w-full px-10 py-6 bg-indigo-700 hover:bg-indigo-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.5em] transition-all shadow-xl active:scale-[0.98]">Export Audit Certificate</button>
        </div>
      </section>
    </div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [artifact, setArtifact] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<File | null>(null);
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
    if (!artifact || !feedback) return setError("Verification requires both Artifact Core and Evaluator Feedback.");

    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    try {
      const toB64 = (f: File): Promise<string> => new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(f); 
        r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej;
      });

      const generated = await runMedicalEvaluation(
        { name: artifact.name, data: await toB64(artifact), mimeType: artifact.type },
        { name: feedback.name, data: await toB64(feedback), mimeType: feedback.type }
      );
      setReport(generated);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "A system audit failure occurred. Check Netlify environment variables.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const reset = () => {
    setReport(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setArtifact(null);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-10 h-28 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-900/20">🛡️</div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">AnatomyGuard</h1>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.5em] mt-3">Med-Edu Verification Engine</p>
          </div>
        </div>
        {report && (
          <button onClick={reset} className="px-10 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-900 hover:text-white transition-all shadow-sm">
            Recalibrate System
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-20">
        {!report || status === ProcessingStatus.ANALYZING ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-20 space-y-6">
               <h2 className="text-7xl font-black text-slate-900 tracking-tighter">Academic Audit</h2>
               <p className="text-slate-500 font-bold text-xl max-w-lg mx-auto leading-relaxed italic">
                 "Providing grounded, audit-safe feedback for medical anatomy education."
               </p>
            </div>

            <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-16 py-12 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">System Protocol Intake</h3>
              </div>
              <div className="p-16 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <FileInput 
                    label="Artifact Core" 
                    description="Paper + Key + Student Script (PDF)" 
                    onChange={setArtifact} 
                    selectedFile={artifact} 
                    accept=".pdf"
                  />
                  <FileInput 
                    label="Human Evaluator Feedback" 
                    description="Manual Scored Sheets (PDF, Word)" 
                    onChange={setFeedback} 
                    selectedFile={feedback} 
                    accept=".pdf,.doc,.docx"
                  />
                </div>

                {error && (
                  <div className="p-8 bg-rose-50 border border-rose-100 text-rose-800 text-sm font-bold rounded-[2rem] flex items-start space-x-5 shadow-sm animate-shake">
                    <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleProcess} 
                  disabled={status === ProcessingStatus.ANALYZING || !artifact || !feedback} 
                  className="w-full py-9 bg-indigo-900 text-white rounded-[2.75rem] font-black text-2xl shadow-xl hover:bg-indigo-950 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center space-x-6 hover:-translate-y-1"
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <div className="w-8 h-8 border-[5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="tracking-tight uppercase text-lg">Running Audit Sequence...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight uppercase text-lg">Initiate Verification Audit</span>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </div>
              {status === ProcessingStatus.ANALYZING && (
                <div className="h-4 bg-slate-100 relative overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out_infinite] w-[40%] absolute top-0 left-0 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
                </div>
              )}
            </div>
          </div>
        ) : <ReportUI report={report} />}
      </main>

      <footer className="max-w-7xl mx-auto px-10 py-32 text-center border-t border-slate-100 mt-20">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[1em]">AnatomyGuard Secure Protocol v1.8.4-PRO-SECURE</p>
      </footer>
    </div>
  );
};

// --- RENDER ---

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
