import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type SellerApplication, type Profile } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<(SellerApplication & { user: Profile })[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    sellers: 0,
    products: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    news: 0,
    messages: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
  const [processing, setProcessing] = useState<string | null>(null);


  useEffect(() => {
    // Only check access if not auth loading
    if (authLoading) return;

    if (!profile || profile.role !== 'admin') {
      navigate('/marketplace');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading]);

  const fetchData = async () => {
    setLoading(true);

    // Optimize: Use count queries and batch operations
    const [applicationsRes, usersRes, sellersRes, productsRes, newsRes, messagesRes] = await Promise.all([
      supabase
        .from('seller_applications')
        .select('*, user:profiles!user_id(id, full_name, email, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50), // Limit applications to most recent
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('campus_news').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
    ]);

    if (applicationsRes.data) {
      setApplications(applicationsRes.data as any);

      // Calculate stats from limited data + counts
      const pendingCount = applicationsRes.data.filter((a: any) => a.status === 'pending').length;
      const approvedCount = applicationsRes.data.filter((a: any) => a.status === 'approved').length;
      const rejectedCount = applicationsRes.data.filter((a: any) => a.status === 'rejected').length;

      setStats({
        users: usersRes.count || 0,
        sellers: sellersRes.count || 0,
        products: productsRes.count || 0,
        news: newsRes.count || 0,
        messages: messagesRes.count || 0,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: applicationsRes.count || applicationsRes.data.length,
      });
    }

    setLoading(false);
  };

  const handleApprove = async (applicationId: string, userId: string) => {
    const application = applications.find(app => app.id === applicationId);
    const phone = application?.contact_phone;

    try {
      // Update application status
      const { error: appError } = await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Check if seller profile already exists
      const { data: existingProfile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        // Create seller profile with pending payment status
        const { error: profileError } = await supabase
          .from('seller_profiles')
          .insert([
            {
              user_id: userId,
              subscription_status: 'inactive',
              payment_status: 'pending',
            }
          ]);

        if (profileError) throw profileError;
      }

      // Update user role to seller
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', userId);

      if (roleError) throw roleError;

      // Send Approval SMS
      if (phone) {
        try {
          const { sendSMS } = await import('../../lib/arkesel');
          await sendSMS([phone], `Congratulations! Your seller application for ${application.business_name} on PU Connect has been approved. You can now list your products on the marketplace.`);
        } catch (smsErr) {
          console.error('Failed to send approval SMS:', smsErr);
        }
      }

      alert('Application approved! User has been notified.');
      fetchData();
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessing(applicationId);
    try {
      await supabase
        .from('seller_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    }
    setProcessing(null);
  };

  const pendingApplicationsList = applications.filter((app) => app.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6">
              <i className="ri-shield-check-line text-blue-400"></i>
              System Administrator
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-none mb-4">Admin<br /><span className="text-gray-400 text-3xl md:text-5xl">Portal.</span></h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Welcome back, {profile?.full_name}</p>
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            <i className="ri-shopping-bag-line mr-2 text-xl"></i>
            Visit Marketplace
          </button>
        </div>

        {/* Admin Navigation - Scrollable on Mobile */}
        <div className="relative mb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {[
              { id: 'overview', label: 'Overview', icon: 'ri-dashboard-3-line' },
              { id: 'applications', label: 'Seller Requests', icon: 'ri-file-list-3-line', badge: pendingApplicationsList.length },
              { path: '/admin/users', label: 'Manage Users', icon: 'ri-group-line' },
              { path: '/admin/content', label: 'Site Content', icon: 'ri-layout-masonry-line' },
              { path: '/admin/news', label: 'Campus News', icon: 'ri-newspaper-line' },
              { path: '/admin/sms', label: 'SMS Blast', icon: 'ri-message-3-line' },
              { path: '/admin/messages', label: 'System Logs', icon: 'ri-chat-history-line' }
            ].map((item: any) => {
              const isActive = activeTab === item.id;
              const content = (
                <div className="flex items-center gap-3">
                  <i className={`${item.icon} text-lg`}></i>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-lg">
                      {item.badge}
                    </span>
                  )}
                </div>
              );

              if (item.id) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${isActive
                      ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                      : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                      }`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-6 py-4 bg-white text-gray-500 border border-gray-100 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap hover:bg-gray-50 flex items-center"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { label: 'Total Users', value: stats.users, icon: 'ri-group-line', color: 'blue', link: '/admin/users' },
                { label: 'Active Sellers', value: stats.sellers, icon: 'ri-store-3-line', color: 'indigo', action: () => setActiveTab('applications') },
                { label: 'Market Products', value: stats.products, icon: 'ri-shopping-bag-line', color: 'emerald', link: '/marketplace' },
                { label: 'News Articles', value: stats.news, icon: 'ri-newspaper-line', color: 'rose', link: '/admin/news' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <i className={`${stat.icon} text-2xl text-${stat.color}-600`}></i>
                    </div>
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
                  {stat.link ? (
                    <Link to={stat.link} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">
                      Manage System <i className="ri-arrow-right-line"></i>
                    </Link>
                  ) : (
                    <button onClick={stat.action} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all cursor-pointer">
                      Review Requests <i className="ri-arrow-right-line"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Campus News', desc: 'Broadcast official university updates', icon: 'ri-megaphone-line', path: '/admin/news', color: 'blue' },
                { title: 'SMS Blast', desc: 'Send direct notifications to students', icon: 'ri-mail-send-line', path: '/admin/sms', color: 'indigo' },
                { title: 'User Accounts', desc: 'Manage permissions and roles', icon: 'ri-shield-user-line', path: '/admin/users', color: 'emerald' }
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.path}
                  className="bg-gray-900 text-white p-8 rounded-[2rem] hover:bg-black transition-all group shadow-lg"
                >
                  <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <i className={`${action.icon} text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">{action.title}</h3>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest leading-relaxed">{action.desc}</p>
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-12 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Applications</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pending seller review requests</p>
                </div>
                <Link to="/admin/activity" className="px-6 py-2 bg-gray-50 text-gray-900 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-100">
                  System Logs
                </Link>
              </div>

              <div className="space-y-4">
                {pendingApplicationsList.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-50 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 font-bold text-gray-900 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {app.user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{app.user?.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all cursor-pointer"
                    >
                      Process Application
                    </button>
                  </div>
                ))}
                {pendingApplicationsList.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="ri-checkbox-circle-line text-3xl text-emerald-500"></i>
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">All applications processed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 md:p-12 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Queue</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vettng process for new marketplace sellers</p>
            </div>

            <div className="p-6 md:p-12">
              {loading ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading applications...</p>
                </div>
              ) : pendingApplicationsList.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <i className="ri-inbox-archive-line text-5xl text-gray-100 mb-8"></i>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">No Pending Requests</h3>
                  <p className="text-gray-400 font-semibold uppercase tracking-widest text-xs max-w-sm mx-auto leading-relaxed">All seller applications have been reviewed and processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {pendingApplicationsList.map((application) => (
                    <div
                      key={application.id}
                      className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 hover:shadow-lg transition-all relative group"
                    >
                      <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
                        <div className="flex items-start gap-6">
                          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-xl text-blue-600 border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {application.user?.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-1">
                              {application.user?.full_name}
                            </h3>
                            <p className="text-blue-600 text-xs font-semibold mb-2">{application.contact_email}</p>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <i className="ri-smartphone-line"></i>
                              {application.contact_phone}
                            </div>
                          </div>
                        </div>
                        <span className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-amber-50 text-amber-600">
                          Pending Review
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                        <div className="p-6 bg-gray-50/50 rounded-xl border border-gray-50">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Business Name</p>
                          <p className="text-lg font-bold text-gray-900">{application.business_name}</p>
                        </div>
                        <div className="p-6 bg-gray-50/50 rounded-xl border border-gray-50">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Category</p>
                          <p className="text-lg font-bold text-gray-900">{application.business_type}</p>
                        </div>
                      </div>

                      <div className="p-8 bg-blue-50/30 rounded-2xl border border-blue-100 mb-10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Business Description</p>
                        <p className="text-gray-700 font-medium leading-relaxed">{application.business_description}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handleApprove(application.id, application.user_id)}
                          disabled={processing === application.id}
                          className="flex-1 px-8 py-4 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                        >
                          {processing === application.id ? (
                            <i className="ri-loader-4-line animate-spin text-xl"></i>
                          ) : (
                            <>
                              <i className="ri-check-line text-xl"></i>
                              Approve Seller
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(application.id)}
                          disabled={processing === application.id}
                          className="flex-1 px-8 py-4 bg-white text-gray-900 border border-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {processing === application.id ? (
                            <i className="ri-loader-4-line animate-spin text-xl"></i>
                          ) : (
                            <>
                              <i className="ri-close-line text-xl"></i>
                              Reject Request
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
