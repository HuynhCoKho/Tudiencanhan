const DATA_URL = './data/dictionary.json';
const PERSONAL_DATA_URL = './data/personal_dictionary_data.json';
const CUSTOM_KEY = 'tdcn_custom_entries_v1';
const DELETED_KEY = 'tdcn_deleted_entries_v1';
const PAGE_SIZE = 40;
const LANGS = ['Tất cả', 'Anh', 'Việt', 'Trung', 'Thái', 'Nhật', 'Hàn', 'Pháp', 'Đức', 'Nga', 'Khác'];
const LANGUAGE_LABELS = {
  all: 'Tất cả',
  'tat ca': 'Tất cả',
  anh: 'Anh', english: 'Anh', en: 'Anh',
  viet: 'Việt', vi: 'Việt', vietnamese: 'Việt',
  trung: 'Trung', chinese: 'Trung', zh: 'Trung',
  thai: 'Thái', th: 'Thái',
  nhat: 'Nhật', japanese: 'Nhật', ja: 'Nhật',
  han: 'Hàn', korean: 'Hàn', ko: 'Hàn',
  phap: 'Pháp', french: 'Pháp', fr: 'Pháp',
  duc: 'Đức', german: 'Đức', de: 'Đức',
  nga: 'Nga', russian: 'Nga', ru: 'Nga',
  khac: 'Khác', other: 'Khác'
};

const $ = id => document.getElementById(id);
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
let baseEntries = [];
let customEntries = [];
let deletedIds = new Set();
let visibleEntries = [];
let page = 0;
let selectedId = '';
let currentImage = '';
let lastSearchSignature = '';

function normalizeLanguage(value) {
  const raw = String(value || '').trim();
  const key = raw.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return LANGUAGE_LABELS[key] || raw || 'Khác';
}

function searchText(value) {
  return String(value || '').toLocaleLowerCase('vi').trim();
}

function makeId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toast(message) {
  const status = $('status');
  if (status) status.textContent = message || '';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function loadLocal() {
  try {
    customEntries = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]').map(cleanEntry);
  } catch (error) {
    customEntries = [];
  }
  try {
    deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
  } catch (error) {
    deletedIds = new Set();
  }
}

function saveLocal() {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customEntries));
  localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]));
}

function cleanEntry(entry) {
  const sourceLanguage = normalizeLanguage(entry.sourceLanguage || entry.sourceLang || entry.language || entry.lang || 'Việt');
  const targetLanguage = normalizeLanguage(entry.targetLanguage || entry.targetLang || (sourceLanguage === 'Việt' ? 'Anh' : 'Việt'));
  const headword = entry.headword || entry.term || entry.word || entry.sourceText || entry.vietnamese || entry.source || '';
  const translation = entry.translation || entry.targetText || entry.foreignTerm || entry.meaningShort || entry.definition || entry.meaning || entry.target || '';
  return {
    id: String(entry.id || makeId()),
    headword: String(headword || '').trim(),
    translation: String(translation || '').trim(),
    sourceLanguage,
    targetLanguage,
    pronunciation: String(entry.pronunciation || entry.ipa || entry.pinyin || '').trim(),
    category: String(entry.category || entry.topic || entry.domain || '').trim(),
    meaning: String(entry.meaning || entry.note || entry.notes || '').trim(),
    example: String(entry.example || entry.examples || '').trim(),
    image: String(entry.image || entry.imageData || '').trim(),
    sourceName: String(entry.sourceName || entry.source || '').trim()
  };
}

function allEntries() {
  const byId = new Map();
  baseEntries.forEach(entry => {
    if (!deletedIds.has(entry.id)) byId.set(entry.id, entry);
  });
  customEntries.forEach(entry => {
    if (!deletedIds.has(entry.id)) byId.set(entry.id, entry);
  });
  return [...byId.values()];
}

function entrySummary(entry) {
  return entry.translation || entry.meaning || entry.example || entry.category || '';
}

