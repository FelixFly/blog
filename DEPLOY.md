# FelixFly Tech Blog 部署指南

基于 Docusaurus 3 构建的技术文档站，使用 Nginx 静态托管部署。

## 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18.0 |
| npm | >= 8.0 |
| Nginx | >= 1.18 |
| Git | >= 2.0 |

## 目录结构

项目源码与访问目录分离，构建期间站点正常访问：

```
/home/github/blog/                  # Git 仓库（项目源码）
  ├── deploy.sh                     # 自动部署脚本
  ├── docs/                         # 文档内容
  ├── src/                          # 页面组件
  ├── www/                          # 部署目录（Nginx 访问，已 gitignore）
  │   ├── current -> releases/xxx   # 符号链接，指向最新版本
  │   └── releases/                 # 历史版本
  │       ├── 20260301_100000_ab12cd34/
  │       ├── 20260301_120000_ef56gh78/
  │       └── 20260301_140000_ij90kl12/  ← current
  └── ...
```

Nginx root 指向 `/home/github/blog/www/current`，`deploy.sh` 构建完成后通过 `ln -sfn` 原子切换符号链接，Nginx 无需 reload，零停机。

## 本地开发

```bash
npm install        # 安装依赖
npm run start      # 开发模式（热更新）
npm run build      # 构建
npm run serve      # 预览构建产物
```

## 服务器首次部署

### 1. 克隆项目

```bash
git clone https://github.com/FelixFly/blog.git /home/github/blog
cd /home/github/blog
npm install
```

### 2. 修改站点配置

编辑 `docusaurus.config.ts`，修改 `url` 为实际域名：

```typescript
url: 'https://www.felixfly.top',
baseUrl: '/',
```

### 3. 首次构建部署

```bash
./deploy.sh
```

脚本会自动创建 `www/releases/` 和 `www/current` 符号链接。

### 4. 配置 Nginx

将 `nginx.conf` 复制到服务器并修改域名：

```bash
cp nginx.conf /etc/nginx/conf.d/blog.conf
# 编辑 /etc/nginx/conf.d/blog.conf，替换 www.felixfly.top
nginx -t && nginx -s reload
```

### 5. 配置定时自动部署

```bash
crontab -e
```

添加以下内容（每 10 分钟检查 Git 更新）：

```cron
*/10 * * * * /home/github/blog/deploy.sh >> /var/log/blog-deploy.log 2>&1
```

### 6. 配置 HTTPS（可选）

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx   # Debian/Ubuntu
yum install certbot python3-certbot-nginx   # CentOS/RHEL

# 自动配置 HTTPS
certbot --nginx -d www.felixfly.top

# 验证证书自动续期
certbot renew --dry-run
```

## deploy.sh 工作流程

```
git fetch → 有更新? → git pull → npm install(按需) → npm run build
                ↓ 无更新                                     ↓
              跳过退出                           cp build → releases/时间戳_commitId/
                                                         ↓
                                              ln -sfn → current（原子切换）
                                                         ↓
                                              清理旧版本（保留最近 3 个）
```

脚本配置项（`deploy.sh` 顶部）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `REPO_DIR` | 脚本所在目录 | Git 仓库路径 |
| `DEPLOY_BASE` | `$REPO_DIR/www` | 部署根目录（项目下的 www 子目录） |
| `GIT_BRANCH` | `master` | 拉取分支 |
| `KEEP_RELEASES` | `3` | 保留历史版本数 |

日志输出示例：

```
[blog-deploy] 2026-03-01 10:00:01 无更新，跳过部署 (HEAD: be96dd4f)
[blog-deploy] 2026-03-01 10:10:01 检测到更新: be96dd4f -> a1b2c3d4
[blog-deploy] 2026-03-01 10:10:03 代码拉取完成
[blog-deploy] 2026-03-01 10:10:30 开始构建...
[blog-deploy] 2026-03-01 10:11:05 部署完成: 20260301_101005_a1b2c3d4
[blog-deploy] 2026-03-01 10:11:05 已清理 1 个旧版本，保留最近 3 个
```

## 版本回滚

如需回滚到上一个版本，手动切换符号链接即可：

```bash
# 查看可用版本
ls /home/github/blog/www/releases/

# 切换到指定版本
ln -sfn /home/github/blog/www/releases/20260301_100000_ab12cd34 /home/github/blog/www/current
```

无需重启 Nginx，切换即生效。

## 评论功能（Giscus）

评论基于 GitHub Discussions，启用前需完成：

1. 将 `FelixFly/blog` 仓库设为 **public**
2. 仓库开启 **Discussions**（Settings > Features > Discussions）
3. 安装 **giscus app**：https://github.com/apps/giscus
4. 访问 https://giscus.app/zh-CN ，输入仓库名获取 `repoId` 和 `categoryId`
5. 更新 `src/components/Comment.tsx` 中的对应值

## Nginx 配置说明

| 配置项 | 作用 |
|--------|------|
| `root /home/github/blog/www/current` | 指向符号链接，部署时原子切换 |
| `try_files $uri $uri/ /index.html` | SPA 路由回退，刷新页面不会 404 |
| `location /assets/` + `expires 1y` | Docusaurus 静态资源带 hash，安全长期缓存 |
| `gzip on` | 启用压缩，减少传输体积 |
| `location ~ /\.` + `deny all` | 禁止访问 `.git` 等隐藏文件 |
