const DATA_URL = './data/dictionary.json';
const PERSONAL_DATA_URL = './data/personal_dictionary_data.json';
const CUSTOM_KEY = 'tdcn_custom_entries_v1';
const DELETED_KEY = 'tdcn_deleted_entries_v1';
const PAGE_SIZE = 40;
const LANGS = ['Tất cả','Anh','Việt','Trung','Thái','Nhật','Hàn','Pháp','Đức','Nga','Khác'];
const LANGUAGE_LABELS = {all:'Tất cả', 'tat ca':'Tất cả', anh:'Anh', english:'Anh', en:'Anh', viet:'Việt', vi:'Việt', vietnamese:'Việt', trung:'Trung', chinese:'Trung', zh:'Trung', thai:'Thái', th:'Thái', nhat:'Nhật', japanese:'Nhật', ja:'Nhật', han:'Hàn', korean:'Hàn', ko:'Hàn', phap:'Pháp', french:'Pháp', fr:'Pháp', duc:'Đức', german:'Đức', de:'Đức', nga:'Nga', russian:'Nga', ru:'Nga', khac:'Khác', other:'Khác' };
const $ = id => document.getElementById(id);
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
let baseEntries = [], customEntries = [], deletedIds = new Set(), visibleEntries = [], page = 0, selectedId = '';
let currentImage = '';

