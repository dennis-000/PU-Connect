import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

type Subscriber = {
    id: string;
    email: string;
    is_active: boolean;
    created_at: string;
};

export default function NewsletterManagement() {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            navigate('/');
        }
    }, [profile, authLoading, navigate]);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const { data, error } = await supabase
                .from('newsletter_subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubscribers(data || []);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            setNotification({ type: 'error', message: 'Failed to load subscribers' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to remove ${email} from the newsletter list?`)) return;

        try {
            const { error } = await supabase
                .from('newsletter_subscriptions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotification({ type: 'success', message: 'Subscriber removed' });
            fetchSubscribers();
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            setNotification({ type: 'error', message: 'Failed to remove subscriber' });
        }
    };

    const handleExport = () => {
        // Create CSV content
        const csvContent = [
            ['ID', 'Email', 'Joined Date', 'Status'],
            ...subscribers.map(sub => [
                sub.id,
                sub.email,
                new Date(sub.created_at).toLocaleDateString(),
                sub.is_active ? 'Active' : 'Inactive'
            ])
        ].map(e => e.join(",")).join("\n");

        // Create blob link to download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20 font-sans">
            <Navbar />

            {/* Floating Notification */}
            {notification && (
                <div className={`fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-right-8 duration-300 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' : 'bg-rose-500/90 border-rose-400/50 text-white'}`}>
                    <i className={`${notification.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} text-xl`}></i>
                    <span className="font-bold text-sm tracking-wide">{notification.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-800 mb-4 inline-block">
                            Marketing
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                            Newsletter<br />
                            <span className="text-blue-600">Subscribers.</span>
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="px-6 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <i className="ri-download-line text-lg"></i>
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading List...</p>
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="ri-mail-open-line text-3xl text-gray-400"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Subscribers Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Your newsletter list is currently empty.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined Date</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {subscribers.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-blue-500/20">
                                                        {sub.email.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{sub.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {new Date(sub.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 flex w-fit items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleDelete(sub.id, sub.email)}
                                                    className="w-8 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-rose-200 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors flex items-center justify-center shadow-sm"
                                                    title="Remove subscriber"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
