# 健康数据追踪助手 - 项目规范

## 1. Concept & Vision

一款简洁温情的健康数据追踪工具，帮助用户轻松记录血压、血脂、体重等身体指标，通过直观的趋势图表发现健康变化。不追求专业医疗级的功能，而是让普通人也能坚持记录、看到变化、养成习惯。

**核心理念**：简单、可坚持、有温度。

## 2. Design Language

### 美学方向
温暖柔和的「健康生活」风格，参考Apple Health和小米健康的简约感，但更温暖、更有亲和力。

### 色彩系统
```
--primary:      #4A90D9    // 主色：治愈蓝
--success:      #52C41A    // 正常/下降：清新绿
--warning:      #FAAD14    // 警戒/提醒：温暖黄
--danger:       #FF6B6B    // 异常/上升：警示红
--background:   #F7F8FC    // 页面背景
--card-bg:      #FFFFFF    // 卡片背景
--text-primary: #2D3748    // 主要文字
--text-secondary: #718096  // 次要文字
--border:       #E2E8F0    // 边框色
```

### 字体
- 主字体：`"PingFang SC", "Helvetica Neue", sans-serif`
- 数字字体：`"DIN Alternate", "Roboto", monospace`（用于数据展示）
- 标题：18-24px / font-weight: 600
- 正文：14-16px / font-weight: 400
- 辅助：12px / font-weight: 400

### 间距系统
- 基础单位：4px
- 页面边距：16px
- 卡片内边距：16px
- 元素间距：12px / 16px / 24px

### 动效
- 页面切换：slide 200ms ease-out
- 按钮点击：scale 0.95 → 1, 100ms
- 数据加载：fade-in + skeleton shimmer
- 图表绘制：逐点绘制动画 800ms

## 3. Layout & Structure

### 页面结构
```
┌─────────────────────────────┐
│         Header              │  标题 + 操作按钮
├─────────────────────────────┤
│                             │
│         Content             │  主内容区域
│         (Scrollable)        │
│                             │
├─────────────────────────────┤
│       Bottom Tab Bar        │  底部导航
└─────────────────────────────┘
```

### 页面清单
1. **首页** - 今日数据总览 + 快速添加
2. **添加记录** - 选择指标 → 拍照/手动输入 → 保存
3. **历史记录** - 列表展示 + 筛选 + 删除
4. **数据分析** - 趋势图表 + 统计摘要
5. **指标管理** - 添加/编辑/删除自定义指标
6. **我的** - 用户信息 + 设置

### 响应式策略
- 移动端优先（320px-768px）
- 平板/桌面端：最大宽度480px居中，保持手机体验

## 4. Features & Interactions

### 核心功能

#### 4.1 添加记录
- **拍照识别**（可选）
  - 用户拍照后调用OCR识别数字
  - 支持血压计、体重秤等数值识别
  - 识别结果可编辑确认
- **手动录入**
  - 选择指标类型
  - 输入数值（支持小数）
  - 选择测量时间（默认当前时间）
  - 可选：添加备注
- **保存**：提交到服务器，本地Toast提示成功/失败

#### 4.2 历史记录
- 按日期分组展示（今天/昨天/本周/更早）
- 支持按指标类型筛选
- 点击展开查看详情
- 左滑/长按删除（需确认）
- 分页加载（每页20条）

#### 4.3 数据分析
- **趋势图**：折线图展示指标变化
  - 时间范围：7天/30天/90天/全部
  - 支持多指标对比（同界面切换）
  - 异常值标红提示
- **统计摘要**：
  - 平均值、最高、最低、近期趋势
  - 和上次对比（↑↓→）
  - 正常范围参考值

#### 4.4 指标管理
- **预设指标**（不可删除）：
  - 血压（高压/低压），单位：mmHg
  - 血脂（总胆固醇/甘油三酯），单位：mmol/L
  - 体重，单位：kg
  - 血糖，单位：mmol/L
  - 心率，单位：次/分
- **自定义指标**：
  - 名称（必填，最多10字符）
  - 单位（必填，最多5字符）
  - 正常范围（选填，min-max）
  - 颜色（选择标签颜色）

