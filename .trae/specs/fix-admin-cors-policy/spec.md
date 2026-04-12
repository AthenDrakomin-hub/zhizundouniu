# Fix Admin CORS Policy Spec

## Why
管理端 `https://admin.yefeng.us.cc` 连接主站后端接口 `https://app.yefeng.us.cc/socket.io/` 时，依然被 CORS（跨域资源共享）策略拦截。由于之前设置了 `credentials: true` 配合 `origin: "*"`，在严格的 CORS 策略下，带有凭证的请求不允许使用通配符作为 origin，这导致浏览器拒绝了连接。同时，前端密码输入框报了缺少 `autocomplete` 的警告。

## What Changes
- 修改后端的 CORS 配置：将 `server.ts` 中的 Express 和 Socket.io 的 CORS `origin` 改为动态允许请求来源，并正确配置 `credentials` 跨域头。
- 修改前端的密码输入框：添加 `autoComplete="new-password"` 属性，消除 Chrome 控制台警告。

## Impact
- Affected specs: 无
- Affected code: `server.ts`, `admin-client/src/App.tsx`

## ADDED Requirements
### Requirement: 稳定的 WebSocket 连接
系统 SHALL 允许来自任何域（或特定域名）的带有凭证的 Socket.io 跨域连接。

#### Scenario: 成功连接
- **WHEN** 用户在管理端页面加载时，尝试向主站后端发起轮询（polling）或 WebSocket 连接
- **THEN** 后端能够正确返回 `Access-Control-Allow-Origin: 真实的 Origin` 并且不报 CORS 错误。
