// Studio-only use of the already-authorized batch runtime. Never transfers credentials.
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';import {createRequire} from 'node:module';import path from 'node:path';
const project='/Users/headlessnick/RobinOS2/12_ventures/isuntvmall',destination=path.resolve(process.argv[2]||'.');if(!destination.startsWith(project+'/candidates/'))throw Error('PRIVATE_CANDIDATE_REQUIRED');
const file=project+'/runtime/batch-worker/server.env.json',stat=lstatSync(file);if(stat.isSymbolicLink()||(stat.mode&0o077)!==0||stat.uid!==process.getuid())throw Error('PRIVATE_CONFIG_PERMISSIONS');
const config=JSON.parse(readFileSync(file));if(config.SUPABASE_URL!=='https://fikmqessuraosgoyxede.supabase.co')throw Error('WRONG_PROJECT');
const {createClient}=createRequire(project+'/package.json')('@supabase/supabase-js');const db=createClient(config.SUPABASE_URL,config.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error)throw Error(r.error.code||'DATABASE_QUERY_FAILED');return r.data;};
const members=checked(await db.from('staff_members').select('user_id,role,active').eq('active',true));let actor;
for(const s of members.filter(s=>['business_super_admin','super_admin'].includes(s.role))){const r=await db.auth.admin.getUserById(s.user_id);if(r.error)throw Error('ACTOR_LOOKUP_FAILED');if(r.data.user.email==='nanobin@tideisun.com'){actor=s.user_id;break;}}
if(!actor)throw Error('AUTHORIZED_BUSINESS_ACTOR_UNAVAILABLE');
const rows=async(table,select)=>{const all=[];for(let offset=0;;offset+=500){const page=checked(await db.from(table).select(select).order('id').range(offset,offset+499));all.push(...page);if(page.length<500)return all;}};
const products=await rows('products','id,sku,slug,status,catalog_revision,native_catalogue_enabled');const variants=await rows('product_variants','id,product_id,source_index,sku,option_values,stock_qty,proposed_price_amount,price_amount,price_is_placeholder,active,revision,option_labels');
writeFileSync(path.join(destination,'database-review-context.json'),JSON.stringify({actor,products,variants},null,2),{mode:0o600});console.log(JSON.stringify({products:products.length,variants:variants.length,actorVerified:true,mutations:false}));
