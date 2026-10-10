title: cv::morphologyEx Advanced Morphological Operations
tag: Mathematical Morphology
Performs structural erosion, dilation, opening, closing, morphological gradient, tophat, and blackhat using structured structuring elements.
Key Rule
MORP_OPEN removes small foreground noise; MORP_CLOSE connects small holes in foreground objects.
```typescript
interface MorphologyParams {
  src: cv.Mat;
  op: cv.MorphTypes;
  kernel: cv.Mat;
  anchor?: [number, number];
  iterations?: number;
}
```
