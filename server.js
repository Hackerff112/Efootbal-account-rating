const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

const CURRENCY_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, CNY: 7.24, INR: 83.12,
  BRL: 4.97, KRW: 1320.50, MXN: 17.15, AUD: 1.53, CAD: 1.36, CHF: 0.88,
  THB: 35.50, VND: 24350, IDR: 15650, MYR: 4.72, PHP: 55.80, SGD: 1.34,
  DZD: 134.50, MAD: 10.05, EGP: 30.90
};

const CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan', INR: 'Indian Rupee', BRL: 'Brazilian Real',
  KRW: 'South Korean Won', MXN: 'Mexican Peso', AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar', CHF: 'Swiss Franc', THB: 'Thai Baht', VND: 'Vietnamese Dong',
  IDR: 'Indonesian Rupiah', MYR: 'Malaysian Ringgit', PHP: 'Philippine Peso',
  SGD: 'Singapore Dollar', DZD: 'Algerian Dinar', MAD: 'Moroccan Dirham', EGP: 'Egyptian Pound'
};

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', BRL: 'R$', KRW: '₩', MXN: '$', AUD: 'A$', CAD: 'C$', CHF: 'Fr', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', PHP: '₱', SGD: 'S$', DZD: 'د.ج', MAD: 'د.م.', EGP: 'E£'
};

const METAPLayers = {
  'messi 110': { baseValue: 300, multiplier: 3.0 },
  'messi 108': { baseValue: 200, multiplier: 2.5 },
  'messi 105': { baseValue: 120, multiplier: 2.0 },
  'ronaldo 108': { baseValue: 180, multiplier: 2.2 },
  'ronaldo 105': { baseValue: 100, multiplier: 1.8 },
  'mbappé': { baseValue: 90, multiplier: 1.5 },
  'haaland': { baseValue: 85, multiplier: 1.4 },
  'de bryune': { baseValue: 80, multiplier: 1.3 },
  'kevin de bruyne': { baseValue: 80, multiplier: 1.3 },
  'ronaldo': { baseValue: 70, multiplier: 1.2 },
  'neymar': { baseValue: 65, multiplier: 1.1 },
  'lewandowski': { baseValue: 60, multiplier: 1.1 },
  'modric': { baseValue: 55, multiplier: 1.0 },
  'kroos': { baseValue: 50, multiplier: 1.0 },
  'van dijk': { baseValue: 45, multiplier: 0.9 },
  'salah': { baseValue: 40, multiplier: 0.8 },
  'kane': { baseValue: 40, multiplier: 0.8 }
};

