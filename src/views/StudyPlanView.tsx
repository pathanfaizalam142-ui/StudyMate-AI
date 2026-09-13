import React, { useState } from 'react';
import {
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  RotateCcw,
  Target,
  ListTodo,
} from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { api } from '../services/api';
import { StudyPlanData, StudyTask, SubjectItem, AppLanguage, AppTheme } from '../types';
import { translations } from '../services/i18n';

interface StudyPlanViewProps {
  language: AppLanguage;
  theme: AppTheme;
  subjects: SubjectItem[];
  planData: StudyPlanData;
  onUpdatePlanData: (data: StudyPlanData) => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  language,
  theme,
  subjects,
  planData,
  onUpdatePlanData,
}) => {
  const t = translations[language];

  const [examDate, setExamDate] = useState('2026-10-15');
  const [dailyHours, setDailyHours] = useState(3);
  const [difficulty, setDifficulty] = useState('Medium');
  const [targetTopics, setTargetTopics] = useState('Deadlocks, OSI Layers, Binary Trees, SQL Normalization');
  const [isLoading, setIsLoading] = useState(false);

  const completedCount = planData.todayTasks.filter((t) => t.completed).length;
  const totalCount = planData.todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTask = (taskId: string) => {
    soundManager.play('save');
    const updated = planData.todayTasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onUpdatePlanData({
      ...planData,
      todayTasks: updated,
    });
  };

  const handleGeneratePlan = async () => {
    soundManager.play('button_click');
    setIsLoading(true);

    try {
      const res = await api.generateStudyPlan({
        subjects: subjects.map((s) => s.name),
        examDate,
        dailyHours,
        difficulty,
        topics: targetTopics.split(',').map((s) => s.trim()),
        language,
      });

      if (res.plan && res.plan.todayTasks) {
        onUpdatePlanData(res.plan);
        soundManager.play('ai_response_ready');
      }
    } catch (err: any) {
      alert(`Could not generate study plan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="study-plan-view" className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-20 md:pb-8 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#004741] text-[#F0EDE4] shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-black text-black dark:text-[#F0EDE4] tracking-tight leading-tight">
              {t.planHeader}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 dark:text-[#F0EDE4]/70">
              {t.planSub}
            </p>
          </div>
        </div>
      </div>

      {/* Progress & Overview Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#004741] text-[#F0EDE4] shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F0EDE4]/80">
              {t.overallProgress}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <span className="text-2xl sm:text-4xl font-black">{progressPercent}%</span>
              <span className="text-xs text-[#F0EDE4]/80">
                ({completedCount} of {totalCount} tasks completed)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-black/20 text-xs font-semibold">
              🎯 Target: {planData.dailyTargetHours || dailyHours}h/day
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
          <div
            className="h-full bg-[#F0EDE4] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-[#F0EDE4]/90 italic leading-relaxed">
          "{planData.overview}"
        </p>
      </div>

      {/* Setup Inputs Accordion / Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0c1412] border border-black/10 dark:border-white/10 shadow-sm space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-black dark:text-[#F0EDE4] uppercase tracking-wider">
            Plan Preferences
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-black/70 dark:text-[#F0EDE4]/70 mb-1">
              {t.targetDate}
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-xs font-semibold focus:ring-1 focus:ring-[#004741]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-black/70 dark:text-[#F0EDE4]/70 mb-1">
              {t.dailyHours}
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-xs font-semibold focus:ring-1 focus:ring-[#004741]"
            >
              {[1, 2, 3, 4, 5, 6].map((h) => (
                <option key={h} value={h}>
                  {h} Hours / Day
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black/70 dark:text-[#F0EDE4]/70 mb-1">
              {t.difficulty}
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-xs font-semibold focus:ring-1 focus:ring-[#004741]"
            >
              <option value="Easy">Easy (Foundation Focus)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Intense">Intense (Rapid Revision)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-black/70 dark:text-[#F0EDE4]/70 mb-1">
            Focus Topics (Comma separated)
          </label>
          <input
            type="text"
            value={targetTopics}
            onChange={(e) => setTargetTopics(e.target.value)}
            placeholder="e.g. Deadlocks, TCP Handshake, BST traversal..."
            className="w-full py-2 px-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F0EDE4]/40 dark:bg-black/30 text-xs font-medium focus:ring-1 focus:ring-[#004741]"
          />
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isLoading}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#004741] text-[#F0EDE4] text-xs font-bold hover:bg-black transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#F0EDE4] border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Adaptive Schedule...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.generatePlan}</span>
            </>
          )}
        </button>
      </div>

      {/* Today's Tasks List */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-black dark:text-[#F0EDE4] tracking-tight">
          {t.todaysTasks}
        </h2>

        <div className="space-y-2.5">
          {planData.todayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id)}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 sm:gap-3 ${
                task.completed
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 line-through opacity-80'
                  : 'bg-white/90 dark:bg-[#0c1412] border-black/10 dark:border-white/10 hover:border-[#004741]'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  type="button"
                  className={`shrink-0 ${
                    task.completed
                      ? 'text-emerald-600'
                      : 'text-black/30 dark:text-[#F0EDE4]/30 hover:text-[#004741]'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-current" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#004741]/10 text-[#004741] dark:text-[#6ee7b7] mr-1.5 inline-block">
                    {task.subject}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-black dark:text-[#F0EDE4] truncate">
                    {task.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-black/60 dark:text-[#F0EDE4]/60 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.durationMin}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Milestones */}
      {planData.upcomingMilestones && planData.upcomingMilestones.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-bold text-black dark:text-[#F0EDE4] tracking-tight">
            Upcoming Milestones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {planData.upcomingMilestones.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/80 dark:bg-black/30 border border-black/10 dark:border-white/10 space-y-1"
              >
                <span className="text-xs font-bold text-[#004741] dark:text-[#6ee7b7]">
                  {m.day}
                </span>
                <p className="text-xs font-medium text-black/80 dark:text-[#F0EDE4]/80">
                  {m.focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
