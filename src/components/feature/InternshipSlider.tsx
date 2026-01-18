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
        <div className="w-full overflow-hidden">
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-hidden pb-4 px-6 lg:px-12 w-full select-none"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {displayInternships.map((job, index) => (
                    <a
                        key={`${job.id}-${index}`}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-none w-[320px] md:w-[400px] bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 hover:shadow-xl transition-all group cursor-pointer flex flex-col h-[280px]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center">
                                <img
                                    src={job.logo_url || "https://ui-avatars.com/api/?name=Job&background=random"}
                                    alt={job.company}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${job.source === 'Abroad'
                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                    {job.type}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {new Date(job.posted_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {job.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                            {job.company} • {job.location}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed flex-grow">
                            {job.description || "Exciting opportunity to join a leading team. Click to read more details and apply."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                {job.source === 'LinkedIn' && <i className="ri-linkedin-box-fill text-blue-700 text-base"></i>}
                                {job.source}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                Apply Now <i className="ri-arrow-right-line"></i>
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
