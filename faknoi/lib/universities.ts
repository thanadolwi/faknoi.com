import type { Lang } from "./LangContext";

export interface University {
  id: string;
  name: string;
  shortName: string;
  zones: string[];
  // i18n
  names?: Partial<Record<Lang, string>>;
  shortNames?: Partial<Record<Lang, string>>;
  zoneNames?: Partial<Record<Lang, string[]>>;
}

export const UNIVERSITIES: University[] = [
  {
    id: "chula",
    name: "จุฬาลงกรณ์มหาวิทยาลัย",
    shortName: "จุฬาฯ",
    zones: [
      "หอพักนิสิต โซน A",
      "หอพักนิสิต โซน B",
      "คณะวิศวกรรมศาสตร์",
      "คณะแพทยศาสตร์",
      "คณะอักษรศาสตร์",
      "สยามสแควร์",
      "MBK / สนามกีฬาแห่งชาติ",
    ],
    names: {
      en: "Chulalongkorn University",
      zh: "朱拉隆功大学",
      hi: "चुलालोंगकोर्न विश्वविद्यालय",
    },
    shortNames: {
      en: "Chula",
      zh: "朱大",
      hi: "चुला",
    },
    zoneNames: {
      en: [
        "Dormitory Zone A",
        "Dormitory Zone B",
        "Faculty of Engineering",
        "Faculty of Medicine",
        "Faculty of Arts",
        "Siam Square",
        "MBK / National Stadium",
      ],
      zh: [
        "宿舍区A",
        "宿舍区B",
        "工程学院",
        "医学院",
        "文学院",
        "暹罗广场",
        "MBK / 国家体育场",
      ],
      hi: [
        "छात्रावास क्षेत्र A",
        "छात्रावास क्षेत्र B",
        "इंजीनियरिंग संकाय",
        "चिकित्सा संकाय",
        "कला संकाय",
        "सियाम स्क्वायर",
        "MBK / राष्ट्रीय स्टेडियम",
      ],
    },
  },
  {
    id: "thammasat_rangsit",
    name: "มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต",
    shortName: "มธ. รังสิต",
    zones: [
      "หอใน โซน 1-3",
      "หอใน โซน 4-6",
      "หอนอก ฝั่งตะวันออก",
      "หอนอก ฝั่งตะวันตก",
      "คณะนิติศาสตร์",
      "คณะพาณิชยศาสตร์",
      "คณะวิศวกรรมศาสตร์",
      "โรงอาหารกลาง",
      "ตลาดหน้ามอ",
      "ฟิวเจอร์พาร์ค รังสิต",
    ],
    names: {
      en: "Thammasat University Rangsit",
      zh: "法政大学兰实校区",
      hi: "थम्मासात विश्वविद्यालय रंगसित",
    },
    shortNames: {
      en: "TU Rangsit",
      zh: "法大兰实",
      hi: "TU रंगसित",
    },
    zoneNames: {
      en: [
        "On-campus Dorm Zone 1-3",
        "On-campus Dorm Zone 4-6",
        "Off-campus East",
        "Off-campus West",
        "Faculty of Law",
        "Faculty of Commerce",
        "Faculty of Engineering",
        "Central Canteen",
        "Market in front of university",
        "Future Park Rangsit",
      ],
      zh: [
        "校内宿舍区1-3",
        "校内宿舍区4-6",
        "校外东侧",
        "校外西侧",
        "法学院",
        "商学院",
        "工程学院",
        "中央食堂",
        "校门前市场",
        "未来公园兰实",
      ],
      hi: [
        "कैंपस छात्रावास क्षेत्र 1-3",
        "कैंपस छात्रावास क्षेत्र 4-6",
        "कैंपस के बाहर पूर्व",
        "कैंपस के बाहर पश्चिम",
        "विधि संकाय",
        "वाणिज्य संकाय",
        "इंजीनियरिंग संकाय",
        "केंद्रीय कैंटीन",
        "विश्वविद्यालय के सामने बाजार",
        "फ्यूचर पार्क रंगसित",
      ],
    },
  },
  {
    id: "thammasat_tha_prachan",
    name: "มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์",
    shortName: "มธ. ท่าพระจันทร์",
    zones: [
      "ตึกโดม",
      "คณะนิติศาสตร์",
      "คณะรัฐศาสตร์",
      "ท่าพระจันทร์",
      "สนามหลวง",
    ],
    names: {
      en: "Thammasat University Tha Prachan",
      zh: "法政大学他帕差校区",
      hi: "थम्मासात विश्वविद्यालय ता प्राचान",
    },
    shortNames: {
      en: "TU Tha Prachan",
      zh: "法大他帕差",
      hi: "TU ता प्राचान",
    },
    zoneNames: {
      en: [
        "Dome Building",
        "Faculty of Law",
        "Faculty of Political Science",
        "Tha Prachan Pier",
        "Sanam Luang",
      ],
      zh: [
        "圆顶楼",
        "法学院",
        "政治学院",
        "他帕差码头",
        "皇家田广场",
      ],
      hi: [
        "डोम बिल्डिंग",
        "विधि संकाय",
        "राजनीति विज्ञान संकाय",
        "ता प्राचान घाट",
        "सनाम लुआंग",
      ],
    },
  },
  {
    id: "silpakorn_sanam_chandra",
    name: "มหาวิทยาลัยศิลปากร วิทยาเขตพระราชวังสนามจันทร์",
    shortName: "ศิลปากร นครปฐม",
    zones: [
      "หอพักนักศึกษา",
      "คณะจิตรกรรมฯ",
      "คณะสถาปัตยกรรมศาสตร์",
      "คณะโบราณคดี",
      "ตลาดหน้ามอ",
      "ตลาดในวัง",
      "ถนนราชมรรคา",
    ],
    names: {
      en: "Silpakorn University Sanam Chandra",
      zh: "艺术大学沙南占德校区",
      hi: "सिलपाकोर्न विश्वविद्यालय सनाम चंद्र",
    },
    shortNames: {
      en: "Silpakorn Nakhon Pathom",
      zh: "艺大那空帕托",
      hi: "सिलपाकोर्न नखोन पाथोम",
    },
    zoneNames: {
      en: [
        "Student Dormitory",
        "Faculty of Painting",
        "Faculty of Architecture",
        "Faculty of Archaeology",
        "Market in front of university",
        "Market inside palace",
        "Ratchamankha Road",
      ],
      zh: [
        "学生宿舍",
        "绘画学院",
        "建筑学院",
        "考古学院",
        "校门前市场",
        "宫内市场",
        "拉差曼卡路",
      ],
      hi: [
        "छात्र छात्रावास",
        "चित्रकला संकाय",
        "वास्तुकला संकाय",
        "पुरातत्व संकाय",
        "विश्वविद्यालय के सामने बाजार",
        "महल के अंदर बाजार",
        "राचमंखा रोड",
      ],
    },
  },
  {
    id: "kasetsart",
    name: "มหาวิทยาลัยเกษตรศาสตร์ บางเขน",
    shortName: "มก. บางเขน",
    zones: [
      "หอพักนิสิต",
      "คณะเกษตร",
      "คณะวิศวกรรมศาสตร์",
      "คณะวิทยาศาสตร์",
      "โรงอาหารกลาง",
      "ตลาดนัดมก.",
    ],
    names: {
      en: "Kasetsart University Bang Khen",
      zh: "农业大学邦坚校区",
      hi: "कसेत्सार्त विश्वविद्यालय बांग खेन",
    },
    shortNames: {
      en: "KU Bang Khen",
      zh: "农大邦坚",
      hi: "KU बांग खेन",
    },
    zoneNames: {
      en: [
        "Student Dormitory",
        "Faculty of Agriculture",
        "Faculty of Engineering",
        "Faculty of Science",
        "Central Canteen",
        "KU Market",
      ],
      zh: [
        "学生宿舍",
        "农学院",
        "工程学院",
        "理学院",
        "中央食堂",
        "农大市场",
      ],
      hi: [
        "छात्र छात्रावास",
        "कृषि संकाय",
        "इंजीनियरिंग संकाय",
        "विज्ञान संकाय",
        "केंद्रीय कैंटीन",
        "KU बाजार",
      ],
    },
  },
  {
    id: "mahidol_salaya",
    name: "มหาวิทยาลัยมหิดล ศาลายา",
    shortName: "มหิดล ศาลายา",
    zones: [
      "หอพักนักศึกษา",
      "คณะแพทยศาสตร์ศิริราช",
      "คณะวิทยาศาสตร์",
      "โรงอาหารกลาง",
      "ตลาดศาลายา",
    ],
    names: { en: "Mahidol University Salaya", zh: "玛希隆大学沙拉亚校区", hi: "महिडोल विश्वविद्यालय सलाया" },
    shortNames: { en: "Mahidol Salaya", zh: "玛大沙拉亚", hi: "महिडोल सलाया" },
    zoneNames: {
      en: ["Student Dormitory", "Siriraj Faculty of Medicine", "Faculty of Science", "Central Canteen", "Salaya Market"],
      zh: ["学生宿舍", "诗里拉医学院", "理学院", "中央食堂", "沙拉亚市场"],
      hi: ["छात्र छात्रावास", "सिरिराज चिकित्सा संकाय", "विज्ञान संकाय", "केंद्रीय कैंटीन", "सलाया बाजार"],
    },
  },
  {
    id: "kku",
    name: "มหาวิทยาลัยขอนแก่น",
    shortName: "มข.",
    zones: ["หอพักนักศึกษา", "คณะแพทยศาสตร์", "คณะวิศวกรรมศาสตร์", "คณะเกษตรศาสตร์", "โรงอาหารกลาง", "ตลาดนัดมข.", "ศูนย์อาหาร KKU"],
    names: { en: "Khon Kaen University", zh: "孔敬大学", hi: "खोन केन विश्वविद्यालय" },
    shortNames: { en: "KKU", zh: "孔大", hi: "KKU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Medicine", "Faculty of Engineering", "Faculty of Agriculture", "Central Canteen", "KKU Market", "KKU Food Center"],
      zh: ["学生宿舍", "医学院", "工程学院", "农学院", "中央食堂", "孔大市场", "孔大美食中心"],
      hi: ["छात्र छात्रावास", "चिकित्सा संकाय", "इंजीनियरिंग संकाय", "कृषि संकाय", "केंद्रीय कैंटीन", "KKU बाजार", "KKU फूड सेंटर"],
    },
  },
  {
    id: "spu",
    name: "มหาวิทยาลัยศรีปทุม",
    shortName: "ศรีปทุม",
    zones: ["หอพักนักศึกษา", "คณะบริหารธุรกิจ", "คณะนิติศาสตร์", "คณะวิศวกรรมศาสตร์", "โรงอาหาร", "ลานกิจกรรม"],
    names: { en: "Sripatum University", zh: "斯巴顿大学", hi: "श्रीपटुम विश्वविद्यालय" },
    shortNames: { en: "SPU", zh: "斯大", hi: "SPU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Business", "Faculty of Law", "Faculty of Engineering", "Canteen", "Activity Area"],
      zh: ["学生宿舍", "商学院", "法学院", "工程学院", "食堂", "活动区"],
      hi: ["छात्र छात्रावास", "व्यवसाय संकाय", "विधि संकाय", "इंजीनियरिंग संकाय", "कैंटीन", "गतिविधि क्षेत्र"],
    },
  },
  {
    id: "bu",
    name: "มหาวิทยาลัยกรุงเทพ",
    shortName: "ม.กรุงเทพ",
    zones: ["หอพักนักศึกษา", "คณะนิเทศศาสตร์", "คณะบริหารธุรกิจ", "คณะสถาปัตยกรรมศาสตร์", "โรงอาหาร", "ลานกิจกรรม BU"],
    names: { en: "Bangkok University", zh: "曼谷大学", hi: "बैंकॉक विश्वविद्यालय" },
    shortNames: { en: "BU", zh: "曼大", hi: "BU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Communication Arts", "Faculty of Business", "Faculty of Architecture", "Canteen", "BU Activity Area"],
      zh: ["学生宿舍", "传播艺术学院", "商学院", "建筑学院", "食堂", "曼大活动区"],
      hi: ["छात्र छात्रावास", "संचार कला संकाय", "व्यवसाय संकाय", "वास्तुकला संकाय", "कैंटीन", "BU गतिविधि क्षेत्र"],
    },
  },
  {
    id: "pim",
    name: "สถาบันการจัดการปัญญาภิวัฒน์",
    shortName: "PIM",
    zones: ["หอพักนักศึกษา", "คณะบริหารธุรกิจ", "คณะวิศวกรรมศาสตร์", "โรงอาหาร", "CP Tower"],
    names: { en: "Panyapiwat Institute of Management", zh: "盘亚皮瓦管理学院", hi: "पान्यापिवात प्रबंधन संस्थान" },
    shortNames: { en: "PIM", zh: "PIM", hi: "PIM" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Business", "Faculty of Engineering", "Canteen", "CP Tower"],
      zh: ["学生宿舍", "商学院", "工程学院", "食堂", "CP大厦"],
      hi: ["छात्र छात्रावास", "व्यवसाय संकाय", "इंजीनियरिंग संकाय", "कैंटीन", "CP टॉवर"],
    },
  },
  {
    id: "cmmu",
    name: "มหาวิทยาลัยเชียงใหม่",
    shortName: "มช.",
    zones: ["หอพักนักศึกษา", "คณะแพทยศาสตร์", "คณะวิศวกรรมศาสตร์", "คณะมนุษยศาสตร์", "โรงอาหารกลาง", "ตลาดนัดมช.", "ถนนนิมมานเหมินท์"],
    names: { en: "Chiang Mai University", zh: "清迈大学", hi: "चियांग माई विश्वविद्यालय" },
    shortNames: { en: "CMU", zh: "清大", hi: "CMU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Medicine", "Faculty of Engineering", "Faculty of Humanities", "Central Canteen", "CMU Market", "Nimman Road"],
      zh: ["学生宿舍", "医学院", "工程学院", "人文学院", "中央食堂", "清大市场", "尼曼路"],
      hi: ["छात्र छात्रावास", "चिकित्सा संकाय", "इंजीनियरिंग संकाय", "मानविकी संकाय", "केंद्रीय कैंटीन", "CMU बाजार", "निम्मान रोड"],
    },
  },
  {
    id: "psu",
    name: "มหาวิทยาลัยสงขลานครินทร์",
    shortName: "ม.อ.",
    zones: ["หอพักนักศึกษา", "คณะแพทยศาสตร์", "คณะวิศวกรรมศาสตร์", "คณะวิทยาศาสตร์", "โรงอาหารกลาง", "ตลาดนัด ม.อ."],
    names: { en: "Prince of Songkla University", zh: "宋卡王子大学", hi: "प्रिंस ऑफ सोंगखला विश्वविद्यालय" },
    shortNames: { en: "PSU", zh: "宋大", hi: "PSU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Medicine", "Faculty of Engineering", "Faculty of Science", "Central Canteen", "PSU Market"],
      zh: ["学生宿舍", "医学院", "工程学院", "理学院", "中央食堂", "宋大市场"],
      hi: ["छात्र छात्रावास", "चिकित्सा संकाय", "इंजीनियरिंग संकाय", "विज्ञान संकाय", "केंद्रीय कैंटीन", "PSU बाजार"],
    },
  },
  {
    id: "swu",
    name: "มหาวิทยาลัยศรีนครินทรวิโรฒ",
    shortName: "มศว",
    zones: ["หอพักนักศึกษา", "คณะแพทยศาสตร์", "คณะวิทยาศาสตร์", "คณะศึกษาศาสตร์", "โรงอาหารกลาง", "ตลาดนัดมศว"],
    names: { en: "Srinakharinwirot University", zh: "斯里纳卡林威洛大学", hi: "श्रीनखरिनविरोत विश्वविद्यालय" },
    shortNames: { en: "SWU", zh: "斯里大", hi: "SWU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Medicine", "Faculty of Science", "Faculty of Education", "Central Canteen", "SWU Market"],
      zh: ["学生宿舍", "医学院", "理学院", "教育学院", "中央食堂", "斯里大市场"],
      hi: ["छात्र छात्रावास", "चिकित्सा संकाय", "विज्ञान संकाय", "शिक्षा संकाय", "केंद्रीय कैंटीन", "SWU बाजार"],
    },
  },
  {
    id: "kmutt",
    name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    shortName: "มจธ.",
    zones: ["หอพักนักศึกษา", "คณะวิศวกรรมศาสตร์", "คณะวิทยาศาสตร์", "คณะสถาปัตยกรรมศาสตร์", "โรงอาหารกลาง", "ตลาดนัดมจธ."],
    names: { en: "KMUTT", zh: "吞武里皇家理工大学", hi: "KMUTT" },
    shortNames: { en: "KMUTT", zh: "吞理工", hi: "KMUTT" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Engineering", "Faculty of Science", "Faculty of Architecture", "Central Canteen", "KMUTT Market"],
      zh: ["学生宿舍", "工程学院", "理学院", "建筑学院", "中央食堂", "吞理工市场"],
      hi: ["छात्र छात्रावास", "इंजीनियरिंग संकाय", "विज्ञान संकाय", "वास्तुकला संकाय", "केंद्रीय कैंटीन", "KMUTT बाजार"],
    },
  },
  {
    id: "kmutnb",
    name: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    shortName: "มจพ.",
    zones: ["หอพักนักศึกษา", "คณะวิศวกรรมศาสตร์", "คณะวิทยาศาสตร์ประยุกต์", "คณะครุศาสตร์อุตสาหกรรม", "โรงอาหารกลาง"],
    names: { en: "KMUTNB", zh: "北曼谷皇家理工大学", hi: "KMUTNB" },
    shortNames: { en: "KMUTNB", zh: "北理工", hi: "KMUTNB" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Engineering", "Faculty of Applied Science", "Faculty of Technical Education", "Central Canteen"],
      zh: ["学生宿舍", "工程学院", "应用科学学院", "技术教育学院", "中央食堂"],
      hi: ["छात्र छात्रावास", "इंजीनियरिंग संकाय", "अनुप्रयुक्त विज्ञान संकाय", "तकनीकी शिक्षा संकाय", "केंद्रीय कैंटीन"],
    },
  },
  {
    id: "rmutt",
    name: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี",
    shortName: "มทร.ธัญบุรี",
    zones: ["หอพักนักศึกษา", "คณะวิศวกรรมศาสตร์", "คณะบริหารธุรกิจ", "คณะศิลปกรรมศาสตร์", "โรงอาหารกลาง", "ตลาดนัดมทร."],
    names: { en: "RMUTT", zh: "拉差孟坤理工大学", hi: "RMUTT" },
    shortNames: { en: "RMUTT", zh: "拉理工", hi: "RMUTT" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Engineering", "Faculty of Business", "Faculty of Fine Arts", "Central Canteen", "RMUTT Market"],
      zh: ["学生宿舍", "工程学院", "商学院", "美术学院", "中央食堂", "拉理工市场"],
      hi: ["छात्र छात्रावास", "इंजीनियरिंग संकाय", "व्यवसाय संकाय", "ललित कला संकाय", "केंद्रीय कैंटीन", "RMUTT बाजार"],
    },
  },
  {
    id: "abac",
    name: "มหาวิทยาลัยอัสสัมชัญ",
    shortName: "ABAC",
    zones: ["หอพักนักศึกษา", "คณะบริหารธุรกิจ", "คณะนิเทศศาสตร์", "คณะวิศวกรรมศาสตร์", "โรงอาหาร", "ลานกิจกรรม"],
    names: { en: "Assumption University", zh: "圣母升天大学", hi: "असम्पशन विश्वविद्यालय" },
    shortNames: { en: "ABAC", zh: "ABAC", hi: "ABAC" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Business", "Faculty of Communication Arts", "Faculty of Engineering", "Canteen", "Activity Area"],
      zh: ["学生宿舍", "商学院", "传播艺术学院", "工程学院", "食堂", "活动区"],
      hi: ["छात्र छात्रावास", "व्यवसाय संकाय", "संचार कला संकाय", "इंजीनियरिंग संकाय", "कैंटीन", "गतिविधि क्षेत्र"],
    },
  },
  {
    id: "dpu",
    name: "มหาวิทยาลัยธุรกิจบัณฑิตย์",
    shortName: "DPU",
    zones: ["หอพักนักศึกษา", "คณะบริหารธุรกิจ", "คณะนิติศาสตร์", "คณะนิเทศศาสตร์", "โรงอาหาร", "ลานกิจกรรม"],
    names: { en: "Dhurakij Pundit University", zh: "法政商业大学", hi: "धुराकिज पुंडित विश्वविद्यालय" },
    shortNames: { en: "DPU", zh: "DPU", hi: "DPU" },
    zoneNames: {
      en: ["Student Dormitory", "Faculty of Business", "Faculty of Law", "Faculty of Communication Arts", "Canteen", "Activity Area"],
      zh: ["学生宿舍", "商学院", "法学院", "传播艺术学院", "食堂", "活动区"],
      hi: ["छात्र छात्रावास", "व्यवसाय संकाय", "विधि संकाय", "संचार कला संकाय", "कैंटीन", "गतिविधि क्षेत्र"],
    },
  },
];