function normalizeLanguage(value){
  const raw = String(value || '').trim();
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return LANGUAGE_LABELS[key] || raw || 'Khác';
}
function searchText(value){ return String(value || '').toLocaleLowerCase('vi').trim(); }
function makeId(){ return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }
function toast(message){ $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => $('toast').hidden = true, 3200); }
function loadLocal(){
  try {
    customEntries = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]').map(cleanEntry);
    deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
  } catch (error) {
    customEntries = [];
    deletedIds = new Set();
    toast('Dữ liệu lưu trong trình duyệt bị lỗi, app đã bỏ qua bản lỗi.');
  }
}
function saveLocal(){
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customEntries));
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]));
  } catch (error) {
    throw new Error('Bộ nhớ trình duyệt không đủ để lưu dữ liệu này. Hãy nhập file nhỏ hơn hoặc dùng nút Xuất JSON để lưu ra file riêng.');
  }
}
async function loadDictionaryFile(url){
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
  const data = await response.json();
  return (Array.isArray(data) ? data : data.entries || []).map(cleanEntry);
}
function cleanEntry(entry){
  return {
    id: entry.id || makeId(),
    headword: entry.headword || entry.foreignTerm || entry.vietnamese || '',
    translation: entry.translation || entry.meaning || '',
    sourceLanguage: normalizeLanguage(entry.sourceLanguage || entry.language || 'Việt'),
    targetLanguage: normalizeLanguage(entry.targetLanguage || (entry.language === 'Viet' ? 'Anh' : 'Việt')),
    pronunciation: entry.pronunciation || '',
    category: entry.category || '',
    meaning: entry.meaning || '',
    example: entry.example || '',
    image: entry.image || '',
    sourceName: entry.sourceName || ''
  };
}
function allEntries(){
  const map = new Map();
  baseEntries.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  customEntries.forEach(e => { if (!deletedIds.has(e.id)) map.set(e.id, e); });
  return [...map.values()];
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
  const byId = new Map();
  const contentToId = new Map();
  entries.forEach(entry => {
    const key = contentKey(entry);
    const id = entry.id || 'content:' + key;
    const existingId = contentToId.get(key);
    if (existingId) {
      byId.set(existingId, entry);
      return;
    }
    contentToId.set(key, id);
    byId.set(id, entry);
  });
  return [...byId.values()];
}
function entrySummary(entry){ return entry.translation || entry.meaning || entry.example || ''; }
function sortEntries(items){ return items.sort((a,b) => collator.compare(a.headword || '', b.headword || '')); }
function rank(entry, q){
  const h = searchText(entry.headword), t = searchText(entry.translation);
  if (h === q) return 0;
  if (t === q) return 1;
  if (h.startsWith(q)) return 2;
  if (t.startsWith(q)) return 3;
  if (h.includes(q)) return 4;
  if (t.includes(q)) return 5;
  return 99;
}
function applySearch(){
  const q = searchText($('query').value);
  const lang = $('languageFilter').value;
  let items = allEntries();
  if (lang && lang !== 'Tất cả') items = items.filter(e => e.sourceLanguage === lang || e.targetLanguage === lang);
  if (q) {
    items = items
      .filter(e => searchText(e.headword).includes(q) || searchText(e.translation).includes(q))
      .sort((a,b) => rank(a,q) - rank(b,q) || collator.compare(a.headword || '', b.headword || ''));
  } else {
    items = sortEntries(items);
  }
  visibleEntries = items;
  page = Math.min(page, Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1));
  renderList();
  if (visibleEntries.length) selectEntry(visibleEntries[page * PAGE_SIZE].id);
  else newEntry();
}
function renderList(){
  $('count').textContent = visibleEntries.length + ' mục từ';
  const start = page * PAGE_SIZE;
  const rows = visibleEntries.slice(start, start + PAGE_SIZE);
  const html = rows.map(e => {
    const active = e.id === selectedId ? ' active' : '';
    const img = e.image ? `<img class="thumb" src="${escapeAttr(e.image)}" alt="">` : '<div class="thumb empty">Ảnh</div>';
    return `<article class="card${active}" data-id="${escapeAttr(e.id)}">${img}<div><div class="term">${escapeHtml(e.headword)}</div><div class="translation">${escapeHtml(entrySummary(e))}</div></div></article>`;
  }).join('');
  $('list').innerHTML = html || '<p class="empty-note">Chưa có mục phù hợp.</p>';
  $('firstBtn').disabled = $('prevBtn').disabled = page <= 0;
  $('nextBtn').disabled = $('lastBtn').disabled = start + PAGE_SIZE >= visibleEntries.length;
}
function fillLanguages(){
  ['languageFilter','sourceLanguage','targetLanguage'].forEach(id => {
    $(id).innerHTML = LANGS.filter(l => id === 'languageFilter' || l !== 'Tất cả').map(l => `<option value="${l}">${l}</option>`).join('');
  });
  $('sourceLanguage').value = 'Việt';
  $('targetLanguage').value = 'Anh';
}
function selectEntry(id){
  const entry = allEntries().find(e => e.id === id);
  if (!entry) return;
  selectedId = id;
  $('formTitle').textContent = 'Sửa mục từ';
  $('id').value = entry.id;
  $('headword').value = entry.headword || '';
  $('translation').value = entry.translation || '';
  $('sourceLanguage').value = normalizeLanguage(entry.sourceLanguage);
  $('targetLanguage').value = normalizeLanguage(entry.targetLanguage);
  $('pronunciation').value = entry.pronunciation || '';
  $('category').value = entry.category || '';
  $('meaning').value = entry.meaning || '';
  $('example').value = entry.example || '';
  currentImage = entry.image || '';
  $('preview').src = currentImage || '';
  renderList();
}
function newEntry(){
  selectedId = '';
  currentImage = '';
  $('formTitle').textContent = 'Thêm mục từ';
  $('entryForm').reset();
  $('id').value = '';
  $('sourceLanguage').value = 'Việt';
  $('targetLanguage').value = 'Anh';
  $('preview').removeAttribute('src');
}
function formEntry(){
  return cleanEntry({
    id: $('id').value || makeId(),
    headword: $('headword').value.trim(),
    translation: $('translation').value.trim(),
    sourceLanguage: $('sourceLanguage').value,
    targetLanguage: $('targetLanguage').value,
    pronunciation: $('pronunciation').value.trim(),
    category: $('category').value.trim(),
    meaning: $('meaning').value.trim(),
    example: $('example').value.trim(),
    image: currentImage,
    sourceName: $('id').value ? 'Tự sửa trên web' : 'Tự thêm trên web'
  });
}
function saveEntry(event){
  event.preventDefault();
  const entry = formEntry();
  if (!entry.headword) return toast('Bạn cần nhập từ / cụm từ gốc.');
  const idx = customEntries.findIndex(e => e.id === entry.id);
  if (idx >= 0) customEntries[idx] = entry;
  else customEntries.unshift(entry);
  deletedIds.delete(entry.id);
  saveLocal();
  selectedId = entry.id;
  applySearch();
  toast('Đã lưu mục từ.');
}
function deleteEntry(){
  const id = $('id').value;
  if (!id) return;
  if (!confirm('Xóa mục từ này?')) return;
  deletedIds.add(id);
  customEntries = customEntries.filter(e => e.id !== id);
  saveLocal();
  selectedId = '';
  applySearch();
  toast('Đã xóa mục từ.');
}
function removeDuplicates(){
  const seen = new Map(), remove = [];
  allEntries().forEach(e => {
    const key = `${searchText(e.headword)}|${searchText(e.translation)}|${e.sourceLanguage}|${e.targetLanguage}`;
    if (seen.has(key)) remove.push(e.id);
    else seen.set(key, e.id);
  });
  remove.forEach(id => deletedIds.add(id));
  saveLocal();
  applySearch();
  toast(`Đã xóa ${remove.length} mục trùng.`);
}
function exportJson(){
  const data = { entries: allEntries(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tu-dien-ca-nhan.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function importJson(files){
  if (!files || !files.length) return toast('Bạn chưa chọn file JSON.');
  const importBtn = $('importBtn');
  const importInput = $('importFile');
  if (importBtn) {
    importBtn.setAttribute('aria-disabled', 'true');
    importBtn.style.pointerEvents = 'none';
  }
  let added = 0, updated = 0;
  try {
    toast(`Đang nhập ${files.length} file JSON...`);
    for (const file of files) {
      const text = await file.text();
      const data = JSON.parse(text);
      const rows = Array.isArray(data) ? data : (data.entries || []);
      if (!Array.isArray(rows)) throw new Error(`${file.name}: định dạng JSON không có mảng entries.`);
      for (const raw of rows) {
        const entry = cleanEntry({ ...raw, sourceName: raw.sourceName || file.name });
        const idx = customEntries.findIndex(e => e.id === entry.id || contentKey(e) === contentKey(entry));
        if (idx >= 0) {
          customEntries[idx] = { ...customEntries[idx], ...entry };
          updated += 1;
        } else {
          customEntries.unshift(entry);
          added += 1;
        }
        deletedIds.delete(entry.id);
      }
    }
    saveLocal();
    page = 0;
    applySearch();
    toast(`Đã nhập ${added} mục mới, cập nhật ${updated} mục.`);
  } catch (error) {
    toast('Không nhập được file: ' + (error && error.message ? error.message : error));
  } finally {
    if (importBtn) {
      importBtn.removeAttribute('aria-disabled');
      importBtn.style.pointerEvents = '';
    }
    if (importInput) importInput.value = '';
  }
}
function compressImage(file){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 420, maxH = 280, ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
async function setImage(file){
  if (!file) return;
  currentImage = await compressImage(file);
  $('preview').src = currentImage;
  toast('Ảnh đã được nén trước khi lưu.');
}
function speak(text, lang){
  const value = String(text || '').trim();
  if (!value) return toast('Chưa có nội dung để phát âm.');
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return toast('Trình duyệt này chưa hỗ trợ phát âm.');
  const utter = new SpeechSynthesisUtterance(value);
  const map = { 'Việt':'vi-VN', 'Anh':'en-US', 'Thái':'th-TH', 'Trung':'zh-CN', 'Nhật':'ja-JP', 'Hàn':'ko-KR', 'Pháp':'fr-FR', 'Đức':'de-DE', 'Nga':'ru-RU' };
  utter.lang = map[lang] || 'vi-VN';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
function escapeHtml(s){ return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(s){ return escapeHtml(s).replace(/'/g, '&#39;'); }
function insertAtCursor(input, text){
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + text.length, start + text.length);
}
function showSymbolsPanel(){
  const panel = $('symbolsPanel');
  const input = $('pronunciation');
  const rect = input.getBoundingClientRect();
  panel.hidden = false;
  const width = Math.min(520, window.innerWidth - 32);
  let left = rect.left + window.scrollX;
  if (left + width > window.scrollX + window.innerWidth - 16) left = window.scrollX + window.innerWidth - width - 16;
  panel.style.width = width + 'px';
  panel.style.left = Math.max(16, left) + 'px';
  panel.style.top = (rect.bottom + window.scrollY + 8) + 'px';
}
function hideSymbolsPanel(){ $('symbolsPanel').hidden = true; }
function toggleDonate(){
  const panel = $('donatePanel');
  panel.hidden = !panel.hidden;
  $('donateBtn').setAttribute('aria-expanded', String(!panel.hidden));
}
function bind(){
  $('searchBtn').onclick = () => { page = 0; applySearch(); };
  $('query').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); page = 0; applySearch(); } });
  $('languageFilter').onchange = () => { page = 0; applySearch(); };
  $('list').onclick = e => { const card = e.target.closest('.card'); if (card) selectEntry(card.dataset.id); };
  $('firstBtn').onclick = () => { page = 0; renderList(); };
  $('prevBtn').onclick = () => { page = Math.max(0, page - 1); renderList(); };
  $('nextBtn').onclick = () => { page += 1; renderList(); };
  $('lastBtn').onclick = () => { page = Math.max(0, Math.ceil(visibleEntries.length / PAGE_SIZE) - 1); renderList(); };
  $('newBtn').onclick = newEntry;
  $('entryForm').onsubmit = saveEntry;
  $('deleteBtn').onclick = deleteEntry;
  $('dedupeBtn').onclick = removeDuplicates;
  $('exportBtn').onclick = exportJson;
  $('importBtn').addEventListener('click', e => {
    e.preventDefault();
    if ($('importBtn').getAttribute('aria-disabled') === 'true') return;
    $('importFile').click();
  });

  $('importFile').onchange = e => importJson([...e.target.files]);
  $('imageFile').onchange = e => setImage(e.target.files[0]);
  $('dropZone').ondragover = e => { e.preventDefault(); $('dropZone').classList.add('drag'); };
  $('dropZone').ondragleave = () => $('dropZone').classList.remove('drag');
  $('dropZone').ondrop = e => { e.preventDefault(); $('dropZone').classList.remove('drag'); setImage(e.dataTransfer.files[0]); };
  $('speakHeadBtn').onclick = () => speak($('headword').value, $('sourceLanguage').value);
  $('speakTransBtn').onclick = () => speak($('translation').value, $('targetLanguage').value);
  $('donateBtn').onclick = toggleDonate;
  $('momoBtn').onclick = () => { $('qrBox').hidden = !$('qrBox').hidden; };

  const symbols = 'ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ ə ɜ ʌ æ ɑ ɒ ɔ ʊ ɪ ʃ ʒ θ ð ŋ ɲ ˈ ˌ ː ˧ ˨ ˩ ˦ ˥'.split(' ');
  $('symbolsPanel').innerHTML = symbols.map(s => `<button type="button">${s}</button>`).join('');
  $('pronunciation').addEventListener('focus', showSymbolsPanel);
  $('pronunciation').addEventListener('click', showSymbolsPanel);
  $('symbolsBtn').onclick = () => { $('symbolsPanel').hidden ? showSymbolsPanel() : hideSymbolsPanel(); };
  $('symbolsPanel').onclick = e => {
    if (e.target.tagName === 'BUTTON') insertAtCursor($('pronunciation'), e.target.textContent);
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('#symbolsPanel') && !e.target.closest('#symbolsBtn') && e.target !== $('pronunciation')) hideSymbolsPanel();
    if (!e.target.closest('#donatePanel') && e.target !== $('donateBtn')) {
      $('donatePanel').hidden = true;
      $('donateBtn').setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', () => { if (!$('symbolsPanel').hidden) showSymbolsPanel(); });
}
async function init(){
  fillLanguages();
  bind();
  loadLocal();
  const loaded = [];
  try {
    loaded.push(...await loadDictionaryFile(DATA_URL));
  } catch (error) {
    toast('Không tải được dữ liệu gốc. Vẫn có thể nhập JSON hoặc thêm từ mới.');
  }
  try {
    loaded.push(...await loadDictionaryFile(PERSONAL_DATA_URL));
  } catch (error) {
    // File này có thể trống hoặc chưa có trên bản cũ, nên không cần báo lỗi.
  }
  baseEntries = dedupeEntries(loaded);
  if (baseEntries.length) toast(`Đã tải ${baseEntries.length} mục từ.`);
  applySearch();
}
init();





