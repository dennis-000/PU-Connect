import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user already has an application
      const { data: application } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (application) {
        if (application.status === 'approved') {
          // Check payment status
          const { data: profile } = await supabase
            .from('seller_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (profile?.payment_status === 'pending') {
            navigate('/seller/payment');
          } else if (profile?.subscription_status === 'active') {
            navigate('/seller/dashboard');
          }
        } else if (application.status === 'pending') {
          alert('Your application is pending review');
          navigate('/');
        }
      } else {
        // No application, redirect to apply page
        navigate('/seller/apply');
      }
    };

    checkSellerStatus();
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing Status...</p>
      </div>
    </div>
  );
}
