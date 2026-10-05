import { createClient } from "@supabase/supabase-js";

// सिर्फ इंग्लिश से हिंदी नाम बदलने के लिए (इनमें कोई भाव नहीं है)
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
    console.error("❌ Secrets Missing!");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&limit=2000&filters[state]=Rajasthan`;

  try {
    console.log("📡 Fetching from data.gov.in...");
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    if (!res.ok) {
      throw new Error(`Govt API HTTP Error: ${res.status}`);
    }

    const data = await res.json();

    // अगर API खाली डेटा दे तो कुछ भी सेव मत करो
    if (!data || !data.records || data.records.length === 0) {
      console.log("⚠️ Govt API returned 0 records today. No changes made to database.");
      process.exit(0);
    }

    console.log(`✅ Got ${data.records.length} REAL records from Govt API!`);

    const todayStr = new Date().toLocaleDateString("hi-IN");

    const rows = data.records
      .map((r) => {
        const minP = Number(r.min_price) || 0;
        const maxP = Number(r.max_price) || 0;
        const modalP = Number(r.modal_price) || 0;
        if (minP === 0 && maxP === 0 && modalP === 0) return null;

        return {
          mandi_name: MANDI_HINDI[r.market] || r.market || "अज्ञात",
          district: DISTRICT_HINDI[r.district] || r.district || "राजस्थान",
          state: "Rajasthan",
          crop_name: CROP_HINDI[r.commodity] || r.commodity || "फसल",
          variety: (r.variety || "").trim(),
          min_price: minP,
          max_price: maxP,
          modal_price: modalP,
          arrival_date: r.arrival_date || todayStr,
          source: "api",
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      console.log("⚠️ All records were empty/zero. Nothing inserted.");
      process.exit(0);
    }

    console.log(`🧹 Clearing old API records from Supabase...`);
    await supabase.from("mandi_rates").delete().eq("source", "api");

    console.log(`💾 Inserting ${rows.length} REAL government mandi records...`);
    const { error } = await supabase.from("mandi_rates").insert(rows);

    if (error) {
      console.error("❌ Supabase Insert Error:", error.message);
      process.exit(1);
    }

    console.log("🎉 SUCCESS! Real Mandi Rates Updated Successfully!");
  } catch (err) {
    console.error("❌ Sync Error:", err.message);
    process.exit(0);
  }
}

runAutoSync();
