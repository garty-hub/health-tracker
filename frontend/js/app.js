// 健康数据追踪助手 - 主应用

// 状态管理
const state = {
  user: getUserInfo(),
  indicators: [],
  records: [],
  currentPage: 'home',
  selectedIndicator: null,
  chartInstance: null
};

// Toast提示
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Modal弹窗
function showModal(title, message, onConfirm) {
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-body').textContent = message;
  modal.classList.add('show');

  const confirmBtn = modal.querySelector('[data-action="confirm"]');
  const cancelBtn = modal.querySelector('[data-action="cancel"]');

  const handleConfirm = () => {
    modal.classList.remove('show');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    modal.classList.remove('show');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 格式化时间
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 获取状态样式
function getStatusClass(value, normalMin, normalMax) {
  if (normalMin === null || normalMax === null) return 'status-normal';
  if (value < normalMin || value > normalMax) return 'status-danger';
  return 'status-normal';
}

// 获取状态文字
function getStatusText(value, normalMin, normalMax) {
  if (normalMin === null || normalMax === null) return '';
  if (value < normalMin) return '偏低';
  if (value > normalMax) return '偏高';
  return '正常';
}

// 指标图标映射
const indicatorIcons = {
  '血压-高压': '❤️',
  '血压-低压': '🩸',
  '总胆固醇': '🧪',
  '甘油三酯': '💧',
  '体重': '⚖️',
  '血糖': '🩺',
  '心率': '💓'
};

// 切换页面
function switchPage(pageName) {
  state.currentPage = pageName;

  // 隐藏tabBar在登录页
  const tabBar = document.getElementById('tab-bar');
  tabBar.style.display = pageName === 'login' ? 'none' : 'flex';

  // 更新tab激活状态
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // 渲染页面
  const container = document.getElementById('page-container');
  container.innerHTML = getPageHTML(pageName);

  // 初始化页面逻辑
  initPageLogic(pageName);
}

// 获取页面HTML
function getPageHTML(pageName) {
  // 未登录显示登录页
  if (!state.user && pageName !== 'login') {
    return getPageHTML('login');
  }

  const pages = {
    home: `
      <div class="page active" id="page-home">
        <div class="welcome-banner">
          <div class="welcome-text">欢迎回来</div>
          <div class="welcome-name">${state.user?.nickname || '用户'}</div>
        </div>

        <div class="quick-add">
          <button class="quick-add-btn" onclick="goToAddRecord('血压-高压')">
            <span class="quick-add-icon">❤️</span>
            <span class="quick-add-name">测血压</span>
          </button>
          <button class="quick-add-btn" onclick="goToAddRecord('体重')">
            <span class="quick-add-icon">⚖️</span>
            <span class="quick-add-name">记体重</span>
          </button>
          <button class="quick-add-btn" onclick="goToAddRecord('血糖')">
            <span class="quick-add-icon">🩺</span>
            <span class="quick-add-name">测血糖</span>
          </button>
          <button class="quick-add-btn" onclick="goToAddRecord('心率')">
            <span class="quick-add-icon">💓</span>
            <span class="quick-add-name">安心率</span>
          </button>
        </div>

        <div class="today-summary">
          <div class="section-title">📅 最近记录</div>
          <div class="card" id="recent-records">
            <div class="loading">
              <div class="spinner"></div>
              <div class="loading-text">加载中...</div>
            </div>
          </div>
        </div>
      </div>
    `,

    add: `
      <div class="page active" id="page-add">
        <div class="page-header">
          <h1 class="page-title">添加记录</h1>
        </div>

        <div class="section-title">选择指标</div>
        <div class="indicator-select" id="indicator-select"></div>

        <div class="section-title">拍摄照片（可选）</div>
        <div class="photo-upload" id="photo-upload">
          <div class="photo-upload-icon">📷</div>
          <div class="photo-upload-text">点击拍照或上传图片</div>
        </div>
        <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none">

        <div class="input-group">
          <label class="input-label">测量值</label>
          <input type="number" class="input" id="record-value" placeholder="请输入测量值" step="0.1">
        </div>

        <div class="datetime-row">
          <div class="input-group">
            <label class="input-label">日期</label>
            <input type="date" class="input" id="record-date">
          </div>
          <div class="input-group">
            <label class="input-label">时间</label>
            <input type="time" class="input" id="record-time">
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">备注（可选）</label>
          <input type="text" class="input" id="record-note" placeholder="如：饭前测量">
        </div>

        <button class="btn btn-primary btn-block" onclick="submitRecord()">保存记录</button>
      </div>
    `,

    history: `
      <div class="page active" id="page-history">
        <div class="page-header">
          <h1 class="page-title">历史记录</h1>
        </div>

        <div class="filter-bar" id="history-filter"></div>

        <div id="history-list">
          <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">加载中...</div>
          </div>
        </div>
      </div>
    `,

    analysis: `
      <div class="page active" id="page-analysis">
        <div class="page-header">
          <h1 class="page-title">数据分析</h1>
        </div>

        <div class="filter-bar" id="analysis-filter"></div>

        <div class="stats-grid" id="stats-grid"></div>

        <div class="chart-container">
          <div class="chart-header">
            <span class="chart-title">📈 趋势图</span>
            <div class="time-range">
              <button onclick="changeTimeRange(7)" data-range="7">7天</button>
              <button onclick="changeTimeRange(30)" data-range="30" class="active">30天</button>
              <button onclick="changeTimeRange(90)" data-range="90">90天</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="trend-chart"></canvas>
          </div>
        </div>
      </div>
    `,

    profile: `
      <div class="page active" id="page-profile">
        <div class="profile-header">
          <div class="profile-avatar">👤</div>
          <div class="profile-name">${state.user?.nickname || '用户'}</div>
          <div class="profile-phone">${state.user?.phone || ''}</div>
        </div>

        <div class="menu-list">
          <div class="menu-item" onclick="switchPage('indicators')">
            <span class="menu-icon">📊</span>
            <span class="menu-text">指标管理</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>

        <div class="menu-list" style="margin-top: 20px;">
          <div class="menu-item" onclick="logout()">
            <span class="menu-icon">🚪</span>
            <span class="menu-text">退出登录</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </div>
    `,

    indicators: `
      <div class="page active" id="page-indicators">
        <div class="page-header">
          <h1 class="page-title">指标管理</h1>
          <button class="btn btn-primary btn-sm" onclick="showAddIndicatorModal()">添加</button>
        </div>

        <div class="indicator-list" id="indicator-list"></div>
      </div>
    `,

    login: `
      <div class="login-page">
        <div class="login-logo">
          <div class="login-logo-icon">🏥</div>
          <div class="login-logo-text">健康数据追踪</div>
        </div>

        <div class="login-form">
          <div class="login-tabs">
            <button class="login-tab active" onclick="switchLoginTab('login')">登录</button>
            <button class="login-tab" onclick="switchLoginTab('register')">注册</button>
          </div>

          <div id="login-form-content">
            <div class="input-group">
              <label class="input-label">手机号</label>
              <input type="tel" class="input" id="login-phone" placeholder="请输入手机号">
            </div>
            <div class="input-group">
              <label class="input-label">密码</label>
              <input type="password" class="input" id="login-password" placeholder="请输入密码">
            </div>
            <button class="btn btn-primary btn-block" onclick="doLogin()">登录</button>
            <p style="text-align:center;margin-top:16px;font-size:13px;color:#718096;">
              测试账号: 13800138000 / 123456
            </p>
          </div>

          <div id="register-form-content" style="display:none;">
            <div class="input-group">
              <label class="input-label">手机号</label>
              <input type="tel" class="input" id="reg-phone" placeholder="请输入手机号">
            </div>
            <div class="input-group">
              <label class="input-label">昵称</label>
              <input type="text" class="input" id="reg-nickname" placeholder="请输入昵称">
            </div>
            <div class="input-group">
              <label class="input-label">密码</label>
              <input type="password" class="input" id="reg-password" placeholder="请输入密码">
            </div>
            <button class="btn btn-primary btn-block" onclick="doRegister()">注册</button>
          </div>
        </div>
      </div>
    `
  };

  return pages[pageName] || pages.home;
}

// 初始化页面逻辑
async function initPageLogic(pageName) {
  switch (pageName) {
    case 'home':
      await loadIndicators();
      await loadRecentRecords();
      break;
    case 'add':
      await loadIndicators();
      initPhotoUpload();
      initDateTime();
      break;
    case 'history':
      await loadIndicators();
      await loadHistory();
      break;
    case 'analysis':
      await loadIndicators();
      initAnalysisPage();
      break;
    case 'indicators':
      await loadIndicators();
      renderIndicatorList();
      break;
  }
}

// 加载指标列表
async function loadIndicators() {
  const res = await indicatorApi.list();
  if (res.code === 0) {
    state.indicators = res.data;
    renderIndicatorSelect();
  }
}

// 渲染指标选择器
function renderIndicatorSelect() {
  const select = document.getElementById('indicator-select');
  if (!select) return;

  select.innerHTML = state.indicators.map(ind => `
    <div class="indicator-option ${state.selectedIndicator?.id === ind.id ? 'selected' : ''}"
         onclick="selectIndicator(${ind.id})" data-id="${ind.id}">
      <span class="indicator-option-icon">${indicatorIcons[ind.name] || '📊'}</span>
      <span class="indicator-option-name">${ind.name}</span>
    </div>
  `).join('');
}

// 选择指标
function selectIndicator(id) {
  state.selectedIndicator = state.indicators.find(ind => ind.id === id);
  renderIndicatorSelect();
}

// 初始化照片上传
function initPhotoUpload() {
  const upload = document.getElementById('photo-upload');
  const input = document.getElementById('photo-input');

  upload.addEventListener('click', () => input.click());
  input.addEventListener('change', handlePhotoSelect);
}

// 处理照片选择
function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const upload = document.getElementById('photo-upload');
    upload.outerHTML = `
      <div class="photo-preview" id="photo-preview">
        <img src="${e.target.result}" alt="preview">
        <button class="photo-remove" onclick="removePhoto()">✕</button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

// 移除照片
function removePhoto() {
  const preview = document.getElementById('photo-preview');
  preview.outerHTML = `
    <div class="photo-upload" id="photo-upload">
      <div class="photo-upload-icon">📷</div>
      <div class="photo-upload-text">点击拍照或上传图片</div>
    </div>
  `;
  initPhotoUpload();
}

// 初始化日期时间
function initDateTime() {
  const now = new Date();
  const dateInput = document.getElementById('record-date');
  const timeInput = document.getElementById('record-time');

  if (dateInput) dateInput.value = now.toISOString().slice(0, 10);
  if (timeInput) timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// 提交记录
async function submitRecord() {
  if (!state.selectedIndicator) {
    showToast('请先选择指标');
    return;
  }

  const valueInput = document.getElementById('record-value');
  const value = valueInput?.value;

  if (!value) {
    showToast('请输入测量值');
    return;
  }

  const date = document.getElementById('record-date')?.value;
  const time = document.getElementById('record-time')?.value;
  const note = document.getElementById('record-note')?.value;
  const measuredAt = date && time ? `${date} ${time}:00` : new Date().toISOString().slice(0, 19).replace('T', ' ');

  const formData = new FormData();
  formData.append('indicator_id', state.selectedIndicator.id);
  formData.append('value', value);
  formData.append('note', note || '');
  formData.append('measured_at', measuredAt);

  const photoInput = document.getElementById('photo-input');
  if (photoInput?.files[0]) {
    formData.append('image', photoInput.files[0]);
  }

  const res = await recordApi.add(formData);

  if (res.code === 0) {
    showToast('记录成功');
    switchPage('home');
  } else {
    showToast(res.message || '添加失败');
  }
}

// 加载最近记录
async function loadRecentRecords() {
  const res = await recordApi.list({ limit: 5 });

  const container = document.getElementById('recent-records');
  if (!container) return;

  if (res.code !== 0 || res.data.list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">暂无记录</div>
        <div class="empty-desc">点击上方按钮添加第一条记录吧</div>
      </div>
    `;
    return;
  }

  container.innerHTML = res.data.list.map(record => {
    const statusClass = getStatusClass(record.value, record.normal_min, record.normal_max);
    const statusText = getStatusText(record.value, record.normal_min, record.normal_max);
    const icon = indicatorIcons[record.indicator_name] || '📊';

    return `
      <div class="record-item">
        <div class="record-icon" style="background:${record.color}20;color:${record.color}">
          ${icon}
        </div>
        <div class="record-info">
          <div class="record-name">${record.indicator_name}</div>
          <div class="record-time">${formatDate(record.measured_at)} ${formatTime(record.measured_at)}</div>
        </div>
        <div class="record-value">
          <div class="record-number ${statusClass}">${record.value}</div>
          <div class="record-unit">${record.unit} ${statusText ? '· ' + statusText : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 加载历史记录
async function loadHistory(indicatorId) {
  const params = {};
  if (indicatorId) params.indicator_id = indicatorId;

  const res = await recordApi.list(params);

  const container = document.getElementById('history-list');
  if (!container) return;

  // 渲染筛选器
  const filterBar = document.getElementById('history-filter');
  if (filterBar) {
    filterBar.innerHTML = `
      <button class="filter-chip ${!indicatorId ? 'active' : ''}" onclick="loadHistory()">全部</button>
      ${state.indicators.map(ind => `
        <button class="filter-chip ${indicatorId == ind.id ? 'active' : ''}"
                onclick="loadHistory(${ind.id})">${ind.name}</button>
      `).join('')}
    `;
  }

  if (res.code !== 0 || res.data.list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无记录</div>
        <div class="empty-desc">去添加页面记录你的健康数据吧</div>
      </div>
    `;
    return;
  }

  // 按日期分组
  const groups = {};
  res.data.list.forEach(record => {
    const dateKey = formatDate(record.measured_at);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(record);
  });

  container.innerHTML = Object.entries(groups).map(([date, records]) => `
    <div class="date-group">
      <div class="date-group-title">${date}</div>
      ${records.map(record => {
        const statusClass = getStatusClass(record.value, record.normal_min, record.normal_max);
        const statusText = getStatusText(record.value, record.normal_min, record.normal_max);
        return `
          <div class="record-card">
            <div class="record-card-header">
              <div class="record-card-name">
                <span class="record-card-dot" style="background:${record.color}"></span>
                <span class="record-card-title">${record.indicator_name}</span>
              </div>
              <span class="record-card-time">${formatTime(record.measured_at)}</span>
            </div>
            <div class="record-card-body">
              <div>
                <span class="record-card-value ${statusClass}">${record.value}</span>
                <span class="record-card-unit">${record.unit}</span>
              </div>
              ${statusText ? `<span class="record-card-status" style="background:${statusClass === 'status-danger' ? '#FFE8E8' : '#E8F9E8'};color:${statusClass === 'status-danger' ? '#FF6B6B' : '#52C41A'}">${statusText}</span>` : ''}
            </div>
            ${record.note ? `<div class="record-card-note">${record.note}</div>` : ''}
            <div style="margin-top:8px;text-align:right;">
              <button class="btn btn-sm btn-outline" onclick="deleteRecord(${record.id})">删除</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

// 删除记录
function deleteRecord(id) {
  showModal('确认删除', '确定要删除这条记录吗？', async () => {
    const res = await recordApi.delete(id);
    if (res.code === 0) {
      showToast('删除成功');
      loadHistory();
    } else {
      showToast(res.message || '删除失败');
    }
  });
}

// 初始化分析页面
let currentTimeRange = 30;
let currentAnalysisIndicator = null;

async function initAnalysisPage() {
  await loadStats();
}

async function loadStats(indicatorId) {
  currentAnalysisIndicator = indicatorId;
  const params = { days: currentTimeRange };
  if (indicatorId) params.indicator_id = indicatorId;

  const res = await recordApi.stats(params);

  // 渲染筛选器
  const filterBar = document.getElementById('analysis-filter');
  if (filterBar) {
    filterBar.innerHTML = `
      <button class="filter-chip ${!indicatorId ? 'active' : ''}" onclick="loadStats()">全部</button>
      ${state.indicators.map(ind => `
        <button class="filter-chip ${indicatorId == ind.id ? 'active' : ''}"
                onclick="loadStats(${ind.id})">${ind.name}</button>
      `).join('')}
    `;
  }

  // 渲染统计卡片
  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid && res.code === 0) {
    const stats = res.data.stats;
    if (stats.length > 0) {
      const s = stats[0];
      const latest = res.data.latestRecords.find(r => r.indicator_id === s.indicator_id);
      const prevValue = res.data.trendData.length > 1 ? res.data.trendData[0].avg_value : null;
      const trend = latest && prevValue ? (latest.value > prevValue ? 'up' : latest.value < prevValue ? 'down' : 'flat') : '';

      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">平均值</div>
          <div class="stat-value">${parseFloat(s.avg_value).toFixed(1)}<span class="stat-unit">${s.unit}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最新值</div>
          <div class="stat-value">${latest ? latest.value : '-'}<span class="stat-unit">${s.unit}</span></div>
          ${trend ? `<div class="stat-trend ${trend}">${trend === 'up' ? '↑ 上升' : trend === 'down' ? '↓ 下降' : '→ 持平'}</div>` : ''}
        </div>
        <div class="stat-card">
          <div class="stat-label">最高值</div>
          <div class="stat-value">${s.max_value}<span class="stat-unit">${s.unit}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最低值</div>
          <div class="stat-value">${s.min_value}<span class="stat-unit">${s.unit}</span></div>
        </div>
      `;
    } else {
      statsGrid.innerHTML = `
        <div class="stat-card" style="grid-column:1/-1;text-align:center;padding:40px;">
          <div style="font-size:48px;margin-bottom:12px;">📊</div>
          <div style="color:#718096;">暂无数据，请先添加记录</div>
        </div>
      `;
    }
  }

  // 渲染图表
  renderChart(res.data.trendData || []);
}

function changeTimeRange(days) {
  currentTimeRange = days;
  document.querySelectorAll('.time-range button').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.range) === days);
  });
  loadStats(currentAnalysisIndicator);
}

function renderChart(trendData) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;

  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  if (trendData.length === 0) {
    ctx.parentElement.innerHTML = '<div style="text-align:center;padding:60px;color:#718096;">暂无趋势数据</div>';
    return;
  }

  // 按指标分组
  const indicatorMap = {};
  trendData.forEach(item => {
    if (!indicatorMap[item.indicator_id]) {
      indicatorMap[item.indicator_id] = {
        name: item.indicator_name,
        color: item.color,
        data: []
      };
    }
    indicatorMap[item.indicator_id].data.push({
      x: item.date,
      y: parseFloat(item.avg_value)
    });
  });

  const datasets = Object.values(indicatorMap).map(ind => ({
    label: ind.name,
    data: ind.data.sort((a, b) => new Date(a.x) - new Date(b.x)),
    borderColor: ind.color,
    backgroundColor: ind.color + '20',
    tension: 0.3,
    fill: true
  }));

  state.chartInstance = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, padding: 20 }
        }
      },
      scales: {
        x: {
          type: 'category',
          grid: { display: false }
        },
        y: {
          beginAtZero: false,
          grid: { color: '#E2E8F0' }
        }
      }
    }
  });
}

// 渲染指标列表
function renderIndicatorList() {
  const list = document.getElementById('indicator-list');
  if (!list) return;

  list.innerHTML = state.indicators.map(ind => `
    <div class="indicator-item">
      <span class="indicator-color" style="background:${ind.color}"></span>
      <div class="indicator-info">
        <div class="indicator-name">${ind.name}</div>
        <div class="indicator-range">正常范围: ${ind.normal_min || '?'} - ${ind.normal_max || '?'} ${ind.unit}</div>
      </div>
      ${ind.is_preset == 1 ? '<span class="indicator-badge">预设</span>' : ''}
      ${ind.is_preset == 0 ? `
        <div class="indicator-actions">
          <button class="btn btn-sm btn-outline" onclick="editIndicator(${ind.id})">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="deleteIndicator(${ind.id})">删除</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// 显示添加指标弹窗
function showAddIndicatorModal() {
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-title').textContent = '添加指标';
  modal.querySelector('.modal-body').innerHTML = `
    <div class="input-group">
      <label class="input-label">指标名称</label>
      <input type="text" class="input" id="ind-name" placeholder="如：尿酸">
    </div>
    <div class="input-group">
      <label class="input-label">单位</label>
      <input type="text" class="input" id="ind-unit" placeholder="如：μmol/L">
    </div>
    <div class="input-group">
      <label class="input-label">正常最小值（选填）</label>
      <input type="number" class="input" id="ind-min" placeholder="如：150">
    </div>
    <div class="input-group">
      <label class="input-label">正常最大值（选填）</label>
      <input type="number" class="input" id="ind-max" placeholder="如：420">
    </div>
  `;
  modal.classList.add('show');

  const confirmBtn = modal.querySelector('[data-action="confirm"]');
  const cancelBtn = modal.querySelector('[data-action="cancel"]');

  const handleConfirm = async () => {
    const name = document.getElementById('ind-name')?.value;
    const unit = document.getElementById('ind-unit')?.value;
    const normal_min = document.getElementById('ind-min')?.value;
    const normal_max = document.getElementById('ind-max')?.value;

    if (!name || !unit) {
      showToast('请填写名称和单位');
      return;
    }

    const res = await indicatorApi.add({ name, unit, normal_min: normal_min || null, normal_max: normal_max || null });
    if (res.code === 0) {
      showToast('添加成功');
      modal.classList.remove('show');
      await loadIndicators();
      renderIndicatorList();
    } else {
      showToast(res.message || '添加失败');
    }
  };

  confirmBtn.onclick = handleConfirm;
  cancelBtn.onclick = () => modal.classList.remove('show');
}

// 编辑指标
function editIndicator(id) {
  showToast('编辑功能开发中');
}

// 删除指标
function deleteIndicator(id) {
  showModal('确认删除', '确定要删除这个指标吗？删除后相关记录仍会保留。', async () => {
    const res = await indicatorApi.delete(id);
    if (res.code === 0) {
      showToast('删除成功');
      await loadIndicators();
      renderIndicatorList();
    } else {
      showToast(res.message || '删除失败');
    }
  });
}

// 跳转到添加记录并选中指标
function goToAddRecord(indicatorName) {
  switchPage('add');
  setTimeout(async () => {
    await loadIndicators();
    const ind = state.indicators.find(i => i.name === indicatorName);
    if (ind) {
      state.selectedIndicator = ind;
      renderIndicatorSelect();
    }
  }, 100);
}

// 登录相关
function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach((t, i) => {
    t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
  document.getElementById('login-form-content').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form-content').style.display = tab === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const phone = document.getElementById('login-phone')?.value;
  const password = document.getElementById('login-password')?.value;

  if (!phone || !password) {
    showToast('请填写手机号和密码');
    return;
  }

  const res = await userApi.login({ phone, password });
  if (res.code === 0) {
    setToken(res.data.token);
    setUserInfo(res.data.user);
    state.user = res.data.user;
    showToast('登录成功');
    switchPage('home');
  } else {
    showToast(res.message || '登录失败');
  }
}

async function doRegister() {
  const phone = document.getElementById('reg-phone')?.value;
  const nickname = document.getElementById('reg-nickname')?.value;
  const password = document.getElementById('reg-password')?.value;

  if (!phone || !password) {
    showToast('请填写手机号和密码');
    return;
  }

  const res = await userApi.register({ phone, nickname, password });
  if (res.code === 0) {
    setToken(res.data.token);
    setUserInfo(res.data.user);
    state.user = res.data.user;
    showToast('注册成功');
    switchPage('home');
  } else {
    showToast(res.message || '注册失败');
  }
}

function logout() {
  showModal('确认退出', '确定要退出登录吗？', () => {
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    state.user = null;
    switchPage('login');
  });
}

// Tab点击事件
document.querySelectorAll('.tab-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    if (page) switchPage(page);
  });
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  switchPage(state.user ? 'home' : 'login');
});
