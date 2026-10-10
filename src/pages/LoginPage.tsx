import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const { user, loginWithGithub, loginAsDeveloper, loginWithEmail, callbackUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as any)?.from?.pathname;
  const destination = rawFrom && rawFrom !== '/' && rawFrom !== '' ? rawFrom : '/home';
  const [emailInput, setEmailInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If already logged in, redirect straight to intended destination
  useEffect(() => {
    if (user) {
      navigate(destination, { replace: true });
    }
  }, [user, navigate, destination]);

  const handleGithubClick = async () => {
    try {
      await loginWithGithub(destination);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDevLogin = () => {
    loginAsDeveloper();
    navigate(destination, { replace: true });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setToastMessage('Please enter a valid email address.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    loginWithEmail(emailInput.trim());
    navigate(destination, { replace: true });
  };

  const handleComingSoon = (provider: string) => {
    setToastMessage(`${provider} authentication is coming soon. Please sign in with GitHub or Dev Access.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 bg-[#0c121a]/95 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-md shadow-lg font-mono text-xs flex items-center gap-2 animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Main Login Card Shell */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#070a0e]/90 shadow-2xl shadow-black/80 backdrop-blur-md flex flex-col items-center text-center gap-6">
        {/* Brand Logo Header */}
        <Link to="/" className="hover:scale-105 transition-transform" aria-label="Home">
          <BrandLogo size={36} />
        </Link>

        {/* Vercel-Style Hero Headline */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Log in to Green App
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 font-sans">
            Enter your email or continue with GitHub to access your workspace.
          </p>
        </div>

        {/* Email Address Section */}
        <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-2.5 text-left">
          <label htmlFor="email" className="sr-only">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="developer@example.com"
            className="w-full h-11 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e] text-slate-200 placeholder:text-slate-500 font-mono text-xs sm:text-[13px] focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            className="w-full h-11 rounded-md border border-white/[0.08] bg-[#0c121a]/90 hover:bg-[#111924] text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-medium flex items-center justify-center transition-colors cursor-pointer"
          >
            Continue with Email
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Social & Direct Authentication Providers Stack */}
        <div className="w-full flex flex-col gap-2.5">
          {/* 1-Click Instant Preview Developer Login */}
          <button
            type="button"
            onClick={handleDevLogin}
            className="w-full h-11 px-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 font-mono text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-emerald-400"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Instant Developer Access (1-Click)</span>
          </button>

          {/* Active: Continue with GitHub */}
          <button
            type="button"
            onClick={handleGithubClick}
            className="w-full h-11 px-4 rounded-md border border-white/[0.08] bg-[#0c121a]/90 hover:border-emerald-500/40 hover:bg-[#111924] text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-sm group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-white group-hover:text-emerald-400 transition-colors"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>

          {/* Continue with Google (Coming Soon) */}
          <button
            type="button"
            onClick={() => handleComingSoon('Google')}
            className="w-full h-11 px-4 rounded-md border border-white/[0.04] bg-[#070a0e]/60 hover:bg-[#0c121a]/40 text-slate-400 font-mono text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              <span>Continue with Google</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </button>

          {/* Continue with ChatGPT (Coming Soon) */}
          <button
            type="button"
            onClick={() => handleComingSoon('ChatGPT')}
            className="w-full h-11 px-4 rounded-md border border-white/[0.04] bg-[#070a0e]/60 hover:bg-[#0c121a]/40 text-slate-400 font-mono text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Continue with ChatGPT</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </button>

          {/* Continue with SAML SSO (Coming Soon) */}
          <button
            type="button"
            onClick={() => handleComingSoon('SAML SSO')}
            className="w-full h-11 px-4 rounded-md border border-white/[0.04] bg-[#070a0e]/60 hover:bg-[#0c121a]/40 text-slate-400 font-mono text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Continue with SAML SSO</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </button>

          {/* Continue with Passkey (Coming Soon) */}
          <button
            type="button"
            onClick={() => handleComingSoon('Passkey')}
            className="w-full h-11 px-4 rounded-md border border-white/[0.04] bg-[#070a0e]/60 hover:bg-[#0c121a]/40 text-slate-400 font-mono text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
                <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9" />
                <circle cx="7.5" cy="15.5" r="5.5" />
              </svg>
              <span>Continue with Passkey</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </button>
        </div>

        {/* Bottom Navigation Link */}
        <div className="pt-2 border-t border-white/[0.06] w-full flex flex-col items-center gap-2 text-xs font-mono text-slate-400">
          <div>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-emerald-400 hover:underline font-medium">
              Sign Up
            </Link>
          </div>
          <div className="w-full text-[10px] text-slate-500 bg-white/[0.02] border border-white/[0.05] rounded p-2 text-left break-all font-mono">
            <span className="text-emerald-400 font-semibold">GitHub OAuth Callback URL:</span>
            <br />
            {callbackUrl}
          </div>
        </div>
      </div>
    </div>
  );
};
