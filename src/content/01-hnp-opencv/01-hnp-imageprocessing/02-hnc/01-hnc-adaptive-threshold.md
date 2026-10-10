title: cv::adaptiveThreshold Local Binarization
tag: Segmentation
Transforms a grayscale image into a binary image using locally adaptive thresholding calculated across Gaussian or mean neighborhood windows.
Key Rule
Select odd blockSize integers larger than 1; adjust constant subtraction C to tune fine foreground boundary separation.
```typescript
interface AdaptiveThresholdParams {
  src: cv.Mat;
  maxValue: number;
  adaptiveMethod: cv.AdaptiveThresholdTypes;
  thresholdType: cv.ThresholdTypes;
  blockSize: number;
  C: number;
}
```
