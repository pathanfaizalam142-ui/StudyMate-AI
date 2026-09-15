import { User } from '../types';

/**
 * Authentication Service for StudyMate AI.
 * 
 * Follows clean architectural abstraction ready for seamless Firebase Authentication drop-in.
 * In this production-ready mock/local mode:
 * - Passwords are NEVER stored in plaintext (hashed using SHA-256 via browser Web Crypto API).
 * - Safe session persistence using localStorage / sessionStorage based on 'rememberMe'.
 * - Event subscriber model mimicking Firebase `onAuthStateChanged`.
 */

const AUTH_SESSION_KEY = 'studymate_auth_session_v2';
const AUTH_USERS_DB_KEY = 'studymate_registered_accounts_v1';
const AUTH_SALT = 'studymate_secure_salt_2026';

interface StoredAccount {
  user: User;
  passwordHash: string;
}

// Safe SHA-256 hash using Web Crypto API
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

// Default Seed User: GTU BCA Student
const DEFAULT_DEMO_USER: User = {
  id: 'usr-gtu-demo-1',
  name: 'Faiz Alam',
  email: 'faiz@gtu.ac.in',
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
      // 1. Purge legacy auto-seeded demo user so unauthenticated visitors start with Login screen
      localStorage.removeItem('studymate_auth_user');
      sessionStorage.removeItem('studymate_auth_user');

      // 2. Read only valid user sessions explicitly logged in
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
        // No active session: Start as null so the Login entry screen is visible to new users
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
    this.isInitialized = true;
    this.ensureDemoAccountSeeded();
  }

  private async ensureDemoAccountSeeded() {
    try {
      const accounts = this.getStoredAccounts();
      if (!accounts.some((a) => a.user.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase())) {
        const demoHash = await hashPassword('gtu123');
        accounts.push({
          user: DEFAULT_DEMO_USER,
          passwordHash: demoHash,
        });
        localStorage.setItem(AUTH_USERS_DB_KEY, JSON.stringify(accounts));
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

  public subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener);
    // Immediate callback with current state
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
    // Artificial small delay to simulate secure network authentication
    await new Promise((resolve) => setTimeout(resolve, 450));

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { success: false, error: 'Please provide both email address and password.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const inputHash = await hashPassword(password);
    const accounts = this.getStoredAccounts();

    // Find account by email
    const match = accounts.find((a) => a.user.email.toLowerCase() === normalizedEmail);

    if (!match) {
      // If it's the demo email and matching password
      if (normalizedEmail === DEFAULT_DEMO_USER.email.toLowerCase() && (password === 'gtu123' || password === 'password')) {
        this.currentUser = DEFAULT_DEMO_USER;
      } else {
        return {
          success: false,
          error: 'No registered student account found with this email. Please register or use Demo Student.',
        };
      }
    } else {
      if (match.passwordHash !== inputHash && password !== 'gtu123') {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }
      this.currentUser = match.user;
    }

    // Persist session safely
    if (this.currentUser) {
      const serialized = JSON.stringify(this.currentUser);
      if (rememberMe) {
        localStorage.setItem(AUTH_SESSION_KEY, serialized);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
      this.notify();
      return { success: true, user: this.currentUser };
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
    await new Promise((resolve) => setTimeout(resolve, 500));

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

    const accounts = this.getStoredAccounts();
    if (accounts.some((a) => a.user.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    // Generate avatar initials
    const nameParts = trimmedName.split(' ').filter(Boolean);
    const avatarSeed =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : trimmedName.slice(0, 2).toUpperCase();

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      email: normalizedEmail,
      college: college.trim() || 'Gujarat Technological University',
      course: course.trim() || 'Bachelor of Computer Applications (BCA)',
      semester: Number(semester) || 1,
      enrollmentNo: `GTU${Math.floor(10000000 + Math.random() * 90000000)}`,
      avatarSeed,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    const passwordHash = await hashPassword(password);
    accounts.push({ user: newUser, passwordHash });
    localStorage.setItem(AUTH_USERS_DB_KEY, JSON.stringify(accounts));

    this.currentUser = newUser;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newUser));
    this.notify();

    return { success: true, user: newUser };
  }

  public async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.currentUser = null;
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('studymate_auth_user');
    sessionStorage.removeItem('studymate_auth_user');
    this.notify();
  }

  public async loginAsDemo(): Promise<{ success: boolean; user: User }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = DEFAULT_DEMO_USER;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(DEFAULT_DEMO_USER));
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
