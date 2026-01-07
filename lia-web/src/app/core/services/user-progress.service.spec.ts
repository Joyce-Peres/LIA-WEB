import { UserProgressService } from './user-progress.service';

const mockLesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  gestureName: 'A',
  displayName: 'Letra A',
  videoRefUrl: null,
  minConfidenceThreshold: 0.7,
  xpReward: 10,
  orderIndex: 1,
  level: 1,
  createdAt: '',
  updatedAt: ''
};

describe('UserProgressService', () => {
  let svc: UserProgressService;

  beforeEach(() => {
    svc = new UserProgressService();
    // Clear storage sandbox key
    try { localStorage.clear(); } catch {}
  });

  it('records attempts and keeps best score', () => {
    const user = 'u1';
    svc.recordAttempt(user, mockLesson as any, 60);
    svc.recordAttempt(user, mockLesson as any, 80);
    const p = svc.getLesson(user, mockLesson.id)!;
    expect(p.attempts).toBe(2);
    expect(p.bestScore).toBe(80);
    expect(p.isCompleted).toBe(false);
  });

  it('marks completion and persists', () => {
    const user = 'u2';
    svc.markCompleted(user, mockLesson as any, 90);
    const p = svc.getLesson(user, mockLesson.id)!;
    expect(p.isCompleted).toBe(true);
    expect(p.bestScore).toBeGreaterThanOrEqual(90);
  });
});
