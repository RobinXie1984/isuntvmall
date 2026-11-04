// Run on iMac only after approval to use the existing isolated Sandbox key.
// Reads one owner-only key file; never copies it to Studio, logs, or source.
import {readFileSync,statSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import profile from '../../config/isuntvmall.json' with {type:'json'};
const keyFile=process.argv[2];assert(keyFile,'Supply the approved private Sandbox key file path');
assert.equal(statSync(keyFile).mode&0o077,0,'Key file must be owner-only');
const key=readFileSync(keyFile,'utf8').trim();assert.match(key,/^(sk|rk)_test_[A-Za-z0-9]+$/);
const stripe=new Stripe(key,{apiVersion:'2026-10-28.endive'});
const account=await stripe.accounts.retrieve(null);
assert.equal(account.id,'acct_1UVopWQ0fHQKbZbH','Unexpected Sandbox account');
const copy=Object.fromEntries(['en','zh-Hant','zh-Hans','ja'].map(k=>[k,'Sandbox test only. No real sale, shipment, or customer data.']));
const fixtureProfile={...profile,id:'isuntvmall-stripe-sandbox',name:'iSunTVMall Sandbox',origin:'http://127.0.0.1:3031',catalogueMode:'merchant',indexing:'noindex',collections:{supplierDemo:false,holidays:false,suntvmall:false},policies:{merchantName:'iSunTVMall Sandbox test fixture',contactEmail:'sandbox@example.com',contactAddress:copy,shipping:copy,returns:copy,privacy:copy,terms:copy}};
const base={...process.env,STRIPE_MODE:'test',STRIPE_ACCOUNT_ID:account.id,STRIPE_SECRET_KEY:key,SUPABASE_URL:'http://127.0.0.1:54331',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-key',NEXT_PUBLIC_SITE_URL:fixtureProfile.origin,NEXT_PUBLIC_STORE_PROFILE:JSON.stringify(fixtureProfile),CHECKOUT_RELEASE_APPROVED:'true',STRIPE_REFUNDS_ENABLED:'false',STRIPE_SHIPPING_RATE_ID:'',STRIPE_PAYMENT_METHOD_CONFIGURATION:'',STRIPE_AUTOMATIC_TAX:'false',STRIPE_ALLOWED_SHIPPING_COUNTRIES:'HK',TURNSTILE_SITE_KEY:'fixture-harness-not-a-widget',TURNSTILE_SECRET_KEY:'fixture-harness-not-a-widget',CHECKOUT_CLIENT_HASH_SECRET:'fixture-harness-identity-test-only-20261102'};
const listener=spawn('npm',['exec','--yes','--package=@stripe/cli@1.55.6','--','stripe','listen','--latest','--events-from','@self','--events','checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed','--forward-to','http://127.0.0.1:3031/api/stripe/webhook'],{env:{...process.env,STRIPE_API_KEY:key},stdio:['ignore','pipe','pipe'],detached:true});
let app,output='',started=false;
function consume(chunk){output=(output+chunk.toString()).slice(-16000);const secret=output.match(/whsec_[A-Za-z0-9]+/)?.[0];if(secret&&!started){started=true;app=spawn('npm',['exec','--yes','--package=tsx@4.23.15','--','tsx','--conditions=react-server','scripts/stripe-sandbox/serve.ts'],{env:{...base,STRIPE_WEBHOOK_SECRET:secret},stdio:'inherit',detached:true});app.on('exit',()=>stopGroup(listener));console.log('Verified Sandbox account; local signed webhook listener ready.');}/* Raw CLI output may contain the signing secret: do not print it. */}
listener.stdout.on('data',consume);listener.stderr.on('data',consume);
listener.on('exit',code=>{if(!started)console.error('Sandbox webhook listener did not start. Exit:',code);if(app)stopGroup(app);});
function stopGroup(child){if(!child?.pid)return;try{process.kill(-child.pid,'SIGTERM');}catch{/* Already stopped. */}}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopGroup(app);stopGroup(listener);});
