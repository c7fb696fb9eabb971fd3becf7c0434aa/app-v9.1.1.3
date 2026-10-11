import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth';
import { AppRoutes } from './AppRoutes';
import { GITHUB_API_ORIGIN, GITHUB_REPOSITORY } from '../../config';

function PublicRouteProbe() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <button onClick={() => navigate('/')}>Go to public route</button>
      <output aria-label="Current test route">{location.pathname}</output>
    </>
  );
}

function renderAt(path: string, withPublicRouteProbe = false) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        {withPublicRouteProbe && <PublicRouteProbe />}
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('public route and drawer', () => {
  it('renders the public home without requiring authentication', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
    expect(screen.getByText('Documentation is available to signed-in users.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign in with github/i })).not.toBeInTheDocument();
  });

  it('offers login in the right drawer and does not expose Studio navigation', async () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'Right navigation' });
    expect(drawer.querySelector('.right-sidebar-header')).toBeInTheDocument();
    expect(drawer.querySelector('.right-sidebar-content')).toBeInTheDocument();
    expect(drawer.querySelector('.right-sidebar-footer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in with GitHub' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /secret studio/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Log in with GitHub' }));
    expect(await screen.findByRole('heading', { name: 'Authenticate' })).toBeInTheDocument();
  });

  it('opens and closes the independent left sidebar without exposing login', () => {
    renderAt('/');
    const leftControl = screen.getByRole('button', { name: 'Open left sidebar' });
    fireEvent.click(leftControl);
    expect(screen.getByRole('dialog', { name: 'Left sidebar' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Right navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in with GitHub' })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(leftControl).toHaveFocus();
    expect(screen.queryByRole('dialog', { name: 'Left sidebar' })).not.toBeInTheDocument();
  });

  it('uses the shared brand home link in both sidebars and closes the selected sidebar', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Open left sidebar' }));
    const leftBrand = within(screen.getByRole('dialog', { name: 'Left sidebar' })).getByRole(
      'link',
      { name: 'GreenDocs home' },
    );
    expect(leftBrand).toHaveAttribute('href', '/');
    fireEvent.click(leftBrand);
    expect(screen.queryByRole('dialog', { name: 'Left sidebar' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
    const rightBrand = within(screen.getByRole('dialog', { name: 'Right navigation' })).getByRole(
      'link',
      { name: 'GreenDocs home' },
    );
    expect(rightBrand).toHaveAttribute('href', '/');
    fireEvent.click(rightBrand);
    expect(screen.queryByRole('dialog', { name: 'Right navigation' })).not.toBeInTheDocument();
  });

  it('keeps the right navigation drawer independently controlled', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
    expect(screen.getByRole('dialog', { name: 'Right navigation' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Left sidebar' })).not.toBeInTheDocument();
  });

  it('contains focus in the navigation drawer and restores it after Escape', () => {
    renderAt('/');
    const menu = screen.getByRole('button', { name: 'Open right navigation' });
    fireEvent.click(menu);
    expect(screen.getByRole('dialog', { name: 'Right navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close right navigation' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Right navigation' })).not.toBeInTheDocument();
    expect(menu).toHaveFocus();
  });

  it('redirects a direct Studio route to the public landing page when signed out', async () => {
    renderAt('/studio');
    expect(await screen.findByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Secret Studio' })).not.toBeInTheDocument();
  });

  it('redirects signed-out visits to the authenticated home to the public landing page', async () => {
    renderAt('/home');
    expect(await screen.findByRole('heading', { name: 'GreenDocs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /welcome/i })).not.toBeInTheDocument();
  });

  it('loads repository pages and cards at /home after successful GitHub sign-in', async () => {
    const rootPage = {
      schemaVersion: 1,
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Getting started',
      slug: 'getting-started',
      parentId: null,
      order: 0,
    };
    const childPage = {
      schemaVersion: 1,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Installation',
      slug: 'installation',
      parentId: rootPage.id,
      order: 0,
    };
    const card = {
      schemaVersion: 1,
      id: '33333333-3333-4333-8333-333333333333',
      pageId: childPage.id,
      order: 0,
      title: 'Install the app',
      definition: 'Follow these steps.',
      attachments: [],
    };
    const encode = (value: unknown) => btoa(JSON.stringify(value));
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
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'a'.repeat(40) } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ tree: { sha: 'b'.repeat(40) } })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tree: [
              {
                path: `content/pages/${rootPage.id}.json`,
                type: 'blob',
                sha: 'c'.repeat(40),
              },
              {
                path: `content/pages/${childPage.id}.json`,
                type: 'blob',
                sha: 'd'.repeat(40),
              },
              {
                path: `content/cards/${card.id}.json`,
                type: 'blob',
                sha: 'e'.repeat(40),
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ encoding: 'base64', content: encode(rootPage) })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ encoding: 'base64', content: encode(childPage) })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ encoding: 'base64', content: encode(card) })),
      );
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderAt('/login', true);
      fireEvent.change(screen.getByLabelText('Personal Access Token'), {
        target: { value: 'synthetic-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));

      expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible();
      expect(screen.queryByRole('heading', { name: /welcome/i })).not.toBeInTheDocument();
      expect(
        screen.queryByText('No documentation pages have been published yet.'),
      ).not.toBeInTheDocument();
      expect(await screen.findByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Installation' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Install the app' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Open right navigation' }));
      const rightBrand = within(screen.getByRole('dialog', { name: 'Right navigation' })).getByRole(
        'link',
        { name: 'GreenDocs home' },
      );
      expect(rightBrand).toHaveAttribute('href', '/home');
      fireEvent.click(rightBrand);
      expect(screen.queryByRole('dialog', { name: 'Right navigation' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Go to public route' }));
      expect(await screen.findByLabelText('Current test route')).toHaveTextContent('/home');
      expect(fetchMock).toHaveBeenCalledWith(
        `${GITHUB_API_ORIGIN}/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}/git/ref/heads/main`,
        expect.objectContaining({ credentials: 'omit', cache: 'no-store' }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('loads the PAT page on demand and provides an accessible token visibility control', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Authenticate' })).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('login-main');
    expect(
      screen.getByRole('region', { name: 'Authenticate' }).closest('.login-shell'),
    ).not.toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/token stays in this tab's memory/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Authenticate with your account in order to push & commit files to the configured repository.',
      ),
    ).toBeInTheDocument();
    const token = screen.getByLabelText('Personal Access Token');
    expect(token).toHaveAttribute('type', 'password');
    const visibilityToggle = screen.getByRole('button', { name: 'Show personal access token' });
    expect(visibilityToggle.textContent).toBe('');
    expect(visibilityToggle.querySelector('svg')).toBeInTheDocument();
    expect(token.parentElement).toHaveClass('login-input-control');
    expect(token.parentElement).toContainElement(visibilityToggle);
    fireEvent.click(visibilityToggle);
    expect(token).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide personal access token' })).toHaveTextContent(
      '',
    );
    expect(screen.getByRole('link', { name: 'Return to Home Page' })).toHaveClass(
      'login-home-link',
    );
    expect(
      screen.getByRole('link', { name: 'Return to Home Page' }).querySelector('.login-home-arrow'),
    ).toBeInTheDocument();
    const futureSignInButtons = [
      'Continue with Google',
      'Continue with GitHub',
      'Continue with ChatGPT',
      'Continue with SAML SSO',
      'Continue with Passkey',
    ].map((name) => screen.getByRole('button', { name }));
    expect(futureSignInButtons).toHaveLength(5);
    futureSignInButtons.forEach((button) => expect(button).toBeDisabled());
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
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'a'.repeat(40) } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ tree: { sha: 'b'.repeat(40) } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ tree: [] })));
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderAt('/login');
      fireEvent.change(screen.getByLabelText('Personal Access Token'), {
        target: { value: 'synthetic-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));

      expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /welcome/i })).not.toBeInTheDocument();
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
      expect(screen.queryByText('Sign in to open the documentation home.')).not.toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
