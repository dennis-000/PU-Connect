import { useState, useMemo } from 'react';
import Navbar from '../../components/feature/Navbar';

import { useInternships } from '../../hooks/useInternships';

export default function Internships() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Fetch data using the hook
    const { data: internships = [], isLoading } = useInternships({ search: searchQuery });

    const filteredInternships = useMemo(() => {
        return internships.filter(internship => {
            // Search is already handled by the hook for the most part (via API),
            // but we double check local results or if hook implementation changes.
            // The hook fetches based on searchQuery, so we might receive relevant data already.
            // But if we want client-side filtering on top of it:
            return true; // We rely on the hook's search for the text query part mostly, 
            // but let's keep the client-side type filter.
        }).filter(internship => {
            const matchesFilter = filterType === 'All' ||
                (filterType === 'Abroad' && (internship.location.includes('Remote') || internship.source === 'Abroad')) ||
                (filterType === 'Local' && !internship.location.includes('Remote') && internship.source !== 'Abroad') ||
                (filterType === internship.type); // Allow filtering by 'Full-time' etc if we add those chips later
            return matchesFilter;
        });
    }, [internships, filterType]);

    const filters = [
        { id: 'All', label: 'All Jobs', icon: 'ri-briefcase-4-line' },
        { id: 'Local', label: 'Local', icon: 'ri-map-pin-user-line' },
        { id: 'Abroad', label: 'Remote / Abroad', icon: 'ri-earth-line' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar />

            {/* Mobile-First Header & Search */}
            <div className="pt-24 pb-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <i className="ri-briefcase-line text-blue-600"></i>
                        Career Market
                    </h1>

                    <div className="relative">
                        <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                        <input
                            type="text"
                            placeholder="Search internships, companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 rounded-xl px-12 py-3.5 font-medium transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <i className="ri-close-circle-fill"></i>
                            </button>
                        )}
                    </div>

                    {/* Horizontal Scrollable Filters */}
                    <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterType(filter.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide whitespace-nowrap transition-all border ${filterType === filter.id
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg transform scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <i className={`${filter.icon} text-sm`}></i>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 min-h-[60vh]">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Latest Opportunities
                        <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                            {filteredInternships.length}
                        </span>
                    </h2>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-2">
                                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInternships.map((job) => (
                            <div key={job.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all duration-300 group relative overflow-hidden">

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                        <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain rounded-lg" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-md">
                                            {job.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                                            {new Date(job.posted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {job.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                                    <i className="ri-building-line text-gray-400"></i>
                                    {job.company}
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-400 text-xs truncate max-w-[120px]">{job.location}</span>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        {job.source === 'LinkedIn' ? (
                                            <i className="ri-linkedin-fill text-blue-600 text-lg"></i>
                                        ) : (
                                            <i className="ri-global-line text-gray-400"></i>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {job.source}
                                        </span>
                                    </div>

                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="pl-4 pr-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-gray-200 transition-colors"
                                    >
                                        Apply
                                        <i className="ri-arrow-right-line"></i>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && filteredInternships.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <i className="ri-search-line text-3xl text-gray-400"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Try adjusting your filters or search for something else.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
