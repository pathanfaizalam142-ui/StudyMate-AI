import { QuizQuestion, StudyPlanData } from '../types';

export interface ChatResponse {
  answer: string;
  isFallback: boolean;
  note?: string;
  error?: string;
}

export interface ExamResponse {
  answer: string;
  marks: number;
  subject: string;
  isFallback: boolean;
  error?: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  isFallback: boolean;
  note?: string;
  error?: string;
}

export interface DocumentQAResponse {
  result: string;
  action: string;
  isFallback: boolean;
  error?: string;
}

export interface StudyPlanResponse {
  plan: StudyPlanData;
  isFallback: boolean;
  error?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  geminiConfigured: boolean;
}

export const api = {
  async checkHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { status: 'offline', service: 'StudyMate AI', geminiConfigured: false };
  },
  async askAI(params: {
    prompt: string;
    subject?: string;
    history?: { role: string; text: string }[];
    language?: 'en' | 'hi';
  }): Promise<ChatResponse> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Chat request failed with status ${res.status}`);
    }
    return res.json();
  },

  async generateExamAnswer(params: {
    question: string;
    subject?: string;
    marks?: number;
    language?: 'en' | 'hi';
  }): Promise<ExamResponse> {
    const res = await fetch('/api/gemini/exam-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Exam answer request failed with status ${res.status}`);
    }
    return res.json();
  },

  async generateQuiz(params: {
    subject: string;
    subjectCode?: string;
    semester?: number;
    unit?: string;
    topic?: string;
    questionCount?: number;
    difficulty?: string;
    language?: 'en' | 'hi';
  }): Promise<QuizResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Quiz generation failed: Invalid server response.');
      }

      if (!res.ok) {
        const errorDetail = data?.error ? data.error : `Request failed with status ${res.status}`;
        throw new Error(
          errorDetail.startsWith('Quiz generation failed:')
            ? errorDetail
            : `Quiz generation failed: ${errorDetail}`
        );
      }

      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Quiz generation failed: Empty or invalid questions received.');
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Quiz generation timed out after 45 seconds. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async queryDocument(params: {
    documentText: string;
    action: string;
    customQuestion?: string;
    language?: 'en' | 'hi';
  }): Promise<DocumentQAResponse> {
    const res = await fetch('/api/gemini/document-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Document query failed with status ${res.status}`);
    }
    return res.json();
  },

  async generateStudyPlan(params: {
    subjects: string[];
    examDate?: string;
    dailyHours?: number;
    difficulty?: string;
    topics?: string[];
    language?: 'en' | 'hi';
  }): Promise<StudyPlanResponse> {
    const res = await fetch('/api/gemini/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Study plan request failed with status ${res.status}`);
    }
    return res.json();
  },
};
