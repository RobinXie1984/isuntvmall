import {afterEach,describe,expect,it,vi} from 'vitest';
import {brandFilms,filmForBroadcast,validProductFilm,eligibleProductFilm} from './product-films';
import films from './product-films.json';
const f=films.find(film=>!film.standalone)!;
afterEach(()=>vi.unstubAllEnvs());
describe('short product film publication boundary',()=>{
 it('requires a bounded local film and a reviewable digest',()=>{
  expect(validProductFilm(f)).toBe(true);
  for(const bad of [{...f,seconds:60},{...f,seconds:0},{...f,seconds:NaN},{...f,src:'/brand-clips/../x.mp4'},{...f,src:'https://evil.test/x.mp4'},{...f,poster:'//evil.test/x.jpg'},{...f,sha256:'x'},{...f,reviewState:'automatic'}]) expect(validProductFilm(bad)).toBe(false);
 });
 it('cannot show unapproved films in production',()=>{
  vi.stubEnv('NODE_ENV','production');
  expect(eligibleProductFilm({...f,reviewState:'preview'},'production')).toBe(false);
  expect(eligibleProductFilm({...f,reviewState:'approved'},'production')).toBe(true);
  expect(filmForBroadcast({id:f.id,url:f.sourceUrl})).toEqual(f);
 });
 it('binds the film to the current broadcast source instead of just its ID',()=>{
  vi.stubEnv('NODE_ENV','development');
  expect(filmForBroadcast({id:f.id,url:f.sourceUrl})).toEqual(f);
  expect(filmForBroadcast({id:f.id,url:'https://www.facebook.com/reel/123/'})).toBeNull();
 });
 it('respects current visibility and source edits on the brand homepage',()=>{
  vi.stubEnv('NODE_ENV','development');
  expect(brandFilms(f.brand,[{id:f.id,url:f.sourceUrl,visible:true}])).toContainEqual(f);
  expect(brandFilms(f.brand,[{id:f.id,url:f.sourceUrl,visible:false}])).not.toContainEqual(f);
  expect(brandFilms(f.brand,[{id:f.id,url:'https://www.facebook.com/reel/123/',visible:true}])).not.toContainEqual(f);
  expect(brandFilms(f.brand)).not.toContainEqual(f);
 });
 it('shows an approved standalone film under its brand without a replay entry',()=>{
  vi.stubEnv('NODE_ENV','production');
  for(const brand of ['MALOVE','HONAYIN']) {
   const standalone=films.filter(film=>film.brand===brand&&film.standalone&&film.reviewState==='approved');
   expect(brandFilms(brand)).toEqual(standalone);
  }
 });
});
