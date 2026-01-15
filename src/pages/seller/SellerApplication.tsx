import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/feature/Navbar';
import ImageUploader from '../../components/base/ImageUploader';

export default function SellerApplication() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info', message: string } | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    contactPhone: '',
    whatsappNumber: '',
    contactEmail: user?.email || '',
    businessLogo: '',
  });

  const categories = [
    'Electronics',
    'Fashion & Clothing',
    'Books & Stationery',
    'Food & Beverages',
    'Accommodation',
    'Services',
    'Sports & Fitness',
    'Beauty & Personal Care',
    'Home & Living',
    'Other'
  ];

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize

    if (!user) {
      // Only redirect if absolutely sure user is not logged in and auth finished loading
      setNotification({ type: 'error', message: 'Please login to apply as a seller' });
      const t = setTimeout(() => navigate('/login'), 1500);
      return () => clearTimeout(t);
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Check if user is already a seller
    if (profile?.role === 'seller') {
      setNotification({ type: 'warning', message: 'You are already a seller! You cannot apply again.' });
      setTimeout(() => navigate('/seller/dashboard'), 2000);
      return;
    }

    setLoading(true);

    try {
      // Check if user already has an application
      const { data: existingApp } = await supabase
        .from('seller_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (existingApp) {
        if (existingApp.status === 'approved') {
          setNotification({ type: 'warning', message: 'You already have an active Seller Account. You are limited to one shop per user.' });
          setTimeout(() => navigate('/seller/dashboard'), 2000);
        } else if (existingApp.status === 'pending') {
          setNotification({ type: 'info', message: 'You already have a pending application. Please wait for admin approval.' });
          setTimeout(() => navigate('/seller/status'), 2000);
        } else {
          setNotification({ type: 'warning', message: 'You have a previous application. Please contact support.' });
        }
        setLoading(false);
        return;
      }

      // Submit new application
      const { error } = await supabase
        .from('seller_applications')
        .insert([
          {
            user_id: user.id,
            business_name: formData.businessName,
            business_category: formData.businessCategory,
            business_description: `${formData.businessDescription}\n\n[WhatsApp Contact: ${formData.whatsappNumber}]`,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            business_logo: formData.businessLogo,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      // Notify Admins
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('phone')
          .in('role', ['admin', 'super_admin'])
          .not('phone', 'is', null);

        if (admins && admins.length > 0) {
          const adminPhones = admins.map(a => a.phone).filter(p => p && p.length > 9);
          if (adminPhones.length > 0) {
            import('../../lib/arkesel').then(({ sendSMS }) => {
              const uniquePhones = [...new Set(adminPhones)];
              sendSMS(uniquePhones, `New Seller Application: ${formData.businessName} has applied to become a seller. Please check the Admin Portal for review.`)
                .catch(err => console.error('Failed to notify admins:', err));
            });
          }
        }
      } catch (notifyError) {
        console.error('Error fetching admins for notification:', notifyError);
      }


      setNotification({ type: 'success', message: '✅ Application submitted successfully! Redirecting to status page...' });
      setTimeout(() => navigate('/seller/status'), 2000);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to submit application. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-bold backdrop-blur-xl border max-w-md ${notification.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50' :
            notification.type === 'error' ? 'bg-rose-600/90 border-rose-500/50' :
              notification.type === 'warning' ? 'bg-amber-600/90 border-amber-500/50' :
                'bg-blue-600/90 border-blue-500/50'
            }`}>
            <i className={`text-2xl ${notification.type === 'success' ? 'ri-checkbox-circle-line' :
              notification.type === 'error' ? 'ri-error-warning-line' :
                notification.type === 'warning' ? 'ri-alert-line' :
                  'ri-information-line'
              }`}></i>
            <p className="flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="hover:opacity-70 transition-opacity">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
              <i className="ri-medal-line text-blue-400 dark:text-blue-600"></i>
              Seller Registration
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">Start Your<br /><span className="text-blue-600">Business.</span></h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Join the PU Connect official student marketplace</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-[10px] font-bold text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 group"
          >
            <i className="ri-arrow-left-s-line text-lg group-hover:-translate-x-1 transition-transform"></i>
            Cancel Application
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Information Section */}
          <div className="lg:col-span-4 space-y-8 animate-fade-in-up delay-100">
            <div className="bg-gray-900 dark:bg-gray-800 text-white p-8 rounded-[2rem] shadow-xl shadow-gray-900/10 dark:shadow-none transition-colors">
              <h3 className="text-xl font-bold mb-8 tracking-tight flex items-center gap-3">
                <i className="ri-information-line text-blue-400"></i>
                Program Details
              </h3>
              <ul className="space-y-6">
                {[
                  { label: 'Registration Fee', value: 'GH₵ 50 / Mo', desc: 'Secure platform listing rights' },
                  { label: 'Validity Period', value: '30 Days', desc: 'Renewable monthly cycle' },
                  { label: 'Review Time', value: '24 Hours', desc: 'Application processing time' },
                  { label: 'Verification', value: 'Required', desc: 'Official student status' }
                ].map((item, i) => (
                  <li key={i} className="group">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">{item.label}</p>
                    <p className="text-lg font-bold tracking-tight mb-1">{item.value}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border border-blue-100/50 dark:border-blue-800/30 transition-colors">
              <i className="ri-shield-check-fill text-3xl text-blue-600 dark:text-blue-400 mb-4 block"></i>
              <p className="text-sm font-bold text-blue-950 dark:text-blue-200 uppercase tracking-widest mb-2">Data Protection</p>
              <p className="text-xs font-semibold text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Your business information is securely stored and synchronized across the PU Connect marketplace ecosystem.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-8 animate-slide-in-right delay-200">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 md:p-12 transition-colors duration-300">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 flex-shrink-0">
                      <ImageUploader
                        folder="profiles"
                        onImageUploaded={(url) => setFormData({ ...formData, businessLogo: url })}
                        className="w-full h-full rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Upload Logo</p>
                      <p className="text-xs text-gray-500">Recommended size: 500x500px. <br /> Supports JPG, PNG.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                      placeholder="e.g. Trendy Campus Gear"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Business Category
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.businessCategory}
                        onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <i className="ri-arrow-down-s-line absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Business Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all resize-none"
                    placeholder="Provide a detailed description of your products or services..."
                    maxLength={500}
                  />
                  <div className="flex justify-end pr-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{formData.businessDescription.length}/500</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Call Number
                    </label>
                    <div className="relative group">
                      <i className="ri-phone-line absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
                      <input
                        type="tel"
                        required
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                        placeholder="054 123 4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      WhatsApp Number
                    </label>
                    <div className="relative group">
                      <i className="ri-whatsapp-line absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                      <input
                        type="tel"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 font-semibold outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                        placeholder="054 123 4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Contact Email
                  </label>
                  <div className="relative group">
                    <i className="ri-mail-line absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-600/20 font-semibold outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-8 py-5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {loading ? (
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <i className="ri-check-line text-lg"></i>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            Already registered?
          </p>
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="inline-flex items-center gap-2 group text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Access Seller Dashboard
            <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
