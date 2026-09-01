import type { AppLanguage } from "@/lib/languages";
import { DEFAULT_LANGUAGE } from "@/lib/languages";

export type DeviceLoginCopy = {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  deviceLabel: string;
  browserLabel: string;
  locationLabel: string;
  timeLabel: string;
  wasThisYou: string;
  yesButton: string;
  noButton: string;
  footerNote: string;
  approveTitle: string;
  approveHeading: (name: string) => string;
  approveBody: string;
  approveSubtext: string;
  continueButton: string;
  denyTitle: string;
  denyHeading: string;
  denyBody: string;
  reviewSecurityButton: string;
  invalidToken: string;
  alreadyUsed: string;
};

const en: DeviceLoginCopy = {
  subject: "🔐 New device signed in to your UNK AI account",
  greeting: (name) => `Hello ${name},`,
  intro: "A new device has just signed in to your UNK AI account.",
  deviceLabel: "Device",
  browserLabel: "Browser",
  locationLabel: "Location",
  timeLabel: "Time",
  wasThisYou: "Was this you?",
  yesButton: "✅ YES, IT WAS ME",
  noButton: "❌ NO, THIS WASN'T ME",
  footerNote:
    "If you did not sign in, tap “No” above to secure your account. This link expires for your safety.",
  approveTitle: "Device verified",
  approveHeading: (name) => `🎉 Congratulations, ${name}!`,
  approveBody: "Your device has been verified successfully.",
  approveSubtext: "Enjoy your seamless UNK AI journey.",
  continueButton: "Continue to UNK AI",
  denyTitle: "Account secured",
  denyHeading: "⚠️ We secured your account.",
  denyBody: "This device was not approved.",
  reviewSecurityButton: "Review Account Security",
  invalidToken: "This link is invalid or has expired. Please sign in again.",
  alreadyUsed: "This link was already used. Your account is up to date.",
};

const hi: DeviceLoginCopy = {
  ...en,
  subject: "🔐 आपके UNK AI खाते में नया डिवाइस साइन इन हुआ",
  greeting: (name) => `नमस्ते ${name},`,
  intro: "आपके UNK AI खाते में अभी एक नए डिवाइस से साइन इन हुआ है।",
  deviceLabel: "डिवाइस",
  browserLabel: "ब्राउज़र",
  locationLabel: "स्थान",
  timeLabel: "समय",
  wasThisYou: "क्या यह आप थे?",
  yesButton: "✅ हाँ, यह मैं था",
  noButton: "❌ नहीं, यह मैं नहीं था",
  footerNote:
    "अगर आपने साइन इन नहीं किया, तो खाता सुरक्षित करने के लिए “नहीं” टैप करें।",
  approveHeading: (name) => `🎉 बधाई हो, ${name}!`,
  approveBody: "आपका डिवाइस सफलतापूर्वक सत्यापित हो गया है।",
  approveSubtext: "अपनी आसान UNK AI यात्रा का आनंद लें।",
  continueButton: "UNK AI पर जारी रखें",
  denyHeading: "⚠️ हमने आपका खाता सुरक्षित कर दिया है।",
  denyBody: "यह डिवाइस स्वीकृत नहीं किया गया।",
  reviewSecurityButton: "खाता सुरक्षा देखें",
  invalidToken: "यह लिंक अमान्य है या समाप्त हो गया है।",
  alreadyUsed: "यह लिंक पहले ही उपयोग हो चुका है।",
};

