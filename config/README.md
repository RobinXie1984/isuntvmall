# Store profiles

One source tree, one explicit store profile per build. The existing iSunTVMall profile is the default. `stillroom.json` is a clearly identified neutral sample for local build/render proof; it is not an actual client or a request to provision infrastructure.

Set `STORE_PROFILE_PATH=/absolute/path/to/client.json` for the selected Next or Vinext build. The file can live outside this repository and may use any valid store ID; adding a client does not require editing a brand allowlist. Both build configurations invoke `loadStoreProfile`, validate the JSON and compile the same public snapshot into server/client code through `NEXT_PUBLIC_STORE_PROFILE`. Do not manually set that serialized internal variable or resolve a profile from request headers.

Copy one profile, change the name, HTTPS origin, local asset paths, translated copy and supported/default locales. Put logo/hero assets under `public/` and provide local paths beginning `/`. Icons support PNG and SVG. No image-generation or supplier rights are implied. Current storefront layout stays MUJI. Currency is HKD only in V1; changing a display label is not currency conversion.

`catalogueMode: "demo"` selects sample behavior. `demoSet: "isun"` preserves the original examples; `neutral` selects a small generic set. Supplier and holiday collections are explicit switches. `merchant` requires both demo collection switches false; it never falls back to sample goods, hosts or rooms when Supabase is absent, and filters database records marked `is_demo` from public catalogue reads. Merchant data needs an independently configured project when a real client is confirmed. Profile JSON contains no backend credentials.

Purchase, contact, privacy and terms pages render the profile's supplied text. Leave unknown fields null; the pages explicitly report absent information. Do not make up legal identity, contact details, shipping cost/time, returns windows or privacy promises. `hasMerchantPolicies()` checks field presence, not legal sufficiency, policy approval or commerce readiness. Profile selection does not enable checkout.

`excludedProductIds` hides an exact product from public list/detail/cart lookups and public live product rails while retaining admin/audit records. The default excludes the verified iSun workflow QA sample by ID. It is not a deletion facility.

The iSun ID keeps existing cart/session-attempt/locale/staff cookie namespaces. Other IDs have distinct stable namespaces. Existing MFA enrollments remain unchanged; future enrollments use the selected store's issuer name. Do not rename an active store ID casually, as this changes browser namespaces.

Deployment URL/runtime origin, Worker account/name/routes, credentials and Stripe settings are separate deployment configuration. Validate the profile origin against the intended deployment, and never give a sample the iSun route or production secrets. Independent deployment is the V1 isolation boundary; sharing one database between customers is not supported multi-tenancy.
