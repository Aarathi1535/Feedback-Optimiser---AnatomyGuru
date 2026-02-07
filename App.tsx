
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ReportDisplay from './components/ReportDisplay';
import { EvaluationReport, ProcessingStatus } from './types';
import { generateEvaluationReport } from './services/geminiService';

const App: React.FC = () => {
  const [mergedFile, setMergedFile] = useState<File | null>(null);
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleProcess = async () => {
    if (!mergedFile || !feedbackFile) {
      setError("Please upload both required PDF files.");
      return;
    }

    setStatus(ProcessingStatus.ANALYZING);
    setError(null);
    setReport(null);

    try {
      const mergedBase64 = await fileToBase64(mergedFile);
      const feedbackBase64 = await fileToBase64(feedbackFile);

      const generatedReport = await generateEvaluationReport(
        { name: mergedFile.name, data: mergedBase64, mimeType: mergedFile.type },
        { name: feedbackFile.name, data: feedbackBase64, mimeType: feedbackFile.type }
      );

      setReport(generatedReport);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleReset = () => {
    setMergedFile(null);
    setFeedbackFile(null);
    setReport(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">AnatomyGuard</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Evaluation Assistant</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {report && (
              <button 
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Evaluation
              </button>
            )}
            <div className="hidden sm:block text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              Session: Medical Anatomy v1.2
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Evaluation Analysis</h2>
          <p className="mt-2 text-lg text-slate-600 max-w-2xl">
            Upload student artifacts and human feedback to generate an augmented feedback report with grounded anatomy observations and score verification.
          </p>
        </div>

        {status === ProcessingStatus.IDLE || status === ProcessingStatus.ERROR || status === ProcessingStatus.ANALYZING ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-4xl mx-auto">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Upload Evaluation Documents</h3>
              <p className="text-sm text-slate-500">Ensure PDFs are clearly readable for optimal AI extraction.</p>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUpload
                  id="merged-pdf"
                  label="Merged PDF (Primary Reference)"
                  description="Question Paper + Answer Key + Student Answer Sheet"
                  onChange={setMergedFile}
                  fileName={mergedFile?.name || null}
                />
                <FileUpload
                  id="feedback-pdf"
                  label="Human Feedback PDF"
                  description="Human Feedback + Marks Awarded + Total Score"
                  onChange={setFeedbackFile}
                  fileName={feedbackFile?.name || null}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold">Evaluation Warning</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 italic text-center sm:text-left">
                  Files are processed locally and only sent to Gemini for analysis.
                </p>
                <button
                  onClick={handleProcess}
                  disabled={status === ProcessingStatus.ANALYZING || !mergedFile || !feedbackFile}
                  className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-3 ${
                    status === ProcessingStatus.ANALYZING 
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-blue-900 text-white hover:bg-blue-950 active:scale-95'
                  }`}
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing Documents...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate AI-Augmented Report</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {status === ProcessingStatus.ANALYZING && (
              <div className="bg-blue-50 p-6 flex flex-col items-center justify-center space-y-4">
                <p className="text-blue-900 font-medium animate-pulse">This may take up to 60 seconds for complex PDFs...</p>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-900 h-full animate-[progress_20s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          report && <ReportDisplay report={report} />
        )}
      </main>

      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
