const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/admin/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the messy block
// We look for the start of the mess and the end.
const messStart = content.indexOf('// Correct way to assignments');
const messEnd = content.indexOf('});', messStart); // The closing of the console.log object that got successfully closed?

if (messStart !== -1 && messEnd !== -1) {
    const messEndLine = messEnd + 3; // include });

    const fixedBlock = `      console.log('📋 Applications response:', {
        error: appsRes.error,
        count: appsRes.data?.length
      });`;

    // We replace the mess.
    // However, we need to be careful about what we replace.
    // The mess likely includes:
    // const allProds ...
    // ...
    // data: appsRes.data
    // });

    // Let's rely on finding the specific start string and replacing until the end string.
    const originalMess = content.substring(messStart, messEnd + 3);
    console.log("Found mess length:", originalMess.length);

    content = content.replace(originalMess, fixedBlock);
    console.log("Fixed mess.");
} else {
    console.log("Mess not found via exact string match. Attempting fallback...");
    // Fallback: Use regex if needed, or maybe it was already fixed?
}

// 2. Fix the destructuring in fetchData
// We need to find the Promise.all line and ensure the variables are named correctly.
// The current line likely looks like:
// const [appsRes, usersRes, sellersRes, adminsRes, publishersRes, productsCountRes, servicesCountRes, newsRes, ticketsRes, logsRes, analyticsRes, allProductsRes] = await Promise.all([
// Step 2706 confirms this. So the destructuring is actually CORRECT in the file.
// But the usage below was wrong.

// 3. Fix setStats usage
// products_count: productsRes.count || 0,
// Should be: products_count: productsCountRes.count || 0,
content = content.replace(/products_count:\s*productsRes\.count/g, 'products_count: productsCountRes.count');
content = content.replace(/services_count:\s*servicesRes\.count/g, 'services_count: servicesCountRes.count');
content = content.replace(/products_count:\s*\(productsRes\.count\s*\|\|\s*0\)/g, 'products_count: productsCountRes.count || 0');

console.log("Fixed variable usage.");

// 4. Update setAllProducts logic
// In Step 2706:
// if (productsRes && 'data' in (productsRes as any)) {
// setAllProducts((productsRes as any).data || []);
// }
// We need to change productsRes to allProductsRes (or productsCountRes? No, index 11 is allProductsRes).
// Wait, index 5 is productsCountRes (count match).
// Index 11 is allProductsRes (data match).
// My code in Step 2698 Chunk 2 Added: 
// if (productsRes && 'data' in (productsRes as any)) ...
// But at that time productsRes WAS defined.
// Now productsRes is NOT defined in the destructuring (it's productsCountRes).
// So we need to replace `productsRes` with `allProductsRes` in that block.
// AND remove the 'data' check if we trust the type, or keep it.
// Replace `if (productsRes &&` with `if (allProductsRes &&`
content = content.replace(/if \(productsRes &&/g, 'if (allProductsRes &&');
content = content.replace(/in \(productsRes as any\)/g, 'in (allProductsRes as any)');
content = content.replace(/setAllProducts\(\(productsRes as any\)/g, 'setAllProducts((allProductsRes as any)');

// 5. Add Products Tab Content
// We look for `{activeTab === 'applications' && (`
// And insert the Products tab block BEFORE it.

const productsTabContent = `        {activeTab === 'products' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white mb-6">Product Management ({allProducts.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {allProducts.map((product) => (
                <div key={product.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-slate-600 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-slate-700/50 overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={getOptimizedImageUrl(product.images[0], 100, 80)} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><i className="ri-image-line text-slate-500"></i></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
                      <h4 className="font-bold text-white truncate">{product.name}</h4>
                      <span className={\`px-2 py-0.5 rounded text-[10px] uppercase font-black \${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}\`}>
                        {product.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span><i className="ri-store-2-line text-blue-400 mr-1"></i>{product.seller?.full_name || 'Unknown Seller'}</span>
                      <span><i className="ri-price-tag-3-line text-emerald-400 mr-1"></i>GH₵ {product.price}</span>
                      <span><i className="ri-eye-line text-amber-400 mr-1"></i>{product.views_count || 0} views</span>
                      <span><i className="ri-calendar-line text-slate-400 mr-1"></i>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProductToggle(product.id, product.is_active)}
                      disabled={!!processing}
                      className={\`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all \${product.is_active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}\`}
                      title={product.is_active ? 'Deactivate Product' : 'Activate Product'}
                    >
                      {processing === product.id ? <i className="ri-loader-4-line animate-spin"></i> : (product.is_active ? 'Hide' : 'Show')}
                    </button>
                    <button
                      onClick={() => handleProductDelete(product.id)}
                      disabled={!!processing}
                      className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold text-xs uppercase transition-all"
                      title="Delete Permanently"
                    >
                      {processing === product.id ? <i className="ri-loader-4-line animate-spin"></i> : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
              {allProducts.length === 0 && (
                <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                  <i className="ri-dropbox-line text-4xl mb-3 block"></i>
                  No products found
                </div>
              )}
            </div>
          </div>
        )}

`;

if (!content.includes('activeTab === \'products\'')) {
    content = content.replace('{activeTab === \'applications\' && (', productsTabContent + '{activeTab === \'applications\' && (');
    console.log("Added Products Tab.");
} else {
    console.log("Products Tab already exists.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done.");
