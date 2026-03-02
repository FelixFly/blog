# AI 编程工具全景指南

> 覆盖 IDE、CLI、插件三大类，包含 macOS 和 Windows 安装使用方式

## 工具全景

当前 AI 编程工具可以分为三大类：

| 类型 | 工具 | 特点 |
|------|------|------|
| **AI IDE** | Cursor、Windsurf、Trae | 完整的编辑器，AI 深度集成 |
| **CLI 终端工具** | Claude Code、Codex CLI、Gemini CLI、Aider | 终端原生，适合命令行工作流 |
| **IDE 插件** | GitHub Copilot、Cline、Amazon Q | 在现有编辑器上增加 AI 能力 |
| **管理工具** | cc-switch | 多工具切换管理 |

### 一览对比

| 工具 | 类型 | 平台 | 价格 | 亮点 |
|------|------|------|------|------|
| **Cursor** | IDE | Mac / Win / Linux | 免费 ~ $200/月 | VS Code 基础重构，多模型切换 |
| **Windsurf** | IDE | Mac / Win | 免费 ~ $60/月 | 首个 Agentic IDE，实时预览 |
| **Trae** | IDE | Mac / Win | 免费 | 字节出品，免费用 Claude + GPT-4o |
| **Claude Code** | CLI | Mac / Win / Linux | 按量付费 | Anthropic 官方，深度代码理解 |
| **Codex CLI** | CLI | Mac / Win / Linux | ChatGPT 订阅 | OpenAI 官方，Rust 构建 |
| **Gemini CLI** | CLI | Mac / Win / Linux | 免费额度 | Google 官方，内置搜索 |
| **Aider** | CLI | Mac / Win / Linux | 免费（开源） | 支持任意 LLM，Git 原生 |
| **GitHub Copilot** | 插件 + CLI | Mac / Win / Linux | 免费 ~ $39/月 | GitHub 深度整合，企业级 |
| **Cline** | VS Code 插件 | Mac / Win / Linux | 免费（开源） | 模型无关，自主执行能力 |
| **Amazon Q** | 插件 | Mac / Win / Linux | 免费 ~ $19/月 | AWS 原生，代码迁移转换 |
| **cc-switch** | 管理工具 | Mac / Win / Linux | 免费（开源） | 多 AI 工具统一切换管理 |

---

## AI IDE

### Cursor

基于 VS Code 深度重构的 AI 编辑器，AI 能力不是"加上去"的插件，而是编辑器的核心。

#### 安装

**macOS：**

```bash
# 方式一：官网下载 .dmg
# https://cursor.com/download

# 方式二：Homebrew
brew install --cask cursor
```

**Windows：**

