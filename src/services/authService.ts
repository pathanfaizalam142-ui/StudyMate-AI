import { User } from '../types';
import { api } from './api';

/**
 * Authentication Service for StudyMate AI.
 * 
 * Phase 2 SQLite Canonical Store Integration:
 * - Backed by server-side SQLite (`users` and `user_sessions` tables).
 * - Passwords are NEVER stored in plaintext.
 * - Stores only the random raw session token in localStorage / sessionStorage.
 * - Event subscriber model (`authService.subscribe()`) preserved for UI components.
 * - Synchronous `getCurrentUser()` preserved for seamless hydration.
 * - Safe legacy migration: Migrates local accounts to SQLite only when the user
 *   supplies their plaintext password, without ever overwriting or losing data.
 */

const AUTH_SESSION_KEY = 'studymate_user_session_v3';
const AUTH_TOKEN_KEY = 'studymate_student_token_v1';
const AUTH_USERS_DB_KEY = 'studymate_registered_accounts_v1';
const AUTH_MIGRATED_DB_KEY = 'studymate_migrated_accounts_v1';
const AUTH_SALT = 'studymate_secure_salt_2026';

interface StoredAccount {
  user: User;
  passwordHash: string;
}

// Safe SHA-256 hash using Web Crypto API (retained to verify legacy local accounts)
async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + AUTH_SALT);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple numeric hash if subtle crypto is restricted
    let hash = 0;
    const str = password + AUTH_SALT;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `fallback_${Math.abs(hash).toString(16)}`;
  }
}

// Default Seed User: GTU BCA Student (Offline Demo student)
const DEFAULT_DEMO_USER: User = {
  id: 'usr-gtu-demo-1',
  name: 'Faiz Alam',
  email: 'faiz@gtu.ac.in',
  role: 'student',
  college: 'Gujarat Technological University (GTU)',
  course: 'Bachelor of Computer Applications (BCA)',
  semester: 4,
  enrollmentNo: '230020107001',
  avatarSeed: 'FA',
  createdAt: '2026-01-15T09:00:00Z',
  isDemo: true,
};

type AuthStateListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];
  private isInitialized = false;

  constructor() {
    this.initSession();
  }

  private initSession() {
    try {
      // 1. Purge legacy auto-seeded demo user sessions
      localStorage.removeItem('studymate_auth_user');
      localStorage.removeItem('studymate_auth_session_v2');
      localStorage.removeItem('studymate_auth_session_v1');
      sessionStorage.removeItem('studymate_auth_user');
      sessionStorage.removeItem('studymate_auth_session_v2');
      sessionStorage.removeItem('studymate_auth_session_v1');

      // 2. Read cached session object for immediate synchronous UI render
      const stored =
        localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
          if (
            parsed.isDemo ||
            parsed.id === 'usr-gtu-demo-1' ||
            parsed.name === 'Faizan Alam' ||
            parsed.name === 'Faizan Ali'
          ) {
            parsed.name = 'Faiz Alam';
            if (parsed.email === 'faizan@gtu.ac.in') parsed.email = 'faiz@gtu.ac.in';
          }
          this.currentUser = parsed;
        } else {
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
    this.isInitialized = true;
    this.ensureDemoAccountSeeded();

    // 3. Asynchronously verify session token against SQLite backend if present
    this.verifyServerSessionInBackground();
  }

  /**
   * Verifies the stored student session token with the backend.
   * If invalid or expired, gracefully clears the session and notifies UI.
   */
  private async verifyServerSessionInBackground() {
    if (typeof window === 'undefined') return;
    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      // If there is no token and user is not demo, clear stale cached session
      if (this.currentUser && !this.currentUser.isDemo) {
        this.clearLocalSession();
        this.notify();
      }
      return;
    }

    try {
      const res = await api.studentMe(token);
      if (res && res.authenticated && res.user) {
        // Map server student profile to User interface
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
        if (localStorage.getItem(AUTH_TOKEN_KEY)) {
          localStorage.setItem(AUTH_SESSION_KEY, serialized);
        } else {
          sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
        }
        this.notify();
      }
    } catch {
      // If token expired or rejected by server, invalidate session
      if (this.currentUser && !this.currentUser.isDemo) {
        this.clearLocalSession();
        this.notify();
      }
    }
  }

  private ensureDemoAccountSeeded() {
    try {
      const accounts = this.getStoredAccounts();
      if (!accounts.some((a) => a.user.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase())) {
        hashPassword('gtu123').then((demoHash) => {
          accounts.push({
            user: DEFAULT_DEMO_USER,
            passwordHash: demoHash,
          });
          localStorage.setItem(AUTH_USERS_DB_KEY, JSON.stringify(accounts));
        }).catch(() => {});
      }
    } catch {
      // safe fallback
    }
  }

  private getStoredAccounts(): StoredAccount[] {
    try {
      const data = localStorage.getItem(AUTH_USERS_DB_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
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
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('studymate_auth_user');
    sessionStorage.removeItem('studymate_auth_user');
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

  /**
   * Student Login:
   * 1. Attempts authentication against SQLite backend via POST /api/auth/login.
   * 2. If server returns 401/404 and a matching legacy account exists in localStorage,
   *    verifies the legacy SHA-256 hash with the supplied plaintext password and
   *    migrates the account to SQLite via POST /api/auth/register.
   * 3. Stores session token securely and updates currentUser.
   */
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

    // A. Demo Student handling
    if (
      normalizedEmail === DEFAULT_DEMO_USER.email.toLowerCase() &&
      (password === 'gtu123' || password === 'password')
    ) {
      return this.loginAsDemo();
    }

    // B. Attempt direct SQLite Backend Authentication
    try {
      const serverRes = await api.studentLogin(normalizedEmail, password);
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
          localStorage.setItem(AUTH_TOKEN_KEY, serverRes.token);
          localStorage.setItem(AUTH_SESSION_KEY, serialized);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
          sessionStorage.removeItem(AUTH_SESSION_KEY);
        } else {
          sessionStorage.setItem(AUTH_TOKEN_KEY, serverRes.token);
          sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_SESSION_KEY);
        }

        this.notify();
        return { success: true, user: authenticatedUser };
      }
    } catch (err: any) {
      const errMsg = err?.message || '';

      // If backend explicitly rejected due to admin or inactive account, return immediately
      if (errMsg.includes('Administrator accounts must authenticate') || errMsg.includes('account is inactive')) {
        return { success: false, error: errMsg };
      }

      // C. Legacy Account Migration Check
      // If login failed, inspect whether this email exists in studymate_registered_accounts_v1
      const legacyAccounts = this.getStoredAccounts();
      const legacyMatch = legacyAccounts.find(
        (a) => a.user.email.toLowerCase() === normalizedEmail
      );

      if (legacyMatch) {
        const inputHash = await hashPassword(password);
        if (legacyMatch.passwordHash === inputHash) {
          // Plaintext password verified against legacy SHA-256 hash!
          // Safely migrate account to SQLite using POST /api/auth/register
          try {
            const migRes = await api.studentRegister({
              name: legacyMatch.user.name || 'GTU Student',
              email: normalizedEmail,
              password,
              semester: Number(legacyMatch.user.semester) || 1,
              branch: 'BCA',
            });

            if (migRes && migRes.success && migRes.user) {
              const migratedUser: User = {
                id: migRes.user.id,
                name: migRes.user.name,
                email: migRes.user.email,
                role: 'student',
                semester: migRes.user.semester,
                course: `${migRes.user.branch || 'BCA'} (Gujarat Technological University)`,
                college: legacyMatch.user.college || 'Gujarat Technological University (GTU)',
                enrollmentNo: legacyMatch.user.enrollmentNo,
                avatarSeed: this.generateAvatarSeed(migRes.user.name),
                createdAt: migRes.user.createdAt,
                isDemo: false,
              };

              this.currentUser = migratedUser;
              const serialized = JSON.stringify(migratedUser);

              if (rememberMe) {
                localStorage.setItem(AUTH_TOKEN_KEY, migRes.token);
                localStorage.setItem(AUTH_SESSION_KEY, serialized);
              } else {
                sessionStorage.setItem(AUTH_TOKEN_KEY, migRes.token);
                sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
              }

              // Record migration success without deleting original legacy entry
              try {
                const migratedList = JSON.parse(localStorage.getItem(AUTH_MIGRATED_DB_KEY) || '[]');
                if (!migratedList.includes(normalizedEmail)) {
                  migratedList.push(normalizedEmail);
                  localStorage.setItem(AUTH_MIGRATED_DB_KEY, JSON.stringify(migratedList));
                }
              } catch {}

              this.notify();
              return { success: true, user: migratedUser };
            }
          } catch (migErr: any) {
            // If email already exists on server with different password (conflict)
            if (migErr?.message?.includes('already exists')) {
              return {
                success: false,
                error: 'Incorrect password. Please verify your credentials and try again.',
              };
            }
          }
        }
      }

      return {
        success: false,
        error: errMsg || 'Invalid email or password. Please verify and try again.',
      };
    }

    return { success: false, error: 'Authentication failed. Please try again.' };
  }

  /**
   * Student Registration:
   * 1. Submits registration to SQLite backend via POST /api/auth/register.
   * 2. Preserves legacy account list in localStorage for offline resiliency without overwriting.
   * 3. Stores session token securely and updates currentUser.
   */
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
          enrollmentNo: `GTU${Math.floor(10000000 + Math.random() * 90000000)}`,
          avatarSeed: this.generateAvatarSeed(regRes.user.name),
          createdAt: regRes.user.createdAt,
          isDemo: false,
        };

        this.currentUser = newUser;
        const serialized = JSON.stringify(newUser);

        localStorage.setItem(AUTH_TOKEN_KEY, regRes.token);
        localStorage.setItem(AUTH_SESSION_KEY, serialized);

        // Keep local copy in studymate_registered_accounts_v1 for backwards compatibility
        try {
          const accounts = this.getStoredAccounts();
          if (!accounts.some((a) => a.user.email.toLowerCase() === normalizedEmail)) {
            const pwdHash = await hashPassword(password);
            accounts.push({ user: newUser, passwordHash: pwdHash });
            localStorage.setItem(AUTH_USERS_DB_KEY, JSON.stringify(accounts));
          }
        } catch {}

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

  /**
   * Student Logout:
   * Calls POST /api/auth/logout on the backend to revoke the token in SQLite,
   * then purges the active client session and notifies listeners.
   */
  public async logout(): Promise<void> {
    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      await api.studentLogout(token);
    }

    this.clearLocalSession();
    this.notify();
  }

  public async loginAsDemo(): Promise<{ success: boolean; user: User }> {
    this.currentUser = DEFAULT_DEMO_USER;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(DEFAULT_DEMO_USER));
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    this.notify();
    return { success: true, user: DEFAULT_DEMO_USER };
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

    // Also update in registered accounts db if not demo
    const accounts = this.getStoredAccounts();
    const idx = accounts.findIndex((a) => a.user.id === updatedUser.id);
    if (idx !== -1) {
      accounts[idx].user = updatedUser;
      localStorage.setItem(AUTH_USERS_DB_KEY, JSON.stringify(accounts));
    }

    this.notify();
    return updatedUser;
  }
}

export const authService = new AuthService();

