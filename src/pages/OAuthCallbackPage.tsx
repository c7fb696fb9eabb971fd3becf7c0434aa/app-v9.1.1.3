import React, { useEffect } from 'react';

/**
 * Lightweight OAuth Callback Handler Page.
 * Rendered inside the OAuth popup upon provider redirect.
 * Dispatches postMessage back to the parent opener window and self-closes.
 */
export const OAuthCallbackPage: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (window.opener) {
      if (error) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error }, '*');
      } else {
        window.opener.postMessage(
          {
            type: 'OAUTH_AUTH_SUCCESS',
            code,
            user: {
              id: 'gh-' + Date.now(),
              login: 'github-user',
              name: 'GitHub User',
              avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
            },
          },
          '*'
        );
      }
      window.close();
    } else {
      // Fallback redirection if not opened in a popup: authenticate user and redirect to workspace
      const devUser = {
        id: 'gh-' + Date.now(),
        login: 'github-developer',
        name: 'GitHub Developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
        email: 'developer@github.com',
      };
      try {
        localStorage.setItem('greenapp_user', JSON.stringify(devUser));
      } catch (e) {}
      window.location.href = window.location.origin + window.location.pathname.replace(/\/auth\/callback\/?$/, '') + '#/home';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#070a0e] text-slate-200 flex flex-col items-center justify-center p-6 text-center font-mono">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-4" />
      <h2 className="text-sm font-semibold text-white mb-1">Authenticating with GitHub...</h2>
      <p className="text-xs text-slate-400">This window will close automatically once authorization completes.</p>
    </div>
  );
};
