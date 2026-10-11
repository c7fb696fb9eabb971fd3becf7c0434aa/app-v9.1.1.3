import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth';
import { AppRoutes } from './AppRoutes';

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

  it('redirects a direct Studio route to PAT login when signed out', async () => {
    renderAt('/studio');
    expect(
      await screen.findByRole('heading', { name: 'Verify GitHub access' }),
    ).toBeInTheDocument();
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

  it('returns a verified user to the directly requested Studio route', async () => {
    const fakeSession = {
      session: 's'.repeat(43),
      user: {
        id: '123',
        login: 'verified-user',
        name: null,
        avatarUrl: 'https://avatars.example.test/123',
      },
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fakeSession), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderAt('/studio');
      await screen.findByRole('heading', { name: 'Verify GitHub access' });
      fireEvent.change(screen.getByLabelText('GitHub classic personal access token'), {
        target: { value: 'synthetic-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

      expect(await screen.findByRole('heading', { name: 'Secret Studio' })).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          cache: 'no-store',
          body: JSON.stringify({ pat: 'synthetic-test-token' }),
        }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
