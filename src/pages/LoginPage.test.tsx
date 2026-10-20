import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('keeps the token available and shows an error when GitHub rejects it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Bad credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    try {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>,
      );

      const tokenInput = screen.getByLabelText('Personal Access Token');
      fireEvent.change(tokenInput, { target: { value: 'synthetic-invalid-token' } });
      fireEvent.click(screen.getByRole('button', { name: 'Authenticate' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('GitHub rejected this token.');
      expect(tokenInput).toHaveValue('synthetic-invalid-token');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
