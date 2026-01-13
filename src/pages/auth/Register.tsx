import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    department: '',
    faculty: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.studentId,
        formData.department,
        formData.faculty,
        formData.phone
      );

      navigate('/marketplace');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Visual Identity Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gray-900 relative items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20"></div>
        <div className="relative z-10 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-4 mb-16 group">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all shadow-2xl shadow-blue-500/30">
              <i className="ri-store-3-fill text-white text-3xl"></i>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">PU Connect.</span>
          </Link>
          <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-12">
            Campus<br /><span className="text-blue-500">Marketplace.</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-wide text-xs">
            The official student commerce platform
          </p>

          <div className="mt-20 grid grid-cols-2 gap-10">
            <div>
              <p className="text-3xl font-bold text-white mb-2">Secure.</p>
              <p className="text-gray-500 text-sm font-semibold">Verified university credentials.</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-2">Fast.</p>
              <p className="text-gray-500 text-sm font-semibold">Seamless campus trade.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Interface */}
      <div className="flex-1 flex items-center justify-center p-10 md:p-20 bg-white dark:bg-gray-950 overflow-y-auto transition-colors duration-300">
        <div className="max-w-md w-full">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">Register.</h2>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide text-[10px]">Create your PU Connect account</p>
          </div>

          {error && (
            <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-4 text-rose-700 dark:text-rose-300">
              <i className="ri-error-warning-fill text-2xl"></i>
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {[
                { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'Enter your full name' },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'name@example.com' },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '05X XXX XXXX' },
              ].map((field) => (
                <div key={field.key} className="relative group/field">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 ml-1">
                    {field.label}
                  </label>
                  <input
                    required
                    type={field.type}
                    value={(formData as any)[field.key]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-semibold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Password', key: 'password', type: 'password' },
                  { label: 'Confirm Password', key: 'confirmPassword', type: 'password' }
                ].map((field) => (
                  <div key={field.key} className="relative group/field">
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 ml-1">
                      {field.label}
                    </label>
                    <input
                      required
                      type={field.type}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-600/20 transition-all outline-none font-semibold text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                      placeholder="••••••"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl hover:bg-black dark:hover:bg-gray-200 transition-all font-bold text-xs uppercase tracking-wide shadow-xl disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  REGISTRATION...
                </>
              ) : (
                <>
                  <i className="ri-user-add-line text-xl"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-gray-50 dark:border-gray-800 pt-8">
            <p className="text-gray-400 dark:text-gray-500 font-bold text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors ml-2 font-bold uppercase tracking-wide">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}