import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import { useProducts, useToggleFavorite, useFavorites } from '../../hooks/useProducts';
import { useAuth } from '../../contexts/AuthContext';
import { type Profile } from '../../lib/supabase';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';
import { useSiteContent, CONTENT_KEYS } from '../../hooks/useSiteContent';

function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const { url: bannerUrl } = useSiteContent(CONTENT_KEYS.MARKETPLACE_BANNER);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync category state with URL
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setSelectedCategory(cat);
  }, [searchParams]);

  const { data: products = [], isLoading: productsLoading } = useProducts({
    category: selectedCategory,
    search: debouncedSearch,
  });

  const { data: favoriteItems = [] } = useFavorites();
  const toggleFavoriteMutation = useToggleFavorite();

  const favorites = useMemo(() => favoriteItems.map(f => f.product_id), [favoriteItems]);

  const categories = [
    { id: 'all', name: 'Discover All', icon: 'ri-command-fill', color: 'bg-blue-600' },
    { id: 'electronics', name: 'Electronics', icon: 'ri-macbook-line', color: 'bg-indigo-600' },
    { id: 'books', name: 'Textbooks', icon: 'ri-book-read-line', color: 'bg-emerald-600' },
    { id: 'fashion', name: 'Fashion', icon: 'ri-t-shirt-line', color: 'bg-rose-600' },
    { id: 'food', name: 'Nutrition', icon: 'ri-restaurant-2-line', color: 'bg-amber-600' },
    { id: 'health', name: 'Essentials', icon: 'ri-capsule-line', color: 'bg-teal-600' },
    { id: 'academics', name: 'Academic Gear', icon: 'ri-pencil-ruler-2-line', color: 'bg-sky-600' },
    { id: 'other', name: 'Miscellaneous', icon: 'ri-grid-line', color: 'bg-slate-600' }
  ];

  const filteredAndSortedProducts = useMemo(() => {
    return [...products]
      .filter(product => {
        let matchesPrice = true;
        if (product.price_type === 'fixed' && product.price) {
          if (priceRange === 'under50') matchesPrice = product.price < 50;
          else if (priceRange === '50-200') matchesPrice = product.price >= 50 && product.price <= 200;
          else if (priceRange === 'over200') matchesPrice = product.price > 200;
        }
        return matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [products, priceRange, sortBy]);

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory(id);
    const newParams = new URLSearchParams(searchParams);
    if (id === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', id);
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      <section className="relative py-16 md:py-32 overflow-hidden bg-gray-950">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 text-center">
          <img
            src={bannerUrl}
            alt="Campus Aerial"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/40 to-transparent"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
          {/* Market Exchange Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Campus Exchange
              </div>
              <h1 className="text-5xl md:text-[6rem] font-bold text-white leading-[0.9] tracking-tight mb-6">
                Product<br /><span className="text-blue-400">Catalogue.</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-wide text-[10px]">
                OFFICIAL UNIVERSITY COMMERCE PLATFORM
              </p>
            </div>

            <div className="w-full md:w-auto">
              <form
                onSubmit={(e) => { e.preventDefault(); setDebouncedSearch(searchQuery); }}
                className="relative group max-w-xl mx-auto"
              >
                <i className="ri-search-2-line absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 group-focus-within:text-blue-400 pointer-events-none"></i>
                <input
                  type="text"
                  placeholder="Identify your needs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-32 py-5 bg-white/10 border border-white/10 rounded-2xl focus:bg-white/20 focus:border-blue-400 outline-none transition-all font-semibold text-white placeholder-gray-400 text-lg backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-20">

        {/* Category Matrix */}
        <div className="mb-20 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex gap-4 md:gap-6 min-w-max px-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`flex items-center gap-4 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${selectedCategory === category.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedCategory === category.id ? 'bg-white/20' : category.color + ' text-white'}`}>
                  <i className={`${category.icon} text-sm`}></i>
                </div>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Ledger */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[500px] bg-gray-50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredAndSortedProducts?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredAndSortedProducts.map((product) => {
              const seller = product.seller as Profile;
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-700 group cursor-pointer"
                >
                  <div className="relative h-72 rounded-xl overflow-hidden bg-gray-50 mb-8">
                    {product.images?.[0] ? (
                      <img
                        src={getOptimizedImageUrl(product.images[0], 600, 85)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <i className="ri-image-2-line text-7xl"></i>
                      </div>
                    )}
                    <div className="absolute top-6 right-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteMutation.mutate(product.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${favorites.includes(product.id)
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-rose-500'
                          }`}
                      >
                        <i className={`${favorites.includes(product.id) ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
                      </button>
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <span className="px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest rounded-lg">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</span>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">
                          {product.price_type === 'fixed' ? `₵${product.price?.toLocaleString()}` : 'Contact'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none mb-1">{seller?.full_name?.split(' ')[0]}</p>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest leading-none">Seller</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                          <img
                            src={getOptimizedImageUrl(seller?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100", 100, 85)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-40 text-center bg-gray-50 rounded-3xl border border-gray-100">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
              <i className="ri-search-line text-4xl text-gray-200"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">No products found.</h3>
            <p className="text-gray-400 font-semibold uppercase tracking-widest text-xs">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setPriceRange('all'); setSortBy('newest'); }}
              className="mt-10 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all cursor-pointer shadow-lg"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
