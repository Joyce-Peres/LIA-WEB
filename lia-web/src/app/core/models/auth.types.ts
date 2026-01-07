/**
 * Auth Types
 */

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthSession {
  user: AuthUser;
  createdAt: number;
  expiresAt: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarText: string;
  totalXp: number;
  currentStreak: number;
  createdAt: number;
  updatedAt: number;
}
