import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const CONTENT_KEYS = {
    HOME_HERO_MAIN: 'home_hero_main',
    HOME_HERO_AERIAL: 'home_hero_aerial',
    MARKETPLACE_BANNER: 'marketplace_banner',
    NEWS_BANNER: 'news_banner',
};

const DEFAULTS = {
    [CONTENT_KEYS.HOME_HERO_MAIN]: '/Pentecost-University-Sowutoum-Ghana-SchoolFinder-TortoisePathcom-2-1536x1152.jpeg',
    [CONTENT_KEYS.HOME_HERO_AERIAL]: '/Pentecost-University-Sowutoum-Ghana-SchoolFinder-TortoisePathcom-11.jpeg',
    [CONTENT_KEYS.MARKETPLACE_BANNER]: '/Pentecost-University-Sowutoum-Ghana-SchoolFinder-TortoisePathcom-11.jpeg',
    [CONTENT_KEYS.NEWS_BANNER]: '/Pentecost-University-Sowutoum-Ghana-SchoolFinder-TortoisePathcom-2-1536x1152.jpeg',
};

export function useSiteContent(key: string) {
    const [url, setUrl] = useState<string>(DEFAULTS[key] || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkContent() {
            try {
                // Try to get from localStorage first for speed
                const local = localStorage.getItem(`site_content_${key}`);
                if (local && mounted) {
                    setUrl(local);
                    setLoading(false);
                }

                // Then fetch fresh config from server
                const { data, error } = await supabase.storage
                    .from('uploads')
                    .download('site_config.json');

                if (error) throw error;

                if (data && mounted) {
                    const text = await data.text();
                    const config = JSON.parse(text);
                    const remoteUrl = config[key];

                    if (remoteUrl) {
                        setUrl(remoteUrl);
                        // Update local cache
                        localStorage.setItem(`site_content_${key}`, remoteUrl);
                    }
                }
            } catch (err) {
                // Silent fail, keep default or local
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkContent();
        return () => { mounted = false; };
    }, [key]);

    return { url, loading };
}
