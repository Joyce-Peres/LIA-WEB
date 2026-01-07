import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private stream: MediaStream | null = null;

  async start(
    video: HTMLVideoElement,
    constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }
  ): Promise<void> {
    if (!this.hasMediaDevices()) {
      throw new Error('Media devices are not available in this environment.');
    }

    await this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Attach to element
    video.muted = true;
    video.playsInline = true as any; // playsInline not in older TS DOM libs
    (video as any).srcObject = this.stream;
    await video.play();
  }

  async stop(): Promise<void> {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try { track.stop(); } catch { /* ignore */ }
      }
      this.stream = null;
    }
  }

  isActive(): boolean {
    return !!this.stream && this.stream.getTracks().some(t => t.readyState === 'live');
  }

  private hasMediaDevices(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }

  async listVideoInputs(): Promise<MediaDeviceInfo[]> {
    if (!this.hasMediaDevices()) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  async startFacing(video: HTMLVideoElement, facing: 'user' | 'environment'): Promise<void> {
    return this.start(video, {
      video: { facingMode: { ideal: facing } },
      audio: false
    });
  }

  async startWithDeviceId(video: HTMLVideoElement, deviceId: string): Promise<void> {
    return this.start(video, {
      video: { deviceId: { exact: deviceId } },
      audio: false
    });
  }
}
