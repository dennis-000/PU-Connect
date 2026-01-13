
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/feature/Navbar';

type Application = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  business_description: string;
  contact_phone: string;
  contact_email: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
    student_id: string;
  };
};

export default function SellerApplications() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchApplications();
  }, [profile, navigate]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            student_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: Application) => {
    if (!confirm(`Approve ${application.business_name}?`)) return;

    setProcessing(true);
    try {
      // Update application status
      const { error: appError } = await supabase
        .from('seller_applications')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (appError) throw appError;

      // Update user role to seller
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', application.user_id);

      if (profileError) throw profileError;

      // Create seller profile
      const { error: sellerError } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: application.user_id,
          business_name: application.business_name,
          business_category: application.business_category,
          business_description: application.business_description,
          contact_phone: application.contact_phone,
          contact_email: application.contact_email,
          subscription_status: 'inactive',
          is_active: true
        });

      if (sellerError && sellerError.code !== '23505') throw sellerError;

      alert('Application approved successfully!');
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert('Failed to approve application: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (application: Application) => {
    setSelectedApp(application);
    setRejectionReason('');
    setShowModal(true);
  };

  const submitRejection = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('seller_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      alert('Application rejected');
      setShowModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <i className="ri-file-list-3-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Applications</h1>
              <p className="text-gray-600">Review and manage seller applications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <i className="ri-file-list-line text-2xl text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <i className="ri-time-line text-2xl text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <i className="ri-close-circle-line text-2xl text-white"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl p-2 mb-6 border border-gray-100 shadow-sm inline-flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                filter === status
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {stats[status]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="ri-store-3-line text-2xl text-white"></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{app.business_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            app.status === 'approved' ? 'bg-green-100 text-green-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <i className="ri-user-line mr-1"></i>
                          {app.profiles?.full_name} ({app.profiles?.student_id})
                        </p>
                        <p className="text-sm text-gray-600">
                          <i className="ri-price-tag-3-line mr-1"></i>
                          {app.business_category}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{app.business_description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-phone-line text-teal-600"></i>
                        <span>{app.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-mail-line text-teal-600"></i>
                        <span>{app.contact_email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <i className="ri-calendar-line mr-1"></i>
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      {app.updated_at !== app.created_at && (
                        <span>
                          <i className="ri-refresh-line mr-1"></i>
                          Updated: {new Date(app.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {app.rejection_reason && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{app.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex flex-col gap-3 lg:w-48">
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={processing}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        <i className="ri-checkbox-circle-line text-lg"></i>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        disabled={processing}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        <i className="ri-close-circle-line text-lg"></i>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <i className="ri-close-circle-line text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reject Application</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting <strong>{selectedApp?.business_name}</strong>
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-2"
            />
            <p className="text-xs text-gray-500 mb-4">{rejectionReason.length}/500 characters</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApp(null);
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
