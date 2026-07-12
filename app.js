// ============================================================
// CẤU HÌNH GOOGLE DRIVE
// ============================================================
const GDRIVE_CLIENT_ID = '806114616037-tk1ohpbv8vhh0ftsk1igei9u7np5jk5u.apps.googleusercontent.com';
const GDRIVE_FILE_NAME = 'personal_dictionary_data.json';
const GDRIVE_SCOPE     = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';
let gDriveFileId = null;

// ============================================================
// HẰNG SỐ & BIẾN TOÀN CỤC
// ============================================================
const DATA_URL  = './data/dictionary.json';
const PAGE_SIZE = 40;

// Danh sách ngôn ngữ thế giới — hiển thị theo tên tiếng Việt, sắp xếp A-Z
const LANGS = [
  'Tất cả',
  'Abkhaz','Afar','Afrikaans','Akan','Albanian','Amharic','Arabic','Aragonese','Armenian','Assamese',
  'Avaric','Avestan','Aymara','Azerbaijani',
  'Bambara','Bashkir','Basque','Belarusian','Bengali','Bihari','Bislama','Bosnian','Breton','Bulgarian','Burmese',
  'Catalan','Chamorro','Chechen','Chichewa','Chinese (Simplified)','Chinese (Traditional)','Chuvash','Cornish','Corsican','Cree','Croatian','Czech',
  'Danish','Divehi','Dutch','Dzongkha',
  'English','Esperanto','Estonian','Ewe',
  'Faroese','Fijian','Finnish','French','Fula',
  'Galician','Georgian','German','Greek','Guaraní','Gujarati',
  'Haitian Creole','Hausa','Hebrew','Herero','Hindi','Hiri Motu','Hungarian',
  'Interlingua','Indonesian','Interlingue','Irish','Igbo','Inupiaq','Ido','Icelandic','Italian','Inuktitut',
  'Japanese','Javanese',
  'Kalaallisut','Kannada','Kanuri','Kashmiri','Kazakh','Khmer','Kikuyu','Kinyarwanda','Kirghiz','Komi','Kongo','Korean','Kurdish','Kwanyama',
  'Lao','Latin','Latvian','Limburgish','Lingala','Lithuanian','Luba-Katanga','Luxembourgish',
  'Macedonian','Malagasy','Malay','Malayalam','Maltese','Māori','Marathi','Marshallese','Mongolian',
  'Nauru','Navajo','Norwegian Bokmål','North Ndebele','Nepali','Ndonga','Norwegian Nynorsk','Norwegian','Nuosu','South Ndebele','Occitan','Ojibwe','Old Church Slavonic','Oromo','Oriya','Ossetian',
  'Panjabi','Pāli','Persian','Polish','Pashto','Portuguese',
  'Quechua',
  'Romansh','Kirundi','Romanian','Russian',
  'Sanskrit','Sardinian','Sindhi','Northern Sami','Samoan','Sango','Serbian','Scottish Gaelic','Shona','Sinhala','Slovak','Slovene','Somali','South Ndebele','Southern Sotho','Spanish','Sundanese','Swahili','Swati','Swedish',
  'Tamil','Telugu','Tajik','Thai','Tigrinya','Tibetan','Turkmen','Tagalog','Tswana','Tonga','Turkish','Tsonga',
  'Tatar','Twi','Tahitian',
  'Uighur','Ukrainian','Urdu','Uzbek',
  'Venda','Vietnamese',
  'Volapük',
  'Walloon','Welsh','Wolof',
  'Western Frisian',
  'Xhosa',
  'Yiddish','Yoruba',
  'Zhuang','Zulu',
  'Khác'
];

