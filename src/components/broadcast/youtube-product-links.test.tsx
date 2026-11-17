import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {YouTubeProductLinks} from './youtube-product-links';
import {youtubeProducts,youtubeProductSchema,youtubeProductUrl} from '@/lib/broadcasts/youtube-products';
describe('individual original YouTube links',()=>{
 it('uses only unique individual video IDs and four genuine UI translations',()=>{
  expect(youtubeProducts).toHaveLength(15);expect(new Set(youtubeProducts.map(v=>v.videoId)).size).toBe(15);
  for(const v of youtubeProducts){expect(youtubeProductSchema.safeParse(v).success).toBe(true);expect(youtubeProductUrl(v.videoId)).toMatch(/^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/);}
  for(const bad of ['@isuntvhk/streams','DBUBO5IRz38&list=bad','https://evil.test','../x'])expect(()=>youtubeProductUrl(bad)).toThrow();
 });
 it('keeps original long videos external, without embeds or media downloads',()=>{
  const html=renderToStaticMarkup(<YouTubeProductLinks locale="en"/>);
  expect((html.match(/target="_blank"/g)||[])).toHaveLength(15);expect(html).not.toContain('<iframe');expect(html).not.toContain('<video');expect(html).not.toContain('list=');expect(html).not.toContain('/streams');expect(html).toContain('source does not specify a brand');
 });
 it('shows only the matching brand on its homepage section',()=>{
  const html=renderToStaticMarkup(<YouTubeProductLinks locale="en" brand="MALOVE"/>);
  expect((html.match(/target="_blank"/g)||[])).toHaveLength(9);expect(html).not.toContain('ALLURA');expect(renderToStaticMarkup(<YouTubeProductLinks locale="en" brand="HONAYIN"/>)).toBe('');
 });
 it.each([['zh-Hant','羊毛披肩'],['zh-Hans','羊毛披肩'],['ja','ウールショール']] as const)('localizes %s without English operator copy',(locale,label)=>{const html=renderToStaticMarkup(<YouTubeProductLinks locale={locale}/>);expect(html).toContain(label);expect(html).not.toContain('Watch on YouTube');expect(html).not.toContain('Brand preview');});
});
