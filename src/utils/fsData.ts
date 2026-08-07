/**
 * UniStay platform data helpers — single source for the housing / university
 * data layer used by the platform pages (/housing/, /property/, /university/).
 *
 * All JSON lives in src/data/ and is baked at build time.
 */

import statsJson from "@/data/stats.json";
import countriesJson from "@/data/countries.json";
import citiesJson from "@/data/cities.json";
import propertiesIndexJson from "@/data/properties_index.json";
import universitiesJson from "@/data/universities.json";

import propsAU from "@/data/properties/australia.json";
import propsCA from "@/data/properties/canada.json";
import propsFR from "@/data/properties/france.json";
import propsDE from "@/data/properties/germany.json";
import propsIE from "@/data/properties/ireland.json";
import propsIT from "@/data/properties/italy.json";
import propsNZ from "@/data/properties/new-zealand.json";
import propsSG from "@/data/properties/singapore.json";
import propsES from "@/data/properties/spain.json";
import propsAE from "@/data/properties/uae.json";
import propsUK from "@/data/properties/united-kingdom.json";
import propsUS from "@/data/properties/united-states.json";

/* ── types (loose on purpose — data is heterogeneous across sources) ── */

export interface FsStats {
  properties: number;
  cities: number;
  countries: number;
  universities: number;
  review_snippets: number;
  google_reviews_total: number;
  built?: string;
}

export interface FsCountry {
  name: string;
  zh: string;
  slug: string;
  cc: string;
  currency: string;
  property_count: number;
  city_count: number;
  university_count: number;
}

export interface FsCityUni {
  slug: string;
  name: string;
  rank: number | null;
}

export interface FsCity {
  slug: string;
  country: string;
  country_name: string;
  country_zh: string;
  cc: string;
  name: string;
  name_zh: string;
  property_count: number;
  min_price: number | null;
  currency: string;
  universities: FsCityUni[];
}

export interface FsPropIndex {
  slug: string;
  name: string;
  country: string;
  cc: string;
  city: string;
  city_slug: string;
  currency: string;
  min_price: number | null;
  price_duration: string | null;
  rating: number | boolean | null;
  g_reviews: number | null;
  image: string | null;
}

export interface FsReview {
  author: string;
  rating: number;
  text: string;
  source?: string;
  time?: string;
}

export interface FsProperty {
  id: string;
  slug: string;
  source: string;
  name: string;
  country: string;
  country_name: string;
  country_zh: string;
  cc: string;
  city: string;
  city_slug: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  currency: string;
  min_price: number | null;
  max_price: number | null;
  price_duration: string | null;
  deposit: string | null;
  unit_types: string[] | null;
  tags: string[] | null;
  min_lease: number | null;
  available_from: string | null;
  rating: number | boolean | null;
  rating_dims: Record<string, number> | null;
  g_rating: number | null;
  g_reviews: number | null;
  image: string | null;
  image_src?: string | null;
  reviews: FsReview[] | null;
  desc?: string | null;
}

export interface FsUniversity {
  slug: string;
  name: string;
  rank: number;
  country_qs: string | null;
  country: string | null;
  country_zh: string | null;
  address: string | null;
  website: string | null;
  g_rating: number | null;
  g_reviews: number | null;
  city_key: string | null;
  reviews: FsReview[] | null;
}

/* ── exports ── */

export const stats = statsJson as FsStats;
export const countries = countriesJson as FsCountry[];
export const cities = citiesJson as FsCity[];
export const propertiesIndex = propertiesIndexJson as FsPropIndex[];
export const universities = universitiesJson as FsUniversity[];

export const propertiesByCountry: Record<string, FsProperty[]> = {
  australia: propsAU as FsProperty[],
  canada: propsCA as FsProperty[],
  france: propsFR as FsProperty[],
  germany: propsDE as FsProperty[],
  ireland: propsIE as FsProperty[],
  italy: propsIT as FsProperty[],
  "new-zealand": propsNZ as FsProperty[],
  singapore: propsSG as FsProperty[],
  spain: propsES as FsProperty[],
  uae: propsAE as FsProperty[],
  "united-kingdom": propsUK as FsProperty[],
  "united-states": propsUS as FsProperty[],
};

