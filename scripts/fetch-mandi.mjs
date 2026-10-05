import { createClient } from "@supabase/supabase-js";

const MANDI_HINDI = {
  "Sardarshahar": "सरदारशहर", "Nohar": "नोहर", "Rawatsar": "रावतसर", "Hanumangarh": "हनुमानगढ़",
  "Sri Ganganagar": "श्रीगंगानगर", "Sriganganagar": "श्रीगंगानगर", "Churu": "चूरू", "Sangaria": "संगरिया",
  "Taranagar": "तारानगर", "Rajgarh": "सादुलपुर (राजगढ़)", "Suratgarh": "सूरतगढ़", "Anupgarh": "अनूपगढ़",
  "Raisinghnagar": "रायसिंहनगर", "Ghadshana": "घड़साना", "Pilibanga": "पीलीबंगा", "Bhadra": "भादरा",
  "Bikaner": "बीकानेर", "Nokha": "नोखा", "Khajuwala": "खाजूवाला", "Lunkaransar": "लूणकरणसर",
  "Shri Dungargarh": "श्रीडूंगरगढ़", "Nagaur": "नागौर", "Merta City": "मेड़ता सिटी", "Degana": "डेगाना",
  "Jodhpur": "जोधपुर (मंडोर)", "Phalodi": "फलौदी", "Jaipur": "जयपुर (मुहाना)", "Chomu": "चौमू",
  "Kotputli": "कोटपूतली", "Sikar": "सीकर", "Neem Ka Thana": "नीमकाथाना", "Jhunjhunu": "झुंझुनूं",
  "Ajmer": "अजमेर", "Kishangarh": "किशनगढ़", "Beawar": "ब्यावर", "Kota": "कोटा (भामाशाह)",
  "Ramganj Mandi": "रामगंजमंडी", "Itawa": "इटावा", "Bundi": "बूंदी", "Baran": "बारां",
  "Chhabra": "छबड़ा", "Jhalawar": "झालावाड़", "Bhawani Mandi": "भवानी मंडी", "Alwar": "अलवर",
  "Khairthal": "खैरथल", "Bharatpur": "भरतपुर", "Bayana": "बयाना", "Barmer": "बाड़मेर",
  "Balotra": "बालोतरा", "Udaipur": "उदयपुर", "Fatehnagar": "फतहनगर", "Bhilwara": "भीलवाड़ा",
  "Tonk": "टोंक", "Niwai": "निवाई", "Sawai Madhopur": "सवाई माधोपुर"
};

const DISTRICT_HINDI = {
  "Churu": "चूरू", "Hanumangarh": "हनुमानगढ़", "Sri Ganganagar": "श्रीगंगानगर", "Sriganganagar": "श्रीगंगानगर",
  "Bikaner": "बीकानेर", "Jaipur": "जयपुर", "Jodhpur": "जोधपुर", "Kota": "कोटा", "Barmer": "बाड़मेर",
  "Nagaur": "नागौर", "Alwar": "अलवर", "Bharatpur": "भरतपुर", "Bundi": "बूंदी", "Baran": "बारां",
  "Jhalawar": "झालावाड़", "Ajmer": "अजमेर", "Sikar": "सीकर", "Jhunjhunu": "झुंझुनूं", "Bhilwara": "भीलवाड़ा",
  "Udaipur": "उदयपुर", "Tonk": "टोंक", "Sawai Madhopur": "सवाई माधोपुर"
};

const TARGET_CROPS = [
  { en: "Mustard", hi: "सरसों" },
  { en: "Wheat", hi: "गेहूं" },
  { en: "Guar", hi: "ग्वार" },
  { en: "Gram", hi: "चना" },
  { en: "Bajra", hi: "बाजरा" },
  { en: "Cotton", hi: "कपास" },
  { en: "Green Gram", hi: "मूंग" },
  { en: "Groundnut", hi: "मूंगफली" },
  { en: "Soyabean", hi: "सोयाबीन" },
  { en: "Cumin", hi: "जीरा" },
  { en: "Barley", hi: "जौ" },
  { en: "Paddy", hi: "धान" }
];

function istDateISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d); // YYYY-MM-DD
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJsonWithRetry(url, tries = 6) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const text = await res.text();

      if (!res.ok) {
        // server busy / throttling
        if ([429, 500, 502, 503, 504].includes(res.status)) {
          await sleep(Math.min(60000, 1000 * 2 ** i));
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = JSON.parse(text);
      return json;
    } catch (e) {
      lastErr = e;
      await sleep(Math.min(60000, 1000 * 2 ** i));
    }
  }
  throw lastErr ?? new Error("Unknown fetch error");
}

