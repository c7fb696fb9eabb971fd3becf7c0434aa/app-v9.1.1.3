import { ComponentCard } from '../types';

export const COMPONENT_CARDS: ComponentCard[] = [
  {
    id: 'polymorphic-button',
    title: 'Polymorphic Action Button',
    tag: 'Core Primitive',
    definition: 'A polymorphic interactive trigger designed to maintain consistent hitboxes, focus rings, and tactile spring feedback regardless of whether it renders as a native button or semantic anchor.',
    keyRule: 'Touch hit target must always measure ≥ 44×44px on mobile viewports.',
    deepDive: {
      typescriptInterface: `interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
  variant?: 'primary' | 'subtle' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;`,
    },
  },
  {
    id: 'glassmorphic-modal',
    title: 'Glassmorphic Dialog Modal',
    tag: 'Composite View',
    definition: 'A floating surface presenting critical contextual workflows that temporarily interrupts interaction with the main viewport while preserving visual spatial awareness through backdrop diffusion.',
    keyRule: 'Focus must be strictly trapped inside dialog until explicitly closed or dismissed.',
    deepDive: {
      typescriptInterface: `interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  initialFocusRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}`,
    },
  },
  {
    id: 'adaptive-sheet',
    title: 'Adaptive Bottom Sheet Drawer',
    tag: 'Touch Primitive',
    definition: 'An ergonomic drawer sliding from the bottom viewport that maps directly to natural thumb zones, utilizing kinetic drag gestures and snap points for effortless single-handed mobile operation.',
    keyRule: 'Velocity and displacement past 80px snap threshold completes sheet dismissal.',
    deepDive: {
      typescriptInterface: `interface BottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  snapPoints?: number[]; // [0.4, 0.85]
  dragHandle?: boolean;
  children: React.ReactNode;
}`,
    },
  },
  {
    id: 'command-palette',
    title: 'Command Palette (Cmd+K)',
    tag: 'Power Pattern',
    definition: 'A centralized keyboard-driven overlay allowing developers to quickly query documentation pages, component APIs, tokens, and actions with instantaneous millisecond filtering.',
    keyRule: 'Search input must autofocus with zero latency upon opening.',
    deepDive: {
      typescriptInterface: `interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{
    id: string;
    group: string;
    title: string;
    shortcut?: string;
    onSelect: () => void;
  }>;
}`,
    },
  },
  {
    id: 'fluid-grid',
    title: 'Fluid Responsive Bento Grid',
    tag: 'Structural Surface',
    definition: 'An asymmetrical spatial system utilizing CSS Grid and container queries to dynamically adapt card spans, margins, and typographic hierarchies without layout fragmentation.',
    keyRule: 'Container padding must always be greater than or equal to inner gap spacing.',
    deepDive: {
      typescriptInterface: `interface BentoGridProps {
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  asymmetricLead?: boolean;
  children: React.ReactNode;
}`,
    },
  },
];
