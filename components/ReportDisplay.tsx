
import React from 'react';
import { EvaluationReport } from '../types';

interface ReportDisplayProps {
  report: EvaluationReport;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  return (
    <div className="w-full space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-blue-950 text-white rounded-xl p-8 shadow-xl border-l-4 border-blue-400">
        <h2 className="text-xl font-bold mb-4 border-b border-blue-900 pb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.414l4.586 4.586a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          FEEDBACK REPORT HEADER
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mono text-sm opacity-90">
          <div>
            <p className="font-bold text-slate-400 uppercase text-[10px]">Exam Reference File</p>
            <p className="text-blue-300 truncate">{report.examReference || "Merged PDF filename not provided."}</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase text-[10px]">Evaluation Type</p>
            <p>{report.evaluationType}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-bold text-slate-400 uppercase text-[10px]">AI Model Role</p>
            <p className="italic text-slate-300">{report.aiModelRole}</p>
          </div>
        </div>
      </div>

      {/* Elaborated Generalised Feedback */}
      <section className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden">
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ELABORATED GENERALISED FEEDBACK
          </h3>
          <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest bg-blue-800 px-2 py-1 rounded">AI Enhanced</span>
        </div>
        <div className="p-8 text-slate-700 leading-relaxed italic border-l-4 border-blue-900 m-6 bg-slate-50">
          {report.generalisedFeedback}
        </div>
      </section>

      {/* Table 1: Question-wise Feedback */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm">1</span>
            QUESTION-WISE ALIGNMENT ANALYSIS
          </h3>
          <div className="flex items-center space-x-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="flex items-center"><span className="w-2 h-2 bg-slate-100 border border-slate-200 mr-1"></span> Human</span>
            <span className="flex items-center"><span className="w-2 h-2 bg-blue-50 border border-blue-100 mr-1"></span> AI Suggested</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-lg bg-white">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                <th className="p-4 border-r border-slate-200 w-16 text-center">No</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">Max</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">Human Mark</th>
                <th className="p-4 border-r border-slate-200 w-64">Marking Scheme (Key Points)</th>
                <th className="p-4 border-r border-slate-200 w-64">Student Content (OCR)</th>
                <th className="p-4 border-r border-slate-200 w-64">Human Evaluator Feedback</th>
                <th className="p-4 bg-blue-50/50 text-blue-950 border-l-2 border-blue-900">AI Feedback Addition (Suggestion)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {report.questionWiseFeedback.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 border-r border-slate-200 font-bold text-center bg-slate-50/30">{q.questionNo}</td>
                  <td className="p-4 border-r border-slate-200 text-center font-medium text-slate-500">{q.maxMarks}</td>
                  <td className="p-4 border-r border-slate-200 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100">
                      {q.marksAwarded}
                    </span>
                  </td>
                  <td className="p-4 border-r border-slate-200 text-slate-500 italic leading-relaxed text-xs">
                    {q.keyAnswerPoints}
                  </td>
                  <td className="p-4 border-r border-slate-200 text-slate-700 leading-relaxed">
                    {q.studentAnswerSummary}
                  </td>
                  <td className="p-4 border-r border-slate-200 text-slate-700 font-medium">
                    {q.humanFeedback}
                  </td>
                  <td className="p-4 bg-blue-50/20 font-semibold text-blue-900 border-l-2 border-blue-900 leading-relaxed">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-800 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {q.aiFeedbackAddition}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: Score Verification */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm">2</span>
          SCORE INTEGRITY AUDIT
        </h3>
        <div className="max-w-2xl rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Metric</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 text-sm font-medium text-slate-600">Calculated Total (Sum of Q-wise Marks)</td>
                <td className="p-4 text-sm font-black text-blue-900">{report.scoreVerification.calculatedTotal}</td>
              </tr>
              <tr>
                <td className="p-4 text-sm font-medium text-slate-600">Reported Total (from Feedback PDF)</td>
                <td className="p-4 text-sm font-black text-blue-900">{report.scoreVerification.reportedTotal}</td>
              </tr>
              <tr>
                <td className="p-4 text-sm font-medium text-slate-600">Verification Status</td>
                <td className="p-4">
                  <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${report.scoreVerification.status === 'Correct' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {report.scoreVerification.status}
                  </span>
                </td>
              </tr>
              {report.scoreVerification.discrepancyExplanation && (
                <tr className="bg-rose-50/50">
                  <td className="p-4 text-sm font-bold text-rose-700 uppercase text-[10px]">Audit Flag</td>
                  <td className="p-4 text-sm text-rose-600 font-medium italic">
                    {report.scoreVerification.discrepancyExplanation}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 3: AI Finalized Feedback Report */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm">3</span>
          AI FEEDBACK SUMMARY & PATTERNS
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {report.finalizedFeedback.map((obs, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] mb-3">{obs.section}</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {obs.observation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table 4: AI Action Summary */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm">4</span>
          AI COMPLIANCE CHECKLIST
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">AI Task Pipeline</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Verification</th>
                <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Grounding Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.actionSummary.map((action, idx) => (
                <tr key={idx} className="text-sm">
                  <td className="p-4 text-slate-700 font-medium">{action.task}</td>
                  <td className="p-4">
                    <span className="text-emerald-600 flex items-center font-black text-[10px] uppercase">
                      <svg className="w-4 h-4 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      {action.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 italic text-xs">{action.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Readiness Statements */}
      <div className="bg-blue-950 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
             <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
             <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
           </svg>
        </div>
        <div className="relative z-10">
          <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Export Status: Ready</h4>
          <p className="text-slate-300 text-sm mb-6 max-w-lg">
            This audit report is normalized for medical academic records. It provides grounded secondary verification of student performance vs marking standards.
          </p>
          <div className="flex space-x-3">
             <div className="bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-800 text-[10px] font-bold uppercase tracking-widest text-blue-200">PDF Normal</div>
             <div className="bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-800 text-[10px] font-bold uppercase tracking-widest text-blue-200">DOCX Structured</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
