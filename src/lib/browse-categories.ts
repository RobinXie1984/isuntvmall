/** Customer-facing groups retain the underlying merchandise categories. */
export const browseGroups = [
  { id: 'fashion', label: ['Fashion & accessories', '時尚與配飾', 'ファッション・アクセサリー'] },
  { id: 'footwear', label: ['Footwear', '鞋履', 'シューズ'] },
  { id: 'beauty', label: ['Beauty & hair care', '美容與護髮', '美容・ヘアケア'] },
  { id: 'food', label: ['Food & nutrition', '食品與營養', '食品・栄養'] },
  { id: 'home', label: ['Home & living', '家居生活', '暮らし'] },
] as const;
export type BrowseGroup = typeof browseGroups[number]['id'];
type Item = { category: string; title: string; titleZh?: string | null };
const members: Record<string, BrowseGroup> = {
  Apparel:'fashion', 'Bags & accessories':'fashion', Travel:'fashion',
  Footwear:'footwear',
  'Beauty & personal care':'beauty', 'Hair care':'beauty',
  'Food & nutrition':'food', 'Food & beverages':'food',
  Lifestyle:'home', 'Home & Living':'home', Tableware:'home', 'Tea & coffee':'home', Tech:'home',
};
export function browseGroup(item: Item): BrowseGroup | undefined {
  if (item.category === 'Gifts') return /mooncake|tea|coffee|food|chocolate|cookie|cake|snack|月餅|茶|食品|餅|巧克力/i.test(`${item.title} ${item.titleZh ?? ''}`) ? 'food' : 'home';
  return members[item.category];
}
export function matchesBrowseCategory(item: Item, value: string | undefined): boolean {
  if (!value) return true;
  const group = browseGroups.find(g => value === `group-${g.id}`);
  return group ? browseGroup(item) === group.id : item.category === value;
}
