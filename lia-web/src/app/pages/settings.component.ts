import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ThemeMode } from '../core/services/settings.service';
import { CameraService } from '../core/services/camera.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(private location: Location) {}

  protected readonly settings = inject(SettingsService);
  protected readonly cameraService = inject(CameraService);

  @ViewChild('diagnosticVideo') diagnosticVideo?: ElementRef<HTMLVideoElement>;

  // Local, editable copy to support an explicit Save action
  pendingThemeMode: ThemeMode = 'light';
  // NOTE: legacy storage name "unmirrorCamera" actually controls whether the preview is mirrored (scaleX(-1)).
  pendingUnmirror = true;
  savedMessage = '';
  isSaving = false;

  // Camera diagnostic state
  protected cameraStatus: 'idle' | 'starting' | 'ready' | 'blocked' | 'error' = 'idle';
  protected cameraStatusMessage = '';
  protected availableCameras: MediaDeviceInfo[] = [];
  protected cameraSelectValue = 'facing:user';

  // Diagnostic details
  private diagDeviceLabel = '—';
  private diagResolution = '—';
  private diagFps = 0;
  private diagFpsText = '—';
  private diagMirrorText = '—';

  private fpsRafId: number | null = null;
  private fpsLastTs = 0;
  private fpsFrames = 0;

  ngOnInit(): void {
    this.pendingThemeMode = this.settings.themeMode();
    this.pendingUnmirror = this.settings.unmirrorCamera();
    void this.refreshCameras();
    this.syncMirrorText();
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopCameraDiagnostic();
  }

  get isDirty(): boolean {
    return (
      this.pendingThemeMode !== this.settings.themeMode() ||
      this.pendingUnmirror !== this.settings.unmirrorCamera()
    );
  }

  back(): void {
    this.location.back();
  }

  setThemeModeLocal(value: ThemeMode): void { this.pendingThemeMode = value; this.savedMessage = ''; }
  setUnmirrorLocal(value: boolean): void { this.pendingUnmirror = value; this.savedMessage = ''; this.syncMirrorText(); }

  save(): void {
    if (!this.isDirty || this.isSaving) return;
    this.isSaving = true;
    this.settings.setThemeMode(this.pendingThemeMode);
    this.settings.setUnmirrorCamera(this.pendingUnmirror);
    this.savedMessage = 'Preferências salvas.';
    setTimeout(() => {
      this.isSaving = false;
      // Clear message after a bit to reduce clutter
      setTimeout(() => {
        if (!this.isDirty) this.savedMessage = '';
      }, 2500);
    }, 250);
  }

  protected cameraReady(): boolean {
    return this.cameraService.isActive();
  }

  protected async refreshCameras(): Promise<void> {
    this.availableCameras = await this.cameraService.listVideoInputs();
  }

  protected async startCameraDiagnostic(): Promise<void> {
    const videoEl = this.diagnosticVideo?.nativeElement;
    if (!videoEl) return;

    this.cameraStatus = 'starting';
    this.cameraStatusMessage = 'Solicitando acesso à câmera…';

    try {
      const value = this.cameraSelectValue;
      if (value.startsWith('device:')) {
        const deviceId = value.slice('device:'.length);
        await this.cameraService.startWithDeviceId(videoEl, deviceId);
      } else if (value === 'facing:environment') {
        await this.cameraService.startFacing(videoEl, 'environment');
      } else {
        await this.cameraService.startFacing(videoEl, 'user');
      }

      this.cameraStatus = 'ready';
      this.cameraStatusMessage = '';
      await this.refreshCameras(); // labels often appear only after permission is granted

      // Populate diagnostics
      this.updateDiagnosticsFromVideo(videoEl);
      this.startFpsMeasurement(videoEl);
    } catch (err: any) {
      const name = typeof err?.name === 'string' ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.cameraStatus = 'blocked';
        this.cameraStatusMessage = 'Permissão negada. Libere o acesso à câmera nas configurações do navegador.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        this.cameraStatus = 'error';
        this.cameraStatusMessage = 'A câmera parece estar em uso por outro aplicativo. Feche-o e tente novamente.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        this.cameraStatus = 'error';
        this.cameraStatusMessage = 'Nenhuma câmera foi encontrada neste dispositivo.';
      } else if (name === 'OverconstrainedError') {
        this.cameraStatus = 'error';
        this.cameraStatusMessage = 'Configurações de câmera não suportadas. Tente trocar o dispositivo.';
      } else {
        this.cameraStatus = 'error';
        this.cameraStatusMessage = 'Não foi possível iniciar a câmera. Tente novamente.';
      }
      await this.stopCameraDiagnostic();
    }
  }

  protected async stopCameraDiagnostic(): Promise<void> {
    this.stopFpsMeasurement();
    await this.cameraService.stop();
    if (this.cameraStatus === 'ready' || this.cameraStatus === 'starting') {
      this.cameraStatus = 'idle';
      this.cameraStatusMessage = '';
    }
    this.resetDiagnostics();
  }

  protected onCameraSelectionChange(): void {
    // If camera is running, restart with the new selection
    if (!this.cameraReady()) return;
    void this.startCameraDiagnostic();
  }

  protected diagnosticItems(): Array<{ key: string; label: string; value: string; status: 'ok' | 'warn' | 'err' | 'muted' }> {
    const perm =
      this.cameraStatus === 'ready'
        ? { value: 'Permitida', status: 'ok' as const }
        : this.cameraStatus === 'blocked'
          ? { value: 'Bloqueada', status: 'err' as const }
          : this.cameraStatus === 'error'
            ? { value: 'Erro', status: 'err' as const }
            : { value: '—', status: 'muted' as const };

    const resolutionStatus =
      this.cameraStatus !== 'ready'
        ? ('muted' as const)
        : this.isResolutionOk(this.diagResolution)
          ? ('ok' as const)
          : ('warn' as const);

    const fpsStatus =
      this.cameraStatus !== 'ready'
        ? ('muted' as const)
        : this.diagFps >= 24
          ? ('ok' as const)
          : this.diagFps > 0
            ? ('warn' as const)
            : ('muted' as const);

    const mirrorStatus = this.cameraStatus === 'ready' ? ('ok' as const) : ('muted' as const);

    return [
      { key: 'perm', label: 'Permissão', value: perm.value, status: perm.status },
      { key: 'device', label: 'Dispositivo', value: this.diagDeviceLabel, status: this.cameraStatus === 'ready' ? 'ok' : 'muted' },
      { key: 'res', label: 'Resolução', value: this.diagResolution, status: resolutionStatus },
      { key: 'fps', label: 'FPS', value: this.diagFpsText, status: fpsStatus },
      { key: 'mirror', label: 'Espelhamento', value: this.diagMirrorText, status: mirrorStatus },
    ];
  }

  private updateDiagnosticsFromVideo(videoEl: HTMLVideoElement): void {
    const stream = (videoEl as any).srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()?.[0] ?? null;

    this.diagDeviceLabel = track?.label?.trim() || 'Câmera';

    // Prefer actual rendered resolution from the video element
    const w = videoEl.videoWidth || 0;
    const h = videoEl.videoHeight || 0;
    this.diagResolution = w && h ? `${w}×${h}` : '—';

    // Reset fps state; measurement will update
    this.diagFps = 0;
    this.diagFpsText = '—';
  }

  private startFpsMeasurement(videoEl: HTMLVideoElement): void {
    this.stopFpsMeasurement();

    this.fpsLastTs = performance.now();
    this.fpsFrames = 0;

    const loop = (ts: number) => {
      this.fpsFrames += 1;
      const delta = ts - this.fpsLastTs;
      if (delta >= 1000) {
        const fps = (this.fpsFrames * 1000) / delta;
        this.diagFps = Math.round(fps);
        this.diagFpsText = `${this.diagFps}`;
        this.fpsFrames = 0;
        this.fpsLastTs = ts;

        // Refresh resolution occasionally (some cameras set it after play starts)
        const w = videoEl.videoWidth || 0;
        const h = videoEl.videoHeight || 0;
        if (w && h) this.diagResolution = `${w}×${h}`;
      }
      this.fpsRafId = requestAnimationFrame(loop);
    };

    this.fpsRafId = requestAnimationFrame(loop);
  }

  private stopFpsMeasurement(): void {
    if (this.fpsRafId !== null) {
      cancelAnimationFrame(this.fpsRafId);
      this.fpsRafId = null;
    }
  }

  private resetDiagnostics(): void {
    this.diagDeviceLabel = '—';
    this.diagResolution = '—';
    this.diagFps = 0;
    this.diagFpsText = '—';
    this.syncMirrorText();
  }

  private syncMirrorText(): void {
    this.diagMirrorText = this.pendingUnmirror ? 'Ativado' : 'Desativado';
  }

  private isResolutionOk(res: string): boolean {
    // Expect format "WxH"
    const m = /(\d+)\s*[×x]\s*(\d+)/.exec(res);
    if (!m) return false;
    const w = Number(m[1]);
    const h = Number(m[2]);
    if (!Number.isFinite(w) || !Number.isFinite(h)) return false;
    return w >= 640 && h >= 480;
  }
}