export function getUniversityById(id: string) {
  return UNIVERSITIES.find((u) => u.id === id);
}

/** Get localized university name */
export function getUniName(u: University, lang: Lang): string {
  if (lang === "th") return u.shortName;
  return u.shortNames?.[lang] ?? u.shortName;
}

/** Get localized full university name */
export function getUniFullName(u: University, lang: Lang): string {
  if (lang === "th") return u.name;
  return u.names?.[lang] ?? u.name;
}

/** Get localized zone name by index */
export function getZoneName(u: University, zoneIndex: number, lang: Lang): string {
  if (lang === "th") return u.zones[zoneIndex] ?? "";
  return u.zoneNames?.[lang]?.[zoneIndex] ?? u.zones[zoneIndex] ?? "";
}

/** Get localized zone name by Thai zone string */
export function getZoneNameByThai(thaiZone: string, lang: Lang): string {
  if (lang === "th") return thaiZone;
  for (const u of UNIVERSITIES) {
    const idx = u.zones.indexOf(thaiZone);
    if (idx !== -1) {
      return u.zoneNames?.[lang]?.[idx] ?? thaiZone;
    }
  }
  return thaiZone;
}

/** Get localized uni shortName by uniId */
export function getUniShortNameById(uniId: string, lang: Lang): string {
  const u = getUniversityById(uniId);
  if (!u) return uniId;
  return getUniName(u, lang);
}
