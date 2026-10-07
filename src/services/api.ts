import {
  CanonicalSemesterPapersGroup,
  GTUQuestionPaper,
  QuizQuestion,
  StudyPlanData,
} from '../types';

export interface PapersApiResponse {
  semesters: CanonicalSemesterPapersGroup[];
}

export interface SinglePaperApiResponse {
  paper: GTUQuestionPaper;
  subject?: {
    semester: number;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    availabilityStatus: string;
    isAvailable: boolean;
  };
}

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

  async getCurriculum(semester?: number): Promise<{ semesters: any[] }> {
    const qs = semester !== undefined ? `?semester=${encodeURIComponent(String(semester))}` : '';
    const res = await fetch(`/api/curriculum${qs}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch canonical curriculum (${res.status})`);
    }
    return res.json();
  },

  async getStudyMaterials(params?: {
    semester?: number;
    subjectCode?: string;
    subjectId?: string;
    unitId?: string;
    topicId?: string;
  }): Promise<{ total: number; materials: any[] }> {
    const query = new URLSearchParams();
    if (params?.semester !== undefined) query.set('semester', String(params.semester));
    if (params?.subjectCode) query.set('subjectCode', params.subjectCode);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.unitId) query.set('unitId', params.unitId);
    if (params?.topicId) query.set('topicId', params.topicId);
    const qs = query.toString();
    const res = await fetch(`/api/study-materials${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch study materials (${res.status})`);
    }
    return res.json();
  },

  async getPapers(params?: {
    semester?: number;
    subjectCode?: string;
    subjectId?: string;
  }): Promise<PapersApiResponse> {
    const query = new URLSearchParams();
    if (params?.semester !== undefined) query.set('semester', String(params.semester));
    if (params?.subjectCode) query.set('subjectCode', params.subjectCode);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    const qs = query.toString();
    const res = await fetch(`/api/papers${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch canonical GTU papers (status ${res.status})`);
    }
    return res.json();
  },

  async getPaperById(idOrSubjectCode: string): Promise<SinglePaperApiResponse> {
    const res = await fetch(`/api/papers/${encodeURIComponent(idOrSubjectCode)}`);
    if (!res.ok) {
      let errMsg = `Failed to load paper ${idOrSubjectCode} (status ${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) errMsg = body.error;
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
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
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      throw new Error(data?.error || `Chat request failed with status ${res.status}`);
    }
    return data;
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
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      throw new Error(data?.error || `Exam answer request failed with status ${res.status}`);
    }
    return data;
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

  // ==========================================================================
  // PHASE 3: ADMIN FOUNDATION & CONTENT MANAGEMENT API CLIENT
  // ==========================================================================
  async adminLogin(email: string, password: string): Promise<{
    success: boolean;
    token: string;
    expiresAt: string;
    user: { id: string; name: string; email: string; role: 'admin' };
  }> {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Admin login failed (${res.status})`);
    }
    return data;
  },

  async adminLogout(token?: string | null): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers,
    });
  },

  async adminMe(token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/admin/auth/me', { headers });
    const data = await res.json();
    if (!res.ok || !data?.authenticated) {
      throw new Error(data?.error || `Admin session check failed (${res.status})`);
    }
    return data;
  },

  async getAdminStats(token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/admin/stats', { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load admin stats (${res.status})`);
    }
    return data;
  },

  async getAdminSubjects(
    params?: { semester?: number | string; search?: string; availability?: string },
    token?: string | null
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.semester !== undefined && params.semester !== 'all') {
      qs.set('semester', String(params.semester));
    }
    if (params?.search) qs.set('search', params.search);
    if (params?.availability && params.availability !== 'all') {
      qs.set('availability', params.availability);
    }
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/subjects${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load admin subjects (${res.status})`);
    }
    return data;
  },

  async getAdminSubjectById(idOrCode: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/subjects/${encodeURIComponent(idOrCode)}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load subject detail (${res.status})`);
    }
    return data;
  },

  async getAdminPapers(
    params?: {
      semester?: number | string;
      subjectCode?: string;
      year?: number | string;
      examSession?: string;
      availability?: string;
      search?: string;
      includeAll?: boolean;
    },
    token?: string | null
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.semester !== undefined && params.semester !== 'all') {
      qs.set('semester', String(params.semester));
    }
    if (params?.subjectCode && params.subjectCode !== 'all') {
      qs.set('subjectCode', params.subjectCode);
    }
    if (params?.year !== undefined && params.year !== 'all') {
      qs.set('year', String(params.year));
    }
    if (params?.examSession && params.examSession !== 'all') {
      qs.set('examSession', params.examSession);
    }
    if (params?.availability && params.availability !== 'all') {
      qs.set('availability', params.availability);
    }
    if (params?.search) qs.set('search', params.search);
    if (params?.includeAll) qs.set('includeAll', 'true');

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/papers${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load admin papers (${res.status})`);
    }
    return data;
  },

  async getAdminPaperQuestions(
    paperIdOrParams?:
      | string
      | {
          semester?: number | string;
          subjectCode?: string;
          paperId?: string;
          search?: string;
        },
    token?: string | null
  ): Promise<any> {
    if (typeof paperIdOrParams === 'object' || paperIdOrParams === undefined) {
      return this.getAdminAllPaperQuestions(paperIdOrParams, token);
    }
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `/api/admin/papers/${encodeURIComponent(paperIdOrParams)}/questions`,
      { headers }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load paper questions (${res.status})`);
    }
    return data;
  },

  async getAdminAllPaperQuestions(
    params?: {
      semester?: number | string;
      subjectCode?: string;
      paperId?: string;
      search?: string;
    },
    token?: string | null
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.semester !== undefined && params.semester !== 'all') {
      qs.set('semester', String(params.semester));
    }
    if (params?.subjectCode && params.subjectCode !== 'all') {
      qs.set('subjectCode', params.subjectCode);
    }
    if (params?.paperId && params.paperId !== 'all') {
      qs.set('paperId', params.paperId);
    }
    if (params?.search) qs.set('search', params.search);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `/api/admin/paper-questions${qs.toString() ? `?${qs.toString()}` : ''}`,
      { headers }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load paper questions (${res.status})`);
    }
    return data;
  },

  async getAdminMcqs(
    params?: {
      semester?: number | string;
      subjectCode?: string;
      topic?: string;
      language?: string;
      difficulty?: string;
      source?: string;
      search?: string;
    },
    token?: string | null
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.semester !== undefined && params.semester !== 'all') {
      qs.set('semester', String(params.semester));
    }
    if (params?.subjectCode && params.subjectCode !== 'all') {
      qs.set('subjectCode', params.subjectCode);
    }
    if (params?.topic && params.topic !== 'all') {
      qs.set('topic', params.topic);
    }
    if (params?.language && params.language !== 'all') {
      qs.set('language', params.language);
    }
    if (params?.difficulty && params.difficulty !== 'all') {
      qs.set('difficulty', params.difficulty);
    }
    if (params?.source && params.source !== 'all') {
      qs.set('source', params.source);
    }
    if (params?.search) qs.set('search', params.search);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/mcqs${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load admin MCQs (${res.status})`);
    }
    return data;
  },

  async createAdminMcq(
    payload: {
      subjectCode: string;
      unitId?: string;
      unitNumber?: number;
      topicId?: string;
      questionText: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      difficulty: 'easy' | 'medium' | 'hard';
      language: 'en' | 'hi';
      marks?: number;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/admin/mcqs', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create MCQ (${res.status})`);
    }
    return data;
  },

  async updateAdminMcq(
    id: string,
    payload: {
      unitId?: string | null;
      unitNumber?: number | null;
      topicId?: string | null;
      questionText?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      language?: 'en' | 'hi';
      marks?: number;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/mcqs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update MCQ (${res.status})`);
    }
    return data;
  },

  async deleteAdminMcq(id: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/mcqs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete MCQ (${res.status})`);
    }
    return data;
  },

  async deactivateAdminMcq(id: string, token?: string | null): Promise<any> {
    return this.deleteAdminMcq(id, token);
  },

  async getAdminPaperById(paperIdOrSubjectCode: string, token?: string | null): Promise<any> {
    return this.getAdminPaperDetail(paperIdOrSubjectCode, token, true);
  },

  async archiveAdminPaper(paperId: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/papers/${encodeURIComponent(paperId)}/archive`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to archive paper (${res.status})`);
    }
    return data;
  },

  async reorderAdminPaperQuestions(
    paperId: string,
    orderedQuestionIds: string[],
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/papers/${encodeURIComponent(paperId)}/questions/reorder`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ orderedQuestionIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to reorder paper questions (${res.status})`);
    }
    return data;
  },

  async createAdminUnit(
    payload: {
      subjectId: string;
      unitNumber: number;
      title: string;
      weightage?: string;
      description?: string;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `/api/admin/subjects/${encodeURIComponent(payload.subjectId)}/units`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create unit (${res.status})`);
    }
    return data;
  },

  async updateAdminUnit(
    unitId: string,
    payload: { unitNumber?: number; title?: string; weightage?: string; description?: string },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/units/${encodeURIComponent(unitId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update unit (${res.status})`);
    }
    return data;
  },

  async deleteAdminUnit(unitId: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/units/${encodeURIComponent(unitId)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete unit (${res.status})`);
    }
    return data;
  },

  async updateAdminTopic(
    topicId: string,
    payload: { title?: string; summary?: string; content?: string },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/topics/${encodeURIComponent(topicId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update topic (${res.status})`);
    }
    return data;
  },

  async getAdminPaperDetail(
    paperIdOrSubjectCode: string,
    token?: string | null,
    includeUnpublished: boolean = false
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const qs = includeUnpublished ? '?includeUnpublished=true' : '';
    const res = await fetch(
      `/api/admin/papers/${encodeURIComponent(paperIdOrSubjectCode)}${qs}`,
      { headers }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load paper detail (${res.status})`);
    }
    return data;
  },

  async createAdminPaper(
    payload: {
      semester?: number | string;
      subjectCode: string;
      examYear: number;
      examSession: 'Summer' | 'Winter';
      title?: string;
      totalMarks?: number;
      durationMinutes?: number;
      examDate?: string;
      examTime?: string;
      instructions?: string[];
      availabilityStatus?: 'available' | 'unavailable' | 'pending_verification' | 'archived';
      published?: boolean;
      verified?: boolean;
      questions?: Array<{
        sectionNumber: number;
        sectionTitle?: string;
        questionNumber: string;
        isAlternative?: boolean;
        questionText: string;
        marks: number;
        unitNumber?: number;
      }>;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/admin/papers', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create paper (${res.status})`);
    }
    return data;
  },

  async updateAdminPaper(
    paperId: string,
    payload: {
      examYear?: number;
      examSession?: 'Summer' | 'Winter';
      title?: string;
      totalMarks?: number;
      durationMinutes?: number;
      examDate?: string | null;
      examTime?: string | null;
      instructions?: string[];
      availabilityStatus?: 'available' | 'unavailable' | 'pending_verification' | 'archived';
      published?: boolean;
      verified?: boolean;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/papers/${encodeURIComponent(paperId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update paper (${res.status})`);
    }
    return data;
  },

  async deleteAdminPaper(
    paperId: string,
    token?: string | null,
    options?: { mode?: 'archive' | 'delete' }
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const qs = options?.mode ? `?mode=${options.mode}` : '';
    const res = await fetch(`/api/admin/papers/${encodeURIComponent(paperId)}${qs}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete paper (${res.status})`);
    }
    return data;
  },

  async createAdminPaperQuestion(
    paperId: string,
    payload: {
      sectionNumber: number;
      sectionTitle?: string;
      questionNumber: string;
      subQuestionLabel?: string;
      choiceGroupLabel?: string;
      isAlternative?: boolean;
      questionText: string;
      marks: number;
      unitNumber?: number;
      unitId?: string;
      topicId?: string;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/papers/${encodeURIComponent(paperId)}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to add paper question (${res.status})`);
    }
    return data;
  },

  async updateAdminPaperQuestion(
    questionId: string,
    payload: {
      sectionNumber?: number;
      sectionTitle?: string;
      questionNumber?: string;
      subQuestionLabel?: string | null;
      choiceGroupLabel?: string | null;
      isAlternative?: boolean;
      questionText?: string;
      marks?: number;
      unitNumber?: number | null;
      unitId?: string | null;
      topicId?: string | null;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/paper-questions/${encodeURIComponent(questionId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update paper question (${res.status})`);
    }
    return data;
  },

  async deleteAdminPaperQuestion(questionId: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/paper-questions/${encodeURIComponent(questionId)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete paper question (${res.status})`);
    }
    return data;
  },

  async updateAdminSubject(
    idOrCode: string,
    payload: {
      name?: string;
      shortName?: string;
      category?: string;
      credits?: number;
      description?: string;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/subjects/${encodeURIComponent(idOrCode)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update subject (${res.status})`);
    }
    return data;
  },

  async createAdminTopic(
    subjectCodeOrPayload:
      | string
      | {
          subjectId?: string;
          subjectCode?: string;
          unitNumber?: number;
          unitId?: string;
          title: string;
          summary?: string;
          importantMarks?: number[];
        },
    payloadOrToken?: any,
    maybeToken?: string | null
  ): Promise<any> {
    let subjectTarget = '';
    let bodyPayload: any = {};
    let token: string | null | undefined = maybeToken;

    if (typeof subjectCodeOrPayload === 'string') {
      subjectTarget = subjectCodeOrPayload;
      bodyPayload = payloadOrToken || {};
    } else {
      subjectTarget =
        subjectCodeOrPayload.subjectId || subjectCodeOrPayload.subjectCode || '';
      bodyPayload = subjectCodeOrPayload;
      token = payloadOrToken;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/subjects/${encodeURIComponent(subjectTarget)}/topics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create topic (${res.status})`);
    }
    return data;
  },

  async deleteAdminTopic(topicId: string, token?: string | null): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/topics/${encodeURIComponent(topicId)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete topic (${res.status})`);
    }
    return data;
  },

  async getAdminStudyMaterials(
    params?: {
      semester?: number | string;
      subjectCode?: string;
      materialType?: string;
      search?: string;
    },
    token?: string | null
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.semester !== undefined && params.semester !== 'all') {
      qs.set('semester', String(params.semester));
    }
    if (params?.subjectCode && params.subjectCode !== 'all') {
      qs.set('subjectCode', params.subjectCode);
    }
    if (params?.materialType && params.materialType !== 'all') {
      qs.set('materialType', params.materialType);
    }
    if (params?.search) qs.set('search', params.search);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `/api/admin/study-materials${qs.toString() ? `?${qs.toString()}` : ''}`,
      { headers }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to load study materials (${res.status})`);
    }
    return data;
  },

  async createAdminStudyMaterial(
    payload: {
      subjectCode: string;
      unitNumber?: number;
      unitId?: string;
      topicId?: string;
      title: string;
      description?: string;
      language?: 'en' | 'hi';
      materialType?: string;
      summary?: string;
      contentMarkdown?: string;
      published?: boolean;
      verified?: boolean;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/admin/study-materials', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to create study material (${res.status})`);
    }
    return data;
  },

  async updateAdminStudyMaterial(
    id: string,
    payload: {
      title?: string;
      description?: string;
      language?: 'en' | 'hi';
      materialType?: string;
      summary?: string;
      contentMarkdown?: string;
      published?: boolean;
      verified?: boolean;
    },
    token?: string | null
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/study-materials/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to update study material (${res.status})`);
    }
    return data;
  },

  async deleteAdminStudyMaterial(
    id: string,
    token?: string | null,
    _options?: { permanent?: boolean }
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/admin/study-materials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Failed to delete study material (${res.status})`);
    }
    return data;
  },
};