// Bảng chuẩn hóa: key (đã bỏ dấu, viết thường) → tên hiển thị trong LANGS
const LANGUAGE_LABELS = {
  // Meta
  'all':'Tất cả','tat ca':'Tất cả','khac':'Khác','other':'Khác',

  // A
  'abkhaz':'Abkhaz','ab':'Abkhaz',
  'afar':'Afar','aa':'Afar',
  'afrikaans':'Afrikaans','af':'Afrikaans',
  'akan':'Akan','ak':'Akan',
  'albanian':'Albanian','sq':'Albanian',
  'amharic':'Amharic','am':'Amharic',
  'arabic':'Arabic','ar':'Arabic',
  'aragonese':'Aragonese','an':'Aragonese',
  'armenian':'Armenian','hy':'Armenian',
  'assamese':'Assamese','as':'Assamese',
  'avaric':'Avaric','av':'Avaric',
  'avestan':'Avestan','ae':'Avestan',
  'aymara':'Aymara','ay':'Aymara',
  'azerbaijani':'Azerbaijani','az':'Azerbaijani',

  // B
  'bambara':'Bambara','bm':'Bambara',
  'bashkir':'Bashkir','ba':'Bashkir',
  'basque':'Basque','eu':'Basque',
  'belarusian':'Belarusian','be':'Belarusian',
  'bengali':'Bengali','bn':'Bengali',
  'bihari':'Bihari','bh':'Bihari',
  'bislama':'Bislama','bi':'Bislama',
  'bosnian':'Bosnian','bs':'Bosnian',
  'breton':'Breton','br':'Breton',
  'bulgarian':'Bulgarian','bg':'Bulgarian',
  'burmese':'Burmese','my':'Burmese',

  // C
  'catalan':'Catalan','ca':'Catalan',
  'chamorro':'Chamorro','ch':'Chamorro',
  'chechen':'Chechen','ce':'Chechen',
  'chichewa':'Chichewa','ny':'Chichewa',
  'chinese (simplified)':'Chinese (Simplified)','zh':'Chinese (Simplified)','zh-hans':'Chinese (Simplified)',
  'trung':'Chinese (Simplified)','chinese':'Chinese (Simplified)',
  'chinese (traditional)':'Chinese (Traditional)','zh-hant':'Chinese (Traditional)',
  'chuvash':'Chuvash','cv':'Chuvash',
  'cornish':'Cornish','kw':'Cornish',
  'corsican':'Corsican','co':'Corsican',
  'cree':'Cree','cr':'Cree',
  'croatian':'Croatian','hr':'Croatian',
  'czech':'Czech','cs':'Czech',

  // D
  'danish':'Danish','da':'Danish',
  'divehi':'Divehi','dv':'Divehi',
  'dutch':'Dutch','nl':'Dutch',
  'dzongkha':'Dzongkha','dz':'Dzongkha',

  // E
  'english':'English','en':'English','anh':'English',
  'esperanto':'Esperanto','eo':'Esperanto',
  'estonian':'Estonian','et':'Estonian',
  'ewe':'Ewe','ee':'Ewe',

  // F
  'faroese':'Faroese','fo':'Faroese',
  'fijian':'Fijian','fj':'Fijian',
  'finnish':'Finnish','fi':'Finnish',
  'french':'French','fr':'French','phap':'French',
  'fula':'Fula','ff':'Fula',

  // G
  'galician':'Galician','gl':'Galician',
  'georgian':'Georgian','ka':'Georgian',
  'german':'German','de':'German','duc':'German',
  'greek':'Greek','el':'Greek',
  'guarani':'Guaraní','gn':'Guaraní',
  'gujarati':'Gujarati','gu':'Gujarati',

  // H
  'haitian creole':'Haitian Creole','ht':'Haitian Creole',
  'hausa':'Hausa','ha':'Hausa',
  'hebrew':'Hebrew','he':'Hebrew',
  'herero':'Herero','hz':'Herero',
  'hindi':'Hindi','hi':'Hindi',
  'hiri motu':'Hiri Motu','ho':'Hiri Motu',
  'hungarian':'Hungarian','hu':'Hungarian',

  // I
  'interlingua':'Interlingua','ia':'Interlingua',
  'indonesian':'Indonesian','id':'Indonesian',
  'interlingue':'Interlingue','ie':'Interlingue',
  'irish':'Irish','ga':'Irish',
  'igbo':'Igbo','ig':'Igbo',
  'inupiaq':'Inupiaq','ik':'Inupiaq',
  'ido':'Ido','io':'Ido',
  'icelandic':'Icelandic','is':'Icelandic',
  'italian':'Italian','it':'Italian',
  'inuktitut':'Inuktitut','iu':'Inuktitut',

  // J
  'japanese':'Japanese','ja':'Japanese','nhat':'Japanese',
  'javanese':'Javanese','jv':'Javanese',

  // K
  'kalaallisut':'Kalaallisut','kl':'Kalaallisut',
  'kannada':'Kannada','kn':'Kannada',
  'kanuri':'Kanuri','kr':'Kanuri',
  'kashmiri':'Kashmiri','ks':'Kashmiri',
  'kazakh':'Kazakh','kk':'Kazakh',
  'khmer':'Khmer','km':'Khmer',
  'kikuyu':'Kikuyu','ki':'Kikuyu',
  'kinyarwanda':'Kinyarwanda','rw':'Kinyarwanda',
  'kirghiz':'Kirghiz','ky':'Kirghiz',
  'komi':'Komi','kv':'Komi',
  'kongo':'Kongo','kg':'Kongo',
  'korean':'Korean','ko':'Korean','han':'Korean',
  'kurdish':'Kurdish','ku':'Kurdish',
  'kwanyama':'Kwanyama','kj':'Kwanyama',

  // L
  'lao':'Lao','lo':'Lao',
  'latin':'Latin','la':'Latin',
  'latvian':'Latvian','lv':'Latvian',
  'limburgish':'Limburgish','li':'Limburgish',
  'lingala':'Lingala','ln':'Lingala',
  'lithuanian':'Lithuanian','lt':'Lithuanian',
  'luba-katanga':'Luba-Katanga','lu':'Luba-Katanga',
  'luxembourgish':'Luxembourgish','lb':'Luxembourgish',

  // M
  'macedonian':'Macedonian','mk':'Macedonian',
  'malagasy':'Malagasy','mg':'Malagasy',
  'malay':'Malay','ms':'Malay',
  'malayalam':'Malayalam','ml':'Malayalam',
  'maltese':'Maltese','mt':'Maltese',
  'maori':'Māori','mi':'Māori',
  'marathi':'Marathi','mr':'Marathi',
  'marshallese':'Marshallese','mh':'Marshallese',
  'mongolian':'Mongolian','mn':'Mongolian',

  // N
  'nauru':'Nauru','na':'Nauru',
  'navajo':'Navajo','nv':'Navajo',
  'norwegian bokmal':'Norwegian Bokmål','nb':'Norwegian Bokmål',
  'north ndebele':'North Ndebele','nd':'North Ndebele',
  'nepali':'Nepali','ne':'Nepali',
  'ndonga':'Ndonga','ng':'Ndonga',
  'norwegian nynorsk':'Norwegian Nynorsk','nn':'Norwegian Nynorsk',
  'norwegian':'Norwegian','no':'Norwegian',
  'nuosu':'Nuosu','ii':'Nuosu',
  'south ndebele':'South Ndebele','nr':'South Ndebele',

  // O
  'occitan':'Occitan','oc':'Occitan',
  'ojibwe':'Ojibwe','oj':'Ojibwe',
  'old church slavonic':'Old Church Slavonic','cu':'Old Church Slavonic',
  'oromo':'Oromo','om':'Oromo',
  'oriya':'Oriya','or':'Oriya',
  'ossetian':'Ossetian','os':'Ossetian',

  // P
  'panjabi':'Panjabi','pa':'Panjabi',
  'pali':'Pāli','pi':'Pāli',
  'persian':'Persian','fa':'Persian',
  'polish':'Polish','pl':'Polish',
  'pashto':'Pashto','ps':'Pashto',
  'portuguese':'Portuguese','pt':'Portuguese',

  // Q
  'quechua':'Quechua','qu':'Quechua',

  // R
  'romansh':'Romansh','rm':'Romansh',
  'kirundi':'Kirundi','rn':'Kirundi',
  'romanian':'Romanian','ro':'Romanian',
  'russian':'Russian','ru':'Russian','nga':'Russian',

  // S
  'sanskrit':'Sanskrit','sa':'Sanskrit',
  'sardinian':'Sardinian','sc':'Sardinian',
  'sindhi':'Sindhi','sd':'Sindhi',
  'northern sami':'Northern Sami','se':'Northern Sami',
  'samoan':'Samoan','sm':'Samoan',
  'sango':'Sango','sg':'Sango',
  'serbian':'Serbian','sr':'Serbian',
  'scottish gaelic':'Scottish Gaelic','gd':'Scottish Gaelic',
  'shona':'Shona','sn':'Shona',
  'sinhala':'Sinhala','si':'Sinhala',
  'slovak':'Slovak','sk':'Slovak',
  'slovene':'Slovene','sl':'Slovene',
  'somali':'Somali','so':'Somali',
  'southern sotho':'Southern Sotho','st':'Southern Sotho',
  'spanish':'Spanish','es':'Spanish',
  'sundanese':'Sundanese','su':'Sundanese',
  'swahili':'Swahili','sw':'Swahili',
  'swati':'Swati','ss':'Swati',
  'swedish':'Swedish','sv':'Swedish',

  // T
  'tamil':'Tamil','ta':'Tamil',
  'telugu':'Telugu','te':'Telugu',
  'tajik':'Tajik','tg':'Tajik',
  'thai':'Thai','th':'Thai',
  'tigrinya':'Tigrinya','ti':'Tigrinya',
  'tibetan':'Tibetan','bo':'Tibetan',
  'turkmen':'Turkmen','tk':'Turkmen',
  'tagalog':'Tagalog','tl':'Tagalog',
  'tswana':'Tswana','tn':'Tswana',
  'tonga':'Tonga','to':'Tonga',
  'turkish':'Turkish','tr':'Turkish',
  'tsonga':'Tsonga','ts':'Tsonga',
  'tatar':'Tatar','tt':'Tatar',
  'twi':'Twi','tw':'Twi',
  'tahitian':'Tahitian','ty':'Tahitian',

  // U
  'uighur':'Uighur','ug':'Uighur',
  'ukrainian':'Ukrainian','uk':'Ukrainian',
  'urdu':'Urdu','ur':'Urdu',
  'uzbek':'Uzbek','uz':'Uzbek',

  // V
  'venda':'Venda','ve':'Venda',
  'vietnamese':'Vietnamese','vi':'Vietnamese','viet':'Vietnamese',
  'volapuk':'Volapük','vo':'Volapük',

  // W
  'walloon':'Walloon','wa':'Walloon',
  'welsh':'Welsh','cy':'Welsh',
  'wolof':'Wolof','wo':'Wolof',
  'western frisian':'Western Frisian','fy':'Western Frisian',

  // X
  'xhosa':'Xhosa','xh':'Xhosa',

  // Y
  'yiddish':'Yiddish','yi':'Yiddish',
  'yoruba':'Yoruba','yo':'Yoruba',

  // Z
  'zhuang':'Zhuang','za':'Zhuang',
  'zulu':'Zulu','zu':'Zulu',
};

