import { useState, useMemo } from 'react';
import Navbar from '../../components/feature/Navbar';

import { useInternships } from '../../hooks/useInternships';

export default function Internships() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Fetch data using the hook
    const { data: internships = [], isLoading } = useInternships();

    const filteredInternships = useMemo(() => {
        return internships.filter(internship => {
            const matchesSearch = internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                internship.company.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'All' ||
                (filterType === 'Abroad' && (internship.location.includes('Remote') || internship.source === 'Abroad')) ||
                (filterType === 'Local' && !internship.location.includes('Remote') && internship.source !== 'Abroad');

            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, filterType, internships]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-900 z-0"></div>
                {/* Animated Orbs */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] opacity-40 animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-40 animate-blob animation-delay-2000 mix-blend-screen"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-full mb-8 shadow-lg animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Career Opportunities</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-none animate-fade-in-up delay-100 drop-shadow-2xl">
                        Find Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Future Career.</span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up delay-150">
                        Browse internships from top companies locally and abroad. Start your professional journey today.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative group animate-fade-in-up delay-200 z-20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                            <i className="ri-search-2-line text-2xl text-gray-400 ml-4 pointer-events-none"></i>
                            <input
                                type="text"
                                placeholder="Job title, company, or keywords..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-lg font-medium px-4 h-12 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 -mt-10 relative z-20">

                {/* Filters */}
                <div className="flex justify-center gap-4 mb-12">
                    {['All', 'Local', 'Abroad'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${filterType === type
                                ? 'bg-blue-600 text-white shadow-blue-500/30 scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Job Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInternships.map((job) => (
                        <div key={job.id} className="group relative bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1">

                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700">
                                    <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain rounded-xl" />
                                </div>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    {job.type}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <i className="ri-building-line text-blue-500"></i>
                                    {job.company}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mb-6">
                                <span className="flex items-center gap-1">
                                    <i className="ri-map-pin-line"></i>
                                    {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <i className="ri-time-line"></i>
                                    {new Date(job.posted_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    {job.source === 'LinkedIn' && <i className="ri-linkedin-fill text-blue-600 text-xl"></i>}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Via {job.source}</span>
                                </div>
                                <a
                                    href={job.url}
                                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-gray-200 transition-colors"
                                >
                                    Apply
                                </a>
                            </div>

                        </div>
                    ))}
                </div>

                {filteredInternships.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                            <i className="ri-briefcase-line text-3xl text-gray-400"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No internships found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
