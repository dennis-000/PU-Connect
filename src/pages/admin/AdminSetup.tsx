import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

export default function AdminSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super_admin'>('admin');

  const makeAdmin = async () => {
    if (!user) {
      setMessage('You must be logged in');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      // If super_admin, also add to system_admins table
      if (selectedRole === 'super_admin') {
        await supabase.from('system_admins').insert({
          user_id: user.id,
          granted_by: user.id,
          is_active: true
        });
      }

      await refreshProfile();
      setMessage(`Success! You are now ${selectedRole === 'super_admin' ? 'a Super Admin' : 'an Admin'}. Redirecting...`);

      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-8 shadow-lg transition-colors duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="ri-shield-user-line text-white dark:text-gray-900 text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Setup</h1>
            <p className="text-slate-600 dark:text-gray-400">Grant yourself administrative access to manage the platform</p>
          </div>

          {profile && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-6 mb-6 border border-slate-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Your Current Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">Current Role:</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${profile.role === 'super_admin'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300'
                    : profile.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : profile.role === 'seller'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                    {profile.role === 'super_admin' ? 'Super Admin' : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-green-600 dark:text-green-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                You're Already {profile?.role === 'super_admin' ? 'a Super Admin' : 'an Admin'}!
              </h3>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                You have {profile?.role === 'super_admin' ? 'full system access with elevated privileges' : 'access to admin features'}
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer shadow-lg active:scale-95"
              >
                Go to Admin Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Select Admin Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRole('admin')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === 'admin'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500/50'
                      : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 bg-transparent'
                      }`}
                  >
                    <i className="ri-shield-line text-2xl text-purple-600 dark:text-purple-400 mb-2"></i>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Admin</h4>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">Standard admin access</p>
                  </button>
                  <button
                    onClick={() => setSelectedRole('super_admin')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === 'super_admin'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-500/50'
                      : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 bg-transparent'
                      }`}
                  >
                    <i className="ri-shield-star-line text-2xl text-purple-600 dark:text-purple-400 mb-2"></i>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Super Admin</h4>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">Full system control</p>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <i className="ri-information-line text-amber-600 dark:text-amber-500 text-xl flex-shrink-0 mt-0.5"></i>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">Important</h4>
                    <p className="text-sm text-amber-800 dark:text-amber-300/80">
                      {selectedRole === 'super_admin'
                        ? 'Super Admin has complete system control and can manage other admins. Only grant this to platform owners.'
                        : 'This will grant you administrator privileges. Only do this if you are authorized.'}
                    </p>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.includes('Success')
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <button
                onClick={makeAdmin}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:from-slate-800 hover:to-slate-600 dark:hover:from-gray-100 dark:hover:to-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shadow-lg active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className="ri-shield-check-line mr-2"></i>
                    Grant {selectedRole === 'super_admin' ? 'Super Admin' : 'Admin'} Access
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
