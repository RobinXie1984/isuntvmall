import 'server-only';
import { hasSupabaseConfig } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getProductBySlug } from '@/lib/data/store';
export async function productRedirect(slug:string):Promise<string|null> {
 if(!hasSupabaseConfig())return null;
 const {data,error}=await getSupabaseAdmin().from('product_url_aliases').select('product_id, products(slug,status)').eq('slug',slug).maybeSingle();
 // Compatibility during app-first rollout: no aliases exist before migration.
 if(error && ['PGRST205','42P01'].includes(error.code))return null;
 if(error)throw Error('Product redirect lookup unavailable');
 const p=(Array.isArray(data?.products)?data.products[0]:data?.products) as {slug:string;status:string}|undefined;
 return p?.status==='published' && p.slug!==slug && await getProductBySlug(p.slug) ? p.slug : null;
}
