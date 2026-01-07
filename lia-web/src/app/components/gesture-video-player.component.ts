import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente para exibir vídeo de referência de gesto
 * Com controles, velocidade ajustável, e loop
 */
@Component({
  standalone: true,
  selector: 'app-gesture-video-player',
  imports: [CommonModule],
  template: `
    <div class="video-player" *ngIf="videoUrl()">
      <video
        #videoEl
        [src]="videoUrl()"
        [loop]="loop()"
        [autoplay]="autoplay()"
        [muted]="muted()"
        (loadedmetadata)="onLoadedMetadata()"
        (play)="isPlaying.set(true)"
        (pause)="isPlaying.set(false)"
        class="video-element"
      ></video>

      <div class="controls">
        <button class="control-btn" (click)="togglePlay(videoEl)" [title]="isPlaying() ? 'Pausar' : 'Reproduzir'">
          {{ isPlaying() ? '⏸' : '▶' }}
        </button>

        <button class="control-btn" (click)="restart(videoEl)" title="Reiniciar">
          ↻
        </button>

        <div class="speed-controls">
          <label class="speed-label">Velocidade:</label>
          <select class="speed-select" [value]="playbackRate()" (change)="changeSpeed(videoEl, $event)">
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>
        </div>

        <label class="loop-toggle">
          <input type="checkbox" [checked]="loop()" (change)="toggleLoop()" />
          <span>Repetir</span>
        </label>
      </div>
    </div>

    <div class="placeholder" *ngIf="!videoUrl()">
      <div class="placeholder-icon">🎥</div>
      <p class="placeholder-text">Vídeo de demonstração não disponível</p>
      <p class="placeholder-hint">{{ gestureName() }}</p>
    </div>
  `,
  styles: [`
    .video-player {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: var(--surface-2);
      border: 1px solid var(--border, #2a2a2a);
    }

    .video-element {
      width: 100%;
      display: block;
      aspect-ratio: 16/9;
      object-fit: contain;
      background: #000;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--surface-1);
      border-top: 1px solid var(--border, #2a2a2a);
      flex-wrap: wrap;
    }

    .control-btn {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid var(--border, #2a2a2a);
      background: var(--surface-2);
      color: var(--text);
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }

    .control-btn:hover {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .speed-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .speed-label {
      font-size: 13px;
      color: var(--muted, #9aa0a6);
    }

    .speed-select {
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px solid var(--border, #2a2a2a);
      background: var(--surface-2);
      color: var(--text);
      font-size: 13px;
    }

    .loop-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text);
      cursor: pointer;
      user-select: none;
    }

    .loop-toggle input {
      cursor: pointer;
    }

    .placeholder {
      width: 100%;
      aspect-ratio: 16/9;
      border-radius: 12px;
      background: var(--surface-2);
      border: 1px dashed var(--border, #2a2a2a);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .placeholder-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    .placeholder-text {
      margin: 0;
      font-size: 14px;
      color: var(--muted, #9aa0a6);
    }

    .placeholder-hint {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
    }
  `]
})
export class GestureVideoPlayerComponent {
  @Input() set src(value: string | null | undefined) {
    this.videoUrl.set(value || null);
  }

  @Input() set gesture(value: string | null | undefined) {
    this.gestureName.set(value || 'Gesto');
  }

  @Input() set loopVideo(value: boolean) {
    this.loop.set(value);
  }

  @Input() set autoplayVideo(value: boolean) {
    this.autoplay.set(value);
  }

  protected readonly videoUrl = signal<string | null>(null);
  protected readonly gestureName = signal('Gesto');
  protected readonly loop = signal(true);
  protected readonly autoplay = signal(false);
  protected readonly muted = signal(false);
  protected readonly isPlaying = signal(false);
  protected readonly playbackRate = signal(1);

  protected togglePlay(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  protected restart(video: HTMLVideoElement): void {
    video.currentTime = 0;
    video.play();
  }

  protected changeSpeed(video: HTMLVideoElement, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const rate = parseFloat(select.value);
    video.playbackRate = rate;
    this.playbackRate.set(rate);
  }

  protected toggleLoop(): void {
    this.loop.update(v => !v);
  }

  protected onLoadedMetadata(): void {
    // Hook para quando vídeo carrega (pode adicionar lógica futura)
  }
}
