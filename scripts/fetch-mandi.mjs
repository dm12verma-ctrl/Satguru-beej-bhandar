import { createClient } from "@supabase/supabase-js";
import dns from "node:dns";

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

// Full Browser ASP.NET Headers to bypass HTTP 403 Forbidden
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
  "Referer": "https://agmarknet.gov.in/",
  "Sec-Ch-Ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "cross-site",
  "Upgrade-Insecure-Requests": "1"
};

async function fetchCropRss(cropEn) {
  const targetUrl = `https://agmarknet.gov.in/RssFeed/RssFeed_Commoditywise.aspx?com=${encodeURIComponent(cropEn)}`;
  
  // 1. Direct fetch with Browser Headers
  try {
    const res = await fetch(targetUrl, { headers: BROWSER_HEADERS });
    if (res.ok) {
      const xml = await res.text();
      if (xml && xml.includes("<item>")) return xml;
    }
  } catch (e) {}

  // 2. AllOrigins Proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const xml = await res.text();
      if (xml && xml.includes("<item>")) return xml;
    }
  } catch (e) {}

  // 3. ThingProxy
  try {
    const proxyUrl = `https://thingproxy.freeboard.io/fetch/${targetUrl}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const xml = await res.text();
      if (xml && xml.includes("<item>")) return xml;
    }
  } catch (e) {}

  return null;
}

async function runAutoSync() {
  console.log("🚀 Starting Daily Agmarknet Mandi Sync...");

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase Secrets Missing in Environment!");
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const allRows = [];
  const todayStr = new Date().toLocaleDateString("hi-IN");

  for (const crop of TARGET_CROPS) {
    console.log(`📡 Fetching Agmarknet Feed for: ${crop.hi} (${crop.en})...`);
    const xmlText = await fetchCropRss(crop.en);

    if (!xmlText) {
      console.warn(`⚠️ Could not fetch RSS feed for ${crop.en}`);
      continue;
    }

    const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of items) {
      if (!itemXml.toLowerCase().includes("rajasthan")) continue;

      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
      const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

      const text = (titleMatch ? titleMatch[1] : "") + " " + (descMatch ? descMatch[1] : "");

      const mktMatch = text.match(/Market:\s*([^,<\n]+)/i);
      const mktRaw = mktMatch ? mktMatch[1].trim() : "";
      if (!mktRaw) continue;

      const distMatch = text.match(/District:\s*([^,<\n]+)/i);
      const distRaw = distMatch ? distMatch[1].trim() : "";

      const varMatch = text.match(/Variety:\s*([^,<\n]+)/i);
      const varietyRaw = varMatch ? varMatch[1].trim() : "";

      const minMatch = text.match(/Min:\s*(\d+)/i) || text.match(/Minimum:\s*(\d+)/i);
      const maxMatch = text.match(/Max:\s*(\d+)/i) || text.match(/Maximum:\s*(\d+)/i);
      const modalMatch = text.match(/Modal:\s*(\d+)/i);

      const minP = minMatch ? Number(minMatch[1]) : 0;
      const maxP = maxMatch ? Number(maxMatch[1]) : 0;
      const modalP = modalMatch ? Number(modalMatch[1]) : (maxP || minP);

      if (minP === 0 && maxP === 0 && modalP === 0) continue;

      const marketHi = MANDI_HINDI[mktRaw] || mktRaw;
      const districtHi = DISTRICT_HINDI[distRaw] || distRaw || "राजस्थान";

      let dateStr = todayStr;
      if (dateMatch && dateMatch[1]) {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toLocaleDateString("hi-IN");
        }
      }

      allRows.push({
        mandi_name: marketHi,
        district: districtHi,
        state: "Rajasthan",
        crop_name: crop.hi,
        variety: varietyRaw !== "Local" && varietyRaw !== "Other" ? varietyRaw : "",
        min_price: minP,
        max_price: maxP,
        modal_price: modalP,
        arrival_date: dateStr,
        source: "api",
        updated_at: new Date().toISOString()
      });
    }
  }

  console.log(`📦 Extracted ${allRows.length} REAL Govt Mandi Records!`);

  if (allRows.length > 0) {
    console.log(`🧹 Clearing old API records from Supabase...`);
    await supabase.from("mandi_rates").delete().eq("source", "api");

    console.log(`💾 Inserting ${allRows.length} fresh records into Supabase...`);
    const { error: insErr } = await supabase.from("mandi_rates").insert(allRows);

    if (insErr) {
      console.error("❌ Supabase Insert Error:", insErr.message);
    } else {
      console.log(`🎉 SUCCESS! Fully Synced ${allRows.length} Live Mandi Rates!`);
    }
  } else {
    console.log("⚠️ Govt RSS returned 0 records today. Keeping existing Database intact.");
  }
}

runAutoSync();
