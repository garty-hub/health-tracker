// API 封装
const API_BASE = 'http://localhost:3001/api';

// 获取token
function getToken() {
  return localStorage.getItem('health_token') || '';
}

// 设置token
function setToken(token) {
  localStorage.setItem('health_token', token);
}

// 获取用户信息
function getUserInfo() {
  const userStr = localStorage.getItem('health_user');
  return userStr ? JSON.parse(userStr) : null;
}

// 设置用户信息
function setUserInfo(user) {
  localStorage.setItem('health_user', JSON.stringify(user));
}

// 通用请求
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (data.code === 1 && data.message.includes('登录')) {
      // Token过期，清除登录状态
      localStorage.removeItem('health_token');
      localStorage.removeItem('health_user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { code: 1, message: '网络错误，请检查服务器是否启动' };
  }
}

// 用户相关API
const userApi = {
  // 注册
  register: (data) => request('/user/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 登录
  login: (data) => request('/user/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 获取用户信息
  getInfo: () => request('/user/info'),

  // 更新用户信息
  update: (data) => request('/user/update', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// 指标相关API
const indicatorApi = {
  // 获取指标列表
  list: () => request('/indicators'),

  // 添加指标
  add: (data) => request('/indicators', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 更新指标
  update: (id, data) => request(`/indicators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // 删除指标
  delete: (id) => request(`/indicators/${id}`, {
    method: 'DELETE'
  })
};

// 记录相关API
const recordApi = {
  // 添加记录
  add: (formData) => {
    return fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    }).then(res => res.json());
  },

  // 获取记录列表
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records${query ? '?' + query : ''}`);
  },

  // 获取统计数据
  stats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records/stats${query ? '?' + query : ''}`);
  },

  // 删除记录
  delete: (id) => request(`/records/${id}`, {
    method: 'DELETE'
  })
};