// Bảng mã BCP-47 cho Web Speech API
const LANG_BCP47 = {
  'English':'en-US','Vietnamese':'vi-VN','Chinese (Simplified)':'zh-CN','Chinese (Traditional)':'zh-TW',
  'Thai':'th-TH','Japanese':'ja-JP','Korean':'ko-KR','French':'fr-FR','German':'de-DE','Russian':'ru-RU',
  'Spanish':'es-ES','Portuguese':'pt-PT','Italian':'it-IT','Dutch':'nl-NL','Arabic':'ar-SA',
  'Hindi':'hi-IN','Bengali':'bn-BD','Turkish':'tr-TR','Polish':'pl-PL','Ukrainian':'uk-UA',
  'Romanian':'ro-RO','Czech':'cs-CZ','Slovak':'sk-SK','Hungarian':'hu-HU','Finnish':'fi-FI',
  'Swedish':'sv-SE','Norwegian':'no-NO','Danish':'da-DK','Greek':'el-GR','Bulgarian':'bg-BG',
  'Croatian':'hr-HR','Serbian':'sr-RS','Slovenian':'sl-SI','Lithuanian':'lt-LT','Latvian':'lv-LV',
  'Estonian':'et-EE','Hebrew':'he-IL','Persian':'fa-IR','Urdu':'ur-PK','Malay':'ms-MY',
  'Indonesian':'id-ID','Filipino':'fil-PH','Tagalog':'tl-PH','Swahili':'sw-KE','Afrikaans':'af-ZA',
  'Catalan':'ca-ES','Basque':'eu-ES','Galician':'gl-ES','Welsh':'cy-GB','Irish':'ga-IE',
  'Icelandic':'is-IS','Maltese':'mt-MT','Albanian':'sq-AL','Macedonian':'mk-MK','Belarusian':'be-BY',
  'Armenian':'hy-AM','Georgian':'ka-GE','Azerbaijani':'az-AZ','Kazakh':'kk-KZ','Uzbek':'uz-UZ',
  'Mongolian':'mn-MN','Nepali':'ne-NP','Sinhala':'si-LK','Khmer':'km-KH','Lao':'lo-LA',
  'Burmese':'my-MM','Tamil':'ta-IN','Telugu':'te-IN','Kannada':'kn-IN','Malayalam':'ml-IN',
  'Gujarati':'gu-IN','Panjabi':'pa-IN','Marathi':'mr-IN','Assamese':'as-IN',
  'Amharic':'am-ET','Somali':'so-SO','Hausa':'ha-NG','Yoruba':'yo-NG','Igbo':'ig-NG',
  'Zulu':'zu-ZA','Xhosa':'xh-ZA',
};

