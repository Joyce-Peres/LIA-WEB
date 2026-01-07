import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type HandsType = any; // Avoid tight coupling to package types

@Injectable({ providedIn: 'root' })
export class HandPoseService {
  private hands: HandsType | null = null;
  private processing = false;
  private rafId: number | null = null;
  private video?: HTMLVideoElement;

  private resultsSubject = new BehaviorSubject<any | null>(null);
  public readonly results$ = this.resultsSubject.asObservable();

  async init(): Promise<void> {
    if (this.hands) return;
    const mp = await import('@mediapipe/hands');
    const HandsCtor = (mp as any).Hands;
    const hands: any = new HandsCtor({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults((res: any) => {
      this.resultsSubject.next(res);
    });
    this.hands = hands;
  }

  async start(video: HTMLVideoElement): Promise<void> {
    await this.init();
    this.video = video;
    this.processing = true;
    this.loop();
  }

  stop(): void {
    this.processing = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = async (): Promise<void> => {
    if (!this.processing || !this.video || !this.hands) return;
    try {
      if (this.video.readyState >= 2) {
        await this.hands.send({ image: this.video });
      }
    } catch {
      // ignore frame errors
    }
    this.rafId = requestAnimationFrame(() => { void this.loop(); });
  };
}
