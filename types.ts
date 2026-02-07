
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

// Added missing interfaces for ReportDisplay component
export interface FinalizedObservation {
  section: string;
  observation: string;
}

export interface ActionAction {
  task: string;
  status: string;
  evidence: string;
}

export interface EvaluationReport {
  examReference: string;
  evaluationType: string;
  aiModelRole: string;
  elaboratedGeneralisedFeedback: string;
  questionWiseFeedback: QuestionFeedback[];
  scoreVerification: ScoreVerification;
  // Added missing fields to resolve type errors in ReportDisplay.tsx
  finalizedFeedback: FinalizedObservation[];
  actionSummary: ActionAction[];
}
