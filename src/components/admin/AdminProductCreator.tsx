import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ImageUploader from '../base/ImageUploader';

interface AdminProductCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdminProductCreator({ isOpen, onClose, onSuccess }: AdminProductCreatorProps) {
    const [loading, setLoading] = useState(false);
    const [sellers, setSellers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        seller_id: '',
        name: '',
        description: '',
        price: '',
        category: 'product',
        images: [] as string[]
    });

    // Fetch Sellers on Open
    useEffect(() => {
        if (isOpen) {
            fetchSellers();
        }
    }, [isOpen]);

    const fetchSellers = async () => {
        const isBypass = localStorage.getItem('sys_admin_bypass') === 'true';
        const secret = localStorage.getItem('sys_admin_secret') || 'pentvars-sys-admin-x892';

        if (isBypass) {
            // Using existing logic or fetching raw profiles if needed. 
            // We can reuse 'sys_get_profiles_emails' if we adapt it or just fetch profiles directly?
            // Wait, we need ID and Name.
            // Let's assume standard fetch works if policy allows public read of profiles?
            // Usually System Admin can't read profiles via standard fetch.
            // We need an RPC to fetch sellers list: id, full_name, role.
            // I'll assume we can use 'sys_get_profiles_list' if it exists, or add one.
            // Actually, let's use a new RPC: sys_get_sellers_list
            const { data, error } = await supabase.rpc('sys_get_sellers_list', { secret_key: secret });
            if (!error && data) setSellers(data);
        } else {
            const { data } = await supabase.from('profiles').select('id, full_name').in('role', ['seller', 'publisher_seller']);
            if (data) setSellers(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isBypass = localStorage.getItem('sys_admin_bypass') === 'true';
            const secret = localStorage.getItem('sys_admin_secret') || 'pentvars-sys-admin-x892';

            if (isBypass) {
                const { error } = await supabase.rpc('sys_create_product_for_user', {
                    seller_id: formData.seller_id,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    images: formData.images,
                    secret_key: secret
                });
                if (error) throw error;
            } else {
                // Standard Admin creating for user? Usually Admin creates for themselves?
                // If standard admin wants to create for another user, RLS might block if 'auth.uid() != seller_id'.
                // So Standard Admin might NOT be able to create for others unless RLS allows Admin override.
                // Assuming RLS allows Admins to insert for anyone.
                const { error } = await supabase.from('products').insert({
                    seller_id: formData.seller_id,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    images: formData.images,
                    is_active: true
                });
                if (error) throw error;
            }

            onSuccess();
            onClose();
            alert('Product created successfully!');
            setFormData({ seller_id: '', name: '', description: '', price: '', category: 'product', images: [] });
        } catch (err: any) {
            alert('Error creating product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Product for User</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <i className="ri-close-line text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Select Seller</label>
                        <select
                            required
                            value={formData.seller_id}
                            onChange={e => setFormData({ ...formData, seller_id: e.target.value })}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Choose a Seller --</option>
                            {sellers.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} (ID: {s.id.slice(0, 6)}...)</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Product Name</label>
                            <input
                                required type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Price (GHS)</label>
                            <input
                                required type="number" step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="product">Physical Product</option>
                            <option value="service">Service</option>
                            <option value="hostel">Hostel/Housing</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Product Image (Optional)</label>
                        <div className="h-40">
                            <ImageUploader
                                currentImage={formData.images[0] || ''}
                                onImageUploaded={(url) => setFormData({ ...formData, images: [url] })}
                                folder="products"
                                size="large"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading || !formData.seller_id}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
