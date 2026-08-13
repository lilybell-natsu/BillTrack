// カテゴリ定義
const CATEGORIES = {
  document: { label: '契約書・書類', icon: 'ti-file-text', color: 'warning' },
  warranty: { label: '保証書+取説', icon: 'ti-tools', color: 'danger' },
  utility: { label: '公共料金', icon: 'ti-bolt', color: 'accent' },
};

const UTILITY_TYPES = {
  electricity: { label: '電気', icon: 'ti-bolt', unit: 'kWh' },
  gas: { label: 'ガス', icon: 'ti-flame', unit: 'm3' },
  water: { label: '水道', icon: 'ti-droplet', unit: 'm3' },
};

let currentFilter = 'all';
let currentUtilityType = 'electricity';
let pendingFiles = []; // 追加フォームで選択中のファイル { name, mimeType, blob }
let activeItemId = null;

// ---------- 画面遷移 ----------

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function setActiveTab(name) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const btn = document.getElementById('tabbtn-' + name);
  if (btn) btn.classList.add('active');
}

async function goHome() {
  showScreen('screen-home');
  setActiveTab('home');
  await renderHome();
}

function goSettings() {
  showScreen('screen-settings');
  setActiveTab('settings');
  renderSettings();
}

function openAdd(presetCategory) {
  pendingFiles = [];
  document.getElementById('f-file-list').innerHTML = '';
  document.getElementById('f-name').value = '';
  document.getElementById('f-store').value = '';
  document.getElementById('f-date').value = '';
  document.getElementById('f-due').value = '';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-amount-month').value = '';
  document.getElementById('f-usage').value = '';
  document.getElementById('f-usage-period-start').value = '';
  document.getElementById('f-usage-period-end').value = '';
  renderAddCategoryTabs(presetCategory || 'document');
  updateAddFormFields(presetCategory || 'document');
  showScreen('screen-add');
  setActiveTab('add');
}

function openAddForUtilityType() {
  openAdd('utility');
  document.getElementById('f-amount-month').value = new Date().toISOString().slice(0, 7);
  document.getElementById('f-utility-type').value = currentUtilityType;
  updateUsageUnitLabel(currentUtilityType);
}

// ---------- 追加フォーム ----------

const addFormState = { category: 'document' };

function renderAddCategoryTabs(active) {
  addFormState.category = active;
  const wrap = document.getElementById('add-category-tabs');
  wrap.innerHTML = '';
  Object.keys(CATEGORIES).forEach(key => {
    const chip = document.createElement('div');
    chip.className = 'tab-chip' + (key === active ? ' active' : '');
    chip.textContent = CATEGORIES[key].label;
    chip.onclick = () => {
      addFormState.category = key;
      renderAddCategoryTabs(key);
      updateAddFormFields(key);
    };
    wrap.appendChild(chip);
  });
}

function updateAddFormFields(category) {
  const dateLabel = document.getElementById('f-date-label');
  const dueLabel = document.getElementById('f-due-label');
  const amountGroup = document.getElementById('f-amount-group');
  const dateGroup = document.getElementById('f-date-group');
  const dueGroup = document.getElementById('f-due-group');
  const storeGroup = document.getElementById('f-store-group');
  const filesLabel = document.getElementById('f-files-label');
  const utilityTypeGroup = document.getElementById('f-utility-type-group');
  const usageGroup = document.getElementById('f-usage-group');
  const amountMonthGroup = document.getElementById('f-amount-month-group');
  const usagePeriodGroup = document.getElementById('f-usage-period-group');

  if (category === 'document') {
    dateLabel.textContent = '契約日';
    dueLabel.textContent = '更新日(任意)';
    dateGroup.style.display = 'block';
    amountGroup.style.display = 'none';
    dueGroup.style.display = 'block';
    storeGroup.style.display = 'block';
    utilityTypeGroup.style.display = 'none';
    usageGroup.style.display = 'none';
    amountMonthGroup.style.display = 'none';
    usagePeriodGroup.style.display = 'none';
    filesLabel.textContent = '書類の写真・PDFを追加';
  } else if (category === 'warranty') {
    dateLabel.textContent = '購入日';
    dueLabel.textContent = '保証期限';
    dateGroup.style.display = 'block';
    amountGroup.style.display = 'none';
    dueGroup.style.display = 'block';
    storeGroup.style.display = 'block';
    utilityTypeGroup.style.display = 'none';
    usageGroup.style.display = 'none';
    amountMonthGroup.style.display = 'none';
    usagePeriodGroup.style.display = 'none';
    filesLabel.textContent = '保証書・取扱説明書の写真やPDFを追加(複数可)';
  } else if (category === 'utility') {
    dateGroup.style.display = 'none';
    amountGroup.style.display = 'block';
    dueGroup.style.display = 'none';
    storeGroup.style.display = 'none';
    utilityTypeGroup.style.display = 'block';
    usageGroup.style.display = 'block';
    amountMonthGroup.style.display = 'block';
    usagePeriodGroup.style.display = 'block';
    filesLabel.textContent = '請求書の写真・PDFを追加(任意)';
    updateUsageUnitLabel(document.getElementById('f-utility-type').value);
  }
}

