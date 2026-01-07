import { Injectable } from '@angular/core';
import type { UserProfile } from '../models/auth.types';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private storageKey(userId: string): string {
    return `lia.profile.v1.${userId}`;
  }

  getProfile(userId: string): UserProfile | null {
    return this.safeParseProfile(localStorage.getItem(this.storageKey(userId)));
  }

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.storageKey(profile.userId), JSON.stringify(profile));
    } catch {
      // Storage error - ignore
    }
  }

  updateProfile(
    userId: string,
    updater: (current: UserProfile) => UserProfile
  ): UserProfile {
    const current = this.ensureProfile(userId);
    const next = updater(current);
    const now = Date.now();
    const normalized: UserProfile = {
      ...next,
      userId,
      updatedAt: now,
    };
    this.saveProfile(normalized);
    return normalized;
  }

  ensureProfile(userId: string): UserProfile {
    const existing = this.getProfile(userId);
    if (existing) return existing;

    const now = Date.now();
    const created: UserProfile = {
      userId,
      displayName: 'LIA',
      avatarText: 'LIA',
      totalXp: 0,
      currentStreak: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.saveProfile(created);
    return created;
  }

  private safeParseProfile(raw: string | null): UserProfile | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return null;
      const obj = parsed as Record<string, unknown>;
      if (typeof obj['userId'] !== 'string' || (obj['userId'] as string).trim() === '') return null;
      if (typeof obj['displayName'] !== 'string') return null;
      if (typeof obj['avatarText'] !== 'string') return null;
      if (typeof obj['totalXp'] !== 'number' || !Number.isFinite(obj['totalXp'])) return null;
      if (
        typeof obj['currentStreak'] !== 'number' ||
        !Number.isFinite(obj['currentStreak'])
      )
        return null;
      if (typeof obj['createdAt'] !== 'number' || !Number.isFinite(obj['createdAt']))
        return null;
      if (typeof obj['updatedAt'] !== 'number' || !Number.isFinite(obj['updatedAt']))
        return null;

      return {
        userId: obj['userId'] as string,
        displayName: obj['displayName'] as string,
        avatarText: obj['avatarText'] as string,
        totalXp: obj['totalXp'] as number,
        currentStreak: obj['currentStreak'] as number,
        createdAt: obj['createdAt'] as number,
        updatedAt: obj['updatedAt'] as number,
      };
    } catch {
      return null;
    }
  }
}
