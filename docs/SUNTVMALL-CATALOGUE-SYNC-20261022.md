# SunTVMall catalogue import

The 2026-10-22 snapshot contains 75 published source products and 777 variants. Categories follow actual shopping use: bags and accessories (18), footwear (18), tableware (4), beauty and personal care (10), hair care (13), gifts (1), food and nutrition (11). The MUJI reference governs presentation, not a copied taxonomy. No Amazon or Overstock taxonomy was imported.

Public collection: `/shop?collection=suntvmall`; also linked from New discoveries. Existing demo products remain explicitly labelled and unchanged.

## Source ownership
Prices, colour/size/set choices and fulfilment belong to SunTVMall. Imported products use stable source IDs and local stock zero. The Mall's server excludes them from its local checkout even if stock is accidentally raised. A selected variant links to `https://suntvmall.com/products/{handle}?variant={id}`. Price and stock must be confirmed there; no live inventory synchronization is claimed. Source HK$19.99 prices are preserved exactly.

`config/isuntvmall.json` enables `collections.suntvmall`; omitted/false disables source enrichment and the collection in other white-label configurations. Public metadata is in `src/lib/data/suntvmall-catalogue.json`; source options are not a new inventory database. Colleagues may edit title/category/media through existing admin, but source options and commercial prices should be maintained in the source store and refreshed through the reviewed import. If a colleague changes the English title/description, its source translations stop overriding the edit.

## Media
All source files are retained in the private canonical candidate. Public media is content-addressed WebP in the existing product-images bucket. Six background-cleanup candidates passed visual comparison; eleven generated candidates were rejected to preserve printed packaging details. Eleven reversible viewport crops hide advertising while retaining original source pixels. A clean alternate loafer photo replaces its poster. Ethica bundle photos were exchanged to match the Corrective/Ageless serum names in the source descriptions. Representative-image notice makes clear that the photo does not change with every variant.

## Repeat and rollback
Canonical working/evidence folder: `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261022-suntvmall-sync`.

1. Obtain a fresh public source feed through the ordinary authorized browser/download route. Keep the prior feed immutable.
2. Compare product/variant IDs, prices and source update times. Never infer numeric inventory from availability flags.
3. Review new or changed imagery; retain original bytes and hashes. Update translations and option metadata; rerun coverage and checkout-boundary tests.
4. Stage managed products as drafts and verify public image hashes. Use existing audited merchandise save/publish operations. Do not overwrite concurrent staff edits or remove unrelated products.
5. Build/test on Studio, transfer the exact hash-verified build to iMac and deploy with existing local Cloudflare authorization. Verify public product pages and source links. No credentials cross machines.
6. To withdraw this import, use the exact imported-ID receipt to save/publish status `archived` through the existing audited merchandise flow. Preserve those records; do not delete orders or unrelated catalogue data. Roll back the Worker to the preceding recorded version. Storage assets may remain for rollback.

This import establishes the initial snapshot. Robin subsequently authorized weekly refreshes; see `SUNTVMALL-WEEKLY-SYNC.md` for the Monday schedule and separate photo approval gate. This is not real-time inventory synchronization. Shipping, legal product claims, physical product samples and final source checkout transactions were not independently certified by this task.