const TRANSLATIONS = {
  en: {
    title: 'eFootball Account Valuator',
    subtitle: 'Premium Account Valuation Community',
    evaluate: 'Evaluate Now',
    username: 'Username',
    usernamePlaceholder: 'Enter your eFootball username',
    accountDetails: 'Account Details',
    accountDetailsPlaceholder: 'Describe your team: players, coach, formation...',
    selectCurrency: 'Select Currency',
    uploadScreenshot: 'Upload Screenshot',
    dropzoneText: 'Drop image here or click to upload',
    dropzoneHint: 'Supported: PNG, JPG (Max 5MB)',
    result: 'Valuation Result',
    priceIn: 'Price in',
    approxUsd: 'Approximately',
    details: 'Account Details',
    allCurrencies: 'Price in All Currencies',
    howItWorks: 'How It Works',
    step1Title: 'Enter Account Details',
    step1Desc: 'Provide username and describe your team or upload a screenshot.',
    step2Title: 'AI Valuation',
    step2Desc: 'Our AI expert analyzes your account and calculates a fair market value.',
    step3Title: 'Get Your Price',
    step3Desc: 'Receive your valuation in 20+ currencies instantly.',
    playersFound: 'Players Detected',
    teamStrength: 'Team Strength',
    metaRelevance: 'Meta Relevance',
    analyzing: 'Analyzing image...',
    evaluating: 'Evaluating account...',
    error: 'Error',
    pleaseTryAgain: 'Please try again.',
    supportedCurrencies: 'Supported Currencies'
  },
  ar: {
    title: 'مقيم حسابات eFootball',
    subtitle: 'مجتمع تقييم الحسابات ال��تميز',
    evaluate: 'قيّم الآن',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'أدخل اسم مستخدم eFootball',
    accountDetails: 'تفاصيل الحساب',
    accountDetailsPlaceholder: 'صف فريقك: اللاعبين، المدرب، التشكيل...',
    selectCurrency: 'اختر العملة',
    uploadScreenshot: 'رفع لقطة الشاشة',
    dropzoneText: 'أسقط الصورة هنا أو انقر للرفع',
    dropzoneHint: 'مدعوم: PNG، JPG (الحد الأقصى 5 ميجابايت)',
    result: 'نتيجة التقييم',
    priceIn: 'السعر بعملة',
    approxUsd: 'تقريباً',
    details: 'تفاصيل الحساب',
    allCurrencies: 'الأسعار بالعملات المختلفة',
    howItWorks: 'كيف يعمل',
    step1Title: 'أدخل تفاصيل الحساب',
    step1Desc: 'قدّم اسم المستخدم وصف فريقك أو ارفع لقطة شاشة.',
    step2Title: 'التقييم بالذكاء الاصطناعي',
    step2Desc: 'يحلل خبراؤنا الذكاء الاصطناعي حسابك ويحسب القيمة السوقية العادلة.',
    step3Title: 'احصل على سعرك',
    step3Desc: 'استلم تقييمك بعملات متعددة instantanément.',
    playersFound: 'اللاعبين المكتشفين',
    teamStrength: 'قوة الفريق',
    metaRelevance: 'Relevance Meta',
    analyzing: 'جاري تحليل الصورة...',
    evaluating: 'جاري التقييم...',
    error: 'خطأ',
    pleaseTryAgain: 'الرجاء المحاولة مرة أخرى.',
    supportedCurrencies: 'العملات المدعومة'
  },
  fr: {
    title: 'Évaluateur de Compte eFootball',
    subtitle: 'Communauté d\'Évaluation de Compte Premium',
    evaluate: 'Évaluer',
    username: 'Nom d\'utilisateur',
    usernamePlaceholder: 'Entrez votre nom d\'utilisateur eFootball',
    accountDetails: 'Détails du Compte',
    accountDetailsPlaceholder: 'Décrivez votre équipe: joueurs, coach, formation...',
    selectCurrency: 'Sélectionner la Devise',
    uploadScreenshot: 'Télécharger la Capture',
    dropzoneText: 'Déposez l\'image ici ou cliquez pour télécharger',
    dropzoneHint: 'Supporté: PNG, JPG (Max 5Mo)',
    result: 'Résultat de l\'Évaluation',
    priceIn: 'Prix en',
    approxUsd: 'Environ',
    details: 'Détails du Compte',
    allCurrencies: 'Prix dans Toutes les Devises',
    howItWorks: 'Comment Ça Marche',
    step1Title: 'Entrez les Détails',
    step1Desc: 'Fournissez username et décrivez votre équipe ou téléchargez une capture.',
    step2Title: 'Évaluation IA',
    step2Desc: 'Notre expert IA analyse votre compte et calcule une valeur marchande juste.',
    step3Title: 'Obtenez Votre Prix',
    step3Desc: 'Recevez votre évaluation dans plus de 20 devises.',
    playersFound: 'Joueurs Détectés',
    teamStrength: 'Force de l\'Équipe',
    metaRelevance: 'Pertinence Méta',
    analyzing: 'Analyse de l\'image...',
    evaluating: 'Évaluation en cours...',
    error: 'Erreur',
    pleaseTryAgain: 'Veuillez réessayer.',
    supportedCurrencies: 'Devises Supportées'
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /png|jpg|jpeg|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, allowed.test(ext));
  }
});

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(path.join(__dirname, 'public/uploads'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function analyzeImageWithVision(imagePath) {
  try {
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2-vision',
      prompt: `You are an eFootball expert analyzing a game screenshot. Analyze this image and provide:
1. List ALL players visible with their names and ratings (e.g., "Messi 110", "Ronaldo 108", "Mbappé 91")
2. Total team strength (OVR) if visible
3. Team formation (e.g., 4-3-3, 4-2-3-1)
4. Any club cards, legend cards, or special items visible

Format your response as JSON:
{"players": ["Player Name Rating"], "team_strength": number, "formation": "formation", "special_items": ["item"]}`,
      images: [imageBase64],
      stream: false
    }, { timeout: 90000 });

    const result = response.data.response;
    const playersMatch = result.match(/\"players\":\s*\[(.*?)\]/s);
    const strengthMatch = result.match(/\"team_strength\":\s*(\d+)/);
    const formationMatch = result.match(/\"formation\":\s*\"([^\"]+)\"/);

    const players = playersMatch ? playersMatch[1].replace(/"/g, '').split(',').map(p => p.trim()).filter(p => p) : [];
    const teamStrength = strengthMatch ? parseInt(strengthMatch[1]) : 0;
    const formation = formationMatch ? formationMatch[1] : 'Unknown';

    return { players, teamStrength, formation, rawAnalysis: result };
  } catch (error) {
    console.log('Vision AI error:', error.message);
    return { players: [], teamStrength: 0, formation: 'Unknown', rawAnalysis: '' };
  }
}

async function evaluateWithMetaAI(accountDetails, visionData) {
  let playersFound = visionData?.players || [];
  let teamStrength = visionData?.teamStrength || 0;
  let formation = visionData?.formation || 'Unknown';

  if (!visionData?.players?.length) {
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3.2',
        prompt: `You are an eFootball expert. From this account description: "${accountDetails}"

Extract and list all players mentioned with their ratings. Format as JSON:
{"players": ["Name Rating", "Name Rating"], "team_strength": estimated_ovr}`,
        stream: false
      }, { timeout: 60000 });

      const result = response.data.response;
      const match = result.match(/\"players\":\s*\[(.*?)\]/s);
      if (match) {
        playersFound = match[1].replace(/"/g, '').split(',').map(p => p.trim()).filter(p => p);
      }
      teamStrength = teamStrength || (Math.floor(Math.random() * 15) + 85);
    } catch (e) {
      console.log('Text AI error:', e.message);
      playersFound = [];
      teamStrength = Math.floor(Math.random() * 15) + 85;
    }
  }

  let baseValue = 50;
  let metaMultiplier = 1.0;
  let metaPlayers = [];

  for (const player of playersFound) {
    const playerLower = player.toLowerCase();
    for (const [metaName, data] of Object.entries(METAPLayers)) {
      if (playerLower.includes(metaName)) {
        baseValue += data.baseValue;
        metaMultiplier = Math.max(metaMultiplier, data.multiplier);
        metaPlayers.push(player);
      }
    }
  }

  baseValue = baseValue + (teamStrength * 2);
  const finalValue = Math.round(baseValue * metaMultiplier);

  return {
    valueUSD: finalValue,
    players: playersFound,
    metaPlayers,
    teamStrength,
    formation,
    metaLevel: metaMultiplier > 2 ? 'S-Tier' : metaMultiplier > 1.5 ? 'A-Tier' : metaMultiplier > 1 ? 'B-Tier' : 'C-Tier'
  };
}

app.get('/', (req, res) => {
  const lang = req.query.lang || 'en';
  res.render('index', {
    t: TRANSLATIONS[lang],
    lang,
    currencies: CURRENCY_NAMES,
    result: null
  });
});

app.post('/evaluate', upload.single('screenshot'), async (req, res) => {
  try {
    const { username, accountDetails, currency, lang } = req.body;
    const selectedLang = lang || 'en';
    let visionData = null;

    if (req.file) {
      visionData = await analyzeImageWithVision(req.file.path);
    }

    const evaluation = await evaluateWithMetaAI(accountDetails || '', visionData);
    const selectedCurrency = currency || 'USD';
    const rate = CURRENCY_RATES[selectedCurrency] || 1;
    const convertedPrice = (evaluation.valueUSD * rate).toFixed(2);

    const date = new Date().toISOString();
    const accountText = visionData ? `Image: ${visionData.players.join(', ')}` : accountDetails;

    db.run(
      `INSERT INTO valuations (username, account_details, price_usd, converted_price, currency, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [username || 'Anonymous', accountText, evaluation.valueUSD, convertedPrice, selectedCurrency, date]
    );

    const allPrices = {};
    for (const [curr, rate] of Object.entries(CURRENCY_RATES)) {
      allPrices[curr] = (evaluation.valueUSD * rate).toFixed(2);
    }

    res.render('index', {
      t: TRANSLATIONS[selectedLang],
      lang: selectedLang,
      currencies: CURRENCY_NAMES,
      result: {
        username: username || 'Anonymous',
        accountDetails: accountText,
        priceUSD: evaluation.valueUSD,
        convertedPrice,
        selectedCurrency,
        selectedCurrencySymbol: CURRENCY_SYMBOLS[selectedCurrency] || '$',
        allPrices,
        date,
        players: evaluation.players,
        metaPlayers: evaluation.metaPlayers,
        teamStrength: evaluation.teamStrength,
        formation: evaluation.formation,
        metaLevel: evaluation.metaLevel
      }
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    const lang = req.body?.lang || 'en';
    res.render('index', {
      t: TRANSLATIONS[lang],
      lang,
      currencies: CURRENCY_NAMES,
      error: TRANSLATIONS[lang].pleaseTryAgain
    });
  }
});

app.get('/history', (req, res) => {
  db.all(`SELECT * FROM valuations ORDER BY date DESC LIMIT 50`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Currencies: ${Object.keys(CURRENCY_RATES).join(', ')}`);
  console.log(`Languages: ${Object.keys(TRANSLATIONS).join(', ')}`);
});