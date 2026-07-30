import { z } from "zod";

// ============================================================================
// Monster Ink Tees — Quote Request Data Contract
//
// This is the single source of truth for the shape of a customer-submitted
// quote request, shared between:
// - the public customer intake app (produces this data on submit)
// - the internal price quoter app (reads it back out of `quote_requests
//   .raw_data`, both to display it and to seed a new quote)
//
// Both apps depend on this package instead of maintaining their own copies
// of these types. Bump CONTRACT_VERSION whenever a field is added, removed,
// or its meaning changes, and update both consuming apps together.
// ============================================================================

export const CONTRACT_VERSION = "0.2.0";

export const YesNoSchema = z.enum(["Yes", "No"]);
export type YesNo = z.infer<typeof YesNoSchema>;

// "Returning Customer" was removed as an option here — returning customers
// (returningCustomer === "Yes") no longer see this question on the intake
// form at all, so it would only ever have been a stray/legacy answer.
export const HOW_HEARD_OPTIONS = [
  "Prior New Republic Customer",
  "Google Search",
  "Referral / Word of Mouth",
  "Social Media (Instagram/Facebook/TikTok)",
  "Trade Show / Event",
  "Other",
] as const;
export type HowHeard = (typeof HOW_HEARD_OPTIONS)[number];

// --- Shirt style categories (garments only) ---------------------------------
//
// A simplified first-choice category so a customer who doesn't know a brand
// name ("I just want a t-shirt") can narrow the multi-thousand-style catalog
// down before browsing/searching specific styles. Mirrors garment_type in
// the catalog schema. "Other" is a UI-only escape hatch (free-typed style
// description, not tied to a catalog lookup) so it is intentionally not
// part of this list — apps should treat any non-empty shirtStyle outside
// this list as a free-text "Other" description.
export const SHIRT_STYLE_OPTIONS = [
  "T-Shirt",
  "Long Sleeve T-Shirt",
  "Sweatshirt",
  "Hoodie",
  "Polo Shirt",
  "Tank Top",
] as const;
export type ShirtStyle = (typeof SHIRT_STYLE_OPTIONS)[number];

// --- Print locations (garments only) ---------------------------------------

export const PrintLocationKeySchema = z.enum([
  "front",
  "back",
  "left_sleeve",
  "right_sleeve",
]);
export type PrintLocationKey = z.infer<typeof PrintLocationKeySchema>;

// widthIn/heightIn allow "" as the "not yet typed" state in a controlled
// number input on the intake form; by submission time these should be real
// numbers, but the schema tolerates "" so partial in-progress form state can
// still be validated against the same shape if needed.
export const PrintLocationSelectionSchema = z.object({
  key: PrintLocationKeySchema,
  label: z.string(),
  enabled: z.boolean(),
  widthIn: z.union([z.number(), z.literal("")]),
  heightIn: z.union([z.number(), z.literal("")]),
});
export type PrintLocationSelection = z.infer<typeof PrintLocationSelectionSchema>;

export function defaultPrintLocations(): PrintLocationSelection[] {
  return [
    { key: "front", label: "Front", enabled: true, widthIn: 12, heightIn: 15 },
    { key: "back", label: "Back", enabled: false, widthIn: 12, heightIn: 15 },
    { key: "left_sleeve", label: "Left Sleeve", enabled: false, widthIn: 3, heightIn: 4 },
    { key: "right_sleeve", label: "Right Sleeve", enabled: false, widthIn: 3, heightIn: 4 },
  ];
}

// --- Garments ----------------------------------------------------------------

export const GarmentLineItemSchema = z.object({
  id: z.string(),
  // Simplified first-choice category (see SHIRT_STYLE_OPTIONS above), or a
  // free-typed "Other" description. Empty string means not yet chosen.
  shirtStyle: z.string().optional(),
  // Internal garments.id (uuid) once a real catalog style is picked — lets
  // the quoter side match this exactly, no fuzzy search needed.
  garmentId: z.string().optional(),
  styleCode: z.string(),
  styleName: z.string(),
  // Real colors this style actually comes in (from the catalog's color
  // list), or free-typed entries for the rare style with no color list yet.
  colors: z.array(z.string()),
  preferredBrand: z.string().optional(),
  // Keyed by whatever size names this specific style actually offers
  // (fetched per style) — not a fixed universal size list.
  sizes: z.record(z.string(), z.number()),
  printLocations: z.array(PrintLocationSelectionSchema),
  otherInfo: z.string().optional(),
});
export type GarmentLineItem = z.infer<typeof GarmentLineItemSchema>;

