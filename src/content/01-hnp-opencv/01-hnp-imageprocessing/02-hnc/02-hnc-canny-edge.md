title: cv::Canny Multi-Stage Edge Detector
tag: Edge Detection
Finds prominent structural edges using Gaussian smoothing, Sobel gradient intensity computation, non-maximum suppression, and hysteresis thresholding.
Key Rule
Set threshold2 to approximately 2x or 3x threshold1; enable L2gradient for Euclidean gradient magnitude accuracy.
```typescript
interface CannyEdgeParams {
  image: cv.Mat;
  edges: cv.Mat;
  threshold1: number;
  threshold2: number;
  apertureSize?: number;
  L2gradient?: boolean;
}
```
