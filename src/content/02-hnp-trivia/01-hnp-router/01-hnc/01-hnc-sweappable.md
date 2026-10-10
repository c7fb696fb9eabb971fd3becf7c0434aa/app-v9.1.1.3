title: cv::filter2D Linear Kernel Convolution
tag: Kernel Processing
Linear spatial filtering operation convolving an arbitrary 2D floating-point kernel matrix across multi-channel image planes with border extrapolation.
Key Rule
Anchor coordinate (-1,-1) defaults to the geometric kernel center; normalized box filters prevent value saturation.
```typescript
interface Filter2DParams {
  src: cv.Mat;
  kernel: cv.Mat;
  anchor: [number, number];
  delta: number;
  borderType: cv.BorderTypes;
}
```
