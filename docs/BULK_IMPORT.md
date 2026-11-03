# Bulk intake and availability review

## Import 60+ favourites

1. In Compare, click **Import listings** and expand **Collect many favourites in one go**.
2. Drag **Collect loaded listings** to your bookmarks bar.
3. Open your Leboncoin favourites normally and scroll to load the cards you want.
4. Run the bookmark. It downloads `assay-leboncoin-loaded.json` and reports the count.
5. Load that file in Assay. Review detections, select complete PCs and add the reviewed selection.
6. Complete incomplete drafts through **Review in PC form**. Drafts survive reloads.

The collector reads the currently loaded document only. It does not request API
endpoints, open individual adverts, scroll automatically, access account data or
cookies, or bypass CAPTCHA/access protections. The export count may be below the
favourites count if the site paginates or virtualizes cards. Cards often omit
hardware details; the tool cannot reconstruct descriptions that were never loaded.
Use additional loaded-page exports, saved advert HTML/JSON, or copied descriptions
for those drafts. Capturing a page repeatedly does not fetch missing details.

A saved HTML file or JSON can also be loaded directly, without a bookmarklet or
DevTools. If a browser blocks bookmarklets, the UI exposes the readable collector
for deliberate use in DevTools. No HAR files, tokens or raw network logs are needed.
Leboncoin's terms restrict unauthorized extraction; these local tools do not grant
permission from the platform. No automatic live-site integration has been verified.

## Supported inputs and review

- One advert as text; multiple adverts separated by a line containing `---`.
- Collector JSON, arrays of listing objects, nested objects with subject/title,
  description/body/text, price and URL; embedded JSON in saved HTML.
- Multiple files, up to 10 MB per input and 1,000 retained drafts.
- French Go/To and English GB/TB, explicit RAM phrases, SSD/NVMe and HDD, separate
  peripheral sale wording, and exact catalogue CPU/GPU models.

Hardware aliases normalize brand names and punctuation, but never invent absent
models or benchmark scores. Multiple CPU/GPU mentions, ambiguous prices, unknown
RAM type, repeated/alternative drive details and uncertain setup require review.
Source phrases are visible beside draft fields. The parser is heuristic; its
fixtures and synthetic browser checks do not prove compatibility with every
Leboncoin page or real favourite collection.

Drafts do not affect rankings. Non-desktop items are not selected automatically.
Unknown memory/storage use existing marked defaults only when the user adds a
reviewed draft. Unknown setup is retained as unknown and deducts nothing; even
explicitly included peripherals deduct zero until a value is supplied in Edit.
URLs deduplicate by Leboncoin advert ID across old/new paths and tracking queries.
Existing listings are never silently overwritten by an intake batch.

## Availability

**Review availability** opens a queue of stale linked listings (two days). Open
an advert and choose Still up, Confirmed gone / archive, or Blocked / unsure.
When no stale links exist, active linked listings can be reviewed again.

The optional saved-evidence panel analyzes explicit `availability` fields from
per-advert collector exports (`available` / `unavailable`). Proposed changes must
be confirmed before saving. Conflicting evidence is ignored. A favourites export
provides no availability status: absence, blocked pages and an empty export never
archive anything. An unavailable listing remains in backups and can be restored
with Mark available; deletion remains a separate deliberate action.

There is no unattended live checker. Assay is static, and cannot reliably distinguish
cross-origin/access failures from removed adverts. The batch analyzer processes
the supplied snapshots; it is not a live check.

## Data and proof

Parsing runs locally. Raw source excerpts and drafts stay in local storage, are
included in JSON backups, and are not part of account sync. Once added, listing
specifications, advert URL and inspection notes follow the existing sync model.
Do not import account/network exports containing secrets.

Run `node tests/listing-import.test.js` and `node tests/ui-entry.test.js`.
The tests cover 65-ad batches, ambiguity, French specifications, URL duplicates,
inert HTML, visible-card collection and explicit status handling. Browser checks
cover reviewed batch addition, repeat-import deduplication and confirmed archival.

## Full descriptions and saved advert pages

Saved individual Leboncoin HTML now prefers `application/ld+json` Product data.
The offer URL is retained, and the full embedded description is used even when
Show more is visually closed. Only product data is retained; unrelated application
translations and account/page state are ignored. A sanitized product-only regression
fixture comes from the owner's supplied 4070 SUPER / 7800X3D advert, not the full
saved page.

The collector on an already-open advert also reads that Product description, price
and URL. Favourites cards still cannot provide descriptions absent from the page.
To collect those, each advert must be opened or saved normally. Multiple saved
HTML files can be selected together in Load files; no copy/paste is required.
A slower unattended browser queue is not included.

Re-importing a full advert enriches an existing draft with the same URL. If the
advert is already a saved listing, the import offers Update saved description only;
this requires an explicit click and preserves specifications and inspection notes.
Saved descriptions appear under Inspect listing, can be edited in the PC form,
and follow the existing backup and optional account-sync behavior. Keep sensitive
seller details out of descriptions you choose to sync.

After a collector update, delete the old collector bookmark and drag the updated
Collect loaded listings link into your bookmarks bar again. Existing bookmarks
contain their own older copy of the code.

## Automatic unavailable status

The refreshed collector captures purchase-in-progress labels and seller last-activity
labels from the loaded individual advert. Import marks a listing unavailable when
its purchase is in progress or seller inactivity explicitly exceeds 30 days.
Exactly 30 days, one month, missing activity, and description keywords do not trigger
this rule. Two months or more and “plus de 30 jours” do.

Loading this evidence also archives matching saved listings automatically, preserving
their specs and notes. New reviewed imports inherit the unavailable status, including
when opened in the PC form. Missing evidence never reactivates saved listings.
Replace the collector bookmark before collecting again: old exports containing only
descriptions cannot reveal missing seller activity or purchase labels.
