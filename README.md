# Video Downloader

Web 版视频下载工具，支持 B站、YouTube、优酷等多平台视频解析下载。

## 功能

- **批量下载** — 粘贴多个链接，逐个解析，串行下载
- **格式选择** — 解析后展示所有可用分辨率和格式，用户自选
- **实时进度** — SSE 流式推送下载百分比、文件大小、速度
- **视频预览** — 下载完成后在页面内直接播放，支持拖动进度条
- **历史记录** — 完整的下载历史，支持搜索和按网站筛选，分页浏览
- **设置管理** — 自定义下载目录、配置 HTTP/SOCKS 代理
- **主题切换** — 深色/浅色/跟随系统三种模式

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Pinia |
| 后端 | Node.js + Express |
| 核心引擎 | yt-dlp |
| 存储 | JSON 文件 |

## 前提条件

- Node.js >= 18
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) 已安装并在 PATH 中
- （可选）[ffmpeg](https://ffmpeg.org/) 用于合并音视频

## 安装

```bash
git clone git@github.com:zpq/vedio-download.git
cd vedio-download
npm install
```

## 使用

```bash
# 开发模式（前端热更新 + 后端）
npm run dev       # 终端1：Vite 开发服务器 http://localhost:5173
npm run server    # 终端2：Express 后端 http://localhost:3000

# 生产模式
npm run build     # 构建前端到 server/public/
npm run server    # 启动后端，自动托管前端
# 访问 http://localhost:3000
```

## 项目结构

```
├── server/
│   ├── index.js            # Express 服务器 + API 路由
│   ├── video-service.js    # yt-dlp 解析和下载
│   ├── history-service.js  # 历史记录 CRUD
│   └── settings-service.js # 设置读写
├── src/
│   ├── App.vue             # 根组件
│   ├── components/         # Vue 组件
│   ├── composables/        # 组合式函数（下载、历史、设置）
│   ├── services/           # API 封装
│   ├── stores/             # Pinia 状态管理
│   └── style/              # CSS 变量 + 全局样式
├── vite.config.js          # Vite 配置
└── package.json
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/parse` | 解析视频信息 |
| GET | `/api/download` | SSE 流式下载 |
| GET | `/api/history` | 获取历史记录 |
| DELETE | `/api/history/:id` | 删除单条记录 |
| DELETE | `/api/history` | 清空全部记录 |
| GET | `/api/preview/:id` | 视频预览（支持 Range） |
| GET | `/api/files/:id` | 文件下载 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |

## License

MIT
