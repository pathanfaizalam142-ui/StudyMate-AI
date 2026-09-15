import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardView } from './views/DashboardView';
import { AskAIView } from './views/AskAIView';
import { ExamAnswerView } from './views/ExamAnswerView';
import { QuizView } from './views/QuizView';
import { NotesUploadView } from './views/NotesUploadView';
import { StudyPlanView } from './views/StudyPlanView';
import { SavedAnswersView } from './views/SavedAnswersView';
import { ProfileView } from './views/ProfileView';
import { GTUBcaView } from './views/GTUBcaView';
import { QuestionPapersView } from './views/QuestionPapersView';
import { AuthView } from './views/AuthView';
import { AddSubjectModal } from './components/AddSubjectModal';
import { NotificationsModal } from './components/NotificationsModal';
import { soundManager } from './services/soundManager';
import { authService } from './services/authService';
import { getAllGTUSubjectsFlat } from './data/gtuBcaCurriculum';
import {
  NavigationTab,
  AppLanguage,
  AppTheme,
  SubjectItem,
  SavedItem,
  QuizResult,
  UploadedNote,
  StudyPlanData,
  User,
} from './types';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  // Navigation State: When unauthenticated, route starts at 'auth'. When logged in, route starts at 'home'.
  const [activeTab, setActiveTab] = useState<NavigationTab>(() =>
    authService.getCurrentUser() ? 'home' : 'auth'
  );
  const [navQuery, setNavQuery] = useState<string | undefined>(undefined);
  const [navSubject, setNavSubject] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
      if (!user) {
        setActiveTab('auth');
      }
    });
    return unsubscribe;
  }, []);

  // Language state (en | hi)
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('studymate_lang') as AppLanguage) || 'en';
  });

  // Theme state (light | dark)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('studymate_theme') as AppTheme) || 'light';
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('studymate_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Study Streak
  const [streakDays, setStreakDays] = useState<number>(5);

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Pre-populated subjects list with complete GTU BCA curriculum from Sem 1 to 6
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    const defaultGtu = getAllGTUSubjectsFlat();
    try {
      const stored = localStorage.getItem('studymate_subjects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      }
    } catch {}
    return defaultGtu;
  });

  // Pre-populated saved items so user sees a rich working interface right away
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem('studymate_saved');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'saved-1',
        title: '10M Answer: Deadlock in OS & Coffman Conditions',
        type: 'exam_answer',
        content:
          '### Definition\nA **Deadlock** is an operating system state where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process in the same set.\n\n### 4 Coffman Conditions\n1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.\n2. **Hold and Wait**: A process must hold at least one resource and be waiting to acquire additional resources held by other processes.\n3. **No Preemption**: Resources cannot be preempted forcibly.\n4. **Circular Wait**: A closed chain of processes exists such that each process holds at least one resource that is needed by the next process in the cycle.\n\n### Prevention Techniques\n- Invalidate Circular Wait by imposing total ordering of resources.\n- Invalidate Hold and Wait by requesting all resources at once.',
        subject: 'Operating System',
        marks: 10,
        timestamp: 'Today, 10:15 AM',
      },
      {
        id: 'saved-2',
        title: '7M Answer: TCP vs UDP Differences with Architecture',
        type: 'exam_answer',
        content:
          '### Comparison Matrix\n- **Transmission Control Protocol (TCP)**: Connection-oriented, highly reliable, supports 3-way handshake and error-recovery flow control.\n- **User Datagram Protocol (UDP)**: Connectionless, lightweight, low-latency, best effort delivery without retransmissions.\n\n### Use Cases\n- TCP: HTTP/HTTPS, SSH, File Transfer.\n- UDP: DNS, VoIP, Online Multiplayer Gaming.',
        subject: 'Computer Networks',
        marks: 7,
        timestamp: 'Yesterday',
      },
    ];
  });

  // Quiz history
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(() => {
    try {
      const stored = localStorage.getItem('studymate_quizzes');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'quiz-init-1',
        subject: 'Computer Networks',
        topic: 'OSI Model Layers',
        difficulty: 'medium',
        score: 4,
        total: 5,
        percentage: 80,
        timestamp: 'Yesterday',
        questions: [],
        userAnswers: [],
      },
    ];
  });

  // Uploaded Study Notes
  const [uploadedNotes, setUploadedNotes] = useState<UploadedNote[]>(() => {
    try {
      const stored = localStorage.getItem('studymate_notes');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'note-sample-1',
        name: 'Unit 4 - Distributed Operating Systems & Deadlock.txt',
        sizeFormatted: '48.2 KB',
        uploadedAt: 'Sep 10, 2026',
        content: `UNIT 4: DISTRIBUTED OPERATING SYSTEMS & SYNCHRONIZATION
1. Definition of Deadlock: State in multi-programming where multiple processes are permanently blocked.
2. Coffman Conditions: Mutual exclusion, Hold & Wait, No Preemption, Circular Wait.
3. Banker's Algorithm: Resource allocation algorithm by Edsger Dijkstra to prevent deadlock safely using Available, Max, Allocation, and Need matrices.
4. Semaphore Mechanism: Integer variable accessed only via atomic wait() (P) and signal() (V) operations.
5. Critical Section Problem: Requirements are Mutual Exclusion, Progress, and Bounded Waiting.`,
      },
      {
        id: 'note-sample-2',
        name: 'Computer Networks - OSI & TCP-IP Protocol Suite.txt',
        sizeFormatted: '32.6 KB',
        uploadedAt: 'Sep 11, 2026',
        content: `COMPUTER NETWORKS REVISION SUMMARY
1. Physical Layer: Bit-level transmission, encoding, cable types.
2. Data Link Layer: Framing, error detection (CRC, Parity), Flow control (Stop-and-wait, Sliding Window).
3. Network Layer: Logical IP addressing, Routing protocols (OSPF, BGP, RIP).
4. Transport Layer: TCP (reliable, connection-oriented) vs UDP (connectionless, low latency).
5. Application Layer: HTTP, DNS, SMTP, FTP.`,
      },
    ];
  });

  // Study Plan Data
  const [studyPlan, setStudyPlan] = useState<StudyPlanData>(() => {
    try {
      const stored = localStorage.getItem('studymate_study_plan');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      overview: 'Focused 3-week semester revision covering high-weightage concepts in OS, Networks and Java.',
      dailyTargetHours: 3,
      todayTasks: [
        {
          id: 'task-1',
          title: 'Solve 10-Mark Deadlock & Coffman conditions question',
          subject: 'Operating System',
          durationMin: 45,
          completed: true,
        },
        {
          id: 'task-2',
          title: 'Review TCP vs UDP packet headers and state diagrams',
          subject: 'Computer Networks',
          durationMin: 35,
          completed: true,
        },
        {
          id: 'task-3',
          title: 'Practice 5 MCQs on Java Polymorphism & Abstract Classes',
          subject: 'Java',
          durationMin: 25,
          completed: false,
        },
        {
          id: 'task-4',
          title: 'Revise Bayes Theorem proof and conditional probability',
          subject: 'Mathematics',
          durationMin: 40,
          completed: false,
        },
      ],
      upcomingMilestones: [
        { day: 'Day 2', focus: 'Virtual Memory & Page Replacement Algorithms' },
        { day: 'Day 3', focus: 'IP Subnetting and Classless Inter-Domain Routing (CIDR)' },
        { day: 'Day 4', focus: 'Java Collections Framework & Multithreading Synchronization' },
      ],
    };
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('studymate_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('studymate_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('studymate_sound', soundEnabled ? 'true' : 'false');
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('studymate_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studymate_saved', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('studymate_quizzes', JSON.stringify(quizHistory));
  }, [quizHistory]);

  useEffect(() => {
    localStorage.setItem('studymate_notes', JSON.stringify(uploadedNotes));
  }, [uploadedNotes]);

  useEffect(() => {
    localStorage.setItem('studymate_study_plan', JSON.stringify(studyPlan));
  }, [studyPlan]);

  // Handlers
  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      soundManager.play('button_click');
    }
  };

  const handleNavigate = (
    tab: NavigationTab,
    initialQuery?: string,
    initialSubject?: string
  ) => {
    setNavQuery(initialQuery);
    setNavSubject(initialSubject);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSubject = (newSubject: SubjectItem) => {
    setSubjects((prev) => [...prev, newSubject]);
  };

  const handleSaveItem = (itemData: Omit<SavedItem, 'id' | 'timestamp'>) => {
    const newItem: SavedItem = {
      id: `saved-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...itemData,
    };
    setSavedItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllSaved = () => {
    setSavedItems([]);
  };

  const handleQuizCompleted = (result: QuizResult) => {
    setQuizHistory((prev) => [result, ...prev]);
  };

  const handleAddNote = (newNote: UploadedNote) => {
    setUploadedNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setUploadedNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setSavedItems([]);
    setQuizHistory([]);
    setActiveTab('home');
    alert('All local app data has been reset to defaults.');
    window.location.reload();
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    soundManager.play('button_click');
    setActiveTab('auth');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    soundManager.play('save');
    setActiveTab('home');
  };

  const handleOpenAuth = () => {
    setActiveTab('auth');
  };

  const completedTasksCount = studyPlan.todayTasks.filter((t) => t.completed).length;
  const totalTasksCount = studyPlan.todayTasks.length;

  // VISIBLE LOGIN ENTRY SCREEN:
  // When no authenticated session exists, show the Login screen directly as the initial application screen.
  if (!currentUser) {
    return (
      <div
        id="studymate-auth-app"
        className="min-h-screen bg-[#F0EDE4] dark:bg-[#050807] text-black dark:text-[#F0EDE4] selection:bg-[#004741] selection:text-[#F0EDE4]"
      >
        <AuthView
          language={language}
          onLanguageToggle={handleLanguageToggle}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          soundEnabled={soundEnabled}
          onSoundToggle={handleSoundToggle}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div
      id="studymate-app"
      className="min-h-screen flex flex-col bg-[#F0EDE4] dark:bg-[#050807] text-black dark:text-[#F0EDE4] selection:bg-[#004741] selection:text-[#F0EDE4]"
    >
      {/* Top Navbar */}
      <Navbar
        language={language}
        onLanguageToggle={handleLanguageToggle}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
        streakDays={streakDays}
        onNotificationClick={() => setIsNotificationsOpen(true)}
        onProfileClick={() => setActiveTab('profile')}
        onOpenAuth={handleOpenAuth}
        activeTab={activeTab}
        currentUser={currentUser}
      />

      {/* Main Content Area: Sidebar on Desktop + Dynamic View */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setNavQuery(undefined);
            setNavSubject(undefined);
            setActiveTab(tab);
          }}
          language={language}
          savedCount={savedItems.length}
          quizCount={quizHistory.length}
        />

        {/* View Router Container */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8 overflow-x-hidden min-w-0 w-full">
          {activeTab === 'home' && (
            <DashboardView
              language={language}
              subjects={subjects}
              onOpenAddSubject={() => setIsAddSubjectOpen(true)}
              onNavigate={handleNavigate}
              completedTasksCount={completedTasksCount}
              totalTasksCount={totalTasksCount}
            />
          )}

          {activeTab === 'gtu_bca' && (
            <GTUBcaView
              language={language}
              theme={theme}
              onNavigate={handleNavigate}
              onSaveItem={handleSaveItem}
            />
          )}

          {activeTab === 'ask_ai' && (
            <AskAIView
              language={language}
              theme={theme}
              subjects={subjects}
              initialQuery={navQuery}
              initialSubject={navSubject}
              onSaveItem={handleSaveItem}
              savedItemIds={savedItems.map((i) => i.id)}
            />
          )}

          {activeTab === 'exam_mode' && (
            <ExamAnswerView
              language={language}
              theme={theme}
              subjects={subjects}
              initialSubject={navSubject}
              onSaveItem={handleSaveItem}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizView
              language={language}
              theme={theme}
              subjects={subjects}
              initialSubject={navSubject}
              onQuizCompleted={handleQuizCompleted}
            />
          )}

          {activeTab === 'notes_upload' && (
            <NotesUploadView
              language={language}
              theme={theme}
              uploadedNotes={uploadedNotes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onSaveItem={handleSaveItem}
            />
          )}

          {activeTab === 'study_plan' && (
            <StudyPlanView
              language={language}
              theme={theme}
              subjects={subjects}
              planData={studyPlan}
              onUpdatePlanData={setStudyPlan}
            />
          )}

          {activeTab === 'saved' && (
            <SavedAnswersView
              language={language}
              theme={theme}
              savedItems={savedItems}
              onDeleteSavedItem={handleDeleteSavedItem}
              onClearAllSaved={handleClearAllSaved}
            />
          )}

          {activeTab === 'question_papers' && (
            <QuestionPapersView
              language={language}
              theme={theme}
              onNavigateToAskAI={(query, subject) => handleNavigate('ask_ai', query, subject)}
              onNavigateToCurriculum={() => handleNavigate('gtu_bca')}
            />
          )}

          {activeTab === 'auth' && (
            <AuthView
              language={language}
              onLanguageToggle={handleLanguageToggle}
              theme={theme}
              onThemeToggle={handleThemeToggle}
              soundEnabled={soundEnabled}
              onSoundToggle={handleSoundToggle}
              onAuthSuccess={handleAuthSuccess}
              onCancel={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              language={language}
              onLanguageToggle={handleLanguageToggle}
              theme={theme}
              onThemeToggle={handleThemeToggle}
              soundEnabled={soundEnabled}
              onSoundToggle={handleSoundToggle}
              savedItemsCount={savedItems.length}
              quizHistory={quizHistory}
              streakDays={streakDays}
              onResetAllData={handleResetAllData}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenAuth={() => setActiveTab('auth')}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setNavQuery(undefined);
          setNavSubject(undefined);
          setActiveTab(tab);
        }}
        language={language}
      />

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAddSubject={handleAddSubject}
        language={language}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        language={language}
        streakDays={streakDays}
      />
    </div>
  );
}
