import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth';
import { AppRoutes } from './AppRoutes';
import { GITHUB_API_ORIGIN, GITHUB_REPOSITORY } from '../../config';

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('public route and drawer', () => {
  it('renders the public home without requiring authentication', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
    expect(screen.getByText('No published pages are available yet.')).toBeInTheDocument();
  });

  it('offers login in the right drawer and does not expose Studio navigation', async () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
    expect(screen.getByRole('link', { name: 'Log in with GitHub' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /secret studio/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Log in with GitHub' }));
    expect(
      await screen.findByRole('heading', { name: 'Verify GitHub access' }),
    ).toBeInTheDocument();
  });

  it('contains focus in the navigation drawer and restores it after Escape', () => {
    renderAt('/');
    const menu = screen.getByRole('button', { name: 'Open right navigation' });
    fireEvent.click(menu);
    expect(screen.getByRole('dialog', { name: 'Right navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Right navigation' })).not.toBeInTheDocument();
    expect(menu).toHaveFocus();
  });

  it('redirects a direct Studio route to the public home when signed out', async () => {
    renderAt('/studio');
    expect(await screen.findByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Secret Studio' })).not.toBeInTheDocument();
  });

  it('loads the PAT page on demand and provides an accessible token visibility control', async () => {
    renderAt('/login');
    expect(
      await screen.findByRole('heading', { name: 'Verify GitHub access' }),
    ).toBeInTheDocument();
    const token = screen.getByLabelText('GitHub classic personal access token');
    expect(token).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show personal access token' }));
    expect(token).toHaveAttribute('type', 'text');
  });

  it('verifies GitHub identity and repository write permission before sign-in', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 123,
            login: 'verified-user',
            name: null,
            avatar_url: 'https://avatars.example.test/123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ permissions: { push: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderAt('/login');
      fireEvent.change(screen.getByLabelText('GitHub classic personal access token'), {
        target: { value: 'synthetic-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

      expect(await screen.findByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `${GITHUB_API_ORIGIN}/user`,
        expect.objectContaining({
          cache: 'no-store',
          credentials: 'omit',
          headers: expect.any(Headers),
        }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        `${GITHUB_API_ORIGIN}/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}`,
        expect.objectContaining({ cache: 'no-store', credentials: 'omit' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
      expect(screen.getByText(/Signed in as/)).toHaveTextContent('verified-user');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