const gu: DeviceLoginCopy = {
  ...en,
  subject: "🔐 તમારા UNK AI એકાઉન્ટમાં નવું ડિવાઇસ સાઇન ઇન થયું",
  greeting: (name) => `નમસ્તે ${name},`,
  intro: "તમારા UNK AI એકાઉન્ટમાં હમણાં જ નવું ડિવાઇસ સાઇન ઇન થયું છે.",
  deviceLabel: "ડિવાઇસ",
  browserLabel: "બ્રાઉઝર",
  locationLabel: "સ્થાન",
  timeLabel: "સમય",
  wasThisYou: "શું આ તમે હતા?",
  yesButton: "✅ હા, આ હું જ હતો",
  noButton: "❌ ના, આ હું નહોતો",
  approveHeading: (name) => `🎉 અભિનંદન, ${name}!`,
  approveBody: "તમારું ડિવાઇસ સફળતાપૂર્વક ચકાસાયું છે.",
  approveSubtext: "તમારી સરળ UNK AI મુસાફરીનો આનંદ માણો.",
  continueButton: "UNK AI પર ચાલુ રાખો",
  denyHeading: "⚠️ અમે તમારું એકાઉન્ટ સુરક્ષિત કર્યું છે.",
  denyBody: "આ ડિવાઇસ મંજૂર નથી.",
  reviewSecurityButton: "એકાઉન્ટ સુરક્ષા જુઓ",
};

const mr: DeviceLoginCopy = {
  ...en,
  subject: "🔐 तुमच्या UNK AI खात्यात नवीन डिव्हाइस साइन इन झाले",
  greeting: (name) => `नमस्कार ${name},`,
  intro: "तुमच्या UNK AI खात्यात नुकतेच नवीन डिव्हाइस साइन इन झाले आहे.",
  deviceLabel: "डिव्हाइस",
  browserLabel: "ब्राउझर",
  locationLabel: "स्थान",
  timeLabel: "वेळ",
  wasThisYou: "हे तुम्ही होतात का?",
  yesButton: "✅ होय, मीच होतो",
  noButton: "❌ नाही, मी नव्हतो",
  approveHeading: (name) => `🎉 अभिनंदन, ${name}!`,
  approveBody: "तुमचे डिव्हाइस यशस्वीरित्या सत्यापित झाले.",
  approveSubtext: "तुमच्या सोप्या UNK AI प्रवासाचा आनंद घ्या.",
  continueButton: "UNK AI वर पुढे जा",
  denyHeading: "⚠️ आम्ही तुमचे खाते सुरक्षित केले.",
  denyBody: "हे डिव्हाइस मंजूर केले नाही.",
  reviewSecurityButton: "खाते सुरक्षा पहा",
};

const bn: DeviceLoginCopy = {
  ...en,
  subject: "🔐 আপনার UNK AI অ্যাকাউন্টে নতুন ডিভাইস সাইন ইন হয়েছে",
  greeting: (name) => `নমস্কার ${name},`,
  intro: "আপনার UNK AI অ্যাকাউন্টে একটি নতুন ডিভাইস সাইন ইন করেছে।",
  deviceLabel: "ডিভাইস",
  browserLabel: "ব্রাউজার",
  locationLabel: "অবস্থান",
  timeLabel: "সময়",
  wasThisYou: "এটি কি আপনি ছিলেন?",
  yesButton: "✅ হ্যাঁ, এটি আমিই ছিলাম",
  noButton: "❌ না, এটি আমি ছিলাম না",
  approveHeading: (name) => `🎉 অভিনন্দন, ${name}!`,
  approveBody: "আপনার ডিভাইস সফলভাবে যাচাই হয়েছে।",
  approveSubtext: "আপনার সহজ UNK AI যাত্রা উপভোগ করুন।",
  continueButton: "UNK AI-তে চালিয়ে যান",
  denyHeading: "⚠️ আমরা আপনার অ্যাকাউন্ট সুরক্ষিত করেছি।",
  denyBody: "এই ডিভাইস অনুমোদিত হয়নি।",
  reviewSecurityButton: "অ্যাকাউন্ট নিরাপত্তা দেখুন",
};

