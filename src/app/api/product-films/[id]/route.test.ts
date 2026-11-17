import {describe,it,expect} from 'vitest';
import {GET} from './route';
import films from '@/lib/broadcasts/product-films.json';
describe('public film route boundaries',()=>{
 it('rejects unknown IDs',async()=>{expect((await GET(new Request('https://mall.test/api/product-films/unknown'),{params:Promise.resolve({id:'unknown'})})).status).toBe(404);});
 it('rejects stale versions instead of returning a different clip',async()=>{expect((await GET(new Request('https://mall.test/api/product-films/'+films[0].id+'?v=old'),{params:Promise.resolve({id:films[0].id})})).status).toBe(404);});
 it('answers approved HEAD byte probes without upstream access',async()=>{const r=await GET(new Request('https://mall.test/api/product-films/'+films[0].id,{method:'HEAD',headers:{Range:'bytes=0-1'}}),{params:Promise.resolve({id:films[0].id})});expect(r.status).toBe(206);expect(r.headers.get('Content-Length')).toBe('2');});
});
