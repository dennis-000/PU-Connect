import { useRef, useEffect } from 'react';
import { useInternships, Internship } from '../../hooks/useInternships';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

export default function InternshipSlider() {
    const { data: internships = [], isLoading } = useInternships();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll functionality
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || internships.length === 0) return;

        let animationId: number;
        let scrollPos = 0;
        const speed = 0.5; // Pixels per frame

        const scroll = () => {
            if (!scrollContainer) return;

            scrollPos += speed;
            // Reset if we've scrolled past the first set of items (assuming we double the items for infinite loop)
            if (scrollPos >= scrollContainer.scrollWidth / 2) {
                scrollPos = 0;
            }

            scrollContainer.scrollLeft = scrollPos;
            animationId = requestAnimationFrame(scroll);
        };

        // Only auto-scroll if user is not hovering
        const startScroll = () => {
            cancelAnimationFrame(animationId);
            animationId = requestAnimationFrame(scroll);
        };

        const stopScroll = () => {
            cancelAnimationFrame(animationId);
        };

        scrollContainer.addEventListener('mouseenter', stopScroll);
        scrollContainer.addEventListener('mouseleave', startScroll);

        startScroll();

        return () => {
            cancelAnimationFrame(animationId);
            if (scrollContainer) {
                scrollContainer.removeEventListener('mouseenter', stopScroll);
                scrollContainer.removeEventListener('mouseleave', startScroll);
            }
        };
    }, [internships]);

    if (isLoading) return null;
    if (internships.length === 0) return null;

    // Duplicate items for infinite scroll effect
    const displayInternships = [...internships, ...internships];

    return (
        <section className="py-12 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-8 flex items-center justify-between">
                <div>
                    <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-2 block">Career Growth</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Internship <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Opportunities.</span>
                    </h2>
                </div>
                <div className="hidden md:flex gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Powered by LinkedIn & Partners</span>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-hidden pb-4 px-4 w-full select-none"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {displayInternships.map((job, index) => (
                    <a
                        key={`${job.id}-${index}`}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-none w-[300px] md:w-[350px] bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 hover:shadow-lg transition-all group cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <img
                                    src={job.logo_url || "https://ui-avatars.com/api/?name=Job&background=random"}
                                    alt={job.company}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${job.source === 'Abroad'
                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                {job.type}
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {job.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                            {job.company} • {job.location}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                {job.source === 'LinkedIn' && <i className="ri-linkedin-box-fill text-blue-700 text-sm"></i>}
                                {job.source}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                Apply Now <i className="ri-arrow-right-line"></i>
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