const ta: DeviceLoginCopy = {
  ...en,
  subject: "🔐 உங்கள் UNK AI கணக்கில் புதிய சாதனம் உள்நுழைந்தது",
  greeting: (name) => `வணக்கம் ${name},`,
  intro: "உங்கள் UNK AI கணக்கில் ஒரு புதிய சாதனம் இப்போது உள்நுழைந்துள்ளது.",
  deviceLabel: "சாதனம்",
  browserLabel: "உலாவி",
  locationLabel: "இடம்",
  timeLabel: "நேரம்",
  wasThisYou: "இது நீங்களா?",
  yesButton: "✅ ஆம், நான்தான்",
  noButton: "❌ இல்லை, நான் அல்ல",
  approveHeading: (name) => `🎉 வாழ்த்துகள், ${name}!`,
  approveBody: "உங்கள் சாதனம் வெற்றிகரமாக சரிபார்க்கப்பட்டது.",
  approveSubtext: "உங்கள் எளிதான UNK AI பயணத்தை அனுபவியுங்கள்.",
  continueButton: "UNK AI-க்கு தொடரவும்",
  denyHeading: "⚠️ உங்கள் கணக்கைப் பாதுகாத்துள்ளோம்.",
  denyBody: "இந்த சாதனம் அனுமதிக்கப்படவில்லை.",
  reviewSecurityButton: "கணக்கு பாதுகாப்பைப் பார்க்கவும்",
};

const te: DeviceLoginCopy = {
  ...en,
  subject: "🔐 మీ UNK AI ఖాతాలో కొత్త పరికరం సైన్ ఇన్ అయింది",
  greeting: (name) => `నమస్కారం ${name},`,
  intro: "మీ UNK AI ఖాతాలో కొత్త పరికరం ఇప్పుడే సైన్ ఇన్ అయింది.",
  deviceLabel: "పరికరం",
  browserLabel: "బ్రౌజర్",
  locationLabel: "స్థానం",
  timeLabel: "సమయం",
  wasThisYou: "ఇది మీరేనా?",
  yesButton: "✅ అవును, నేనే",
  noButton: "❌ కాదు, నేను కాదు",
  approveHeading: (name) => `🎉 అభినందనలు, ${name}!`,
  approveBody: "మీ పరికరం విజయవంతంగా ధృవీకరించబడింది.",
  approveSubtext: "మీ సులభమైన UNK AI ప్రయాణాన్ని ఆస్వాదించండి.",
  continueButton: "UNK AI కు కొనసాగించండి",
  denyHeading: "⚠️ మేము మీ ఖాతాను సురక్షితం చేసాము.",
  denyBody: "ఈ పరికరం అనుమతించబడలేదు.",
  reviewSecurityButton: "ఖాతా భద్రత చూడండి",
};

const kn: DeviceLoginCopy = {
  ...en,
  subject: "🔐 ನಿಮ್ಮ UNK AI ಖಾತೆಗೆ ಹೊಸ ಸಾಧನ ಸೈನ್ ಇನ್ ಆಗಿದೆ",
  greeting: (name) => `ನಮಸ್ಕಾರ ${name},`,
  intro: "ನಿಮ್ಮ UNK AI ಖಾತೆಗೆ ಹೊಸ ಸಾಧನವು ಈಗ ಸೈನ್ ಇನ್ ಆಗಿದೆ.",
  deviceLabel: "ಸಾಧನ",
  browserLabel: "ಬ್ರೌಸರ್",
  locationLabel: "ಸ್ಥಳ",
  timeLabel: "ಸಮಯ",
  wasThisYou: "ಇದು ನೀವೇನಾ?",
  yesButton: "✅ ಹೌದು, ನಾನೇ",
  noButton: "❌ ಇಲ್ಲ, ನಾನಲ್ಲ",
  approveHeading: (name) => `🎉 ಅಭಿನಂದನೆಗಳು, ${name}!`,
  approveBody: "ನಿಮ್ಮ ಸಾಧನ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
  approveSubtext: "ನಿಮ್ಮ ಸುಲಭ UNK AI ಪ್ರಯಾಣವನ್ನು ಆನಂದಿಸಿ.",
  continueButton: "UNK AI ಗೆ ಮುಂದುವರಿಯಿರಿ",
  denyHeading: "⚠️ ನಾವು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸುರಕ್ಷಿತಗೊಳಿಸಿದ್ದೇವೆ.",
  denyBody: "ಈ ಸಾಧನವನ್ನು ಅನುಮೋದಿಸಲಾಗಿಲ್ಲ.",
  reviewSecurityButton: "ಖಾತೆ ಭದ್ರತೆ ನೋಡಿ",
};

