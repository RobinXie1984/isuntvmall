import {beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const m=vi.hoisted(()=>({staff:vi.fn(),origin:vi.fn(),allowed:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/batch/auth',()=>({requireBatchStaff:m.staff,requireBatchOrigin:m.origin}));
vi.mock('@/lib/staff/permissions',()=>({permissionAllowed:m.allowed}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({rpc:m.rpc})}));
import {POST} from '@/app/api/admin/shopify-stage/draft/route';
const id='11111111-1111-4111-8111-111111111111';
const req=(body:unknown)=>new Request('https://example.test/api/admin/shopify-stage/draft',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();m.staff.mockResolvedValue({id,role:'merchandise_admin'});m.allowed.mockReturnValue(true);m.rpc.mockResolvedValue({data:{id,replayed:false},error:null});});
describe('draft creation endpoint',()=>{
 it('requires an authenticated merchandise role',async()=>{m.allowed.mockReturnValue(false);expect((await POST(req({batch:id,handle:'hat'}))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it('rejects extra fields and ignores any attempted actor override',async()=>{expect((await POST(req({batch:id,handle:'hat',actor:id}))).status).toBe(422);expect(m.rpc).not.toHaveBeenCalled();});
 it('passes server-derived identity',async()=>{expect((await POST(req({batch:id,handle:'hat'}))).status).toBe(201);expect(m.rpc).toHaveBeenCalledWith('shopify_create_draft',{p_actor:id,p_batch:id,p_handle:'hat'});});
});