const $        = id => document.getElementById(id);
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

let baseEntries    = [];
let customEntries  = [];
let deletedIds     = new Set();
let visibleEntries = [];
let page           = 0;
let selectedId     = '';
let currentImage   = '';

let gAccessToken = null;
let entriesCache = null;
let entriesById = null;
let sortedCache = null;
const searchCache = new WeakMap();

// ============================================================
// TIỆN ÍCH CHUNG
// ============================================================
function normalizeLanguage(value){
  const raw = String(value || '').trim();
  // Thử tra trực tiếp (giữ nguyên dấu) trước
  if (LANGUAGE_LABELS[raw]) return LANGUAGE_LABELS[raw];
  // Bỏ dấu + viết thường
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return LANGUAGE_LABELS[key] || raw || 'Khác';
}
function searchText(value){ return String(value || '').toLocaleLowerCase('vi').trim(); }
function makeId(){ return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }
function toast(message){
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $('toast').hidden = true, 3200);
}

// ============================================================
// GOOGLE DRIVE AUTH & API
// ============================================================
function gSignIn(){
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts) {
      return reject(new Error('Thư viện Google chưa tải xong, thử lại sau vài giây.'));
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GDRIVE_CLIENT_ID,
      scope: GDRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(new Error('Đăng nhập Google thất bại: ' + resp.error));
        gAccessToken = resp.access_token;
        updateDriveStatus(true);
        resolve(resp.access_token);
      }
    });
    client.requestAccessToken();
  });
}

async function ensureToken(){
  if (gAccessToken) return gAccessToken;
  return await gSignIn();
}

async function gDriveFindFile(token){
  const q = encodeURIComponent(`name='${GDRIVE_FILE_NAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=5`,
    { headers: { Authorization: 'Bearer ' + token } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.files && data.files.length > 0) ? data.files[0].id : null;
}

async function gDriveCreateFile(token, content){
  const metadata = { name: GDRIVE_FILE_NAME, mimeType: 'application/json' };
  const boundary = 'dicboundary';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`
  ].join('\r\n');
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method : 'POST',
      headers: {
        Authorization : 'Bearer ' + token,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    }
  );
  if (!res.ok) throw new Error('Không tạo được file Drive: ' + res.status);
  const data = await res.json();
  return data.id;
}

async function gDriveUpdateFile(token, fileId, content){
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method : 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body   : content
    }
  );
  if (!res.ok) throw new Error('Không ghi được file Drive: ' + res.status + ' ' + res.statusText);
  return await res.json();
}

async function gDriveWriteFile(data){
  const token   = await ensureToken();
  const content = JSON.stringify(data, null, 2);
  if (!gDriveFileId) gDriveFileId = await gDriveFindFile(token);
  if (gDriveFileId){
    await gDriveUpdateFile(token, gDriveFileId, content);
  } else {
    gDriveFileId = await gDriveCreateFile(token, content);
  }
}

function updateDriveStatus(connected){
  const btn = $('driveBtn');
  if (!btn) return;
  if (connected){
    btn.textContent = '✓ Drive đã kết nối';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
  } else {
    btn.textContent = 'Kết nối Drive';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

// ============================================================
// LƯU / TẢI DỮ LIỆU
// ============================================================
async function saveToDrive(){
  const data = {
    entries    : customEntries,
    deletedIds : [...deletedIds],
    savedAt    : new Date().toISOString()
  };
  await gDriveWriteFile(data);
}

async function loadFromDrive(){
  try {
    const token = await ensureToken();
    if (!gDriveFileId) gDriveFileId = await gDriveFindFile(token);
    if (!gDriveFileId) return [];
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${gDriveFileId}?alt=media`,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.deletedIds)){
      data.deletedIds.forEach(id => deletedIds.add(id));
    }
    return Array.isArray(data) ? data : (data.entries || []);
  } catch {
    return [];
  }
}

async function loadDictionaryFile(url){
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
  const data = await response.json();
  return (Array.isArray(data) ? data : data.entries || []).map(cleanEntry);
}

