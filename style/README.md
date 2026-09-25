# iSunTVMall style library

Six original retail directions, one shared commerce system. The active storefront stays **muji**. Preview all six at `/styles`; the selector changes only the demonstration panel.

| Folder | Direction |
| --- | --- |
| `muji` | Quiet everyday essentials; current storefront |
| `apple` | Object-led clarity and generous space |
| `amazon` | Helpful discovery and clear shopping choices |
| `openai` | Editorial curiosity and simple geometry |
| `daks-burberry` | Tailored heritage and warm stone |
| `hermes-valentino` | Craft, gifting and expressive warmth |

Each folder contains human-readable application guidance and a machine-readable `tokens.json`. `src/lib/styles.ts` is the shared typed registry used by the gallery and the batch helper. All brand references identify inspiration only; iSunTVMall retains its own name, original photos and product identity.

## Stable token contract

`id`, `name`, `description.en`, `description.zh`, six `colors`, numeric `radius`, `typography.heading`, `typography.body`, and `image` (`background`, fractional `padding`, maximum `size`, `format`, `quality`). The image profile intentionally performs conservative normalization. It cannot make a real item look like another item, replace backgrounds intelligently or certify image rights.

The saved MUJI palette records the current storefront's background `#f5f4f0`, surface `#ffffff`, text `#252522`, muted `#70716a`, accent `#555c45` and border `#e3e3de`. Existing component-specific colors remain in the live CSS; the gallery does not refactor or change them.
