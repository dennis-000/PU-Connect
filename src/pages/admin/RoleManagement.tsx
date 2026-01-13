import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

export default function RoleManagement() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'publishers' | 'admins'>('publishers');
  const [showAddPublisherModal, setShowAddPublisherModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newPublisherEmail, setNewPublisherEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewsPublisher = async () => {
    if (!newPublisherEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newPublisherEmail.trim())
        .single();

      if (findError || !user) {
        alert('User not found with this email address');
        return;
      }

      if (user.role === 'news_publisher') {
        alert('This user is already a News Publisher');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'news_publisher' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchUsers();
      setShowAddPublisherModal(false);
      setNewPublisherEmail('');
      alert('News Publisher role assigned successfully!');
    } catch (error) {
      console.error('Error adding news publisher:', error);
      alert('Failed to assign News Publisher role');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newAdminEmail.trim())
        .single();

      if (findError || !user) {
        alert('User not found with this email address');
        return;
      }

      if (user.role === 'admin') {
        alert('This user is already an Administrator');
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to grant Administrator privileges to ${user.full_name}? This will give them full access to the admin dashboard.`
      );

      if (!confirmed) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchUsers();
      setShowAddAdminModal(false);
      setNewAdminEmail('');
      alert('Administrator role assigned successfully!');
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to assign Administrator role');
    }
  };

  const handleRemoveRole = async (userId: string, userName: string, currentRole: string) => {
    const roleDisplay = currentRole === 'admin' ? 'Administrator' : 'News Publisher';
    
    if (!confirm(`Remove ${roleDisplay} role from ${userName}? They will become a regular buyer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'buyer' })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('Role removed successfully');
    } catch (error) {
      console.error('Error removing role:', error);
      alert('Failed to remove role');
    }
  };

  const newsPublishers = users.filter(u => u.role === 'news_publisher');
  const admins = users.filter(u => u.role === 'admin');

  const filteredPublishers = newsPublishers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-sky-600 animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="mt-2 text-gray-600">Manage administrators and special permissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddPublisherModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-newspaper-line"></i>
              Add Publisher
            </button>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-shield-user-line"></i>
              Add Admin
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{admins.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="ri-shield-user-line text-2xl text-amber-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-sky-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">News Publishers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{newsPublishers.length}</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <i className="ri-newspaper-line text-2xl text-sky-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-user-line text-2xl text-green-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('admins')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'admins' 
                  ? 'bg-amber-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="ri-shield-user-line mr-2"></i>
              Administrators ({admins.length})
            </button>
            <button
              onClick={() => setActiveTab('publishers')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'publishers' 
                  ? 'bg-sky-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="ri-newspaper-line mr-2"></i>
              News Publishers ({newsPublishers.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab === 'admins' ? 'administrators' : 'news publishers'}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Administrators Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Administrators</h2>
              <p className="text-sm text-gray-600 mt-1">Users with full platform management access</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                          <i className="ri-shield-user-line mr-1"></i>
                          Administrator
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.id !== profile?.id ? (
                          <button
                            onClick={() => handleRemoveRole(user.id, user.full_name, user.role)}
                            className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                          >
                            Remove Role
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Current User</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAdmins.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-shield-user-line text-5xl text-gray-300"></i>
                <p className="mt-4 text-gray-500">No administrators found</p>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="mt-4 text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                >
                  Add your first administrator
                </button>
              </div>
            )}
          </div>
        )}

        {/* News Publishers Tab */}
        {activeTab === 'publishers' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">News Publishers</h2>
              <p className="text-sm text-gray-600 mt-1">Users with permission to publish campus news</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPublishers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-100 text-sky-800">
                          <i className="ri-newspaper-line mr-1"></i>
                          News Publisher
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveRole(user.id, user.full_name, user.role)}
                          className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                        >
                          Remove Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPublishers.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-newspaper-line text-5xl text-gray-300"></i>
                <p className="mt-4 text-gray-500">No news publishers found</p>
                <button
                  onClick={() => setShowAddPublisherModal(true)}
                  className="mt-4 text-sky-600 hover:text-sky-700 font-medium cursor-pointer"
                >
                  Add your first news publisher
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add News Publisher Modal */}
      {showAddPublisherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add News Publisher</h3>
              <button
                onClick={() => {
                  setShowAddPublisherModal(false);
                  setNewPublisherEmail('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Enter the email address of the user you want to assign the News Publisher role to.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                value={newPublisherEmail}
                onChange={(e) => setNewPublisherEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddPublisherModal(false);
                  setNewPublisherEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewsPublisher}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Add Publisher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Administrator</h3>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminEmail('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <i className="ri-alert-line text-amber-600 text-xl flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Important</p>
                    <p className="text-xs text-amber-800">
                      Administrators have full access to manage users, products, news, subscriptions, and all platform settings. Only grant this role to trusted users.
                    </p>
                  </div>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
