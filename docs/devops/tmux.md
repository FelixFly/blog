---
title: "Tmux"
sidebar_position: 7
tags:
  - Linux
  - Tmux
---

# Tmux 使用指南

> Tmux（Terminal Multiplexer）是一个终端复用器，可以在一个终端窗口中管理多个会话，即使断开 SSH 连接，程序也能在后台继续运行。

## 为什么需要 Tmux

当你通过 SSH 连接远程服务器时，如果网络断开或者关闭终端，正在运行的程序就会被终止。Tmux 解决了这个问题：

- **会话保持**：断开连接后，程序继续在后台运行，重新连接后可以恢复
- **窗口分屏**：一个终端中同时查看多个命令行界面
- **多会话管理**：在多个任务之间快速切换

## 安装

```bash
# CentOS / RHEL
yum install -y tmux

# Ubuntu / Debian
apt install -y tmux

# macOS
brew install tmux
```

## 核心概念

Tmux 有三个层级：

```
Session（会话）
  └── Window（窗口）
        └── Pane（面板）
```

- **Session**：一个独立的工作空间，可包含多个窗口
- **Window**：类似浏览器的标签页，一个会话中可有多个窗口
- **Pane**：将一个窗口分割成多个区域

## 前缀键

Tmux 的所有快捷键都需要先按**前缀键**，默认是 `Ctrl + b`，然后松开，再按功能键。

下文用 `prefix` 表示 `Ctrl + b`。

## 会话管理

### 命令行操作

```bash
# 新建会话（自动编号）
tmux

# 新建命名会话（推荐）
tmux new -s my-session

# 查看所有会话
tmux ls

# 接入已有会话
tmux attach -t my-session
# 简写
tmux a -t my-session

# 杀死会话
tmux kill-session -t my-session

# 杀死所有会话
tmux kill-server
```

### 快捷键操作

| 快捷键 | 功能 |
|--------|------|
| `prefix` + `d` | 分离当前会话（detach），回到普通终端 |
| `prefix` + `s` | 列出所有会话，可上下选择切换 |
| `prefix` + `$` | 重命名当前会话 |

## 窗口管理

| 快捷键 | 功能 |
|--------|------|
| `prefix` + `c` | 新建窗口 |
| `prefix` + `w` | 列出所有窗口，可选择切换 |
| `prefix` + `数字键` | 切换到指定编号的窗口（0-9） |
| `prefix` + `n` | 切换到下一个窗口 |
| `prefix` + `p` | 切换到上一个窗口 |
| `prefix` + `,` | 重命名当前窗口 |
| `prefix` + `&` | 关闭当前窗口（会提示确认） |

## 面板管理

### 分屏

| 快捷键 | 功能 |
|--------|------|
| `prefix` + `%` | 左右分屏（垂直分割） |
| `prefix` + `"` | 上下分屏（水平分割） |

### 切换面板

| 快捷键 | 功能 |
|--------|------|
| `prefix` + `方向键` | 切换到指定方向的面板 |
| `prefix` + `o` | 切换到下一个面板 |
| `prefix` + `;` | 切换到上一个面板 |
| `prefix` + `q` | 显示面板编号，按数字键可快速切换 |

### 调整面板

| 快捷键 | 功能 |
|--------|------|
| `prefix` + `z` | 最大化/恢复当前面板（全屏切换） |
| `prefix` + `x` | 关闭当前面板（会提示确认） |
| `prefix` + `空格` | 切换面板布局 |
| `prefix` + `{` | 当前面板与上一个面板交换位置 |
| `prefix` + `}` | 当前面板与下一个面板交换位置 |
| `prefix` + `Ctrl+方向键` | 按方向调整面板大小 |

## 复制模式

Tmux 有自己的复制粘贴机制：

```
1. prefix + [        进入复制模式
2. 用方向键移动光标到起始位置
3. 按 空格 开始选择
4. 用方向键选择文本
5. 按 Enter 复制选中内容
6. prefix + ]        粘贴
```

在复制模式中，可以用 `q` 退出。

## 常用场景

### 场景一：服务器上运行长时间任务

```bash
# 1. 创建一个新会话
tmux new -s deploy

# 2. 在会话中运行部署脚本
./deploy.sh

# 3. 按 Ctrl+b 然后按 d，分离会话
# 现在可以安全地关闭终端

# 4. 下次连接服务器后，重新接入会话
tmux a -t deploy
```

### 场景二：同时监控多个服务

```bash
# 1. 创建会话
tmux new -s monitor

# 2. 上下分屏
# prefix + "

# 3. 上面面板运行：查看日志
tail -f /var/log/app.log

# 4. 切换到下面面板（prefix + 方向键下）
# 5. 再左右分屏
# prefix + %

# 6. 分别运行系统监控命令
top
# 切换到另一个面板运行
watch df -h
```

### 场景三：开发环境多窗口

```bash
# 创建会话
tmux new -s dev

# 窗口0：代码编辑（默认）
vim app.js

# 新建窗口1（prefix + c）：运行服务
npm run dev

# 新建窗口2（prefix + c）：Git操作
git status

# 用 prefix + 数字键 在窗口间快速切换
```

## 配置文件

Tmux 的配置文件位于 `~/.tmux.conf`，以下是一些常用配置：

```bash
# 将前缀键改为 Ctrl+a（更顺手）
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 开启鼠标支持（可用鼠标点击切换面板、拖动调整大小）
set -g mouse on

# 面板分割快捷键改为更直观的 | 和 -
bind | split-window -h
bind - split-window -v

# 面板切换使用 Alt+方向键（无需前缀键）
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# 窗口编号从 1 开始（默认从 0 开始）
set -g base-index 1
setw -g pane-base-index 1

# 状态栏美化
set -g status-bg colour235
set -g status-fg colour136
```

修改配置后，在 tmux 中执行以下命令使其生效：

```bash
# 方法一：在 tmux 中按 prefix + : 进入命令模式，输入
source-file ~/.tmux.conf

# 方法二：直接在终端执行
tmux source-file ~/.tmux.conf
```

## 速查表

| 操作 | 命令/快捷键 |
|------|-------------|
| 新建会话 | `tmux new -s name` |
| 列出会话 | `tmux ls` |
| 接入会话 | `tmux a -t name` |
| 分离会话 | `prefix` + `d` |
| 新建窗口 | `prefix` + `c` |
| 切换窗口 | `prefix` + `数字` |
| 左右分屏 | `prefix` + `%` |
| 上下分屏 | `prefix` + `"` |
| 切换面板 | `prefix` + `方向键` |
| 全屏面板 | `prefix` + `z` |
| 关闭面板 | `prefix` + `x` |
| 关闭窗口 | `prefix` + `&` |
