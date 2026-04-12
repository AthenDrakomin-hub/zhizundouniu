# Tasks
- [ ] Task 1: 修复后端 CORS 配置：在 `server.ts` 中，将 Express 和 Socket.io 的 CORS `origin` 改为动态允许所有源（根据请求头设置），并正确配置 `credentials`。
- [ ] Task 2: 修复前端 Input autocomplete 警告：在 `admin-client/src/App.tsx` 的密码输入框中添加 `autoComplete="new-password"`。
- [ ] Task 3: 重新编译前后端并重启后端服务，以确保配置生效。