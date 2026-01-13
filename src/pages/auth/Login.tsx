
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await signIn(email, password);

      // Fetch profile to determine role-based redirect
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'news_publisher') {
          navigate('/publisher');
        } else if (profile?.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/marketplace');
        }
      } else {
        navigate('/marketplace');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetMessage({
        type: 'success',
        text: 'Password reset link has been sent to your email. Please check your inbox.',
      });
      setResetEmail('');
    } catch (err: any) {
      setResetMessage({
        type: 'error',
        text: err.message || 'Failed to send reset email',
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex flex-col items-center gap-4 mb-8 group">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <i className="ri-shield-keyhole-line text-white text-3xl"></i>
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight uppercase">PU<span className="text-blue-600">Connect</span></span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Reset Password.</h2>
            <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px]">Provide your registered email address</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 p-8 md:p-10">
            {resetMessage && (
              <div className={`mb-8 p-6 rounded-2xl flex items-start gap-4 ${resetMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-rose-50 border border-rose-100'
                }`}>
                <i className={`${resetMessage.type === 'success'
                  ? 'ri-checkbox-circle-fill text-emerald-600'
                  : 'ri-error-warning-fill text-rose-600'
                  } text-2xl`}></i>
                <p className={`text-sm font-bold leading-relaxed ${resetMessage.type === 'success' ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                  {resetMessage.text}
                </p>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="resetEmail" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <i className="ri-mail-send-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {resetLoading ? (
                  <i className="ri-loader-4-line animate-spin text-xl"></i>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage(null);
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                <i className="ri-arrow-left-s-line text-lg"></i>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center gap-4 mb-8 group">
            <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <i className="ri-store-3-line text-white dark:text-gray-900 text-3xl"></i>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">PU<span className="text-blue-600">Connect</span></span>
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">Welcome Back.</h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide text-[10px]">Secure login for PU Connect</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 md:p-12 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

          {error && (
            <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <i className="ri-error-warning-fill text-rose-600 dark:text-rose-400 text-2xl"></i>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide ml-1">
                Email Address
              </label>
              <div className="relative group">
                <i className="ri-mail-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors text-xl"></i>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white transition-all placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Secure Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wide"
                >
                  Forgot Key?
                </button>
              </div>
              <div className="relative group">
                <i className="ri-lock-password-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors text-xl"></i>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white transition-all placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl hover:bg-black dark:hover:bg-gray-200 transition-all font-bold text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-xl"></i>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="ri-login-box-line"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 dark:border-gray-800 text-center">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">New to the platform?</p>
            <Link
              to="/signup" // NOTE: This should technically be /register but keeping consistent with existing component unless it's wrong. Actually existing used /signup but routes say /register? Wait.
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wide transition-colors group"
            >
              Join the Network
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-wide transition-colors"
          >
            ← Back to Campus Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
