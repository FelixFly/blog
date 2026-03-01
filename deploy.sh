#!/bin/bash
# Blog 自动部署脚本
# 从 Git 仓库拉取最新代码，构建并通过符号链接原子切换实现零停机部署
#
# 目录结构:
#   /home/github/blog              项目源码（Git 仓库）
#   /home/github/blog/www/releases 构建产物版本目录
#   /home/github/blog/www/current  符号链接 → 最新版本（Nginx root 指向此处）
#
# 用法:
#   手动执行: ./deploy.sh
#   定时执行: crontab -e 添加以下内容（每 10 分钟检查一次）
#     */10 * * * * /home/github/blog/deploy.sh >> /var/log/blog-deploy.log 2>&1

set -euo pipefail

# ==================== 配置 ====================
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_BASE="$REPO_DIR/www"
RELEASES_DIR="$DEPLOY_BASE/releases"
CURRENT_LINK="$DEPLOY_BASE/current"
GIT_BRANCH="master"
KEEP_RELEASES=3
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

# 创建版本目录，复制构建产物
RELEASE_NAME="$(date '+%Y%m%d_%H%M%S')_${REMOTE_HEAD:0:8}"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
mkdir -p "$RELEASE_DIR"
cp -a build/. "$RELEASE_DIR/"

# 原子切换符号链接（ln -sfn 原子替换，Nginx 无感知）
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
log "部署完成: $RELEASE_NAME"

# 清理旧版本，保留最近 N 个
cd "$RELEASES_DIR"
RELEASE_COUNT=$(ls -1d */ 2>/dev/null | wc -l)
if [ "$RELEASE_COUNT" -gt "$KEEP_RELEASES" ]; then
    REMOVE_COUNT=$((RELEASE_COUNT - KEEP_RELEASES))
    ls -1d */ | head -n "$REMOVE_COUNT" | xargs rm -rf
    log "已清理 $REMOVE_COUNT 个旧版本，保留最近 $KEEP_RELEASES 个"
fi
