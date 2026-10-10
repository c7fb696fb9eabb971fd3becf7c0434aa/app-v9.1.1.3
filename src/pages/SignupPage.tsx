import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const SignupPage: React.FC = () => {
  const { user, loginWithGithub, loginAsDeveloper, loginWithEmail, callbackUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as any)?.from?.pathname;
  const destination = rawFrom && rawFrom !== '/' && rawFrom !== '' ? rawFrom : '/home';
  const [emailInput, setEmailInput] = useState('');
  const [showEmailField, setShowEmailField] = useState(false);
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

  const handleEmailSignup = (e: React.FormEvent) => {
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
    setToastMessage(`${provider} sign-up is coming soon. Please use GitHub or Dev Access.`);
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

      {/* Main Signup Card Shell */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-white/[0.08] bg-[#070a0e]/90 shadow-2xl shadow-black/80 backdrop-blur-md flex flex-col items-center text-center gap-6">
        {/* Brand Logo Header */}
        <Link to="/" className="hover:scale-105 transition-transform" aria-label="Home">
          <BrandLogo size={36} />
        </Link>

        {/* Vercel-Style Hero Headline */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Your first deploy is just a sign-up away.
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 font-sans">
            Create your account to start managing documentation decks.
          </p>
        </div>

        {/* Social Authentication Providers Stack */}
        <div className="w-full flex flex-col gap-2.5">
          {/* 1-Click Instant Developer Access */}
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

          {/* Continue with Apple (Coming Soon) */}
          <button
            type="button"
            onClick={() => handleComingSoon('Apple')}
            className="w-full h-11 px-4 rounded-md border border-white/[0.04] bg-[#070a0e]/60 hover:bg-[#0c121a]/40 text-slate-400 font-mono text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.14.65-2.81 1.43-.59.68-1.11 1.76-1.01 2.81 1.07.08 2.2-.62 2.81-1.37z" />
              </svg>
              <span>Continue with Apple</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </button>
        </div>

        {/* Email Form Section */}
        <div className="w-full flex flex-col gap-3">
          {showEmailField ? (
            <form onSubmit={handleEmailSignup} className="flex flex-col gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="developer@example.com"
                className="w-full h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e] text-slate-200 placeholder:text-slate-600 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                className="w-full h-9 rounded-md bg-[#0c121a] border border-white/[0.08] text-slate-300 font-mono text-xs hover:text-white cursor-pointer"
              >
                Sign Up with Email
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailField(true)}
              className="text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Continue with Email</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>

        {/* Terms of Service & Privacy Notice */}
        <p className="text-[11px] font-mono text-slate-500 leading-normal">
          By joining, you agree to our{' '}
          <span className="text-slate-400 hover:text-slate-300 cursor-pointer underline">Terms of Service</span> and{' '}
          <span className="text-slate-400 hover:text-slate-300 cursor-pointer underline">Privacy Policy</span>.
        </p>

        {/* Bottom Navigation Link */}
        <div className="pt-2 border-t border-white/[0.06] w-full flex flex-col items-center gap-2 text-xs font-mono text-slate-400">
          <div>
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-medium">
              Log In
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
