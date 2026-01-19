import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { AuthSession } from '../models/auth.types';

const STORAGE_KEY = 'lia.auth.session.v1';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor() {
    // Load session on initialization
    const session = this.getSession();
    this.sessionSubject.next(session);
  }

  getSession(): AuthSession | null {
    try {
      const session = this.safeParseSession(localStorage.getItem(STORAGE_KEY));
      if (!session) return null;
      if (session.expiresAt <= Date.now()) {
        this.setSession(null);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  get currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  async signInLocal(options?: {
    email?: string;
    displayName?: string;
  }): Promise<AuthSession> {
    const email = options?.email?.trim() || 'lia@local';
    const displayName = options?.displayName?.trim() || 'LIA';
    const now = Date.now();

    const session: AuthSession = {
      user: { id: this.stableUserId(), email, displayName },
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    this.setSession(session);
    return session;
  }

  async signOut(): Promise<void> {
    this.setSession(null);
    this.router.navigate(['/login']);
  }

  private setSession(session: AuthSession | null): void {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage error - ignore
    }
    this.sessionSubject.next(session);
  }

  private stableUserId(): string {
    return 'lia';
  }

  private safeParseSession(raw: string | null): AuthSession | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return null;
      const obj = parsed as Record<string, unknown>;
      const user = obj['user'];
      if (typeof user !== 'object' || user === null) return null;
      const u = user as Record<string, unknown>;
      if (typeof u['id'] !== 'string' || (u['id'] as string).trim() === '') return null;
      if (typeof u['email'] !== 'string') return null;
      if (typeof u['displayName'] !== 'string') return null;
      if (typeof obj['createdAt'] !== 'number' || !Number.isFinite(obj['createdAt']))
        return null;
      if (typeof obj['expiresAt'] !== 'number' || !Number.isFinite(obj['expiresAt']))
        return null;

      return {
        user: { id: u['id'] as string, email: u['email'] as string, displayName: u['displayName'] as string },
        createdAt: obj['createdAt'] as number,
        expiresAt: obj['expiresAt'] as number,
      };
    } catch {
      return null;
    }
  }
}