function updateUsageUnitLabel(type) {
  const unit = (UTILITY_TYPES[type] || UTILITY_TYPES.electricity).unit;
  document.getElementById('f-usage-label').textContent = `使用量(${unit})`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('f-file-input').addEventListener('change', handleFileSelect);
  document.getElementById('f-utility-type').addEventListener('change', (e) => {
    updateUsageUnitLabel(e.target.value);
  });
});

function handleFileSelect(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    pendingFiles.push({ name: file.name, mimeType: file.type, blob: file });
  });
  renderPendingFiles();
  e.target.value = '';
}

function renderPendingFiles() {
  const list = document.getElementById('f-file-list');
  list.innerHTML = '';
  pendingFiles.forEach((f, i) => {
    const row = document.createElement('div');
    row.className = 'file-row';
    const icon = f.mimeType === 'application/pdf' ? 'ti-file-type-pdf' : 'ti-photo';
    row.innerHTML = `<i class="ti ${icon}"></i><span class="file-name">${escapeHtml(f.name)}</span>`;
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="ti ti-x"></i>';
    btn.onclick = () => { pendingFiles.splice(i, 1); renderPendingFiles(); };
    row.appendChild(btn);
    list.appendChild(row);
  });
}

async function saveItem() {
  const category = addFormState.category;
  const name = document.getElementById('f-name').value.trim();
  if (!name) {
    showToast('名前を入力してください');
    return;
  }

  const item = {
    id: db.uid(),
    category,
    name,
    store: document.getElementById('f-store').value.trim(),
    date: document.getElementById('f-date').value || null,
    dueDate: category !== 'utility' ? (document.getElementById('f-due').value || null) : null,
    createdAt: Date.now(),
  };

  if (category === 'utility') {
    const amount = parseInt(document.getElementById('f-amount').value, 10);
    const month = document.getElementById('f-amount-month').value; // YYYY-MM (type="month")
    if (!amount || !month) {
      showToast('請求金額と請求年月を入力してください');
      return;
    }
    const usageVal = document.getElementById('f-usage').value;
    item.utilityType = document.getElementById('f-utility-type').value;
    item.month = month;
    item.amount = amount;
    item.usage = usageVal !== '' ? parseFloat(usageVal) : null;
    item.usagePeriodStart = document.getElementById('f-usage-period-start').value || null;
    item.usagePeriodEnd = document.getElementById('f-usage-period-end').value || null;
  }

  await db.putItem(item);

  for (const f of pendingFiles) {
    await db.addFile(item.id, f.name, f.mimeType, f.blob);
  }

  showToast('保存しました');
  goHome();
}

// ---------- ホーム画面 ----------

function renderHomeTabs() {
  const wrap = document.getElementById('home-tabs');
  wrap.innerHTML = '';
  const all = { key: 'all', label: 'すべて' };
  [all, ...Object.keys(CATEGORIES).map(k => ({ key: k, label: CATEGORIES[k].label }))].forEach(opt => {
    const chip = document.createElement('div');
    chip.className = 'tab-chip' + (opt.key === currentFilter ? ' active' : '');
    chip.textContent = opt.label;
    chip.onclick = () => { currentFilter = opt.key; renderHome(); };
    wrap.appendChild(chip);
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - now) / 86400000);
}

function dueBadge(days) {
  if (days === null) return null;
  if (days < 0) return { text: '期限切れ', cls: 'badge-danger' };
  if (days <= 7) return { text: `あと${days}日`, cls: 'badge-danger' };
  if (days <= 30) return { text: `あと${days}日`, cls: 'badge-warning' };
  return { text: `あと${days}日`, cls: 'badge-success' };
}

