import { NextResponse, type NextRequest } from 'next/server';
import { productRedirect } from '@/lib/product-redirect';
import { LOCALES, type Locale } from '@/lib/i18n';
export async function proxy(request:NextRequest) {
 const path=request.nextUrl.pathname,headers=new Headers(request.headers);
 // Never trust an inbound locale header, and don't change API/payment routing.
 headers.delete('x-mall-product-locale');
 if(path.startsWith('/product/')) {
  let slug:string;try{slug=decodeURIComponent(path.slice('/product/'.length));}catch{return new NextResponse('Not found',{status:404});}
  const target=await productRedirect(slug),url=request.nextUrl.clone();
  const raw=url.searchParams.get('locale'),locale=LOCALES.includes(raw as Locale)?raw as Locale:'en';
  if(target)url.pathname=`/product/${encodeURIComponent(target)}`;
  if(locale==='en')url.searchParams.delete('locale');
  else url.searchParams.set('locale',locale);
  if(target || (raw!==null && (raw!==locale || locale==='en')) || request.nextUrl.searchParams.getAll('locale').length>1)return NextResponse.redirect(url,301);
  headers.set('x-mall-product-locale',locale);
 }
 const response=NextResponse.next({request:{headers}});
 if(/^\/(?:admin|cart|checkout|success|studio|batch-helper|api)(?:\/|$)/.test(path))response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
export const config={matcher:['/product/:path*','/admin/:path*','/cart','/checkout/:path*','/success','/studio/:path*','/batch-helper/:path*','/api/:path*']};
