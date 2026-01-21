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
  // Theme mode selection: explicit light or dark
  readonly themeMode = signal<ThemeMode>('light');
  // Effective dark boolean derived from theme mode
  readonly darkMode = signal<boolean>(false);
  readonly unmirrorCamera = signal<boolean>(true);

  private prefersDarkMql: MediaQueryList | null = null;

  constructor() {
    // Load from storage (prefer V2, fallback to V1)
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2) as Partial<AppSettingsV2>;
        if (parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system') {
          this.themeMode.set(parsed.themeMode);
        }
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

    // Keep system theme reactive while app is running
    this.setupSystemThemeListener();
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
    const isDark = mode === 'dark' ? true : mode === 'light' ? false : this.getSystemPrefersDark();
    this.darkMode.set(isDark);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }

  private getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.prefersDarkMql = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      if (this.themeMode() === 'system') this.applyTheme();
    };

    // Safari < 14 uses addListener/removeListener
    try {
      this.prefersDarkMql.addEventListener('change', handler);
    } catch {
      try {
        (this.prefersDarkMql as any).addListener(handler);
      } catch { /* ignore */ }
    }
  }

  private persist(): void {
    try {
      const data: AppSettingsV2 = { themeMode: this.themeMode(), unmirrorCamera: this.unmirrorCamera() };
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}
