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

const CROP_HINDI = {
  "Wheat": "गेहूं", "Mustard": "सरसों", "Guar": "ग्वार", "Guar Seed(Cluster Beans Seed)": "ग्वार",
  "Bajra(Pearl Millet/Cumbu)": "बाजरा", "Bajra": "बाजरा", "Green Gram (Moong)(Whole)": "मूंग",
  "Moath Dal": "मोठ", "Gram": "चना", "Groundnut": "मूंगफली", "Cotton": "कपास",
  "Cummin Seed(Jeera)": "जीरा", "Isabgol": "इसबगोल", "Barley (Jau)": "जौ", "Maize": "मक्का",
  "Soyabean": "सोयाबीन", "Paddy(Dhan)(Common)": "धान", "Coriander(Leaves)": "धनिया", "Coriander": "धनिया",
  "Garlic": "लहसुन", "Onion": "प्याज़", "Till(Sesamum)": "तिल"
};

async function runAutoSync() {
  console.log("🚀 Starting Daily Mandi Sync...");

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATA_GOV_API_KEY) {
    console.error("❌ Secrets Missing in GitHub Environment!");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  // Fetch full records limit without filters parameter string issue
  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=3000`;

  console.log("📡 Requesting raw records from Govt API...");
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    console.error(`❌ Govt API Returned HTTP Error Status: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const allRecords = data?.records || [];

  console.log(`📦 Received ${allRecords.length} total records from Govt API.`);

  if (allRecords.length === 0) {
    console.error("❌ Govt API returned 0 total records today. API server might be down.");
    process.exit(1);
  }

  // Filter Rajasthan records in memory safely
  const rajRecords = allRecords.filter((r) => {
    const st = String(r.state || r.State || r.state_name || "").toLowerCase();
    return st.includes("rajasthan") || st.includes("raj");
  });

  console.log(`🌾 Found ${rajRecords.length} records specifically for Rajasthan.`);

  // If specific state field filter is empty, process all valid returned records
  const targetRecords = rajRecords.length > 0 ? rajRecords : allRecords;

  const todayStr = new Date().toLocaleDateString("hi-IN");

  const rows = targetRecords
    .map((r) => {
      const minP = Number(r.min_price) || 0;
      const maxP = Number(r.max_price) || 0;
      const modalP = Number(r.modal_price) || 0;
      if (minP === 0 && maxP === 0 && modalP === 0) return null;

      const marketRaw = String(r.market || "");
      const districtRaw = String(r.district || "");
      const cropRaw = String(r.commodity || "");

      return {
        mandi_name: MANDI_HINDI[marketRaw] || marketRaw || "अज्ञात",
        district: DISTRICT_HINDI[districtRaw] || districtRaw || "राजस्थान",
        state: "Rajasthan",
        crop_name: CROP_HINDI[cropRaw] || cropRaw || "फसल",
        variety: String(r.variety || "").trim(),
        min_price: minP,
        max_price: maxP,
        modal_price: modalP,
        arrival_date: String(r.arrival_date || todayStr),
        source: "api",
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    console.error("❌ 0 valid price rows found after parsing.");
    process.exit(1);
  }

  console.log(`🧹 Clearing old API records from Supabase...`);
  const { error: delError } = await supabase.from("mandi_rates").delete().eq("source", "api");
  if (delError) console.warn("Delete warning:", delError.message);

  console.log(`💾 Inserting ${rows.length} real Govt Mandi records into Supabase...`);
  const { error: insError } = await supabase.from("mandi_rates").insert(rows);

  if (insError) {
    console.error("❌ Supabase DB Insert Failed:", insError.message);
    process.exit(1);
  }

  console.log(`🎉 SUCCESS! Successfully inserted ${rows.length} Mandi Rates into Supabase!`);
}

runAutoSync();
