const DATA_URL = './data/dictionary.json';
const PERSONAL_DATA_URL = './data/personal_dictionary_data.json';
const CUSTOM_KEY = 'tdcn_custom_entries_v1';
const DELETED_KEY = 'tdcn_deleted_entries_v1';
const PAGE_SIZE = 40;
const LANGS = ['Tất cả', 'Anh', 'Việt', 'Trung', 'Thái', 'Nhật', 'Hàn', 'Pháp', 'Đức', 'Nga', 'Khác'];
const LANG_MAP = {
  all: 'Tất cả', 'tat ca': 'Tất cả',
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
const VOICE_LANG = { 'Việt': 'vi-VN', Anh: 'en-US', Trung: 'zh-CN', Thái: 'th-TH', Nhật: 'ja-JP', Hàn: 'ko-KR', Pháp: 'fr-FR', Đức: 'de-DE', Nga: 'ru-RU' };
const $ = id => document.getElementById(id);
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
let baseEntries = [];
let customEntries = [];
let deletedIds = new Set();
let visibleEntries = [];
let page = 0;
let selectedId = '';
let currentImage = '';

function stripMarks(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function normalizeLanguage(value) {
  const raw = String(value || '').trim();
  const key = stripMarks(raw).toLowerCase();
  return LANG_MAP[key] || raw || 'Khác';
}
function searchText(value) { return String(value || '').toLocaleLowerCase('vi').trim(); }
function makeId() { return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(message, ms = 3500) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
  clearTimeout(toast.timer);
  if (message && ms) toast.timer = setTimeout(() => { el.hidden = true; }, ms);
}

function cleanEntry(entry = {}) {
  const sourceLanguage = normalizeLanguage(entry.sourceLanguage || entry.sourceLang || entry.language || entry.lang || 'Việt');
  const targetLanguage = normalizeLanguage(entry.targetLanguage || entry.targetLang || (sourceLanguage === 'Việt' ? 'Anh' : 'Việt'));
  const headword = entry.headword || entry.term || entry.word || entry.sourceText || entry.foreignTerm || entry.vietnamese || entry.source || '';
  const translation = entry.translation || entry.targetText || entry.meaningShort || entry.definition || entry.meaning || entry.target || '';
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
    sourceName: String(entry.sourceName || '').trim()
  };
}
function contentKey(entry) {
  return [searchText(entry.headword), searchText(entry.translation), normalizeLanguage(entry.sourceLanguage), normalizeLanguage(entry.targetLanguage)].join('|');
}
function summary(entry) { return entry.translation || entry.meaning || entry.example || entry.category || ''; }
function sortEntries(items) { return items.sort((a, b) => collator.compare(a.headword || '', b.headword || '')); }
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

function loadLocal() {
  try { customEntries = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]').map(cleanEntry); } catch { customEntries = []; }
  try { deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')); } catch { deletedIds = new Set(); }
}
function saveLocal() {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customEntries));
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]));
  } catch (error) {
    throw new Error('Bộ nhớ trình duyệt không đủ để lưu dữ liệu này. Hãy xuất JSON để lưu trữ, rồi xóa bớt ảnh lớn hoặc mục không cần thiết.');
  }
}
function allEntries() {
  const map = new Map();
  baseEntries.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  customEntries.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  return [...map.values()];
}

function fillLanguages() {
  ['languageFilter', 'sourceLanguage', 'targetLanguage'].forEach(id => {
    const select = $(id);
    if (!select) return;
    const list = id === 'languageFilter' ? LANGS : LANGS.filter(lang => lang !== 'Tất cả');
    select.innerHTML = list.map(lang => `<option value="${lang}">${lang}</option>`).join('');
  });
  if ($('languageFilter')) $('languageFilter').value = 'Tất cả';
  if ($('sourceLanguage')) $('sourceLanguage').value = 'Việt';
  if ($('targetLanguage')) $('targetLanguage').value = 'Anh';
}

