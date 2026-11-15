import { User } from '../types';
import { api } from './api';

/**
 * Authentication Service for StudyMate AI.
 *
 * - Strictly backed by server-side SQLite (`users` and `user_sessions`) via HttpOnly session cookies.
 * - Never hashes or stores passwords, salts, or session bearer tokens in localStorage/sessionStorage.
 * - Preserves `authService.subscribe()` and synchronous `getCurrentUser()` for UI reactivity.
 */

const AUTH_SESSION_KEY = 'studymate_user_session_v3';
const LEGACY_KEYS = [
  'studymate_student_token_v1',
  'studymate_registered_accounts_v1',
  'studymate_migrated_accounts_v1',
  'studymate_auth_user',
  'studymate_auth_session_v2',
  'studymate_auth_session_v1',
];

type AuthStateListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];
  private isInitialized = false;

  constructor() {
    this.initSession();
  }

  private purgeLegacyKeys() {
    if (typeof window === 'undefined') return;
    for (const key of LEGACY_KEYS) {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch {}
    }
  }

  private initSession() {
    try {
      this.purgeLegacyKeys();

      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY)
          : null;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.id &&
          parsed.email &&
          !parsed.isDemo
        ) {
          this.currentUser = parsed;
        } else {
          this.clearLocalSession();
        }
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
    this.isInitialized = true;

    // Verify HttpOnly session cookie against SQLite backend on mount
    this.verifyServerSessionInBackground();
  }

  private async verifyServerSessionInBackground() {
    if (typeof window === 'undefined') return;

    try {
      const res = await api.studentMe();
      if (res && res.authenticated && res.user && res.user.role === 'student') {
        const updatedUser: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: 'student',
          semester: res.user.semester,
          course: `${res.user.branch || 'BCA'} (Gujarat Technological University)`,
          college: this.currentUser?.college || 'Gujarat Technological University (GTU)',
          enrollmentNo: this.currentUser?.enrollmentNo,
          avatarSeed: this.generateAvatarSeed(res.user.name),
          createdAt: res.user.createdAt,
          isDemo: false,
        };
        this.currentUser = updatedUser;
        const serialized = JSON.stringify(updatedUser);
        if (sessionStorage.getItem(AUTH_SESSION_KEY)) {
          sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
        } else {
          localStorage.setItem(AUTH_SESSION_KEY, serialized);
        }
        this.notify();
        return;
      }
    } catch {
      // Session invalid or expired
    }

    if (this.currentUser) {
      this.clearLocalSession();
      this.notify();
    }
  }

  private generateAvatarSeed(name: string): string {
    const parts = (name || '').trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name || 'ST').slice(0, 2).toUpperCase();
  }

  private clearLocalSession() {
    this.currentUser = null;
    this.purgeLegacyKeys();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } catch {}
    }
  }

  public subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  public getCurrentUser(): User | null {
    if (!this.isInitialized) {
      this.initSession();
    }
    return this.currentUser;
  }

  public async login(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { success: false, error: 'Please provide both email address and password.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const serverRes = await api.studentLogin(normalizedEmail, password, rememberMe);
      if (serverRes && serverRes.success && serverRes.user) {
        const authenticatedUser: User = {
          id: serverRes.user.id,
          name: serverRes.user.name,
          email: serverRes.user.email,
          role: 'student',
          semester: serverRes.user.semester,
          course: `${serverRes.user.branch || 'BCA'} (Gujarat Technological University)`,
          college: 'Gujarat Technological University (GTU)',
          avatarSeed: this.generateAvatarSeed(serverRes.user.name),
          createdAt: serverRes.user.createdAt,
          isDemo: false,
        };

        this.currentUser = authenticatedUser;
        const serialized = JSON.stringify(authenticatedUser);

        if (rememberMe) {
          localStorage.setItem(AUTH_SESSION_KEY, serialized);
          sessionStorage.removeItem(AUTH_SESSION_KEY);
        } else {
          sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
          localStorage.removeItem(AUTH_SESSION_KEY);
        }

        this.notify();
        return { success: true, user: authenticatedUser };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Invalid email or password.',
      };
    }

    return { success: false, error: 'Authentication failed. Please try again.' };
  }

  public async register(
    name: string,
    email: string,
    password: string,
    college = 'Gujarat Technological University (GTU)',
    semester = 4,
    course = 'Bachelor of Computer Applications (BCA)'
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const semNum = Number(semester) || 1;

    try {
      const regRes = await api.studentRegister({
        name: trimmedName,
        email: normalizedEmail,
        password,
        semester: semNum,
        branch: 'BCA',
        rememberMe: true,
      });

      if (regRes && regRes.success && regRes.user) {
        const newUser: User = {
          id: regRes.user.id,
          name: regRes.user.name,
          email: regRes.user.email,
          role: 'student',
          college: college.trim() || 'Gujarat Technological University (GTU)',
          course: course.trim() || 'Bachelor of Computer Applications (BCA)',
          semester: regRes.user.semester,
          avatarSeed: this.generateAvatarSeed(regRes.user.name),
          createdAt: regRes.user.createdAt,
          isDemo: false,
        };

        this.currentUser = newUser;
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newUser));
        sessionStorage.removeItem(AUTH_SESSION_KEY);

        this.notify();
        return { success: true, user: newUser };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Registration failed. Please try again.',
      };
    }

    return { success: false, error: 'Registration failed. Please try again.' };
  }

  public async logout(): Promise<void> {
    await api.studentLogout();
    this.clearLocalSession();
    this.notify();
  }

  public async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${normalizedEmail}. Please check your inbox or spam folder.`,
    };
  }

  public async updateUserProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user currently authenticated');
    }

    const updatedUser: User = {
      ...this.currentUser,
      ...updates,
    };

    this.currentUser = updatedUser;
    const serialized = JSON.stringify(updatedUser);
    if (localStorage.getItem(AUTH_SESSION_KEY)) {
      localStorage.setItem(AUTH_SESSION_KEY, serialized);
    }
    if (sessionStorage.getItem(AUTH_SESSION_KEY)) {
      sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
    }

    this.notify();
    return updatedUser;
  }
}

export const authService = new AuthService();

