/** Customer-facing groups retain the underlying merchandise categories. */
const commonGroups = [
  { id: 'footwear', label: ['Footwear', '鞋履', 'シューズ'] },
  { id: 'beauty', label: ['Beauty & hair care', '美容與護髮', '美容・ヘアケア'] },
  { id: 'food', label: ['Food & nutrition', '食品與營養', '食品・栄養'] },
  { id: 'home', label: ['Home & living', '家居生活', '暮らし'] },
] as const;
export const browseGroups = [
  { id: 'fashion', label: ['Fashion & accessories', '時尚與配飾', 'ファッション・アクセサリー'] },
  ...commonGroups,
] as const;
export type BrowseGroup = typeof browseGroups[number]['id'];
const fashionSubgroups = [
  { id: 'clothing', label: ['Clothing', '服裝', '衣料品'] },
  { id: 'bags', label: ['Bags', '手袋', 'バッグ'] },
  { id: 'accessories', label: ['Accessories', '配飾', 'アクセサリー'] },
] as const;
export const mallBrowseGroups = [...fashionSubgroups, ...commonGroups];
type Item = { category: string; title: string; titleZh?: string | null };
const members: Record<string, BrowseGroup> = {
  Apparel:'fashion', 'Bags & accessories':'fashion', Bags:'fashion', Accessories:'fashion', Travel:'fashion',
  Footwear:'footwear',
  'Beauty & personal care':'beauty', 'Hair care':'beauty',
  'Food & nutrition':'food', 'Food & beverages':'food',
  Lifestyle:'home', 'Home & Living':'home', Tableware:'home', 'Tea & coffee':'home', Tech:'home',
};
export function browseGroup(item: Item): BrowseGroup | undefined {
  if (item.category === 'Gifts') return /mooncake|tea|coffee|food|chocolate|cookie|cake|snack|月餅|茶|食品|餅|巧克力/i.test(`${item.title} ${item.titleZh ?? ''}`) ? 'food' : 'home';
  return members[item.category];
}

const bagTitle = /\b(?:bags?|handbags?|backpacks?|totes?|duffels?|holdalls?|rucksacks?|satchels?|clutches?)\b|手袋|手提包|手提袋|背包|背袋|斜挎包|斜孭袋|肩包|單肩包|单肩包|旅行袋|托特包|水桶包|腋下包/i;
const accessoryTitle = /\b(?:scarves|scarfs?|hats?|caps?|beanies?|belts?|gloves?|mittens?)\b|圍巾|围巾|頸巾|颈巾|方巾|鴨舌帽|鸭舌帽|棒球帽|毛線帽|毛线帽|漁夫帽|渔夫帽|手套|皮帶|皮带/i;
const bagAccessoryTitle = /\b(?:bag|handbag|backpack) straps?\b|包帶|包带|袋帶|袋带/i;

export function mallBrowseGroup(item: Item) {
  const group = browseGroup(item);
  if (group !== 'fashion') return group;
  if (item.category === 'Bags') return 'bags';
  if (item.category === 'Accessories') return 'accessories';
  const name = `${item.title} ${item.titleZh ?? ''}`;
  if (item.category === 'Apparel') return accessoryTitle.test(name) ? 'accessories' : 'clothing';
  return bagTitle.test(name) && !bagAccessoryTitle.test(name) ? 'bags' : 'accessories';
}

export function matchesBrowseCategory(item: Item, value: string | undefined): boolean {
  if (!value) return true;
  const subgroup = fashionSubgroups.find(g => value === `group-${g.id}`);
  if (subgroup) return mallBrowseGroup(item) === subgroup.id;
  const group = browseGroups.find(g => value === `group-${g.id}`);
  return group ? browseGroup(item) === group.id : item.category === value;
}