// ============================================================
// ENTRY HELPERS
// ============================================================
function cleanEntry(entry){
  return {
    id            : entry.id || makeId(),
    headword      : entry.headword || entry.foreignTerm || entry.vietnamese || '',
    translation   : entry.translation || entry.meaning || '',
    sourceLanguage: normalizeLanguage(entry.sourceLanguage || entry.language || 'Vietnamese'),
    targetLanguage: normalizeLanguage(entry.targetLanguage || (entry.language === 'Viet' ? 'English' : 'Vietnamese')),
    pronunciation : entry.pronunciation || '',
    category      : entry.category || '',
    meaning       : entry.meaning || '',
    example       : entry.example || '',
    image         : entry.image || '',
    sourceName    : entry.sourceName || ''
  };
}
function allEntries(){
  if (entriesCache) return entriesCache;
  const map = new Map();
  baseEntries.forEach(e   => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  customEntries.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  entriesCache = [...map.values()];
  entriesById = new Map(entriesCache.map(e => [e.id, e]));
  entriesCache.forEach(entrySearchParts);
  return entriesCache;
}
function invalidateEntryCache(){
  entriesCache = null;
  entriesById = null;
  sortedCache = null;
}
function getEntryById(id){
  allEntries();
  return entriesById ? entriesById.get(id) : null;
}
function contentKey(entry){
  return [
    searchText(entry.headword),
    searchText(entry.translation),
    normalizeLanguage(entry.sourceLanguage),
    normalizeLanguage(entry.targetLanguage)
  ].join('|');
}
function dedupeEntries(entries){
  const byId = new Map(), contentToId = new Map();
  entries.forEach(entry => {
    const key = contentKey(entry);
    const id  = entry.id || 'content:' + key;
    const existingId = contentToId.get(key);
    if (existingId){ byId.set(existingId, entry); return; }
    contentToId.set(key, id);
    byId.set(id, entry);
  });
  return [...byId.values()];
}
function entrySummary(entry){ return entry.translation || entry.meaning || entry.example || ''; }
function sortEntries(items){ return items.sort((a,b) => collator.compare(a.headword||'', b.headword||'')); }
function sortedEntries(){
  if (!sortedCache) sortedCache = sortEntries([...allEntries()]);
  return sortedCache;
}
function entrySearchParts(entry){
  if (!entry || typeof entry !== 'object') return { headword:'', translation:'' };
  const cached = searchCache.get(entry);
  if (cached) return cached;
  const parts = {
    headword: searchText(entry.headword),
    translation: searchText(entry.translation)
  };
  searchCache.set(entry, parts);
  return parts;
}
function entryInfoScore(entry){
  const fields = ['headword','translation','pronunciation','category','meaning','example','image','sourceName','sourceLanguage','targetLanguage'];
  return fields.reduce((score, field) => {
    const value = String(entry && entry[field] || '').trim();
    return value ? score + 10 + Math.min(value.length, 1000) : score;
  }, 0);
}
// Trả về mốc thời gian (ms) mục từ được thêm, dựa trên id dạng u_<base36 timestamp>_<random>.
// Mục từ gốc (không có id kiểu này, vd. từ điển có sẵn) coi như cũ nhất (0).
function entryTimestamp(entry){
  const id = String(entry && entry.id || '');
  if (id.startsWith('u_')){
    const t = parseInt(id.split('_')[1], 36);
    if (!isNaN(t)) return t;
  }
  return 0;
}
function rank(entry, q){
  const { headword:h, translation:t } = entrySearchParts(entry);
  if (h===q) return 0; if (t===q) return 1;
  if (h.startsWith(q)) return 2; if (t.startsWith(q)) return 3;
  if (h.includes(q))   return 4; if (t.includes(q))   return 5;
  return 99;
}

// ============================================================
// RENDER
// ============================================================
function applySearch(){
  const q    = searchText($('query').value);
  const lang = $('languageFilter').value;
  let items  = q ? allEntries() : sortedEntries();
  if (lang && lang !== 'Tất cả') items = items.filter(e => e.sourceLanguage===lang || e.targetLanguage===lang);
  if (q){
    items = items
      .filter(e => {
        const parts = entrySearchParts(e);
        return parts.headword.includes(q) || parts.translation.includes(q);
      })
      .sort((a,b) => rank(a,q)-rank(b,q) || collator.compare(a.headword||'',b.headword||''));
  } else if (lang && lang !== 'Tất cả') {
    items = sortEntries(items);
  }
  visibleEntries = items;
  page = Math.min(page, Math.max(0, Math.ceil(items.length/PAGE_SIZE)-1));
  const firstVisible = visibleEntries[page*PAGE_SIZE];
  selectedId = firstVisible ? firstVisible.id : '';
  renderList();
  if (firstVisible) selectEntry(firstVisible.id, false);
  else newEntry();
}
function renderList(){
  $('count').textContent = visibleEntries.length + ' mục từ';
  const start = page * PAGE_SIZE;
  const rows  = visibleEntries.slice(start, start+PAGE_SIZE);
  const html  = rows.map(e => {
    const active = e.id===selectedId ? ' active' : '';
    const img = e.image
      ? `<img class="thumb" src="${escapeAttr(e.image)}" alt="">`
      : '<div class="thumb empty">Ảnh</div>';
    return `<article class="card${active}" data-id="${escapeAttr(e.id)}">${img}<div><div class="term">${escapeHtml(e.headword)}</div><div class="translation">${escapeHtml(entrySummary(e))}</div></div></article>`;
  }).join('');
  $('list').innerHTML = html || '<p class="empty-note">Chưa có mục phù hợp.</p>';
  $('firstBtn').disabled = $('prevBtn').disabled = page<=0;
  $('nextBtn').disabled  = $('lastBtn').disabled  = start+PAGE_SIZE >= visibleEntries.length;
}
function fillLanguages(){
  ['languageFilter','sourceLanguage','targetLanguage'].forEach(id => {
    $(id).innerHTML = LANGS
      .filter(l => id==='languageFilter' || l!=='Tất cả')
      .map(l => `<option value="${l}">${l}</option>`).join('');
  });
  $('sourceLanguage').value = 'Vietnamese';
  $('targetLanguage').value = 'English';
}
function selectEntry(id, shouldRender = true){
  const entry = getEntryById(id);
  if (!entry) return;
  selectedId = id;
  $('formTitle').textContent    = 'Sửa mục từ';
  $('id').value                 = entry.id;
  $('headword').value           = entry.headword || '';
  $('translation').value        = entry.translation || '';
  $('sourceLanguage').value     = normalizeLanguage(entry.sourceLanguage);
  $('targetLanguage').value     = normalizeLanguage(entry.targetLanguage);
  $('pronunciation').value      = entry.pronunciation || '';
  $('category').value           = entry.category || '';
  $('meaning').value            = entry.meaning || '';
  $('example').value            = entry.example || '';
  currentImage = entry.image || '';
  showImage(currentImage);
  if (shouldRender) renderList();
}
function newEntry(){
  selectedId   = '';
  currentImage = '';
  $('formTitle').textContent = 'Thêm mục từ';
  $('entryForm').reset();
  $('id').value             = '';
  $('sourceLanguage').value = 'Vietnamese';
  $('targetLanguage').value = 'English';
  showImage('');
}
function formEntry(){
  return cleanEntry({
    id            : $('id').value || makeId(),
    headword      : $('headword').value.trim(),
    translation   : $('translation').value.trim(),
    sourceLanguage: $('sourceLanguage').value,
    targetLanguage: $('targetLanguage').value,
    pronunciation : $('pronunciation').value.trim(),
    category      : $('category').value.trim(),
    meaning       : $('meaning').value.trim(),
    example       : $('example').value.trim(),
    image         : currentImage,
    sourceName    : $('id').value ? 'Tự sửa trên web' : 'Tự thêm trên web'
  });
}

// ============================================================
// CRUD — lưu lên Drive
// ============================================================
async function saveEntry(event){
  event.preventDefault();
  const entry = formEntry();
  if (!entry.headword) return toast('Bạn cần nhập từ / cụm từ gốc.');
  const idx = customEntries.findIndex(e => e.id===entry.id);
  if (idx>=0) customEntries[idx] = entry;
  else customEntries.unshift(entry);
  deletedIds.delete(entry.id);
  invalidateEntryCache();
  selectedId = entry.id;
  page = 0;
  applySearch();
  toast('Đang lưu lên Google Drive...');
  try {
    await saveToDrive();
    toast('Đã lưu mục từ lên Google Drive ✓');
  } catch(err){
    toast('Lưu Drive thất bại: ' + err.message);
  }
}
async function deleteEntry(){
  const id = $('id').value;
  if (!id) return;
  if (!confirm('Xóa mục từ này?')) return;
  deletedIds.add(id);
  customEntries = customEntries.filter(e => e.id!==id);
  selectedId = '';
  invalidateEntryCache();
  applySearch();
  toast('Đang lưu lên Google Drive...');
  try {
    await saveToDrive();
    toast('Đã xóa mục từ ✓');
  } catch(err){
    toast('Lưu Drive thất bại: ' + err.message);
  }
}
async function removeDuplicates(){
  const bestByHeadword = new Map(), remove = new Set();
  allEntries().forEach(e => {
    const key = searchText(e.headword);
    if (!key) return;
    const current = bestByHeadword.get(key);
    if (!current) {
      bestByHeadword.set(key, e);
      return;
    }
    const keep = (() => {
      const tE = entryTimestamp(e), tC = entryTimestamp(current);
      if (tE !== tC) return tE > tC ? e : current;               // ưu tiên mục nhập vào sau (mới hơn)
      return entryInfoScore(e) > entryInfoScore(current) ? e : current; // bằng thời gian: giữ mục đầy đủ thông tin hơn
    })();
    const drop = keep === e ? current : e;
    bestByHeadword.set(key, keep);
    remove.add(drop.id);
  });
  if (!remove.size) return toast('Không tìm thấy mục trùng theo từ/cụm từ gốc.');
  remove.forEach(id => deletedIds.add(id));
  customEntries = customEntries.filter(e => !remove.has(e.id));
  if (remove.has(selectedId)) selectedId = '';
  invalidateEntryCache();
  applySearch();
  toast('Đang lưu lên Google Drive...');
  try {
    await saveToDrive();
    toast(`Đã xóa ${remove.size} mục trùng theo từ/cụm từ gốc ✓`);
  } catch(err){
    toast('Lưu Drive thất bại: ' + err.message);
  }
}

async function deleteAllEntries(){
  const q      = searchText($('query').value);
  const lang   = $('languageFilter').value;
  const filtered = (q || (lang && lang !== 'Tất cả'));
  const target = filtered ? visibleEntries : allEntries();
  if (!target.length) return toast('Không có mục từ nào để xóa.');

  const scopeMsg = filtered
    ? `Xóa ${target.length} mục từ đang hiển thị theo bộ lọc/tìm kiếm hiện tại (Ngôn ngữ: ${lang && lang!=='Tất cả' ? lang : 'Tất cả'}${q ? `, từ khóa: "${$('query').value.trim()}"` : ''})? Không thể hoàn tác.`
    : `Xóa TẤT CẢ ${target.length} mục từ trong toàn bộ từ điển (không có bộ lọc nào đang áp dụng)? Không thể hoàn tác.`;
  if (!confirm(scopeMsg)) return;

  target.forEach(e => deletedIds.add(e.id));
  const removeIds = new Set(target.map(e => e.id));
  customEntries = customEntries.filter(e => !removeIds.has(e.id));
  if (removeIds.has(selectedId)) selectedId = '';
  invalidateEntryCache();
  applySearch();
  toast('Đang lưu lên Google Drive...');
  try {
    await saveToDrive();
    toast(`Đã xóa ${target.length} mục từ ✓`);
  } catch(err){
    toast('Lưu Drive thất bại: ' + err.message);
  }
}

// ============================================================
// EXPORT / IMPORT JSON
// ============================================================
function exportJson(){
  const data = { entries: allEntries(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'tu-dien-ca-nhan.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importJson(files){
  if (!files || !files.length) return toast('Bạn chưa chọn file JSON.');
  const importBtn   = $('importBtn');
  const importInput = $('importFile');
  if (importBtn){ importBtn.setAttribute('aria-disabled','true'); importBtn.style.pointerEvents='none'; }

  let added = 0, updated = 0;
  const backupCustom  = [...customEntries];
  const backupDeleted = new Set(deletedIds);
  try {
    const customById = new Map(customEntries.map((e, i) => [e.id, i]));
    const customByContent = new Map(customEntries.map((e, i) => [contentKey(e), i]));
    toast(`Đang nhập ${files.length} file JSON...`);
    for (const file of files){
      const text = await file.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(`${file.name}: file JSON bị lỗi định dạng.`); }
      const rows = Array.isArray(data) ? data : (data.entries || []);
      if (!Array.isArray(rows)) throw new Error(`${file.name}: không tìm thấy mảng entries.`);
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH){
        const batch = rows.slice(i, i + BATCH);
        for (const raw of batch){
          const entry = cleanEntry({ ...raw, sourceName: raw.sourceName || file.name });
          const key = contentKey(entry);
          const idx = customById.has(entry.id) ? customById.get(entry.id) : customByContent.get(key);
          if (idx !== undefined){
            customEntries[idx] = { ...customEntries[idx], ...entry };
            customById.set(customEntries[idx].id, idx);
            customByContent.set(contentKey(customEntries[idx]), idx);
            updated++;
          } else {
            customEntries.push(entry);
            const newIdx = customEntries.length - 1;
            customById.set(entry.id, newIdx);
            customByContent.set(key, newIdx);
            added++;
          }
          deletedIds.delete(entry.id);
        }
        await new Promise(r => setTimeout(r, 0));
        toast(`Đang nhập... ${Math.min(i + BATCH, rows.length)}/${rows.length} mục`);
      }
    }
    toast('Đang lưu lên Google Drive...');
    await saveToDrive();
    page = 0;
    invalidateEntryCache();
    applySearch();
    toast(`Đã nhập ${added} mục mới, cập nhật ${updated} mục. Đã lưu Drive ✓`);
  } catch(err){
    customEntries = backupCustom;
    deletedIds    = backupDeleted;
    invalidateEntryCache();
    toast('Không nhập được: ' + (err && err.message ? err.message : err));
  } finally {
    if (importBtn){ importBtn.removeAttribute('aria-disabled'); importBtn.style.pointerEvents=''; }
    if (importInput) importInput.value = '';
  }
}

// ============================================================
// ẢNH
// ============================================================
function compressImage(file){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Giới hạn kích thước tối đa — đủ lớn để giữ nét chữ nhỏ
      const maxW = 1200, maxH = 900;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.max(1, Math.round(img.width  * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // Bật image smoothing chất lượng cao khi thu nhỏ
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Thử PNG trước (giữ nét tốt hơn cho ảnh chữ/sơ đồ)
      // Nếu PNG > 600 KB thì fallback sang JPEG chất lượng cao
      const pngData = canvas.toDataURL('image/png');
      const pngBytes = Math.round((pngData.length * 3) / 4); // ước tính byte
      if (pngBytes <= 600 * 1024) {
        resolve(pngData);
      } else {
        // JPEG chất lượng cao — đủ để giữ nét, vẫn nhỏ hơn PNG
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
function showImage(src){
  const drop = $('dropZone'), prev = $('preview');
  if (src){
    prev.src = src;
    drop.style.display = 'none';
    prev.style.display = 'block';
  } else {
    prev.src = '';
    prev.style.display = 'none';
    drop.style.display = '';
  }
}
async function setImage(file){
  if (!file) return;
  currentImage = await compressImage(file);
  showImage(currentImage);
  const kb = Math.round(currentImage.length * 3 / 4 / 1024);
  toast(`Ảnh đã lưu (${kb} KB).`);
}

// ============================================================
// PHÁT ÂM
// ============================================================
function speak(text, lang){
  const value = String(text||'').trim();
  if (!value) return toast('Chưa có nội dung để phát âm.');
  if (!('speechSynthesis' in window)) return toast('Trình duyệt chưa hỗ trợ phát âm.');
  const utter = new SpeechSynthesisUtterance(value);
  utter.lang  = LANG_BCP47[lang] || 'vi-VN';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ============================================================
// ESCAPE
// ============================================================
function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(s){ return escapeHtml(s).replace(/'/g,'&#39;'); }
function insertAtCursor(input, text){
  const start = input.selectionStart ?? input.value.length;
  const end   = input.selectionEnd   ?? input.value.length;
  input.value = input.value.slice(0,start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start+text.length, start+text.length);
}

// ============================================================
// SYMBOLS PANEL & DONATE
// ============================================================
function showSymbolsPanel(){
  const panel = $('symbolsPanel'), input = $('pronunciation');
  const rect  = input.getBoundingClientRect();
  panel.hidden = false;
  const width  = Math.min(520, window.innerWidth-32);
  let left     = rect.left + window.scrollX;
  if (left+width > window.scrollX+window.innerWidth-16) left = window.scrollX+window.innerWidth-width-16;
  panel.style.width = width+'px';
  panel.style.left  = Math.max(16,left)+'px';
  panel.style.top   = (rect.bottom+window.scrollY+8)+'px';
}
function hideSymbolsPanel(){ $('symbolsPanel').hidden = true; }
function toggleDonate(){
  const panel = $('donatePanel');
  panel.hidden = !panel.hidden;
  $('donateBtn').setAttribute('aria-expanded', String(!panel.hidden));
}

// ============================================================
// BIND EVENTS
// ============================================================
function bind(){
  $('searchBtn').onclick       = () => { page=0; applySearch(); };
  $('query').addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); page=0; applySearch(); } });
  $('query').addEventListener('input', () => {
    if (!$('query').value.trim()) {
      page = 0;
      applySearch();
    }
  });
  $('languageFilter').onchange = () => { page=0; applySearch(); };
  $('list').onclick = e => { const card=e.target.closest('.card'); if(card) selectEntry(card.dataset.id); };
  $('firstBtn').onclick = () => { page=0; renderList(); };
  $('prevBtn').onclick  = () => { page=Math.max(0,page-1); renderList(); };
  $('nextBtn').onclick  = () => { page+=1; renderList(); };
  $('lastBtn').onclick  = () => { page=Math.max(0,Math.ceil(visibleEntries.length/PAGE_SIZE)-1); renderList(); };
  $('newBtn').onclick     = newEntry;
  $('entryForm').onsubmit = saveEntry;
  $('deleteBtn').onclick  = deleteEntry;
  $('deleteAllBtn').onclick = deleteAllEntries;
  $('dedupeBtn').onclick  = removeDuplicates;
  $('exportBtn').onclick  = exportJson;

  $('driveBtn').onclick = async () => {
    try {
      await gSignIn();
      toast('Đang tải dữ liệu từ Drive...');
      const driveEntries = await loadFromDrive();
      customEntries = driveEntries.map(cleanEntry);
      invalidateEntryCache();
      applySearch();
      toast(`Đã kết nối Drive, tải ${customEntries.length} mục ✓`);
    } catch(err){
      toast('Kết nối thất bại: ' + err.message);
    }
  };

  function openImportPicker(){
    const btn   = $('importBtn');
    const input = $('importFile');
    if (!input) return toast('Không tìm thấy ô chọn file JSON.');
    if (btn && btn.getAttribute('aria-disabled')==='true') return;
    input.click();
  }
  $('importBtn').addEventListener('click', openImportPicker);
  $('importBtn').addEventListener('keydown', e => {
    if (e.key==='Enter'||e.key===' '){ e.preventDefault(); openImportPicker(); }
  });
  $('importFile').addEventListener('click', e => { e.target.value=''; });
  $('importFile').addEventListener('change', e => {
    const files = [...e.target.files];
    if (!files.length) return toast('Bạn chưa chọn file JSON.');
    importJson(files);
  });

  $('imageFile').onchange    = e => setImage(e.target.files[0]);
  $('dropZone').ondragover   = e => { e.preventDefault(); $('dropZone').classList.add('drag'); };
  $('dropZone').ondragleave  = ()  => $('dropZone').classList.remove('drag');
  $('dropZone').ondrop       = e => { e.preventDefault(); $('dropZone').classList.remove('drag'); setImage(e.dataTransfer.files[0]); };
  $('speakHeadBtn').onclick  = () => speak($('headword').value, $('sourceLanguage').value);
  $('speakTransBtn').onclick = () => speak($('translation').value, $('targetLanguage').value);
  $('donateBtn').onclick     = toggleDonate;
  $('momoBtn').onclick       = () => { $('qrBox').hidden = !$('qrBox').hidden; };

  const symbols = 'ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ ə ɜ ʌ æ ɑ ɒ ɔ ʊ ɪ ʃ ʒ θ ð ŋ ɲ ˈ ˌ ː ˧ ˨ ˩ ˦ ˥'.split(' ');
  $('symbolsPanel').innerHTML = symbols.map(s=>`<button type="button">${s}</button>`).join('');
  $('pronunciation').addEventListener('focus', showSymbolsPanel);
  $('pronunciation').addEventListener('click', showSymbolsPanel);
  $('symbolsBtn').onclick   = () => { $('symbolsPanel').hidden ? showSymbolsPanel() : hideSymbolsPanel(); };
  $('symbolsPanel').onclick = e => { if(e.target.tagName==='BUTTON') insertAtCursor($('pronunciation'), e.target.textContent); };
  document.addEventListener('click', e => {
    if (!e.target.closest('#symbolsPanel') && !e.target.closest('#symbolsBtn') && e.target!==$('pronunciation')) hideSymbolsPanel();
    if (!e.target.closest('#donatePanel') && e.target!==$('donateBtn')){
      $('donatePanel').hidden = true;
      $('donateBtn').setAttribute('aria-expanded','false');
    }
  });
  window.addEventListener('resize', () => { if(!$('symbolsPanel').hidden) showSymbolsPanel(); });
}

// ============================================================
// KHỞI ĐỘNG
// ============================================================
const PERSONAL_DATA_URL = './data/personal_dictionary_data.json';

async function init(){
  fillLanguages();
  bind();

  const loaded = [];

  try { loaded.push(...await loadDictionaryFile(DATA_URL)); }
  catch { toast('Không tải được dữ liệu gốc. Vẫn có thể nhập JSON hoặc thêm từ mới.'); }

  try {
    const personal = await loadDictionaryFile(PERSONAL_DATA_URL);
    if (personal.length) loaded.push(...personal);
  } catch {
    // File chưa có hoặc trống, bỏ qua
  }

  baseEntries = dedupeEntries(loaded);
  invalidateEntryCache();
  if (baseEntries.length) toast('Đã tải ' + baseEntries.length + ' mục từ.');

  applySearch();
}

window.addEventListener('load', () => {
  if (window.google && window.google.accounts) { init(); }
  else { setTimeout(init, 1500); }
});
