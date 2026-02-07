// Shared types for the medical academic evaluation assistant
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
