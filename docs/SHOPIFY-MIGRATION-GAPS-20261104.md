# Shopify migration: remaining implementation boundaries

The review package is **not a native import**. It preserves the supplied CSV rows, including option, price, image and inventory fields, on the operator's device. Product photos are not downloaded. Images and descriptions are untrusted until reviewed; source price values are not evidence of a valid selling price. A missing inventory quantity must remain unknown. The supplied full 2026-11-04 export has no variant quantity column.

To complete native migration without losing options or overselling:

1. Introduce a private, resumable import record and per-product/variant staging model with stable IDs, exact source fields, duplicate/conflict handling and role-scoped/audited writes. Preserve user-edited drafts and flag unverified prices. Keep supplier costs restricted from merchandise roles as required by the existing role policy.
2. Add product-variant and variant-inventory records with explicit SKU/option identity, independent stock revisions and reservations. Test concurrent reservations and releases against a real isolated PostgreSQL service; do not represent a many-variant product as one aggregate stock count.
3. Ingest multiple originals into the existing private batch workflow, attach them to the right draft and variant, enforce approved-output hashes and role/revision checks, and expose only approved images. Review image association and product fidelity; do not auto-approve.
4. Extend admin product, inventory and price-review screens to inspect and correct variants and their source data. Preserve every supported field; identify unsupported or conflicting values rather than silently dropping them. Restrict financial values and supplier cost fields by role.
5. Extend product pages, cart, frozen order items, Checkout and signed-webhook reconciliation to bind the selected variant, price and inventory consistently, including retry, cancellation, refund and stock restoration policy. Test mixed variants, concurrent buyers, unavailable combinations, duplicate events and price changes in an isolated environment. Keep live sales admission closed until independently approved for the expanded scope.
6. Test authorized and denied roles, media approval, full real-format import, interruptions, idempotent retry, desktop/mobile and all four languages against an isolated database and provider test mode. Prepare a reversible migration, test deployment and verify exact live state before enabling the workflow. Do not auto-publish source status flags or expose unpublished supplier media.

No production tables, staff access, current images, payment controls or Shopify store state were modified for this review feature.
