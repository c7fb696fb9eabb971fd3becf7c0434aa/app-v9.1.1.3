title: cv::warpAffine Matrix Transformation
tag: Geometric Transform
Transforms 2D image coordinates via a 2x3 affine matrix representation using inverse mapping and bilinear pixel interpolation.
Key Rule
Pass WARP_INVERSE_MAP flag when using forward matrix formulations; define border value for out-of-bounds coordinates.
```typescript
interface WarpAffineConfig {
  src: cv.Mat;
  dst: cv.Mat;
  M: cv.Mat;
  dsize: [number, number];
  flags: cv.InterpolationFlags;
}
```
