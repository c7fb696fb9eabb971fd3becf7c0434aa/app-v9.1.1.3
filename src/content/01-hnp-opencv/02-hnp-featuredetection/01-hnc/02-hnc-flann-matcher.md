title: cv::FlannBasedMatcher Approximate Nearest Neighbors
tag: Descriptor Matching
Fast Library for Approximate Nearest Neighbors matching high-dimensional feature vectors across sequential video frames.
Key Rule
Use L2 distance for floating-point descriptors (SIFT) and LshIndexParams with Hamming distance for binary descriptors (ORB).
```typescript
interface FlannMatcherParams {
  indexParams: cv.IndexParams;
  searchParams: cv.SearchParams;
  crossCheck: boolean;
}
```
