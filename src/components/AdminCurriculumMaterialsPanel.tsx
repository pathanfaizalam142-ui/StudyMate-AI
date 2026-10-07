import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

export interface SubjectUnitsTopicsModalProps {
  subjectId: string;
  adminToken: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}

export const AdminSubjectUnitsTopicsModal: React.FC<SubjectUnitsTopicsModalProps> = ({
  subjectId,
  adminToken,
  onClose,
  onChanged,
}) => {
  const [subject, setSubject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subject edit fields
  const [editingSubject, setEditingSubject] = useState(false);
  const [subjName, setSubjName] = useState('');
  const [subjShortName, setSubjShortName] = useState('');
  const [subjCategory, setSubjCategory] = useState('');
  const [subjCredits, setSubjCredits] = useState(4);
  const [subjDesc, setSubjDesc] = useState('');

  // Unit form
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [unitNumber, setUnitNumber] = useState(1);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitWeightage, setUnitWeightage] = useState('25%');

  // Topic form
  const [topicFormUnitId, setTopicFormUnitId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicSummary, setTopicSummary] = useState('');

  const loadSubject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminSubjectById(subjectId, adminToken);
      setSubject(res.subject);
      setSubjName(res.subject.name || '');
      setSubjShortName(res.subject.shortName || '');
      setSubjCategory(res.subject.category || '');
      setSubjCredits(res.subject.credits || 4);
      setSubjDesc(res.subject.description || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load subject details.');
    } finally {
      setLoading(false);
    }
  }, [subjectId, adminToken]);

  useEffect(() => {
    loadSubject();
  }, [loadSubject]);

  const handleSaveSubjectMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.updateAdminSubject(
        subjectId,
        {
          name: subjName.trim(),
          shortName: subjShortName.trim(),
          category: subjCategory.trim(),
          credits: subjCredits,
          description: subjDesc.trim(),
        },
        adminToken
      );
      setEditingSubject(false);
      onChanged(`Updated subject metadata for ${subject.code}.`);
      await loadSubject();
    } catch (err: any) {
      setError(err?.message || 'Failed to update subject metadata.');
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingUnit) {
        await api.updateAdminUnit(
          editingUnit.id,
          { unitNumber, title: unitTitle.trim(), weightage: unitWeightage.trim() },
          adminToken
        );
        onChanged(`Updated Unit ${unitNumber} in ${subject.code}.`);
      } else {
        await api.createAdminUnit(
          {
            subjectId: subject.id,
            unitNumber,
            title: unitTitle.trim(),
            weightage: unitWeightage.trim(),
          },
          adminToken
        );
        onChanged(`Created Unit ${unitNumber} in ${subject.code}.`);
      }
      setUnitFormOpen(false);
      setEditingUnit(null);
      await loadSubject();
    } catch (err: any) {
      setError(err?.message || 'Failed to save unit.');
    }
  };

  const handleDeleteUnit = async (u: any) => {
    setError(null);
    try {
      await api.deleteAdminUnit(u.id, adminToken);
      onChanged(`Deactivated Unit ${u.unitNumber} in ${subject.code}.`);
      await loadSubject();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete unit.');
    }
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormUnitId) return;
    setError(null);
    try {
      if (editingTopic) {
        await api.updateAdminTopic(
          editingTopic.id,
          { title: topicTitle.trim(), summary: topicSummary.trim() },
          adminToken
        );
        onChanged(`Updated topic "${topicTitle.trim()}" in ${subject.code}.`);
      } else {
        await api.createAdminTopic(
          {
            subjectId: subject.id,
            unitId: topicFormUnitId,
            title: topicTitle.trim(),
            summary: topicSummary.trim(),
          },
          adminToken
        );
        onChanged(`Created topic "${topicTitle.trim()}" in ${subject.code}.`);
      }
      setTopicFormUnitId(null);
      setEditingTopic(null);
      await loadSubject();
    } catch (err: any) {
      setError(err?.message || 'Failed to save topic.');
    }
  };

  const handleDeleteTopic = async (t: any) => {
    setError(null);
    try {
      await api.deleteAdminTopic(t.id, adminToken);
      onChanged(`Deactivated topic "${t.title}" in ${subject.code}.`);
      await loadSubject();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete topic.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#172033] border border-stone-200 dark:border-[#263449] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 bg-[#004741] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">
              Canonical Subject Hierarchy — {subject?.code || subjectId} ({subject?.name})
            </h3>
            <p className="text-[11px] text-white/75">
              Semester {subject?.semester} • Manage Metadata, Units & Syllabus Topics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingSubject(!editingSubject)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              Edit Subject Info
            </button>
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitNumber((subject?.units?.length || 0) + 1);
                setUnitTitle('');
                setUnitWeightage('25%');
                setUnitFormOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Unit</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {editingSubject && (
            <form
              onSubmit={handleSaveSubjectMeta}
              className="p-4 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] space-y-3"
            >
              <h4 className="font-bold text-sm">Edit Subject Metadata ({subject?.code})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Subject Name</label>
                  <input
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Short Name</label>
                  <input
                    value={subjShortName}
                    onChange={(e) => setSubjShortName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={subjCredits}
                    onChange={(e) => setSubjCredits(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#004741] text-white font-bold"
                >
                  Save Subject Metadata
                </button>
              </div>
            </form>
          )}

          {unitFormOpen && (
            <form
              onSubmit={handleSaveUnit}
              className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 space-y-3"
            >
              <h4 className="font-bold text-sm">
                {editingUnit ? `Edit Unit ${editingUnit.unitNumber}` : 'Add New Syllabus Unit'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">Unit Number</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Unit Title</label>
                  <input
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Weightage</label>
                  <input
                    value={unitWeightage}
                    onChange={(e) => setUnitWeightage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnitFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#004741] text-white font-bold"
                >
                  Save Unit
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="py-10 text-center text-stone-500">Loading units & topics...</div>
          ) : (
            <div className="space-y-3">
              {(subject?.units || []).map((u: any) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-stone-200 dark:border-[#263449] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#004741]/10 dark:bg-emerald-950/60 text-[#004741] dark:text-emerald-300 font-bold text-[11px] mr-2">
                        Unit {u.unitNumber} ({u.weightage})
                      </span>
                      <span className="font-bold text-sm">{u.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingTopic(null);
                          setTopicTitle('');
                          setTopicSummary('');
                          setTopicFormUnitId(u.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]"
                      >
                        + Topic
                      </button>
                      <button
                        onClick={() => {
                          setEditingUnit(u);
                          setUnitNumber(u.unitNumber);
                          setUnitTitle(u.title);
                          setUnitWeightage(u.weightage || '25%');
                          setUnitFormOpen(true);
                        }}
                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(u)}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {topicFormUnitId === u.id && (
                    <form
                      onSubmit={handleSaveTopic}
                      className="p-3 rounded-lg bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={topicTitle}
                          onChange={(e) => setTopicTitle(e.target.value)}
                          placeholder="Topic Title *"
                          required
                          className="px-2.5 py-1.5 rounded bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                        />
                        <input
                          value={topicSummary}
                          onChange={(e) => setTopicSummary(e.target.value)}
                          placeholder="Topic Summary (optional)"
                          className="px-2.5 py-1.5 rounded bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#263449]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTopicFormUnitId(null)}
                          className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-[#004741] text-white font-bold"
                        >
                          Save Topic
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="pl-3 border-l-2 border-stone-200 dark:border-[#263449] space-y-1.5">
                    {(u.topics || []).map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-stone-50 dark:hover:bg-stone-900/50"
                      >
                        <div>
                          <span className="font-semibold">{t.title}</span>
                          {t.summary && (
                            <span className="text-stone-500 ml-2">— {t.summary}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTopic(t);
                              setTopicTitle(t.title);
                              setTopicSummary(t.summary || '');
                              setTopicFormUnitId(u.id);
                            }}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(t)}
                            className="p-1 rounded hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
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

export interface AdminStudyMaterialsPanelProps {
  subjects: any[];
  adminToken: string;
  onActionSuccess: (msg: string) => void;
}

export const AdminStudyMaterialsPanel: React.FC<AdminStudyMaterialsPanelProps> = ({
  subjects,
  adminToken,
  onActionSuccess,
}) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [subjectCode, setSubjectCode] = useState('BCA301');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState<
    'notes' | 'summary' | 'formula_sheet' | 'reference' | 'video' | 'other'
  >('notes');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminStudyMaterials(
        {
          semester: semesterFilter === 'all' ? undefined : semesterFilter,
          subjectCode: subjectFilter === 'all' ? undefined : subjectFilter,
        },
        adminToken
      );
      setMaterials(res.materials || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load study materials.');
    } finally {
      setLoading(false);
    }
  }, [semesterFilter, subjectFilter, adminToken]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingMaterial) {
        await api.updateAdminStudyMaterial(
          editingMaterial.id,
          {
            title: title.trim(),
            description: description.trim(),
            materialType,
            contentMarkdown: contentMarkdown.trim(),
            language,
          },
          adminToken
        );
        onActionSuccess(`Updated study material "${title.trim()}".`);
      } else {
        await api.createAdminStudyMaterial(
          {
            subjectCode,
            title: title.trim(),
            description: description.trim(),
            materialType,
            contentMarkdown: contentMarkdown.trim(),
            language,
            published: true,
            verified: true,
          },
          adminToken
        );
        onActionSuccess(`Created study material "${title.trim()}" for ${subjectCode}.`);
      }
      setIsFormOpen(false);
      setEditingMaterial(null);
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || 'Failed to save study material.');
    }
  };

  const handleDelete = async (m: any) => {
    try {
      await api.deleteAdminStudyMaterial(m.id, adminToken, { permanent: true });
      onActionSuccess(`Deleted study material "${m.title}".`);
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete study material.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={semesterFilter}
            onChange={(e) =>
              setSemesterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449] text-xs font-semibold"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingMaterial(null);
            setTitle('');
            setDescription('');
            setContentMarkdown('');
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004741] text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Study Material</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="p-4 rounded-2xl bg-white dark:bg-[#172033] border border-emerald-500/40 space-y-3 text-xs"
        >
          <h4 className="font-bold text-sm">
            {editingMaterial ? 'Edit Study Material' : 'Create Canonical Study Material'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Canonical Subject *</label>
              <select
                value={subjectCode}
                disabled={Boolean(editingMaterial)}
                onChange={(e) => setSubjectCode(e.target.value)}
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
              <label className="block font-bold mb-1">Material Type</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              >
                <option value="notes">notes</option>
                <option value="summary">summary</option>
                <option value="formula_sheet">formula_sheet</option>
                <option value="reference">reference</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold mb-1">Markdown Content</label>
            <textarea
              rows={3}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-[#172033] border border-stone-200 dark:border-[#263449]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#004741] text-white font-bold"
            >
              Save Study Material
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#172033] border border-stone-200/80 dark:border-[#263449] p-4 space-y-2 text-xs">
        {loading ? (
          <div className="py-8 text-center text-stone-500">Loading study materials...</div>
        ) : materials.length === 0 ? (
          <div className="py-8 text-center text-stone-500">
            No study materials stored in SQLite yet. Click &ldquo;Add Study Material&rdquo; to create one.
          </div>
        ) : (
          materials.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl border border-stone-200 dark:border-[#263449] flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#004741]/10 text-[#004741] dark:text-emerald-300 font-bold">
                    {m.subjectCode}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-semibold">
                    {m.materialType}
                  </span>
                  <span className="font-bold text-sm">{m.title}</span>
                </div>
                {m.contentMarkdown && (
                  <p className="text-stone-500 mt-1 line-clamp-1">{m.contentMarkdown}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingMaterial(m);
                    setSubjectCode(m.subjectCode);
                    setTitle(m.title);
                    setDescription(m.description || '');
                    setMaterialType(m.materialType);
                    setContentMarkdown(m.contentMarkdown || '');
                    setLanguage(m.language || 'en');
                    setIsFormOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