function sortEntries(items) {
  return items.sort((a, b) => collator.compare(a.headword || '', b.headword || ''));
}

function rank(entry, query) {
  const head = searchText(entry.headword);
  const trans = searchText(entry.translation);
  if (head === query) return 0;
  if (trans === query) return 1;
  if (head.startsWith(query)) return 2;
  if (trans.startsWith(query)) return 3;
  if (head.includes(query)) return 4;
  if (trans.includes(query)) return 5;
  return 99;
}

function applySearch() {
  const query = searchText($('query').value);
  const language = $('language').value;
  const signature = `${query}\n${language}\n${baseEntries.length}\n${customEntries.length}\n${deletedIds.size}`;
  if (signature === lastSearchSignature) return;
  lastSearchSignature = signature;

  let entries = allEntries();
  if (language && language !== 'Tất cả') {
    entries = entries.filter(entry => entry.sourceLanguage === language || entry.targetLanguage === language);
  }
  if (query) {
    entries = entries
      .filter(entry => searchText(entry.headword).includes(query) || searchText(entry.translation).includes(query))
      .sort((a, b) => rank(a, query) - rank(b, query) || collator.compare(a.headword || '', b.headword || ''));
  } else {
    sortEntries(entries);
  }

  visibleEntries = entries;
  page = 0;
  renderList();
  if (visibleEntries.length) selectEntry(visibleEntries[0].id, false);
  else if (!selectedId) newEntry(false);
}

function renderList() {
  const list = $('entryList');
  const count = $('entryCount');
  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));
  count.textContent = `${visibleEntries.length} mục từ`;

  const start = page * PAGE_SIZE;
  const pageItems = visibleEntries.slice(start, start + PAGE_SIZE);
  if (!pageItems.length) {
    list.innerHTML = '<div class="empty">Chưa có mục phù hợp.</div>';
  } else {
    list.innerHTML = pageItems.map(entry => `
      <button class="entry-card ${entry.id === selectedId ? 'active' : ''}" type="button" data-id="${escapeAttr(entry.id)}">
        <span class="thumb">${entry.image ? `<img src="${escapeAttr(entry.image)}" alt="">` : ''}</span>
        <span class="entry-copy">
          <strong>${escapeHtml(entry.headword)}</strong>
          <small>${escapeHtml(entrySummary(entry))}</small>
        </span>
      </button>
    `).join('');
  }

  list.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => selectEntry(card.dataset.id));
  });

  $('firstBtn').disabled = page === 0;
  $('prevBtn').disabled = page === 0;
  $('nextBtn').disabled = page >= totalPages - 1;
  $('lastBtn').disabled = page >= totalPages - 1;
}

function fillLanguages() {
  ['language', 'sourceLanguage', 'targetLanguage'].forEach(id => {
    const select = $(id);
    select.innerHTML = LANGS.filter(lang => id === 'language' || lang !== 'Tất cả')
      .map(lang => `<option value="${lang}">${lang}</option>`).join('');
  });
  $('language').value = 'Tất cả';
  $('sourceLanguage').value = 'Việt';
  $('targetLanguage').value = 'Anh';
}

function selectEntry(id, rerender = true) {
  const entry = allEntries().find(item => item.id === id);
  if (!entry) return;
  selectedId = id;
  $('formTitle').textContent = 'Sửa mục từ';
  $('entryId').value = entry.id;
  $('headword').value = entry.headword || '';
  $('translation').value = entry.translation || '';
  $('sourceLanguage').value = normalizeLanguage(entry.sourceLanguage);
  $('targetLanguage').value = normalizeLanguage(entry.targetLanguage);
  $('pronunciation').value = entry.pronunciation || '';
  $('category').value = entry.category || '';
  $('meaning').value = entry.meaning || '';
  $('example').value = entry.example || '';
  currentImage = entry.image || '';
  renderImagePreview();
  if (rerender) renderList();
}