### 交互细节
- 输入框：点击聚焦时边框变主色
- 按钮：点击有按压反馈
- 列表项：点击时背景色变淡
- 删除：滑动显示删除按钮，红色确认
- 空状态：显示友好插图 + 引导文案
- 加载中：骨架屏 + 加载动画

## 5. Component Inventory

### 5.1 RecordCard 记录卡片
```
┌────────────────────────────────┐
│ [图标] 血压          2024-01-15 │
│        120/80 mmHg    10:30    │
│        状态：正常 ✓            │
└────────────────────────────────┘
```
- 状态：正常（绿）、偏高（黄）、危险（红）

### 5.2 IndicatorTag 指标标签
- 圆角胶囊形状
- 背景色：指标对应颜色（透明度20%）
- 文字色：指标对应颜色

### 5.3 TrendChart 趋势图
- 折线图 + 数据点
- X轴：日期
- Y轴：数值
- 正常范围：浅色背景带
- 异常点：红色数据点

### 5.4 StatCard 统计卡片
```
┌──────────┐ ┌──────────┐
│ 平均值   │ │ 最新值   │
│ 118.5   │ │ 120.0 ↑  │
└──────────┘ └──────────┘
```

### 5.5 EmptyState 空状态
- 插图（简笔画风格）
- 主文案 + 副文案
- 操作按钮（可选）

## 6. Technical Approach

### 技术栈
- **前端**：原生 HTML5 + CSS3 + JavaScript（不依赖框架）
- **后端**：Node.js + Express
- **数据库**：MySQL 8.4
- **图片存储**：本地文件系统（uploads目录）
- **图表**：Chart.js

### 项目结构
```
health-tracker/
├── frontend/
│   ├── index.html          // 单页应用入口
│   ├── css/
│   │   └── style.css       // 全局样式
│   ├── js/
│   │   ├── app.js          // 应用主逻辑
│   │   ├── api.js          // API调用封装
│   │   ├── router.js       // 路由管理
│   │   └── components/    // 组件
│   └── assets/
│       └── images/
├── backend/
│   ├── app.js              // Express入口
│   ├── routes/             // 路由
│   ├── controllers/        // 控制器
│   ├── models/             // 数据模型
│   ├── middleware/         // 中间件
│   └── uploads/            // 上传文件
├── database/
│   └── init.sql            // 数据库初始化
└── SPEC.md
```

### API 设计

#### 用户相关
- `POST /api/user/register` - 注册（手机号+验证码）
- `POST /api/user/login` - 登录
- `GET /api/user/info` - 获取用户信息

#### 指标相关
- `GET /api/indicators` - 获取指标列表
- `POST /api/indicators` - 添加自定义指标
- `PUT /api/indicators/:id` - 更新指标
- `DELETE /api/indicators/:id` - 删除指标

#### 记录相关
- `POST /api/records` - 添加记录（支持拍照上传）
- `GET /api/records` - 获取记录列表（支持筛选、分页）
- `GET /api/records/stats` - 获取统计数据
- `DELETE /api/records/:id` - 删除记录

### 数据模型

#### users 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| phone | VARCHAR(20) | 手机号 |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像 |
| created_at | TIMESTAMP | 注册时间 |

#### indicators 指标表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| name | VARCHAR(50) | 指标名称 |
| unit | VARCHAR(10) | 单位 |
| normal_min | DECIMAL | 正常最小值 |
| normal_max | DECIMAL | 正常最大值 |
| color | VARCHAR(20) | 颜色 |
| is_preset | TINYINT | 是否预设(1是/0否) |
| created_at | TIMESTAMP | 创建时间 |

#### records 记录表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| indicator_id | INT | 指标ID |
| value | DECIMAL(10,2) | 测量值 |
| note | VARCHAR(255) | 备注 |
| image | VARCHAR(255) | 照片路径 |
| measured_at | TIMESTAMP | 测量时间 |
| created_at | TIMESTAMP | 记录时间 |

### 状态码约定
```json
{
  "code": 0,        // 0成功，其他失败
  "message": "",    // 提示信息
  "data": {}        // 数据
}
```
