import type { TranslationCatalog } from "@/lib/i18n/types";
import en from "@/lib/i18n/en";
import { hi as legacy } from "@/lib/i18n/hi";
import { SETUP_I18N } from "@/lib/i18n/setup-i18n";
import { AI_I18N } from "@/lib/i18n/ai-i18n";

const overrides: TranslationCatalog = {
  ...legacy,
  ...SETUP_I18N.hi,
  ...AI_I18N.hi,
  "app.name": "UNK AI",
  "auth.welcomeTitle": "UNK AI में आपका स्वागत है",
  "auth.welcomeBody": "अगला कदम: साइन इन करें या खाता बनाएँ। फिर संपर्क, दिनचर्या और दवाएँ सेट करें।",
  "auth.welcomeSteps": "1. साइन इन करें या खाता बनाएँ\n2. संपर्क, दिनचर्या और दवाएँ जोड़ें\n3. पूरा होने पर होम खोलें",
  "auth.signup": "खाता बनाएँ",
  "auth.password": "पासवर्ड",
  "auth.confirmPassword": "पासवर्ड की पुष्टि करें",
  "auth.fullName": "पूरा नाम",
  "auth.forgotPassword": "पासवर्ड भूल गए?",
  "auth.createAccount": "खाता बनाएँ",
  "auth.continueGuest": "मेहमान के रूप में आगे बढ़ें",
  "auth.emailLinkButton": "सुरक्षा जाँच भेजें",
  "auth.signupButton": "खाता बनाएँ",
  "auth.creatingAccount": "खाता बनाया जा रहा है…",
  "auth.noAccount": "खाता नहीं है?",
  "auth.hasAccount": "पहले से खाता है?",
  "auth.resetTitle": "पासवर्ड बदलें",
  "auth.resetEmailSent": "यदि वह ईमेल मौजूद है, तो हमने निर्देश भेज दिए हैं।",
  "auth.resetNewPassword": "नया पासवर्ड",
  "auth.resetConfirm": "नए पासवर्ड की पुष्टि करें",
  "auth.resetButton": "पासवर्ड अपडेट करें",
  "auth.error.nameRequired": "कृपया अपना पूरा नाम लिखें (कम से कम 2 अक्षर)।",
  "auth.error.passwordShort": "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
  "auth.error.passwordMismatch": "दोनों पासवर्ड मेल नहीं खाते।",
  "auth.error.emailInUse": "यह ईमेल पहले से पंजीकृत है।",
  "auth.error.invalidCredentials": "ईमेल या पासवर्ड गलत है।",
  "auth.error.resendTestMode": "ईमेल सेवा अभी परीक्षण मोड में है। डेवलपर से संपर्क करें या पासवर्ड से साइन इन करें।",
  "auth.error.dbUnavailable": "इस सर्वर पर खाता संग्रह तैयार नहीं है। कृपया बाद में फिर कोशिश करें।",
  "settings.restartSetup": "सेटअप फिर से चलाएँ",
  "settings.restartLanguage": "भाषा चुनने से शुरू करें",
  "settings.memoryTitle": "याददाश्त",
  "settings.memoryHint": "UNK आपकी सुरक्षित पसंद, जैसे पसंदीदा खाना या दिनचर्या, याद रख सकता है। मेडिकल जानकारी मेडिकल में ही रहती है।",
  "settings.memoryEnabled": "UNK को याद रखने दें",
  "settings.memoryView": "सहेजी गई यादें",
  "settings.memoryEmpty": "अभी कोई याद सहेजी नहीं गई है।",
  "settings.memoryClear": "सारी यादें मिटाएँ",
  "settings.memoryDelete": "हटाएँ",
  "setup.step.contacts": "{total} में से चरण {step} — फोन और संपर्क",
  "setup.step.routine": "{total} में से चरण {step} — दैनिक दिनचर्या",
  "setup.step.medicines": "{total} में से चरण {step} — दवाएँ",
  "setup.step.complete": "{total} में से चरण {step} — पूरा हुआ",
  "setup.contacts.yourPhone": "आपका फोन नंबर",
  "setup.contacts.continue": "मेरी दिनचर्या पर जाएँ",
};

const hi: TranslationCatalog = { ...en, ...overrides };
export default hi;
