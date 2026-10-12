export type ClientEvent =
  | 'github_auth_expired'
  | 'github_request_failure'
  | 'github_session_restore_failure'
  | 'github_session_storage_failure'
  | 'route_chunk_failure'
  | 'route_render_failure';
export type ClientRoute = 'public-home' | 'login' | 'home' | 'backend';

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
