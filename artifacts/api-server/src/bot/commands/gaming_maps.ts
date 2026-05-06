import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { GoogleGenAI } from "@google/genai";

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ?? process.env["GEMINI_API_KEY"] ?? "no-key";
const geminiClient = new GoogleGenAI({
  apiKey: geminiApiKey,
  ...(geminiBaseUrl ? { httpOptions: { apiVersion: "", baseUrl: geminiBaseUrl } } : {}),
});

const aiConversations = new Map<string, { role: "user" | "model"; text: string }[]>();
const aiCooldowns = new Map<string, number>();
const AI_COOLDOWN_MS = 8000;

interface MapEntry {
  name: string;
  image: string;
  wikiUrl: string;
  size: string;
  desc: string;
  weapons: { name: string; why: string }[];
  tips: string[];
}

interface GameData {
  label: string;
  year: number;
  color: number;
  thumbnail: string;
  maps: MapEntry[];
}

const GAMES: Record<string, GameData> = {
  cod4: {
    label: "Call of Duty 4: Modern Warfare",
    year: 2007,
    color: 0x8b0000,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/7940/header.jpg",
    maps: [
      {
        name: "Crash",
        image: "https://static.wikia.nocookie.net/callofduty/images/0/0a/Crash_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Crash_(map)",
        size: "متوسط",
        desc: "شوارع مدينة مدمرة بمروحية في المنتصف — ماب متوازن مثالي لجميع أنواع اللعب.",
        weapons: [
          { name: "M16A4", why: "دقيق من جميع مسافات الماب المتوسطة" },
          { name: "M40A3", why: "للتحكم في المنتصف والممرات الطويلة" },
          { name: "MP5", why: "للاشتباك السريع داخل المباني" },
        ],
        tips: [
          "السيطرة على سطح المبنى الأوسط = التحكم في الماب كله",
          "المروحية المحطمة تُعطيك تغطية ممتازة من الجانب الأيمن",
          "تجنب الممر الأمامي الطويل — مكشوف للقناصة دائماً",
        ],
      },
      {
        name: "Crossfire",
        image: "https://static.wikia.nocookie.net/callofduty/images/1/19/Crossfire_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Crossfire_(map)",
        size: "متوسط-كبير",
        desc: "شارع طويل مع مباني جانبية — ماب مشهور بين القناصة وعشاق الدقة.",
        weapons: [
          { name: "G3", why: "اشتباك متوسط وبعيد في الشارع الطويل" },
          { name: "M40A3", why: "للتحكم على طول الشارع الرئيسي" },
          { name: "AK-47", why: "للعب جانبي عبر المباني" },
        ],
        tips: [
          "الشارع الرئيسي = موت مضمون بدون تغطية",
          "المباني الجانبية مليئة بنقاط قنص ممتازة",
          "استخدم الدخان في الشارع لقطع رؤية الخصوم",
        ],
      },
      {
        name: "Backlot",
        image: "https://static.wikia.nocookie.net/callofduty/images/3/38/Backlot_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Backlot_(map)",
        size: "متوسط",
        desc: "ساحة خلفية لمنطقة صناعية مدمرة — توازن ممتاز بين المعارك القريبة والمتوسطة.",
        weapons: [
          { name: "AK-47", why: "قوة ودقة في مسافات الماب المتوسطة" },
          { name: "M1014", why: "للاشتباك السريع في الزوايا الضيقة" },
          { name: "Desert Eagle", why: "كمسدس احتياطي قاتل" },
        ],
        tips: [
          "المبنى الأوسط المدمر يمنحك إشراف على معظم الماب",
          "الزاوية الشمالية الشرقية مكان قنص مفضل للمحترفين",
          "انتبه للمداخل الثلاثة للمركز — يمكن مفاجأتك من أي منها",
        ],
      },
      {
        name: "Shipment",
        image: "https://static.wikia.nocookie.net/callofduty/images/e/e8/Shipment_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Shipment_(map)",
        size: "صغير جداً",
        desc: "أصغر ماب في CoD4 — حاويات شحن في مستودع ضيق، فوضى تامة من الثانية الأولى.",
        weapons: [
          { name: "P90", why: "معدل رصاص عالي مثالي للشيب مينت" },
          { name: "M1014", why: "شاتغن للقتل الفوري في الزوايا الضيقة" },
          { name: "Mini Uzi", why: "سرعة وإعادة ظهور سريعة" },
        ],
        tips: [
          "لا تتوقف أبداً — الوقوف = الموت في هذا الماب",
          "الرمانات أكثر فاعلية من أي سلاح آخر هنا",
          "استخدم Last Stand — كل ثانية تحسب في هذا الماب",
        ],
      },
      {
        name: "Overgrown",
        image: "https://static.wikia.nocookie.net/callofduty/images/6/6b/Overgrown_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Overgrown_(map)",
        size: "كبير",
        desc: "مزرعة مهجورة مع نهر وأشجار كثيفة — ماب القناصة الأشهر في تاريخ CoD.",
        weapons: [
          { name: "M40A3", why: "أفضل سلاح في هذا الماب للقنص الطويل" },
          { name: "Barrett .50cal", why: "للمسافات الأقصى على طول النهر" },
          { name: "M14", why: "بديل ممتاز للتعامل مع الخصوم خلف الأشجار" },
        ],
        tips: [
          "الجسر عبر النهر نقطة تحكم حيوية — من يسيطر عليه يسيطر على الماب",
          "الحشيش الطويل مكان للكمين الكامل — تحرك منحنياً دائماً",
          "إذا سمعت صوت قنص من اليمين فالمطحنة هي المصدر دائماً",
        ],
      },
      {
        name: "Vacant",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/51/Vacant_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Vacant_(map)",
        size: "متوسط",
        desc: "مبنى مكاتب مهجور — ممرات طويلة وغرف محاطة بالأثاث المدمر.",
        weapons: [
          { name: "AK-47", why: "قوي في الممرات المتوسطة" },
          { name: "P90", why: "للغرف الضيقة والمداخل المتعددة" },
          { name: "M1014", why: "حول الزوايا المفاجئة" },
        ],
        tips: [
          "الممر الأوسط الطويل خطير جداً — استخدم الغرف الجانبية",
          "المكاتب في الجناح الشمالي مواقع دفاعية ممتازة",
          "الجزء الخارجي يُستخدم للتفلن وفق الموضع المطلوب",
        ],
      },
      {
        name: "Strike",
        image: "https://static.wikia.nocookie.net/callofduty/images/b/b1/Strike_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Strike_(map)",
        size: "متوسط",
        desc: "شوارع مدينة شرق أوسطية — ثلاثة محاور رئيسية تصب في المنتصف.",
        weapons: [
          { name: "M16A4", why: "دقيق في الشوارع المتوسطة" },
          { name: "AK-47", why: "للضغط عبر الشوارع الثلاثة" },
          { name: "M40A3", why: "للتحكم في نقطة المركز" },
        ],
        tips: [
          "ثلاثة شوارع رئيسية — يجب تأمينها جميعاً للسيطرة",
          "المبنى في الزاوية الشمالية الغربية نقطة قنص مثالية",
          "استخدم الدخان لتقطيع خطوط الرؤية عند الاندفاع",
        ],
      },
      {
        name: "Pipeline",
        image: "https://static.wikia.nocookie.net/callofduty/images/e/ef/Pipeline_CoD4MW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Pipeline_(map)",
        size: "كبير",
        desc: "محطة معالجة نفط مهجورة — هياكل ضخمة وأنابيب كبيرة توفر تغطية.",
        weapons: [
          { name: "AK-47", why: "مثالي في الأماكن نصف المفتوحة" },
          { name: "G3", why: "للتعامل مع الخصوم البعيدين بين الأنابيب" },
          { name: "SVD", why: "للقنص من فوق الهياكل الكبيرة" },
        ],
        tips: [
          "الأنابيب الكبيرة توفر تغطية ممتازة لكنها تعيق الرؤية",
          "اعلَ الهياكل المعدنية للإشراف على المنتصف",
          "الممر الجنوبي أقل ازدحاماً وأكثر أماناً للتنقل",
        ],
      },
    ],
  },

  waw: {
    label: "Call of Duty: World at War",
    year: 2008,
    color: 0x4a3728,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/10090/header.jpg",
    maps: [
      {
        name: "Castle",
        image: "https://static.wikia.nocookie.net/callofduty/images/9/9a/Castle_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Castle_(map)",
        size: "متوسط",
        desc: "قلعة يابانية محصنة فوق جبل — ماب عمودي مليء بالتحصينات والأبراج.",
        weapons: [
          { name: "PTRS-41", why: "للتحكم في البوابة الرئيسية والمسافات الطويلة" },
          { name: "Type 100", why: "للاشتباك السريع في الممرات الضيقة" },
          { name: "M1 Garand", why: "متوازن ومناسب لجميع زوايا الماب" },
        ],
        tips: [
          "الأبراج الدفاعية مفيدة لكنها هدف سهل للرمانات",
          "البوابة الرئيسية ساحة معركة دائمة — تجنبها مباشرةً",
          "الجدران الداخلية توفر تغطية جيدة للتقدم ببطء",
        ],
      },
      {
        name: "Roundhouse",
        image: "https://static.wikia.nocookie.net/callofduty/images/2/26/Roundhouse_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Roundhouse_(map)",
        size: "متوسط",
        desc: "محطة قطارات ضخمة مع هياكل ضخمة ومستودعات — معارك داخلية وخارجية.",
        weapons: [
          { name: "PPSh-41", why: "معدل رصاص هائل للمعارك الداخلية" },
          { name: "DP28", why: "للسيطرة في الأماكن المفتوحة" },
          { name: "SVT-40", why: "لمعارك المسافة المتوسطة بالقرب من القضبان" },
        ],
        tips: [
          "القاطرات الضخمة توفر تغطية ممتازة لكن من كلا الجانبين",
          "السطح الجنوبي نقطة قنص مميزة تُهيمن على مساحة كبيرة",
          "الاندفاع من المستودع إلى الملعب المفتوح يكلفك كثيراً",
        ],
      },
      {
        name: "Dome",
        image: "https://static.wikia.nocookie.net/callofduty/images/0/0c/Dome_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Dome_(map)",
        size: "صغير",
        desc: "رادار ألماني محاط بالثلج — ماب صغير ومكثف يعتمد على السرعة.",
        weapons: [
          { name: "PPSh-41", why: "أفضل سلاح في الماب بمعدل رصاصه العالي" },
          { name: "Type 100", why: "بديل جيد لمعارك الزوايا الضيقة" },
          { name: "Kar98k", why: "للتحكم في المدخلين الرئيسيين" },
        ],
        tips: [
          "الماب صغير جداً — الرمانات فعّالة للغاية هنا",
          "القبة الدائرية = موت إذا دخلتها بدون تأمين المداخل",
          "المنحدرات الجانبية تُعطيك أفضلية على من في الأسفل",
        ],
      },
      {
        name: "Makin",
        image: "https://static.wikia.nocookie.net/callofduty/images/c/c6/Makin_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Makin_(map)",
        size: "كبير",
        desc: "جزيرة استوائية مع أكواخ وغابة استوائية — تحارب بين الأشجار والمياه الضحلة.",
        weapons: [
          { name: "Trench Gun", why: "الشاتغن مثالي للمعارك بين الأكواخ الضيقة" },
          { name: "M1A1 Carbine", why: "خفيف ومتوازن لحرب الغابة" },
          { name: "PTRS-41", why: "للتحكم في شاطئ المياه الطويل" },
        ],
        tips: [
          "الأكواخ المرتفعة توفر زاوية إطلاق رائعة على المنطقة المفتوحة",
          "المياه الضحلة تُبطئك — تجنب المشي فيها تحت النار",
          "الغابة الكثيفة مثالية للكمائن — تحرك بحذر وانتبه للأصوات",
        ],
      },
      {
        name: "Upheaval",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/50/Upheaval_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Upheaval_(map)",
        size: "متوسط-كبير",
        desc: "قرية ريفية روسية مدمرة جزئياً — حقول زراعية وبيوت متناثرة.",
        weapons: [
          { name: "M1 Garand", why: "دقيق ومميز في حقول المسافة المتوسطة" },
          { name: "BAR", why: "للسيطرة الميدانية عبر الحقول المفتوحة" },
          { name: "DP28", why: "دفاعياً من داخل المباني المدمرة" },
        ],
        tips: [
          "الحقول المفتوحة خطيرة للعبور — استخدم طرق الجوانب دائماً",
          "المبنى الأوسط الكبير نقطة دفاعية محورية",
          "تجنب السطح المكشوف في الوسط تحت القنص المتقاطع",
        ],
      },
      {
        name: "Cliffside",
        image: "https://static.wikia.nocookie.net/callofduty/images/4/43/Cliffside_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Cliffside_(map)",
        size: "متوسط",
        desc: "قرية على حافة جبل في جزيرة يابانية — تنزل وتصعد بين المستويات طوال الوقت.",
        weapons: [
          { name: "Kar98k", why: "ممتاز للتحكم في المسافات عبر المستويات المختلفة" },
          { name: "PTRS-41", why: "للقنص من قمة الجرف على الجزء السفلي" },
          { name: "M1A1 Carbine", why: "مرن ومناسب للتنقل بين المستويات" },
        ],
        tips: [
          "من يسيطر على قمة الجرف يسيطر على مسار اللعبة",
          "الجزء السفلي من الماب أكثر أماناً للتنقل الجانبي",
          "انتبه لقناصي القمة عند عبور المناطق المكشوفة",
        ],
      },
      {
        name: "Banzai",
        image: "https://static.wikia.nocookie.net/callofduty/images/b/bc/Banzai_WaW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Banzai_(map)",
        size: "كبير",
        desc: "غابة استوائية مع جسر خشبي في المنتصف وشلال — ماب جميل وخطير.",
        weapons: [
          { name: "M1 Garand", why: "لمعارك المسافة المتوسطة عبر الجسر" },
          { name: "Type 100", why: "للحرب داخل الغابة الكثيفة" },
          { name: "DP28", why: "للتغطية الكثيفة على جانبي الجسر" },
        ],
        tips: [
          "الجسر الخشبي = كمين جاهز — لا تعبره بشكل مباشر",
          "الشلال يُوفر مسار التفاف مميز بدون الخضوع لنار الجسر",
          "الغابة الكثيفة توفر تمويهاً ممتازاً لأسلوب الكمين",
        ],
      },
    ],
  },

  mw2: {
    label: "Call of Duty: Modern Warfare 2",
    year: 2009,
    color: 0x2c3e50,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/1081890/header.jpg",
    maps: [
      {
        name: "Rust",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/7c/Rust_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Rust_(map)",
        size: "صغير",
        desc: "ساحة صحراوية صدئة مع برج مركزي — أصغر وأسرع مابات MW2 وأشهرها.",
        weapons: [
          { name: "SCAR-H", why: "دقيق ومميت في كل مسافات الماب" },
          { name: "M1014", why: "للاشتباك الفوري حول البرج المركزي" },
          { name: "UMP45", why: "سرعة ودقة لكل زوايا الماب الصغير" },
        ],
        tips: [
          "البرج المركزي يمنحك سيطرة كاملة — استعد للقنص من كل الاتجاهات",
          "الرمانات فعّالة جداً بسبب صغر الماب",
          "استخدم Stopping Power و Lightweight معاً للسرعة القصوى",
        ],
      },
      {
        name: "Afghan",
        image: "https://static.wikia.nocookie.net/callofduty/images/3/32/Afghan_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Afghan_(map)",
        size: "كبير",
        desc: "طائرة مهجورة في صحراء أفغانستان — ماب الكمائن والقنص الطويل.",
        weapons: [
          { name: "Intervention", why: "ملك هذا الماب — مسافات قنص مثالية" },
          { name: "FAMAS", why: "للتحكم في الجزء المركزي حول الطائرة" },
          { name: "UMP45", why: "للدخول السريع للطائرة المهجورة" },
        ],
        tips: [
          "الكهف على الجانب الأيمن نقطة قنص أسطورية تُهيمن على نصف الماب",
          "الطائرة المهجورة مليئة بنقاط الكمين — ادخلها بحذر شديد",
          "استخدم Cold Blooded لتجنب UAV واكشف الخصوم بالثرمال",
        ],
      },
      {
        name: "Terminal",
        image: "https://static.wikia.nocookie.net/callofduty/images/b/b3/Terminal_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Terminal_(map)",
        size: "متوسط",
        desc: "مطار دولي فاخر — محلات وبوابات وصالات انتظار طويلة.",
        weapons: [
          { name: "M16A4", why: "دقيق في الممرات الطويلة لصالة المطار" },
          { name: "UMP45", why: "للاشتباك السريع داخل المحلات" },
          { name: "Striker", why: "شاتغن قاتل في الزوايا الضيقة" },
        ],
        tips: [
          "الممر الطويل (Bookstore) خطر جداً — اعبره ركضاً أو تفلّن حوله",
          "منطقة الطائرات الخارجية هادئة لكنها موقع قنص مميز",
          "كل مدخل للمطار محمي بزاوية انتظار — تحرك بحذر دائماً",
        ],
      },
      {
        name: "Highrise",
        image: "https://static.wikia.nocookie.net/callofduty/images/4/40/Highrise_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Highrise_(map)",
        size: "متوسط",
        desc: "سطح ناطحة سحاب ضخمة في قلب المدينة — معارك عمودية ومكشوفة.",
        weapons: [
          { name: "TAR-21", why: "دقيق ومتوازن للمعارك فوق السطح" },
          { name: "Intervention", why: "للقنص عبر سطح الناطحة المفتوح" },
          { name: "M1014", why: "للزوايا عند الدخول من المصعد والسلالم" },
        ],
        tips: [
          "من يسيطر على المنتصف يتحكم في الماب كله",
          "المداخل الداخلية (المصانع والمكاتب) نقاط كمين ممتازة",
          "السقالات على الحافة تُعطيك زاوية مميزة لكنها مكشوفة للغاية",
        ],
      },
      {
        name: "Scrapyard",
        image: "https://static.wikia.nocookie.net/callofduty/images/2/20/Scrapyard_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Scrapyard_(map)",
        size: "متوسط",
        desc: "ساحة خردة طائرات — حاويات وهياكل معدنية توفر تغطية لا نهائية.",
        weapons: [
          { name: "UMP45", why: "أفضل سلاح في هذا الماب — سرعة ودقة" },
          { name: "ACR", why: "للاشتباك المتوسط بين الخردة والحاويات" },
          { name: "SCAR-H", why: "قوي وفعّال في المسافات المتوسطة" },
        ],
        tips: [
          "الماب مليء بالتغطية — دائماً تحرك من غطاء لغطاء",
          "الطائرات القديمة الكبيرة تُعطي مناطق شبه محصنة",
          "استخدم Stopping Power — الزجاج والمعدن الرقيق قابل للاختراق",
        ],
      },
      {
        name: "Estate",
        image: "https://static.wikia.nocookie.net/callofduty/images/c/c3/Estate_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Estate_(map)",
        size: "كبير",
        desc: "قصر فاخر على قمة تلة مع حديقة وغابة — ماب القناصة الأول في MW2.",
        weapons: [
          { name: "Intervention", why: "أفضل سلاح في هذا الماب تماماً" },
          { name: "ACR", why: "للدخول الآمن للمنزل الداخلي" },
          { name: "UMP45", why: "للمعارك الداخلية في أرجاء المنزل" },
        ],
        tips: [
          "نافذة الطابق الثاني تُطل على 60% من الماب — موقع قنص أسطوري",
          "الغابة خلف القصر مفيدة للتفلن ومباغتة الخصوم",
          "اقتحام المنزل من الخلف (الحديقة) أسلم من المدخل الأمامي",
        ],
      },
      {
        name: "Favela",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/73/Favela_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Favela_(map)",
        size: "متوسط-كبير",
        desc: "أحياء فقيرة في البرازيل — منازل متلاصقة وأسطح على مستويات مختلفة.",
        weapons: [
          { name: "FAMAS", why: "معدل رصاص عالي مثالي للمعارك المتقاربة" },
          { name: "TAR-21", why: "دقيق في الممرات المتوسطة بين المنازل" },
          { name: "USP .45", why: "ومسدس قوي للمواقف المفاجئة" },
        ],
        tips: [
          "الأسطح = مناطق سيطرة — الوصول إليها يمنحك أفضلية ضخمة",
          "الأزقة الضيقة بين المنازل مليئة بالكمائن — تحرك ببطء",
          "استخدم Bling مع FAMAS وM1014 للتنقل بين مسافات مختلفة",
        ],
      },
      {
        name: "Wasteland",
        image: "https://static.wikia.nocookie.net/callofduty/images/8/8e/Wasteland_MW2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Wasteland_(map)",
        size: "كبير جداً",
        desc: "أرض مقفرة بعد كارثة نووية — أكبر مابات MW2 وملعب القناصة الأفضل.",
        weapons: [
          { name: "Intervention", why: "ملك هذا الماب المفتوح" },
          { name: "Barrett .50cal", why: "للمسافات القصوى عبر الخندق الطويل" },
          { name: "M240", why: "للتغطية الكثيفة حول نقاط المعبر" },
        ],
        tips: [
          "الخندق الكبير في المنتصف يُعطي تغطية لكنه فخ إذا اكتشفك أحد",
          "المعسكر المهجور في الزاوية نقطة قنص سوبر مميزة",
          "Cold Blooded ضروري هنا — الجميع يعتمد على UAV",
        ],
      },
    ],
  },

  bo1: {
    label: "Call of Duty: Black Ops",
    year: 2010,
    color: 0x1a1a3e,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/42700/header.jpg",
    maps: [
      {
        name: "Nuketown",
        image: "https://static.wikia.nocookie.net/callofduty/images/4/4a/Nuketown_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Nuketown_(map)",
        size: "صغير جداً",
        desc: "قرية محاكاة قنبلة نووية — ماب أيقوني صغير بمنزلين متقابلين وأكثر الأوقات فوضى.",
        weapons: [
          { name: "AK-74u", why: "أفضل سلاح في نيوكتاون بلا منازع" },
          { name: "FAMAS", why: "دقيق ومناسب للضغط السريع بين المنزلين" },
          { name: "M1911", why: "مسدس قاتل لإنهاء المواجهات القريبة" },
        ],
        tips: [
          "الحصول على السيارات الأمامية مبكراً = التحكم في المنتصف",
          "البيوت الداخلية ملجأ للعب الدفاعي لكنها فخ إذا رُميت رماناتك",
          "Tactical Mask ضروري — الجميع يستخدم الفلاش والغاز هنا",
        ],
      },
      {
        name: "Firing Range",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/5a/FiringRange_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Firing_Range_(map)",
        size: "صغير-متوسط",
        desc: "ميدان تدريب على إطلاق النار — غرف صغيرة، ساحة مفتوحة، وبرج مراقبة.",
        weapons: [
          { name: "AK-47", why: "دقيق ومثالي في كل زوايا الماب" },
          { name: "Galil", why: "معدل رصاص عالي للاشتباك المستمر" },
          { name: "Uzi", why: "للمعارك السريعة داخل الغرف" },
        ],
        tips: [
          "البرج في الزاوية يمنحك رؤية ممتازة على الساحة — احمه جيداً",
          "الغرفة الوسطى الطويلة مكان خطير — الكمين فيها طبيعي",
          "المنطقة الخلفية بالقرب من السيارات مكان هادئ للتنفس",
        ],
      },
      {
        name: "Summit",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/79/Summit_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Summit_(map)",
        size: "متوسط",
        desc: "قاعدة عسكرية سوفيتية على قمة جبل ثلجي — كابلات وممرات جليدية خطيرة.",
        weapons: [
          { name: "AK-47", why: "قوي في الممرات المتوسطة" },
          { name: "M16", why: "دقيق في المسافات المتوسطة عبر الكابلات" },
          { name: "FAMAS", why: "للاشتباك السريع عند نقاط التحكم" },
        ],
        tips: [
          "الكابل المتحرك وسط الماب نقطة خطر — يمكن الاغتيال منه",
          "المنطقة الداخلية تحت السطح مساحة دفاعية ممتازة",
          "لا تقف على الحافة — السقوط يقتلك بدون رصاصة واحدة",
        ],
      },
      {
        name: "Array",
        image: "https://static.wikia.nocookie.net/callofduty/images/1/17/Array_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Array_(map)",
        size: "كبير",
        desc: "محطة رادار ضخمة مع هوائيات عملاقة — ماب القناصة الأول في BO1.",
        weapons: [
          { name: "Dragunov", why: "للقنص عبر الفجوات بين الهوائيات" },
          { name: "L96A1", why: "قنص مثالي من نقاط المرتفعات" },
          { name: "HK21", why: "للتغطية الكثيفة عند نقاط التحكم المفتوحة" },
        ],
        tips: [
          "الهوائيات الضخمة تمنع خطوط الرؤية المباشرة — استخدمها لصالحك",
          "الجزء العلوي من المحطة = موقع قنص أسطوري يُهيمن على نصف الماب",
          "ابتعد عن المناطق المفتوحة وتحرك دائماً بمحاذاة الهياكل",
        ],
      },
      {
        name: "Jungle",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/5b/Jungle_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Jungle_(map)",
        size: "متوسط-كبير",
        desc: "معسكر عسكري وسط الغابة الاستوائية — ماب متوازن ورائع لجميع الأساليب.",
        weapons: [
          { name: "Commando", why: "متوازن ومثالي في الممرات والمناطق المفتوحة" },
          { name: "Galil", why: "معدل رصاص عالي للضغط المستمر" },
          { name: "Stakeout", why: "شاتغن للمعارك الداخلية في المخازن" },
        ],
        tips: [
          "المشروم الكبير في المنتصف موقع استراتيجي — من يحتله يضغط على الجميع",
          "الغابة الجنوبية طريق تفلن ممتاز لمفاجأة الخصوم من الخلف",
          "نقطة الصاروخ الثابت في الزاوية — موقع قنص هادئ وفعّال",
        ],
      },
      {
        name: "WMD",
        image: "https://static.wikia.nocookie.net/callofduty/images/6/6c/WMD_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/WMD_(map)",
        size: "كبير",
        desc: "قاعدة أسلحة دمار شامل سوفيتية — ثلج وملاجئ وممرات تحت الأرض.",
        weapons: [
          { name: "L96A1", why: "ملك القنص في هذا الماب المفتوح" },
          { name: "Dragunov", why: "بديل قنص جيد لمسافات أقصر" },
          { name: "Galil", why: "للتغطية حول نقاط الهجوم الداخلية" },
        ],
        tips: [
          "الكهف الثلجي في المنتصف نقطة قاتلة — ادخله من الجانب فقط",
          "الملاجئ تحت الأرض ملجأ ممتاز للعب الدفاعي والانتظار",
          "مرتفع الجانب الأيسر يُعطي رؤية كاملة على طول الجهة المركزية",
        ],
      },
      {
        name: "Havana",
        image: "https://static.wikia.nocookie.net/callofduty/images/c/c3/Havana_BO.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Havana_(map)",
        size: "متوسط",
        desc: "شوارع هافانا الكوبية الملونة — مبانٍ كولونيالية ومداخل متعددة.",
        weapons: [
          { name: "MPL", why: "سريع ودقيق في الشوارع الضيقة" },
          { name: "MAC-11", why: "معدل رصاص هائل للمعارك الداخلية" },
          { name: "Galil", why: "للمواجهات في الساحات المتوسطة" },
        ],
        tips: [
          "المبنى ذو القبة الزرقاء نقطة مراقبة تُشرف على المنتصف",
          "الشوارع الجانبية الضيقة مليئة بالكمائن — تحرك بحذر",
          "استخدم الطابق الثاني للمباني الرئيسية للعب الدفاعي",
        ],
      },
    ],
  },

  mw3: {
    label: "Call of Duty: Modern Warfare 3",
    year: 2011,
    color: 0x2e4057,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/115300/header.jpg",
    maps: [
      {
        name: "Dome",
        image: "https://static.wikia.nocookie.net/callofduty/images/8/8b/Dome_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Dome_(Modern_Warfare_3)",
        size: "صغير",
        desc: "قاعدة رادار مع قبة مركزية — ماب سريع ومكثف مثالي للقتل السريع.",
        weapons: [
          { name: "P90", why: "أفضل SMG لهذا الماب الصغير" },
          { name: "MP7", why: "سريع ودقيق في الزوايا الضيقة" },
          { name: "FMG9", why: "للتحكم في المداخل حول القبة" },
        ],
        tips: [
          "القبة المركزية = نقطة موت — تجنب الدخول مباشرة",
          "استخدم المداخل الجانبية الثلاثة للتغلب على حامي القبة",
          "Quick Draw و Steady Aim ضروريان للاشتباك السريع",
        ],
      },
      {
        name: "Hardhat",
        image: "https://static.wikia.nocookie.net/callofduty/images/2/23/Hardhat_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Hardhat_(map)",
        size: "صغير-متوسط",
        desc: "موقع بناء نشط — رافعات وخرسانة وهياكل معدنية في كل مكان.",
        weapons: [
          { name: "MP7", why: "خفيف وسريع مثالي للمواقع الضيقة" },
          { name: "AK-47", why: "للمسافات المتوسطة عبر الهياكل" },
          { name: "PP90M1", why: "معدل رصاص عالي للمعارك الداخلية" },
        ],
        tips: [
          "الحاويات الكبيرة مناطق تحكم محورية — احمها دائماً",
          "الرافعة توفر رؤية ممتازة لكنها هدف واضح لجميع الخصوم",
          "المداخل خلف الهياكل طرق تفلن مميزة يجهلها المبتدئون",
        ],
      },
      {
        name: "Resistance",
        image: "https://static.wikia.nocookie.net/callofduty/images/6/66/Resistance_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Resistance_(map)",
        size: "متوسط",
        desc: "شوارع باريس القديمة — مقاهٍ وحارات ضيقة بمحاور ثلاثة واضحة.",
        weapons: [
          { name: "MP7", why: "خفيف ومثالي للشوارع الباريسية الضيقة" },
          { name: "Type 95", why: "دقيق في الممرات المتوسطة" },
          { name: "G36C", why: "متوازن للعب عبر المحاور الثلاثة" },
        ],
        tips: [
          "المقهى المركزي نقطة ساخنة — السيطرة عليه تحسم نتيجة الجولة",
          "الطابق العلوي للمباني يُعطيك زاوية ضاربة على الجميع",
          "استخدم الممر الجانبي للتفلن على الخصوم في المركز",
        ],
      },
      {
        name: "Seatown",
        image: "https://static.wikia.nocookie.net/callofduty/images/6/61/Seatown_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Seatown_(map)",
        size: "متوسط",
        desc: "قرية ساحلية في الشرق الأوسط — سوق شعبي وأزقة ملتوية.",
        weapons: [
          { name: "AK-47", why: "ممتاز في الشوارع والأزقة المتوسطة" },
          { name: "Type 95", why: "دقيق جداً في ممرات السوق" },
          { name: "L118A", why: "للقنص الموضعي من نوافذ المباني العالية" },
        ],
        tips: [
          "السوق في المنتصف يربك الخصوم — تعلّم تخطيطه جيداً",
          "الزقاق الجنوبي مخرج هروب ممتاز وطريق تفلن آمن",
          "البوابة الرئيسية تُعطيك إشراف مباشر على المحور المركزي",
        ],
      },
      {
        name: "Arkaden",
        image: "https://static.wikia.nocookie.net/callofduty/images/b/bc/Arkaden_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Arkaden_(map)",
        size: "متوسط",
        desc: "مركز تسوق أوروبي مدمر — سقف زجاجي ومحلات ومناطق متعددة المستويات.",
        weapons: [
          { name: "MP7", why: "مثالي للمعارك بين الممرات والمحلات" },
          { name: "ACR 6.8", why: "دقيق في المسافات المتوسطة" },
          { name: "M16A4", why: "قوي في الأجزاء المفتوحة من المول" },
        ],
        tips: [
          "السقف الزجاجي في الوسط يسمح للقنص من الطابق العلوي على الجميع",
          "محلات الجانب الأيمن أقل خطورة لعبور المركز",
          "انتبه للكمائن خلف الكونترات والرفوف — مكان مفضل للمحترفين",
        ],
      },
      {
        name: "Underground",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/72/Underground_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Underground_(map)",
        size: "متوسط",
        desc: "محطة مترو لندن مدمرة — أنفاق ومنصات وممرات تحت الأرض.",
        weapons: [
          { name: "P90", why: "معدل رصاص عالي مثالي للأنفاق الضيقة" },
          { name: "PP90M1", why: "للمعارك السريعة عند منصات القطار" },
          { name: "ACR 6.8", why: "لمناطق الانتظار والأنفاق الأطول" },
        ],
        tips: [
          "الأنفاق الجانبية طرق تفلن تُمكنك من الظهور خلف الخصوم",
          "منصة القطار المنتصف ساحة معركة دائمة — تجنب الوقوف عليها",
          "Dead Silence ضروري هنا — أصوات الخطوات تكشف موقعك",
        ],
      },
      {
        name: "Village",
        image: "https://static.wikia.nocookie.net/callofduty/images/c/c2/Village_MW3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Village_(map)",
        size: "كبير",
        desc: "قرية أفغانية جبلية — مزارع وبيوت طينية وطرق متعرجة.",
        weapons: [
          { name: "RSASS", why: "للقنص الدقيق عبر الطرق الريفية الطويلة" },
          { name: "L118A", why: "ملك المسافات الطويلة في هذا الماب" },
          { name: "Type 95", why: "متوازن للعب في المناطق المتوسطة" },
        ],
        tips: [
          "التلة الشمالية منصة قنص تُهيمن على 70% من الماب",
          "المزارع في الجنوب مليئة بالتغطيات والكمائن",
          "الطريق الوسطى الضيقة فخ — استخدم الجوانب دائماً",
        ],
      },
    ],
  },

  bo2: {
    label: "Call of Duty: Black Ops 2",
    year: 2012,
    color: 0x1a1a2e,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/202970/header.jpg",
    maps: [
      {
        name: "Nuketown 2025",
        image: "https://static.wikia.nocookie.net/callofduty/images/8/83/Nuketown_2025_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Nuketown_2025",
        size: "صغير جداً",
        desc: "نسخة المستقبل من نيوكتاون — نفس الفوضى الأسطورية بتصميم مستقبلي.",
        weapons: [
          { name: "AN-94", why: "اثنتان في الرأس من أي مسافة في الماب الصغير" },
          { name: "PDW-57", why: "SMG سريع مثالي للمعارك المتقاربة" },
          { name: "B23R", why: "مسدس ثلاث رصاصات قاتل في نيوكتاون" },
        ],
        tips: [
          "السيارات الأمامية أهم بقعة — من يسيطر عليها يضغط على الجميع",
          "UAV وCounter UAV أساسيان لأن الماب صغير جداً والجميع يعرف موقعك",
          "Flak Jacket ضروري — الرمانات تنهال عليك كل ثانية",
        ],
      },
      {
        name: "Hijacked",
        image: "https://static.wikia.nocookie.net/callofduty/images/3/35/Hijacked_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Hijacked_(map)",
        size: "صغير",
        desc: "يخت فاخر في وسط المحيط — ممر طويل فوق وغرف تحت وبركة في المؤخرة.",
        weapons: [
          { name: "Chicom CQB", why: "معدل رصاص مذهل للمعارك القريبة على اليخت" },
          { name: "MSMC", why: "SMG ممتاز للتحرك السريع على سطح اليخت" },
          { name: "KSG", why: "شاتغن قاتل في الممرات الداخلية الضيقة" },
        ],
        tips: [
          "السطح الطويل = الكمين الدائم — تحرك على الجوانب دائماً",
          "المطبخ والغرف الخلفية تحت السطح مواقع دفاعية ممتازة",
          "Engineer يكشف لك المتفجرات في الممرات الضيقة",
        ],
      },
      {
        name: "Raid",
        image: "https://static.wikia.nocookie.net/callofduty/images/d/d5/Raid_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Raid_(map)",
        size: "متوسط",
        desc: "منزل فاخر بحمام سباحة — تصميم مثالي يجمع المعارك القريبة والمتوسطة.",
        weapons: [
          { name: "MSMC", why: "أفضل سلاح في هذا الماب المتوازن" },
          { name: "M8A1", why: "دقيق للمسافات المتوسطة عبر حمام السباحة" },
          { name: "Executioner", why: "مسدس شاتغن للزوايا الداخلية" },
        ],
        tips: [
          "حمام السباحة نقطة التحكم الأهم — من يحميه يتحكم في المركز",
          "المبنى المرتفع في الزاوية منصة قنص تُشرف على كامل المنطقة المفتوحة",
          "السلالم الداخلية مواقع كمين مفضلة للمحترفين — انتبه لها",
        ],
      },
      {
        name: "Standoff",
        image: "https://static.wikia.nocookie.net/callofduty/images/a/a8/Standoff_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Standoff_(map)",
        size: "متوسط",
        desc: "بلدة حدودية نائية — ثلاثة محاور واضحة مع طرق سريعة ومناطق دفاعية.",
        weapons: [
          { name: "FAL OSW", why: "دقيق جداً في محاور الشوارع المتوسطة" },
          { name: "MSMC", why: "للضغط السريع عبر المحاور الثلاثة" },
          { name: "DSR-50", why: "للقنص من المرتفعات عبر الشارع الرئيسي" },
        ],
        tips: [
          "البنزين (المركز) نقطة ساخنة — ابتعد عنه في أوائل الجولة",
          "المبنى الجانبي على اليسار خط إمداد مهم خلال المعركة",
          "Ghost ضروري في Standoff — الجميع يُشغّل UAV باستمرار",
        ],
      },
      {
        name: "Turbine",
        image: "https://static.wikia.nocookie.net/callofduty/images/1/10/Turbine_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Turbine_(map)",
        size: "كبير",
        desc: "صحراء بها توربينات رياح ضخمة — ماب القناصة الأول في BO2.",
        weapons: [
          { name: "DSR-50", why: "قنص لا يُقاوم في هذا الماب المفتوح" },
          { name: "Ballista", why: "دقيق وسريع التصويب للقنص المحترف" },
          { name: "LMG HAMR", why: "للتغطية الكثيفة حول التوربينات" },
        ],
        tips: [
          "التوربينات الضخمة توفر تغطية لكن الجميع يتوقعك خلفها",
          "الطريق المرصوف في المنتصف خط قنص مستقيم خطير",
          "Ghost أساسي — الماب كبير والجميع يعتمد على الـ UAV",
        ],
      },
      {
        name: "Drone",
        image: "https://static.wikia.nocookie.net/callofduty/images/a/ae/Drone_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Drone_(map)",
        size: "متوسط",
        desc: "مصنع طائرات مسيّرة مستقبلي — أروقة واسعة ومعامل زجاجية وممرات مرتفعة.",
        weapons: [
          { name: "MSMC", why: "سريع ومثالي للمعارك بين الأروقة" },
          { name: "AN-94", why: "دقيق للمسافات المتوسطة في المصنع" },
          { name: "KSG", why: "للاشتباك الفوري عند المداخل الضيقة" },
        ],
        tips: [
          "المنطقة الوسطى المفتوحة (ساحة التجميع) نقطة ساخنة دائمة",
          "الأروقة العلوية تُعطيك زاوية إطلاق لا يتوقعها الخصوم",
          "استخدم EMPs لتعطيل المعدات الإلكترونية في مصنع الطائرات",
        ],
      },
      {
        name: "Express",
        image: "https://static.wikia.nocookie.net/callofduty/images/f/f4/Express_BO2.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Express_(map)",
        size: "متوسط",
        desc: "محطة قطار فائق السرعة — رصيف طويل مع قطار يمر ومحلات في الجانبين.",
        weapons: [
          { name: "MSMC", why: "للمعارك السريعة على جانبي الرصيف" },
          { name: "Type 25", why: "سريع ودقيق على طول منصة القطار" },
          { name: "PDW-57", why: "SMG خفيف لعبور الرصيف سريعاً" },
        ],
        tips: [
          "القطار يقتل من يقف على خطه — انتبه لأضوائه التحذيرية",
          "المحلات الجانبية ملجأ آمن من نيران الرصيف المكشوف",
          "Scavenger مفيد — الطابور طويل وستحتاج ذخيرة مستمرة",
        ],
      },
    ],
  },

  ghosts: {
    label: "Call of Duty: Ghosts",
    year: 2013,
    color: 0x1c2833,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/209160/header.jpg",
    maps: [
      {
        name: "Freight",
        image: "https://static.wikia.nocookie.net/callofduty/images/1/1a/Freight_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Freight_(map)",
        size: "صغير",
        desc: "مستودع شحن ضخم — حاويات وممرات ضيقة ومعارك قريبة لا تتوقف.",
        weapons: [
          { name: "AK-12", why: "متوازن ومثالي في الممرات المتوسطة" },
          { name: "Maverick", why: "دقيق بتخصيص عالٍ لهذا الماب" },
          { name: "Mtar-X", why: "SMG سريع للزوايا الضيقة بين الحاويات" },
        ],
        tips: [
          "الحاويات الملونة نقاط تمركز محورية — تجنب المشي بين صفوفها",
          "المنطقة المفتوحة في المنتصف تُشغّل التبادل — لا تقف فيها",
          "استخدم SitRep لكشف الطلقات في الجدران (Bullet Penetration)",
        ],
      },
      {
        name: "Warhawk",
        image: "https://static.wikia.nocookie.net/callofduty/images/d/d9/Warhawk_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Warhawk_(map)",
        size: "متوسط",
        desc: "شوارع مدينة مدمرة بطائرات حربية محطمة — معارك في وسط الحرب.",
        weapons: [
          { name: "SC-2010", why: "دقيق ومثالي في شوارع الماب المتوسطة" },
          { name: "Bizon", why: "خزان رصاصة ضخم للضغط المستمر" },
          { name: "KEM Strike", why: "اجمع killstreak واضغط الزناد — رائع هنا" },
        ],
        tips: [
          "الطائرات المحطمة تمنع خطوط الرؤية — استغلها للتقدم الآمن",
          "المباني المدمرة تُعطي تغطية ممتازة وعدة زوايا للإطلاق",
          "حافظ على سلسلة القتل — Specialist تمنحك قدرات هائلة",
        ],
      },
      {
        name: "Prison Break",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/7e/PrisonBreak_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Prison_Break_(map)",
        size: "كبير",
        desc: "سجن كبير مدمر — خلايا وممرات تحت الأرض ومركبات ومناطق مفتوحة.",
        weapons: [
          { name: "Remington R5", why: "بندقية دقيقة في المسافات المتوسطة" },
          { name: "SC-2010", why: "للمعارك بين الزنازين والأروقة" },
          { name: "Maverick", why: "خفيف ومرن للتنقل السريع" },
        ],
        tips: [
          "تعلم تخطيط السجن جيداً — مربك للغاية للمبتدئين",
          "المنطقة المفتوحة خارج السجن ساحة قنص طويلة",
          "الزنازين الداخلية مواقع دفاعية ممتازة في وضع الدفاع",
        ],
      },
      {
        name: "Fog",
        image: "https://static.wikia.nocookie.net/callofduty/images/f/fa/Fog_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Fog_(map)",
        size: "متوسط",
        desc: "مخيم تحت الضباب الكثيف على بحيرة — ماب مرعب بالمعنى الحرفي.",
        weapons: [
          { name: "Maverick-A2", why: "بندقية قنص خفيفة للرؤية المحدودة" },
          { name: "VKS", why: "شاتغن صامت مثالي للضباب وللكمائن" },
          { name: "Honey Badger", why: "خفيفة وصامتة مثالية للماب المظلم" },
        ],
        tips: [
          "الضباب يحد الرؤية — استخدم Thermal لكشف الخصوم",
          "المخيم والأكواخ أماكن كمين مثالية في هذا الجو المرعب",
          "Suppressor ضروري — الصوت يكشفك في الضباب بسرعة",
        ],
      },
      {
        name: "Stormfront",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/7a/Stormfront_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Stormfront_(map)",
        size: "متوسط-كبير",
        desc: "مدينة أوروبية تحت عاصفة — شوارع مبللة وأبنية تاريخية تحت المطر.",
        weapons: [
          { name: "Bizon", why: "خزان ذخيرة ضخم للضغط المستمر" },
          { name: "VKS", why: "شاتغن صامت للكمائن في الأزقة" },
          { name: "AK-12", why: "متوازن لجميع زوايا الماب" },
        ],
        tips: [
          "المطر يُقلل وضوح الشاشة — استخدم HUD بشكل أذكى",
          "المباني التاريخية الكبيرة مناطق دفاعية ممتازة",
          "الشوارع الواسعة مكشوفة — تحرك دائماً بمحاذاة الجدران",
        ],
      },
      {
        name: "Flooded",
        image: "https://static.wikia.nocookie.net/callofduty/images/d/da/Flooded_Ghosts.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Flooded_(map)",
        size: "متوسط",
        desc: "مدينة غمرتها الفيضانات — مبانٍ نصف مغمورة وشوارع تحت الماء.",
        weapons: [
          { name: "AK-12", why: "مستقر ودقيق في بيئة الفيضانات" },
          { name: "Honey Badger", why: "تكتيكية ومثالية للمعارك على المستويين" },
          { name: "Bizon", why: "للضغط السريع في الشوارع المائية" },
        ],
        tips: [
          "الطوابق العليا أعلى مستوى الماء تمنحك أفضلية تكتيكية",
          "المناطق المغمورة تُبطئك — تجنب الخوض فيها تحت النار",
          "أسطح المباني المتاحة مواقع قنص ممتازة",
        ],
      },
    ],
  },

  aw: {
    label: "Call of Duty: Advanced Warfare",
    year: 2014,
    color: 0x0d2137,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/209650/header.jpg",
    maps: [
      {
        name: "Bio Lab",
        image: "https://static.wikia.nocookie.net/callofduty/images/7/7a/BioLab_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Bio_Lab_(map)",
        size: "متوسط",
        desc: "مختبر أحياء متطور مستقبلي — غرف بحثية وممرات زجاجية وتقنية عالية.",
        weapons: [
          { name: "AK12", why: "دقيق ومستقر مناسب لممرات المختبر" },
          { name: "BAL-27", why: "أفضل بندقية في AW لمعظم المابات" },
          { name: "Honey Badger", why: "خفيفة وتكتيكية للمعارك الداخلية" },
        ],
        tips: [
          "Exo Suit يفتح طرق حركة جديدة — استخدم القفز الجانبي والعمودي",
          "الزجاج القابل للاختراق في الغرف يكشف الخصوم خلفه",
          "Exo Overclock يمنحك سرعة حركة مذهلة لاقتحام الغرف",
        ],
      },
      {
        name: "Retreat",
        image: "https://static.wikia.nocookie.net/callofduty/images/3/3d/Retreat_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Retreat_(map)",
        size: "متوسط",
        desc: "منتجع فاخر بحمامات سباحة لانهائية — القتال فوق حمامات السباحة المتعددة.",
        weapons: [
          { name: "HBRa3", why: "معدل رصاص عالي ومثالي للمعارك القريبة" },
          { name: "BAL-27", why: "دقيق في الممرات المتوسطة بالمنتجع" },
          { name: "Pytaek", why: "LMG للتغطية حول حمامات السباحة" },
        ],
        tips: [
          "حمامات السباحة أماكن ساخنة — استخدم القفز الجانبي للتحاشي",
          "الجدران الزجاجية الشفافة تكشف الخصوم داخلها",
          "Exo Shield مفيد عند عبور المناطق المفتوحة بالمنتجع",
        ],
      },
      {
        name: "Riot",
        image: "https://static.wikia.nocookie.net/callofduty/images/0/01/Riot_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Riot_(map)",
        size: "كبير",
        desc: "سجن مستقبلي محصن — مرافق رياضية وملاعب وبنية تحتية ضخمة.",
        weapons: [
          { name: "IMR", why: "دقيق في المسافات المتوسطة عبر السجن" },
          { name: "BAL-27", why: "أفضل بندقية لمعارك المنطقة المفتوحة" },
          { name: "AK12", why: "متوازن لكل جوانب الماب الكبير" },
        ],
        tips: [
          "المرافق الرياضية (الملعب) ساحة قتال مكثفة — تحرك على الأطراف",
          "القفز العمودي على الجدران يمنحك زوايا هجوم غير متوقعة",
          "Exo Cloak للتخفي عند اقتحام المناطق الدفاعية الثقيلة",
        ],
      },
      {
        name: "Defender",
        image: "https://static.wikia.nocookie.net/callofduty/images/d/d6/Defender_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Defender_(map)",
        size: "متوسط",
        desc: "منصة نفط في المحيط — طوابق متعددة ومنصات معدنية فوق الماء.",
        weapons: [
          { name: "ARX-160", why: "خفيف ومناسب للتنقل السريع بين المنصات" },
          { name: "ASM1", why: "SMG مثالي للمعارك القريبة على المنصات" },
          { name: "HBRa3", why: "للاشتباك المكثف في طوابق المنصة" },
        ],
        tips: [
          "السقوط في الماء = الموت — انتبه للحواف عند القتال",
          "الطوابق العليا تمنحك أفضلية إطلاق واضحة على الجميع",
          "Exo Jump يمنعك من السقوط عبر القفز الجانبي عند الحواف",
        ],
      },
      {
        name: "Detroit",
        image: "https://static.wikia.nocookie.net/callofduty/images/1/17/Detroit_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Detroit_(map)",
        size: "متوسط",
        desc: "مدينة ديترويت المستقبلية — شوارع مضاءة بالنيون وتقنية من الغد.",
        weapons: [
          { name: "AK12", why: "قوي في شوارع الماب المتوسطة" },
          { name: "BAL-27", why: "دقيق للمواجهات عبر الشوارع الطويلة" },
          { name: "ASM1", why: "للمعارك السريعة في الأزقة الجانبية" },
        ],
        tips: [
          "إضاءة النيون تلفت الانتباه — تحرك في الظل كلما أمكن",
          "الشوارع الرئيسية مكشوفة — استخدم الأزقة الجانبية للتنقل",
          "Exo Mute Device يمنع صوت القفز — مفيد جداً للكمين",
        ],
      },
      {
        name: "Atlas Gorge",
        image: "https://static.wikia.nocookie.net/callofduty/images/e/e5/AtlasGorge_AW.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Atlas_Gorge_(map)",
        size: "متوسط-كبير",
        desc: "مرفق أطلس في واد جبلي — ماب مدفوع بحركة الـ Exo Suit العمودية.",
        weapons: [
          { name: "HBRa3", why: "معدل رصاص عالي للمعارك على الجبال" },
          { name: "ARX-160", why: "خفيف لاستغلال حركة الـ Exo بالكامل" },
          { name: "IMR", why: "دقيق في المسافات المتوسطة عبر الوادي" },
        ],
        tips: [
          "استغل الحركة العمودية بالكامل — هذا ماب مصمم للـ Exo",
          "الجبال الجانبية تمنحك زوايا قنص رائعة على قاع الوادي",
          "Exo Launcher يمنحك قذائف متفجرة مثالية للتهديف العمودي",
        ],
      },
    ],
  },

  bo3: {
    label: "Call of Duty: Black Ops 3",
    year: 2015,
    color: 0x0a1628,
    thumbnail: "https://cdn.akamai.steamstatic.com/steam/apps/311210/header.jpg",
    maps: [
      {
        name: "Nuk3town",
        image: "https://static.wikia.nocookie.net/callofduty/images/b/b4/Nuk3town_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Nuk3town_(map)",
        size: "صغير جداً",
        desc: "نسخة BO3 من نيوكتاون — نفس المتعة الأسطورية بتصميم روبوتي مستقبلي.",
        weapons: [
          { name: "KRM-262", why: "شاتغن قاتل في هذا الماب الصغير الأيقوني" },
          { name: "Vesper", why: "SMG معدل رصاصه الهائل = مجزرة في نيوكتاون" },
          { name: "HVK-30", why: "دقيق ومميت من أي مسافة في الماب" },
        ],
        tips: [
          "الروبوتات المتحركة تمنحك تغطية ديناميكية متغيرة",
          "المناطق الخلفية بين المنزلين مكان كمين متكرر — انتبه له",
          "Overdrive يمنحك سرعة انتقال مجنونة في هذا الماب الضيق",
        ],
      },
      {
        name: "Combine",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/56/Combine_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Combine_(map)",
        size: "متوسط",
        desc: "منشأة فلاحية مستقبلية — آلات حصاد ضخمة وتغطية طبيعية في الحقول.",
        weapons: [
          { name: "Man-O-War", why: "بندقية ضخمة ومثالية في حقول الماب" },
          { name: "KN-44", why: "متوازن ودقيق في ممرات المنشأة" },
          { name: "M8A7", why: "دقيق جداً في المسافات المتوسطة" },
        ],
        tips: [
          "آلات الحصاد الضخمة تُعطي تغطية غير متوقعة — استغلها",
          "الحقول المفتوحة خطيرة بدون Speed Boost النظام الخاص",
          "Grapple يمكنك من الوصول لنقاط مرتفعة غير متوقعة",
        ],
      },
      {
        name: "Stronghold",
        image: "https://static.wikia.nocookie.net/callofduty/images/5/5b/Stronghold_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Stronghold_(map)",
        size: "متوسط",
        desc: "قلعة جبلية ثلجية — هندسة قديمة بتعديلات عسكرية حديثة.",
        weapons: [
          { name: "M8A7", why: "ممتاز في ممرات القلعة المتوسطة" },
          { name: "HVK-30", why: "معدل رصاص عالي للاشتباك المستمر" },
          { name: "Weevil", why: "SMG مثالي للمعارك الداخلية" },
        ],
        tips: [
          "الجدران الحجرية القديمة = تغطية لا تنفذ — استخدمها كاملاً",
          "الأبراج الزاويّة نقاط قنص مميزة على الساحة المركزية",
          "Overdrive ممتاز للعبور السريع من برج لبرج",
        ],
      },
      {
        name: "Skyjacked",
        image: "https://static.wikia.nocookie.net/callofduty/images/0/04/Skyjacked_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Skyjacked_(map)",
        size: "صغير",
        desc: "إعادة تصميم Hijacked من BO2 — نفس اليخت لكن على ارتفاع ضخم في السماء.",
        weapons: [
          { name: "Vesper", why: "أسرع SMG لهذا الماب المكثف" },
          { name: "KRM-262", why: "شاتغن قاتل في الممرات الضيقة" },
          { name: "Man-O-War", why: "لمعارك سطح اليخت المفتوح" },
        ],
        tips: [
          "السقوط من الجانبين = الموت — الحواف خطيرة جداً",
          "المطبخ تحت السطح مكان كمين أسطوري كما في BO2",
          "Grapple يُعطيك طرق عبور جانبية غير متوقعة",
        ],
      },
      {
        name: "Infection",
        image: "https://static.wikia.nocookie.net/callofduty/images/3/38/Infection_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Infection_(map)",
        size: "متوسط",
        desc: "مدينة مصابة بفيروس — شوارع مهجورة وأجواء قيامية مرعبة.",
        weapons: [
          { name: "HVK-30", why: "دقيق في شوارع المدينة المتوسطة" },
          { name: "KN-44", why: "متوازن ومستقر في الماب المفتوح نسبياً" },
          { name: "Pharo", why: "SMG مثالي للمعارك بين الأبنية المهجورة" },
        ],
        tips: [
          "الحافلات والسيارات المهجورة تغطية ممتازة في الشارع الرئيسي",
          "المباني المهجورة الداخلية مليئة بالكمائن — ادخلها بحذر",
          "Spectre يمنحك Knife اللثم المثالي للماب بين الأبنية",
        ],
      },
      {
        name: "Redwood",
        image: "https://static.wikia.nocookie.net/callofduty/images/e/e9/Redwood_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Redwood_(map)",
        size: "كبير",
        desc: "غابة أشجار ضخمة — أشجار ريدوود عملاقة توفر تغطية طبيعية هائلة.",
        weapons: [
          { name: "M8A7", why: "دقيق في المسافات المتوسطة بين الأشجار" },
          { name: "KN-44", why: "متوازن للقتال بين الجذوع الضخمة" },
          { name: "Locus", why: "قنص مثالي في ممرات الغابة الطويلة" },
        ],
        tips: [
          "الأشجار الضخمة تُقدم تغطية طبيعية ضخمة — استخدمها بذكاء",
          "الجسور الخشبية نقاط عبور محورية ومعارك دائمة عليها",
          "Ruin يمنحك قفزة قوية لصعود الأشجار الكبيرة وكشف الجميع",
        ],
      },
      {
        name: "Aquarium",
        image: "https://static.wikia.nocookie.net/callofduty/images/e/e9/Aquarium_BO3.jpg",
        wikiUrl: "https://callofduty.fandom.com/wiki/Aquarium_(map)",
        size: "متوسط",
        desc: "أكواريوم ضخم تحت الماء — حوض سمك عملاق محاط بممرات زجاجية.",
        weapons: [
          { name: "Pharo", why: "SMG مثالي للممرات الضيقة حول الأحواض" },
          { name: "Weevil", why: "للمعارك بين الحواجز الزجاجية" },
          { name: "KRM-262", why: "شاتغن قاتل في الزوايا حول الأسماك" },
        ],
        tips: [
          "الزجاج الشفاف يكشف الخصوم من الجانب الآخر — استخدمه لكشفهم",
          "حوض السمك الكبير في المنتصف تُعطي رؤية ومعارك مثيرة",
          "Outrider يمنحك قوس سهام هادئ مثالي لمناطق الأحواض الهادئة",
        ],
      },
    ],
  },
};

