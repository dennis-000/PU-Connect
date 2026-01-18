import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Internship } from '../../hooks/useInternships';

export default function InternshipManagement() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Internship>>({
        title: '',
        company: '',
        location: 'Accra, Ghana',
        type: 'Internship',
        description: '',
        url: '#',
        source: 'Direct',
        logo_url: '/PU Connect logo.png',
        is_active: true
    });

    // Fetch Internships (Local Only for editing)
    const { data: internships = [], isLoading } = useQuery({
        queryKey: ['admin-internships'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('internships')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Internship[];
        }
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newInternship: Partial<Internship>) => {
            const { data, error } = await supabase
                .from('internships')
                .insert([{
                    ...newInternship,
                    posted_at: new Date().toISOString(), // Always fresh
                    created_at: new Date().toISOString()
                }])
                .select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
            queryClient.invalidateQueries({ queryKey: ['internships'] }); // Update public view
            setIsEditing(false);
            resetForm();
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<Internship>) => {
            const { error } = await supabase
                .from('internships')
                .update(updates)
                .eq('id', editingId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
            queryClient.invalidateQueries({ queryKey: ['internships'] });
            setIsEditing(false);
            setEditingId(null);
            resetForm();
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('internships')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
            queryClient.invalidateQueries({ queryKey: ['internships'] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (internship: Internship) => {
        setFormData(internship);
        setEditingId(internship.id);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this internship?')) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            company: '',
            location: 'Accra, Ghana',
            type: 'Internship',
            description: '',
            url: '#',
            source: 'Direct',
            logo_url: '/PU Connect logo.png',
            is_active: true
        });
        setEditingId(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Internship Portal</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage student career opportunities</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsEditing(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <i className="ri-add-line text-lg"></i>
                            Post Opportunity
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section - Slide In / Sticky */}
                    {isEditing && (
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl sticky top-24 animate-in slide-in-from-left duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {editingId ? 'Edit Listing' : 'New Listing'}
                                    </h3>
                                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <i className="ri-close-line text-xl"></i>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. Junior Designer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. Google Ghana"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                                            >
                                                <option value="Internship">Internship</option>
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apply Link / Email</label>
                                        <input
                                            type="text"
                                            value={formData.url}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                                            placeholder="https://... or mailto:..."
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                        <textarea
                                            rows={4}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Job'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Listings Grid */}
                    <div className={isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}>
                        {internships.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                                    <i className="ri-briefcase-line text-4xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Listings</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Post your first local internship opportunity to help students find their path.</p>
                                <button
                                    onClick={() => { resetForm(); setIsEditing(true); }}
                                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm"
                                >
                                    Create First Listing
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {internships.map(job => (
                                    <div key={job.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center p-2 border border-slate-100 dark:border-slate-600">
                                                    <img src={job.logo_url || '/PU Connect logo.png'} alt={job.company} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{job.title}</h3>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{job.company}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md ${job.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {job.is_active ? 'Active' : 'Closed'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                            <span className="flex items-center gap-1"><i className="ri-map-pin-line"></i> {job.location}</span>
                                            <span className="flex items-center gap-1"><i className="ri-time-line"></i> {job.type}</span>
                                        </div>

                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(job)}
                                                className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job.id)}
                                                className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
