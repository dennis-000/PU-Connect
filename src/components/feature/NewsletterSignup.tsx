import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const { error } = await supabase
                .from('newsletter_subscribers')
                .insert([{ email }]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error('You are already subscribed!');
                }
                throw error;
            }

            setStatus('success');
            setMessage('Successfully subscribed via secure channel.');
            setEmail('');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to subscribe.');
        } finally {
            setTimeout(() => {
                if (status !== 'success') setStatus('idle'); // Keep success message visible longer or indefinitely until user types
            }, 3000);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubscribe} className="relative">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <i className="ri-mail-send-line text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (status !== 'loading') setStatus('idle');
                            }}
                            placeholder="Enter your email address"
                            required
                            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-gray-800/80 backdrop-blur-xl border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:ring-4 focus:ring-blue-500/30 outline-none transition-all shadow-lg shadow-gray-200/20 dark:shadow-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                        {status === 'loading' ? (
                            <i className="ri-loader-4-line animate-spin text-lg"></i>
                        ) : status === 'success' ? (
                            <>
                                <i className="ri-check-line text-lg"></i>
                                <span>Joined</span>
                            </>
                        ) : (
                            <>
                                <span>Subscribe</span>
                                <i className="ri-arrow-right-line text-lg"></i>
                            </>
                        )}
                    </button>
                </div>

                {/* Status Messages */}
                {status === 'error' && (
                    <div className="absolute -bottom-10 left-0 text-red-500 text-xs font-bold uppercase tracking-wide animate-in fade-in slide-in-from-top-2 ml-2 flex items-center gap-2">
                        <i className="ri-error-warning-fill"></i>
                        {message}
                    </div>
                )}
                {status === 'success' && (
                    <div className="absolute -bottom-10 left-0 text-emerald-500 text-xs font-bold uppercase tracking-wide animate-in fade-in slide-in-from-top-2 ml-2 flex items-center gap-2">
                        <i className="ri-checkbox-circle-fill"></i>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
}