const ml: DeviceLoginCopy = {
  ...en,
  subject: "🔐 നിങ്ങളുടെ UNK AI അക്കൗണ്ടിൽ പുതിയ ഉപകരണം സൈൻ ഇൻ ചെയ്തു",
  greeting: (name) => `നമസ്കാരം ${name},`,
  intro: "നിങ്ങളുടെ UNK AI അക്കൗണ്ടിൽ ഒരു പുതിയ ഉപകരണം ഇപ്പോൾ സൈൻ ഇൻ ചെയ്തു.",
  deviceLabel: "ഉപകരണം",
  browserLabel: "ബ്രൗസർ",
  locationLabel: "സ്ഥലം",
  timeLabel: "സമയം",
  wasThisYou: "ഇത് നിങ്ങളാണോ?",
  yesButton: "✅ അതെ, ഞാനാണ്",
  noButton: "❌ അല്ല, ഞാനല്ല",
  approveHeading: (name) => `🎉 അഭിനന്ദനങ്ങൾ, ${name}!`,
  approveBody: "നിങ്ങളുടെ ഉപകരണം വിജയകരമായി സ്ഥിരീകരിച്ചു.",
  approveSubtext: "നിങ്ങളുടെ എളുപ്പമുള്ള UNK AI യാത്ര ആസ്വദിക്കൂ.",
  continueButton: "UNK AI-ലേക്ക് തുടരുക",
  denyHeading: "⚠️ ഞങ്ങൾ നിങ്ങളുടെ അക്കൗണ്ട് സുരക്ഷിതമാക്കി.",
  denyBody: "ഈ ഉപകരണം അനുവദിച്ചിട്ടില്ല.",
  reviewSecurityButton: "അക്കൗണ്ട് സുരക്ഷ പരിശോധിക്കുക",
};

