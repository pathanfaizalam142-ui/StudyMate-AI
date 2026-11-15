import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { AdminStudentSummary, AdminStudentListResult } from '../../types';
import { api } from '../../services/api';
import { soundManager } from '../../services/soundManager';

interface AdminStudentsViewProps {
  adminToken?: string | null;
  onRefreshGlobalStats?: () => void;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({
  adminToken,
  onRefreshGlobalStats,
}) => {
  // Query & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Data States
  const [students, setStudents] = useState<AdminStudentSummary[]>([]);
  const [pagination, setPagination] = useState<AdminStudentListResult['pagination']>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<AdminStudentListResult['metrics']>({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    semesterCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Status Modal State
  const [statusTargetStudent, setStatusTargetStudent] = useState<AdminStudentSummary | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Password Reset Modal State
  const [resetTargetStudent, setResetTargetStudent] = useState<AdminStudentSummary | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load students from backend
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const res = await api.getAdminStudents(
        {
          search: debouncedSearch || undefined,
          semester: semesterFilter,
          status: statusFilter,
          page,
          pageSize,
        },
        adminToken
      );

      setStudents(res.students || []);
      setPagination(
        res.pagination || {
          page: 1,
          pageSize,
          total: res.students?.length || 0,
          totalPages: 1,
        }
      );
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load student accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, debouncedSearch, semesterFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Handle status toggle (Activate / Deactivate)
  const handleConfirmStatusChange = async () => {
    if (!statusTargetStudent) return;
    setIsUpdatingStatus(true);
    setErrorBanner(null);
    const nextStatus = !statusTargetStudent.isActive;

    try {
      soundManager.play('button_click');
      const res = await api.updateAdminStudentStatus(
        statusTargetStudent.id,
        nextStatus,
        adminToken
      );

      setSuccessBanner(
        `Student "${statusTargetStudent.name}" has been ${
          nextStatus ? 'activated' : 'deactivated'
        } successfully.`
      );
      setStatusTargetStudent(null);
      await loadStudents();
      if (onRefreshGlobalStats) onRefreshGlobalStats();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update student account status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Generate random safe temp password using CSPRNG with unbiased rejection sampling
  const generateRandomPassword = () => {
    soundManager.play('nav_tap');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const charsLen = chars.length;
    // Maximum multiple of charsLen <= 256 to eliminate modulo bias
    const maxValid = 256 - (256 % charsLen);

    let rand = '';
    const buffer = new Uint8Array(1);
    while (rand.length < 6) {
      window.crypto.getRandomValues(buffer);
      const byte = buffer[0];
      if (byte < maxValid) {
        rand += chars.charAt(byte % charsLen);
      }
    }
    const generated = `Study#${rand}`;
    setNewPassword(generated);
    setPasswordError(null);
  };

  // Handle student password reset
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetStudent) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Temporary password must be at least 6 characters in length.');
      return;
    }

    setIsResettingPassword(true);
    setPasswordError(null);

    try {
      soundManager.play('button_click');
      const res = await api.resetAdminStudentPassword(
        resetTargetStudent.id,
        newPassword,
        adminToken
      );

      setSuccessBanner(
        `Password for "${resetTargetStudent.name}" (${resetTargetStudent.email}) has been successfully updated.`
      );
      setResetTargetStudent(null);
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to reset student password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    soundManager.play('nav_tap');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="admin-students-view" className="space-y-5">
      {/* 1. Header & Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8]">
              Total Students
            </span>
            <div className="text-2xl font-display font-black text-black dark:text-[#F1F5F9]">
              {metrics.totalStudents}
            </div>
            <p className="text-[11px] text-black/60 dark:text-[#94A3B8]">
              Registered in canonical database
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Students */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8]">
              Active Accounts
            </span>
            <div className="text-2xl font-display font-black text-emerald-600 dark:text-emerald-400">
              {metrics.activeStudents}
            </div>
            <p className="text-[11px] text-black/60 dark:text-[#94A3B8]">
              Permitted to sign in & study
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive Students */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8]">
              Inactive Accounts
            </span>
            <div className="text-2xl font-display font-black text-amber-600 dark:text-amber-400">
              {metrics.inactiveStudents}
            </div>
            <p className="text-[11px] text-black/60 dark:text-[#94A3B8]">
              Login restricted by admin
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* Semester Breakdown */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-[#94A3B8]">
            Semester Distribution
          </span>
          <div className="grid grid-cols-6 gap-1 pt-1.5 text-center">
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <div
                key={sem}
                onClick={() => {
                  soundManager.play('nav_tap');
                  setSemesterFilter(semesterFilter === sem ? 'all' : sem);
                  setPage(1);
                }}
                className={`p-1 rounded-lg cursor-pointer transition text-center ${
                  semesterFilter === sem
                    ? 'bg-[#004741] text-white'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 text-black/80 dark:text-[#F1F5F9]'
                }`}
                title={`Filter Semester ${sem} (${metrics.semesterCounts[sem] || 0} students)`}
              >
                <div className="text-[9px] uppercase font-bold opacity-60">S{sem}</div>
                <div className="text-xs font-black">{metrics.semesterCounts[sem] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications / Feedback Banners */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-[11px] underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[11px] underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-black/40 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/10 dark:border-[#263449] text-xs text-black dark:text-[#F1F5F9] placeholder:text-black/40 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#004741]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black dark:text-[#94A3B8]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={semesterFilter}
              onChange={(e) => {
                soundManager.play('nav_tap');
                setSemesterFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                );
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/10 dark:border-[#263449] text-xs font-semibold text-black dark:text-[#F1F5F9]"
            >
              <option value="all">All Semesters (1–6)</option>
              {[1, 2, 3, 4, 5, 6].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                soundManager.play('nav_tap');
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/10 dark:border-[#263449] text-xs font-semibold text-black dark:text-[#F1F5F9]"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.play('button_click');
              loadStudents();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-[#0f172a] hover:bg-black/10 dark:hover:bg-[#1e293b] border border-black/10 dark:border-[#263449] text-xs font-semibold text-black dark:text-[#F1F5F9] transition disabled:opacity-50"
            title="Refresh student records from SQLite"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. Students Table / Card View */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xs overflow-hidden">
        {isLoading && students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#004741] dark:text-[#38BDF8]" />
            <p className="text-xs font-semibold text-black/60 dark:text-[#94A3B8]">
              Loading student accounts from SQLite database...
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-black/40 dark:text-[#94A3B8]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
              No student accounts found
            </h3>
            <p className="text-xs text-black/60 dark:text-[#94A3B8] max-w-sm mx-auto">
              {search || semesterFilter !== 'all' || statusFilter !== 'all'
                ? 'No students match your filter criteria. Try clearing search or resetting semester/status filters.'
                : 'No student accounts are currently registered in the database.'}
            </p>
            {(search || semesterFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSemesterFilter('all');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#004741] text-white text-xs font-semibold shadow-xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-[#263449] bg-black/[0.02] dark:bg-[#1e293b]/50 text-black/60 dark:text-[#94A3B8]">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Student
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Curriculum
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Progress / Stats
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Registered
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                    Account Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-[#263449]">
                {students.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-black/[0.015] dark:hover:bg-[#1e293b]/30 transition group"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#004741]/10 dark:bg-[#004741]/25 text-[#004741] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {st.name.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-black dark:text-[#F1F5F9] truncate">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-black/50 dark:text-[#94A3B8] font-mono truncate">
                            {st.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Semester & Branch */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-black dark:text-[#F1F5F9]">
                        Semester {st.semester}
                      </div>
                      <div className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                        {st.branch || 'BCA'}
                      </div>
                    </td>

                    {/* XP & Streak */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span
                          className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"
                          title="Earned Study XP"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{st.xp} XP</span>
                        </span>
                        <span
                          className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400"
                          title="Daily Study Streak"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{st.streak}d</span>
                        </span>
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-black/60 dark:text-[#94A3B8]">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 opacity-60 shrink-0" />
                        <span>{formatDate(st.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {st.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.play('button_click');
                            setStatusTargetStudent(st);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                            st.isActive
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                          title={st.isActive ? 'Deactivate Student Account' : 'Activate Student Account'}
                        >
                          {st.isActive ? (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.play('button_click');
                            setResetTargetStudent(st);
                            setNewPassword('');
                            setPasswordError(null);
                            setShowPassword(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-[#F1F5F9] text-[11px] font-bold transition"
                          title="Reset Student Password"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-black/10 dark:border-[#263449] bg-black/[0.01] dark:bg-[#1e293b]/20 flex items-center justify-between text-xs">
            <span className="text-black/50 dark:text-[#94A3B8] text-[11px]">
              Showing {students.length} of {pagination.total} students (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('nav_tap');
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] hover:bg-black/10 disabled:opacity-40 transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-semibold text-black dark:text-[#F1F5F9]">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundManager.play('nav_tap');
                  setPage((p) => Math.min(pagination.totalPages, p + 1));
                }}
                disabled={page >= pagination.totalPages || isLoading}
                className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-black dark:text-[#F1F5F9] hover:bg-black/10 disabled:opacity-40 transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Confirmation Modal: Status Toggle */}
      {statusTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusTargetStudent.isActive
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {statusTargetStudent.isActive ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                  {statusTargetStudent.isActive
                    ? 'Deactivate Student Account?'
                    : 'Activate Student Account?'}
                </h3>
                <p className="text-xs text-black/60 dark:text-[#94A3B8]">
                  {statusTargetStudent.isActive
                    ? `Deactivating "${statusTargetStudent.name}" will immediately invalidate all active student sessions and prevent subsequent logins.`
                    : `Activating "${statusTargetStudent.name}" will restore login access to StudyMate AI.`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/5 dark:border-[#263449] text-xs space-y-1">
              <div className="font-semibold text-black dark:text-[#F1F5F9]">
                {statusTargetStudent.name}
              </div>
              <div className="text-[11px] text-black/50 dark:text-[#94A3B8] font-mono">
                {statusTargetStudent.email}
              </div>
              <div className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                Semester {statusTargetStudent.semester} • {statusTargetStudent.branch || 'BCA'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusTargetStudent(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-black dark:text-[#F1F5F9] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition shadow-xs ${
                  statusTargetStudent.isActive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus
                  ? 'Updating...'
                  : statusTargetStudent.isActive
                  ? 'Confirm Deactivation'
                  : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Password Reset */}
      {resetTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#172033] border border-black/10 dark:border-[#263449] shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#004741]/10 text-[#004741] dark:text-[#38BDF8] flex items-center justify-center">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-[#F1F5F9]">
                    Reset Student Password
                  </h3>
                  <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                    Sets a new temporary password using scrypt hashing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetStudent(null)}
                className="text-black/40 hover:text-black dark:text-[#94A3B8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/5 dark:border-[#263449] text-xs space-y-1">
              <div className="font-semibold text-black dark:text-[#F1F5F9]">
                {resetTargetStudent.name}
              </div>
              <div className="text-[11px] text-black/50 dark:text-[#94A3B8] font-mono">
                {resetTargetStudent.email}
              </div>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black dark:text-[#F1F5F9]">
                    New Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#004741] dark:text-[#38BDF8] font-bold hover:underline"
                  >
                    Generate Secure
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter at least 6 characters..."
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-black/5 dark:bg-[#0f172a] border border-black/10 dark:border-[#263449] text-xs font-mono text-black dark:text-[#F1F5F9] placeholder:text-black/40 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#004741]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 rounded text-black/50 hover:text-black dark:text-[#94A3B8]"
                        title="Copy Password"
                      >
                        {copiedPassword ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-black/50 hover:text-black dark:text-[#94A3B8]"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {passwordError}
                  </p>
                )}

                <p className="text-[11px] text-black/50 dark:text-[#94A3B8]">
                  Note: Any active student sessions will be revoked. The student must sign in using
                  this new temporary password.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetStudent(null)}
                  disabled={isResettingPassword}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-black dark:text-[#F1F5F9] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword || !newPassword}
                  className="px-5 py-2 rounded-xl bg-[#004741] hover:bg-[#003833] text-white text-xs font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {isResettingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