export function newGarmentLine(id: string): GarmentLineItem {
  return {
    id,
    shirtStyle: "",
    garmentId: "",
    styleCode: "",
    styleName: "",
    colors: [],
    preferredBrand: "",
    sizes: {},
    printLocations: defaultPrintLocations(),
    otherInfo: "",
  };
}

export function garmentTotalQty(sizes: Record<string, number>): number {
  return Object.values(sizes).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

// --- Hats ---------------------------------------------------------------------

export const HatLineItemSchema = z.object({
  id: z.string(),
  styleCode: z.string(),
  styleName: z.string(),
  colors: z.string(),
  preferredBrand: z.string().optional(),
  artworkFileUrl: z.string().optional(),
  artworkFileName: z.string().optional(),
  otherInfo: z.string().optional(),
});
export type HatLineItem = z.infer<typeof HatLineItemSchema>;

// --- Stickers -------------------------------------------------------------

const numberOrEmpty = z.union([z.number(), z.literal("")]);

export const StickerLineItemSchema = z.object({
  id: z.string(),
  heightInches: numberOrEmpty,
  lengthInches: numberOrEmpty,
  quantity: numberOrEmpty,
  artworkFileUrl: z.string().optional(),
  artworkFileName: z.string().optional(),
  otherInfo: z.string().optional(),
});
export type StickerLineItem = z.infer<typeof StickerLineItemSchema>;

// --- Buttons ----------------------------------------------------------------

export const BUTTON_SIZES = ["1 inch", "1.25 inch", "2.25 inch"] as const;
export const ButtonSizeSchema = z.enum(["", ...BUTTON_SIZES]);
export type ButtonSize = z.infer<typeof ButtonSizeSchema>;

export const ButtonLineItemSchema = z.object({
  id: z.string(),
  size: ButtonSizeSchema,
  quantity: numberOrEmpty,
  artworkFileUrl: z.string().optional(),
  artworkFileName: z.string().optional(),
  otherInfo: z.string().optional(),
});
export type ButtonLineItem = z.infer<typeof ButtonLineItemSchema>;

// --- Patches ------------------------------------------------------------------

export const PatchLineItemSchema = z.object({
  id: z.string(),
  heightInches: numberOrEmpty,
  lengthInches: numberOrEmpty,
  quantity: numberOrEmpty,
  artworkFileUrl: z.string().optional(),
  artworkFileName: z.string().optional(),
  otherInfo: z.string().optional(),
});
export type PatchLineItem = z.infer<typeof PatchLineItemSchema>;

// --- Full request -------------------------------------------------------------

export const ProductCategorySchema = z.enum([
  "garments",
  "hats",
  "stickers",
  "buttons",
  "patches",
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const QuoteRequestFormDataSchema = z.object({
  // Sales attribution — links this request to a users.id in the quoter DB.
  salespersonId: z.string(),
  salespersonName: z.string(),

  returningCustomer: YesNoSchema.nullable(),
  howHeard: z.string(),
  discountCode: z.string().optional(),

  companyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  dueDate: z.string(), // ISO date string
  pickupOrShipping: z.enum(["Local Pickup", "Shipping", ""]),
  rushOrder: YesNoSchema.nullable(),

  shippingAddressLine1: z.string(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string(),
  shippingState: z.string(),
  shippingZip: z.string(),

  billingDifferent: z.enum(["Yes", "No", ""]),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),

  projectName: z.string(),

  selectedCategories: z.array(ProductCategorySchema),
  garments: z.array(GarmentLineItemSchema),
  hats: z.array(HatLineItemSchema),
  stickers: z.array(StickerLineItemSchema),
  buttons: z.array(ButtonLineItemSchema),
  patches: z.array(PatchLineItemSchema),
});
export type QuoteRequestFormData = z.infer<typeof QuoteRequestFormDataSchema>;

/**
 * Validates an unknown payload (e.g. a JSON request body, or a raw_data
 * JSONB blob read back out of Postgres) against the quote request contract.
 * Use this at both write time (customer form submit) and read time (quoter
 * app loading raw_data) so a malformed/legacy record fails loudly and
 * visibly instead of silently rendering blank fields.
 */
export function parseQuoteRequestFormData(payload: unknown) {
  return QuoteRequestFormDataSchema.safeParse(payload);
}

export function emptyQuoteRequest(): QuoteRequestFormData {
  return {
    salespersonId: "",
    salespersonName: "",
    returningCustomer: null,
    howHeard: "",
    discountCode: "",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dueDate: "",
    pickupOrShipping: "",
    rushOrder: null,
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    billingDifferent: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    projectName: "",
    selectedCategories: [],
    garments: [],
    hats: [],
    stickers: [],
    buttons: [],
    patches: [],
  };
}
