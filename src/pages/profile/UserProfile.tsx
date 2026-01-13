import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../../components/base/ImageUploader';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

export default function UserProfile() {
  // Destructure loading from useAuth
  const { profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    department: '',
    faculty: '',
    avatar_url: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        student_id: profile.student_id || '',
        department: profile.department || '',
        faculty: profile.faculty || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Handle Loading & Auth Redirect
  useEffect(() => {
    if (!authLoading && !profile) {
      // If finished loading and no profile, redirect to login
      // navigate('/login'); // Optional: redirects automatically
    }
  }, [authLoading, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          student_id: formData.student_id,
          department: formData.department,
          faculty: formData.faculty,
          avatar_url: formData.avatar_url,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-6 right-6 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center font-bold animate-slide-in';
      successMsg.innerHTML = '<i class="ri-checkbox-circle-fill mr-3 text-xl"></i>Profile updated successfully!';
      document.body.appendChild(successMsg);

      setTimeout(() => {
        successMsg.remove();
        setEditing(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;
      await refreshProfile();

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-6 right-6 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center font-bold animate-slide-in';
      successMsg.innerHTML = '<i class="ri-user-smile-fill mr-3 text-xl"></i>Avatar updated!';
      document.body.appendChild(successMsg);

      setTimeout(() => {
        successMsg.remove();
      }, 2000);
    } catch (error) {
      console.error('Error auto-saving avatar:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Loading User Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-user-unfollow-line text-3xl text-gray-400"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-8">We couldn't retrieve your profile information. Please try signing in again.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors uppercase tracking-wide text-xs"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-24">
        {/* Profile Explorer Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 md:mb-32">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 shadow-lg shadow-blue-500/20">
              <i className="ri-shield-user-fill"></i>
              Account ID: {profile.id.substring(0, 8).toUpperCase()}
            </div>
            <h1 className="text-5xl md:text-[6rem] font-bold text-gray-900 leading-[1] tracking-tight mb-8">
              Account<br /><span className="text-blue-600">Profile.</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
              OFFICIAL UNIVERSITY STUDENT RECORD
            </p>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className={`group px-10 py-5 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-4 active:scale-95 shadow-lg ${editing ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'
              }`}
          >
            <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
            <i className={editing ? 'ri-close-line text-xl' : 'ri-edit-line text-xl'}></i>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          {/* Visual Interface & Controls */}
          <div className="lg:col-span-4 space-y-12">
            <div className="relative">
              <div className="relative bg-white border border-gray-100 rounded-[2.5rem] p-4 shadow-xl overflow-hidden">
                <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner relative group/avatar">
                  {editing ? (
                    <ImageUploader
                      currentImage={formData.avatar_url}
                      onImageUploaded={handleAvatarUpload}
                      folder="profiles"
                      shape="square"
                      size="large"
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={getOptimizedImageUrl(profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400", 400, 85)}
                      alt={profile.full_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                    />
                  )}
                </div>

                <div className="mt-8 text-center pb-4">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">{profile.role} Account</span>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2 truncate px-4">{profile.full_name}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{profile.department || 'No Department Set'}</p>
                </div>
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-gray-50 rounded-3xl p-8 space-y-4 border border-gray-100">
              <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                <i className="ri-settings-4-line text-blue-600"></i>
                Account Settings
              </div>
              <button onClick={() => navigate('/seller/dashboard')} className="w-full flex items-center justify-between p-5 bg-white rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm group">
                <span className="font-bold text-[10px] uppercase tracking-widest">Seller Dashboard</span>
                <i className="ri-arrow-right-line text-lg group-hover:translate-x-1 transition-transform"></i>
              </button>
              <button onClick={handleSignOut} className="w-full flex items-center justify-between p-5 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all group">
                <span className="font-bold text-[10px] uppercase tracking-widest">Logout Account</span>
                <i className="ri-logout-box-r-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* Data Registry Form */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-16 h-full shadow-sm">
              <div className="flex items-center justify-between mb-16 px-2">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Profile Information.</h3>
                {editing && (
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Edit Mode Active</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-12 p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-700">
                  <i className="ri-error-warning-line text-2xl"></i>
                  <p className="font-semibold text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                  {[
                    { label: 'Full Name', key: 'full_name', value: formData.full_name, type: 'text', placeholder: 'Enter your full name' },
                    { label: 'Account Email', key: 'email', value: profile.email, type: 'email', disabled: true },
                    { label: 'Contact Number', key: 'phone', value: formData.phone, type: 'tel', placeholder: 'e.g. 05X XXX XXXX' },
                    { label: 'Academic Faculty', key: 'faculty', value: formData.faculty, type: 'text', placeholder: 'Enter your faculty' },
                    { label: 'Department', key: 'department', value: formData.department, type: 'text', placeholder: 'Enter your department' }
                  ].map((field) => (
                    <div key={field.key} className="relative group/field">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1 group-focus-within/field:text-blue-600 transition-colors">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        disabled={field.disabled || !editing}
                        value={field.value}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full bg-gray-50/50 border-b border-gray-100 py-3 focus:bg-white focus:border-blue-600 px-1 transition-all outline-none font-semibold text-lg disabled:opacity-50"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                {editing && (
                  <div className="pt-12">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-12 py-5 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-all font-bold text-xs md:text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-4 active:scale-95 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          SAVING...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line text-xl"></i>
                          Save Profile Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Global Engagement Grid */}
        <div className="mt-20 md:mt-32 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { label: 'Saved Products', value: 'Wishlist Items', icon: 'ri-heart-line', color: 'rose', path: '/profile#favorites' },
            { label: 'My Listings', value: 'Active Products', icon: 'ri-store-2-line', color: 'blue', path: '/seller/dashboard' },
            { label: 'Inbox', value: 'Recent Messages', icon: 'ri-chat-3-line', color: 'indigo', path: '/messages' }
          ].map((stat, i) => (
            <div key={i} onClick={() => stat.path !== '#' && navigate(stat.path)} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-md transition-all group overflow-hidden">
              <div className={`w-14 h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <i className={`${stat.icon} text-2xl`}></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
