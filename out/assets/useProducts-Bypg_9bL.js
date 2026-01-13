import{u as a}from"./query-vendor-C4XoQ8tj.js";import{s as u}from"./index-BvprY0-k.js";function l(r){return a({queryKey:["products",r],queryFn:async()=>{let t=u.from("products").select(`
          *,
          seller:profiles!products_seller_id_fkey(id, full_name, email, avatar_url)
        `).eq("is_active",!0).order("created_at",{ascending:!1}).limit(100);const{data:s,error:e}=await t;if(e)throw e;return s||[]},staleTime:1e3*60*3,gcTime:1e3*60*10})}export{l as u};
//# sourceMappingURL=useProducts-Bypg_9bL.js.map
