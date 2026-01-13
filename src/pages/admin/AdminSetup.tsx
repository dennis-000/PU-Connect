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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-user-line text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Setup</h1>
            <p className="text-slate-600">Grant yourself administrative access to manage the platform</p>
          </div>

          {profile && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Your Current Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-medium text-slate-900">{profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email:</span>
                  <span className="font-medium text-slate-900">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Role:</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    profile.role === 'super_admin'
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                      : profile.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700'
                      : profile.role === 'seller'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile.role === 'super_admin' ? 'Super Admin' : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-green-600 text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                You're Already {profile?.role === 'super_admin' ? 'a Super Admin' : 'an Admin'}!
              </h3>
              <p className="text-slate-600 mb-6">
                You have {profile?.role === 'super_admin' ? 'full system access with elevated privileges' : 'access to admin features'}
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Go to Admin Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Select Admin Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRole('admin')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <i className="ri-shield-line text-2xl text-purple-600 mb-2"></i>
                    <h4 className="font-semibold text-slate-900 text-sm">Admin</h4>
                    <p className="text-xs text-slate-600 mt-1">Standard admin access</p>
                  </button>
                  <button
                    onClick={() => setSelectedRole('super_admin')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedRole === 'super_admin'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <i className="ri-shield-star-line text-2xl text-purple-600 mb-2"></i>
                    <h4 className="font-semibold text-slate-900 text-sm">Super Admin</h4>
                    <p className="text-xs text-slate-600 mt-1">Full system control</p>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <i className="ri-information-line text-amber-600 text-xl flex-shrink-0 mt-0.5"></i>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">Important</h4>
                    <p className="text-sm text-amber-800">
                      {selectedRole === 'super_admin' 
                        ? 'Super Admin has complete system control and can manage other admins. Only grant this to platform owners.'
                        : 'This will grant you administrator privileges. Only do this if you are authorized.'}
                    </p>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl mb-6 ${
                  message.includes('Success') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <button
                onClick={makeAdmin}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-medium rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
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