// ══════════════════════════════════════════
//        WEAPON ATTACHMENTS LOOKUP
// ══════════════════════════════════════════
const WEAPON_ATTACHMENTS: Record<string, string[]> = {
  // ── CoD 4 ──
  "M16A4":          ["Red Dot Sight", "Suppressor", "Grenade Launcher"],
  "M40A3":          ["ACOG Scope", "FMJ", "Suppressor"],
  "MP5":            ["Silencer", "Red Dot Sight", "Foregrip"],
  "G3":             ["ACOG Scope", "FMJ", "None"],
  "AK-47":          ["Red Dot Sight", "Suppressor", "Foregrip"],
  "P90":            ["Silencer", "Red Dot Sight", "Extended Mag"],
  "Barrett .50cal": ["ACOG Scope", "FMJ", "None"],
  "M1014":          ["None (كافي وحده)", "Steady Aim Perk", "None"],
  "Mini Uzi":       ["Silencer", "Red Dot Sight", "None"],
  "SVD":            ["ACOG Scope", "FMJ", "None"],
  "M14":            ["ACOG Scope", "Suppressor", "None"],
  "Desert Eagle":   ["FMJ", "None", "None"],
  // ── WaW ──
  "PTRS-41":        ["Telescopic Sight", "None", "None"],
  "Type 100":       ["Suppressor", "Extended Mag", "None"],
  "M1 Garand":      ["Telescopic Sight", "None", "None"],
  "PPSh-41":        ["Drum Mag", "Suppressor", "None"],
  "DP28":           ["Bipod", "Extended Mag", "None"],
  "Kar98k":         ["Telescopic Sight", "None", "None"],
  "Trench Gun":     ["Grip", "None", "None"],
  "BAR":            ["Bipod", "FMJ", "None"],
  "M1A1 Carbine":   ["Suppressor", "None", "None"],
  "SVT-40":         ["Telescopic Sight", "None", "None"],
  // ── MW2 ──
  "SCAR-H":         ["Holographic Sight", "FMJ", "Heartbeat Sensor"],
  "UMP45":          ["Silencer", "Extended Mag", "Holographic Sight"],
  "Intervention":   ["FMJ", "Thermal Scope", "None"],
  "FAMAS":          ["Grenade Launcher", "Suppressor", "FMJ"],
  "ACR":            ["Suppressor", "Heartbeat Sensor", "FMJ"],
  "TAR-21":         ["FMJ", "Holographic Sight", "Foregrip"],
  "Striker":        ["Extended Mag", "Suppressor", "Steady Aim"],
  "M240":           ["Grip", "FMJ", "Extended Mag"],
  "USP .45":        ["Tactical Knife", "Suppressor", "None"],
  // ── BO1 ──
  "AK-74u":         ["Rapid Fire", "Extended Mag", "Suppressor"],
  "L96A1":          ["Extended Mag + Warlord", "Variable Zoom", "None"],
  "Galil":          ["Suppressor", "Extended Mag", "Dual Mag"],
  "Commando":       ["Suppressor", "Extended Mag", "Red Dot Sight"],
  "Dragunov":       ["Extended Mag", "ACOG Scope", "None"],
  "HK21":           ["Extended Mag", "Grip", "ACOG Scope"],
  "Stakeout":       ["Grip", "Extended Mag", "None"],
  "Uzi":            ["Suppressor", "Extended Mag", "None"],
  "M1911":          ["Extended Mag", "Suppressor", "None"],
  // ── MW3 ──
  "PP90M1":         ["Rapid Fire", "Silencer", "Kick"],
  "MP7":            ["Rapid Fire + Silencer", "Extended Mag", "Foregrip"],
  "Type 95":        ["Kick", "Rapid Fire", "Red Dot Sight"],
  "ACR 6.8":        ["Kick", "Suppressor", "Extended Mag"],
  "L118A":          ["Ballistics CPU", "Extended Mag", "None"],
  "RSASS":          ["Ballistics CPU", "Thermal Scope", "Extended Mag"],
  "FMG9":           ["Akimbo", "Extended Mag", "Suppressor"],
  "G36C":           ["Red Dot Sight", "Suppressor", "Kick"],
  "P90":            ["Extended Mag", "Rapid Fire", "Silencer"],
  "M16A4_MW3":      ["Kick", "Red Dot Sight", "Suppressor"],
  // ── BO2 ──
  "MSMC":           ["Fast Mag", "Stock", "Suppressor"],
  "AN-94":          ["Fast Mag", "Stock", "Suppressor"],
  "DSR-50":         ["Ballistics CPU", "Fast Mag", "None"],
  "Ballista":       ["Iron Lung (Wildcard)", "Ballistics CPU", "Fast Mag"],
  "KSG":            ["Long Barrel", "Fast Mag", "Laser Sight"],
  "PDW-57":         ["Extended Clip", "Suppressor", "Laser Sight"],
  "Chicom CQB":     ["Extended Clip", "Fast Mag", "Laser Sight"],
  "FAL OSW":        ["Select Fire", "Fast Mag", "Suppressor"],
  "LMG HAMR":       ["Grip", "Extended Clip", "Fast Mag"],
  "B23R":           ["Fast Mag", "Suppressor", "None"],
  "Type 25":        ["Suppressor", "Fast Mag", "Stock"],
  "M8A1":           ["Fast Mag", "Suppressor", "Stock"],
  "Executioner":    ["Long Barrel", "Fast Mag", "None"],
  // ── Ghosts ──
  "AK-12":          ["Foregrip", "Extended Mags", "Red Dot Sight"],
  "Honey Badger":   ["None (كاتم مدمج)", "Extended Mags", "Foregrip"],
  "Vector CRB":     ["Extended Mags", "Foregrip", "Muzzle Brake"],
  "Mtar-X":         ["Suppressor", "Extended Mags", "Foregrip"],
  "Maverick":       ["Foregrip", "Red Dot Sight", "Extended Mags"],
  "L115":           ["Variable Zoom", "Extended Mags", "None"],
  "VKS":            ["Variable Zoom (صامت طبيعياً)", "Extended Mags", "None"],
  // ── AW ──
  "BAL-27":         ["Foregrip", "Extended Mag", "Advanced Rifling"],
  "ASM1":           ["Foregrip", "Extended Mag", "Suppressor"],
  "HBRa3":          ["Foregrip", "Silencer", "Extended Mag"],
  "MORS":           ["Variable Zoom", "None", "None"],
  "ARX-160":        ["Foregrip", "Extended Mag", "Suppressor"],
  "IMR":            ["Foregrip", "Extended Mag", "Red Dot Sight"],
  "AK12":           ["Foregrip", "Extended Mag", "Suppressor"],
  "Atlas 45":       ["Quickdraw", "Extended Mag", "Suppressor"],
  // ── BO3 ──
  "Vesper":         ["Rapid Fire", "Extended Mag", "Suppressor"],
  "KRM-262":        ["Long Barrel", "Fast Mag", "Grip Tape"],
  "HVK-30":         ["High Caliber", "Suppressor", "Quickdraw Handle"],
  "Man-O-War":      ["High Caliber", "Grip Tape", "Extended Mag"],
  "KN-44":          ["Suppressor", "Quickdraw Handle", "Extended Mag"],
  "M8A7":           ["High Caliber", "Suppressor", "Extended Mag"],
  "Locus":          ["Ballistics CPU", "Variable Zoom", "Extended Mag"],
  "Pharo":          ["Rapid Fire", "Extended Mag", "Suppressor"],
  "Weevil":         ["Suppressor", "Extended Mag", "Quickdraw Handle"],
};

