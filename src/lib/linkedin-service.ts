export interface LinkedInJob {
    job_id?: string;
    id?: string;
    employer_name?: string;
    organization?: string;
    job_title?: string;
    title?: string;
    job_city?: string;
    job_country?: string;
    job_is_remote?: boolean;
    job_posted_at_datetime_utc?: string;
    date_posted?: string;
    job_apply_link?: string;
    url?: string;
    job_description?: string;
    employer_logo?: string;
    organization_logo?: string;
    job_employment_type?: string;
    employment_type?: string[];
    locations_derived?: string[];
}

const RAPID_API_KEY = import.meta.env.VITE_RAPID_API_KEY;
const RAPID_API_HOST = 'jsearch.p.rapidapi.com';

/**
 * Fetches internship/job postings from LinkedIn via RapidAPI (JSearch).
 * @param query Search query (default: 'Internship')
 * @returns Array of job objects or empty array if no key/error.
 */
// Fallback data provided by user (Real LinkedIn Data Snapshot) to ensure visibility if API limit reached or returns empty
const FALLBACK_JOBS: LinkedInJob[] = [
    {
        "job_id": "1950545032",
        "date_posted": "2026-01-18T13:34:51",
        "job_title": "R&D Internship - 3D Digital Twin Internship",
        "employer_name": "Keysight Technologies",
        "employer_logo": "https://media.licdn.com/dms/image/v2/D4D0BAQE0N64B9-dx0A/company-logo_200_200/company-logo_200_200/0/1688574562558/keysight_technologies_logo?e=2147483647&v=beta&t=pXDGyMGUn5MvYgm6rqQ8oBCXR1ZpIXf3TH5P70ze4rY",
        "job_city": "Málaga",
        "job_country": "Spain",
        "job_is_remote": false,
        "job_posted_at_datetime_utc": "2026-01-18T13:34:51",
        "job_apply_link": "https://es.linkedin.com/jobs/view/r-d-internship-3d-digital-twin-internship-at-keysight-technologies-4353852716",
        "job_description": "Keysight empowers innovators to explore, design, and bring world-changing technologies to life...",
        "job_employment_type": "INTERN",
        "locations_derived": ["Málaga, Andalusia, Spain"]
    },
    {
        "job_id": "1950533529",
        "title": "Marketing Intern", // Map both keys for safety
        "job_title": "Marketing Intern",
        "organization": "Opera Co-Pro",
        "employer_name": "Opera Co-Pro",
        "organization_logo": "https://media.licdn.com/dms/image/v2/C4D0BAQHuNMj5zyyyYg/company-logo_100_100/company-logo_100_100/0/1631330836515?e=2147483647&v=beta&t=nJD6nI6QK3rTq1gDg3F2W6HUKPgdTLVK2uwfUHf-E0I",
        "employer_logo": "https://media.licdn.com/dms/image/v2/C4D0BAQHuNMj5zyyyYg/company-logo_100_100/company-logo_100_100/0/1631330836515?e=2147483647&v=beta&t=nJD6nI6QK3rTq1gDg3F2W6HUKPgdTLVK2uwfUHf-E0I",
        "locations_derived": ["United Kingdom"],
        "date_posted": "2026-01-18T13:32:00.175",
        "url": "https://uk.linkedin.com/jobs/view/marketing-intern-at-opera-co-pro-3738323014",
        "job_apply_link": "https://uk.linkedin.com/jobs/view/marketing-intern-at-opera-co-pro-3738323014",
        "employment_type": ["INTERN"]
    },
    {
        "job_id": "1950535366",
        "job_title": "Internship - Data Control and Quality Officer",
        "employer_name": "CMA CGM",
        "employer_logo": "https://media.licdn.com/dms/image/v2/C4E0BAQErbDTaXxx_JA/company-logo_200_200/company-logo_200_200/0/1631365360656/cma_cgm_logo?e=2147483647&v=beta&t=LMgPkqYSW7I--7W5Le2O1O7TE_MjMMzLZuicNLRwXwI",
        "locations_derived": ["Marseille, France"],
        "date_posted": "2026-01-18T13:31:14",
        "job_apply_link": "https://fr.linkedin.com/jobs/view/internship-data-control-and-quality-officer-at-cma-cgm-4360152480",
        "employment_type": ["INTERN"]
    },
    {
        "job_id": "1950533561",
        "job_title": "LLM Engineer Intern",
        "employer_name": "Navo Health",
        "employer_logo": "https://media.licdn.com/dms/image/v2/D560BAQFHwCuDeT0g5A/company-logo_100_100/B56ZrX_90DI4AQ-/0/1764560461583/navo_health_logo?e=2147483647&v=beta&t=y1bRy1G-FHnRDKzKr3dsQTNrqTPTh2FkmUxlOAeoy_s",
        "locations_derived": ["Singapore"],
        "date_posted": "2026-01-18T13:29:01",
        "job_apply_link": "https://sg.linkedin.com/jobs/view/llm-engineer-intern-at-navo-health-4360242211",
        "employment_type": ["INTERN"]
    }
];

export async function fetchLinkedInJobs(query: string = 'Internship'): Promise<LinkedInJob[]> {
    if (!RAPID_API_KEY) {
        console.debug('LinkedIn Integration: VITE_RAPID_API_KEY is missing. Using Fallback Real Data.');
        return FALLBACK_JOBS;
    }

    try {
        // Broad search to maximize chances of live results
        const url = `https://${RAPID_API_HOST}/search?query=${encodeURIComponent(query)}&num_pages=1`;

        console.log('LinkedIn Integration: Fetching from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });

        if (!response.ok) {
            console.warn('LinkedIn Integration: API request failed with status:', response.status);
            return FALLBACK_JOBS;
        }

        const result = await response.json();
        console.log('LinkedIn Integration: Raw API Response:', result);

        if (!result.data || result.data.length === 0) {
            console.warn('LinkedIn Integration: No live jobs found, using Fallback Real Data.');
            return FALLBACK_JOBS;
        }

        return result.data;

    } catch (err) {
        console.error('LinkedIn Integration: Network or parsing error:', err);
        return FALLBACK_JOBS;
    }
}
