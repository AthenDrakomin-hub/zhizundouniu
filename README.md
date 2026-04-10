# 至尊斗牛 (Supreme Fight Bull) - 商业完全体版

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black.svg)

《至尊斗牛》是一款专为高端私密圈子打造的竞技棋牌平台。本项目在经历了多次重构后，已全面吸收了开源标杆 `niuma-wj` 仓库的**商业级视听资产**与**模块化服务端架构**，彻底从一个“开发者画风”的半成品进化为拥有极致沉浸感、声光电特效拉满的商业完全体。

---

## 🌟 核心特性 (Features)

### 1. 商业级视听盛宴 (Commercial Audio & Visuals)
- **全真高清扑克**：彻底告别 CSS 简陋牌面，接入全套高清扑克切图，背面采用高档暗纹材质。
- **3D艺术字牌型**：结算时不再显示干瘪的文字，而是弹出从“牛一”到“五小牛”的专属 3D 浮雕艺术字贴图。
- **实体筹码满天飞**：引入基于物理抛物线的 `framer-motion` 筹码飞行动效。结算时金币从输家飞向庄家，再飞向赢家，配合清脆的收钱音效，将赢钱爽感拉满。
- **大奖震屏与高光 (Mega Win)**：当玩家拿到牛牛或更高牌型时，触发全屏震动与专属的耀眼金边聚光灯高亮。
- **全流程真实音效**：内置场景音效管理器 (`AudioManager`)，涵盖发牌、心跳倒计时、筹码碰撞、胜利/失败等全套真实赌场音效。

### 2. 极致微交互与悬念 (Suspense & Micro-interactions)
- **心跳搓牌 (Squeezing)**：第 5 张底牌下发时带有高斯模糊 (`backdrop-filter: blur`)。玩家必须按住牌面带有物理阻尼感地缓慢拖拽，随着拖拽距离增加，模糊消退并伴随越来越快的心跳音效，将悬念感推向巅峰。
- **局内社交表情 (Emotes)**：玩家可点击他人头像弹出快捷菜单，发送炸弹、啤酒、玫瑰等表情，表情会带有专属飞行轨迹和爆炸音效在全房间同步广播。

### 3. 双层动态平衡算法 (Dynamic Balance Algorithm)
- **底层期望系统 (胜率池)**：房主可为每个座位设定 0%-100% 的“目标胜率”。在发第 5 张牌前，系统通过概率干预，平滑地决定是发“好牌”还是“坏牌”，实现“温水煮青蛙”式的智能调控。
- **顶层即时点杀 (最高优先级)**：房主在管理端可随时点击某张牌进行“点杀”。手动指令将直接覆盖期望算法，实现雷霆收割。

### 4. 独立上帝视角后台 (Admin Dashboard)
- **数据大盘看板**：管理端顶部新增宏观数据大盘，实时监控“今日总局数”、“当前在线房间数”、“系统总盈亏”，使后台真正具备平台级运营能力。
- **发财红控制台**：直观的胜率百分比滑块（红代表压制，金代表放水），并实时显示玩家累计盈亏分，方便房主“看客下菜”。

### 5. 生产级服务端架构 (Production Backend)
- **核心路由解耦**：告别臃肿的单体文件，Node.js 服务端已拆分为 `db.ts` (SQLite 连接)、`routes.ts` (HTTP 大厅/鉴权接口) 和 `game.ts` (核心 Socket.io 牌局逻辑)。
- **脱离 TSX 裸奔**：摒弃开发环境的 `tsx` 运行方式。部署时通过 `esbuild` 将后端极速编译为纯正的 ES Module (`dist-server/server.js`)，由 PM2 使用原生 Node 挂载，彻底杜绝高并发下的内存泄漏与 GLIBC 报错。

---

## 🛠️ 技术栈 (Tech Stack)

- **前端 (游戏端 & 管理端)**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **后端**: Node.js 20, Express, Socket.io, SQLite3
- **部署**: GitHub Actions, PM2, esbuild

---

## 🚀 快速开始 (Getting Started)

### 1. 环境要求
- Node.js >= 20.0.0
- npm >= 9.0.0

### 2. 安装依赖
克隆项目后，分别安装根目录与管理端的依赖：

```bash
# 1. 安装根目录（服务端与游戏端）依赖
npm install

# 2. 安装独立管理端依赖
cd admin-client
npm install
cd ..
```

### 3. 本地开发运行
你需要分别启动服务端（含游戏端）和独立管理端：

**终端 1：启动服务端 & 游戏端**
```bash
# 运行在 http://localhost:3000
npm run dev
```

**终端 2：启动独立管理端**
```bash
# 运行在 http://localhost:3001
cd admin-client
npm run dev
```

### 4. 生产环境构建
```bash
# 编译后端服务 (输出至 dist-server/server.js)
npm run build:server

# 构建游戏前端 (输出至 dist)
npm run build

# 构建管理前端 (输出至 admin-client/dist)
cd admin-client
npm run build
```

---

## 🌐 部署指南 (Deployment)

项目内置了教科书级别的 `.github/workflows/deploy.yml` 自动化部署脚本，专为海外服务器（如日本东京节点）打造。

### 使用 GitHub Actions 自动部署
1. 在 GitHub 仓库的 **Settings -> Secrets and variables -> Actions** 中添加以下密钥：
   - `SERVER_HOST`: 服务器 IP 地址
   - `SERVER_USER`: SSH 登录用户名 (如 root)
   - `SERVER_SSH_KEY`: 您的私钥内容
2. 推送代码到 `main` 分支。
3. 流水线将自动执行：环境检查 -> 依赖重装 -> **服务器本地重编 sqlite3 (解决兼容性问题)** -> esbuild 编译后端 -> Vite 构建双端前端 -> PM2 原生 Node 启动。

---

## 📄 许可证 (License)

本项目采用 MIT 许可证，详情请参见 [LICENSE](LICENSE) 文件。

> **免责声明**：本项目仅供技术研究、架构学习与棋牌游戏开发交流使用。请严格遵守您所在国家和地区的法律法规，严禁将本项目用于任何非法赌博活动。
