title: cv::ORB Oriented FAST Rotated BRIEF
tag: Keypoint Detection
Scale-invariant and rotation-invariant corner detector and binary descriptor extractor optimized for real-time edge devices.
Key Rule
Compute pyramid levels with scaleFactor between 1.2 and 1.4; utilize Hamming distance for binary string descriptor matching.
```typescript
interface ORBParams {
  nfeatures: number;
  scaleFactor: number;
  nlevels: number;
  edgeThreshold: number;
  firstLevel: number;
  WTA_K: number;
  scoreType: cv.ORBScoreType;
}
```
