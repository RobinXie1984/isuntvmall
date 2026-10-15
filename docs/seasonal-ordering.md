# Automatic seasonal merchandising

Released 12 October 2026. Homepage editorial, homepage product selection and default catalogue ordering share one request-time calendar. No scheduled job, external calendar API, database migration, admin configuration or annual redeployment is needed.

## Behaviour

`src/lib/data/seasonal-order.ts` calculates occasions for the current and following year. Hong Kong uses Asia/Hong_Kong, Taiwan Asia/Taipei, Japan Asia/Tokyo, and the U.S. America/New_York. A campaign begins 7, 14, 21 or 28 calendar days before its occasion, according to the leadDays beside each rule. It stops at midnight after its last local calendar day. Mid-Autumn ends on the festival itself, not the following Hong Kong public holiday. Christmas runs through Boxing Day in Hong Kong. New Year look-ahead crosses the December boundary.

The nearest active occasion leads; overlapping occasions follow in date order. Multiple regions sharing a collection do not multiply its priority. Evergreen products follow, then out-of-season products. Existing featured flags and source order break ties. Explicit price sorting still takes precedence. Filtering and pagination operate on the full retained catalogue.

The homepage shows up to four active seasonal products, then evergreen products, without duplicates. The editorial banner uses the leading available collection's existing image and translated copy; without a relevant available collection it uses the evergreen brand profile. Both pages render dynamically; a new page request reevaluates the date. A tab left open overnight refreshes on its next navigation/reload, not on a timer.

Only existing demo holiday collection membership determines seasonal relevance. Real merchant products are not classified merely because a slug resembles a demo product. White-label profiles with holiday collections disabled retain their own editorial. Pictureless/quarantined items remain hidden under the separate existing image policy. This change never deletes, archives, unpublishes or edits product records, originals, inventory, payments or staff access.

## Coverage and sources

Rules cover the existing collections: Lunar New Year, lanterns/Tanabata, spring and Golden Week, Easter, family appreciation, children's occasions, Dragon Boat, summer journeys, national gatherings, autumn craft, Halloween, U.S. Thanksgiving, Christmas, New Year and winter solstice. Solemn remembrance collections remain browsable without automatic commercial promotion. The dated 2026 reference guide on `/collections` remains a 2026 guide; it is not the rotation engine.

- Hong Kong Observatory Gregorian/lunar tables: [2026](https://www.hko.gov.hk/en/gts/time/calendar/text/files/T2026e.txt), [2027](https://www.hko.gov.hk/en/gts/time/calendar/text/files/T2027e.txt), [2028](https://www.hko.gov.hk/en/gts/time/calendar/text/files/T2028e.txt).
- [Japan Cabinet Office holiday dates and rules](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html).
- [U.S. OPM federal holiday rules](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/).
- Lunar conversion: pinned [lunar-typescript](https://github.com/6tail/lunar-typescript) 1.8.6, ordinary lunar months (positive month numbers), verified against HKO fixtures. Runtime ICU was rejected after a 2027 New Year discrepancy.
- Equinoxes and solstice: pinned [Astronomy Engine](https://github.com/cosinekitty/astronomy) 2.1.19, astronomical instant converted to the relevant local date.
- Gregorian Easter uses the Gregorian computus; weekday holidays use nth-weekday rules.

This is a shopping calendar, not an authoritative statutory holiday or substitute-day service. Future one-off government declarations or legal changes are not predictable; ordinary recurring occasions calculate automatically. The engine supports years 1900–2100, with practical future regression fixtures through 2040. Only immutable computed years are cached (four-year bound); today's selection is never cached.

## Verification and rollback

Run `npm ci`, `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build:vinext` in the isolated Studio candidate. Date tests cover independently sourced 2026–2028 dates, leap lunar months, Hong Kong/Japan/U.S. midnight boundaries, December rollover, evergreen gaps, input/membership preservation, real/demo isolation, duplicate prevention and future requests in one process. The task evidence also includes an isolated Cloudflare workerd probe using the actual module, plus public four-language HTTP and desktop/mobile checks.

Rollback the Worker to `cd05ce87-cc99-4072-b54b-f4d0c194814d` if a release regression appears. Restore only this release's changed source files from its preserved baseline or revert its Git commit; no database rollback is needed. Do not overwrite unrelated changes. Studio evidence is archived under `12_ventures/isuntvmall/evidence/holiday-rotation-20261012`.


## Taiwan extension — 15 October 2026

Taiwan now participates in the same annual request-time rotation, using the existing collections and dependencies. Included: New Year, Lunar New Year through the third lunar day, Lantern Festival, Valentine's Day, Children's Day (4 April), Labour Day, Mother's Day (second Sunday in May), Dragon Boat, Father's Day (8 August), Qixi (ordinary lunar 7/7), Grandparents' Day (fourth Sunday in August), Mid-Autumn, Teachers' Day (28 September), Double Ninth (ordinary lunar 9/9), National Day (10 October), Retrocession Day (25 October), Halloween, Christmas and winter solstice. The December 25 shopping selection is winter gifting; it is not a separate Constitution Day campaign.

The same policy excludes solemn remembrance occasions (Peace Memorial Day, Qingming and Ghost Festival) from automatic commercial promotion. Their existing collection products remain available. This shopping calendar does not try to calculate government substitute holidays or business closure days. Actual festival days drive campaign expiry, so shared Hong Kong/Taiwan festivals never keep mooncakes leading after the festival.

Taiwan dates/rules checked against the [official DGPA 2027 calendar and recurring holiday definitions](https://www.dgpa.gov.tw/information?pid=12982&uid=41); lunar fixtures use the HKO tables linked above. Tests cover 2026–2028 lunar dates, Taipei midnight, Father's Day's August date, Qixi/Father's Day overlap, evergreen gaps, unchanged membership and year rollover. No UI/CSS, product, price, inventory, admin or database changes. No new dependency or routine configuration.

Taiwan release rollback: prior Worker `12d6373b-2889-40af-9bb9-03e8cea6fc32`, source `e19383d48ce1c127b08aa73f17edafc624e8fe3d`. Evidence: `12_ventures/isuntvmall/evidence/taiwan-rotation-20261015`.