async function renderHome() {
  renderHomeTabs();
  const listEl = document.getElementById('home-list');
  const summaryEl = document.getElementById('home-summary');

  let items;
  try {
    items = await db.getAllItems();
  } catch (err) {
    console.error('データの読み込みに失敗しました', err);
    summaryEl.textContent = 'データの読み込みに失敗しました';
    listEl.innerHTML = `<div class="empty-state">
      データを読み込めませんでした。<br>
      Safariの「設定 → Safari → すべてのCookieをブロック」がオンになっていないか、<br>
      プライベートブラウズモードで開いていないかご確認ください。<br><br>
      <span style="font-size:11px;color:var(--text-muted)">${escapeHtml(String(err && err.message ? err.message : err))}</span>
    </div>`;
    return;
  }

  let visible = items.filter(it => currentFilter === 'all' || it.category === currentFilter);

  // 期限が近い順 → 期限なしは後ろ
  visible.sort((a, b) => {
    const da = a.dueDate ? daysUntil(a.dueDate) : 999999;
    const db_ = b.dueDate ? daysUntil(b.dueDate) : 999999;
    return da - db_;
  });

  const soonCount = items.filter(it => it.dueDate && daysUntil(it.dueDate) <= 30 && daysUntil(it.dueDate) >= 0).length;
  summaryEl.textContent = soonCount > 0 ? `${soonCount}件の期限が近づいています` : '登録件数 ' + items.length + '件';

  listEl.innerHTML = '';

  if (visible.length === 0) {
    listEl.innerHTML = '<div class="empty-state">まだ登録がありません。<br>右下の「追加」から登録してみましょう。</div>';
    return;
  }

  // 公共料金はカテゴリごとにグラフカードを1枚、それ以外は通常カード
  const utilityTypes = new Set();
  visible.forEach(it => {
    if (it.category === 'utility') utilityTypes.add(it.utilityType || 'electricity');
  });

  visible.forEach(it => {
    if (it.category === 'utility') return; // 公共料金はまとめてカード化するので個別スキップ
    listEl.appendChild(renderItemCard(it));
  });

  if (currentFilter === 'all' || currentFilter === 'utility') {
    for (const type of utilityTypes) {
      listEl.appendChild(await renderUtilityCard(type));
    }
  }
}

function renderItemCard(it) {
  const cat = CATEGORIES[it.category];
  const days = it.dueDate ? daysUntil(it.dueDate) : null;
  const badge = dueBadge(days);

  const card = document.createElement('div');
  card.className = 'card';
  card.onclick = () => openDetail(it.id);

  const sub = badge ? `<span class="card-sub" style="color:inherit">${badge.text}</span>` : `<span class="card-sub">${it.store || '期限の登録なし'}</span>`;

  card.innerHTML = `
    <div class="card-icon badge-${badge ? badge.cls.replace('badge-', '') : cat.color}"><i class="ti ${cat.icon}"></i></div>
    <div class="card-body">
      <p class="card-title">${escapeHtml(it.name)}</p>
      ${sub}
    </div>
    <i class="ti ti-chevron-right card-chevron"></i>
  `;
  return card;
}

