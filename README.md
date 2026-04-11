# 至尊斗牛 - 抢庄牛牛

这是一个基于 React、Tailwind CSS 和 Socket.io 构建的现代化房卡制/金币制多人在线棋牌游戏系统。

## 服务器部署指南

如果你需要重新从 GitHub 拉取仓库文件来部署 app 前端和 admin 后端，可以按照以下标准流程操作。

### 📦 重新拉取并部署的步骤

1. **备份当前版本**（可选但推荐）
   ```bash
   sudo cp -r /var/www/zhizundouniu /var/www/zhizundouniu.bak
   ```

2. **进入项目目录并拉取最新代码**
   ```bash
   cd /var/www/zhizundouniu
   sudo git pull origin main
   ```

3. **构建主站前端**
   ```bash
   npm install
   npm run build
   ```
   > 构建产物位于 `dist/` 目录。

4. **构建管理端前端**
   管理端位于 `admin-client` 子目录，需要单独进入并构建。
   ```bash
   cd admin-client
   npm install
   npm run build
   ```
   > 构建产物位于 `admin-client/dist/` 目录。

5. **确保 Nginx 配置指向正确的目录**
   - 主站：`root /var/www/zhizundouniu/dist;`
   - 管理端：`root /var/www/zhizundouniu/admin-client/dist;`

6. **重载 Nginx**
   ```bash
   sudo systemctl reload nginx
   ```

### ⚠️ 注意事项
- **不要直接覆盖整个目录**：如果使用 `git pull`，Git 会自动合并。如果本地有未提交的修改（比如 `dist` 目录通常被 `.gitignore` 忽略），则不会冲突。
- **证书无需重新申请**：只要域名和 Nginx 配置不变，已有的 Let's Encrypt 证书仍然有效。

### 🔄 如果完全重新克隆
如果你想把旧目录删除并重新拉取：
```bash
sudo rm -rf /var/www/zhizundouniu
sudo git clone https://github.com/AthenDrakomin-hub/zhizundouniu.git /var/www/zhizundouniu
cd /var/www/zhizundouniu
npm install && npm run build
cd admin-client && npm install && npm run build
sudo systemctl reload nginx
```