/* common.js — delad logik för allergikort (v1)
   - Kategorier + många allergener
   - 3-lägesval per allergen (0/1/2)
   - Allergen-detalj (0-3: ingen/mild/måttlig/allvarlig)
   - Kodning till kort kod (base32)
   - Rendering av kort + kök-läge
*/

export const APP_VERSION = 1;

export const BASE32_ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford (utan I L O U)
const BASE32_MAP = (() => {
  const m = {};
  for (let i = 0; i < BASE32_ALPH.length; i++) m[BASE32_ALPH[i]] = i;
  // tillåt små bokstäver + vanliga förväxlingar
  for (let i = 0; i < BASE32_ALPH.length; i++) m[BASE32_ALPH[i].toLowerCase()] = i;
  m["O"] = m["0"]; m["o"] = m["0"];
  m["I"] = m["1"]; m["i"] = m["1"];
  m["L"] = m["1"]; m["l"] = m["1"];
  return m;
})();

export const THEMES = {
  system: 0,
  light: 1,
  dark: 2,
  hc: 3 // high contrast
};

export const LANG_PREF = {
  auto: 0,
  sv: 1,
  en: 2
};

export const DETAIL_LEVEL = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3
};

// ---- KATALOG (lägg gärna till fler här) ----
export const CATEGORIES = [
  {
    key: "gluten",
    sv: "Spannmål / Gluten",
    en: "Cereals / Gluten",
    items: [
      { id: "gluten", sv: "Gluten", en: "Gluten" },
      { id: "wheat", sv: "Vete", en: "Wheat" },
      { id: "rye", sv: "Råg", en: "Rye" },
      { id: "barley", sv: "Korn", en: "Barley" },
      { id: "oats", sv: "Havre", en: "Oats" },
      { id: "spelt", sv: "Dinkel", en: "Spelt" }
    ]
  },
  {
    key: "dairyEgg",
    sv: "Mejeri & Ägg",
    en: "Dairy & Egg",
    items: [
      { id: "milk", sv: "Mjölk", en: "Milk" },
      { id: "lactose", sv: "Laktos", en: "Lactose" },
      { id: "casein", sv: "Kasein", en: "Casein" },
      { id: "whey", sv: "Vassle", en: "Whey" },
      { id: "egg", sv: "Ägg", en: "Egg" }
    ]
  },
  {
    key: "fishSea",
    sv: "Fisk, Skaldjur & Blötdjur",
    en: "Fish, Crustaceans & Molluscs",
    items: [
      { id: "fish", sv: "Fisk", en: "Fish" },
      { id: "crust", sv: "Skaldjur (räka/krabba/hummer)", en: "Crustaceans (shrimp/crab/lobster)" },
      { id: "moll", sv: "Blötdjur (musslor/ostron/bläckfisk)", en: "Molluscs (mussels/oysters/squid)" }
    ]
  },
  {
    key: "legumes",
    sv: "Baljväxter",
    en: "Legumes",
    items: [
      { id: "soy", sv: "Soja", en: "Soy" },
      { id: "pea", sv: "Ärta", en: "Pea" },
      { id: "bean", sv: "Böna", en: "Beans" },
      { id: "lentil", sv: "Lins", en: "Lentil" },
      { id: "chickpea", sv: "Kikärta", en: "Chickpea" },
      { id: "lupin", sv: "Lupin", en: "Lupin" } // EU-14
    ]
  },
  {
    key: "nuts",
    sv: "Nötter (inkl. jordnöt i denna demo)",
    en: "Nuts (incl. peanut in this demo)",
    items: [
      { id: "peanut", sv: "Jordnöt", en: "Peanut" },
      { id: "almond", sv: "Mandel", en: "Almond" },
      { id: "hazelnut", sv: "Hasselnöt", en: "Hazelnut" },
      { id: "walnut", sv: "Valnöt", en: "Walnut" },
      { id: "cashew", sv: "Cashewnöt", en: "Cashew" },
      { id: "pecan", sv: "Pekannöt", en: "Pecan" },
      { id: "pistachio", sv: "Pistagenöt", en: "Pistachio" },
      { id: "macadamia", sv: "Macadamianöt", en: "Macadamia" },
      { id: "brazil", sv: "Paranöt", en: "Brazil nut" },
      { id: "pinenut", sv: "Pinjenöt", en: "Pine nut" }
    ]
  },
  {
    key: "seedsSpice",
    sv: "Frön, Kryddor & Additiver (vanligt i café)",
    en: "Seeds, Spices & Additives (common in cafés)",
    items: [
      { id: "sesame", sv: "Sesam", en: "Sesame" },     // EU-14
      { id: "mustard", sv: "Senap", en: "Mustard" },   // EU-14
      { id: "celery", sv: "Selleri", en: "Celery" },   // EU-14
      { id: "sulfite", sv: "Sulfiter", en: "Sulphites" }, // EU-14
      { id: "sunflower", sv: "Solrosfrö", en: "Sunflower seed" },
      { id: "poppy", sv: "Vallmofrö", en: "Poppy seed" },
      { id: "pumpkin", sv: "Pumpakärnor", en: "Pumpkin seeds" },
      { id: "chia", sv: "Chiafrö", en: "Chia" },
      { id: "flax", sv: "Linfrö", en: "Flaxseed" },
      { id: "cinnamon", sv: "Kanel", en: "Cinnamon" },
      { id: "vanilla", sv: "Vanilj", en: "Vanilla" },
      { id: "cocoa", sv: "Kakao", en: "Cocoa" },
      { id: "coffee", sv: "Kaffe", en: "Coffee" }
    ]
  },
  {
    key: "fruitVeg",
    sv: "Frukt & Grönt (vanliga korsreaktioner)",
    en: "Fruit & Veg (common cross-reactions)",
    items: [
      { id: "apple", sv: "Äpple", en: "Apple" },
      { id: "pear", sv: "Päron", en: "Pear" },
      { id: "kiwi", sv: "Kiwi", en: "Kiwi" },
      { id: "strawberry", sv: "Jordgubbe", en: "Strawberry" },
      { id: "banana", sv: "Banan", en: "Banana" },
      { id: "tomato", sv: "Tomat", en: "Tomato" },
      { id: "carrot", sv: "Morot", en: "Carrot" },
      { id: "avocado", sv: "Avokado", en: "Avocado" }
    ]
  }
];

