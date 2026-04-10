# NiuMa 完整项目全栈融合与资产提取 Spec

## Why
目前我们的《至尊斗牛》采用的是单体 Node.js (React + SQLite) 架构，前端的图片素材也是东拼西凑，难以支撑未来的百人场或高并发运营。而 [niuma-wj](https://github.com/niuma-wj) 是一个极其完整的工业级全栈棋牌开源项目，包含了 C++ 游戏服务器、Java WEB 服务器、Vue 后台前端、以及 Unity3D/Cocos 客户端。其客户端内部包含了大量高质量的切图资源（例如牛一到牛牛的专属艺术字、百人牛牛桌面、金币包、结算特写等）。为了让我们的项目达到真正的商业化完全体，我们需要“偷天换日”，将其优质的**静态资产**和优秀的**架构理念**融入当前项目。

## What Changes
- **前端资产大换血 (UI/Assets)**: 
  - 从 `niuma-wj/client` 提取高质量的 `cow_1.png` ~ `cow_13.png` (牌型艺术字)、`coin_gold.png` (真实金币)、`win_light.png` (高光特效) 等素材。
  - 用提取的高质量艺术字替换当前用文本渲染的牌型显示（`getBullName`）。
  - 用提取的高清 `bg.jpg` 尝试替代当前的纯 CSS 渐变，如果效果好则完全采用，如果不好则提取其局部桌布纹理。
- **后端架构升级规划 (Backend Architecture Reference)**:
  - 学习其 `Web Server` 与 `Game Server` 分离的设计。
  - **BREAKING**: 将当前的单体 Node.js 服务在逻辑上拆分为：`HTTP API 路由服务` (负责登录/鉴权/大厅分配) 和 `Socket.io 游戏逻辑服务` (专门处理房间内打牌)，为未来接入 Redis/RabbitMQ 实现多服分布式扩展打下基础。
- **后台管理端吸收 (Admin UI)**:
  - 参考 `niuma-wj/web-ui` 的仪表盘设计，对现有的 `admin-client` 增加更多数据可视化（如当日流水、房间负载、胜率调控大盘）。

## Impact
- Affected specs: 游戏前端视觉呈现、结算动画、服务端路由架构。
- Affected code:
  - `src/App.tsx` (牌型显示与动画组件)
  - `src/components/Card.tsx` 
  - `server.ts` (API 与 Socket 路由解耦)
  - `public/images/*` (大批量资源替换)

## ADDED Requirements
### Requirement: 牌型艺术字视觉
系统 SHALL 使用高质量的图像素材来渲染玩家的最终牌型（如“牛七”、“五小牛”），而非普通的文字文本。

#### Scenario: 牌型展示
- **WHEN** 游戏进入结算，玩家亮牌为“牛八”
- **THEN** 玩家卡片下方不再显示普通的“牛八”黄色文字，而是展示 `cow_8.png` 带有 3D 浮雕质感的图片特效。

### Requirement: 核心路由架构分离
系统 SHALL 在 Node.js 服务内部，将 HTTP 路由逻辑（玩家大厅/鉴权）与 Socket 游戏逻辑（牌局操作）拆分到不同的模块中。