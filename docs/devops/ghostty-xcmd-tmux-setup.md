# Ghostty + x-cmd + tmux 终端工具链整合指南

> 打造高效、美观、可复用的现代终端工作环境

## 为什么选这三个工具？

| 工具 | 定位 | 解决的问题 |
|------|------|-----------|
| [Ghostty](https://ghostty.org/) | GPU 加速终端模拟器 | 快速、原生 UI、零配置即可用 |
| [x-cmd](https://www.x-cmd.com/) | 命令行工具箱 + 包管理器 | 一条命令安装 1000+ 工具，统一管理开发环境 |
| [tmux](https://github.com/tmux/tmux) | 终端复用器 | 会话持久化、远程不断线、多窗口管理 |

三者的关系：

```
Ghostty（渲染层）
  └── 提供高性能 GPU 渲染、原生分屏、Quick Terminal
        └── tmux（会话层）
              └── 会话持久化、远程复用、跨终端共享
                    └── x-cmd（工具层）
                          └── 工具安装、环境管理、Shell 增强
```

**简单来说：** Ghostty 负责"好看好用"，tmux 负责"不丢不断"，x-cmd 负责"啥都能装"。

## 一、Ghostty 配置

### 安装

macOS 直接从 [官网](https://ghostty.org/) 下载安装包，或使用 Homebrew：

```bash
brew install --cask ghostty
```

### 配置文件

Ghostty 的配置文件位于 `~/.config/ghostty/config`，纯文本键值对格式：

```bash
mkdir -p ~/.config/ghostty
touch ~/.config/ghostty/config
```

### 推荐配置

```ini
# ===== 字体 =====
# Ghostty 内置 JetBrains Mono 和 Nerd Fonts，零配置即可用
# 如果需要自定义字体，取消注释：
# font-family = "JetBrains Mono"
font-size = 14
font-thicken = true

# ===== 主题 =====
# 内置 100+ 主题，运行 ghostty +list-themes 查看
# 支持 light/dark 自动切换
theme = light:catppuccin-latte,dark:catppuccin-mocha

# ===== 窗口 =====
window-padding-x = 8
window-padding-y = 4
window-padding-balance = true
# macOS 原生标签栏样式
macos-titlebar-style = tabs
# 启动时窗口大小（列 x 行）
window-width = 120
window-height = 35

# ===== Quick Terminal（全局下拉终端） =====
# 类似 Quake 风格的下拉终端，随时呼出
# macOS 需要在 系统设置 → 隐私与安全 → 辅助功能 中授权 Ghostty
keybind = global:ctrl+grave_accent=toggle_quick_terminal
quick-terminal-position = top
quick-terminal-animation-duration = 0.15

# ===== tmux 整合 =====
# 启动 Ghostty 时自动连接或创建 tmux 会话
# command = tmux new-session -A -s main

# ===== 分屏快捷键 =====
# Ghostty 原生支持分屏，但如果用 tmux 管理分屏可以注释掉
# 默认: Cmd+D 水平分屏, Cmd+Shift+D 垂直分屏
# 在分屏间移动: Cmd+Option+方向键

# ===== SSH 兼容性 =====
# 自动在远程主机安装 terminfo，解决 xterm-ghostty 未识别问题
# 需要 Ghostty 1.2.0+
shell-integration-features = no-cursor,ssh-env,ssh-terminfo
```

### Ghostty 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd + N` | 新窗口 |
| `Cmd + T` | 新标签页 |
| `Cmd + D` | 水平分屏 |
| `Cmd + Shift + D` | 垂直分屏 |
| `Cmd + Option + 方向键` | 在分屏间移动 |
| `Cmd + Enter` | 分屏最大化/还原 |
| `Cmd + W` | 关闭当前面板 |
| `Ctrl + `` ` | Quick Terminal（需配置） |

> **Ghostty vs tmux 分屏？** Ghostty 原生分屏更流畅、支持 GPU 渲染，但关闭终端后分屏布局丢失。tmux 分屏可持久化、可远程恢复。建议：本地用 Ghostty 分屏 + Quick Terminal，远程用 tmux 分屏。

### SSH 兼容性问题

Ghostty 使用 `xterm-ghostty` 作为 TERM 值。远程服务器可能没有对应的 terminfo，导致报错：

```
missing or unsuitable terminal: xterm-ghostty
```

**解决方案（按推荐度排序）：**

1. **自动安装（推荐）** — 配置 `shell-integration-features = ssh-env,ssh-terminfo`，Ghostty 1.2.0+ 会自动处理
2. **手动安装 terminfo** — `infocmp -x xterm-ghostty | ssh 远程主机 -- tic -x -`
3. **SSH 配置回退** — 在 `~/.ssh/config` 中添加 `SetEnv TERM=xterm-256color`

## 二、x-cmd 配置

### 安装

```bash
eval "$(curl https://get.x-cmd.com)"
```

安装完成后，配置 Shell 自动加载：

```bash
x zsh --setup    # 如果用 zsh
# 或
x bash --setup   # 如果用 bash
```

这会在 `~/.zshrc`（或 `~/.bashrc`）中添加 x-cmd 的初始化代码。

### 核心功能速览

#### 1. 包管理器 — 秒装工具

x-cmd 内置轻量包管理器，无需 root 权限，工具安装在用户目录下：

```bash
# 安装常用工具
x pkg install ripgrep      # rg - 更快的 grep
x pkg install fd           # fd - 更快的 find
x pkg install bat          # bat - 带语法高亮的 cat
x pkg install eza          # eza - 更好的 ls
x pkg install jq           # jq - JSON 处理
x pkg install fzf          # fzf - 模糊搜索
x pkg install lazygit      # lazygit - Git TUI
x pkg install zoxide       # zoxide - 更智能的 cd
```

#### 2. 开发环境管理

不需要 nvm / pyenv / sdkman，用 `x env` 统一管理所有语言运行时：

```bash
# 安装并使用指定版本
x env use node=20          # Node.js 20
x env use python=3.12      # Python 3.12
x env use go=1.22          # Go 1.22
x env use java=21          # Java 21

# 临时使用（不影响全局）
x env try node=18

# 查看已安装的环境
x env ls
```

#### 3. 主题与补全

```bash
# 切换终端主题（配合 Ghostty 使用）
x theme

# 交互式搜索并安装工具
x env
```

#### 4. AI 能力

```bash
# 内置 AI 对话
x ai chat "解释一下 tmux 的 prefix key"

# AI 辅助执行任务
x ai task "查找当前目录下最大的 10 个文件"
```

### 与 Ghostty + tmux 的整合

x-cmd 在 tmux 会话中正常工作，无需额外配置。确保 `~/.zshrc` 中 x-cmd 的初始化代码在 tmux 判断之前加载即可。

## 三、tmux 配置

### 安装

```bash
# macOS
brew install tmux

# 或通过 x-cmd
x pkg install tmux
```

### 配置文件

tmux 的配置文件位于 `~/.tmux.conf`：

```bash
# ===== 基础设置 =====
# 前缀键改为 Ctrl+a（默认 Ctrl+b 太远了）
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# 窗口和面板编号从 1 开始（0 在键盘太远）
set -g base-index 1
setw -g pane-base-index 1
# 关闭窗口后自动重新编号
set -g renumber-windows on

# 启用鼠标（滚动、点击选面板、拖动调整大小）
set -g mouse on

# 历史记录行数
set -g history-limit 50000

# 减少延迟（避免与 vim Esc 冲突）
set -sg escape-time 0

# ===== 终端兼容 =====
# 支持 256 色和 true color
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-ghostty:RGB"

# 启用 Kitty 键盘协议（Ghostty 支持）
set -s extended-keys on

# ===== 分屏快捷键 =====
# 用 | 和 - 替代默认的 % 和 "（更直观）
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
unbind '"'
unbind %

# 新建窗口时保持当前路径
bind c new-window -c "#{pane_current_path}"

# ===== 面板导航 =====
# Alt + 方向键切换面板（无需前缀键）
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# 调整面板大小
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# ===== 复制模式 =====
# 使用 vi 风格的复制模式
setw -g mode-keys vi
bind -T copy-mode-vi v send-keys -X begin-selection
bind -T copy-mode-vi y send-keys -X copy-selection-and-cancel

# macOS 剪贴板整合
if-shell "uname | grep -q Darwin" {
    bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "pbcopy"
}

# ===== 状态栏 =====
set -g status-position bottom
set -g status-interval 5
set -g status-style "bg=default,fg=white"
set -g status-left "#[fg=blue,bold] #S "
set -g status-right "#[fg=white] %H:%M "
set -g status-left-length 30
setw -g window-status-format " #I:#W "
setw -g window-status-current-format "#[fg=green,bold] #I:#W "

# ===== 快捷操作 =====
# r 重新加载配置
bind r source-file ~/.tmux.conf \; display-message "Config reloaded"
```

### tmux 常用操作速查

所有 tmux 命令都需要先按**前缀键**（上面配置为 `Ctrl+a`），再按对应的键。

#### 会话管理

```bash
# 终端外操作
tmux new -s work         # 创建名为 work 的会话
tmux ls                  # 列出所有会话
tmux attach -t work      # 连接到 work 会话
tmux kill-session -t work # 删除会话

# 终端内操作（先按 Ctrl+a）
# Ctrl+a d    — 分离会话（回到普通终端，会话后台运行）
# Ctrl+a s    — 选择会话
# Ctrl+a $    — 重命名会话
```

#### 窗口管理

```bash
# Ctrl+a c    — 新建窗口
# Ctrl+a ,    — 重命名窗口
# Ctrl+a n    — 下一个窗口
# Ctrl+a p    — 上一个窗口
# Ctrl+a 1-9  — 切换到指定窗口
# Ctrl+a &    — 关闭窗口
```

#### 面板管理

```bash
# Ctrl+a |    — 水平分屏（上面自定义的）
# Ctrl+a -    — 垂直分屏（上面自定义的）
# Alt+方向键  — 切换面板（无需前缀键）
# Ctrl+a z    — 面板最大化/还原
# Ctrl+a x    — 关闭面板
```

## 四、三者整合：完整工作流

### 场景一：日常开发

```
1. 打开 Ghostty（或 Ctrl+` 呼出 Quick Terminal）
2. 自动进入 tmux 会话
3. tmux 窗口 1：编辑器（vim/neovim）
4. tmux 窗口 2：开发服务器（npm run dev）
5. tmux 窗口 3：Git 操作（lazygit）
6. 关闭 Ghostty，会话不丢失
7. 下次打开，tmux attach 恢复所有窗口
```

### 场景二：远程服务器

```
1. Ghostty SSH 到远程服务器
   （shell-integration-features 自动安装 terminfo，无兼容问题）
2. tmux new -s deploy 创建会话
3. 执行部署任务
4. Ctrl+a d 分离会话
5. 网络断开也不影响，重连后 tmux attach -t deploy 恢复
```

### 场景三：多项目并行

```
tmux 会话 "project-a"  → 窗口 1: 前端  窗口 2: 后端  窗口 3: 数据库
tmux 会话 "project-b"  → 窗口 1: 代码  窗口 2: 测试
tmux 会话 "ops"        → 窗口 1: 监控  窗口 2: 日志

在 Ghostty 中通过 Ctrl+a s 随时切换会话
```

### 自动化启动脚本

创建 `~/.local/bin/dev-start.sh`，一键搭建开发环境：

```bash
#!/usr/bin/env bash
# 开发环境一键启动

SESSION="dev"

# 如果会话已存在，直接连接
tmux has-session -t $SESSION 2>/dev/null
if [ $? -eq 0 ]; then
    tmux attach -t $SESSION
    exit 0
fi

# 创建新会话
tmux new-session -d -s $SESSION -n editor

# 窗口 1: 编辑器
tmux send-keys -t $SESSION:editor "vim ." Enter

# 窗口 2: 开发服务器
tmux new-window -t $SESSION -n server
tmux send-keys -t $SESSION:server "echo '等待启动开发服务器...'" Enter

# 窗口 3: Git
tmux new-window -t $SESSION -n git
tmux send-keys -t $SESSION:git "lazygit" Enter

# 切换到第一个窗口并连接
tmux select-window -t $SESSION:editor
tmux attach -t $SESSION
```

在 Ghostty 配置中可以将它设为启动命令：

```ini
command = ~/.local/bin/dev-start.sh
```

## 五、常见问题

### tmux 中颜色显示异常

确保 Ghostty 配置和 tmux 配置的终端类型匹配：

```ini
# Ghostty config — 通常不需要手动设置，默认即可
# term = xterm-ghostty

# tmux.conf
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-ghostty:RGB"
```

### tmux 中特殊键（Home/End/方向键）不工作

启用扩展键支持：

```bash
# ~/.tmux.conf
set -s extended-keys on
```

### x-cmd 在 tmux 中不生效

确保 `~/.zshrc` 中 x-cmd 初始化代码的位置正确 —— 不要放在 `if [[ -z "$TMUX" ]]` 判断内部，x-cmd 需要在所有 Shell 实例中加载。

### Ghostty Quick Terminal 不工作

macOS 需要授权：**系统设置 → 隐私与安全 → 辅助功能 → 勾选 Ghostty**。

## 六、推荐的完整配置文件

将以上配置整合后，你需要维护的文件清单：

```
~/.config/ghostty/config     # Ghostty 配置
~/.tmux.conf                 # tmux 配置
~/.zshrc                     # Shell 配置（含 x-cmd 初始化）
~/.local/bin/dev-start.sh    # 可选：一键启动脚本
```

整个工具链的优势在于**各司其职、互不冲突**：

- **Ghostty** 专注渲染层：GPU 加速、原生 UI、Quick Terminal
- **tmux** 专注会话层：持久化、远程恢复、多会话管理
- **x-cmd** 专注工具层：包管理、环境管理、Shell 增强

三者组合起来，覆盖了终端工作的完整链路。
