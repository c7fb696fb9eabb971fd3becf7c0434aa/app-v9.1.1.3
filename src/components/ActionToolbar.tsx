import { useRef, useState, type PointerEvent } from 'react';
import { IconButton, type IconName } from './Icon';

export type ToolbarAction = {
  id: string;
  icon: IconName;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
};

export function ActionToolbar({
  actions,
  ariaLabel,
  className = '',
  viewportClassName = '',
  trackClassName = '',
  itemClassName = '',
}: {
  actions: readonly ToolbarAction[];
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  trackClassName?: string;
  itemClassName?: string;
}) {
  const [offset, setOffset] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offset,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 3) drag.moved = true;
    const viewportWidth = viewportRef.current?.clientWidth ?? 0;
    const trackWidth = trackRef.current?.scrollWidth ?? 0;
    const maximumOffset = Math.max(0, trackWidth - viewportWidth);
    setOffset(Math.max(-maximumOffset, Math.min(0, drag.startOffset + delta)));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    suppressClickRef.current = false;
  }

  return (
    <div
      ref={viewportRef}
      className={`${className} ${viewportClassName}`.trim()}
      role="toolbar"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        ref={trackRef}
        className={trackClassName}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {actions.map((action) => (
          <IconButton
            key={action.id}
            name={action.icon}
            label={action.label}
            disabled={action.disabled}
            className={itemClassName}
            onClick={action.onSelect}
            title={action.label}
          />
        ))}
      </div>
    </div>
  );
}
