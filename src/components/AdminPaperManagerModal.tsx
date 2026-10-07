import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Archive,
  GitBranch,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

interface AdminSubjectOption {
  id: string;
  semester: number;
  code: string;
  name: string;
  units?: Array<{
    id: string;
    unitNumber: number;
    title: string;
    topics: Array<{ id: string; title: string }>;
  }>;
}

export interface PaperFormModalProps {
  mode: 'create' | 'edit';
  initialPaper?: any | null;
  defaultSubject?: { semester: number; subjectCode: string; subjectId: string; subjectName: string } | null;
  subjects: AdminSubjectOption[];
  adminToken: string;
  onClose: () => void;
  onSaved: (message: string, paperId?: string) => void;
}

export const AdminPaperFormModal: React.FC<PaperFormModalProps> = ({
  mode,
  initialPaper,
  defaultSubject,
  subjects,
  adminToken,
  onClose,
  onSaved,
}) => {
  const [semester, setSemester] = useState<number>(
    initialPaper?.semester || defaultSubject?.semester || 3
  );
  const [subjectCode, setSubjectCode] = useState<string>(
    initialPaper?.subjectCode || defaultSubject?.subjectCode || 'BCA301'
  );
  const [examYear, setExamYear] = useState<number>(initialPaper?.examYear || 2025);
  const [examSession, setExamSession] = useState<'Summer' | 'Winter'>(
    initialPaper?.examSession || 'Winter'
  );
  const [title, setTitle] = useState<string>(initialPaper?.title || '');
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'available' | 'unavailable' | 'pending_verification' | 'archived'
  >(initialPaper?.availabilityStatus || 'available');
  const [totalMarks, setTotalMarks] = useState<number>(initialPaper?.totalMarks || 70);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialPaper?.durationMinutes || 150
  );
  const [examDate, setExamDate] = useState<string>(initialPaper?.examDate || '');
  const [examTime, setExamTime] = useState<string>(
    initialPaper?.examTime || '10:30 AM to 01:00 PM'
  );
  const [instructionsText, setInstructionsText] = useState<string>(
    Array.isArray(initialPaper?.instructions) && initialPaper.instructions.length > 0
      ? initialPaper.instructions.join('\n')
      : '1. Attempt all questions.\n2. Figures to the right indicate full marks.\n3. Make suitable assumptions wherever necessary.'
  );
  const [published, setPublished] = useState<boolean>(
    initialPaper?.published !== undefined ? Boolean(initialPaper.published) : true
  );
  const [verified, setVerified] = useState<boolean>(
    initialPaper?.verified !== undefined ? Boolean(initialPaper.verified) : true
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semesterSubjects = subjects.filter((s) => s.semester === semester);

  useEffect(() => {
    if (mode === 'create' && semesterSubjects.length > 0) {
      const exists = semesterSubjects.some((s) => s.code === subjectCode);
      if (!exists) {
        setSubjectCode(semesterSubjects[0].code);
      }
    }
  }, [semester, mode, semesterSubjects, subjectCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const instructions = instructionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (mode === 'create') {
        const res = await api.createAdminPaper(
          {
            semester,
            subjectCode,
            examYear,
            examSession,
            title: title.trim() || undefined,
            availabilityStatus,
            totalMarks,
            durationMinutes,
            examDate: examDate.trim() || undefined,
            examTime: examTime.trim() || undefined,
            instructions,
            published,
            verified,
          },
          adminToken
        );
        onSaved(
          `Created GTU paper ${res.paper.paperId} for ${res.paper.subjectCode} (${res.paper.examSession} ${res.paper.examYear}).`,
          res.paper.paperId
        );
      } else if (initialPaper?.paperId) {
        const res = await api.updateAdminPaper(
          initialPaper.paperId,
          {
            examYear,
            examSession,
            title: title.trim() || undefined,
            availabilityStatus,
            totalMarks,
            durationMinutes,
            examDate: examDate.trim() || null,
            examTime: examTime.trim() || null,
            instructions,
            published,
            verified,
          },
          adminToken
        );
        onSaved(
          `Updated paper ${res.paper.paperId} (${res.paper.subjectCode} • ${res.paper.availabilityStatus}).`,
          res.paper.paperId
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save GTU paper.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#172033] border border-stone-200 dark:border-[#263449] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 bg-[#004741] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm">
              {mode === 'create'
                ? 'Create Canonical GTU Examination Paper'
                : `Edit GTU Paper (${initialPaper?.subjectCode} • ${initialPaper?.paperId})`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Canonical Semester *
              </label>
              <select
                value={semester}
                disabled={mode === 'edit'}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] disabled:opacity-60"
              >
                {[1, 2, 3, 4, 5, 6].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Canonical Subject *
              </label>
              <select
                value={subjectCode}
                disabled={mode === 'edit'}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] disabled:opacity-60"
              >
                {semesterSubjects.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Exam Year *
              </label>
              <input
                type="number"
                min={2018}
                max={2035}
                value={examYear}
                onChange={(e) => setExamYear(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Exam Session *
              </label>
              <select
                value={examSession}
                onChange={(e) => setExamSession(e.target.value as 'Summer' | 'Winter')}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              >
                <option value="Winter">Winter</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Paper Title (optional auto-generated if blank)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., GTU BCA Sem 3 BCA301 Winter 2025 Examination"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Availability Status
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) =>
                  setAvailabilityStatus(
                    e.target.value as
                      | 'available'
                      | 'unavailable'
                      | 'pending_verification'
                      | 'archived'
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              >
                <option value="available">available</option>
                <option value="pending_verification">pending_verification</option>
                <option value="unavailable">unavailable</option>
                <option value="archived">archived</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                  Duration (Min)
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Exam Date Label
              </label>
              <input
                type="text"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                placeholder="e.g., 18/11/2025"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                Exam Time Window
              </label>
              <input
                type="text"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                placeholder="10:30 AM to 01:00 PM"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
              Candidate Instructions (one per line)
            </label>
            <textarea
              rows={3}
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="inline-flex items-center gap-2 font-bold text-stone-700 dark:text-[#94A3B8] cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-stone-300 text-[#004741] focus:ring-[#004741]"
              />
              <span>Published to Student Portal</span>
            </label>

            <label className="inline-flex items-center gap-2 font-bold text-stone-700 dark:text-[#94A3B8] cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="rounded border-stone-300 text-[#004741] focus:ring-[#004741]"
              />
              <span>Academic Verification Passed</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-[#263449]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-[#94A3B8] font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#004741] hover:bg-[#003833] text-white font-bold disabled:opacity-50"
            >
              {submitting
                ? 'Saving to SQLite...'
                : mode === 'create'
                ? 'Create Paper'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface AdminPaperQuestionsModalProps {
  paperId: string;
  adminToken: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}

export const AdminPaperQuestionsModal: React.FC<AdminPaperQuestionsModalProps> = ({
  paperId,
  adminToken,
  onClose,
  onChanged,
}) => {
  const [paperDetail, setPaperDetail] = useState<any | null>(null);
  const [subjectHierarchy, setSubjectHierarchy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Question Add/Edit Form state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sectionNumber, setSectionNumber] = useState<number>(1);
  const [sectionTitle, setSectionTitle] = useState<string>('Q.1');
  const [questionNumber, setQuestionNumber] = useState<string>('Q.1(a)');
  const [subQuestionLabel, setSubQuestionLabel] = useState<string>('a');
  const [marks, setMarks] = useState<number>(7);
  const [questionText, setQuestionText] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [isAlternative, setIsAlternative] = useState<boolean>(false);
  const [relatedQuestionId, setRelatedQuestionId] = useState<string>('');
  const [choiceGroupLabel, setChoiceGroupLabel] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<string>('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminPaperById(paperId, adminToken);
      setPaperDetail(res.paper);
      if (res.paper?.subjectId) {
        const subjRes = await api.getAdminSubjectById(res.paper.subjectId, adminToken);
        setSubjectHierarchy(subjRes.subject);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load paper questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [paperId]);

  const openAddForm = () => {
    setEditingQuestion(null);
    setSectionNumber(1);
    setSectionTitle('Q.1');
    setQuestionNumber('Q.1(a)');
    setSubQuestionLabel('');
    setMarks(7);
    setQuestionText('');
    setUnitId('');
    setTopicId('');
    setIsAlternative(false);
    setRelatedQuestionId('');
    setChoiceGroupLabel('');
    setDisplayOrder('');
    setIsFormOpen(true);
  };

  const openEditForm = (q: any) => {
    setEditingQuestion(q);
    setSectionNumber(q.sectionNumber || 1);
    setSectionTitle(q.sectionTitle || `Q.${q.sectionNumber || 1}`);
    setQuestionNumber(q.questionNumber || '');
    setSubQuestionLabel(q.subQuestionLabel || '');
    setMarks(q.marks || 7);
    setQuestionText(q.questionText || '');
    setUnitId(q.unitId || '');
    setTopicId(q.topicId || '');
    setIsAlternative(Boolean(q.isAlternative));
    setRelatedQuestionId(q.relatedQuestionId || '');
    setChoiceGroupLabel(q.choiceGroupLabel || '');
    setDisplayOrder(String(q.displayOrder || ''));
    setIsFormOpen(true);
  };

  const primaryQuestionsInSection = (paperDetail?.questions || []).filter(
    (q: any) =>
      q.sectionNumber === sectionNumber &&
      !q.isAlternative &&
      (!editingQuestion || q.id !== editingQuestion.id)
  );

  const selectedUnitObj = (subjectHierarchy?.units || []).find((u: any) => u.id === unitId);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuestion(true);
    setError(null);
    try {
      const payload: any = {
        sectionNumber,
        sectionTitle: sectionTitle.trim() || `Q.${sectionNumber}`,
        questionNumber: questionNumber.trim(),
        subQuestionLabel: subQuestionLabel.trim() || null,
        choiceGroupLabel: choiceGroupLabel.trim() || null,
        isAlternative,
        relatedQuestionId: isAlternative && relatedQuestionId ? relatedQuestionId : null,
        questionText: questionText.trim(),
        marks,
        unitId: unitId || null,
        topicId: topicId || null,
      };
      if (displayOrder.trim() && !isNaN(Number(displayOrder))) {
        payload.displayOrder = Number(displayOrder);
      }

      if (editingQuestion) {
        await api.updateAdminPaperQuestion(editingQuestion.id, payload, adminToken);
        onChanged(`Updated question ${payload.questionNumber} in ${paperDetail.subjectCode}.`);
      } else {
        await api.createAdminPaperQuestion(paperId, payload, adminToken);
        onChanged(`Added question ${payload.questionNumber} to ${paperDetail.subjectCode}.`);
      }
      setIsFormOpen(false);
      await loadDetail();
    } catch (err: any) {
      setError(err?.message || 'Failed to save paper question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (q: any) => {
    setError(null);
    try {
      await api.deleteAdminPaperQuestion(q.id, adminToken);
      onChanged(`Deleted question ${q.questionNumber} from ${paperDetail.subjectCode}.`);
      await loadDetail();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete paper question.');
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!paperDetail?.questions) return;
    const list = [...paperDetail.questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderedIds = list.map((q: any) => q.id);
    try {
      const res = await api.reorderAdminPaperQuestions(paperId, orderedIds, adminToken);
      setPaperDetail(res.paper);
      onChanged(`Reordered questions in ${paperDetail.subjectCode}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder questions.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#172033] border border-stone-200 dark:border-[#263449] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 bg-[#004741] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-300" />
              <h3 className="font-bold text-sm">
                Manage Paper Questions — {paperDetail?.subjectCode || paperId}{' '}
                {paperDetail ? `(${paperDetail.examSession} ${paperDetail.examYear})` : ''}
              </h3>
            </div>
            {paperDetail && (
              <p className="text-[11px] text-white/75 mt-0.5">
                Paper ID: <span className="font-mono">{paperDetail.paperId}</span> • Subject ID:{' '}
                <span className="font-mono">{paperDetail.subjectId}</span> • Questions:{' '}
                {paperDetail.questions?.length || 0}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isFormOpen && (
            <form
              onSubmit={handleSaveQuestion}
              className="p-4 rounded-2xl bg-stone-50 dark:bg-[#172033]/90 border border-emerald-500/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#004741] dark:text-emerald-300">
                  {editingQuestion
                    ? `Edit Question ${editingQuestion.questionNumber}`
                    : 'Add New Question to Paper'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Section No. *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={sectionNumber}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setSectionNumber(n);
                      setSectionTitle(`Q.${n}`);
                    }}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Question No. *
                  </label>
                  <input
                    type="text"
                    value={questionNumber}
                    onChange={(e) => setQuestionNumber(e.target.value)}
                    placeholder="Q.1(a)"
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={70}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                  placeholder="Enter authentic GTU examination question text..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Canonical Unit (Optional)
                  </label>
                  <select
                    value={unitId}
                    onChange={(e) => {
                      setUnitId(e.target.value);
                      setTopicId('');
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  >
                    <option value="">-- Unassigned --</option>
                    {(subjectHierarchy?.units || []).map((u: any) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unitNumber}: {u.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Canonical Topic (Optional)
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={!selectedUnitObj}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449] disabled:opacity-50"
                  >
                    <option value="">-- Unassigned --</option>
                    {(selectedUnitObj?.topics || []).map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                    Display Order (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="Auto"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <label className="inline-flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlternative}
                    onChange={(e) => setIsAlternative(e.target.checked)}
                    className="rounded border-amber-400"
                  />
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Mark as Alternative (OR) Question in Section {sectionNumber}</span>
                </label>

                {isAlternative && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                        Link to Primary Question in Section {sectionNumber}
                      </label>
                      <select
                        value={relatedQuestionId}
                        onChange={(e) => setRelatedQuestionId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                      >
                        <option value="">-- Adjacent Primary Question in Section --</option>
                        {primaryQuestionsInSection.map((pq: any) => (
                          <option key={pq.id} value={pq.id}>
                            {pq.questionNumber} — {pq.questionText.slice(0, 55)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-[#94A3B8] mb-1">
                        Choice Group Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={choiceGroupLabel}
                        onChange={(e) => setChoiceGroupLabel(e.target.value)}
                        placeholder={`OR_SEC_${sectionNumber}`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-4 py-1.5 rounded-lg bg-[#004741] text-white font-bold disabled:opacity-50"
                >
                  {savingQuestion
                    ? 'Saving...'
                    : editingQuestion
                    ? 'Update Question'
                    : 'Add Question'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="py-10 text-center text-stone-500">Loading paper questions...</div>
          ) : !paperDetail?.questions?.length ? (
            <div className="py-10 text-center text-stone-500">
              No questions registered for this paper yet. Click &ldquo;Add Question&rdquo; above.
            </div>
          ) : (
            <div className="space-y-2">
              {paperDetail.questions.map((q: any, idx: number) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    q.isAlternative
                      ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800/50 ml-5'
                      : 'bg-stone-50/70 dark:bg-[#172033]/50 border-stone-200/80 dark:border-[#263449]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[10px] font-bold">
                        #{q.displayOrder}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#004741]/10 dark:bg-emerald-950/60 text-[#004741] dark:text-emerald-300 font-bold text-[11px]">
                        Sec {q.sectionNumber} ({q.sectionTitle}) • {q.questionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 font-bold text-[10px]">
                        {q.marks} Marks
                      </span>
                      {q.isAlternative && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                          OR Alternative{' '}
                          {q.relatedQuestionNumber ? `(to ${q.relatedQuestionNumber})` : ''}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">
                        subject_id={q.subjectId}
                      </span>
                    </div>
                    <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      title="Move Up"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === paperDetail.questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      title="Move Down"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(q)}
                      title="Edit Question"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-[#94A3B8]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q)}
                      title="Delete Question"
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
