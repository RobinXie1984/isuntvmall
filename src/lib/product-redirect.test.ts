import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));const m=vi.hoisted(()=>({configured:vi.fn(),read:vi.fn(),product:vi.fn()}));
vi.mock('@/lib/env',()=>({hasSupabaseConfig:m.configured}));vi.mock('@/lib/data/store',()=>({getProductBySlug:m.product}));vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:m.read})})})})}));
import {productRedirect} from './product-redirect';
beforeEach(()=>{vi.clearAllMocks();m.configured.mockReturnValue(true);m.product.mockResolvedValue({id:'product'});});
describe('permanent product aliases',()=>{
 it('follows the stable product identity to its latest public slug',async()=>{m.read.mockResolvedValue({data:{products:{slug:'new-cup',status:'published'}},error:null});expect(await productRedirect('old-cup')).toBe('new-cup');});
 it('does not reveal hidden products or inaccessible media',async()=>{m.read.mockResolvedValue({data:{products:{slug:'new-cup',status:'draft'}},error:null});expect(await productRedirect('old-cup')).toBeNull();m.read.mockResolvedValue({data:{products:{slug:'new-cup',status:'published'}},error:null});m.product.mockResolvedValue(null);expect(await productRedirect('old-cup')).toBeNull();});
 it('supports app-first rollout before alias storage exists',async()=>{m.read.mockResolvedValue({error:{code:'PGRST205'}});expect(await productRedirect('old-cup')).toBeNull();});
 it('does not disguise database failures as missing redirects',async()=>{m.read.mockResolvedValue({error:{code:'TIMEOUT'}});await expect(productRedirect('old-cup')).rejects.toThrow('unavailable');});
});
