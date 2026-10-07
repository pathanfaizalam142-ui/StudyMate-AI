import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  FileText,
  Search,
  Plus,
  Trash2,
  Lock,
  ArrowLeft,
  Edit3,
  Archive,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AppLanguage, AppTheme } from '../types';
import { api } from '../services/api';
import { soundManager } from '../services/soundManager';
import {
  AdminPaperFormModal,
  AdminPaperQuestionsModal,
} from '../components/AdminPaperManagerModal';
import {
  AdminSubjectUnitsTopicsModal,
  AdminStudyMaterialsPanel,
} from '../components/AdminCurriculumMaterialsPanel';
import { AdminSidebar, AdminSectionTab } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCurriculumView } from './admin/AdminCurriculumView';
import { AdminSecurityView } from './admin/AdminSecurityView';

interface AdminViewProps {
  language: AppLanguage;
  theme: AppTheme;
  onExitAdmin: () => void;
}

interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

export const AdminView: React.FC<AdminViewProps> = ({ onExitAdmin }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSectionTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Strict Backend-Verified Admin Session State (no hardcoded credentials)
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('studymate_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('studymate_admin_token');
  });
  const [verifyingSession, setVerifyingSession] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('studymate_admin_token'));
  });

  // Login Form State (strictly empty initial values — never hardcode secrets)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data States
  const [stats, setStats] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [paperQuestions, setPaperQuestions] = useState<any[]>([]);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [paperSemesterFilter, setPaperSemesterFilter] = useState<number | 'all'>('all');
  const [paperAvailabilityFilter, setPaperAvailabilityFilter] = useState<string>('all');
  const [paperSearch, setPaperSearch] = useState('');
  const [includeAllPapers] = useState<boolean>(true);
  const [pqSemesterFilter, setPqSemesterFilter] = useState<number | 'all'>('all');
  const [pqSubjectFilter, setPqSubjectFilter] = useState<string>('all');
  const [mcqSemesterFilter, setMcqSemesterFilter] = useState<number | 'all'>('all');
  const [mcqSubjectFilter, setMcqSubjectFilter] = useState<string>('all');
  const [mcqDifficultyFilter, setMcqDifficultyFilter] = useState<string>('all');
  const [mcqSearch, setMcqSearch] = useState('');

  // Modals for Paper CRUD, Paper Questions CRUD, Subject Hierarchy CRUD
  const [paperModalMode, setPaperModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPaperRecord, setEditingPaperRecord] = useState<any | null>(null);
  const [defaultPaperSubject, setDefaultPaperSubject] = useState<any | null>(null);
  const [managingQuestionsPaperId, setManagingQuestionsPaperId] = useState<string | null>(null);
  const [managingSubjectId, setManagingSubjectId] = useState<string | null>(null);

  // Create / Edit MCQ Modal State
  const [isMcqModalOpen, setIsMcqModalOpen] = useState(false);
  const [editingMcq, setEditingMcq] = useState<any | null>(null);
  const [newMcqSubjectCode, setNewMcqSubjectCode] = useState('BCA101');
  const [newMcqUnitNumber, setNewMcqUnitNumber] = useState<number>(1);
  const [newMcqDifficulty, setNewMcqDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newMcqLanguage, setNewMcqLanguage] = useState<'en' | 'hi'>('en');
  const [newMcqQuestion, setNewMcqQuestion] = useState('');
  const [newMcqOption0, setNewMcqOption0] = useState('');
  const [newMcqOption1, setNewMcqOption1] = useState('');
  const [newMcqOption2, setNewMcqOption2] = useState('');
  const [newMcqOption3, setNewMcqOption3] = useState('');
  const [newMcqCorrectIdx, setNewMcqCorrectIdx] = useState<number>(0);
  const [newMcqExplanation, setNewMcqExplanation] = useState('');
  const [isSubmittingMcq, setIsSubmittingMcq] = useState(false);

  const showToast = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Validate admin session against backend on mount
  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      if (!adminToken) {
        if (active) {
          setAdminUser(null);
          setVerifyingSession(false);
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.history.replaceState({}, '', '/admin/login');
          }
        }
        return;
      }
      try {
        const res = await api.adminMe(adminToken);
        if (active && res?.user?.role === 'admin') {
          setAdminUser(res.user);
          localStorage.setItem('studymate_admin_user', JSON.stringify(res.user));
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.history.replaceState({}, '', '/admin');
          }
        } else if (active) {
          setAdminUser(null);
          setAdminToken(null);
          localStorage.removeItem('studymate_admin_token');
          localStorage.removeItem('studymate_admin_user');
        }
      } catch {
        if (active) {
          setAdminUser(null);
          setAdminToken(null);
          localStorage.removeItem('studymate_admin_token');
          localStorage.removeItem('studymate_admin_user');
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.history.replaceState({}, '', '/admin/login');
          }
        }
      } finally {
        if (active) setVerifyingSession(false);
      }
    };
    checkSession();
    return () => {
      active = false;
    };
  }, [adminToken]);

  const loadCoreData = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const [statsRes, subjRes, papersRes] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getAdminSubjects({}, adminToken),
        api.getAdminPapers(
          {
            semester: paperSemesterFilter === 'all' ? undefined : paperSemesterFilter,
            availability: paperAvailabilityFilter === 'all' ? undefined : paperAvailabilityFilter,
            search: paperSearch || undefined,
            includeAll: includeAllPapers,
          },
          adminToken
        ),
      ]);
      setStats(statsRes.stats);
      setSubjects(subjRes.subjects || []);
      setPapers(papersRes.papers || []);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to load SQLite admin data.');
    } finally {
      setIsLoading(false);
    }
  }, [
    adminToken,
    paperSemesterFilter,
    paperAvailabilityFilter,
    paperSearch,
    includeAllPapers,
  ]);

  const loadPaperQuestions = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await api.getAdminPaperQuestions(
        {
          semester: pqSemesterFilter === 'all' ? undefined : pqSemesterFilter,
          subjectCode: pqSubjectFilter === 'all' ? undefined : pqSubjectFilter,
        },
        adminToken
      );
      setPaperQuestions(res.questions || []);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to load paper questions.');
    }
  }, [adminToken, pqSemesterFilter, pqSubjectFilter]);

  const loadMcqs = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await api.getAdminMcqs(
        {
          semester: mcqSemesterFilter === 'all' ? undefined : mcqSemesterFilter,
          subjectCode: mcqSubjectFilter === 'all' ? undefined : mcqSubjectFilter,
          difficulty: mcqDifficultyFilter === 'all' ? undefined : mcqDifficultyFilter,
          search: mcqSearch || undefined,
        },
        adminToken
      );
      setMcqs(res.questions || []);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to load MCQ bank.');
    }
  }, [adminToken, mcqSemesterFilter, mcqSubjectFilter, mcqDifficultyFilter, mcqSearch]);

  useEffect(() => {
    if (adminToken && adminUser) {
      loadCoreData();
    }
  }, [adminToken, adminUser, loadCoreData]);

  useEffect(() => {
    if (adminToken && adminUser && activeSubTab === 'paper_questions') {
      loadPaperQuestions();
    }
  }, [adminToken, adminUser, activeSubTab, loadPaperQuestions]);

  useEffect(() => {
    if (adminToken && adminUser && activeSubTab === 'mcqs') {
      loadMcqs();
    }
  }, [adminToken, adminUser, activeSubTab, loadMcqs]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await api.adminLogin(loginEmail.trim(), loginPassword);
      setAdminUser(res.user);
      setAdminToken(res.token);
      localStorage.setItem('studymate_admin_user', JSON.stringify(res.user));
      localStorage.setItem('studymate_admin_token', res.token);
      setLoginPassword('');
      soundManager.play('save');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin');
      }
      showToast(`Authenticated as ${res.user.name} (${res.user.email})`);
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid administrator credentials');
      soundManager.play('error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await api.adminLogout(adminToken);
    setAdminUser(null);
    setAdminToken(null);
    localStorage.removeItem('studymate_admin_user');
    localStorage.removeItem('studymate_admin_token');
    soundManager.play('button_click');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/admin/login');
    }
  };

  const handleArchivePaper = async (paper: any) => {
    if (!adminToken || !paper.paperId) return;
    try {
      await api.archiveAdminPaper(paper.paperId, adminToken);
      showToast(`Archived paper ${paper.paperId} (${paper.subjectCode}).`);
      await loadCoreData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to archive paper.');
    }
  };

  const handlePublishPaper = async (paper: any) => {
    if (!adminToken || !paper.paperId) return;
    try {
      await api.updateAdminPaper(
        paper.paperId,
        { availabilityStatus: 'available', published: true, verified: true },
        adminToken
      );
      showToast(`Published & verified paper ${paper.paperId} (${paper.subjectCode}).`);
      await loadCoreData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to publish paper.');
    }
  };

  const handleDeletePaper = async (paper: any) => {
    if (!adminToken || !paper.paperId) return;
    try {
      await api.deleteAdminPaper(paper.paperId, adminToken, { mode: 'delete' });
      showToast(`Deleted paper ${paper.paperId} (${paper.subjectCode}).`);
      await loadCoreData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to delete paper.');
    }
  };

  const openCreateMcqModal = () => {
    setEditingMcq(null);
    // Context-aware subject selection: default to currently selected subject if filtered
    const defaultCode =
      mcqSubjectFilter !== 'all' ? mcqSubjectFilter : subjects[0]?.code || 'BCA101';
    setNewMcqSubjectCode(defaultCode);
    setNewMcqUnitNumber(1);
    setNewMcqDifficulty('medium');
    setNewMcqLanguage('en');
    setNewMcqQuestion('');
    setNewMcqOption0('');
    setNewMcqOption1('');
    setNewMcqOption2('');
    setNewMcqOption3('');
    setNewMcqCorrectIdx(0);
    setNewMcqExplanation('');
    setIsMcqModalOpen(true);
  };

  const openEditMcqModal = (mcq: any) => {
    setEditingMcq(mcq);
    setNewMcqSubjectCode(mcq.subjectCode || 'BCA101');
    setNewMcqUnitNumber(1);
    setNewMcqDifficulty(mcq.difficulty || 'medium');
    setNewMcqLanguage(mcq.language || 'en');
    setNewMcqQuestion(mcq.questionText || '');
    setNewMcqOption0(mcq.options?.[0] || '');
    setNewMcqOption1(mcq.options?.[1] || '');
    setNewMcqOption2(mcq.options?.[2] || '');
    setNewMcqOption3(mcq.options?.[3] || '');
    setNewMcqCorrectIdx(mcq.correctIndex ?? 0);
    setNewMcqExplanation(mcq.explanation || '');
    setIsMcqModalOpen(true);
  };

  const handleSaveMcq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setErrorBanner(null);
    setIsSubmittingMcq(true);
    try {
      const options = [
        newMcqOption0.trim(),
        newMcqOption1.trim(),
        newMcqOption2.trim(),
        newMcqOption3.trim(),
      ];
      if (editingMcq) {
        await api.updateAdminMcq(
          editingMcq.id,
          {
            questionText: newMcqQuestion.trim(),
            options,
            correctIndex: newMcqCorrectIdx,
            explanation: newMcqExplanation.trim(),
            difficulty: newMcqDifficulty,
            language: newMcqLanguage,
          },
          adminToken
        );
        showToast(`Updated MCQ ${editingMcq.id} in ${editingMcq.subjectCode}.`);
      } else {
        const res = await api.createAdminMcq(
          {
            subjectCode: newMcqSubjectCode,
            unitNumber: newMcqUnitNumber,
            questionText: newMcqQuestion.trim(),
            options,
            correctIndex: newMcqCorrectIdx,
            explanation: newMcqExplanation.trim(),
            difficulty: newMcqDifficulty,
            language: newMcqLanguage,
          },
          adminToken
        );
        showToast(`Created MCQ ${res.question.id} under ${res.question.subjectCode}.`);
      }
      setIsMcqModalOpen(false);
      await Promise.all([loadMcqs(), loadCoreData()]);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to save MCQ.');
    } finally {
      setIsSubmittingMcq(false);
    }
  };

  const handleDeactivateMcq = async (questionId: string) => {
    if (!adminToken) return;
    try {
      await api.deactivateAdminMcq(questionId, adminToken);
      showToast(`Deactivated MCQ ${questionId}.`);
      await Promise.all([loadMcqs(), loadCoreData()]);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to deactivate MCQ.');
    }
  };

  // STRICT ADMIN ACCESS GATE:
  // Non-authenticated users attempting to access /admin are gated/redirected to Admin Login.
  if (verifyingSession) {
    return (
      <div className="py-20 text-center text-sm font-semibold text-stone-500">
        Verifying administrator session...
      </div>
    );
  }

  if (!adminUser || !adminToken) {
    return (
      <div
        id="studymate-admin-login-gate"
        className="min-h-[75vh] flex items-center justify-center py-10 px-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#172033] border border-stone-200 dark:border-[#263449] shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-[#0f172a] via-[#004741] to-[#002b27] text-white space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Administrator Area</span>
            </div>
            <h1 className="font-display font-black text-xl tracking-tight">
              StudentMate-AI Admin Login
            </h1>
            <p className="text-xs text-white/75 leading-relaxed">
              /admin requires an authenticated administrator session verified against SQLite.
              Student accounts do not have access to administrative operations.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Administrator Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter authorized admin email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs focus:outline-none focus:ring-2 focus:ring-[#004741]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Administrator Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter administrator password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs focus:outline-none focus:ring-2 focus:ring-[#004741]"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={onExitAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-[#172033] text-stone-700 dark:text-[#94A3B8] text-xs font-bold hover:bg-stone-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Portal</span>
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="px-5 py-2.5 rounded-xl bg-[#004741] hover:bg-[#003833] text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In to Admin Console'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="studymate-admin-console" className="space-y-4 pb-20 animate-fade-in w-full min-w-0">
      {/* Admin Specific Header Bar */}
      <AdminHeader
        activeTab={activeSubTab}
        adminUser={adminUser}
        isLoading={isLoading}
        onSyncDb={loadCoreData}
        onExitAdmin={onExitAdmin}
        onLogout={handleAdminLogout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Admin Shell: Dedicated Sidebar + Workspace */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Dedicated Admin Sidebar */}
        <AdminSidebar
          activeTab={activeSubTab}
          onSelectTab={setActiveSubTab}
          onExitAdmin={onExitAdmin}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          stats={stats}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* SECTION 1: DASHBOARD */}
          {activeSubTab === 'dashboard' && (
            <AdminDashboard
              stats={stats}
              onNavigateSection={setActiveSubTab}
              subjects={subjects}
              papers={papers}
            />
          )}

          {/* SECTION 2: CURRICULUM — SUBJECTS & SYLLABUS */}
          {activeSubTab === 'subjects' && (
            <AdminCurriculumView
              subjects={subjects}
              adminToken={adminToken}
              onOpenHierarchyModal={(subjectId) => setManagingSubjectId(subjectId)}
              onRefreshData={loadCoreData}
            />
          )}

          {/* SECTION 3: STUDY MATERIALS */}
          {activeSubTab === 'materials' && (
            <AdminStudyMaterialsPanel
              subjects={subjects}
              adminToken={adminToken}
              onActionSuccess={(msg) => {
                showToast(msg);
                loadCoreData();
              }}
            />
          )}

          {/* SECTION 4: GTU EXAMINATION PAPERS */}
          {activeSubTab === 'papers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={paperSemesterFilter}
                    onChange={(e) =>
                      setPaperSemesterFilter(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Semesters (1–6)</option>
                    {[1, 2, 3, 4, 5, 6].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>

                  <select
                    value={paperAvailabilityFilter}
                    onChange={(e) => setPaperAvailabilityFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable Only</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="archived">Archived Only</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={paperSearch}
                      onChange={(e) => setPaperSearch(e.target.value)}
                      placeholder="Search paper or subject code..."
                      className="pl-8 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingPaperRecord(null);
                    setDefaultPaperSubject(null);
                    setPaperModalMode('create');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004741] hover:bg-[#003833] text-white text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create GTU Paper</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-[#263449] text-[11px] font-bold uppercase text-stone-500 bg-stone-50/60 dark:bg-[#172033]/50">
                        <th className="py-3 px-4">Sem</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Paper ID</th>
                        <th className="py-3 px-4">Session</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Questions</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {papers.map((p, idx) => (
                        <tr
                          key={p.paperId || `${p.subjectId}-${idx}`}
                          className="hover:bg-stone-50/80 dark:hover:bg-stone-900/40"
                        >
                          <td className="py-3 px-4 font-bold">Sem {p.semester}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900 dark:text-white">
                              {p.subjectCode} — {p.subjectName}
                            </div>
                            <div className="font-mono text-[10px] text-stone-400">{p.subjectId}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                            {p.paperId || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {p.examYear && p.examSession ? `${p.examSession} ${p.examYear}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                p.availabilityStatus === 'available' && p.published && p.verified
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : p.availabilityStatus === 'archived'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-[#94A3B8]'
                              }`}
                            >
                              {p.availabilityStatus}
                              {p.paperId ? (p.published ? ' • pub' : ' • unpub') : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold">{p.questionCount || 0} Qs</td>
                          <td className="py-3 px-4 text-right">
                            {p.paperId ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => setManagingQuestionsPaperId(p.paperId)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004741] text-white font-bold text-[11px]"
                                  title="Manage Paper Questions"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>Questions</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPaperRecord(p);
                                    setPaperModalMode('edit');
                                  }}
                                  className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-[#94A3B8]"
                                  title="Edit Paper Metadata"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {p.availabilityStatus === 'available' && p.published ? (
                                  <button
                                    onClick={() => handleArchivePaper(p)}
                                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    title="Archive / Deactivate Paper"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePublishPaper(p)}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]"
                                    title="Publish & Verify Paper"
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePaper(p)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-600"
                                  title="Delete Paper"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPaperRecord(null);
                                  setDefaultPaperSubject({
                                    semester: p.semester,
                                    subjectCode: p.subjectCode,
                                    subjectId: p.subjectId,
                                    subjectName: p.subjectName,
                                  });
                                  setPaperModalMode('create');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Create Paper</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PAPER QUESTIONS EXPLORER */}
          {activeSubTab === 'paper_questions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={pqSemesterFilter}
                    onChange={(e) =>
                      setPqSemesterFilter(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>

                  <select
                    value={pqSubjectFilter}
                    onChange={(e) => setPqSubjectFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Canonical Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs font-bold text-stone-500">
                  Showing {paperQuestions.length} verified paper_questions rows
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] p-4 space-y-2.5 shadow-xs">
                {paperQuestions.map((pq) => (
                  <div
                    key={pq.id}
                    className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#172033]/50 border border-stone-200/70 dark:border-[#263449] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#004741] text-white font-bold text-[10px]">
                          Sem {pq.semester} • {pq.subjectCode}
                        </span>
                        <span className="font-bold">
                          {pq.sectionTitle} / {pq.questionNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-bold text-[10px]">
                          {pq.marks} Marks
                        </span>
                        {pq.isAlternative && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            OR Alternative
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                          paper.subject_id == question.subject_id ({pq.subjectId})
                        </span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200 font-medium">
                        {pq.questionText}
                      </p>
                    </div>
                    <button
                      onClick={() => setManagingQuestionsPaperId(pq.paperId)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#004741]/10 text-[#004741] dark:text-emerald-300 font-bold text-[11px] shrink-0"
                    >
                      Open Paper
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: MCQ QUESTION BANK */}
          {activeSubTab === 'mcqs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={mcqSemesterFilter}
                    onChange={(e) => {
                      setMcqSemesterFilter(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                      );
                      setMcqSubjectFilter('all');
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mcqSubjectFilter}
                    onChange={(e) => setMcqSubjectFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Canonical Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mcqDifficultyFilter}
                    onChange={(e) => setMcqDifficultyFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <input
                    type="text"
                    value={mcqSearch}
                    onChange={(e) => setMcqSearch(e.target.value)}
                    placeholder="Search MCQ text..."
                    className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs"
                  />
                </div>

                <button
                  onClick={openCreateMcqModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004741] hover:bg-[#003833] text-white text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Verified MCQ</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] p-4 space-y-3 shadow-xs">
                {mcqs.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-stone-50/70 dark:bg-[#172033]/50 border border-stone-200/70 dark:border-[#263449] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#004741] text-white font-bold text-[10px]">
                          Sem {q.semester} • {q.subjectCode}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-bold text-[10px] uppercase">
                          {q.difficulty} • {q.language}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">{q.id}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditMcqModal(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 font-bold text-[11px]"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeactivateMcq(q.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[11px]"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Deactivate</span>
                        </button>
                      </div>
                    </div>

                    <p className="font-bold text-stone-900 dark:text-white">{q.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(q.options || []).map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                            i === q.correctIndex
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-white dark:bg-[#111827] border-stone-200/70 dark:border-[#263449]'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: ACCOUNT / SESSION SECURITY */}
          {activeSubTab === 'security' && (
            <AdminSecurityView adminUser={adminUser} onLogout={handleAdminLogout} />
          )}
        </div>
      </div>

      {/* REUSED CANONICAL MODALS */}
      {paperModalMode && (
        <AdminPaperFormModal
          mode={paperModalMode}
          initialPaper={editingPaperRecord}
          defaultSubject={defaultPaperSubject}
          subjects={subjects}
          adminToken={adminToken}
          onClose={() => setPaperModalMode(null)}
          onSaved={async (msg, createdPaperId) => {
            setPaperModalMode(null);
            showToast(msg);
            await loadCoreData();
            if (createdPaperId && paperModalMode === 'create') {
              setManagingQuestionsPaperId(createdPaperId);
            }
          }}
        />
      )}

      {managingQuestionsPaperId && (
        <AdminPaperQuestionsModal
          paperId={managingQuestionsPaperId}
          adminToken={adminToken}
          onClose={() => setManagingQuestionsPaperId(null)}
          onChanged={async (msg) => {
            showToast(msg);
            await loadCoreData();
            if (activeSubTab === 'paper_questions') {
              await loadPaperQuestions();
            }
          }}
        />
      )}

      {managingSubjectId && (
        <AdminSubjectUnitsTopicsModal
          subjectId={managingSubjectId}
          adminToken={adminToken}
          onClose={() => setManagingSubjectId(null)}
          onChanged={async (msg) => {
            showToast(msg);
            await loadCoreData();
          }}
        />
      )}

      {/* CREATE / EDIT MCQ MODAL */}
      {isMcqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#172033] border border-stone-200 dark:border-[#263449] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#004741] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingMcq ? `Edit MCQ (${editingMcq.id})` : 'Create Verified Canonical MCQ'}
              </h3>
              <button onClick={() => setIsMcqModalOpen(false)} className="text-white/80">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMcq} className="p-5 space-y-3 text-xs max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Canonical Subject *</label>
                  <select
                    value={newMcqSubjectCode}
                    disabled={Boolean(editingMcq)}
                    onChange={(e) => setNewMcqSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Difficulty *</label>
                  <select
                    value={newMcqDifficulty}
                    onChange={(e) => setNewMcqDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Question Stem *</label>
                <textarea
                  rows={2}
                  value={newMcqQuestion}
                  onChange={(e) => setNewMcqQuestion(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newMcqOption0}
                  onChange={(e) => setNewMcqOption0(e.target.value)}
                  placeholder="Option A *"
                  required
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
                <input
                  value={newMcqOption1}
                  onChange={(e) => setNewMcqOption1(e.target.value)}
                  placeholder="Option B *"
                  required
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
                <input
                  value={newMcqOption2}
                  onChange={(e) => setNewMcqOption2(e.target.value)}
                  placeholder="Option C *"
                  required
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
                <input
                  value={newMcqOption3}
                  onChange={(e) => setNewMcqOption3(e.target.value)}
                  placeholder="Option D *"
                  required
                  className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Correct Answer *</label>
                  <select
                    value={newMcqCorrectIdx}
                    onChange={(e) => setNewMcqCorrectIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                  >
                    <option value={0}>Option A (0)</option>
                    <option value={1}>Option B (1)</option>
                    <option value={2}>Option C (2)</option>
                    <option value={3}>Option D (3)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Language</label>
                  <select
                    value={newMcqLanguage}
                    onChange={(e) => setNewMcqLanguage(e.target.value as 'en' | 'hi')}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Academic Explanation *</label>
                <textarea
                  rows={2}
                  value={newMcqExplanation}
                  onChange={(e) => setNewMcqExplanation(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMcqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMcq}
                  className="px-4 py-2 rounded-xl bg-[#004741] text-white font-bold"
                >
                  {isSubmittingMcq ? 'Saving...' : editingMcq ? 'Update MCQ' : 'Save MCQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