从 [cursor.com/download](https://cursor.com/download) 下载 .exe 安装包，双击运行安装向导。

#### 价格

| 计划 | 价格 | 说明 |
|------|------|------|
| Free | $0 | 无限慢速请求，有限快速请求 |
| Pro | $20/月 | $20 推理额度 |
| Pro+ | $60/月 | 3 倍 Pro 额度 |
| Ultra | $200/月 | 20 倍 Pro 额度 |
| Team | $40/人/月 | SSO、管理员功能 |

支持自带 API Key（OpenAI / Anthropic），绕过额度限制。

#### 核心快捷键

| 快捷键（Mac / Win） | 功能 |
|---------------------|------|
| `Cmd+K` / `Ctrl+K` | 内联编辑（选中代码后精确修改） |
| `Cmd+L` / `Ctrl+L` | 打开 AI 对话面板 |
| `Cmd+I` / `Ctrl+I` | Composer（多文件 Agent 模式） |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | 将选中代码加入对话上下文 |
| `Cmd+K`（终端中） / `Ctrl+K` | 生成终端命令 |
| `Tab` | 接受代码建议 |
| `@filename` | 在对话中引用文件 |

#### 支持模型

Claude Sonnet / Opus、GPT 系列、Gemini Pro、Grok，可在同一会话中切换。

---

### Windsurf

由 Codeium 团队打造的 Agentic IDE，主打 AI Agent 驱动的自主开发体验。

#### 安装

**macOS / Windows：** 从 [windsurf.com](https://windsurf.com) 下载对应平台安装包。

#### 价格

| 计划 | 价格 | 说明 |
|------|------|------|
| Free | $0 | 25 credits/月 |
| Pro | $15/月 | 500 credits/月，完整 Cascade 能力 |
| Teams | $30/人/月 | 团队管理 |
| Enterprise | $60/人/月 | 企业级 |

#### 核心功能

- **Cascade** — AI Agent，能自主规划、生成模块、重构代码，带有代码库上下文记忆
- **Windsurf Tab** — 智能动作键，自动导入、生成样板代码、建议依赖
- **Live Preview** — 前端开发实时预览
- **One-Click Deploy** — 直接从 IDE 部署

---

### Trae

字节跳动出品的 AI 编辑器，基于 VS Code 构建，最大卖点是**完全免费使用高端模型**。

#### 安装

**macOS / Windows：** 从 [trae.ai](https://www.trae.ai/) 下载安装包。

#### 价格

完全免费，无限使用 Claude 3.5 Sonnet 和 GPT-4o。

#### 核心功能

- **Builder 模式** — 分析需求、拆分步骤、生成代码前先展示预览
- 支持多种模型（国际版：Claude、GPT-4o；国内版：豆包、DeepSeek）
- 多模态交互

#### 注意事项

有隐私顾虑：即使关闭遥测，仍有较多网络请求。敏感项目建议谨慎使用。

---

## CLI 终端工具

### Claude Code

Anthropic 官方出品的命令行 AI 编程工具，深度理解代码库，支持多文件编辑、测试、Git 操作。

#### 安装

**macOS / Linux：**

```bash
npm install -g @anthropic-ai/claude-code
```

**Windows：**

需要通过 WSL2（Windows Subsystem for Linux）使用：

```bash
# 1. 安装 WSL2（PowerShell 管理员模式）
wsl --install
# 安装完成后重启电脑，首次启动 WSL 会要求设置用户名和密码

# 2. 在 WSL 中安装 Node.js（二选一）

# 方式一：通过 nvm 安装（推荐，方便管理多版本）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts

# 方式二：通过 apt 安装（简单快速）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 验证安装
node -v   # 应显示 v22.x 或更高
npm -v    # 应显示 10.x 或更高

# 4. 安装 Claude Code
npm install -g @anthropic-ai/claude-code
```

#### 价格

需要 Anthropic API Key 或 Claude Max 订阅（$100/月 或 $200/月），按 token 用量计费。

#### 使用方式

```bash
# 在项目目录启动
claude

# 带初始提示启动
claude "解释这个项目的架构"

# 非交互模式
claude -p "修复 login 函数的空指针问题"

# 继续上次对话
claude --continue
```

#### 核心能力

- 深度代码库理解（自动分析项目结构）
- 多文件编辑、创建、删除
- 运行测试和终端命令
- Git 操作（提交、PR、分支管理）
- Skill 系统（可复用工作流扩展）
- MCP 协议支持（扩展外部工具）

#### 常用斜杠命令

| 命令 | 功能 |
|------|------|
| `/help` | 查看帮助 |
| `/clear` | 清除对话 |
| `/compact` | 压缩上下文 |
| `/cost` | 查看当前 token 用量 |
| `/model` | 切换模型 |

---

### Codex CLI

OpenAI 官方的开源终端编程 Agent，Rust 构建，速度快。

#### 安装

**macOS / Linux：**

```bash
npm install -g @openai/codex
```

**Windows：**

```bash
# 方式一：通过 WSL2（推荐，与 Claude Code 共用环境）
# 如果已按上面 Claude Code 的步骤安装了 WSL2 + Node.js，直接运行：
npm install -g @openai/codex

# 方式二：原生 Windows（需先安装 Node.js）
# 从 https://nodejs.org 下载 LTS 版安装包，安装后在 PowerShell 中运行：
npm install -g @openai/codex
```

#### 价格

需要 ChatGPT Plus / Pro / Business / Enterprise 订阅，或 OpenAI API Key。

#### 使用方式

```bash
# 启动交互模式
codex

# 带提示启动
codex "add a dark mode toggle to the settings page"

# 安静模式（自动执行，无需确认）
codex --quiet "fix all TypeScript errors"
```

#### 核心能力

- 终端原生 Agent，支持多步任务
- 人在回路（Human-in-the-loop）：编辑前可逐步审查
- 支持模型：codex-1、GPT-5.3-Codex 等
- 开源（MIT 协议）

---

### Gemini CLI

Google 官方的终端 AI 编程工具，基于 Gemini 模型，内置 Google 搜索能力。

#### 安装

**macOS / Windows / Linux：**

```bash
# 全局安装
npm install -g @google-gemini/cli

# 或免安装直接运行
npx @google-gemini/cli
```

#### 价格

| 方式 | 费用 | 说明 |
|------|------|------|
| Google 账号登录 | 免费 | 60 次/分钟，1000 次/天 |
| Gemini API Key | 按量付费 | 解锁 Gemini 3 Pro、更高限额 |

#### 使用方式

```bash
# 启动交互模式
gemini

# 带提示启动
gemini "explain the architecture of this project"
```

#### 核心能力

- 内置 Google 搜索（代码问题直接联网查）
- 文件操作、Shell 命令执行、网页抓取
- MCP 协议支持
- Extensions 系统（Figma、Stripe 等第三方集成）
- 100 万 token 上下文窗口（免费版即可用）

---

### Aider

开源的 AI 结对编程 CLI 工具，最大特点是**支持任意 LLM** + **Git 原生**。

#### 安装

**macOS / Linux：**

```bash
pip install aider-chat

# 或
brew install aider
```

**Windows：**

```bash
pip install aider-chat
```

#### 价格

免费开源。自带 API Key（Anthropic / OpenAI / 本地模型均可）。

#### 使用方式

```bash
# 使用 Claude
aider --model claude-3.5-sonnet

# 使用 GPT-4
aider --model gpt-4o

# 使用本地模型（通过 Ollama）
aider --model ollama/deepseek-coder

# 添加文件到上下文
aider src/main.py src/utils.py
```

#### 核心能力

- 支持任意 LLM（Claude、GPT、DeepSeek、本地模型）
- Git 原生 — 每次修改自动提交，方便回滚
- 代码库地图（AST 感知），大项目也能精准定位
- 支持 Python、JS、Rust、Go、Java 等主流语言
- 编辑后自动 lint + 修复

---

## IDE 插件

### GitHub Copilot

最早也最广泛的 AI 编程助手，深度整合 GitHub 生态。

#### 安装

在 VS Code / JetBrains / Neovim 中搜索安装 "GitHub Copilot" 插件。

CLI 版本（2026 年 2 月 GA）：

```bash
# 通过 GitHub CLI 安装
gh extension install github/gh-copilot
```

#### 价格

| 计划 | 价格 | 说明 |
|------|------|------|
| Free | $0 | 2000 补全 + 50 高级请求/月 |
| Pro | $10/月 | 更多请求 |
| Pro+ | $39/月 | 高级模型、更多能力 |
| Business | $19/人/月 | 团队管理 |
| Enterprise | $39/人/月 | 企业策略控制 |

#### 核心能力

- 代码补全（最成熟的体验）
- Copilot Chat（对话式编程）
- **Autopilot 模式** — 多步任务自主执行
- **Copilot CLI** — 终端中自然语言生成命令
- MCP 协议支持
- 代码库记忆（学习项目模式和规范）

---

### Cline

开源的 VS Code 自主编程 Agent 扩展，模型无关。

#### 安装

VS Code 插件市场搜索 "Cline" 安装。支持 Mac / Win / Linux。

#### 价格

免费开源。需自带 API Key（支持 10+ 提供商）。

#### 核心能力

- 支持 Anthropic、OpenAI、Google、AWS、Azure、Groq 等 10+ API
- Shell 集成 — 直接执行命令、接收终端输出
- 文件创建和编辑（逐步授权）
- 浏览器自动化能力
- 安装依赖、运行构建、部署、管理数据库

---

### Amazon Q Developer

AWS 的 AI 编程助手，深度整合 AWS 服务。

#### 安装

在 VS Code / JetBrains / Visual Studio / Eclipse 中搜索安装。

#### 价格

| 计划 | 价格 | 说明 |
|------|------|------|
| Free | $0 | 个人永久免费 |
| Pro | $19/人/月 | 更多交互次数、企业管理 |

#### 核心能力

- **代码转换** — Java 8→17 迁移、框架升级等
- **安全扫描** — 集成安全分析
- **自主 Agent** — 多步任务执行（功能实现、重构、依赖升级）
- 自动生成测试
- AWS 服务深度整合（最适合 AWS 技术栈团队）

---

## 管理工具

### cc-switch

多 AI 编程工具的统一管理平台，一键在不同工具和模型之间切换。

#### 安装

**macOS / Windows / Linux：**

```bash
npm install -g cc-switch
```

也有桌面版（farion1231/cc-switch）可从 GitHub Releases 下载。

#### 核心能力

- 统一管理 Claude Code、Codex、Gemini CLI 等多个工具
- 一键切换 AI 模型和配置
- Provider 管理和配置编辑器
- 工作区面板
- SQLite + JSON 双层存储架构

#### 相关变体

| 工具 | 特点 |
|------|------|
| [cc-switch](https://github.com/farion1231/cc-switch) | 桌面版，全功能管理 |
| [ccs](https://github.com/kaitranntt/ccs) | 支持 Claude、Gemini、Copilot、OpenRouter 300+ 模型 |
| [claude-code-switch](https://github.com/foreveryh/claude-code-switch) | 轻量版，一条命令切模型 |

---

## 选型建议

### 按使用场景

| 场景 | 推荐工具 | 理由 |
|------|---------|------|
| **日常开发（通用）** | Cursor 或 Claude Code | 成熟度高，社区大 |
| **终端工作流** | Claude Code + Aider | 命令行原生，配合 Git |
| **前端开发** | Cursor 或 Windsurf | 实时预览，多文件编辑 |
| **AWS 项目** | Amazon Q Developer | AWS 原生集成 |
| **预算有限** | Trae + Gemini CLI + Aider | 全部免费或开源 |
| **企业团队** | GitHub Copilot + Cursor | 企业管控，GitHub 整合 |
| **学习探索** | Gemini CLI + Cline | 免费额度充足，上手简单 |

### 按工作模式

**如果你习惯 IDE：**

```
Cursor（最全面）> Windsurf（Agent 能力强）> Trae（免费）
```

**如果你习惯终端：**

```
Claude Code（理解深）> Codex CLI（OpenAI 生态）> Gemini CLI（免费）> Aider（开源灵活）
```

**如果你想增强现有编辑器：**

```
GitHub Copilot（最成熟）> Cline（免费开源）> Amazon Q（AWS 团队）
```

### 组合推荐

以下是几种经过验证的工具组合：

**全能组合（付费）：**

```
Cursor（IDE 主力）+ Claude Code（终端 + 复杂任务）+ GitHub Copilot（代码补全）
```

**免费组合：**

```
Trae（IDE）+ Gemini CLI（终端）+ Cline（VS Code 补充）
```

**终端极客组合：**

```
Claude Code（主力）+ Aider（备选 LLM）+ cc-switch（统一管理）
```

## macOS vs Windows 安装速查

| 工具 | macOS | Windows |
|------|-------|---------|
| Cursor | `brew install --cask cursor` 或官网 .dmg | 官网 .exe |
| Windsurf | 官网安装包 | 官网安装包 |
| Trae | 官网安装包 | 官网安装包 |
| Claude Code | `npm install -g @anthropic-ai/claude-code` | WSL2 + npm install |
| Codex CLI | `npm install -g @openai/codex` | WSL2 或原生 npm install |
| Gemini CLI | `npm install -g @google-gemini/cli` | `npm install -g @google-gemini/cli` |
| Aider | `brew install aider` 或 pip install | `pip install aider-chat` |
| GitHub Copilot | IDE 插件市场 + `gh extension install` | IDE 插件市场 + `gh extension install` |
| Cline | VS Code 插件市场 | VS Code 插件市场 |
| Amazon Q | IDE 插件市场 | IDE 插件市场 |
| cc-switch | `npm install -g cc-switch` | `npm install -g cc-switch` |

> **Windows 用户注意：** Claude Code 和 Codex CLI 官方推荐在 WSL2 中使用，原生 Windows 支持可能有兼容问题。其他 IDE 类和插件类工具均原生支持 Windows。