// Normalize some common arrival_date formats to YYYY-MM-DD if needed
function normalizeDateToISO(s) {
  if (!s) return "";
  // already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dd/mm/yyyy
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(s);
}

async function fetchDataGovPage({ baseUrl, apiKey, state, commodity, arrival_date, limit, offset }) {
  const u = new URL(baseUrl);
  u.searchParams.set("api-key", apiKey);
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", String(limit));
  u.searchParams.set("offset", String(offset));

  // filters (field names usually exactly these for agmarknet datasets)
  u.searchParams.set("filters[state]", state);
  u.searchParams.set("filters[commodity]", commodity);
  u.searchParams.set("filters[arrival_date]", arrival_date);

  return fetchJsonWithRetry(u.toString(), 6);
}

async function runAutoSync() {
  console.log("🚀 Starting Daily Govt Mandi Sync (data.gov.in) ...");

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
  const DATA_GOV_RESOURCE_ID = process.env.DATA_GOV_RESOURCE_ID;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase secrets missing: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!DATA_GOV_API_KEY || !DATA_GOV_RESOURCE_ID) {
    throw new Error("Missing: DATA_GOV_API_KEY or DATA_GOV_RESOURCE_ID (add in GitHub Secrets)");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const todayISO = istDateISO();
  const baseUrl = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}`;
  const allRows = [];

  for (const crop of TARGET_CROPS) {
    console.log(`📡 Fetching data.gov.in for: ${crop.hi} (${crop.en}) | date=${todayISO}`);
    const limit = 200;
    let offset = 0;
    let gotAny = false;

    while (true) {
      const json = await fetchDataGovPage({
        baseUrl,
        apiKey: DATA_GOV_API_KEY,
        state: "Rajasthan",
        commodity: crop.en,
        arrival_date: todayISO,
        limit,
        offset
      });

      const records = json?.records || [];
      if (records.length === 0) break;

      gotAny = true;

      for (const r of records) {
        const marketRaw = r.market || r.Market || "";
        const districtRaw = r.district || r.District || "";
        const varietyRaw = r.variety || r.Variety || "";

        const minP = Number(r.min_price ?? r.Min_Price ?? r.minimum_price ?? 0) || 0;
        const maxP = Number(r.max_price ?? r.Max_Price ?? r.maximum_price ?? 0) || 0;
        const modalP = Number(r.modal_price ?? r.Modal_Price ?? r.modal ?? 0) || (maxP || minP);

        if (!marketRaw) continue;
        if (minP === 0 && maxP === 0 && modalP === 0) continue;

        const arrival = normalizeDateToISO(r.arrival_date || r.Arrival_Date || todayISO);

        allRows.push({
          mandi_name: MANDI_HINDI[marketRaw] || marketRaw,
          district: DISTRICT_HINDI[districtRaw] || districtRaw || "राजस्थान",
          state: "Rajasthan",
          crop_name: crop.hi,
          variety: (varietyRaw && varietyRaw !== "Local" && varietyRaw !== "Other") ? varietyRaw : "",
          min_price: minP,
          max_price: maxP,
          modal_price: modalP,
          arrival_date: arrival,
          source: "api",
          updated_at: new Date().toISOString()
        });
      }

      offset += limit;

      // safety stop to avoid infinite loops
      if (offset > 5000) break;
    }

    if (!gotAny) console.log(`⚠️ No records for ${crop.en} on ${todayISO}`);
  }

  console.log(`📦 Extracted ${allRows.length} Govt Mandi Records!`);
  if (allRows.length === 0) {
    console.log("⚠️ No records fetched. Keeping existing DB intact.");
    return;
  }

  // Safer approach: delete only after we have fresh data
  console.log("🧹 Clearing old API records from Supabase...");
  const delRes = await supabase.from("mandi_rates").delete().eq("source", "api");
  if (delRes.error) console.error("Delete error:", delRes.error);

  console.log(`💾 Inserting ${allRows.length} records...`);
  const insRes = await supabase.from("mandi_rates").insert(allRows);
  if (insRes.error) {
    console.error("❌ Insert error:", insRes.error);
  } else {
    console.log("🎉 SUCCESS! Sync completed.");
  }
}

runAutoSync().catch((e) => {
  console.error("❌ Fatal:", e?.message || e);
  process.exit(1);
});
