export type NavigationTab =
  | 'home'
  | 'gtu_bca'
  | 'ask_ai'
  | 'exam_mode'
  | 'quiz'
  | 'notes_upload'
  | 'study_plan'
  | 'saved'
  | 'profile';

export type AppLanguage = 'en' | 'hi';
export type AppTheme = 'light' | 'dark';

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  iconName: string;
  category?: string;
  semester?: number;
}

export interface GTUExamQuestion {
  question: string;
  marks: 2 | 3 | 5 | 7 | 10 | 15;
}

export interface GTUTopic {
  id: string;
  title: string;
  summary: string;
  importantMarks: (2 | 3 | 5 | 7 | 10 | 15)[];
  examQuestions?: GTUExamQuestion[];
  notes?: string;
}

export interface GTUUnit {
  unitNumber: number;
  unitName: string;
  weightage?: string;
  topics: GTUTopic[];
}

export interface GTUSubject {
  code: string;
  name: string;
  shortName?: string;
  category: string;
  credits: number;
  description: string;
  units: GTUUnit[];
}

export interface GTUSemesterCurriculum {
  semester: number;
  title: string;
  description: string;
  subjects: GTUSubject[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  subject?: string;
  isFallback?: boolean;
  marks?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  questions: QuizQuestion[];
  userAnswers: (number | null)[];
}

export interface SavedItem {
  id: string;
  title: string;
  type: 'ai_answer' | 'exam_answer' | 'quiz' | 'note';
  content: string;
  subject: string;
  timestamp: string;
  marks?: number;
}

export interface StudyTask {
  id: string;
  subject: string;
  title: string;
  durationMin: number;
  completed: boolean;
}

export interface StudyPlanData {
  overview: string;
  dailyTargetHours: number;
  todayTasks: StudyTask[];
  upcomingMilestones: { day: string; focus: string }[];
  examTips: string[];
}

export interface UploadedNote {
  id: string;
  name: string;
  sizeFormatted: string;
  uploadedAt: string;
  content: string;
}

export interface StudentProfile {
  name: string;
  college: string;
  course: string;
  semester: string;
  streakDays: number;
  avatarSeed: string;
}