function newEntry(rerender = true) {
  selectedId = '';
  $('formTitle').textContent = 'Thêm mục từ';
  $('entryForm').reset();
  $('entryId').value = '';
  $('sourceLanguage').value = 'Việt';
  $('targetLanguage').value = 'Anh';
  currentImage = '';
  renderImagePreview();
  if (rerender) renderList();
}

function formEntry() {
  return cleanEntry({
    id: $('entryId').value || makeId(),
    headword: $('headword').value,
    translation: $('translation').value,
    sourceLanguage: $('sourceLanguage').value,
    targetLanguage: $('targetLanguage').value,
    pronunciation: $('pronunciation').value,
    category: $('category').value,
    meaning: $('meaning').value,
    example: $('example').value,
    image: currentImage
  });
}

function saveEntry(event) {
  event.preventDefault();
  const saveBtn = $('saveBtn');
  saveBtn.disabled = true;
  try {
    const entry = formEntry();
    if (!entry.headword && !entry.translation) {
      toast('Cần nhập từ gốc hoặc bản dịch.');
      return;
    }
    deletedIds.delete(entry.id);
    const index = customEntries.findIndex(item => item.id === entry.id);
    if (index >= 0) customEntries[index] = entry;
    else customEntries.unshift(entry);
    saveLocal();
    selectedId = entry.id;
    lastSearchSignature = '';
    applySearch();
    selectEntry(entry.id);
    toast('Đã lưu mục từ.');
  } finally {
    saveBtn.disabled = false;
  }
}

function deleteEntry() {
  const id = $('entryId').value;
  if (!id) return;
  if (!confirm('Xóa mục từ này?')) return;
  deletedIds.add(id);
  customEntries = customEntries.filter(entry => entry.id !== id);
  saveLocal();
  selectedId = '';
  lastSearchSignature = '';
  applySearch();
  toast('Đã xóa mục từ.');
}

function removeDuplicates() {
  const seen = new Set();
  const unique = [];
  let removed = 0;
  allEntries().forEach(entry => {
    const key = `${searchText(entry.headword)}\n${searchText(entry.translation)}\n${entry.sourceLanguage}\n${entry.targetLanguage}`;
    if (seen.has(key)) {
      deletedIds.add(entry.id);
      removed += 1;
    } else {
      seen.add(key);
      unique.push(entry);
    }
  });
  customEntries = customEntries.filter(entry => !deletedIds.has(entry.id));
  saveLocal();
  selectedId = '';
  lastSearchSignature = '';
  applySearch();
  toast(`Đã xóa ${removed} mục trùng.`);
}

