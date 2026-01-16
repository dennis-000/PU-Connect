import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference || !user) {
      setStatus('failed');
      setMessage('Invalid payment reference');
      return;
    }

    verifyPayment(reference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: {
          reference,
          seller_id: user?.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');

        if (data.type === 'sms_topup') {
          setMessage(`Payment successful! ${data.units} SMS units have been added to your record.`);
          setTimeout(() => {
            navigate('/admin/sms');
          }, 3000);
        } else {
          setMessage('Payment successful! Your seller account is now active.');
          setTimeout(() => {
            navigate('/seller/dashboard');
          }, 3000);
        }
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support with your payment reference.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-20 relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-gradient-to-br from-blue-500/5 to-emerald-600/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 p-12 md:p-20 text-center w-full relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {status === 'verifying' && (
            <div className="relative z-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg">
                <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
                <i className="ri-shield-check-line text-blue-400"></i>
                Payment Verification
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Verifying <span className="text-blue-600">Payment.</span>
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] md:text-xs max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="relative z-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg">
                <i className="ri-check-double-line text-4xl text-emerald-600"></i>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
                <i className="ri-checkbox-circle-line"></i>
                Process Complete
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Payment <span className="text-emerald-600">Successful.</span>
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] md:text-xs max-w-sm mx-auto leading-relaxed mb-10">
                {message}
              </p>
              <div className="flex items-center justify-center gap-3 py-4 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                <i className="ri-refresh-line animate-spin text-blue-500"></i>
                Redirecting to dashboard...
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="relative z-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg">
                <i className="ri-close-circle-line text-4xl text-rose-600"></i>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
                <i className="ri-error-warning-line"></i>
                Verification Failed
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Payment <span className="text-rose-600">Issue.</span>
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] md:text-xs max-w-sm mx-auto leading-relaxed mb-10">
                {message}
              </p>
              <button
                onClick={() => navigate('/seller/become')}
                className="w-full px-10 py-5 bg-gray-900 text-white font-bold text-xs uppercase tracking-wide rounded-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <i className="ri-refresh-line text-lg"></i>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