export const ALLERGENS = (() => {
  const flat = [];
  for (const c of CATEGORIES) for (const it of c.items) flat.push(it);
  return flat;
})();

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

export function detectLang() {
  const nav = (navigator.language || "sv").toLowerCase();
  return nav.startsWith("en") ? "en" : "sv";
}

export function getText(lang) {
  const L = (lang === "en") ? "en" : "sv";
  return {
    lang: L,
    title: L === "en" ? "Allergy information" : "Allergiinformation",
    sensitiveHigh: L === "en" ? "Highly sensitive" : "Mycket känslig",
    sensitiveNormal: L === "en" ? "Normal sensitivity" : "Normal känslighet",
    allergicTo: L === "en" ? "Allergic to" : "Allergisk mot",
    tracesOf: L === "en" ? "Traces / avoid traces of" : "Spår av / undvik spår av",
    none: L === "en" ? "No allergens selected" : "Inga allergener valda",
    extra: L === "en" ? "Extra note" : "Extra info",
    kitchenMode: L === "en" ? "Kitchen mode" : "Kök-läge",
    normalMode: L === "en" ? "Normal view" : "Normalvy",
    staffMode: L === "en" ? "Staff mode" : "Personalläge",
    show: L === "en" ? "Show" : "Visa",
    code: L === "en" ? "Code" : "Kod",
    invalidCode: L === "en" ? "Invalid code" : "Ogiltig kod",
    disclaimer: L === "en"
      ? "Demo. Info provided by guest. Always verify ingredients and cross-contact risk."
      : "Demo. Informationen kommer från gästen. Kontrollera alltid ingredienser och risk för spår/korskontaminering."
  };
}

export function applyTheme(themeKey = "system") {
  document.documentElement.dataset.theme = themeKey;
}

