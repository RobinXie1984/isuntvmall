import {expect,it,vi} from 'vitest';import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:()=>{}})}));
import {BatchWorkspace} from '@/components/batch/batch-workspace';import {LocaleProvider} from '@/components/i18n/locale-provider';
const id='11111111-1111-4111-8111-111111111111';
it('opens native variant review directly from a product-specific photo link in all four languages',()=>{for(const locale of ['en','zh-Hant','zh-Hans','ja'] as const){const html=renderToStaticMarkup(<LocaleProvider initialLocale={locale}><BatchWorkspace role="merchandise_admin" initialNativeProductId={id} initialBatch={id}/></LocaleProvider>);expect(html).toContain('batch-history');expect(html).toContain(locale==='en'?'Variant draft details':locale==='ja'?'種類の下書き':locale==='zh-Hans'?'规格草稿资料':'規格草稿資料');expect(html).not.toContain('Approve verified price');}});
it('does not show native variant review for an ordinary non-migrated product',()=>{const html=renderToStaticMarkup(<LocaleProvider initialLocale="en"><BatchWorkspace role="merchandise_admin"/></LocaleProvider>);expect(html).not.toContain('Variant draft details');});
