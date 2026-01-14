import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type Internship = {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    source: string;
    description: string;
    url: string;
    logo_url?: string;
    posted_at: string;
    created_at: string;
    is_active: boolean;
};

// Fallback Mock Data (matches the database schema)
const MOCK_DATA: Internship[] = [
    {
        id: '1',
        title: 'Software Engineering Intern',
        company: 'Tech Co Ghana',
        location: 'Accra, Ghana',
        type: 'Full-time',
        source: 'LinkedIn',
        description: 'Join our dynamic team to build the future of fintech in Africa.',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        logo_url: 'https://ui-avatars.com/api/?name=Tech+Co&background=0D8ABC&color=fff',
        url: '#',
        created_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: '2',
        title: 'Data Science Intern',
        company: 'Global Corp',
        location: 'Remote (USA)',
        type: 'Part-time',
        source: 'LinkedIn',
        description: 'Analyze large datasets and build predictive models.',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        logo_url: 'https://ui-avatars.com/api/?name=Global+Corp&background=6366f1&color=fff',
        url: '#',
        created_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: '3',
        title: 'Marketing Specialist Intern',
        company: 'Sowutoum Media',
        location: 'Sowutoum, Ghana',
        type: 'On-site',
        source: 'Direct',
        description: 'Assist in managing social media campaigns for local businesses.',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        logo_url: 'https://ui-avatars.com/api/?name=Sowutoum+Media&background=f43f5e&color=fff',
        url: '#',
        created_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: '4',
        title: 'Graphic Design Intern',
        company: 'Creative Studio',
        location: 'London, UK (Remote)',
        type: 'Internship',
        source: 'Abroad',
        description: 'Create stunning visuals for international clients.',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        logo_url: 'https://ui-avatars.com/api/?name=Creative+Studio&background=10b981&color=fff',
        url: '#',
        created_at: new Date().toISOString(),
        is_active: true
    }
];

export function useInternships(filters?: { search?: string; type?: string }) {
    return useQuery({
        queryKey: ['internships', filters],
        queryFn: async () => {
            try {
                let query = supabase
                    .from('internships')
                    .select('*')
                    .eq('is_active', true)
                    .order('posted_at', { ascending: false });

                const { data, error } = await query;

                if (error) {
                    // Fallback to mock data if table doesn't exist yet (404/400)
                    console.warn('Fetching internships failed (likely table missing), using mock data:', error);
                    return MOCK_DATA;
                }

                // Return mixed data? No, probably either DB or Mock.
                return data && data.length > 0 ? data : MOCK_DATA;
            } catch (err) {
                console.error('useInternships error:', err);
                return MOCK_DATA;
            }
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
