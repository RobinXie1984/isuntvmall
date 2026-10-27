import { describe, it, expect } from 'vitest';
import { weeklyPlan, validatePreparedCatalogue, applyExistingMetadata, queueSupplierPhoto, cents, auditSourcePrices, priceReviewFingerprint } from './suntvmall-weekly.mjs';
const source = { id: 1, handle: 'test-product', title: 'Test', body_html: 'Plain', vendor: 'Test', updated_at: '2026-10-22', options: [{ name: 'Colour' }], variants: [{ id: 2, price: '10.00', option1: 'White', available: true }], images: [{ id: 3, src: 'https://cdn.shopify.com/original.jpg' }] };
const copy = { en: 'White', 'zh-Hant': '白色', 'zh-Hans': '白色', ja: '白' };
const entry = { id: 'product', sku: 'SUNTV-1', sourceId: '1', sourceHandle: 'test-product', title: copy, description: copy, priceAmount: 1000, reviewedImageName: 'approved.webp', variants: [{ id: '2', priceAmount: 1000, available: true, options: [copy] }] };
const catalogue = { snapshotAt: '2026-10-22', products: [entry] };
const feed = products => ({ products });
const receipt = (product, date='2026-10-26', decision='source-listed') => ({sourceId:String(product.id),variantId:String(product.variants[0].id),decision,checkedAt:date,currency:'HKD',sourceUrl:`https://www.suntvmall.com/products/${product.handle}?variant=${product.variants[0].id}`,fingerprint:priceReviewFingerprint(product,product.variants[0]),evidenceSha256:'a'.repeat(64),explanation:'Archived exact option on the source page; reviewed its amount and context.'});
describe('weekly source sync and photo gate', () => {
  it('keeps uncertainty across runs and requires evidence before accepting a corrected source price', () => {
    const shoe = {...source, variants:[{...source.variants[0],price:'19.99'}]};
    const prepared = { ...catalogue, products:[{...entry,category:'Footwear',priceAmount:99999,variants:[{...entry.variants[0],priceAmount:99999,priceIsPlaceholder:true}]}] };
    const result=weeklyPlan(feed([shoe]),feed([shoe]),prepared,'2026-10-26');
    expect(result.metadata.products[0].priceAmount).toBe(99999);
    expect(result.metadata.products[0].variants[0].priceIsPlaceholder).toBe(true);
    expect(validatePreparedCatalogue(prepared,result.metadata,feed([shoe])).approvedMediaUnchanged).toBe(true);
    const bypass=structuredClone(prepared); bypass.products[0].variants[0].priceAmount=1999; bypass.products[0].priceAmount=1999;
    expect(()=>validatePreparedCatalogue(prepared,bypass,feed([shoe]))).toThrow('SOURCE_PRICE_MISMATCH');
    const fixed={...shoe,variants:[{...shoe.variants[0],price:'698.00'}]};
    expect(weeklyPlan(feed([shoe]),feed([fixed]),prepared,'2026-11-02').metadata.products[0].priceAmount).toBe(99999);
    const reviews=[receipt(fixed,'2026-11-02')];
    const updated=weeklyPlan(feed([shoe]),feed([fixed]),prepared,'2026-11-02',reviews).metadata;
    expect(updated.products[0].variants[0]).toMatchObject({priceAmount:69800,priceIsPlaceholder:false});
    expect(validatePreparedCatalogue(prepared,updated,feed([fixed]),reviews).products).toBe(1);
  });
  it.each(['Food & nutrition','Beauty & personal care','Bags & accessories'])('marks unverified 19.99 prices in %s as demo and preserves proper prices', category => {
    const next={...source,variants:[{...source.variants[0],price:'19.99'}]};
    const prepared={...catalogue,products:[{...entry,category}]};
    const result=weeklyPlan(feed([source]),feed([next]),prepared,'2026-10-26').metadata;
    expect(result.products[0].variants[0]).toMatchObject({priceAmount:99999,priceIsPlaceholder:true});
    expect(validatePreparedCatalogue(prepared,result,feed([next])).products).toBe(1);
    expect(weeklyPlan(feed([source]),feed([source]),prepared,'2026-11-02').metadata.products[0].priceAmount).toBe(1000);
  });
  it('updates exact prices without changing approved media or mutating inputs', () => {
    const next = structuredClone(source); next.variants[0].price = '12.34'; next.images[0].src = 'https://cdn.shopify.com/new.jpg';
    const result = weeklyPlan(feed([source]), feed([next]), catalogue, '2026-10-26', [receipt(next)]);
    expect(result.metadata.products[0].priceAmount).toBe(1234); expect(result.metadata.products[0].reviewedImageName).toBe('approved.webp');
    expect(result.changes[0]).toMatchObject({ imageReview: true, publishImage: false }); expect(entry.priceAmount).toBe(1000);
  });
  it('is a no-op for unchanged source and holds new options for translation', () => {
    expect(weeklyPlan(feed([source]), feed([source]), catalogue, '2026-10-26').changes).toEqual([]);
    const next = structuredClone(source); next.variants[0].option1 = 'Blue';
    expect(weeklyPlan(feed([source]), feed([next]), catalogue, '2026-10-26').changes[0].copyReview).toBe(true);
  });
  it('does not publish new products or remove missing ones', () => {
    const next = { ...source, id: 4, variants: [{ ...source.variants[0], id: 5 }] };
    const result = weeklyPlan(feed([source]), feed([next]), catalogue, '2026-10-26');
    expect(result.changes[0]).toMatchObject({ kind: 'new', publish: false, imageReview: true });
    expect(result.missing).toEqual(['1']); expect(result.metadata.products).toHaveLength(1);
  });
  it('rejects incomplete feeds, duplicate IDs and malformed prices', () => {
    expect(() => weeklyPlan(feed([source]), feed([]), catalogue, 'x')).toThrow();
    expect(() => weeklyPlan(feed([source]), feed([source,source]), catalogue, 'x')).toThrow();
    for (const bad of ['NaN','-1','1.001','0']) expect(() => cents(bad)).toThrow();
  });
  it('prevents an automated refresh from replacing approved images or inventing prices', () => {
    expect(validatePreparedCatalogue(catalogue,catalogue,feed([source])).approvedMediaUnchanged).toBe(true);
    const changed=structuredClone(catalogue); changed.products[0].reviewedImageName='supplier.webp';
    expect(()=>validatePreparedCatalogue(catalogue,changed,feed([source]))).toThrow('IDENTITY_OR_APPROVED_MEDIA_CHANGED');
    changed.products[0].reviewedImageName='approved.webp'; changed.products[0].variants[0].priceAmount=1;
    expect(()=>validatePreparedCatalogue(catalogue,changed,feed([source]))).toThrow('SOURCE_PRICE_MISMATCH');
  });
  it('preserves colleague edits and image visibility in audited metadata updates', async () => {
    const calls = []; const db = { rpc: async (name,args) => { calls.push([name,args]); return { data: { revision: 8 } }; } };
    const current = { id: 'product', sku: 'SUNTV-1', revision: 7, baseRevision: 2, draftState: 'published', supplier: { name: 'Kept' }, payload: { title: 'Colleague title', titleZh: '白色', description: 'White', descriptionZh: '白色', priceAmount: 1000, status: 'published', visibleImageIds: ['approved-image'], isDemo: false } };
    await applyExistingMetadata(db, 'actor', current, entry, { ...entry, priceAmount: 1234 });
    expect(calls[0][1].p_payload).toMatchObject({ title: 'Colleague title', priceAmount: 1234, visibleImageIds: ['approved-image'], status: 'published' });
    expect(calls.map(c=>c[0])).toEqual(['merchandise_save','merchandise_publish']);
    calls.length = 0; expect((await applyExistingMetadata(db,'actor',{...current,draftState:'draft'},entry,entry)).status).toBe('held'); expect(calls).toEqual([]);
  });

  it('requires a review for every changed amount and cannot silently drop a hold on the next run',()=>{
    const next={...source,variants:[{...source.variants[0],price:'12.34'}]};
    const plan=weeklyPlan(feed([source]),feed([next]),catalogue,'2026-10-26');
    expect(plan.priceAudit[0]).toMatchObject({priceAmount:99999,priceIsPlaceholder:true,reasons:['CHANGED_PRICE']});
    expect(validatePreparedCatalogue(catalogue,plan.metadata,feed([next])).products).toBe(1);
    const later=weeklyPlan(feed([next]),feed([next]),plan.metadata,'2026-11-02');
    expect(later.changes).toEqual([]);expect(later.priceAudit[0].priceIsPlaceholder).toBe(true);
    const bypass=structuredClone(later.metadata);bypass.products[0].priceAmount=1234;bypass.products[0].variants[0]={...bypass.products[0].variants[0],priceAmount:1234,priceIsPlaceholder:false};
    expect(()=>validatePreparedCatalogue(plan.metadata,bypass,feed([next]))).toThrow('SOURCE_PRICE_MISMATCH');
  });
  it('audits new variants and blocks publication of an unreviewed prepared selling price',()=>{
    const next={...source,id:4,handle:'new-product',variants:[{...source.variants[0],id:5,price:'80.00'}]};
    const f=feed([source,next]);const plan=weeklyPlan(feed([source]),f,catalogue,'2026-10-26');
    expect(plan.priceAudit.find(v=>v.variantId==='5')).toMatchObject({priceAmount:99999,priceIsPlaceholder:true,reasons:['NEW_VARIANT']});
    const prepared={...plan.metadata,products:[entry,{...entry,id:'new',sku:'SUNTV-4',sourceId:'4',sourceHandle:'new-product',reviewedImageName:'',priceAmount:8000,variants:[{...entry.variants[0],id:'5',priceAmount:8000}]}]};
    expect(()=>validatePreparedCatalogue(catalogue,prepared,f)).toThrow('SOURCE_PRICE_MISMATCH');
    expect(validatePreparedCatalogue(catalogue,prepared,f,[receipt(next)]).products).toBe(2);
  });
  it('rejects stale, wrong-option, wrong-amount, wrong-site and incomplete review receipts',()=>{
    const next={...source,variants:[{...source.variants[0],price:'30.00'}]};const valid=receipt(next);
    for(const patch of [{checkedAt:'2026-10-19'},{fingerprint:'b'.repeat(64)},{variantId:'999'},{sourceId:'999'},{currency:'USD'},{sourceUrl:'https://example.com/product'},{evidenceSha256:''},{explanation:''},{decision:'approved'}]){
      expect(auditSourcePrices(catalogue,feed([next]),'2026-10-26',[{...valid,...patch}])[0].priceIsPlaceholder).toBe(true);
    }
    expect(auditSourcePrices(catalogue,feed([next]),'2026-10-26',[valid,valid])[0].priceIsPlaceholder).toBe(true);
    expect(auditSourcePrices(catalogue,feed([next]),'2026-10-26',[valid])[0].priceIsPlaceholder).toBe(false);
  });
  it('keeps generic 19.99 blocked even with a source-page receipt',()=>{
    const next={...source,variants:[{...source.variants[0],price:'19.99'}]};
    expect(auditSourcePrices(catalogue,feed([next]),'2026-10-26',[receipt(next)])[0].priceIsPlaceholder).toBe(true);
  });
  it('can mark an unchanged suspicious amount unverified and schedules the label correction',()=>{
    const plan=weeklyPlan(feed([source]),feed([source]),catalogue,'2026-10-26',[receipt(source,'2026-10-26','unverified')]);
    expect(plan.changes[0]).toMatchObject({metadataChanged:true,priceReview:true});
    expect(plan.metadata.products[0].priceAmount).toBe(99999);
    expect(validatePreparedCatalogue(catalogue,plan.metadata,feed([source]),[receipt(source,'2026-10-26','unverified')]).products).toBe(1);
  });
  it('records large changes and token prices for contextual investigation',()=>{
    for(const value of ['1.00','4.00','20.00']){
      const next={...source,variants:[{...source.variants[0],price:value}]};const audit=auditSourcePrices(catalogue,feed([next]),'2026-10-26')[0];
      expect(audit.priceIsPlaceholder).toBe(true);expect(audit.reasons).toContain('LARGE_PRICE_CHANGE');
      if(value==='1.00')expect(audit.reasons).toContain('TOKEN_PRICE');
    }
  });
  it('does not allow absent source rows to lose their uncertainty flags',()=>{
    const other={...source,id:4,variants:[{...source.variants[0],id:5}]};
    const held={...catalogue,products:[{...entry,priceAmount:99999,variants:[{...entry.variants[0],priceAmount:99999,priceIsPlaceholder:true}]}]};
    const bypass=structuredClone(held);bypass.products[0]=entry;
    expect(()=>validatePreparedCatalogue(held,bypass,feed([other]))).toThrow('MISSING_SOURCE_PRICE_CHANGE');
  });
  it('queues supplier photos only in private storage without approving or publishing', async () => {
    const calls = []; const bytes = Buffer.from('source-test-bytes');
    const db = { rpc: async (name,args) => { calls.push([name,args]); return { data: name==='batch_create'?'batch':{} }; }, from:()=>({select:()=>({eq:async()=>({data:[{id:'item',original_path:'private/original',status:'awaiting_upload',revision:1}]})})}), storage: { from: bucket => { expect(bucket).toBe('batch-originals'); return { upload: async()=>({}), download:async()=>({data:new Blob([bytes])}) }; } } };
    const result=await queueSupplierPhoto({db,actor:'actor',productId:'product',sourceId:'1',filename:'photo.jpg',mime:'image/jpeg',bytes,preset:{id:'muji'}});
    expect(calls.map(c=>c[0])).toEqual(['batch_create','batch_finalize']); expect(result.publicImageChanged).toBe(false);
  });
});
