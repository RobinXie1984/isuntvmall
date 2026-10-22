import type { Product } from '@/types/commerce';
import { productImage } from '@/lib/product-image';
// A reversible viewport crop: the original image pixels and labels are intact.
export function SourcePhoto({product,alt,lazy=false}:{product:Product;alt:string;lazy?:boolean}) {
 const crop=product.sourceListing?.photoCrop;
 if(!crop)return <span className="source-photo"><img src={productImage(product)} alt={alt} loading={lazy?'lazy':undefined}/></span>;
 const scale=800/Math.max(crop.width,crop.height),w=crop.width*scale,h=crop.height*scale;
 return <span className="source-photo"><span className="source-photo-crop" style={{left:`${(1000-w)/20}%`,top:`${(1000-h)/20}%`,width:`${w/10}%`,height:`${h/10}%`}}><img src={productImage(product)} alt={alt} loading={lazy?'lazy':undefined} style={{width:`${crop.imageWidth/crop.width*100}%`,height:`${crop.imageHeight/crop.height*100}%`,left:`${-crop.x/crop.width*100}%`,top:`${-crop.y/crop.height*100}%`}}/></span></span>;
}
