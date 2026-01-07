import { GestureBufferService } from './gesture-buffer.service';
import { LandmarkNormalizerService } from './landmark-normalizer.service';

describe('GestureBufferService', () => {
  let service: GestureBufferService;
  let normalizer: LandmarkNormalizerService;

  beforeEach(() => {
    normalizer = new LandmarkNormalizerService();
    service = new GestureBufferService(normalizer);
  });

  describe('initial state', () => {
    it('should start with empty buffer', () => {
      expect(service.frameCount()).toBe(0);
      expect(service.isReady()).toBe(false);
      expect(service.consecutiveNulls()).toBe(0);
    });
  });

  describe('addFrame', () => {
    it('should add frame to buffer', () => {
      const landmarks = createMockLandmarks();
      service.addFrame(landmarks, 640, 480);
      expect(service.frameCount()).toBe(1);
    });

    it('should increment consecutiveNulls for null input', () => {
      service.addFrame(null, 640, 480);
      expect(service.consecutiveNulls()).toBe(1);
      expect(service.frameCount()).toBe(0);
    });

    it('should reset consecutiveNulls when hand detected', () => {
      service.addFrame(null, 640, 480);
      service.addFrame(null, 640, 480);
      expect(service.consecutiveNulls()).toBe(2);

      service.addFrame(createMockLandmarks(), 640, 480);
      expect(service.consecutiveNulls()).toBe(0);
    });

    it('should clear buffer after maxConsecutiveNulls', () => {
      // Add some frames first
      for (let i = 0; i < 5; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      expect(service.frameCount()).toBe(5);

      // Add more nulls than maxConsecutiveNulls (default 10)
      for (let i = 0; i < 11; i++) {
        service.addFrame(null, 640, 480);
      }
      expect(service.frameCount()).toBe(0);
    });

    it('should not exceed buffer size', () => {
      for (let i = 0; i < 40; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      expect(service.frameCount()).toBe(30);
    });
  });

  describe('isReady', () => {
    it('should return true when buffer has 30 frames', () => {
      for (let i = 0; i < 30; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      expect(service.isReady()).toBe(true);
    });

    it('should return false when buffer has less than 30 frames', () => {
      for (let i = 0; i < 29; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      expect(service.isReady()).toBe(false);
    });
  });

  describe('getInferenceData', () => {
    it('should return null when buffer not ready', () => {
      service.addFrame(createMockLandmarks(), 640, 480);
      expect(service.getInferenceData()).toBeNull();
    });

    it('should return data in correct shape when ready', () => {
      for (let i = 0; i < 30; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      const data = service.getInferenceData();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(1); // batch size
      expect(data![0].length).toBe(30); // timesteps
      expect(data![0][0].length).toBe(126); // features
    });
  });

  describe('clear', () => {
    it('should reset all state', () => {
      for (let i = 0; i < 15; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      service.addFrame(null, 640, 480);

      service.clear();

      expect(service.frameCount()).toBe(0);
      expect(service.consecutiveNulls()).toBe(0);
      expect(service.isReady()).toBe(false);
    });
  });

  describe('configure', () => {
    it('should allow changing buffer size', () => {
      service.configure({ bufferSize: 10 });
      for (let i = 0; i < 10; i++) {
        service.addFrame(createMockLandmarks(), 640, 480);
      }
      expect(service.isReady()).toBe(true);
    });
  });
});

function createMockLandmarks() {
  return [
    Array.from({ length: 21 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.1,
    })),
  ];
}