function applySearch() {
  const query = searchText($('query')?.value || '');
  const language = $('languageFilter')?.value || 'Tất cả';
  let entries = allEntries();
  if (language && language !== 'Tất cả') entries = entries.filter(e => e.sourceLanguage === language || e.targetLanguage === language);
  if (query) {
    entries = entries
      .filter(e => searchText(e.headword).includes(query) || searchText(e.translation).includes(query))
      .sort((a, b) => rank(a, query) - rank(b, query) || collator.compare(a.headword || '', b.headword || ''));
  } else {
    sortEntries(entries);
  }
  visibleEntries = entries;
  page = 0;
  renderList();
  if (visibleEntries.length) selectEntry(visibleEntries[0].id, false);
  else newEntry(false);
}

function renderList() {
  const list = $('list');
  const count = $('count');
  if (!list || !count) return;
  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));
  count.textContent = `${visibleEntries.length} mục từ`;
  const rows = visibleEntries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  list.innerHTML = rows.length ? rows.map(e => `
    <article class="card${e.id === selectedId ? ' active' : ''}" data-id="${escapeHtml(e.id)}">
      ${e.image ? `<img class="thumb" src="${escapeHtml(e.image)}" alt="">` : '<div class="thumb empty">Ảnh</div>'}
      <div><div class="term">${escapeHtml(e.headword)}</div><div class="translation">${escapeHtml(summary(e))}</div></div>
    </article>`).join('') : '<p class="empty-note">Chưa có mục phù hợp.</p>';
  const total = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE));
  if ($('firstBtn')) $('firstBtn').disabled = page <= 0;
  if ($('prevBtn')) $('prevBtn').disabled = page <= 0;
  if ($('nextBtn')) $('nextBtn').disabled = page >= total - 1;
  if ($('lastBtn')) $('lastBtn').disabled = page >= total - 1;
}

