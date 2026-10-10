title: cv::distanceTransform Euclidean Metric Transform
tag: Distance Transform
Calculates the distance to the closest zero boundary pixel for each binary foreground pixel using L2 or city-block metric approximations.
Key Rule
Normalized distance maps serve as primary watershed markers to separate touching convex objects.
```typescript
interface DistanceTransformParams {
  src: cv.Mat;
  distanceType: cv.DistanceTypes;
  maskSize: cv.DistanceTransformMasks;
}
```
