import React from 'react';

export interface DotMatrixBackgroundProps {
  /** Optional custom dot color in rgba/rgb/hex. Default is emerald rgba(16, 185, 129, 0.38) */
  dotColor?: string;
  /** Dot grid pitch/spacing in pixels. Default is 24 */
  gridSpacing?: number;
  /** Dot radius in pixels. Default is 1.2 */
  dotRadius?: number;
  /** Opacity of the dot matrix overlay. Default is 0.45 */
  opacity?: number;
  /** Whether to render the ambient top illumination glow. Default is true */
  showTopGlow?: boolean;
  /** Optional children rendered within the background layer */
  children?: React.ReactNode;
}

/**
 * Reusable full-viewport background component with a VS Code-style emerald dot grid matrix
 * and Mintlify-inspired ambient top glow.
 */
export const DotMatrixBackground: React.FC<DotMatrixBackgroundProps> = React.memo(({
  dotColor = 'rgba(16, 185, 129, 0.38)',
  gridSpacing = 24,
  dotRadius = 1.2,
  opacity = 0.45,
  showTopGlow = true,
  children,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Hardware-accelerated VS Code Style Emerald Dot Grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity,
          backgroundImage: `radial-gradient(${dotColor} ${dotRadius}px, transparent ${dotRadius}px)`,
          backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 95%)',
        }}
      />

      {/* Mintlify signature ambient emerald top illumination */}
      {showTopGlow && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[380px] bg-gradient-to-b from-emerald-500/12 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
      )}

      {children}
    </div>
  );
});
