export type ClientEvent =
  'github_auth_expired' | 'github_request_failure' | 'route_chunk_failure' | 'route_render_failure';
export type ClientRoute = 'public-home' | 'login' | 'studio';

export function reportClientEvent(
  event: ClientEvent,
  route: ClientRoute,
  details: { status?: number; requestId?: string } = {},
): void {
  console.warn('GreenDocs client event', {
    event,
    route,
    ...details,
  });
}
