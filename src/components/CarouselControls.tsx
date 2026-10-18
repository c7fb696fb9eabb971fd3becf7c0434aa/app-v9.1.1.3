import { Button } from './Primitives';

export interface CarouselItem {
  id: string;
  title: string;
}

export function CarouselControls({
  items,
  activeItemId,
  onSelect,
  ariaLabel,
  previousLabel,
  nextLabel,
  indicatorLabel,
  className,
}: {
  items: readonly CarouselItem[];
  activeItemId: string | null;
  onSelect: (itemId: string) => void;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  indicatorLabel: (item: CarouselItem, index: number) => string;
  className: string;
}) {
  if (items.length < 2) return null;
  if (!items.some((item) => item.id === activeItemId)) {
    throw new Error('carousel_active_item_missing');
  }

  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      <Button
        type="button"
        className={`${className}-control`}
        aria-label={previousLabel}
        onClick={() => {
          const activeIndex = items.findIndex((item) => item.id === activeItemId);
          onSelect(items[(activeIndex - 1 + items.length) % items.length]!.id);
        }}
      >
        Previous
      </Button>
      <div className={`${className}-indicators`} role="group" aria-label={`${ariaLabel} slides`}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={[`${className}-indicator`, activeItemId === item.id && 'is-active']
              .filter(Boolean)
              .join(' ')}
            aria-label={indicatorLabel(item, index)}
            aria-current={activeItemId === item.id ? 'true' : undefined}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
      <Button
        type="button"
        className={`${className}-control`}
        aria-label={nextLabel}
        onClick={() => {
          const activeIndex = items.findIndex((item) => item.id === activeItemId);
          onSelect(items[(activeIndex + 1) % items.length]!.id);
        }}
      >
        Next
      </Button>
    </div>
  );
}
