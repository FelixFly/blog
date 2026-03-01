#!/bin/bash
# Blog 自动部署脚本
# 从 Git 仓库拉取最新代码，构建并部署到 Nginx 静态目录
#
# 用法:
#   手动执行: ./deploy.sh
#   定时执行: crontab -e 添加以下内容（每 10 分钟检查一次）
#     */10 * * * * /path/to/blog/deploy.sh >> /var/log/blog-deploy.log 2>&1

set -euo pipefail

# ==================== 配置 ====================
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/var/www/blog"
GIT_BRANCH="master"
LOG_PREFIX="[blog-deploy]"
# ===============================================

log() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') $1"
}

cd "$REPO_DIR"

# 拉取最新代码
git fetch origin "$GIT_BRANCH" --quiet

LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse "origin/$GIT_BRANCH")

if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
    log "无更新，跳过部署 (HEAD: ${LOCAL_HEAD:0:8})"
    exit 0
fi

log "检测到更新: ${LOCAL_HEAD:0:8} -> ${REMOTE_HEAD:0:8}"

# 拉取合并
git pull origin "$GIT_BRANCH" --quiet
log "代码拉取完成"

# 安装依赖（仅 package-lock.json 变化时重装）
if git diff "$LOCAL_HEAD" "$REMOTE_HEAD" --name-only | grep -q "package-lock.json"; then
    log "依赖有变更，执行 npm install"
    npm install --production=false --silent
fi

# 构建
log "开始构建..."
npm run build --silent

# 部署到 Nginx 目录
mkdir -p "$DEPLOY_DIR"
rsync -a --delete build/ "$DEPLOY_DIR/"
log "部署完成 (HEAD: ${REMOTE_HEAD:0:8})"
