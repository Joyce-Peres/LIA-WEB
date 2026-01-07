import { LandmarkNormalizerService, HAND_LANDMARKS } from './landmark-normalizer.service';

describe('LandmarkNormalizerService', () => {
  let service: LandmarkNormalizerService;

  beforeEach(() => {
    service = new LandmarkNormalizerService();
  });

  describe('normalize', () => {
    it('should return 126 features for empty input', () => {
      const result = service.normalize(null, 640, 480);
      expect(result.features.length).toBe(HAND_LANDMARKS.TOTAL_FEATURES);
      expect(result.originalHandCount).toBe(0);
    });

    it('should return 126 features for one hand', () => {
      const landmarks = createMockLandmarks(21);
      const result = service.normalize([landmarks], 640, 480);
      expect(result.features.length).toBe(HAND_LANDMARKS.TOTAL_FEATURES);
      expect(result.originalHandCount).toBe(1);
    });

    it('should return 126 features for two hands', () => {
      const hand1 = createMockLandmarks(21);
      const hand2 = createMockLandmarks(21);
      const result = service.normalize([hand1, hand2], 640, 480);
      expect(result.features.length).toBe(HAND_LANDMARKS.TOTAL_FEATURES);
      expect(result.originalHandCount).toBe(2);
    });

    it('should normalize coordinates that are not already normalized', () => {
      const landmarks = Array.from({ length: 21 }, () => ({
        x: 320, // middle of 640
        y: 240, // middle of 480
        z: 0.1,
      }));
      const result = service.normalize([landmarks], 640, 480);
      // First landmark x should be 320/640 = 0.5
      expect(result.features[0]).toBe(0.5);
      // First landmark y should be 240/480 = 0.5
      expect(result.features[1]).toBe(0.5);
      // Z should remain unchanged
      expect(result.features[2]).toBe(0.1);
    });

    it('should keep already normalized coordinates', () => {
      const landmarks = createMockLandmarks(21);
      const result = service.normalize([landmarks], 640, 480);
      // Should keep the normalized values
      expect(result.features[0]).toBeLessThanOrEqual(1);
      expect(result.features[1]).toBeLessThanOrEqual(1);
    });

    it('should throw error for invalid video dimensions', () => {
      expect(() => service.normalize(null, 0, 480)).toThrow();
      expect(() => service.normalize(null, 640, 0)).toThrow();
      expect(() => service.normalize(null, -1, 480)).toThrow();
    });

    it('should pad second hand with zeros when only one hand detected', () => {
      const landmarks = createMockLandmarks(21);
      const result = service.normalize([landmarks], 640, 480);
      // Second hand features should all be 0
      const secondHandStart = HAND_LANDMARKS.FEATURES_PER_HAND;
      for (let i = secondHandStart; i < HAND_LANDMARKS.TOTAL_FEATURES; i++) {
        expect(result.features[i]).toBe(0);
      }
    });
  });

  describe('getLandmark', () => {
    it('should extract correct landmark coordinates', () => {
      const landmarks = Array.from({ length: 21 }, (_, i) => ({
        x: i * 0.01,
        y: i * 0.02,
        z: i * 0.001,
      }));
      const result = service.normalize([landmarks], 640, 480);

      const landmark5 = service.getLandmark(result.features, 0, 5);
      expect(landmark5.x).toBeCloseTo(0.05, 5);
      expect(landmark5.y).toBeCloseTo(0.10, 5);
      expect(landmark5.z).toBeCloseTo(0.005, 5);
    });
  });

  describe('hasValidHand', () => {
    it('should return true for valid hand', () => {
      const landmarks = createMockLandmarks(21);
      const result = service.normalize([landmarks], 640, 480);
      expect(service.hasValidHand(result.features, 0)).toBe(true);
    });

    it('should return false for empty hand slot', () => {
      const result = service.normalize(null, 640, 480);
      expect(service.hasValidHand(result.features, 0)).toBe(false);
      expect(service.hasValidHand(result.features, 1)).toBe(false);
    });
  });
});

function createMockLandmarks(count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 0.8 + 0.1, // 0.1-0.9
    y: Math.random() * 0.8 + 0.1,
    z: Math.random() * 0.1 - 0.05, // -0.05 to 0.05
  }));
}
