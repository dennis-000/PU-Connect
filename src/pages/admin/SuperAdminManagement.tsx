import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type SystemAdmin = {
  id: string;
  user_id: string;
  granted_at: string;
  is_active: boolean;
  profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};

export default function SuperAdminManagement() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<SystemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (profile?.role !== 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, navigate]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('system_admins')
        .select(`
          *,
          profile:profiles!system_admins_user_id_fkey(full_name, email, avatar_url)
        `)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      showMessage('Failed to load admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const grantSuperAdmin = async () => {
    if (!searchEmail.trim()) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const { data: userProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', searchEmail.trim())
        .single();

      if (findError || !userProfile) {
        showMessage('User not found with this email', 'error');
        setLoading(false);
        return;
      }

      // Update user role to super_admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Add to system_admins table
      const { error: insertError } = await supabase
        .from('system_admins')
        .insert({
          user_id: userProfile.id,
          granted_by: profile?.id,
          is_active: true
        });

      if (insertError) throw insertError;

      showMessage(`Successfully granted super admin access to ${userProfile.full_name}`, 'success');
      setSearchEmail('');
      fetchAdmins();
    } catch (error: any) {
      console.error('Error granting super admin:', error);
      showMessage(error.message || 'Failed to grant super admin access', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('system_admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);

      if (error) throw error;

      showMessage(`Admin status ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchAdmins();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      showMessage('Failed to update admin status', 'error');
    }
  };

  if (profile?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <i className="ri-shield-star-line text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Super Admin Management</h1>
              <p className="text-slate-600 text-sm">Manage system administrators with full access</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <i className={`${messageType === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} text-lg`}></i>
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Grant Super Admin */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <i className="ri-user-add-line mr-2 text-purple-600"></i>
            Grant Super Admin Access
          </h2>
          <div className="flex space-x-3">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter user email address"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={grantSuperAdmin}
              disabled={loading || !searchEmail.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <i className="ri-shield-check-line mr-2"></i>
              Grant Access
            </button>
          </div>
        </div>

        {/* Super Admins List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <i className="ri-shield-user-line mr-2 text-purple-600"></i>
              System Administrators ({admins.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <i className="ri-loader-4-line text-4xl text-slate-400 animate-spin"></i>
              <p className="text-slate-600 mt-4">Loading administrators...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center">
              <i className="ri-shield-user-line text-6xl text-slate-300"></i>
              <p className="text-slate-600 mt-4">No super admins found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {admins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        {admin.profile?.avatar_url ? (
                          <img
                            src={admin.profile.avatar_url}
                            alt={admin.profile.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {admin.profile?.full_name?.charAt(0) || 'A'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{admin.profile?.full_name || 'Unknown'}</h3>
                        <p className="text-sm text-slate-600">{admin.profile?.email || 'No email'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Granted: {new Date(admin.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        admin.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          admin.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {admin.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
