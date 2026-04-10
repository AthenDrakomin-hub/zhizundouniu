# Tasks
- [x] Task 1: **资源剥离与归档**: 从 `niuma-wj-client` 和 `niuma-wj-client-cocos` 中深度检索并提取斗牛（Niuniu/NiuNiu100）游戏专属的特效贴图（如 `cow_*.png`, `win.png`, `coin_gold.png`, `bg.jpg` 等），并复制到我们项目的 `public/images/ui` 目录下。
- [x] Task 2: **前端视觉大换血**: 修改 `src/App.tsx` 中的牌型渲染逻辑（`getBullName(bullResult.type)`）。不再渲染纯文本，而是根据牌型分值（0-10 或五小牛等）渲染刚提取出来的精美艺术字贴图（`cow_x.png`）。
- [x] Task 3: **完善高潮特写**: 引入 `niuma-wj` 里的 `win_light.png` (胜利高光) 和 `result_bg.png` (结算底板)，在单局结束时，对赢家施加带有高质量贴图的 `framer-motion` 闪烁光效，强化视觉爆点。
- [x] Task 4: **后端架构拆解重构 (架构学习)**: 在 `server.ts` 中，剥离目前的单文件逻辑。创建 `src/server/routes` 处理 HTTP 接口（大厅/登录/文件上传），创建 `src/server/game` 处理核心的 Socket 发牌和控制逻辑。为后续接入 Redis 负载均衡打好基础。
- [x] Task 5: **管理端面板升级**: 参考 `niuma-wj/web-ui`，在 `admin-client/src/App.tsx` 的顶部增加数据大盘看板（今日总局数、当前在线房间数、系统总抽水/盈亏），使后台真正具备平台级运营能力。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] and [Task 5] can be executed independently from the visual tasks.