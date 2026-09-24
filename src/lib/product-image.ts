import type {Product} from "@/types/commerce";
const artwork:Record<string,string>=Object.fromEntries(["tee","shirt","fan","tea","bag","earbuds"].map(name=>[`/demo/${name}.svg`,`/editorial/${name}.jpg`]));
export function productImage(product:Product){const source=product.images[0]?.sourceUrl;return source?(product.isDemo?artwork[source]??source:source):"/demo/product-placeholder.svg";}
