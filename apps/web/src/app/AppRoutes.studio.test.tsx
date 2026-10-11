import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';

vi.mock('../features/auth', () => ({
  useAuth: () => ({
    user: { login: 'studio-user' },
    isCheckingSession: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../pages/StudioPage', () => ({
  StudioPage: () => <h1>Studio route test</h1>,
}));

vi.mock('../pages/HomePage', () => ({
  HomePage: () => <h1>Home route test</h1>,
}));

afterEach(cleanup);

describe('Studio route application chrome', () => {
  it('omits the shared site header on the Studio workspace', async () => {
    render(
      <MemoryRouter initialEntries={['/studio']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Studio route test' })).toBeVisible();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open right navigation' })).not.toBeInTheDocument();
  });

  it('keeps the shared site header on the authenticated Home route', async () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Home route test' })).toBeVisible();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open right navigation' })).toBeInTheDocument();
  });
});
