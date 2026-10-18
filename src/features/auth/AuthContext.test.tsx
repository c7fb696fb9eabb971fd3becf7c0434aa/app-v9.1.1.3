import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function VerificationProbe() {
  const { verifyGitHubPat } = useAuth();
  const [result, setResult] = useState('not tested');

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void verifyGitHubPat('temporary-test-token')
            .then(() => setResult('verified'))
            .catch(() => setResult('failed'));
        }}
      >
        Test token
      </button>
      <output>{result}</output>
    </>
  );
}

describe('GitHub PAT verification', () => {
  it('checks identity and repository write access without saving the token', async () => {
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
    window.sessionStorage.clear();

    try {
      render(
        <AuthProvider>
          <VerificationProbe />
        </AuthProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Test token' }));

      expect(await screen.findByText('verified')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(window.sessionStorage.getItem('greendocs.github.pat')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
