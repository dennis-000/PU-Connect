import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/feature/Navbar';

export default function NewsPublisherDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        published: 0,
        drafts: 0,
        totalViews: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role !== 'news_publisher' && profile?.role !== 'admin') {
            navigate('/marketplace');
            return;
        }

        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    const fetchStats = async () => {
        if (!profile) return;
        setLoading(true);

        try {
            const { data: articles, error } = await supabase
                .from('campus_news')
                .select('is_published, views_count')
                .eq('author_id', profile.id);

            if (error) throw error;

            if (articles) {
                setStats({
                    published: articles.filter(a => a.is_published).length,
                    drafts: articles.filter(a => !a.is_published).length,
                    totalViews: articles.reduce((acc, curr) => acc + (curr.views_count || 0), 0)
                });
            }
        } catch (error) {
            console.error('Error fetching publisher stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
                            <i className="ri-newspaper-line"></i>
                            News Publisher
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-none mb-4">Content<br /><span className="text-indigo-600 text-3xl md:text-5xl">Portal.</span></h1>
                        <p className="text-gray-500 font-bold uppercase tracking-wide text-[10px] md:text-xs">Welcome back, {profile?.full_name}</p>
                    </div>
                    <Link
                        to="/admin/news"
                        className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95 text-xs uppercase tracking-wide"
                    >
                        <i className="ri-add-line mr-2 text-xl"></i>
                        Manage Articles
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {[
                        { label: 'Published News', value: stats.published, icon: 'ri-checkbox-circle-line', color: 'emerald' },
                        { label: 'Saved Drafts', value: stats.drafts, icon: 'ri-draft-line', color: 'amber' },
                        { label: 'Total Content Read', value: stats.totalViews.toLocaleString(), icon: 'ri-eye-line', color: 'blue' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <i className={`${stat.icon} text-2xl text-${stat.color}-600`}></i>
                                </div>
                                <span className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-4">{stat.label}</p>
                            <Link to="/admin/news" className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2 hover:translate-x-1 transition-all">
                                View All <i className="ri-arrow-right-line"></i>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link
                        to="/admin/news"
                        className="bg-gray-900 text-white p-10 rounded-[2.5rem] hover:bg-black transition-all group shadow-xl"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <i className="ri-add-box-line text-3xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 tracking-tight">Create New Article</h3>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide leading-relaxed">Broadcast official updates and campus stories</p>
                    </Link>

                    <Link
                        to="/news"
                        className="bg-white border border-gray-100 p-10 rounded-[2.5rem] hover:shadow-xl transition-all group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <i className="ri-external-link-line text-3xl text-indigo-600"></i>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 tracking-tight text-gray-900">View Public News</h3>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide leading-relaxed">See how your articles appear to the community</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
