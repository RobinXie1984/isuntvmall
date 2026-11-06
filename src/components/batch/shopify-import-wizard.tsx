'use client';
import Link from 'next/link';
import {useEffect,useId,useRef,useState} from 'react';
import {useLocale} from '@/components/i18n/locale-provider';
import {readProductSpreadsheet} from '@/lib/batch/product-spreadsheet';
import {confirmProductImport,importPost,plainSourceText,prepareProductImport,safeImportCode,type PreparedProductImport,type ProductImportResult} from '@/lib/batch/import-wizard';
import styles from './shopify-import-wizard.module.css';

type Props={actor:string;disabled?:boolean;preview?:boolean;onPrepared?:(prepared:PreparedProductImport)=>void;onImported?:()=>void};
export function ShopifyImportButton(props:Props){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <><button type="button" className="button button-secondary" disabled={props.disabled} onClick={()=>setOpen(true)}>{t('Import','匯入','インポート')}</button>{open&&<ShopifyImportWizard {...props} onClose={()=>setOpen(false)}/>}</>;
}

export function ShopifyImportWizard({actor,preview=false,onPrepared,onImported,onClose}:Props&{onClose:()=>void}){
 const {t}=useLocale();const heading=useId(),description=useId();const dialog=useRef<HTMLDialogElement>(null),headingElement=useRef<HTMLHeadingElement>(null),fileInput=useRef<HTMLInputElement>(null),generation=useRef(0),inFlight=useRef(false);
 const [step,setStep]=useState<'file'|'preview'|'importing'|'results'>('file');
 const [file,setFile]=useState<File|null>(null),[prepared,setPrepared]=useState<PreparedProductImport|null>(null),[reading,setReading]=useState(false),[error,setError]=useState('');
 const [results,setResults]=useState<ProductImportResult[]>([]),[receipt,setReceipt]=useState('');
 const busy=reading||step==='importing';
 useEffect(()=>{const guard=generation;const focused=document.activeElement;const current=dialog.current;if(current&&!current.open)current.showModal();return()=>{guard.current++;current?.close();if(focused instanceof HTMLElement)focused.focus();};},[]);
 useEffect(()=>{if(dialog.current)dialog.current.scrollTop=0;if(step==='preview'||step==='results')headingElement.current?.focus({preventScroll:true});},[step]);
 useEffect(()=>{if(step!=='importing')return;const handler=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[step]);
 function close(){if(!inFlight.current){generation.current++;onClose();}}
 function choose(next?:File){if(inFlight.current||!next)return;generation.current++;setFile(next);setPrepared(null);setError('');setStep('file');}
 async function upload(){
  if(!file||inFlight.current)return;inFlight.current=true;setReading(true);setError('');const token=++generation.current;
  try{const parsed=prepareProductImport(await readProductSpreadsheet(file),file.name);if(token===generation.current){setPrepared(parsed);onPrepared?.(parsed);setStep('preview');}}
  catch(error){if(token===generation.current)setError(safeImportCode(error));}
  finally{inFlight.current=false;if(token===generation.current)setReading(false);}
 }
 async function confirm(){
  if(!prepared||inFlight.current||preview)return;inFlight.current=true;setStep('importing');setError('');setResults([]);
  try{
   const outcome=await confirmProductImport(prepared,actor,importPost,(next,batch)=>{setResults(next);if(batch)setReceipt(batch);},async(batch,handle)=>{
    const media=await importPost('/api/admin/shopify-stage/media',{batch,handle});
    if(!Array.isArray(media.batches)||media.batches.some(value=>typeof value!=='string')||['queued','existing','held','failed'].some(key=>!Number.isSafeInteger(media[key])||Number(media[key])<0))throw Error('MEDIA_RECEIPT_MISSING');
    return {batches:media.batches as string[],queued:Number(media.queued),existing:Number(media.existing),held:Number(media.held),failed:Number(media.failed)};
   });
   setResults(outcome.results);setReceipt(outcome.batch);setStep('results');onImported?.();
  }catch(error){setError(safeImportCode(error));setStep('results');}
  finally{inFlight.current=false;}
 }
 const codeText=(code:string)=>{
  if(code==='NOT_ATTEMPTED')return t('Not attempted: import paused after an unconfirmed request or access problem. Retry the same file after checking your connection and sign-in; completed drafts are retained.','尚未嘗試：因請求未能確認或存取問題而暫停。請檢查連線及登入後重試相同檔案；已完成草稿會保留。','未処理：リクエスト未確認またはアクセス問題により取込を停止しました。接続とログインを確認し、同じファイルで再試行してください。完了済みの下書きは保持されます。');
  if(['CONNECTION_UNCONFIRMED','IMPORT_RECEIPT_MISSING','MEDIA_RECEIPT_MISSING'].includes(code))return t('This request could not be confirmed. Import stopped so no more products are attempted. The server may have saved this item; retry the same file to safely recover its receipt.','未能確認此請求，匯入已停止，不會再嘗試其餘商品。伺服器可能已儲存此項目；請重試相同檔案，安全復原收據。','このリクエストを確認できません。以降の商品処理は停止しました。この項目はサーバーに保存済みの場合があります。同じファイルで安全に受付情報を復元してください。');
  if(code==='IMPORT_RATE_LIMITED')return t('The service is busy. Import stopped; wait briefly, then retry the same file.','服務繁忙，匯入已停止。請稍候再重試相同檔案。','サービスが混雑しているため取込を停止しました。少し待って同じファイルで再試行してください。');
  if(code==='IMPORT_TOO_LARGE')return t('This file exceeds the private import capacity (200 KB per product or 4 MB of prepared data). Split the file or shorten large source fields, then upload again.','此檔案超出私人匯入容量（每件商品 200 KB 或整體處理資料 4 MB）。請分拆檔案或縮短過大的來源欄位，再重新上傳。','非公開取込の上限（商品ごと200 KB、準備済みデータ全体4 MB）を超えています。ファイルを分割するか大きな元項目を短くして再アップロードしてください。');
  if(code==='DUPLICATE_SKU')return t('A SKU occurs more than once. Correct duplicate SKUs before importing.','有重複的貨號，請先修正後再匯入。','SKUが重複しています。修正してから取り込んでください。');
  if(code==='DUPLICATE_OPTIONS')return t('Two variants have the same options. Give each variant a unique option combination.','有兩個規格的選項完全相同，請確保每個規格的選項組合不同。','同じ選択肢の種類があります。種類ごとに異なる組合せにしてください。');
  if(code==='CONFLICTING_PRODUCT')return t('One handle has different product titles. Correct the conflicting rows.','同一商品代稱出現不同品名，請修正有衝突的列。','同じハンドルに異なる商品名があります。該当行を修正してください。');
  if(code==='NO_VARIANTS')return t('Each product needs at least one variant row with a SKU or source price.','每件商品至少需要一列包含貨號或來源價格的規格。','各商品にSKUまたは元価格を含む種類の行が1つ以上必要です。');
  if(['SOURCE_CONFLICT','EXISTING_PRODUCT_CONFLICT','SOURCE_IDENTITY_CONFLICT','STALE_REVISION'].includes(code))return t('Held: an existing product or colleague edit needs review. Keep its handle and ask a Business Super Admin to resolve the conflict.','暫緩：現有商品或同事修改需要核對。請保留商品代稱，交由業務超級管理員處理衝突。','保留：既存商品または他の編集の確認が必要です。ハンドルを変えず、業務最高管理者に確認を依頼してください。');
  if(['SIGN_IN_REQUIRED','STAFF_UNAUTHENTICATED','MFA_REQUIRED','STAFF_FORBIDDEN'].includes(code))return t('Sign in again, then retry the same file.','請重新登入，再重試相同檔案。','再ログインして同じファイルで再試行してください。');
  if(['INVALID_SHOPIFY_CSV','INVALID_SPREADSHEET','INVALID_INPUT'].includes(code))return t('Check the Shopify column headings and required Title/Handle. Use CSV or .xlsx, first worksheet only: 2 MB, 500 products, 10,000 rows; at most 1,000 variants and 250 image references per product.','請檢查 Shopify 欄名及必填的 Title／Handle。使用 CSV 或 .xlsx 第一張工作表：上限 2 MB、500 件商品、10,000 列；每件商品最多 1,000 個規格及 250 個圖片參照。','Shopify列名と必須のTitle/Handleを確認してください。CSVまたは.xlsxの最初のシート：2 MB、500商品、10,000行、各商品1,000種類・250画像参照までです。');
  return t('Could not confirm this step. Retry the same file; completed drafts keep their edits. If it repeats, share the receipt and code with a Business Super Admin.','未能確認此步驟。請重試相同檔案，已完成草稿會保留修改。如問題持續，請將收據編號及代碼交予業務超級管理員。','この処理を確認できません。同じファイルで再試行しても完了済みの編集は保持されます。繰り返す場合は受付番号とコードを業務最高管理者に伝えてください。');
 };
 const first=prepared?.payload.products[0];const imported=results.filter(r=>r.id).length,held=results.filter(r=>r.code||r.imageCode||r.imageHeld||r.imageFailed).length;
 return <dialog ref={dialog} className={styles.dialog} aria-labelledby={heading} aria-describedby={description} onCancel={event=>{event.preventDefault();close();}}>
  <header className={styles.header}><h2 ref={headingElement} tabIndex={-1} id={heading}>{step==='preview'?t('Preview your first product','預覽您的第一個商品','最初の商品をプレビュー'):step==='importing'?t('Importing products','正在匯入商品','商品を取込中'):step==='results'?t('Import results','匯入結果','取込結果'):t('Import products','匯入商品','商品をインポート')}</h2><button type="button" aria-label={t('Close import','關閉匯入','インポートを閉じる')} disabled={busy} onClick={close}>×</button></header>
  <div className={styles.body}>
   <p id={description} className={styles.muted}>{t('Choose file → Preview → Import products. MUJI photo review and business approval follow the import.','選擇檔案 → 預覽 → 匯入商品。匯入後仍須進行 MUJI 圖片審核及業務審批。','ファイルを選択 → プレビュー → 商品をインポート。取込後にMUJI画像審査と業務承認を行います。')}</p>
   {step==='file'&&<>
    <h3>{t('Bulk import with a CSV','透過 CSV 大量匯入','CSVで一括インポート')}</h3>
    <p>{t('Use a Shopify product export or our product template. Excel (.xlsx) is also supported.','可使用 Shopify 商品匯出檔或我們的商品範本，亦支援 Excel（.xlsx）。','Shopifyの商品エクスポートか商品テンプレートを使用します。Excel（.xlsx）にも対応しています。')}</p>
    <a className="text-link" href="/batch-product-template.csv" download>{t('Download a sample CSV','下載 CSV 範本','CSVサンプルをダウンロード')}</a>
    <div className={styles.dropzone} onDragOver={event=>{event.preventDefault();}} onDrop={event=>{event.preventDefault();if(event.dataTransfer.files.length!==1){setError('INVALID_SPREADSHEET');return;}choose(event.dataTransfer.files[0]);}}>
     {file&&<strong>{file.name}</strong>}
     <label>{file?t('Replace file','取代檔案','ファイルを変更'):t('Add file','上傳檔案','ファイルを追加')}<input ref={fileInput} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={event=>choose(event.target.files?.[0])}/></label>
     <p className={styles.muted}>{t('Or drop one file here. Maximum 2 MB; Excel uses the first worksheet.','或拖放一個檔案至此。上限 2 MB，Excel 只讀取第一張工作表。','1ファイルをここにドロップできます。上限2 MB、Excelは最初のシートのみです。')}</p>
    </div>
    {file&&<fieldset className={styles.policy}><legend>{t('Import options','匯入選項','インポート設定')}</legend><p><strong>{t('Keep existing products and colleague edits','保留現有商品及同事修改','既存商品と他の編集を保持')}</strong><br/>{t('Matching records are held for review; existing live content is never overwritten automatically.','相符記錄交由審核，不會自動覆寫現有公開內容。','一致する記録は審査に回し、公開内容を自動上書きしません。')}</p><p><strong>{t('Import new products as private drafts','將新商品匯入為私人草稿','新商品は非公開の下書きで取込')}</strong><br/>{t('Source prices, stock and photos require review. Nothing is published by this import.','來源價格、庫存及圖片均須審核，此匯入不會刊登商品。','元の価格・在庫・画像は確認が必要です。この取込では公開しません。')}</p></fieldset>}
   </>}
   {step==='preview'&&prepared&&first&&<>
    <p className={styles.summary}>{t(`${prepared.payload.products.length} products · ${prepared.payload.products.reduce((sum,p)=>sum+p.variants.length,0)} SKUs · ${prepared.payload.products.reduce((sum,p)=>sum+new Set([...p.images.map(i=>i.url),...p.variants.map(v=>v.imageUrl).filter(Boolean)]).size,0)} image references`,`${prepared.payload.products.length} 件商品 · ${prepared.payload.products.reduce((sum,p)=>sum+p.variants.length,0)} 個規格 · ${prepared.payload.products.reduce((sum,p)=>sum+new Set([...p.images.map(i=>i.url),...p.variants.map(v=>v.imageUrl).filter(Boolean)]).size,0)} 個圖片參照`,`${prepared.payload.products.length}商品 · ${prepared.payload.products.reduce((sum,p)=>sum+p.variants.length,0)} SKU · ${prepared.payload.products.reduce((sum,p)=>sum+new Set([...p.images.map(i=>i.url),...p.variants.map(v=>v.imageUrl).filter(Boolean)]).size,0)}画像参照`)}</p>
    <p>{t('This is a local preview. No product or image has been imported yet. Existing products will keep their current public content.','這是本機預覽，尚未匯入商品或圖片。現有商品的公開內容會保留。','これはローカルのプレビューです。商品・画像はまだ取り込まれていません。既存商品の公開内容は保持されます。')}</p>
    <dl className={styles.fields}>
     {[[t('Title','名稱','商品名'),first.title],[t('Description','說明','説明'),plainSourceText(first.source['Body (HTML)']||'')],[t('Status after import','匯入後狀態','取込後の状態'),t('New products: private draft; existing listings preserved','新商品：私人草稿；保留現有公開商品','新商品：非公開の下書き・既存の公開商品は保持')],[t('Product category','商品類別','商品カテゴリー'),first.source['Product Category']],[t('Product type','商品類型','商品タイプ'),first.source.Type],[t('Vendor','供應商','販売元'),first.source.Vendor]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}
    </dl>
    <h3>{t('Variants','規格','種類')}</h3><p className={styles.muted}>{t('Source values below are not approved selling prices or available stock. The draft keeps demo prices and unknown stock until reviewed.','下方來源數值並非已核准售價或可用庫存，草稿在審核前保留示範價格及未知庫存。','以下は元の参考値であり、承認済みの販売価格や利用可能在庫ではありません。審査まではデモ価格と在庫不明の状態を保持します。')}</p>
    <div className={styles.tableScroll}><table><thead><tr><th>{t('Variant','規格','種類')}</th><th>SKU</th><th>{t('Weight','重量','重量')}</th><th>{t('Source price · currency not verified','來源價格・幣別未核實','元価格・通貨未確認')}</th></tr></thead><tbody>{first.variants.map((variant,index)=><tr key={index}><td>{variant.options.map(o=>o.value).join(' / ')||t('Default','預設','標準')}</td><td>{variant.sku||'—'}</td><td>{variant.source['Variant Grams']?`${variant.source['Variant Grams']} g`:'—'}</td><td>{variant.price||'—'}</td></tr>)}</tbody></table></div>
    {prepared.payload.products.length>1&&<details><summary>{t('All products in this file','此檔案的全部商品','ファイル内の全商品')}</summary><ul>{prepared.payload.products.map(product=><li key={product.handle}>{product.title} · {product.variants.length} SKU</li>)}</ul></details>}
   </>}
   {step==='importing'&&prepared&&<div role="status"><progress max={prepared.payload.products.length} value={results.length}/><p>{t(`${results.length} of ${prepared.payload.products.length} products checked. Keep this page open.`, `已處理 ${results.length}／${prepared.payload.products.length} 件商品，請保持此頁開啟。`,`${prepared.payload.products.length}商品中${results.length}件を処理しました。このページを開いたままにしてください。`)}</p></div>}
   {step==='results'&&<section aria-live="polite"><h3>{!error&&held===0?t('Product drafts prepared','商品草稿已準備','商品の下書きを準備しました'):t('Import needs attention','匯入需跟進','取込内容の確認が必要です')}</h3><p>{t(`${imported} drafts prepared · ${held} need attention`,`${imported} 件草稿已準備 · ${held} 件需跟進`,`下書き${imported}件を準備 · ${held}件は要確認`)}</p><p>{t('Merchandise Admin: review product details, translations, prices, stock and prepared photos. Business Super Admin: complete MUJI photo review and final approval. New products stay private until approved; existing public listings remain unchanged.','商品管理員：核對商品資料、翻譯、價格、庫存及處理後圖片。業務超級管理員：完成 MUJI 圖片審核及最終審批。核准前新商品保持私人，現有公開商品保持不變。','商品管理者：商品情報・翻訳・価格・在庫・準備済み画像を確認します。業務最高管理者：MUJI画像審査と最終承認を行います。新商品は承認まで非公開、既存の公開商品は変更されません。')}</p><ul className={styles.results}>{results.map(item=><li key={item.handle}><strong>{item.title}</strong>{item.id&&<><p>{item.replayed?t('Existing draft retained; edits preserved.','已沿用現有草稿並保留修改。','既存の下書きと編集を保持しました。'):t('Review draft prepared; existing public listings remain unchanged.','已準備待審草稿，現有公開商品保持不變。','審査用の下書きを準備しました。既存の公開商品は変更されません。')}</p><Link href={`/admin/batches?productId=${encodeURIComponent(item.id)}`}>{t('Review product & photos','核對商品及圖片','商品と画像を確認')}</Link></>}{item.code&&<p role="alert">{codeText(item.code)} <code>{item.code}</code></p>}{item.imageQueued!==undefined&&<p>{t(`Photos: ${item.imageQueued} queued privately · ${item.imageExisting} already queued · ${item.imageHeld} unsupported URLs · ${item.imageFailed} need attention. Queued photos still require MUJI review.`,`圖片：${item.imageQueued} 張已私人排程 · ${item.imageExisting} 張已在佇列 · ${item.imageHeld} 個不支援網址 · ${item.imageFailed} 張需跟進。排程圖片仍須通過 MUJI 審核。`,`画像：非公開待機${item.imageQueued}件 · 既存待機${item.imageExisting}件 · 未対応URL${item.imageHeld}件 · 要確認${item.imageFailed}件。画像は引き続きMUJI審査が必要です。`)}</p>}{Boolean(item.imageHeld)&&<p>{t("Some source URLs are not supported. Open Review product & photos to upload those original images privately; do not use them publicly before MUJI approval.","部分來源網址不受支援。請開啟核對商品及圖片，私人上傳這些原圖；MUJI 核准前不得公開使用。","未対応の元URLがあります。商品と画像を確認を開き、元画像を非公開でアップロードしてください。MUJI承認までは公開しないでください。")}</p>}{item.imageCode&&<p role="alert">{codeText(item.imageCode)} <code>{item.imageCode}</code></p>}{item.imageBatches?.map(batch=><p key={batch}><Link href={`/admin/batches?productId=${encodeURIComponent(item.id!)}&batch=${encodeURIComponent(batch)}`}>{t('Open private photo review','開啟私人圖片審核','非公開画像の審査を開く')}</Link></p>)}</li>)}</ul>{receipt&&<p className={styles.muted}>{t('Import receipt','匯入收據編號','取込受付番号')}: <code>{receipt}</code></p>}</section>}
   {preview&&<p className={styles.muted}>{t('Workflow preview only. Import is disabled here.','僅供流程預覽，此處不能匯入。','操作プレビューのみです。ここでは取り込めません。')}</p>}
   {error&&<p role="alert" className={styles.error}>{codeText(error)} <code>{error}</code></p>}
  </div>
  <footer className={styles.footer}>{step==='file'?<><button type="button" className="button button-secondary" disabled={busy} onClick={close}>{t('Cancel','取消','キャンセル')}</button><button type="button" className="button" disabled={!file||busy} onClick={()=>void upload()}>{reading?t('Checking file…','正在檢查檔案…','ファイルを確認中…'):t('Upload file','上傳檔案','ファイルをアップロード')}</button></>:step==='preview'?<><button type="button" className="button button-secondary" onClick={()=>{setStep('file');setError('');}}>{t('Back','返回','戻る')}</button><button type="button" className="button button-secondary" onClick={close}>{t('Cancel','取消','キャンセル')}</button><button type="button" className="button" disabled={preview} onClick={()=>void confirm()}>{t('Import products','匯入商品','商品をインポート')}</button></>:step==='results'?<><button type="button" className="button button-secondary" onClick={()=>void confirm()} disabled={!prepared||preview}>{t('Retry same file','重試相同檔案','同じファイルで再試行')}</button><button type="button" className="button" onClick={close}>{t('Done','完成','完了')}</button></>:<span>{t('Import in progress…','正在匯入…','取込処理中…')}</span>}</footer>
 </dialog>;
}
