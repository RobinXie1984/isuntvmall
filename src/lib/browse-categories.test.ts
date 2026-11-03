import { describe, expect, it } from 'vitest';
import { browseGroup, browseGroups, matchesBrowseCategory } from './browse-categories';
import { translate } from './i18n';
describe('customer category groups', () => {
  it('groups related source categories and preserves legacy category links', () => {
    const hair = {category:'Hair care',title:'Shampoo'};
    expect(browseGroup(hair)).toBe('beauty');
    expect(matchesBrowseCategory(hair,'group-beauty')).toBe(true);
    expect(matchesBrowseCategory(hair,'Hair care')).toBe(true);
    expect(matchesBrowseCategory(hair,'Beauty & personal care')).toBe(false);
  });
  it('uses complete Simplified Chinese group labels', () => {
    const actual=browseGroups.map(g=>translate(g.label[0],g.label[1],'zh-Hans',g.label[2]));
    expect(actual).toEqual(['时尚与配饰','鞋履','美容与护发','食品与营养','家居生活']);
  });
  it('keeps gifts and new merchant categories browsable', () => {
    expect(browseGroup({category:'Gifts',title:'Lotus mooncake gift box'})).toBe('food');
    expect(browseGroup({category:'Gifts',title:'Ceramic gift'})).toBe('home');
    expect(browseGroup({category:'Other',title:'Special'})).toBeUndefined();
    expect(matchesBrowseCategory({category:'Other',title:'Special'},'Other')).toBe(true);
  });
});