async function renderUtilityCard(type) {
  const items = (await db.getAllItems()).filter(it => it.category === 'utility' && (it.utilityType || 'electricity') === type);
  items.sort((a, b) => a.month.localeCompare(b.month));
  const latest = items[items.length - 1];
  const prev = items[items.length - 2];
  const info = UTILITY_TYPES[type];

  const card = document.createElement('div');
  card.className = 'card';
  card.style.flexDirection = 'column';
  card.style.alignItems = 'stretch';
  card.onclick = () => openUtility(type);

  let diffText = '登録がありません';
  if (latest && prev && prev.amount) {
    const diff = Math.round(((latest.amount - prev.amount) / prev.amount) * 100);
    diffText = `先月比 ${diff >= 0 ? '+' : ''}${diff}%`;
  } else if (latest) {
    diffText = `今月 \${latest.amount.toLocaleString()}`;
  }

  const bars = items.slice(-5).map(it => {
    const max = Math.max(...items.slice(-5).map(x => x.amount), 1);
    const h = Math.max(15, Math.round((it.amount / max) * 100));
    return `<div style="flex:1;background:var(--border-strong);border-radius:3px 3px 0 0;height:${h}%"></div>`;
  }).join('');

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;width:100%">
      <div class="card-icon badge-accent"><i class="ti ${info.icon}"></i></div>
      <div class="card-body">
        <p class="card-title">${info.label}代の推移</p>
        <p class="card-sub">${diffText}</p>
      </div>
      <i class="ti ti-chevron-right card-chevron"></i>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:44px;padding:0 4px">${bars || ''}</div>
  `;
  return card;
}

// ---------- 詳細画面 ----------

async function openDetail(id) {
  activeItemId = id;
  const item = await db.getItem(id);
  if (!item) return;
  const files = await db.getFilesForItem(id);
  const cat = CATEGORIES[item.category];

  document.getElementById('detail-title').textContent = item.category === 'document' ? '書類の詳細' : '製品詳細';

  const days = item.dueDate ? daysUntil(item.dueDate) : null;
  const badge = dueBadge(days);

  const body = document.getElementById('detail-body');
  body.innerHTML = `
    <div style="padding:8px 16px 14px;display:flex;gap:12px;align-items:center">
      <div class="card-icon badge-${cat.color}" style="width:56px;height:56px;border-radius:12px;font-size:26px">
        <i class="ti ${cat.icon}"></i>
      </div>
      <div>
        <p style="font-size:16px;font-weight:600;margin:0">${escapeHtml(item.name)}</p>
        ${item.store ? `<p class="card-sub" style="margin-top:2px">購入店・契約先: ${escapeHtml(item.store)}</p>` : ''}
      </div>
    </div>
    <div class="metric-grid">
      <div class="metric-card">
        <p class="label">${item.category === 'document' ? '契約日' : '購入日'}</p>
        <p class="value" style="font-size:15px">${item.date || '未登録'}</p>
      </div>
      ${item.dueDate ? `
      <div class="metric-card" style="${badge && badge.cls === 'badge-danger' ? 'background:var(--danger-bg)' : ''}">
        <p class="label" style="${badge && badge.cls === 'badge-danger' ? 'color:var(--danger)' : ''}">${item.category === 'document' ? '更新まで' : '保証期限まで'}</p>
        <p class="value" style="font-size:15px;${badge && badge.cls === 'badge-danger' ? 'color:var(--danger)' : ''}">${badge ? badge.text : '-'}</p>
      </div>` : '<div></div>'}
    </div>
    <p class="section-label" style="display:flex;justify-content:space-between;align-items:center;padding-right:16px">
      <span>${item.category === 'warranty' ? '保証書・取扱説明書' : '添付ファイル'}(${files.length}件)</span>
      <i class="ti ti-plus" style="color:var(--accent);cursor:pointer" onclick="addFileToItem('${item.id}')"></i>
    </p>
    <div style="padding:8px 16px 16px" id="detail-files"></div>
  `;

  const filesWrap = document.getElementById('detail-files');
  if (files.length === 0) {
    filesWrap.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">まだファイルがありません。</p>';
  } else {
    files.forEach(f => {
      const row = document.createElement('div');
      row.className = 'file-row';
      const icon = f.mimeType === 'application/pdf' ? 'ti-file-type-pdf' : 'ti-photo';
      row.innerHTML = `<i class="ti ${icon}"></i><span class="file-name">${escapeHtml(f.name)}</span>`;
      const openBtn = document.createElement('button');
      openBtn.innerHTML = '<i class="ti ti-external-link"></i>';
      openBtn.onclick = () => openFile(f);
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '<i class="ti ti-trash"></i>';
      delBtn.onclick = async () => { await db.deleteFile(f.id); openDetail(item.id); };
      row.appendChild(openBtn);
      row.appendChild(delBtn);
      filesWrap.appendChild(row);
    });
  }

  document.getElementById('detail-delete-btn').onclick = async () => {
    if (confirm('この項目を削除しますか?')) {
      await db.deleteItem(item.id);
      showToast('削除しました');
      goHome();
    }
  };

  showScreen('screen-detail');
}

function openFile(file) {
  const url = URL.createObjectURL(file.blob);
  window.open(url, '_blank');
}

function addFileToItem(itemId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.multiple = true;
  input.onchange = async () => {
    for (const file of Array.from(input.files || [])) {
      await db.addFile(itemId, file.name, file.type, file);
    }
    openDetail(itemId);
  };
  input.click();
}

// ---------- 公共料金 推移画面 ----------

function goUtilityOverview() {
  openUtility(currentUtilityType);
  setActiveTab('utility');
}

async function openUtility(type) {
  currentUtilityType = type;
  showScreen('screen-utility');
  setActiveTab('utility');

  const wrap = document.getElementById('utility-type-tabs');
  wrap.innerHTML = '';
  Object.keys(UTILITY_TYPES).forEach(key => {
    const chip = document.createElement('div');
    chip.className = 'tab-chip' + (key === type ? ' active' : '');
    chip.textContent = UTILITY_TYPES[key].label;
    chip.onclick = () => openUtility(key);
    wrap.appendChild(chip);
  });

  const items = (await db.getAllItems())
    .filter(it => it.category === 'utility' && (it.utilityType || 'electricity') === type)
    .sort((a, b) => a.month.localeCompare(b.month));

  const latest = items[items.length - 1];
  const prev = items[items.length - 2];

  const metrics = document.getElementById('utility-metrics');
  const diff = (latest && prev && prev.amount) ? Math.round(((latest.amount - prev.amount) / prev.amount) * 100) : null;
  metrics.innerHTML = `
    <div class="metric-card">
      <p class="label">今月</p>
      <p class="value">${latest ? '\' + latest.amount.toLocaleString() : '-'}</p>
    </div>
    <div class="metric-card">
      <p class="label">先月比</p>
      <p class="value" style="${diff !== null && diff > 0 ? 'color:var(--danger)' : diff !== null ? 'color:var(--success)' : ''}">${diff !== null ? (diff >= 0 ? '+' : '') + diff + '%' : '-'}</p>
    </div>
  `;

  const chart = document.getElementById('utility-chart');
  const recent = items.slice(-6);
  const max = Math.max(...recent.map(x => x.amount), 1);
  chart.innerHTML = recent.map((it, i) => {
    const h = Math.max(10, Math.round((it.amount / max) * 100));
    const isLast = i === recent.length - 1;
    const [y, m] = it.month.split('-');
    return `
      <div class="bar-col">
        <span class="val">${it.amount.toLocaleString()}</span>
        <div class="bar ${isLast ? 'current' : ''}" style="height:${h}%"></div>
        <span class="month">${parseInt(m, 10)}月</span>
      </div>`;
  }).join('') || '<p style="font-size:13px;color:var(--text-muted);padding:0 16px">まだ記録がありません。</p>';

  const history = document.getElementById('utility-history');
  const unit = UTILITY_TYPES[type].unit;
  history.innerHTML = items.slice().reverse().map(it => {
    const [y, m] = it.month.split('-');
    const usageText = (it.usage !== null && it.usage !== undefined) ? `${it.usage}${unit}` : '';
    const periodText = (it.usagePeriodStart && it.usagePeriodEnd)
      ? `${formatDateShort(it.usagePeriodStart)} - ${formatDateShort(it.usagePeriodEnd)}`
      : '';
    const subText = [usageText, periodText].filter(Boolean).join(' / ');
    return `
      <div class="history-row" style="flex-direction:column;align-items:stretch;gap:2px">
        <div style="display:flex;justify-content:space-between">
          <span>${y}年${parseInt(m, 10)}月</span>
          <span style="font-weight:600">\${it.amount.toLocaleString()}</span>
        </div>
        ${subText ? `<span style="font-size:12px;color:var(--text-secondary)">${subText}</span>` : ''}
      </div>`;
  }).join('') || '<p style="font-size:13px;color:var(--text-muted);padding:8px 16px">まだ記録がありません。</p>';
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

// ---------- 設定画面 ----------

async function renderSettings() {
  const items = await db.getAllItems();
  document.getElementById('settings-count').textContent = `登録件数: ${items.length}件`;
}

async function exportData() {
  const items = await db.getAllItems();
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'money-docs-export.json';
  a.click();
}

// ---------- ユーティリティ ----------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// 初期表示
goHome().catch((err) => {
  console.error('初期化に失敗しました', err);
  const summaryEl = document.getElementById('home-summary');
  if (summaryEl) summaryEl.textContent = '読み込みに失敗しました(' + (err && err.message ? err.message : err) + ')';
});
