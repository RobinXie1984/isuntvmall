import {describe,it,expect} from 'vitest';
import {brandProducts,usableClip} from './brand-showcase';
import type {Product} from '@/types/commerce';
const p={id:'p',brand:'HONAYIN',isDemo:false,status:'published',nativeCatalogueEnabled:true,images:[{sourceUrl:'/products/muji-reviewed/honayin-b28-l26058.webp'}]} as Product;
describe('brand showcase publication boundaries',()=>{
 it('rejects demo, unpublished, unknown and imageless merchandise',()=>{expect(brandProducts([p,{...p,isDemo:true},{...p,status:'draft'},{...p,brand:'other'},{...p,images:[]},{...p,isDemo:undefined}], 'HONAYIN')).toEqual([p]);});
 it('accepts only a local reviewed short film under sixty seconds',()=>{const c={src:'/brand-clips/honayin.mp4',seconds:45,poster:'/x.jpg'};expect(usableClip(c)).toEqual(c);for(const bad of [{...c,seconds:60},{...c,seconds:0},{...c,src:'https://facebook.com/long-video'},{...c,src:'/brand-clips/../long.mp4'}])expect(usableClip(bad)).toBeNull();});
});
