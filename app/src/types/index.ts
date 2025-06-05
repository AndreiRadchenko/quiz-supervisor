export interface AppContextType {
  seatNumber: number | null;
  serverIP: string | null;
  locale: 'en' | 'uk';
  setSeatNumber: (seat: number | null) => void;
  setServerIP: (ip: string | null) => void;
  setLocale: (locale: 'en' | 'uk') => void;
}

// WebSocket Broadcast States from Server
export type BroadcastState =
  | 'QUESTION_PRE'
  | 'QUESTION_OPEN'
  | 'QUESTION_CLOSED'
  | 'QUESTION_COMPLETE'
  | 'IDLE'
  | 'BUYOUT_OPEN'
  | 'BUYOUT_COMPLETE'
  | 'UPDATE_PLAYER';

// Payload for most WebSocket events
export interface iQuizSate { // As received from WebSocket
  showNumber: Date;
  tierNumber: number; // Used to identify the current tier (matches TierDataType.idx)
  tierLegend: string; // Displayed in Prepare Screen, used for buyout check
  enableCountdown: boolean;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  questionLabel: string;
  questionImage: string;
  correctAnswer: string;
  questionText: string;
  state: BroadcastState;
  maxPrize: number;
  prizeChange: number;
  prizePool: number;
  boughtOut: number;
  remainingPlayers: number;
  eliminatedPlayers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  passes: number;
  ready: number;
  countdownDuration: number;
}

// Player Data (part of SeatDataType)
export type PlayerDataType = {
  id: number;
  name: string;
  rank: string | null;
  occupation: string | null;
  notes: string | null;
  goal: string | null;
  relations: string[] | null; 
  isActive: boolean;
  usedPassOne: boolean;
  usedPassTwo: boolean;
  boughtOut: boolean;
  boughtOutEndGame: boolean;
  externalId: string; 
  image: string; // Player's avatar/image filename
  lives?: number; // Added for player lives
};

// Seat Data (from GET /seats/[seat])
export type SeatDataType = {
  id: string; 
  seat: number;
  description: string;
  sector: string;
  cameras: string;
  player?: PlayerDataType | null;
};

// Question Type Enum
export type QuestionTypeEnum = 'MULTIPLE' | 'TEXT' | 'TEXT NUMERIC' | '';

// Question Data (nested in TierDataType from GET /tiers)
export type QuestionDataType = {
  id: string; 
  label: string;
  image: string; // Filename of the question image
  questionType: QuestionTypeEnum;
  answerOptions: string; // Semicolon-delimited string, e.g., "A;B;C;D"
  correctAnswer: string;
  description: string | null;
};

// Tier Data (as received from GET /tiers)
export type TierDataType = {
  id: string; 
  idx: number; // Matches iQuizSate.tierNumber
  legend: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
  boundQuestion: string; // ID of the bound question
  question?: QuestionDataType | null; // Contains detailed question info
};


// App's Internal Tier State (derived from TierDataType and iQuizSate)
export type AppTierType = {
  tierNumber: number;       // From iQuizSate.tierNumber
  legend: string;           // From TierDataType.legend (or iQuizSate.tierLegend)
  passOneAllowed: boolean;  // From TierDataType
  passTwoAllowed: boolean;  // From TierDataType
  enableCountdown: boolean; // From TierDataType
  label: string;            // From TierDataType.question.label
  image: string;            // From TierDataType.question.image
  questionType: QuestionTypeEnum; // From TierDataType.question.questionType
  answerOptions: string;    // From TierDataType.question.answerOptions
};

// Outgoing WebSocket Message Types
export interface iCheckMessage {
  seat: number;
  imageloaded: boolean;
  tierNumber: number;
  questionNumber?: number; // Made optional
}

export interface iAnswerMessage {
  seat: number;          
  answer?: string;        
  pass?: boolean;         
  boughtOut?: boolean;    
  auto: boolean;         
}

export interface TimerStatus {
  remainingTime: number | null;
  initialDuration: number | null;
  status: 'idle' | 'running' | 'stopped' | 'reset' | 'complete' | 'error';
  tierId: string | null;
}