function getAttachments(weaponName: string): string[] {
  return WEAPON_ATTACHMENTS[weaponName] ?? ["Red Dot Sight", "Extended Mag", "Suppressor"];
}

function getPerksBySize(size: string): string[] {
  if (size.includes("صغير جداً")) return ["🟢 Flak Jacket", "🔵 Toughness", "🔴 Dead Silence"];
  if (size.includes("صغير"))       return ["🟢 Lightweight", "🔵 Toughness", "🔴 Dead Silence"];
  if (size.includes("متوسط-كبير")) return ["🟢 Ghost", "🔵 Quick Draw", "🔴 Dead Silence"];
  if (size.includes("كبير جداً")) return ["🟢 Ghost / Cold Blooded", "🔵 Quick Draw", "🔴 Ninja"];
  if (size.includes("كبير"))       return ["🟢 Ghost", "🔵 Quick Draw", "🔴 Ninja"];
  return ["🟢 Hardline / Ghost", "🔵 Quick Draw", "🔴 Dead Silence"];
}

export const gamingMapsCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("map")
      .setDescription("🗺️ ماب عشوائي مع صورته وأفضل الأسلحة والبيركات والإضافات")
      .addStringOption(opt =>
        opt.setName("game")
          .setDescription("اختار لعبة CoD")
          .setRequired(true)
          .addChoices(
            { name: "🎯 CoD 4: Modern Warfare (2007)", value: "cod4" },
            { name: "💀 CoD 5: World at War (2008)", value: "waw" },
            { name: "🔫 CoD: Modern Warfare 2 (2009)", value: "mw2" },
            { name: "🕶️ CoD: Black Ops 1 (2010)", value: "bo1" },
            { name: "🌍 CoD: Modern Warfare 3 (2011)", value: "mw3" },
            { name: "🤖 CoD: Black Ops 2 (2012)", value: "bo2" },
            { name: "👻 CoD: Ghosts (2013)", value: "ghosts" },
            { name: "⚡ CoD: Advanced Warfare (2014)", value: "aw" },
            { name: "🦾 CoD: Black Ops 3 (2015)", value: "bo3" },
          )
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const gameKey = interaction.options.getString("game", true);
      const game = GAMES[gameKey];
      if (!game) return interaction.reply({ content: "❌ اللعبة غير موجودة!", ephemeral: true });

      const map = game.maps[Math.floor(Math.random() * game.maps.length)]!;

      const bestWeapon   = map.weapons[0]!;
      const altWeapons   = map.weapons.slice(1);
      const attachments  = getAttachments(bestWeapon.name);
      const perks        = getPerksBySize(map.size);
      const tipsText     = map.tips.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const altText      = altWeapons.map(w => `• **${w.name}** — ${w.why}`).join("\n");
      const attachText   = attachments.map((a, i) => `${["1️⃣","2️⃣","3️⃣"][i] ?? "•"} ${a}`).join("\n");

      // Embed #1 — Game header + Map image
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${game.label} • ${game.year}`, iconURL: game.thumbnail })
        .setTitle(`🗺️ ${map.name}`)
        .setDescription(`> ${map.desc}`)
        .setColor(game.color)
        .setImage(map.image)
        .setThumbnail(game.thumbnail)
        .addFields(
          { name: "📐 حجم الماب", value: map.size, inline: true },
          { name: "🎮 اللعبة", value: `${game.label}`, inline: true },
          { name: "\u200b", value: "\u200b", inline: true },

          { name: "🏆 أفضل سلاح للماب", value: `**${bestWeapon.name}**\n*${bestWeapon.why}*`, inline: false },
          { name: "🔧 الإضافات (Attachments)", value: attachText, inline: true },
          { name: "⚡ البيركات (Perks)", value: perks.join("\n"), inline: true },
          { name: "\u200b", value: "\u200b", inline: true },

          { name: "🔫 أسلحة بديلة", value: altText || "—", inline: false },
          { name: "💡 نصائح احترافية", value: tipsText, inline: false },
        )
        .setFooter({ text: "Bot_SUKz • اكتب /map مرة ثانية للحصول على ماب آخر عشوائي" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("ai")
      .setDescription("🤖 تحدث مع الذكاء الاصطناعي / Chat with AI")
      .addStringOption(opt =>
        opt.setName("message")
          .setDescription("رسالتك / Your message")
          .setRequired(true)
      )
      .addBooleanOption(opt =>
        opt.setName("reset")
          .setDescription("ابدأ محادثة جديدة / Start fresh")
          .setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const reset = interaction.options.getBoolean("reset") ?? false;
      const userId = interaction.user.id;

      const lastUsed = aiCooldowns.get(userId) ?? 0;
      const remaining = AI_COOLDOWN_MS - (Date.now() - lastUsed);
      if (remaining > 0) {
        await interaction.reply({
          content: `⏳ انتظر **${Math.ceil(remaining / 1000)} ثوان** قبل تستخدم الأمر مرة ثانية.`,
          flags: 64,
        });
        return;
      }

      if (reset) aiConversations.delete(userId);

      const history = aiConversations.get(userId) ?? [];

      await interaction.deferReply();
      aiCooldowns.set(userId, Date.now());

      history.push({ role: "user", text: message });

      try {
        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          config: {
            systemInstruction: `أنت شخص ذكي اسمك SUKz.
- إذا تكلم المستخدم بالعربية رد بالعربية، وإذا تكلم بالإنجليزية رد بالإنجليزية
- ردودك مباشرة وطبيعية بدون تمهيدات
- لا تتجاوز 400 كلمة`,
            maxOutputTokens: 1500,
          },
        });

        const finalText = response.text?.trim() || "ما قدرت أرد، جرب مرة ثانية.";

        history.push({ role: "model", text: finalText });
        if (history.length > 20) history.splice(0, 2);
        aiConversations.set(userId, history);

        await interaction.editReply({ content: finalText.slice(0, 1900) });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const is503 = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
        const is429 = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
        await interaction.editReply({
          content: is429
            ? "⚠️ وصلنا الحد اليومي لـ Gemini، حاول بكره."
            : is503
            ? "⏳ Gemini مشغول الحين، حاول بعد ثواني."
            : `❌ حدث خطأ: \`${errMsg.slice(0, 200)}\``,
        });
      }
    },
  },
];
