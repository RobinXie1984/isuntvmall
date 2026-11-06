import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {LocaleProvider} from '@/components/i18n/locale-provider';
import {ShopifyImportWizard,ShopifyImportButton} from '@/components/batch/shopify-import-wizard';

it('provides an accessible localized separate file step with template and no mutation action',()=>{
 for(const locale of ['en','zh-Hant','zh-Hans','ja'] as const){
  const html=renderToStaticMarkup(<LocaleProvider initialLocale={locale}><ShopifyImportWizard actor="operator@example.com" onClose={()=>{}}/></LocaleProvider>);
  expect(html).toContain('<dialog');expect(html).toContain('aria-labelledby=');expect(html).toContain('/batch-product-template.csv');expect(html).toContain('accept=".csv,.xlsx');expect(html).toContain('type="file"');expect(html).not.toContain('type="submit"');expect(html).not.toContain('name="title"');
  expect(html).toContain(locale==='en'?'Upload file':locale==='ja'?'ファイルをアップロード':locale==='zh-Hans'?'上传档案':'上傳檔案');
 }
});
it('keeps the entry button small and the modal closed until operator action',()=>{
 const html=renderToStaticMarkup(<LocaleProvider initialLocale="en"><ShopifyImportButton actor="operator@example.com"/></LocaleProvider>);
 expect(html).toContain('>Import</button>');expect(html).not.toContain('<dialog');
});
