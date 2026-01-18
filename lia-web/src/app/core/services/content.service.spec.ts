import { firstValueFrom } from 'rxjs';
import { ContentService } from './content.service';
import { mockLessons } from '../data/mock-content';

describe('ContentService.getLessonById', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  it('returns null for unknown lesson id', async () => {
    const result = await firstValueFrom(service.getLessonById('unknown-id'));
    expect(result).toBeNull();
  });

  it('returns a lesson with its module for a valid id', async () => {
    const known = mockLessons[0];
    const result = await firstValueFrom(service.getLessonById(known.id));
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.id).toBe(known.id);
    expect(result.module).toBeDefined();
    expect(result.module.id).toBe(known.moduleId);
    // assets URL normalization applied
    if (result.videoRefUrl) {
      expect(result.videoRefUrl.startsWith('/assets/')).toBe(true);
    }
    if (result.module.iconUrl) {
      expect(result.module.iconUrl.startsWith('/assets/')).toBe(true);
    }
  });
});

describe('ContentService.getNextLessonInLevel', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  it('returns the next lesson for a given level', async () => {
    const a = mockLessons.find(l => l.id === 'les-a')!;
    const next = await firstValueFrom(service.getNextLessonInLevel(a.moduleId, a.level, a.orderIndex));
    expect(next).not.toBeNull();
    expect(next!.orderIndex).toBeGreaterThan(a.orderIndex);
    expect(next!.level).toBe(a.level);
    expect(next!.moduleId).toBe(a.moduleId);
    if (next!.videoRefUrl) {
      expect(next!.videoRefUrl.startsWith('/assets/')).toBe(true);
    }
  });

  it('returns null when there is no next lesson', async () => {
    // Encontrar o maior nível do módulo alfabeto
    const alfabetoLessons = mockLessons.filter(l => l.moduleId === 'mod-alfabeto');
    const maxLevel = Math.max(...alfabetoLessons.map(l => l.level));

    // Pegar a última lição do último nível
    const lastLevelLessons = alfabetoLessons
      .filter(l => l.level === maxLevel)
      .sort((x, y) => y.orderIndex - x.orderIndex);

    if (lastLevelLessons.length === 0) {
      // Se não houver lições, pular teste
      return;
    }

    const lastLesson = lastLevelLessons[0];
    // Usar um orderIndex muito maior para garantir que não há próxima lição
    const result = await firstValueFrom(service.getNextLessonInLevel(lastLesson.moduleId, lastLesson.level, lastLesson.orderIndex + 1000));
    expect(result).toBeNull();
  });
});