/* ── lookups ── */

export const countryBySlug = new Map(countries.map(c => [c.slug, c]));
export const cityByKey = new Map(cities.map(c => [`${c.country}/${c.slug}`, c]));

/* ── formatting helpers ── */

const SYM: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  NZD: "NZ$",
  AED: "AED ",
};

export function moneySym(cur: string): string {
  return SYM[cur] ?? `${cur} `;
}

export function fmtMoney(cur: string, val: number): string {
  return `${moneySym(cur)}${val.toLocaleString("en-US")}`;
}

/** "weekly" → "wk", "monthly" → "mo" */
export function durShort(dur: string | null | undefined): string {
  if (dur === "weekly") return "wk";
  if (dur === "monthly") return "mo";
  return "";
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** numeric rating or null — guards against `true` placeholders in the data */
export function ratingOf(r: number | boolean | null | undefined): number | null {
  return typeof r === "number" && Number.isFinite(r) ? r : null;
}

const FLAGS: Record<string, string> = {
  "united-states": "🇺🇸",
  "united-kingdom": "🇬🇧",
  spain: "🇪🇸",
  australia: "🇦🇺",
  canada: "🇨🇦",
  germany: "🇩🇪",
  singapore: "🇸🇬",
  france: "🇫🇷",
  ireland: "🇮🇪",
  "new-zealand": "🇳🇿",
  uae: "🇦🇪",
  italy: "🇮🇹",
};

export function flagOf(countrySlug: string): string {
  return FLAGS[countrySlug] ?? "🌍";
}

/** ISO-3166 alpha-2 for JSON-LD addressCountry (data uses "uk" for GB) */
export function isoCC(cc: string): string {
  return cc === "uk" ? "GB" : cc.toUpperCase();
}

const UNIT_LABELS: Record<string, string> = {
  studio: "Studio",
  ensuite: "En-suite room",
  non_ensuite: "Shared-bathroom room",
  apartment: "Apartment",
  "1b": "1-bedroom",
  "2b": "2-bedroom",
  "3b": "3-bedroom",
  "4b": "4-bedroom",
  "5b": "5-bedroom",
  "6b": "6-bedroom",
  independent_house: "House",
  branded_independent_house: "Managed house",
  shared_room: "Shared room",
  private_room: "Private room",
};

export function unitLabel(ut: string): string {
  return UNIT_LABELS[ut] ?? ut.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

export function prettyDim(key: string): string {
  const MAP: Record<string, string> = {
    value_for_money: "Value for money",
    getting_around: "Getting around",
    room_experience: "Room experience",
    safety_security: "Safety & security",
    study_environment: "Study environment",
    property_maintenance: "Maintenance",
    indoor_spaces: "Indoor spaces",
  };
  return MAP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

/** "06-07-2026" (DD-MM-YYYY) → "6 Jul 2026" (or "Available now" if past) */
export function fmtAvail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return String(raw);
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(d.getTime())) return String(raw);
  if (d.getTime() < Date.now()) return "Available now";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** R2 image URL or null */
export function imgUrl(image: string | null | undefined): string | null {
  return image ? `https://img.unistay.net/${image}` : null;
}

/** deterministic small hash for per-page copy variation */
export function seedOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** pick from variants deterministically by seed + salt */
export function pick<T>(variants: T[], seed: number, salt = 0): T {
  return variants[(seed + salt) % variants.length];
}

/** sort helper: numeric rating desc, then review count desc, then name */
export function byRating(a: { rating: number | boolean | null; g_reviews: number | null; name: string }, b: { rating: number | boolean | null; g_reviews: number | null; name: string }): number {
  const ra = ratingOf(a.rating) ?? -1;
  const rb = ratingOf(b.rating) ?? -1;
  if (rb !== ra) return rb - ra;
  const ga = a.g_reviews ?? 0;
  const gb = b.g_reviews ?? 0;
  if (gb !== ga) return gb - ga;
  return a.name.localeCompare(b.name);
}

/** star string for a 0–5 rating, e.g. 4.3 → "★★★★☆" */
export function starStr(r: number): string {
  const full = Math.round(r);
  return "★".repeat(Math.min(5, full)) + "☆".repeat(Math.max(0, 5 - full));
}
