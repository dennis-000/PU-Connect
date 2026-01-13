import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/feature/Navbar';
import { useProducts, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useProducts({
    sellerId: user?.id
  });

  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    views: products.reduce((sum, p) => sum + (p.views_count || 0), 0)
  };

  if (!user || profile?.role !== 'seller') {
    navigate('/marketplace');
    return null;
  }

  const handleToggleStatus = (productId: string, currentStatus: boolean) => {
    updateProductMutation.mutate({
      id: productId,
      updates: { is_active: !currentStatus }
    });
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('Delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(productId);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 md:mb-24 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
              <i className="ri-shield-star-line text-blue-400"></i>
              Official Seller Portal
            </div>
            <h1 className="text-4xl md:text-[4rem] font-bold text-gray-900 leading-tight tracking-tight mb-4">
              Merchant<br /><span className="text-blue-600">Operations.</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
              Management of campus marketplace activities
            </p>
          </div>

          <Link
            to="/seller/add-product"
            className="group px-10 py-5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <span>Add New Product</span>
            <i className="ri-add-line text-xl"></i>
          </Link>
        </div>

        {/* System Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {[
            { label: 'Inventory Count', value: stats.total, icon: 'ri-shopping-bag-3-line', color: 'bg-gray-900' },
            { label: 'Published Items', value: stats.active, icon: 'ri-check-double-line', color: 'bg-blue-600' },
            { label: 'Cumulative Views', value: stats.views.toLocaleString(), icon: 'ri-eye-line', color: 'bg-emerald-600' }
          ].map((stat, i) => (
            <div key={i} className="relative bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-lg transition-all flex items-center justify-between overflow-hidden">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                <i className={`${stat.icon} text-2xl`}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-4">
              Merchant Products
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{products.length} Total</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="py-32 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-8"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Retrieving Inventory Data...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center bg-gray-50 rounded-[2.5rem] border border-gray-50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <i className="ri-folder-add-line text-3xl text-gray-200"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Listings Found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-semibold text-xs leading-relaxed">Your inventory is currently empty. Add your first product to begin trading on the marketplace.</p>
                <Link
                  to="/seller/add-product"
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-10">
                {products.map((product) => (
                  <div key={product.id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:border-blue-100 flex flex-col lg:flex-row items-center gap-10">
                    {/* Product Image */}
                    <div className="w-full lg:w-48 h-48 rounded-2xl overflow-hidden bg-gray-50 border border-gray-50 flex-shrink-0 relative">
                      {product.images?.[0] ? (
                        <img
                          src={getOptimizedImageUrl(product.images[0], 400, 85)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <i className="ri-image-2-line text-4xl"></i>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-md ${product.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'}`}>
                          {product.is_active ? 'Active' : 'Private'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-between">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight mb-2">{product.name}</h3>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <i className="ri-eye-line text-blue-600"></i>
                              {product.views_count || 0} Views
                            </div>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.category}</span>
                          </div>
                        </div>
                        <div className="md:text-right">
                          <p className="text-2xl font-bold text-gray-900 tracking-tight">
                            {product.price_type === 'fixed' ? (
                              <>
                                <span className="text-sm text-blue-600 font-bold mr-1">GH₵</span>
                                {product.price?.toLocaleString()}
                              </>
                            ) : (
                              'Negotiable'
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{product.price_type === 'fixed' ? 'Fixed Price' : 'Flexible Pricing'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-100 active:scale-95 uppercase tracking-widest text-[10px]"
                        >
                          <i className="ri-edit-line text-base"></i>
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] ${product.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                          <i className={product.is_active ? 'ri-eye-off-line text-base' : 'ri-eye-line text-base'}></i>
                          {product.is_active ? 'Hide Listing' : 'Publish Listing'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="sm:flex-none flex items-center justify-center w-12 h-12 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 active:scale-95"
                          title="Delete Listing"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
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
