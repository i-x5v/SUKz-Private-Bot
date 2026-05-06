import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
} from "discord.js";

// ══════════════════════════════════════════
//               PRAYER TIMES
// ══════════════════════════════════════════

const prayerCities = [
  { label: "🇸🇦 الرياض", value: "Riyadh|SA" },
  { label: "🇸🇦 جدة", value: "Jeddah|SA" },
  { label: "🇸🇦 مكة المكرمة", value: "Mecca|SA" },
  { label: "🇸🇦 المدينة المنورة", value: "Medina|SA" },
  { label: "🇸🇦 الدمام", value: "Dammam|SA" },
  { label: "🇦🇪 دبي", value: "Dubai|AE" },
  { label: "🇦🇪 أبوظبي", value: "Abu Dhabi|AE" },
  { label: "🇰🇼 الكويت", value: "Kuwait City|KW" },
  { label: "🇶🇦 الدوحة", value: "Doha|QA" },
  { label: "🇧🇭 المنامة", value: "Manama|BH" },
  { label: "🇴🇲 مسقط", value: "Muscat|OM" },
  { label: "🇪🇬 القاهرة", value: "Cairo|EG" },
  { label: "🇯🇴 عمّان", value: "Amman|JO" },
  { label: "🇲🇦 الرباط", value: "Rabat|MA" },
  { label: "🇲🇦 الدار البيضاء", value: "Casablanca|MA" },
  { label: "🇩🇿 الجزائر", value: "Algiers|DZ" },
  { label: "🇹🇳 تونس", value: "Tunis|TN" },
  { label: "🇾🇪 صنعاء", value: "Sanaa|YE" },
  { label: "🇮🇶 بغداد", value: "Baghdad|IQ" },
  { label: "🇱🇾 طرابلس", value: "Tripoli|LY" },
  { label: "🇸🇩 الخرطوم", value: "Khartoum|SD" },
  { label: "🇸🇾 دمشق", value: "Damascus|SY" },
  { label: "🇱🇧 بيروت", value: "Beirut|LB" },
  { label: "🇵🇸 القدس", value: "Jerusalem|PS" },
  { label: "🇹🇷 إسطنبول", value: "Istanbul|TR" },
];

const prayerDuas = [
  "**دعاء الفجر:** اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
  "**دعاء الظهر:** اللَّهُمَّ اجْعَلْ هَذَا الْيَوْمَ خَيْراً وَبَرَكَةً لَنَا وَلِجَمِيعِ الْمُسْلِمِينَ",
  "**دعاء العصر:** اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ",
  "**دعاء المغرب:** اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
  "**دعاء العشاء:** بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا — وقراءة آية الكرسي قبل النوم",
  "**دعاء عام:** رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  "**دعاء الرزق:** اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
];

