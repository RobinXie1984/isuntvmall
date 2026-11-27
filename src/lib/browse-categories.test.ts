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
  it('separates bags and accessories without breaking the combined category URL', () => {
    const bag = { category: 'Bags & accessories', title: 'HONAYIN 牛皮托特包' };
    const scarf = { category: 'Bags & accessories', title: 'Cashmere scarf' };
    const strap = { category: 'Accessories', title: 'Replacement bag strap' };
    expect(matchesBrowseCategory(bag, 'group-bags')).toBe(true);
    expect(matchesBrowseCategory(bag, 'group-accessories')).toBe(false);
    for (const accessory of [scarf, strap]) {
      expect(matchesBrowseCategory(accessory, 'group-accessories')).toBe(true);
      expect(matchesBrowseCategory(accessory, 'group-bags')).toBe(false);
    }
    expect(matchesBrowseCategory(bag, 'Bags & accessories')).toBe(true);
    expect(matchesBrowseCategory(scarf, 'group-fashion')).toBe(true);
    expect(matchesBrowseCategory({ ...strap, category: 'Bags & accessories' }, 'group-accessories')).toBe(true);
    expect(matchesBrowseCategory({ category: 'Apparel', title: '連帽外套' }, 'group-clothing')).toBe(true);
  });
});
