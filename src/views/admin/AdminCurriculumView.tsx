import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit3,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../../services/soundManager';

interface AdminCurriculumViewProps {
  subjects: any[];
  adminToken: string;
  onOpenHierarchyModal: (subjectId: string) => void;
  onRefreshData: () => void;
}

export const AdminCurriculumView: React.FC<AdminCurriculumViewProps> = ({
  subjects,
  onOpenHierarchyModal,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(() => {
    return subjects[0]?.id || null;
  });

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subj) => {
      const matchSem = selectedSemester === 'all' || subj.semester === selectedSemester;
      const matchSearch =
        !searchQuery.trim() ||
        subj.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subj.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSem && matchSearch;
    });
  }, [subjects, selectedSemester, searchQuery]);

  const activeSubject = useMemo(() => {
    if (selectedSubjectId) {
      const found = subjects.find((s) => s.id === selectedSubjectId);
      if (found) return found;
    }
    return filteredSubjects[0] || subjects[0] || null;
  }, [subjects, selectedSubjectId, filteredSubjects]);

  return (
    <div id="admin-curriculum-view" className="space-y-4">
      {/* Two-Column Curriculum Workspace (LEFT: Subject List, RIGHT: Subject Details & Units) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Subject Filter & List (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs p-4 space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8]">
                Subjects Directory
              </h2>
              <span className="text-[11px] font-mono text-black/50 dark:text-[#94A3B8]">
                {filteredSubjects.length} of {subjects.length} Subjects
              </span>
            </div>

            {/* Semester Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('nav_tap');
                  setSelectedSemester('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedSemester === 'all'
                    ? 'bg-[#004741] text-[#F0EDE4] shadow-xs'
                    : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10'
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5, 6].map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => {
                    soundManager.play('nav_tap');
                    setSelectedSemester(sem);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedSemester === sem
                      ? 'bg-[#004741] text-[#F0EDE4] shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-[#94A3B8] hover:bg-black/10'
                  }`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-black/40 dark:text-[#94A3B8]/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by code or name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-[#172033] border border-black/10 dark:border-[#263449] text-xs focus:outline-none focus:ring-1 focus:ring-[#004741]"
              />
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
            {filteredSubjects.map((s) => {
              const isSelected = activeSubject?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    soundManager.play('nav_tap');
                    setSelectedSubjectId(s.id);
                  }}
                  className={`cursor-pointer p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#004741] text-[#F0EDE4] border-[#004741] shadow-xs'
                      : 'bg-black/[0.01] dark:bg-[#172033] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border-black/5 dark:border-[#263449]/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isSelected ? 'text-[#6ee7b7]' : 'text-[#004741] dark:text-[#38BDF8]'
                        }`}
                      >
                        {s.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                        }`}
                      >
                        Sem {s.semester}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">{s.name}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-[#F0EDE4]/80' : 'text-black/50 dark:text-[#94A3B8]'
                      }`}
                    >
                      {s.unitCount || 0} Units · {s.topicCount || 0} Topics · {s.mcqCount || 0} MCQs
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-1 text-[#F0EDE4]' : 'opacity-40'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Subject Workspace (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSubject ? (
            <div className="rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs p-5 space-y-5">
              {/* Subject Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-black/10 dark:border-[#263449] pb-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#004741] text-[#F0EDE4] font-mono font-bold text-xs">
                      {activeSubject.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                      Semester {activeSubject.semester}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {activeSubject.credits || 4} Credits
                    </span>
                    {activeSubject.category && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {activeSubject.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-black text-black dark:text-[#F1F5F9]">
                    {activeSubject.name}
                  </h3>
                  {activeSubject.description && (
                    <p className="text-xs text-black/65 dark:text-[#94A3B8] leading-relaxed">
                      {activeSubject.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenHierarchyModal(activeSubject.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004741] hover:bg-[#003833] text-white text-xs font-bold transition shadow-xs self-start"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manage Units & Topics</span>
                </button>
              </div>

              {/* Units & Topics Summary List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#004741] dark:text-[#38BDF8]" />
                    <span>Curriculum Hierarchy Units ({activeSubject.unitCount || 0})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenHierarchyModal(activeSubject.id)}
                    className="text-xs font-bold text-[#004741] dark:text-[#38BDF8] hover:underline"
                  >
                    + Add / Edit Units
                  </button>
                </div>

                {Array.isArray(activeSubject.units) && activeSubject.units.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeSubject.units.map((unit: any) => (
                      <div
                        key={unit.id}
                        className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-black/8 dark:border-[#263449] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-black dark:text-[#F1F5F9]">
                            Unit {unit.unitNumber}: {unit.title || unit.unitName}
                          </span>
                          <span className="text-[11px] font-mono text-[#004741] dark:text-[#38BDF8] font-semibold">
                            {unit.weightage || '25%'}
                          </span>
                        </div>
                        {Array.isArray(unit.topics) && unit.topics.length > 0 && (
                          <div className="pl-3 border-l-2 border-[#004741]/30 space-y-1">
                            {unit.topics.map((t: any) => (
                              <div
                                key={t.id}
                                className="text-[11px] text-black/70 dark:text-[#94A3B8] flex items-center justify-between"
                              >
                                <span>• {t.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-black/[0.02] dark:bg-[#172033] border border-dashed border-black/15 dark:border-[#263449] text-center space-y-2">
                    <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                      Units and topics for this subject can be managed directly via the hierarchy manager.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenHierarchyModal(activeSubject.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004741] text-white text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configure Units & Topics</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] text-center space-y-2">
              <BookOpen className="w-8 h-8 text-black/30 dark:text-[#94A3B8]/50 mx-auto" />
              <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                Select a subject from the directory on the left to view and manage its curriculum units.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