async function getPrayerTimes(city: string, country: string): Promise<{ timings: Record<string, string>; date: string } | null> {
  try {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4`;
    const res = await fetch(url);
    const data = await res.json() as { data?: { timings?: Record<string, string>; date?: { readable?: string } } };
    if (data.data?.timings) {
      return { timings: data.data.timings, date: data.data.date?.readable ?? "" };
    }
    return null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
//              COD TRAINING
// ══════════════════════════════════════════

const codTraining: Record<string, { name: string; emoji: string; trainings: { name: string; content: string }[] }> = {
  cod4: {
    name: "Modern Warfare (2007)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Ambush",
        content: "**📍 الموقع:** الحافة الجنوبية قرب الحطام\n**🔫 السلاح:** M40A3 أو Barrett .50cal\n\n**📋 التعليمات:**\n• اتخذ موقعك على الحافة الجنوبية جنب الحطام\n• استهدف اللاعبين عند خروجهم من المبنى الشمالي\n• استخدم Drag Scope للحصول على أسرع قتل\n• لا تبقى في نفس الموقع أكثر من قتيلين\n• استخدم Claymore خلفك لحمايتك من الفلانك",
      },
      {
        name: "🔫 SMG على Crash",
        content: "**📍 الموقع:** المباني الصغيرة جنب المستشفى\n**🔫 السلاح:** MP5 أو AK74u\n\n**📋 التعليمات:**\n• تحرك عبر المباني الصغيرة جنب المستشفى\n• استخدم Stopping Power + Steady Aim\n• فلانك من الطريق الجانبي الأيسر\n• تجنب الميدان المفتوح — ابقَ على الجوانب\n• نظّف كل غرفة قبل ما تعبرها",
      },
      {
        name: "🏃 Rushing على Vacant",
        content: "**📍 الموقع:** الممر الأيمن الجانبي\n**🔫 السلاح:** G3 أو M14\n\n**📋 التعليمات:**\n• اقتحم من الممر الأيمن مع Frag Grenade أولاً\n• نظّف الغرف بالترتيب: يمين ثم يسار\n• تجنب النوافذ لأنها مكشوفة تماماً\n• استخدم Extreme Conditioning للجري السريع\n• حافظ على زاوية 90 درجة عند كل زاوية",
      },
      {
        name: "🏠 Camping على Overgrown",
        content: "**📍 الموقع:** المبنى الكبير الجنوبي\n**🔫 السلاح:** M40A3 أو Dragunov\n\n**📋 التعليمات:**\n• احتل الطابق الثاني من المبنى الجنوبي\n• أغلق الدرج بـ Claymore\n• استهدف مسار المشاة الرئيسي\n• استخدم UAV Jammer لتجنب الرصد\n• تحرك للطابق الأول عند الانكشاف",
      },
    ],
  },
  cod5: {
    name: "World at War (2008)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Dome",
        content: "**📍 الموقع:** المنصة العلوية المركزية\n**🔫 السلاح:** Arisaka + Telescopic Sight\n\n**📋 التعليمات:**\n• احتل المنصة العلوية — تُشرف على كامل الخريطة\n• اقفل الدرج خلفك بـ Bouncing Betty\n• راقب المدخلين الشمالي والجنوبي بالتناوب\n• استخدم Camouflage Perk لإخفاء اسمك\n• تحرك عند كل 3 قتلات لتضليل الأعداء",
      },
      {
        name: "🔫 LMG على Makin",
        content: "**📍 الموقع:** الجانب الأيسر عبر الغابة\n**🔫 السلاح:** BAR مع Bandolier\n\n**📋 التعليمات:**\n• استخدم BAR مع Bandolier لأطول وقت إطلاق\n• الغابة من الجانب الأيسر توفر غطاء ممتاز\n• فعّل Juggernaut Perk لتحمل أكثر\n• لا تواجه المركبات مباشرة — فلانك من الخلف\n• استخدم مجموعة نيران لتغطية الزملاء",
      },
      {
        name: "🏠 Shotgun على Roundhouse",
        content: "**📍 الموقع:** الأقفاص المركزية والممرات الضيقة\n**🔫 السلاح:** Trench Gun أو Double-Barreled\n\n**📋 التعليمات:**\n• Trench Gun أفضل سلاح داخل المباني المغلقة\n• استخدم Sleight of Hand لإعادة التحميل السريع\n• الأقفاص المركزية: موقع هجوم مثالي جداً\n• تجنب الأسطح — مكشوفة تماماً للقناصة\n• ابقَ متحركاً — لا تقف في مكان واحد",
      },
      {
        name: "💣 Grenade Spam على Banzai",
        content: "**📍 الموقع:** الجسر المركزي\n**🔫 السلاح:** Thompson + Tabun Gas Grenades\n\n**📋 التعليمات:**\n• ارمِ Tabun Gas على الجسر قبل الاقتراب\n• استخدم Thompson للتمشيط السريع\n• Martyrdom Perk يعطيك قنبلة عند الموت\n• تحرك عبر الجانب الأيمن من النهر\n• استخدم الاشجار كغطاء عند التقدم",
      },
    ],
  },
  cod6: {
    name: "Modern Warfare 2 (2009)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Wasteland",
        content: "**📍 الموقع:** الخنادق عند نقطة B\n**🔫 السلاح:** Intervention + Stopping Power\n\n**📋 التعليمات:**\n• Intervention + Stopping Power = قتل فوري بكل مكان\n• اختبئ في الخنادق عند نقطة B — غطاء ممتاز\n• استخدم Coldblooded لتجنب UAV والمروحيات\n• الحشيش الطويل غطاء مثالي — لا تبرز منه\n• Quick Scope للمسافات المتوسطة",
      },
      {
        name: "🔫 Akimbo على Rust",
        content: "**📍 الموقع:** المنصة المركزية العالية\n**🔫 السلاح:** Akimbo Glock 18 أو M93 Raffica\n\n**📋 التعليمات:**\n• Rush المنطقة الوسطى فوراً بعد البداية\n• Commando Perk للطعن من مسافة أبعد\n• Marathon للجري المستمر بلا توقف\n• Lightweight للسرعة القصوى عند التنقل\n• احتل المنصة العالية للسيطرة على الخريطة",
      },
      {
        name: "🏃 Knife Rush على Terminal",
        content: "**📍 الموقع:** صالة المطار والأروقة الضيقة\n**🔫 السلاح:** Tactical Knife + Any Pistol\n\n**📋 التعليمات:**\n• Commando + Lightweight + Marathon = بنية الطعن المثالية\n• ابدأ من جهة الطائرة وانقض على اللاعبين\n• استخدم الغرف الضيقة لتجنب الرصاص\n• اهرب فور انكشافك للمنطقة المفتوحة\n• Tactical Knife يجعل الطعن أسرع بكثير",
      },
      {
        name: "🏠 Camping على Highrise",
        content: "**📍 الموقع:** السطح العلوي والطوابق العليا\n**🔫 السلاح:** FAMAS أو M16A4\n\n**📋 التعليمات:**\n• احتل الطابق العلوي في مبنى البداية\n• Heartbeat Sensor يكشف الأعداء من بعيد\n• استخدم Cold-Blooded لتجنب Thermal Scopes\n• ضع Claymores على مداخل الدرج\n• Scavenger لجمع ذخيرة الأعداء الميتين",
      },
    ],
  },
  cod7: {
    name: "Black Ops (2010)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Array",
        content: "**📍 الموقع:** أعلى برج الرادار\n**🔫 السلاح:** L96A1 + Extended Mag\n\n**📋 التعليمات:**\n• L96A1 أفضل سنايبر في اللعبة — ضرب واحد يقتل\n• أعلى البرج الراداري يُشرف على نصف الخريطة\n• Warlord + Extended Mag لذخيرة أكثر\n• راقب المسار الأوسط بشكل مستمر\n• Ghost + Ninja = لا تُرصد ولا تُسمع",
      },
      {
        name: "🔫 AK74u على Nuketown",
        content: "**📍 الموقع:** مداخل البيوت والسياج\n**🔫 السلاح:** AK-74u + Rapid Fire\n\n**📋 التعليمات:**\n• Rush النهاية المقابلة فوراً عند بداية المباراة\n• Flak Jacket ضروري ضد وابل الجرينيدات\n• Ghost + Ninja = لا تظهر في الرادار\n• Warlord لإضافة Rapid Fire + Extended Mag\n• احتل السياج المركزي للسيطرة الكاملة",
      },
      {
        name: "🏠 Shotgun على Havana",
        content: "**📍 الموقع:** الأزقة الجانبية والمداخل الضيقة\n**🔫 السلاح:** SPAS-12 أو HS10 Akimbo\n\n**📋 التعليمات:**\n• SPAS-12 في الأزقة الجانبية — فتاك جداً\n• الممرات الجانبية أسرع من الطريق الرئيسي\n• Sleight of Hand لإعادة التحميل السريع جداً\n• نظّف كل زاوية قبل ما تعبر — لا تتسرع\n• Tactical Mask ضد Flash و Concussion",
      },
      {
        name: "💣 RC-XD على Cracked",
        content: "**📍 الموقع:** الشوارع الضيقة والمداخل\n**�ف السلاح:** FAMAS + Grenade Launcher\n\n**📋 التعليمات:**\n• احصل على RC-XD (3 قتلات) واستخدمه بذكاء\n• الشوارع الضيقة في Cracked مثالية للـ RC-XD\n• أرسله من زاوية غير متوقعة للمباغتة\n• Hardline يخفض المتطلبات بقتلة واحدة\n• FAMAS للتمشيط السريع بعد كل Killstreak",
      },
    ],
  },
  cod8: {
    name: "Modern Warfare 3 (2011)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Arkaden",
        content: "**📍 الموقع:** الطابق الثاني والشرفات\n**🔫 السلاح:** RSASS + Ballistics CPU\n\n**📋 التعليمات:**\n• RSASS مع Ballistics CPU في الطابق الثاني\n• استهدف المداخل الثلاثة من موقع واحد\n• Assassin Pro يمنع UAV من رصدك نهائياً\n• تحرك كل 3 قتلات لتضليل الأعداء\n• Dead Silence لتحرك صامت تماماً",
      },
      {
        name: "🔫 PP90M1 على Village",
        content: "**📍 الموقع:** الأكواخ المركزية والممرات\n**🔫 السلاح:** PP90M1 + Rapid Fire + Silencer\n\n**📋 التعليمات:**\n• PP90M1 + Rapid Fire + Silencer = آلة قتل صامتة\n• تحرك عبر الأكواخ المركزية دائماً\n• Dead Silence + Blind Eye لتجنب الرصد الكامل\n• تجنب مدخل القرية الشمالي — مكشوف تماماً\n• Scavenger لجمع ذخيرة إضافية باستمرار",
      },
      {
        name: "🏆 Support Package",
        content: "**📍 الاستراتيجية:** الدعم الجماعي\n**🔫 السلاح:** أي سلاح متوازن\n\n**📋 التعليمات:**\n• اختار: UAV + Counter UAV + Ballistic Vests\n• Support Package لا يصفر عند الموت — ميزة كبيرة\n• فعّل Ballistic Vests على الفريق قبل الهجوم\n• Specialist Strike Package مع Stealth للخبراء\n• Blind Eye + Assassin + Dead Silence = مثالي",
      },
      {
        name: "🏠 Shotgun على Dome",
        content: "**📍 الموقع:** المبنى الداخلي والممرات\n**🔫 السلاح:** USAS-12 + Rapid Fire\n\n**📋 التعليمات:**\n• USAS-12 مع Rapid Fire = أقوى shotgun في اللعبة\n• Dome صغيرة — Close range في كل مكان\n• Steady Aim للدقة عند الإطلاق من الخصر\n• Quickdraw لرفع السلاح أسرع عند المواجهة\n• احتل المبنى الداخلي للسيطرة على المباراة",
      },
    ],
  },
  cod9: {
    name: "Black Ops 2 (2012)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر Ballista على Standoff",
        content: "**📍 الموقع:** المركز الحجري بين الفريقين\n**🔫 السلاح:** Ballista + Iron Lung Wildcard\n\n**📋 التعليمات:**\n• Ballista + Iron Lung = أثبت يد سنايبر في اللعبة\n• المركز الحجري يُشرف على كامل الخريطة\n• اقفل خطك بمسدس عند اقتراب الأعداء\n• Toughness Perk لعدم اهتزاز الصورة عند الإصابة\n• Fast Hands للتبديل السريع بين الأسلحة",
      },
      {
        name: "🔫 MSMC على Slums",
        content: "**📍 الموقع:** الأزقة الجانبية والمباني\n**🔫 السلاح:** MSMC + Fast Mag + Stock\n\n**📋 التعليمات:**\n• MSMC + Fast Mag + Stock = أسرع SMG في اللعبة\n• الأزقة الجانبية أفضل بكثير من الطريق الرئيسي\n• Flak Jacket + Tac Mask ضد الحروب الكيميائية\n• Engineer لرؤية الألغام والـ Equipment\n• Dexterity للتسلق السريع على العوائق",
      },
      {
        name: "🏠 Close Range على Nuketown 2025",
        content: "**📍 الموقع:** البيوت والسياج المركزي\n**🔫 السلاح:** Remington 870 + Long Barrel\n\n**📋 التعليمات:**\n• Remington 870 + Long Barrel في البيوت = فتاك\n• Rush النهاية المقابلة فوراً عند البداية\n• Lightweight + Dexterity للحركة السريعة جداً\n• Guardian أو Dragonfire كـ Scorestreak لتأمين المنطقة\n• احتل السقف لميزة تكتيكية على الأعداء",
      },
      {
        name: "💣 Scorestreak على Hijacked",
        content: "**📍 الموقع:** اليخت والممرات الجانبية\n**🔫 السلاح:** PDW-57 + Silencer\n\n**📋 التعليمات:**\n• PDW-57 + Silencer للحركة الصامتة على اليخت\n• الممرات الجانبية أأمن من المنتصف\n• اجمع Scorestreaks: UAV + Care Package + Lightning Strike\n• Ghost لإخفاء موقعك من UAV الأعداء\n• انتبه للـ Sniper spots على الأجنحة الجانبية",
      },
    ],
  },
  cod10: {
    name: "Ghosts (2013)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Stonehaven",
        content: "**📍 الموقع:** القلعة المركزية العالية\n**🔫 السلاح:** L115 أو VKS + Variable Zoom\n\n**📋 التعليمات:**\n• القلعة المركزية تُشرف على كامل الخريطة\n• Off The Grid لتجنب SAT COM نهائياً\n• تحرك بين الأعمدة لتضليل الأعداء\n• VKS صامت طبيعياً — لا يكشف موقعك\n• احرص على حماية ظهرك دائماً",
      },
      {
        name: "🔫 Honey Badger على Prison Break",
        content: "**📍 الموقع:** الممرات الداخلية للسجن\n**�ف السلاح:** Honey Badger (كاتم مدمج)\n\n**📋 التعليمات:**\n• Honey Badger مدمج فيه كاتم — لا تضيف شيء\n• الممرات الداخلية للسجن أفضل مسار دائماً\n• Ready Up لرفع السلاح أسرع بعد الجري\n• Off The Grid + Incog = شبه غير مرئي في الرادار\n• استخدم Threat Detector لكشف الأعداء خلف الجدران",
      },
      {
        name: "🏃 Rushing على Strikezone",
        content: "**📍 الموقع:** ممرات الملعب والمداخل\n**🔫 السلاح:** Vector CRB + Extended Mags\n\n**📋 التعليمات:**\n• Strikezone صغيرة — Rush هو الاستراتيجية الأفضل\n• Vector CRB + Extended Mags للإطلاق المستمر\n• Agility + Marathon للسرعة القصوى\n• استخدم الدخان لتغطية تقدمك\n• احتل المنتصف فوراً لسيطرة كاملة",
      },
      {
        name: "🏠 Defensive على Warhawk",
        content: "**📍 الموقع:** المباني الجانبية والأسطح\n**�ف السلاح:** MTAR-X + Red Dot\n\n**📋 التعليمات:**\n• احتل المبنى الجانبي الأيمن للدفاع المثالي\n• Amplify لسماع خطوات الأعداء بوضوح\n• Blind Eye لتجنب الطائرات والـ Killstreaks\n• Sentry Gun على مدخل المبنى للحماية\n• تغطية زاوية 180 درجة من موقعك",
      },
    ],
  },
  cod11: {
    name: "Advanced Warfare (2014)",
    emoji: "🎮",
    trainings: [
      {
        name: "🎯 سنايبر على Retreat",
        content: "**📍 الموقع:** الأسطح العالية عبر Exo Jump\n**🔫 السلاح:** MORS (Rail Gun)\n\n**📋 التعليمات:**\n• MORS = قتل فوري بضربة واحدة في أي مكان\n• استخدم Exo Suit للقفز على الأسطح العالية\n• Exo Cloak + سنايبر = فوضى كاملة للأعداء\n• راقب الـ Boost Jump — يمكن توقّع مسار الأعداء\n• Low Profile لتقليل ظهورك في الـ Threat Grenade",
      },
      {
        name: "🔫 BAL-27 على Terrace",
        content: "**📍 الموقع:** الطوابق المتعددة والممرات المفتوحة\n**�ف السلاح:** BAL-27 + Foregrip + Extended Mag\n\n**📋 التعليمات:**\n• BAL-27 + Foregrip + Extended Mag = أفضل AR في اللعبة\n• استخدم Exo Boost للوصول للأماكن المرتفعة\n• Hardline لتقليل نقاط الـ Killstreak بنقطة واحدة\n• Exo Overclock لتسريع شحن الـ Exo Abilities\n• استغل الطوابق المتعددة لمفاجأة الأعداء",
      },
      {
        name: "🏃 Boost Jump Rush على Bio Lab",
        content: "**📍 الموقع:** الحواجز المركزية عبر الـ Boost\n**�ف السلاح:** Atlas 45 + Quickdraw + Lightweight\n\n**📋 التعليمات:**\n• اقفز فوق الحواجز المركزية للمباغتة المستمرة\n• Exo Mute Device لإخفاء صوت الـ Exo Suit\n• حرك القاذف بسرعة بعد كل قتل لـ Chain سريعة\n• Exo Cloak للاختباء لثوان عند الخطر\n• Lightweight + Agility للحركة الأسرع في اللعبة",
      },
      {
        name: "🏠 Exo Abilities على Comeback",
        content: "**📍 الموقع:** البيئة الحضرية المتعددة المستويات\n**🔫 السلاح:** HBRa3 + Foregrip + Silencer\n\n**📋 التعليمات:**\n• HBRa3 + Silencer للتحرك الصامت بين المستويات\n• Exo Shield كغطاء إضافي عند الهجوم\n• استخدم Exo Trophy System ضد الجرينيدات\n• Blind Eye + Low Profile = غير مرئي للـ Killstreaks\n• استغل تعدد المستويات لمباغتة الأعداء من الأعلى",
      },
    ],
  },
};

export const prayerTrainingCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("prayer")
      .setDescription("🕌 أوقات الصلاة — اختر مدينتك"),
    async execute(interaction: ChatInputCommandInteraction) {
      const chunks = [];
      for (let i = 0; i < prayerCities.length; i += 25) {
        chunks.push(prayerCities.slice(i, i + 25));
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId("prayer_city")
        .setPlaceholder("🕌 اختر مدينتك...")
        .addOptions(
          chunks[0]!.map(c =>
            new StringSelectMenuOptionBuilder().setLabel(c.label).setValue(c.value)
          )
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      const embed = new EmbedBuilder()
        .setTitle("🕌 أوقات الصلاة")
        .setDescription("اختر مدينتك من القائمة لمعرفة أوقات الصلاة اليوم\n\n**الدول المتاحة:** 🇸🇦 🇦🇪 🇰🇼 🇶🇦 🇧🇭 🇴🇲 🇪🇬 🇯🇴 🇲🇦 🇩🇿 🇹🇳 🇾🇪 🇮🇶 🇱🇾 🇸🇩 🇸🇾 🇱🇧 🇵🇸 🇹🇷")
        .setColor(0x1a5276)
        .setFooter({ text: "حافظ على صلواتك • Bot_SUKz" });

      const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
        filter: i => i.user.id === interaction.user.id,
        max: 1,
      });

      collector.on("collect", async i => {
        await i.deferUpdate();
        const [city, country] = i.values[0]!.split("|") as [string, string];
        const cityLabel = prayerCities.find(c => c.value === i.values[0])?.label ?? city;

        const data = await getPrayerTimes(city, country);
        if (!data) {
          await i.editReply({ content: "❌ ما قدرت أجيب أوقات الصلاة، جرب مرة ثانية.", components: [] });
          return;
        }

        const t = data.timings;
        const dua = prayerDuas[Math.floor(Math.random() * prayerDuas.length)]!;

        const prayerEmbed = new EmbedBuilder()
          .setTitle(`🕌 أوقات الصلاة — ${cityLabel}`)
          .setDescription(`📅 **${data.date}**`)
          .addFields(
            { name: "🌅 الفجر", value: `**${t["Fajr"] ?? "--"}**`, inline: true },
            { name: "🌄 الشروق", value: `**${t["Sunrise"] ?? "--"}**`, inline: true },
            { name: "☀️ الظهر", value: `**${t["Dhuhr"] ?? "--"}**`, inline: true },
            { name: "🌤️ العصر", value: `**${t["Asr"] ?? "--"}**`, inline: true },
            { name: "🌇 المغرب", value: `**${t["Maghrib"] ?? "--"}**`, inline: true },
            { name: "🌙 العشاء", value: `**${t["Isha"] ?? "--"}**`, inline: true },
            { name: "🤲 دعاء اليوم", value: dua },
          )
          .setColor(0x1a5276)
          .setFooter({ text: "الصلاة عماد الدين • Bot_SUKz" })
          .setTimestamp();

        await i.editReply({ embeds: [prayerEmbed], components: [] });
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("training")
      .setDescription("🎮 تدريبات Call of Duty — CoD 4 حتى CoD 11"),
    async execute(interaction: ChatInputCommandInteraction) {
      const gameSelect = new StringSelectMenuBuilder()
        .setCustomId("cod_game")
        .setPlaceholder("🎮 اختر جزء CoD...")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 4 — Modern Warfare").setValue("cod4").setDescription("2007 • أكشن كلاسيكي"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 5 — World at War").setValue("cod5").setDescription("2008 • الحرب العالمية الثانية"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 6 — Modern Warfare 2").setValue("cod6").setDescription("2009 • الأكثر مبيعاً"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 7 — Black Ops").setValue("cod7").setDescription("2010 • الحرب الباردة"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 8 — Modern Warfare 3").setValue("cod8").setDescription("2011 • ختام MW"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 9 — Black Ops 2").setValue("cod9").setDescription("2012 • المستقبل"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 10 — Ghosts").setValue("cod10").setDescription("2013 • خريطة ضخمة"),
          new StringSelectMenuOptionBuilder().setLabel("🎮 CoD 11 — Advanced Warfare").setValue("cod11").setDescription("2014 • Exo Suit"),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(gameSelect);

      const embed = new EmbedBuilder()
        .setTitle("🎮 تدريبات Call of Duty")
        .setDescription("اختر جزء CoD من القائمة ثم اختر نوع التدريب الذي تريد تعلمه")
        .setColor(0xe74c3c)
        .setFooter({ text: "Bot_SUKz • CoD Training" });

      const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: i => i.user.id === interaction.user.id,
        max: 2,
      });

      collector.on("collect", async i => {
        if (i.customId === "cod_game") {
          const gameKey = i.values[0]!;
          const game = codTraining[gameKey];
          if (!game) return;

          const trainingSelect = new StringSelectMenuBuilder()
            .setCustomId(`training_select`)
            .setPlaceholder("🎯 اختر التدريب...")
            .addOptions(
              game.trainings.map((t, idx) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(t.name)
                  .setValue(`${gameKey}__${idx}`)
              )
            );

          const trainingRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(trainingSelect);

          const gameEmbed = new EmbedBuilder()
            .setTitle(`🎮 ${game.emoji} ${game.name}`)
            .setDescription(`اختر نوع التدريب:\n\n${game.trainings.map((t, idx) => `${idx + 1}. ${t.name}`).join("\n")}`)
            .setColor(0xe74c3c);

          await i.update({ embeds: [gameEmbed], components: [trainingRow] });

        } else if (i.customId === "training_select") {
          const parts = i.values[0]!.split("__");
          const gameKey = parts[0]!;
          const idx = parseInt(parts[1] ?? "0");
          const game = codTraining[gameKey];
          const training = game?.trainings[idx];
          if (!training || !game) return;

          const trainingEmbed = new EmbedBuilder()
            .setTitle(training.name)
            .setDescription(training.content)
            .setColor(0xe74c3c)
            .setFooter({ text: `${game.name} • Bot_SUKz • CoD Training` });

          await i.update({ embeds: [trainingEmbed], components: [] });
        }
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    },
  },
];