function exportJson() {
  const entries = allEntries();
  const blob = new Blob([JSON.stringify({ entries }, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tu-dien-ca-nhan.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(files) {
  const incoming = [];
  for (const file of files) {
    const text = await file.text();
    const data = JSON.parse(text);
    const entries = Array.isArray(data) ? data : data.entries || [];
    incoming.push(...entries.map(cleanEntry));
  }
  const byKey = new Map(customEntries.map(entry => [entry.id, entry]));
  incoming.forEach(entry => byKey.set(entry.id || makeId(), entry));
  customEntries = [...byKey.values()];
  saveLocal();
  lastSearchSignature = '';
  applySearch();
  toast(`Đã nhập ${incoming.length} mục từ.`);
}

function renderImagePreview() {
  const preview = $('imagePreview');
  preview.innerHTML = currentImage ? `<img src="${escapeAttr(currentImage)}" alt="Ảnh minh họa">` : '<span>Kéo thả ảnh vào đây hoặc chọn file</span>';
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 520;
        const maxH = 360;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function setImage(file) {
  if (!file) return;
  currentImage = await compressImage(file);
  renderImagePreview();
  toast('Ảnh đã được nén trước khi lưu.');
}

function speak(text, language) {
  if (!text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const lang = normalizeLanguage(language);
  utterance.lang = {
    Anh: 'en-US', Việt: 'vi-VN', Trung: 'zh-CN', Thái: 'th-TH', Nhật: 'ja-JP', Hàn: 'ko-KR', Pháp: 'fr-FR', Đức: 'de-DE', Nga: 'ru-RU'
  }[lang] || 'en-US';
  speechSynthesis.speak(utterance);
}

function insertAtCursor(input, text) {
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}

function showSymbolsPanel() {
  $('symbolsPanel').hidden = false;
}

function hideSymbolsPanel() {
  $('symbolsPanel').hidden = true;
}

function toggleDonate() {
  const panel = $('donatePanel');
  panel.hidden = !panel.hidden;
  $('donateBtn').setAttribute('aria-expanded', String(!panel.hidden));
}

function bind() {
  $('searchBtn').onclick = applySearch;
  $('query').addEventListener('keydown', event => {
    if (event.key === 'Enter') applySearch();
  });
  $('language').onchange = applySearch;
  $('firstBtn').onclick = () => { page = 0; renderList(); };
  $('prevBtn').onclick = () => { page -= 1; renderList(); };
  $('nextBtn').onclick = () => { page += 1; renderList(); };
  $('lastBtn').onclick = () => { page = Math.ceil(visibleEntries.length / PAGE_SIZE) - 1; renderList(); };
  $('newBtn').onclick = () => newEntry();
  $('entryForm').addEventListener('submit', saveEntry);
  $('deleteBtn').onclick = deleteEntry;
  $('dedupeBtn').onclick = removeDuplicates;
  $('exportBtn').onclick = exportJson;
  $('importFile').onchange = event => importJson([...event.target.files]).catch(error => toast(`Không nhập được JSON: ${error.message}`));
  $('imageFile').onchange = event => setImage(event.target.files[0]).catch(error => toast(`Không đọc được ảnh: ${error.message}`));

  const drop = $('imagePreview');
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', event => {
    event.preventDefault();
    drop.classList.remove('drag');
    setImage(event.dataTransfer.files[0]).catch(error => toast(`Không đọc được ảnh: ${error.message}`));
  });

  $('speakHeadword').onclick = () => speak($('headword').value, $('sourceLanguage').value);
  $('speakTranslation').onclick = () => speak($('translation').value, $('targetLanguage').value);
  $('symbolsBtn').onclick = showSymbolsPanel;
  $('pronunciation').addEventListener('focus', showSymbolsPanel);
  $('symbolsPanel').querySelectorAll('button').forEach(button => {
    button.onclick = () => insertAtCursor($('pronunciation'), button.textContent);
  });

  $('donateBtn').onclick = toggleDonate;
  $('momoBtn').onclick = () => { $('qrBox').hidden = !$('qrBox').hidden; };
  document.addEventListener('click', event => {
    if (!event.target.closest('#symbolsPanel') && !event.target.closest('#symbolsBtn') && event.target !== $('pronunciation')) hideSymbolsPanel();
    if (!event.target.closest('.support-box')) {
      $('donatePanel').hidden = true;
      $('donateBtn').setAttribute('aria-expanded', 'false');
    }
  });
}

async function loadEntriesFromUrl(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const data = await response.json();
  return (Array.isArray(data) ? data : data.entries || []).map(cleanEntry);
}

async function init() {
  fillLanguages();
  bind();
  loadLocal();
  const loaded = [];
  for (const url of [DATA_URL, PERSONAL_DATA_URL]) {
    try {
      loaded.push(...await loadEntriesFromUrl(url));
    } catch (error) {
      // The app can still work with local entries when a data file is missing.
    }
  }
  baseEntries = loaded;
  toast(loaded.length ? `Đã tải ${loaded.length} mục từ.` : 'Chưa có dữ liệu sẵn. Bạn có thể nhập JSON hoặc thêm từ mới.');
  applySearch();
}

init();
