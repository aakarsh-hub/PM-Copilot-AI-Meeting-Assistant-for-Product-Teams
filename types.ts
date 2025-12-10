export enum MeetingStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ArtifactType {
  SUMMARY = 'SUMMARY',
  PRD = 'PRD',
  ROADMAP = 'ROADMAP',
  EMAIL = 'EMAIL',
  CHAT = 'CHAT'
}

export interface Decision {
  id: string;
  description: string;
  rationale: string;
  owner: string;
  status: 'DECIDED' | 'PENDING';
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Done';
}

export interface UserStory {
  role: string;
  capability: string;
  outcome: string;
  acceptanceCriteria: string[];
}

export interface PRD {
  problemStatement: string;
  personas: string[];
  userStories: UserStory[];
  technicalRequirements: string[];
}

export interface Epic {
  title: string;
  phase: 'Now' | 'Next' | 'Later';
  description: string;
  dependencies: string[];
}

export interface Roadmap {
  strategicTheme: string;
  epics: Epic[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  type: 'Audio' | 'Notes';
  transcript: string; // Or full text notes
  summary?: {
    overview: string;
    agenda: string[];
    risks: string[];
  };
  decisions: Decision[];
  actionItems: ActionItem[];
  prd?: PRD;
  roadmap?: Roadmap;
  status: MeetingStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