function selectEntry(id, rerender = true) {
  const entry = allEntries().find(e => e.id === id);
  if (!entry) return;
  selectedId = id;
  const set = (id, value) => { const el = $(id); if (el) el.value = value || ''; };
  if ($('formTitle')) $('formTitle').textContent = 'Sửa mục từ';
  set('id', entry.id);
  set('headword', entry.headword);
  set('translation', entry.translation);
  set('sourceLanguage', normalizeLanguage(entry.sourceLanguage));
  set('targetLanguage', normalizeLanguage(entry.targetLanguage));
  set('pronunciation', entry.pronunciation);
  set('category', entry.category);
  set('meaning', entry.meaning);
  set('example', entry.example);
  currentImage = entry.image || '';
  renderImagePreview();
  if (rerender) renderList();
}
function newEntry(rerender = true) {
  selectedId = '';
  currentImage = '';
  if ($('formTitle')) $('formTitle').textContent = 'Thêm mục từ';
  if ($('entryForm')) $('entryForm').reset();
  if ($('id')) $('id').value = '';
  if ($('sourceLanguage')) $('sourceLanguage').value = 'Việt';
  if ($('targetLanguage')) $('targetLanguage').value = 'Anh';
  renderImagePreview();
  if (rerender) renderList();
}
function formEntry() {
  return cleanEntry({
    id: $('id')?.value || makeId(),
    headword: $('headword')?.value || '',
    translation: $('translation')?.value || '',
    sourceLanguage: $('sourceLanguage')?.value || 'Việt',
    targetLanguage: $('targetLanguage')?.value || 'Anh',
    pronunciation: $('pronunciation')?.value || '',
    category: $('category')?.value || '',
    meaning: $('meaning')?.value || '',
    example: $('example')?.value || '',
    image: currentImage,
    sourceName: $('id')?.value ? 'Tự sửa trên web' : 'Tự thêm trên web'
  });
}
function saveEntry(event) {
  event.preventDefault();
  try {
    const entry = formEntry();
    if (!entry.headword && !entry.translation) return toast('Bạn cần nhập từ gốc hoặc bản dịch.');
    const index = customEntries.findIndex(e => e.id === entry.id);
    if (index >= 0) customEntries[index] = entry;
    else customEntries.unshift(entry);
    deletedIds.delete(entry.id);
    saveLocal();
    selectedId = entry.id;
    applySearch();
    selectEntry(entry.id);
    toast('Đã lưu mục từ.');
  } catch (error) {
    toast('Không lưu được mục từ: ' + (error && error.message ? error.message : error), 6000);
  }
}
function deleteEntry() {
  const id = $('id')?.value;
  if (!id) return;
  if (!confirm('Xóa mục từ này?')) return;
  try {
    deletedIds.add(id);
    customEntries = customEntries.filter(e => e.id !== id);
    saveLocal();
    selectedId = '';
    applySearch();
    toast('Đã xóa mục từ.');
  } catch (error) {
    toast('Không xóa được mục từ: ' + (error && error.message ? error.message : error), 6000);
  }
}
function removeDuplicates() {
  try {
    const seen = new Set();
    let removed = 0;
    allEntries().forEach(e => {
      const key = contentKey(e);
      if (seen.has(key)) { deletedIds.add(e.id); removed += 1; }
      else seen.add(key);
    });
    customEntries = customEntries.filter(e => !deletedIds.has(e.id));
    saveLocal();
    applySearch();
    toast(`Đã xóa ${removed} mục trùng.`);
  } catch (error) {
    toast('Không xóa trùng được: ' + (error && error.message ? error.message : error), 6000);
  }
}
function exportJson() {
  const blob = new Blob([JSON.stringify({ entries: allEntries(), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tu-dien-ca-nhan.json';
  link.click();
  URL.revokeObjectURL(url);
}
async function importJson(files) {
  if (!files || !files.length) return toast('Bạn chưa chọn file JSON.');
  const importBtn = $('importBtn');
  const input = $('importFile');
  if (importBtn) importBtn.disabled = true;
  let added = 0, updated = 0, skipped = 0;
  try {
    toast(`Đang nhập ${files.length} file JSON...`, 0);
    for (const file of files) {
      const data = JSON.parse(await file.text());
      const entries = Array.isArray(data) ? data : (Array.isArray(data.entries) ? data.entries : []);
      if (!entries.length) { skipped += 1; continue; }
      for (const raw of entries) {
        const entry = cleanEntry({ ...raw, sourceName: raw.sourceName || file.name });
        if (!entry.headword && !entry.translation) { skipped += 1; continue; }
        const key = contentKey(entry);
        const idx = customEntries.findIndex(e => e.id === entry.id || contentKey(e) === key);
        if (idx >= 0) { customEntries[idx] = { ...customEntries[idx], ...entry }; updated += 1; }
        else { customEntries.unshift(entry); added += 1; }
        deletedIds.delete(entry.id);
      }
    }
    saveLocal();
    applySearch();
    toast(`Đã nhập ${added} mục mới, cập nhật ${updated} mục${skipped ? `, bỏ qua ${skipped} mục không hợp lệ` : ''}.`, 7000);
  } catch (error) {
    toast('Không nhập được file: ' + (error && error.message ? error.message : error), 7000);
  } finally {
    if (importBtn) importBtn.disabled = false;
    if (input) input.value = '';
  }
}

function renderImagePreview() {
  const preview = $('preview');
  const drop = $('dropZone');
  if (preview) {
    if (currentImage) preview.src = currentImage;
    else preview.removeAttribute('src');
  }
  if (drop) drop.classList.toggle('has-image', Boolean(currentImage));
}
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxW = 420, maxH = 280;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
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
  const value = String(text || '').trim();
  if (!value) return toast('Chưa có nội dung để phát âm.');
  if (!('speechSynthesis' in window)) return toast('Trình duyệt này chưa hỗ trợ phát âm.');
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = VOICE_LANG[normalizeLanguage(language)] || 'en-US';
  speechSynthesis.speak(utterance);
}
function insertAtCursor(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}
function showSymbolsPanel() {
  const panel = $('symbolsPanel');
  const input = $('pronunciation');
  if (!panel || !input) return;
  const symbols = 'ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ ə ɜ ʌ æ ɑ ɒ ɔ ʊ ɪ ʃ ʒ θ ð ŋ ɲ ˈ ˌ ː ˧ ˨ ˩ ˦ ˥'.split(' ');
  if (!panel.innerHTML) panel.innerHTML = symbols.map(s => `<button type="button">${s}</button>`).join('');
  const rect = input.getBoundingClientRect();
  panel.hidden = false;
  const width = Math.min(520, window.innerWidth - 32);
  panel.style.width = width + 'px';
  panel.style.left = Math.max(16, Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - width - 16)) + 'px';
  panel.style.top = (rect.bottom + window.scrollY + 8) + 'px';
}
function hideSymbolsPanel() { if ($('symbolsPanel')) $('symbolsPanel').hidden = true; }
function toggleDonate() {
  const panel = $('donatePanel');
  const btn = $('donateBtn');
  if (!panel || !btn) return;
  panel.hidden = !panel.hidden;
  btn.setAttribute('aria-expanded', String(!panel.hidden));
}

function bind() {
  const on = (id, event, fn) => { const el = $(id); if (el) el.addEventListener(event, fn); };
  on('searchBtn', 'click', () => applySearch());
  on('query', 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applySearch(); } });
  on('languageFilter', 'change', () => applySearch());
  on('list', 'click', e => { const card = e.target.closest('.card'); if (card) selectEntry(card.dataset.id); });
  on('firstBtn', 'click', () => { page = 0; renderList(); });
  on('prevBtn', 'click', () => { page = Math.max(0, page - 1); renderList(); });
  on('nextBtn', 'click', () => { page += 1; renderList(); });
  on('lastBtn', 'click', () => { page = Math.max(0, Math.ceil(visibleEntries.length / PAGE_SIZE) - 1); renderList(); });
  on('newBtn', 'click', () => newEntry());
  on('entryForm', 'submit', saveEntry);
  on('deleteBtn', 'click', deleteEntry);
  on('dedupeBtn', 'click', removeDuplicates);
  on('exportBtn', 'click', exportJson);
  on('importBtn', 'click', () => $('importFile')?.click());
  on('importFile', 'change', e => importJson([...e.target.files]));
  on('imageFile', 'change', e => setImage(e.target.files[0]).catch(err => toast('Không đọc được ảnh: ' + err.message)));
  on('speakHeadBtn', 'click', () => speak($('headword')?.value, $('sourceLanguage')?.value));
  on('speakTransBtn', 'click', () => speak($('translation')?.value, $('targetLanguage')?.value));
  on('symbolsBtn', 'click', () => ($('symbolsPanel')?.hidden ? showSymbolsPanel() : hideSymbolsPanel()));
  on('pronunciation', 'focus', showSymbolsPanel);
  on('pronunciation', 'click', showSymbolsPanel);
  on('donateBtn', 'click', e => { e.stopPropagation(); toggleDonate(); });
  on('momoBtn', 'click', e => { e.stopPropagation(); const box = $('qrBox'); if (box) box.hidden = !box.hidden; });
  const drop = $('dropZone');
  if (drop) {
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); setImage(e.dataTransfer.files[0]); });
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#symbolsPanel button')) insertAtCursor($('pronunciation'), e.target.textContent);
    if (!e.target.closest('#symbolsPanel') && !e.target.closest('#symbolsBtn') && e.target !== $('pronunciation')) hideSymbolsPanel();
    if (!e.target.closest('#donatePanel') && e.target !== $('donateBtn')) {
      const panel = $('donatePanel');
      const btn = $('donateBtn');
      if (panel) panel.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
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
    try { loaded.push(...await loadEntriesFromUrl(url)); } catch {}
  }
  baseEntries = loaded;
  toast(loaded.length ? `Đã tải ${loaded.length} mục từ.` : 'Chưa có dữ liệu sẵn. Bạn có thể nhập JSON hoặc thêm từ mới.');
  applySearch();
}

init();
