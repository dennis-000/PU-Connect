import { useRef, useEffect, useState } from 'react';
import { useInternships } from '../../hooks/useInternships';

export default function InternshipSlider() {
    const { data: internships = [], isLoading } = useInternships();
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (internships.length > 0) {
            setShouldAnimate(true);
        }
    }, [internships]);

    if (isLoading) return (
        <div className="w-full flex gap-6 overflow-hidden py-4 px-6 opacity-50">
            {[1, 2, 3, 4].map(i => <div key={i} className="flex-none w-[350px] h-[250px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
    );

    if (internships.length === 0) return null;

    // Create a large enough set of items to scroll smoothly
    // If we have few items, triple them. If many, double them.
    const repeatedInternships = internships.length < 5
        ? [...internships, ...internships, ...internships, ...internships]
        : [...internships, ...internships];

    return (
        <div className="w-full overflow-hidden bg-white dark:bg-gray-950 py-8 relative group">

            {/* Gradient Masks - Adjusted for mobile */}
            <div className="absolute top-0 left-0 h-full w-8 md:w-24 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 h-full w-8 md:w-24 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-20 pointer-events-none"></div>

            <div
                className={`flex gap-4 md:gap-6 w-max ${shouldAnimate ? 'animate-marquee' : ''} group-hover:[animation-play-state:paused]`}
                onMouseEnter={() => { }}
            >
                {repeatedInternships.map((job, index) => (
                    <a
                        key={`${job.id}-${index}`}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-none w-[280px] sm:w-[320px] md:w-[400px] bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] p-5 md:p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.1)] transition-all duration-300 group/card cursor-pointer flex flex-col h-[240px] md:h-[260px] relative overflow-hidden"
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-br from-blue-50/50 dark:from-blue-900/10 to-transparent rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center group-hover/card:scale-110 transition-transform">
                                <img
                                    src={job.logo_url || "https://ui-avatars.com/api/?name=Job&background=random"}
                                    alt={job.company}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 md:px-3 py-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full border border-transparent ${job.source === 'Abroad'
                                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300'
                                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                                    } group-hover/card:border-current transition-colors`}>
                                    {job.type}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg mb-1 line-clamp-1 group-hover/card:text-blue-600 transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 line-clamp-1">
                                {job.company} • {job.location}
                            </p>

                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
                                {job.description || "Exciting opportunity to join a leading team. Click to read more details and apply."}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-50 dark:border-gray-800 mt-auto relative z-10">
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                {job.source === 'LinkedIn' ? <i className="ri-linkedin-fill text-blue-600 text-sm"></i> : <i className="ri-briefcase-4-line text-sm"></i>}
                                {job.source}
                            </span>
                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white group-hover/card:bg-blue-600 group-hover/card:text-white transition-all shadow-sm">
                                <i className="ri-arrow-right-line"></i>
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
