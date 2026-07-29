# @monsterink/quote-contract

Single source of truth for the **Monster Ink Tees quote request data shape**,
shared between:

- **Customer intake app** (public form) — produces this data on submit
- **Internal price quoter app** — reads it back out of `quote_requests.raw_data`
  to display incoming requests and seed a new quote

Both apps import this package instead of maintaining their own copies of
these TypeScript types. Because the schemas are built with [Zod](https://zod.dev),
you get **both** compile-time types (via `z.infer`) and **runtime validation**
from the same definition — so a malformed or legacy record fails loudly
instead of silently rendering blank fields.

## Install (as a git dependency, no npm registry needed)

```jsonc
// package.json
{
  "dependencies": {
    "@monsterink/quote-contract": "github:newrepublicprinting-beep/monster-ink-quote-contract#main"
  }
}
```

`npm install` will run this package's `prepare` script automatically, which
compiles `src/` to `dist/` — no need to commit build output to this repo.

## Usage

```ts
import {
  QuoteRequestFormDataSchema,
  parseQuoteRequestFormData,
  type QuoteRequestFormData,
} from "@monsterink/quote-contract";

// Validate an incoming submission before saving it.
const result = parseQuoteRequestFormData(requestBody);
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
}
const data: QuoteRequestFormData = result.data;
```

## Versioning

Bump `CONTRACT_VERSION` (exported from `src/index.ts`) and the package
`version` in `package.json` whenever a field is added, removed, renamed, or
its meaning changes. Update **both** consuming apps in the same change —
this package existing doesn't remove the need to keep them in sync, it just
makes drift visible (a TypeScript error, or a Zod validation failure) instead
of silent.

## What's intentionally NOT in this contract

- Catalog browsing types (`CatalogItem`, style search results) — these are
  presentation-only lookups against the live `garments` table, not part of
  the stored request payload.
- Pricing/quote types (`ApparelQuoteInput`, `QuoteRecord`, etc.) — those
  belong to the quoter app's own domain once a request has been converted
  into a real quote.
