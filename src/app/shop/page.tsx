import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "全部商品" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const products = await getProducts();
  const { category } = await searchParams;
  const categories = [...new Set(products.map((product) => product.category))];
  const visible = category ? products.filter((product) => product.category === category) : products;

  return (
    <div className="shell page-space">
      <div className="page-intro"><span className="eyebrow">SUNTV SELECTION</span><h1>阳光严选</h1><p>不追求无穷货架。先把值得讲、值得看、值得买的产品放到镜头前。</p></div>
      <nav className="filter-pills" aria-label="商品分类"><a className={!category ? "active" : ""} href="/shop">全部</a>{categories.map((item) => <a className={category === item ? "active" : ""} href={`/shop?category=${encodeURIComponent(item)}`} key={item}>{item}</a>)}</nav>
      <div className="results-line"><span>{visible.length} 件商品</span><span>价格以结账页为准</span></div>
      <div className="product-grid product-grid-wide">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </div>
  );
}
