import { describe, expect, it } from 'vitest';
import { browseGroup, matchesBrowseCategory } from './browse-categories';
describe('customer category groups', () => {
  it('groups related source categories and preserves legacy category links', () => {
    const hair = {category:'Hair care',title:'Shampoo'};
    expect(browseGroup(hair)).toBe('beauty');
    expect(matchesBrowseCategory(hair,'group-beauty')).toBe(true);
    expect(matchesBrowseCategory(hair,'Hair care')).toBe(true);
    expect(matchesBrowseCategory(hair,'Beauty & personal care')).toBe(false);
  });
  it('keeps gifts and new merchant categories browsable', () => {
    expect(browseGroup({category:'Gifts',title:'Lotus mooncake gift box'})).toBe('food');
    expect(browseGroup({category:'Gifts',title:'Ceramic gift'})).toBe('home');
    expect(browseGroup({category:'Other',title:'Special'})).toBeUndefined();
    expect(matchesBrowseCategory({category:'Other',title:'Special'},'Other')).toBe(true);
  });
});