const pa: DeviceLoginCopy = {
  ...en,
  subject: "🔐 ਤੁਹਾਡੇ UNK AI ਖਾਤੇ ਵਿੱਚ ਨਵਾਂ ਡਿਵਾਈਸ ਸਾਈਨ ਇਨ ਹੋਇਆ",
  greeting: (name) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${name},`,
  intro: "ਤੁਹਾਡੇ UNK AI ਖਾਤੇ ਵਿੱਚ ਹੁਣੇ ਇੱਕ ਨਵਾਂ ਡਿਵਾਈਸ ਸਾਈਨ ਇਨ ਹੋਇਆ ਹੈ।",
  deviceLabel: "ਡਿਵਾਈਸ",
  browserLabel: "ਬ੍ਰਾਊਜ਼ਰ",
  locationLabel: "ਸਥਾਨ",
  timeLabel: "ਸਮਾਂ",
  wasThisYou: "ਕੀ ਇਹ ਤੁਸੀਂ ਸੀ?",
  yesButton: "✅ ਹਾਂ, ਮੈਂ ਹੀ ਸੀ",
  noButton: "❌ ਨਹੀਂ, ਮੈਂ ਨਹੀਂ ਸੀ",
  approveHeading: (name) => `🎉 ਵਧਾਈਆਂ, ${name}!`,
  approveBody: "ਤੁਹਾਡਾ ਡਿਵਾਈਸ ਸਫਲਤਾਪੂਰਵਕ ਤਸਦੀਕ ਹੋ ਗਿਆ ਹੈ।",
  approveSubtext: "ਆਪਣੀ ਆਸਾਨ UNK AI ਯਾਤਰਾ ਦਾ ਆਨੰਦ ਲਓ।",
  continueButton: "UNK AI ਤੇ ਜਾਰੀ ਰੱਖੋ",
  denyHeading: "⚠️ ਅਸੀਂ ਤੁਹਾਡਾ ਖਾਤਾ ਸੁਰੱਖਿਅਤ ਕਰ ਲਿਆ ਹੈ।",
  denyBody: "ਇਹ ਡਿਵਾਈਸ ਮਨਜ਼ੂਰ ਨਹੀਂ ਕੀਤਾ ਗਿਆ।",
  reviewSecurityButton: "ਖਾਤਾ ਸੁਰੱਖਿਆ ਦੇਖੋ",
};

const ur: DeviceLoginCopy = {
  ...en,
  subject: "🔐 آپ کے UNK AI اکاؤنٹ میں نیا آلہ سائن ان ہوا",
  greeting: (name) => `السلام علیکم ${name}،`,
  intro: "آپ کے UNK AI اکاؤنٹ میں ابھی ایک نیا آلہ سائن ان ہوا ہے۔",
  deviceLabel: "آلہ",
  browserLabel: "براؤزر",
  locationLabel: "مقام",
  timeLabel: "وقت",
  wasThisYou: "کیا یہ آپ تھے؟",
  yesButton: "✅ ہاں، یہ میں تھا",
  noButton: "❌ نہیں، یہ میں نہیں تھا",
  footerNote:
    "اگر آپ نے سائن ان نہیں کیا تو اکاؤنٹ محفوظ کرنے کے لیے “نہیں” دبائیں۔",
  approveHeading: (name) => `🎉 مبارک ہو، ${name}!`,
  approveBody: "آپ کا آلہ کامیابی سے تصدیق ہو گیا ہے۔",
  approveSubtext: "اپنے آسان UNK AI سفر سے لطف اٹھائیں۔",
  continueButton: "UNK AI پر جاری رکھیں",
  denyHeading: "⚠️ ہم نے آپ کا اکاؤنٹ محفوظ کر لیا ہے۔",
  denyBody: "یہ آلہ منظور نہیں کیا گیا۔",
  reviewSecurityButton: "اکاؤنٹ سیکیورٹی دیکھیں",
  invalidToken: "یہ لنک غلط ہے یا ختم ہو گیا ہے۔",
  alreadyUsed: "یہ لنک پہلے استعمال ہو چکا ہے۔",
};

const or: DeviceLoginCopy = {
  ...en,
  subject: "🔐 ଆପଣଙ୍କ UNK AI ଆକାଉଣ୍ଟରେ ନୂଆ ଡିଭାଇସ୍ ସାଇନ ଇନ୍ ହୋଇଛି",
  greeting: (name) => `ନମସ୍କାର ${name},`,
  intro: "ଆପଣଙ୍କ UNK AI ଆକାଉଣ୍ଟରେ ଏକ ନୂଆ ଡିଭାଇସ୍ ସାଇନ ଇନ୍ ହୋଇଛି।",
  deviceLabel: "ଡିଭାଇସ୍",
  browserLabel: "ବ୍ରାଉଜର୍",
  locationLabel: "ଅବସ୍ଥାନ",
  timeLabel: "ସମୟ",
  wasThisYou: "ଏହା ଆପଣ ଥିଲେ କି?",
  yesButton: "✅ ହଁ, ମୁଁ ଥିଲି",
  noButton: "❌ ନାହିଁ, ମୁଁ ନୁହେଁ",
  approveHeading: (name) => `🎉 ଅଭିନନ୍ଦନ, ${name}!`,
  approveBody: "ଆପଣଙ୍କ ଡିଭାଇସ୍ ସଫଳତାର ସହ ଯାଞ୍ଚ ହୋଇଛି।",
  approveSubtext: "ଆପଣଙ୍କ ସହଜ UNK AI ଯାତ୍ରା ଉପଭୋଗ କରନ୍ତୁ।",
  continueButton: "UNK AI କୁ ଜାରି ରଖନ୍ତୁ",
  denyHeading: "⚠️ ଆମେ ଆପଣଙ୍କ ଆକାଉଣ୍ଟ ସୁରକ୍ଷିତ କରିଛୁ।",
  denyBody: "ଏହି ଡିଭାଇସ୍ ଅନୁମୋଦିତ ହୋଇନାହିଁ।",
  reviewSecurityButton: "ଆକାଉଣ୍ଟ ସୁରକ୍ଷା ଦେଖନ୍ତୁ",
};

const as: DeviceLoginCopy = {
  ...en,
  subject: "🔐 আপোনাৰ UNK AI একাউণ্টত নতুন ডিভাইচ ছাইন ইন হ’ল",
  greeting: (name) => `নমস্কাৰ ${name},`,
  intro: "আপোনাৰ UNK AI একাউণ্টত এটা নতুন ডিভাইচে ছাইন ইন কৰিছে।",
  deviceLabel: "ডিভাইচ",
  browserLabel: "ব্ৰাউজাৰ",
  locationLabel: "স্থান",
  timeLabel: "সময়",
  wasThisYou: "এইটো আপুনি নেকি?",
  yesButton: "✅ হয়, মইয়েই",
  noButton: "❌ নহয়, মই নহয়",
  approveHeading: (name) => `🎉 অভিনন্দন, ${name}!`,
  approveBody: "আপোনাৰ ডিভাইচ সফলতাৰে পৰীক্ষা হ’ল।",
  approveSubtext: "আপোনাৰ সহজ UNK AI যাত্ৰা উপভোগ কৰক।",
  continueButton: "UNK AI লৈ আগবাঢ়ক",
  denyHeading: "⚠️ আমি আপোনাৰ একাউণ্ট সুৰক্ষিত কৰিছো।",
  denyBody: "এই ডিভাইচ অনুমোদিত হোৱা নাই।",
  reviewSecurityButton: "একাউণ্ট সুৰক্ষা চাওক",
};

const ne: DeviceLoginCopy = {
  ...en,
  subject: "🔐 तपाईंको UNK AI खातामा नयाँ उपकरण साइन इन भयो",
  greeting: (name) => `नमस्ते ${name},`,
  intro: "तपाईंको UNK AI खातामा अहिले नयाँ उपकरणबाट साइन इन भएको छ।",
  deviceLabel: "उपकरण",
  browserLabel: "ब्राउजर",
  locationLabel: "स्थान",
  timeLabel: "समय",
  wasThisYou: "यो तपाईं हो?",
  yesButton: "✅ हो, मैं नै थिएँ",
  noButton: "❌ होइन, म होइन",
  approveHeading: (name) => `🎉 बधाई छ, ${name}!`,
  approveBody: "तपाईंको उपकरण सफलतापूर्वक प्रमाणित भयो।",
  approveSubtext: "आफ्नो सजिलो UNK AI यात्राको आनन्द लिनुहोस्।",
  continueButton: "UNK AI मा जारी राख्नुहोस्",
  denyHeading: "⚠️ हामीले तपाईंको खाता सुरक्षित गर्यौं।",
  denyBody: "यो उपकरण स्वीकृत गरिएको छैन।",
  reviewSecurityButton: "खाता सुरक्षा हेर्नुहोस्",
};

const catalogs: Record<AppLanguage, DeviceLoginCopy> = {
  en,
  hi,
  gu,
  mr,
  bn,
  ta,
  te,
  kn,
  ml,
  pa,
  ur,
  or,
  as,
  ne,
};

export function deviceLoginCopy(lang: AppLanguage): DeviceLoginCopy {
  return catalogs[lang] ?? catalogs[DEFAULT_LANGUAGE];
}