// ---- base32 encode/decode (bytes <-> string) ----
export function base32Encode(bytes) {
  let bits = 0, value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPH[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPH[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str) {
  const clean = (str || "").replace(/[\s-]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const v = BASE32_MAP[ch];
    if (v === undefined) throw new Error("bad base32");
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// ---- pack/unpack selection to a short code ----
// Structure:
// byte0: version
// byte1: flags: [0-1]=langPref, bit2=sensHigh, [3-4]=theme
// bytes2..: 4 bits per allergen => nibble = (detail<<2) | level
export function packToCode({ langPref, sensHigh, theme, levels, details }) {
  const n = ALLERGENS.length;
  const bytesLen = 2 + Math.ceil(n / 2); // 2 nibbles per byte
  const bytes = new Uint8Array(bytesLen);
  bytes[0] = APP_VERSION & 255;

  const lp = langPref ?? LANG_PREF.auto;
  const th = theme ?? THEMES.system;
  const sens = sensHigh ? 1 : 0;
  bytes[1] = (lp & 3) | ((sens & 1) << 2) | ((th & 3) << 3);

  for (let i = 0; i < n; i++) {
    const lvl = Math.min(2, Math.max(0, levels[i] || 0));
    const det = Math.min(3, Math.max(0, details[i] || 0));
    const nibble = ((det & 3) << 2) | (lvl & 3);

    const bi = 2 + Math.floor(i / 2);
    if (i % 2 === 0) bytes[bi] = (bytes[bi] & 0xF0) | (nibble & 0x0F);
    else bytes[bi] = (bytes[bi] & 0x0F) | ((nibble & 0x0F) << 4);
  }

  return base32Encode(bytes);
}

export function unpackFromCode(code) {
  const bytes = base32Decode(code);
  if (bytes.length < 3) throw new Error("too short");
  const version = bytes[0];
  if (version !== APP_VERSION) throw new Error("bad version");

  const flags = bytes[1];
  const langPref = flags & 3;
  const sensHigh = ((flags >> 2) & 1) === 1;
  const theme = (flags >> 3) & 3;

  const n = ALLERGENS.length;
  const levels = new Array(n).fill(0);
  const details = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    const bi = 2 + Math.floor(i / 2);
    const b = bytes[bi] ?? 0;
    const nibble = (i % 2 === 0) ? (b & 0x0F) : ((b >> 4) & 0x0F);
    const lvl = nibble & 3;
    const det = (nibble >> 2) & 3;
    levels[i] = lvl;
    details[i] = det;
  }

  return { langPref, sensHigh, theme, levels, details };
}

export function langFromPref(pref) {
  if (pref === LANG_PREF.en) return "en";
  if (pref === LANG_PREF.sv) return "sv";
  return detectLang();
}

export function themeKeyFromVal(v) {
  return Object.keys(THEMES).find(k => THEMES[k] === v) || "system";
}

export function detailLabel(lang, det) {
  if (det === 0) return "";
  const L = (lang === "en") ? "en" : "sv";
  const map = {
    1: L === "en" ? "mild" : "mild",
    2: L === "en" ? "moderate" : "måttlig",
    3: L === "en" ? "severe" : "allvarlig"
  };
  return map[det] || "";
}

// Render allergy card (normal or kitchen)
export function renderCard(container, { code, note, mode = "normal" }) {
  const state = unpackFromCode(code);
  const lang = langFromPref(state.langPref);
  const T = getText(lang);
  const themeKey = themeKeyFromVal(state.theme);
  applyTheme(themeKey);

  const allergic = [];
  const traces = [];

  for (let i = 0; i < ALLERGENS.length; i++) {
    const lvl = state.levels[i];
    const det = state.details[i];
    if (lvl === 0) continue;

    const it = ALLERGENS[i];
    const label = (lang === "en") ? it.en : it.sv;
    const detTxt = detailLabel(lang, det);
    const line = detTxt ? `${label} (${detTxt})` : label;

    if (lvl === 2) allergic.push(line);
    else traces.push(line);
  }

  const sensTxt = state.sensHigh ? T.sensitiveHigh : T.sensitiveNormal;

  const big = (mode === "kitchen");
  const h2Style = big ? `style="font-size:22px;margin:18px 0 8px"` : "";
  const liStyle = big ? `style="font-size:22px; margin:10px 0"` : "";

  let html = `
    <div class="card">
      <div class="header">
        <h1>${escapeHtml(T.title)}</h1>
        <div class="pill">${escapeHtml(sensTxt)}</div>
      </div>
  `;

  // Tydlig varningsbanner
  if (state.sensHigh || traces.length > 0) {
    const msg = (lang === "en")
      ? "Warning: Avoid cross-contact. Use clean tools."
      : "Varning: Undvik korskontaminering. Använd rena redskap.";
    html += `<div class="banner">${escapeHtml(msg)}</div>`;
  }

  if (allergic.length === 0 && traces.length === 0) {
    html += `<p class="none">${escapeHtml(T.none)}</p>`;
  } else {
    if (allergic.length) {
      html += `<h2 ${h2Style}>${escapeHtml(T.allergicTo)}</h2><ul>`;
      for (const a of allergic) html += `<li ${liStyle}>${escapeHtml(a)}</li>`;
      html += `</ul>`;
    }
    if (traces.length) {
      html += `<h2 ${h2Style}>${escapeHtml(T.tracesOf)}</h2><ul>`;
      for (const a of traces) html += `<li ${liStyle}>${escapeHtml(a)}</li>`;
      html += `</ul>`;
    }
  }

  if (note) {
    html += `<div class="note"><strong>${escapeHtml(T.extra)}:</strong><br>${escapeHtml(note)}</div>`;
  }

  if (!big) {
    html += `<div class="muted">${escapeHtml(T.disclaimer)}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  return { lang, themeKey, sensHigh: state.sensHigh };
}

// Simple helpers for URL
export function urlHere(fileName) {
  const base = new URL(".", location.href);
  return new URL(fileName, base).toString();
}

export function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
