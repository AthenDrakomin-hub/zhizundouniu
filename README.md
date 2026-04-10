# 至尊斗牛 (Supreme Fight Bull)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black.svg)

《至尊斗牛》是一款专为高端私密圈子打造的竞技棋牌平台。本项目采用 **房卡钥匙邀请制** 与 **纯净零和博弈** 模式，彻底剥离了复杂的抽水逻辑，化身为极简、透明的竞技场。配合独立的高安全管理后台与严格的防透视机制，为房主（代理商）提供了极具商业价值的护城河。

---

## 🌟 核心特性 (Features)

### 1. 纯净零和博弈 (Zero-Sum Game)
- **无抽水机制**：取消所有系统抽水，玩家输赢 100% 透明。
- **0分起步计分**：玩家初始积分为 0，允许负分，20局总结算时，所有人最终积分相加绝对为 0。
- **极简战报**：对局结束后生成防伪战报，仅包含玩家与最终盈亏，方便线下极速对账。

### 2. 极致安全防透视 (Anti-Cheat System)
- **4+1 分段发牌**：开局仅下发前 4 张明牌与第 5 张的背景占位符，未搓牌前，客户端内存中绝对没有第 5 张牌的数据。
- **严格搓牌请求**：玩家搓牌进度达到阈值时，前端瞬间向服务器发送 `request_last_card` 请求，实时获取并渲染底牌，从物理和协议双重层面杜绝抓包透视外挂。

### 3. 独立上帝视角后台 (Admin Console)
- **双端物理隔离**：管理端 (`/admin-client`) 与游戏端完全独立，拥有独立入口和认证体系，普通玩家包内无任何后台代码。
- **全牌库实时监控**：界面底部常驻剩余的 52 张网格牌库，已发卡牌自动置灰。
- **智能改牌辅助**：点击玩家底牌占位符时，牌库自动高亮能使其凑成“牛牛”或“炸弹”等大牌的组合。房主只需一键点击，预设牌将在玩家搓牌瞬间隐蔽下发，做到点杀/放水于无形。

### 4. 现代化自动部署 (CI/CD)
- **GitHub Actions 工作流**：内置 `.github/workflows/deploy.yml` 脚本。
- **一键上云**：支持自动将游戏端、管理端打包，并通过 SSH 无缝推送到日本或海外服务器，完成 PM2 重启，保障抗封锁性与网络连通性。

---

## 🛠️ 技术栈 (Tech Stack)

- **前端 (游戏端 & 管理端)**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **后端**: Node.js, Express, Socket.io
- **部署**: GitHub Actions, PM2 (推荐海外节点 + CDN)

---

## 🚀 快速开始 (Getting Started)

### 1. 环境要求
- Node.js >= 18.0.0
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
# 构建游戏端
npm run build

# 构建管理端
cd admin-client
npm run build
```

---

## 🌐 部署指南 (Deployment)

项目主打海外服务器（推荐日本东京/大阪节点）部署，以获得最佳的抗封锁性和 40-80ms 的稳定延迟。

### 使用 GitHub Actions 自动部署
1. 在 GitHub 仓库的 **Settings -> Secrets and variables -> Actions** 中添加以下密钥：
   - `SERVER_HOST`: 服务器 IP 地址
   - `SERVER_USER`: SSH 登录用户名 (如 root)
   - `SERVER_SSH_KEY`: 您的私钥内容
   - `SERVER_PORT`: SSH 端口 (默认 22)
2. 推送代码到 `main` 分支，流水线将自动完成依赖安装、构建打包并重启 PM2 服务。

*建议在服务器前端配置 Cloudflare 等高防 CDN，隐藏真实 IP 并配置 WebSocket 代理，以防止恶意 DDoS 攻击。*

---

## 💼 商业运营逻辑 (Business Model)

本作的运营理念已从“赌场抽头”转型为“房卡分销”。
1. **房主（代理商）** 通过管理后台批量生成包含特定局数（如 20 局）的“房间钥匙”。
2. 房主将钥匙售卖给玩家圈子。由于系统绝对零和，玩家对账无争议，极大增加了信任度。
3. 房主可利用独立的管理端进行隐蔽的“智能发牌干预”，这一核心功能可作为“高级房卡”的溢价卖点，向特定的二级代理进行推销。

---

## 📄 许可证 (License)

本项目采用 MIT 许可证，详情请参见 [LICENSE](LICENSE) 文件。

> **免责声明**：本项目仅供技术研究、架构学习与棋牌游戏开发交流使用。请严格遵守您所在国家和地区的法律法规，严禁将本项目用于任何非法赌博活动。