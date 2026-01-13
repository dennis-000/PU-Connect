
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type Application = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  business_name: string;
  business_category: string;
  business_description: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
};

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchApplication();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('application-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seller_applications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setApplication(payload.new as Application);
          if (payload.new.status === 'approved') {
            refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchApplication = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No application found
          navigate('/seller/apply');
          return;
        }
        throw error;
      }

      setApplication(data);

      // If approved and user role is still 'buyer', update to 'seller'
      if (data.status === 'approved' && profile?.role === 'buyer') {
        await updateUserRole();
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile to get updated role
      await refreshProfile();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
            <i className="ri-file-search-line text-6xl text-gray-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h2>
            <p className="text-gray-600 mb-6">You haven't submitted a seller application yet.</p>
            <button
              onClick={() => navigate('/seller/apply')}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-medium whitespace-nowrap cursor-pointer shadow-md"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
      case 'rejected':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
      default:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'ri-checkbox-circle-line';
      case 'rejected':
        return 'ri-close-circle-line';
      default:
        return 'ri-time-line';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Under Review',
          message: 'Your application is being reviewed by our admin team. We\'ll notify you once a decision is made.',
          icon: 'ri-hourglass-line',
        };
      case 'approved':
        return {
          title: 'Congratulations!',
          message: 'Your application has been approved! You can now start selling your products on our platform.',
          icon: 'ri-trophy-line',
        };
      case 'rejected':
        return {
          title: 'Application Not Approved',
          message: 'Unfortunately, your application was not approved at this time. Please review the reason below.',
          icon: 'ri-error-warning-line',
        };
    }
  };

  const statusInfo = getStatusMessage(application.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
              <i className="ri-radar-line text-blue-400"></i>
              Application Review
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">Registry<br /><span className="text-blue-600">Status.</span></h1>
            <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] md:text-xs">Official verification process status</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 group"
          >
            <i className="ri-home-4-line text-lg"></i>
            Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Status Overview */}
          <div className="lg:col-span-5">
            <div className={`p-10 rounded-[2.5rem] border shadow-xl transition-all ${application.status === 'approved' ? 'bg-emerald-50 border-emerald-100 shadow-emerald-500/5' :
              application.status === 'rejected' ? 'bg-rose-50 border-rose-100 shadow-rose-500/5' :
                'bg-blue-50 border-blue-100 shadow-blue-500/5'
              }`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-transform hover:scale-105 ${application.status === 'approved' ? 'bg-emerald-600 text-white' :
                  application.status === 'rejected' ? 'bg-rose-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                  <i className={`${getStatusIcon(application.status)} text-4xl`}></i>
                </div>

                <h2 className={`text-2xl font-bold tracking-tight mb-4 ${application.status === 'approved' ? 'text-emerald-900' :
                  application.status === 'rejected' ? 'text-rose-900' :
                    'text-blue-900'
                  }`}>
                  {statusInfo.title}
                </h2>

                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-8 border ${application.status === 'approved' ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700' :
                  application.status === 'rejected' ? 'bg-rose-100/50 border-rose-200 text-rose-700' :
                    'bg-blue-100/50 border-blue-200 text-blue-700'
                  }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {application.status}
                </div>

                <p className={`text-sm font-semibold leading-relaxed mb-10 ${application.status === 'approved' ? 'text-emerald-800' :
                  application.status === 'rejected' ? 'text-rose-800' :
                    'text-blue-800'
                  }`}>
                  {statusInfo.message}
                </p>

                {application.status === 'approved' ? (
                  <button
                    onClick={() => navigate('/seller/dashboard')}
                    className="w-full py-5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wide rounded-2xl hover:bg-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <span>Go to Dashboard</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                ) : application.status === 'rejected' ? (
                  <button
                    onClick={() => navigate('/seller/apply')}
                    className="w-full py-5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wide rounded-2xl hover:bg-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <span>Update Application</span>
                    <i className="ri-refresh-line"></i>
                  </button>
                ) : (
                  <div className="w-full py-5 bg-white/50 border border-blue-200 text-blue-900 font-bold text-[10px] uppercase tracking-wide rounded-2xl flex items-center justify-center gap-3">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Awaiting Verification
                  </div>
                )}
              </div>
            </div>

            {application.rejection_reason && (
              <div className="mt-8 p-8 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wide mb-3">Admin Comments</p>
                <p className="text-rose-900 font-semibold leading-relaxed italic">"{application.rejection_reason}"</p>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">Business Name</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">{application.business_name}</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">Category</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">{application.business_category}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">Business Description</p>
              <p className="text-gray-600 font-semibold leading-relaxed">{application.business_description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">Phone Number</p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">{application.contact_phone}</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">Email Address</p>
                <p className="text-sm font-bold text-blue-600 tracking-tight break-all">{application.contact_email}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <i className="ri-calendar-check-line text-blue-600"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Submission Date</p>
                  <p className="text-xs font-bold text-gray-900">
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Verified Record</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
