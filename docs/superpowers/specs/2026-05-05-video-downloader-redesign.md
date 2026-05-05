# 视频下载工具 — 重构设计文档

> 日期：2026-05-05
> 状态：已确认

## 项目概述

Web 版视频下载工具，面向小团队使用。用户在网页上粘贴视频链接，自动识别网站（B站、YouTube 等），选择格式后下载视频。支持批量下载、视频预览、历史记录搜索筛选。

## 技术选型

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Pinia |
| 后端 | Node.js + Express |
| 核心引擎 | yt-dlp（已安装） |
| 存储 | JSON 文件（settings、history） |
| 进度推送 | SSE（Server-Sent Events） |

## 整体架构

```
浏览器 (Vue 3 SPA)
  │
  ├── 下载 Tab：URL 输入 → 批量解析 → 格式选择 → SSE 进度 → 预览播放
  ├── 历史 Tab：列表 + 搜索/筛选 → 点击预览
  └── 设置 Tab：下载目录 + 代理地址 + 主题切换
  │
  ▼
Express API Server (port 3000)
  │
  ├── /api/parse        — 视频信息解析
  ├── /api/download     — SSE 流式下载
  ├── /api/history      — 历史 CRUD
  ├── /api/settings     — 配置读写
  ├── /api/preview/:id  — 视频流播放
  └── /api/files/:id    — 文件下载
  │
  ▼
yt-dlp CLI
  --proxy → 用户配置的代理
  -o      → 用户指定的下载目录
```

## 前端组件结构

```
src/
├── App.vue                  # 根组件，布局 + Tab 路由
├── components/
│   ├── TabBar.vue           # 顶部 Tab 导航
│   ├── ThemeToggle.vue      # 深色/浅色切换按钮
│   ├── DownloadTab.vue      # 下载页容器
│   ├── UrlInput.vue         # 多行 URL 输入 + 解析按钮
│   ├── TaskCard.vue         # 单个视频卡片（解析 → 格式选择 → 进度 → 播放）
│   ├── FormatSelector.vue   # 格式下拉选择
│   ├── ProgressBar.vue      # 下载进度条（百分比 + 大小 + 速度）
│   ├── VideoPlayer.vue      # 视频预览播放器
│   ├── HistoryTab.vue       # 历史记录页容器
│   ├── HistorySearch.vue    # 搜索框 + 筛选条件（网站、日期）
│   ├── HistoryItem.vue      # 单条历史记录
│   ├── SettingsTab.vue      # 设置页
│   └── SettingsForm.vue     # 设置表单（下载目录、代理）
├── composables/
│   ├── useDownload.js       # 下载逻辑（SSE 连接、进度管理、批量队列）
│   ├── useHistory.js        # 历史记录 CRUD + 搜索筛选
│   └── useSettings.js       # 设置读写
├── stores/
│   └── theme.js             # Pinia 主题状态
├── services/
│   └── api.js               # 后端 API 封装
└── style/
    ├── variables.css         # CSS 变量（深色/浅色两套）
    └── global.css            # 全局样式
```

## 页面设计

### Tab 结构

顶部标题栏（应用名 + ThemeToggle + 设置图标），下方 3 个 Tab 页切换。

### 下载 Tab

1. 多行 textarea 输入框，每行一个视频链接，右侧「解析」按钮
2. 解析后每个视频生成一张 TaskCard：
   - 标题 + 网站来源
   - 格式选择（下拉框，显示分辨率、格式、编码）
   - 下载按钮 → 点击后展示 ProgressBar（百分比、已下载/总大小、速度）
   - 下载完成后显示播放按钮，点击展开 VideoPlayer
3. 多个视频串行下载，SSE 逐个推送进度

### 历史记录 Tab

1. 顶部搜索框 + 筛选条件（网站来源下拉、日期范围）
2. 列表展示所有记录：标题、网站、分辨率、格式、下载时间
3. 悬停显示删除按钮，支持单条删除和全部清空
4. 点击记录展开 VideoPlayer 预览，或点击下载按钮重新下载文件

### 设置 Tab

