import {beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const m=vi.hoisted(()=>({staff:vi.fn(),origin:vi.fn(),allowed:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/batch/auth',()=>({requireBatchStaff:m.staff,requireBatchOrigin:m.origin}));
vi.mock('@/lib/staff/permissions',()=>({permissionAllowed:m.allowed}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({rpc:m.rpc})}));
import {POST,GET} from '@/app/api/admin/shopify-stage/route';
const requestId='11111111-1111-4111-8111-111111111111';
const valid={requestId,title:'Shopify',products:[{handle:'hat',title:'Hat',variants:[],images:[],source:{}}]};
const request=(body:unknown=valid)=>new Request('https://example.test/api/admin/shopify-stage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();m.staff.mockResolvedValue({id:requestId,role:'merchandise_admin'});m.allowed.mockReturnValue(true);m.rpc.mockResolvedValue({data:{id:requestId},error:null});});
describe('private staging endpoint',()=>{
 it('passes only validated fields and the server authenticated actor',async()=>{expect((await POST(request())).status).toBe(201);expect(m.rpc).toHaveBeenCalledWith('shopify_stage',expect.objectContaining({p_actor:requestId,p_request:requestId,p_products:valid.products}));});
 it('denies a caller without merchandise rights',async()=>{m.allowed.mockReturnValue(false);expect((await POST(request())).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it('rejects injected source fields',async()=>{expect((await POST(request({...valid,products:[{...valid.products[0],cost:'secret'}]}))).status).toBe(422);expect(m.rpc).not.toHaveBeenCalled();});
 it('denies migration listing to merchandise staff without affecting their import right',async()=>{expect((await GET(new Request('https://example.test/api/admin/shopify-stage'))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it('uses no-store for owner-only private list results',async()=>{m.staff.mockResolvedValue({id:requestId,role:'business_super_admin'});const response=await GET(new Request('https://example.test/api/admin/shopify-stage'));expect(response.headers.get('cache-control')).toContain('no-store');expect(m.rpc).toHaveBeenCalledWith('shopify_staged_batches',{p_actor:requestId});});
});
