import { useState, useEffect } from 'react';
import Navbar from '../../components/feature/Navbar';
import ImageUploader from '../../components/base/ImageUploader';
import { supabase } from '../../lib/supabase';
import { CONTENT_KEYS } from '../../hooks/useSiteContent';

// Define the shape of our config
interface SiteConfig {
    [key: string]: string;
}

interface ContentItem {
    label: string;
    key: string;
    type: 'image' | 'text';
    placeholder?: string;
}

interface ContentSection {
    title: string;
    description: string;
    items: ContentItem[];
}

export default function ContentManagement() {
    const [activeTab, setActiveTab] = useState('images');
    const [config, setConfig] = useState<SiteConfig>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch current config from Storage (site_config.json)
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase.storage
                .from('uploads')
                .download('site_config.json');

            if (error) {
                console.warn('No config found or error:', error.message);
                // If not found, ignore (use defaults)
                setLoading(false);
                return;
            }

            if (data) {
                const text = await data.text();
                setConfig(JSON.parse(text));
            }
        } catch (err) {
            console.error('Error fetching config:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (key: string, value: string) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        // Auto-save to cloud
        setSaving(true);
        try {
            const blob = new Blob([JSON.stringify(newConfig)], { type: 'application/json' });
            const { error } = await supabase.storage
                .from('uploads')
                .upload('site_config.json', blob, {
                    contentType: 'application/json',
                    upsert: true
                });

            if (error) throw error;

            // Also update localStorage for immediate local feedback
            localStorage.setItem(`site_content_${key}`, value);

        } catch (err) {
            console.error('Failed to save config:', err);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const imageSections: ContentSection[] = [
        {
            title: 'Home Page Hero',
            description: 'The main slider images visible on the landing page.',
            items: [
                { label: 'Main Hero Image', key: CONTENT_KEYS.HOME_HERO_MAIN, type: 'image' },
                { label: 'Secondary/Aerial Image', key: CONTENT_KEYS.HOME_HERO_AERIAL, type: 'image' },
            ]
        },
        {
            title: 'Section Banners',
            description: 'Header images for specific site sections.',
            items: [
                { label: 'Marketplace Header', key: CONTENT_KEYS.MARKETPLACE_BANNER, type: 'image' },
                { label: 'Campus News Header', key: CONTENT_KEYS.NEWS_BANNER, type: 'image' },
            ]
        }
    ];

    const textSections: ContentSection[] = [
        {
            title: 'Vital Announcements',
            description: 'Important text displayed on the home page.',
            items: [
                { label: 'Announcement 1', key: 'home_announcement_1', type: 'text', placeholder: 'e.g. SRC Week starts next Monday!' },
                { label: 'Announcement 2', key: 'home_announcement_2', type: 'text', placeholder: 'e.g. Exam registration deadline extended.' },
                { label: 'Hero Headline', key: 'home_hero_headline', type: 'text', placeholder: 'e.g. The Future of Campus Living' },
            ]
        }
    ];

    const activeSections = activeTab === 'images' ? imageSections : textSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6">
                        <i className="ri-layout-masonry-line"></i>
                        CMS Portal 1.0
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-none mb-4">
                                Content<br /><span className="text-gray-400">Manager.</span>
                            </h1>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                                Update site imagery and assets in real-time.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'images'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <i className="ri-image-line mr-2"></i>
                                Imagery
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'text'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <i className="ri-text mr-2"></i>
                                Text Content
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Configuration...</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {activeSections.map((section, idx) => (
                            <div key={idx} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
                                <div className="mb-10">
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{section.title}</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">{section.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {section.items.map((item) => (
                                        <div key={item.key} className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                                {config[item.key] && (
                                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wide">
                                                        Live
                                                    </span>
                                                )}
                                            </div>

                                            {item.type === 'image' ? (
                                                <>
                                                    <div className="relative group">
                                                        <ImageUploader
                                                            currentImage={config[item.key]}
                                                            onImageUploaded={(url) => updateConfig(item.key, url)}
                                                            folder="cms"
                                                            size="large"
                                                            shape="square"
                                                            className="w-full aspect-video h-auto"
                                                        />
                                                        {saving && (
                                                            <div className="absolute top-4 right-4 bg-black/80 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                                                                Saving...
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-xl break-all">
                                                        <p className="text-[10px] font-mono text-gray-400 mb-1 uppercase">Asset URL</p>
                                                        <p className="text-xs text-gray-600 line-clamp-2">
                                                            {config[item.key] || 'Using System Default'}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="relative">
                                                    <textarea
                                                        value={config[item.key] || ''}
                                                        onChange={(e) => updateConfig(item.key, e.target.value)}
                                                        placeholder={item.placeholder}
                                                        rows={4}
                                                        className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all resize-none"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-2 text-right">
                                                        {config[item.key]?.length || 0} characters
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