1. 下载目录：文本输入框，显示当前路径，支持修改
2. 代理地址：文本输入框（如 `http://127.0.0.1:7890`），可留空
3. 主题切换：深色/浅色/跟随系统 三选一
4. 保存按钮

## 主题系统

- 两套 CSS 变量：深色（`[data-theme="dark"]`）和浅色（`[data-theme="light"]`）
- 默认跟随 `prefers-color-scheme` 媒体查询
- 用户手动切换后存入 localStorage，覆盖系统偏好
- Pinia store 管理当前主题状态

### 深色主题变量

```css
[data-theme="dark"] {
  --bg: #0f0f0f;
  --surface: #1a1a2e;
  --border: #2d2d44;
  --text: #e0e0e0;
  --text-dim: #888;
  --accent: #6c63ff;
  --success: #4ecdc4;
  --error: #ff6b6b;
}
```

### 浅色主题变量

```css
[data-theme="light"] {
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-dim: #94a3b8;
  --accent: #3b82f6;
  --success: #22c55e;
  --error: #ef4444;
}
```

## API 设计

### 解析视频

```
POST /api/parse
Body: { "url": "https://..." }
Response: { "success": true, "data": { "title": "...", "site": "...", "formats": [...] } }
```

### 下载视频（SSE）

```
GET /api/download?url=...&formatId=...&title=...&site=...&resolution=...&ext=...&filesize=...
Response: text/event-stream
  event: progress  → { "percent": 45.2, "totalSize": "284MB", "speed": "2.4MB/s" }
  event: progress  → { "percent": 100, "status": "merging" }
  event: done      → { "filename": "...", "filepath": "...", "record": {...} }
  event: error     → { "error": "..." }
```

### 历史记录

```
GET    /api/history          → { "success": true, "data": [...] }
DELETE /api/history/:id      → { "success": true, "data": [...] }
DELETE /api/history          → { "success": true }
```

### 视频预览（支持 Range 请求）

```
GET /api/preview/:id
Response: video/mp4 流，支持 HTTP Range 头
```

### 文件下载

```
GET /api/files/:id
Response: Content-Disposition: attachment
```

### 设置

```
GET /api/settings            → { "success": true, "data": { "downloadDir": "...", "proxy": "..." } }
PUT /api/settings            → Body: { "downloadDir": "...", "proxy": "..." }
```

## 数据模型

### settings.json

```json
{
  "downloadDir": "D:\\Downloads\\Videos",
  "proxy": "http://127.0.0.1:7890"
}
```

### history.json（单条记录）

```json
{
  "id": "mos8wvto",
  "title": "视频标题",
  "url": "https://www.bilibili.com/video/BV1xxx",
  "site": "BiliBili",
  "resolution": "1920x1080",
  "ext": "mp4",
  "filesize": 179707148,
  "filename": "视频标题.mp4",
  "filepath": "D:\\Downloads\\Videos\\视频标题.mp4",
  "downloadedAt": "2026-05-05T06:26:50.268Z"
}
```

## 批量下载流程

1. 用户在 textarea 中粘贴多个 URL（每行一个）
2. 前端逐个调用 `/api/parse`，解析成功的加入任务队列
3. 用户为每个任务选择格式
4. 点击下载，前端按顺序为每个任务建立 SSE 连接
5. 当前任务完成后自动开始下一个
6. 每个任务独立显示进度、状态、结果

## yt-dlp 集成

- 解析：`yt-dlp --dump-json --no-playlist <url>`
- 下载：`yt-dlp --no-playlist --newline --progress --print after_move:filepath -o <dir>/%(title)s.%(ext)s [-f <formatId>] [--proxy <proxy>] <url>`
- 从 stdout 解析 `[download] XX.X%` 获取进度
- 从 stderr 识别 `[Merger]` / `[ExtractAudio]` 等后处理阶段

## 错误处理

- URL 无效或网站不支持 → 返回友好错误提示
- yt-dlp 未安装 → 启动时检测并提示
- 下载目录不存在 → 自动创建
- 代理连接失败 → 提示检查代理设置
- 文件已被删除 → 预览时提示文件不存在
