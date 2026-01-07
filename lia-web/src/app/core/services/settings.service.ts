import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettingsV2 {
  themeMode: ThemeMode;
  unmirrorCamera: boolean;
}

export interface AppSettingsV1 {
  darkMode: boolean;
  unmirrorCamera: boolean;
}

const STORAGE_KEY_V2 = 'lia.settings.v2';
const STORAGE_KEY_V1 = 'lia.settings.v1';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  // Theme mode selection: 'system' follows OS preference
  readonly themeMode = signal<ThemeMode>('system');
  // Effective dark boolean derived from theme mode + system preference
  readonly darkMode = signal<boolean>(false);
  readonly unmirrorCamera = signal<boolean>(true);

  private systemDarkQuery: MediaQueryList | null = null;

  constructor() {
    // System preference listener (browser only)
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      this.systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemDarkQuery.addEventListener?.('change', () => this.applyTheme());
    }

    // Load from storage (prefer V2, fallback to V1)
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2) as Partial<AppSettingsV2>;
        if (parsed.themeMode) this.themeMode.set(parsed.themeMode);
        if (typeof parsed.unmirrorCamera === 'boolean') this.unmirrorCamera.set(parsed.unmirrorCamera);
      } catch { /* ignore */ }
    } else {
      const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
      if (rawV1) {
        try {
          const parsed = JSON.parse(rawV1) as Partial<AppSettingsV1>;
          if (typeof parsed.darkMode === 'boolean') this.themeMode.set(parsed.darkMode ? 'dark' : 'light');
          if (typeof parsed.unmirrorCamera === 'boolean') this.unmirrorCamera.set(parsed.unmirrorCamera);
        } catch { /* ignore */ }
      }
    }

    // React to theme mode changes and compute effective dark
    effect(() => {
      void this.themeMode();
      this.applyTheme();
      this.persist();
    });

    // React to camera preference changes (persist only)
    effect(() => {
      void this.unmirrorCamera();
      this.persist();
    });

    // Initial apply
    this.applyTheme();
  }

  setDarkMode(value: boolean): void {
    this.setThemeMode(value ? 'dark' : 'light');
  }

  setUnmirrorCamera(value: boolean): void {
    this.unmirrorCamera.set(value);
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode.set(mode);
  }

  private applyTheme(): void {
    const mode = this.themeMode();
    const systemDark = this.systemDarkQuery?.matches ?? false;
    const isDark = mode === 'dark' || (mode === 'system' && systemDark);
    this.darkMode.set(isDark);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }

  private persist(): void {
    try {
      const data: AppSettingsV2 = { themeMode: this.themeMode(), unmirrorCamera: this.unmirrorCamera() };
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}
