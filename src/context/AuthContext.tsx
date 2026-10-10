import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithGithub: (redirectPath?: string) => Promise<void>;
  loginAsDeveloper: (customUser?: Partial<AuthUser>) => void;
  loginWithEmail: (email: string) => void;
  logout: () => void;
  callbackUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'greenapp_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine exact callback URL for OAuth standard compatibility (No hash fragments in OAuth redirect_uri!)
  // In development/preview or production, redirect to standard /auth/callback path
  const callbackUrl = `${window.location.origin}/auth/callback`;

  // Restore user session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse stored user session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for postMessage from the OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if not in development
      const origin = event.origin;
      const isAllowedOrigin =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost') ||
        origin.endsWith('github.io');

      if (!isAllowedOrigin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const receivedUser = event.data.user || {
          id: 'gh-123456',
          login: 'github-developer',
          name: 'GitHub Developer',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          email: 'developer@github.com',
        };

        setUser(receivedUser);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(receivedUser));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loginWithGithub = async (_redirectPath?: string): Promise<void> => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23lia5n28LWDlbVJLZ';

    if (clientId) {
      // Real production GitHub OAuth popup flow
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'read:user,user:email',
      });

      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
      window.open(authUrl, 'github_oauth_popup', 'width=600,height=700,status=no,toolbar=no');
    } else {
      // Immediate developer mode flow with mock authorization window
      const popup = window.open(
        '',
        'github_oauth_popup',
        'width=600,height=700,status=no,toolbar=no'
      );

      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>GitHub Authorization</title>
              <style>
                body {
                  background-color: #0d1117;
                  color: #e6edf3;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  padding: 24px;
                  box-sizing: border-box;
                  text-align: center;
                }
                .card {
                  background: #161b22;
                  border: 1px solid #30363d;
                  border-radius: 8px;
                  padding: 28px;
                  max-width: 440px;
                  width: 100%;
                }
                .btn {
                  background: #238636;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 10px 20px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  margin-top: 18px;
                  width: 100%;
                }
                .btn:hover { background: #2ea043; }
                h2 { margin: 12px 0 6px 0; font-size: 20px; }
                p { color: #8b949e; font-size: 13px; line-height: 1.5; margin: 0; }
                .logo { width: 44px; height: 44px; fill: white; }
                .note { margin-top: 16px; padding: 10px; background: #0d1117; border: 1px dashed #30363d; border-radius: 6px; font-size: 11px; color: #8b949e; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="card">
                <svg class="logo" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <h2>Authorize Green App</h2>
                <p>Connect your GitHub account to access the developer workspace.</p>
                <div class="note">Callback URL: <strong>${callbackUrl}</strong></div>
                <button class="btn" id="authorize-btn">Authorize with GitHub</button>
              </div>
              <script>
                document.getElementById('authorize-btn').onclick = function() {
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'OAUTH_AUTH_SUCCESS',
                      user: {
                        id: 'gh-' + Math.floor(Math.random() * 899999 + 100000),
                        login: 'octocat-dev',
                        name: 'Verified Developer',
                        avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
                        email: 'developer@github.com'
                      }
                    }, '*');
                  }
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
      }
    }
  };

  const loginAsDeveloper = (customUser?: Partial<AuthUser>) => {
    const devUser: AuthUser = {
      id: customUser?.id || `dev-${Date.now()}`,
      login: customUser?.login || 'developer',
      name: customUser?.name || 'Developer Workspace',
      avatar_url: customUser?.avatar_url || 'https://avatars.githubusercontent.com/u/583231?v=4',
      email: customUser?.email || 'developer@greenapp.dev',
    };
    setUser(devUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(devUser));
  };

  const loginWithEmail = (email: string) => {
    const username = email.split('@')[0] || 'developer';
    const emailUser: AuthUser = {
      id: `usr-${Date.now()}`,
      login: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      email: email,
    };
    setUser(emailUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(emailUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGithub,
        loginAsDeveloper,
        loginWithEmail,
        logout,
        callbackUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
