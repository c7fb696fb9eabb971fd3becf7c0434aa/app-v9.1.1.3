import type {
  CardContainerRecordV2,
  CardRecord,
  CardRecordV2,
  ContentRecordsV2,
  RepositorySnapshotResponse,
} from './content';

export interface ContainerPreview<
  TContainer extends { id: string } = CardContainerRecordV2,
  TCard extends { id: string; containerId: string; order: number } = CardRecordV2,
> {
  container: TContainer;
  cards: TCard[];
  activeCard: TCard | null;
  showCarouselIndicators: boolean;
}

export function resolveCardContainer<
  TContainer extends { id: string },
  TCard extends { id: string; containerId: string; order: number },
>(
  containers: readonly TContainer[],
  cards: readonly TCard[],
  containerId: string,
  activeCardId?: string | null,
): ContainerPreview<TContainer, TCard> {
  const container = containers.find((item) => item.id === containerId);
  if (!container) throw new Error('container_not_found');

  const orderedCards = cards
    .filter((card) => card.containerId === containerId)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  let activeCard: TCard | null = null;
  if (activeCardId !== undefined && activeCardId !== null) {
    activeCard = orderedCards.find((card) => card.id === activeCardId) ?? null;
    if (!activeCard) throw new Error('card_not_in_container');
  } else {
    activeCard = orderedCards[0] ?? null;
  }

  return {
    container,
    cards: orderedCards,
    activeCard,
    showCarouselIndicators: orderedCards.length > 1,
  };
}

export function orderedContainersForPage(
  records: ContentRecordsV2,
  pageId: string,
): CardContainerRecordV2[] {
  if (!records.pages.some((page) => page.id === pageId)) {
    throw new Error('page_not_found');
  }
  return records.containers
    .filter((container) => container.pageId === pageId)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

export function resolveContainerPreview(
  records: ContentRecordsV2,
  containerId: string,
  activeCardId?: string | null,
): ContainerPreview {
  return resolveCardContainer(records.containers, records.cards, containerId, activeCardId);
}

export function virtualContainerIdForPage(pageId: string): string {
  return `repository-container:${pageId}`;
}

type RepositoryPageContainer = {
  id: string;
  pageId: string;
  title: string;
  order: number;
};

type RepositoryPreviewCard = (CardRecord | CardRecordV2) & {
  containerId: string;
};

export function resolveRepositoryPagePreviews(
  snapshot: RepositorySnapshotResponse,
  pageId: string,
  activeCardIds: Readonly<Record<string, string | null>> = {},
): ContainerPreview<RepositoryPageContainer, RepositoryPreviewCard>[] {
  if (!snapshot.pages.some((item) => item.id === pageId)) throw new Error('page_not_found');

  const containers: RepositoryPageContainer[] =
    snapshot.schemaVersion === 2
      ? snapshot.containers
          .filter((item) => item.pageId === pageId)
          .map(({ id, pageId: ownerPageId, title, order }) => ({
            id,
            pageId: ownerPageId,
            title,
            order,
          }))
      : [
          {
            id: virtualContainerIdForPage(pageId),
            pageId,
            title: 'Cards',
            order: 0,
          },
        ];

  return containers
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((container) => {
      const cards: RepositoryPreviewCard[] =
        snapshot.schemaVersion === 2
          ? snapshot.cards.filter((card) => card.containerId === container.id)
          : snapshot.cards
              .filter((card) => card.pageId === pageId)
              .map((card) => ({ ...card, containerId: container.id }));
      return resolveCardContainer(
        [container],
        cards,
        container.id,
        activeCardIds[container.id] ?? null,
      );
    });
}
