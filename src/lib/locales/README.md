# Store languages

The storefront supports `en`, `zh-Hant`, `zh-Hans` and `ja`. The language selector uses a strict cookie allowlist shared by server and client; changing language reloads the current URL without replacing its query or shopping-bag storage. English remains the fallback for absent or unsupported cookie values. The approved bilingual brand lockup is fixed artwork.

`translate` handles UI and editorial English/Traditional Chinese pairs; Japanese dictionaries use the exact English source as their key. Dynamic messages pass an explicit Japanese third argument to `t`, preserving interpolation without guessing from rendered text. `localize` handles exact sample-catalogue aliases, including English values stored by the managed importer. Unknown merchant-authored content is preserved; new merchant Japanese/Simplified translations require editorial content, not automatic guesses.

Japanese copy covers the current UI, sample catalogue, holiday guide, styles and staff interfaces. Simplified Chinese phrases were converted from the existing Traditional Chinese copy using OpenCC JS 1.4.2 (`tw` to `cn`) during preparation, then committed as static data. The character fallback only converts the authored Chinese copy around dynamic quantities. OpenCC is not a runtime dependency. Update these dictionaries whenever adding new site copy.

Currency formatting uses the selected language while retaining the actual currency and minor-unit amount. This change does not enable ordering, alter inventory, translate user input or change staff permissions.
