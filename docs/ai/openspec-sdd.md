---
title: "OpenSpec & SDD"
sidebar_position: 8
tags:
  - AI
  - SDD
  - OpenSpec
---

# OpenSpec：规范驱动开发（SDD）实践指南

> 在 AI 编程时代，"氛围编码（Vibe Coding）"虽然让开发变得轻松，但 AI 生成代码的随机性与软件工程对确定性、可靠性的要求存在冲突。**规范驱动开发（Spec-Driven Development, SDD）**正是为了解决这一核心矛盾而诞生的方法论，而 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 是该领域最流行的开源框架。

## 什么是 SDD

传统开发流程：`需求 → 代码 → 测试`

SDD 开发流程：`需求 → 规范（Spec）→ 代码 → 测试`

SDD 的核心思想是：**在写任何代码之前，人和 AI 先就"要构建什么"达成一致**。规范（Spec）成为唯一的真实来源（Single Source of Truth），它存储在代码仓库中，结构化的、可被 AI 直接读取和执行。

### 为什么需要 SDD

| 问题 | SDD 的解决方式 |
|------|---------------|
| AI 理解偏差，生成的代码不是你想要的 | 先写规范对齐意图，再生成代码 |
| 多轮对话后 AI 忘了上下文 | 规范文件持久化在仓库中，随时可读 |
| 团队成员用不同 AI 工具，结果不一致 | 统一的规范文件作为所有 AI 的指令源 |
| 代码改了但不知道为什么改 | 每次变更都有提案（proposal）记录动机 |
| AI 一次改太多，难以审查 | 变更被拆分为原子化的任务清单 |

## 什么是 OpenSpec

[OpenSpec](https://openspec.pro/) 是一个轻量级的 SDD 框架，遵循五个设计原则：

- **流动而非僵化**（Fluid not Rigid）—— 任何产出物可随时更新，无阶段门禁
- **迭代而非瀑布**（Iterative not Waterfall）—— 持续改进，非一次定稿
- **简单而非复杂**（Easy not Complex）—— 最小化仪式感
- **存量优先**（Brownfield-first）—— 专为已有项目设计，不只是新建项目
- **可伸缩**（Scalable）—— 从个人项目到企业级均适用

OpenSpec 支持 20+ 种 AI 编程工具，包括 Claude Code、Cursor、GitHub Copilot、Windsurf 等。

## 安装与初始化

### 环境要求

- Node.js >= 20.19.0

### 安装

```bash
# npm
npm install -g @fission-ai/openspec@latest

# pnpm
pnpm add -g @fission-ai/openspec@latest

# yarn
yarn global add @fission-ai/openspec@latest
```

### 初始化项目

```bash
cd your-project
openspec init
```

初始化过程中会交互式地让你选择使用的 AI 工具（Claude Code、Cursor 等），然后自动生成配置和目录结构。

也可以通过参数直接指定：

```bash
openspec init --tools claude,cursor
```

## 核心概念：双文件夹模型

OpenSpec 最关键的设计是将**当前系统状态**和**变更提案**物理隔离到两个文件夹：

```
project_root/
├── openspec/
│   ├── AGENTS.md              # AI 行为指引（机器可读）
│   ├── project.md             # 全局上下文：技术栈、架构、约定
│   ├── specs/                 # 当前系统的真实规范（Source of Truth）
│   │   ├── user-auth/
│   │   │   └── spec.md
│   │   └── payment/
│   │       └── spec.md
│   └── changes/               # 进行中的变更提案
│       ├── add-oauth-login/
│       │   ├── proposal.md    # 变更理由和范围
│       │   ├── design.md      # 技术方案
│       │   ├── tasks.md       # 实现任务清单
│       │   └── specs/         # 规范差异（Delta）
│       └── archive/           # 已完成的变更归档
├── src/
└── ...
```

### 为什么要分离

| 文件夹 | 含义 | 类比 |
|--------|------|------|
| `specs/` | "系统现在是什么样的" | Git 的 `main` 分支 |
| `changes/` | "我想把系统改成什么样" | Git 的 feature 分支 |

这种分离让你清楚地区分**已有功能**和**正在修改的功能**，避免混淆，也让变更审查变得简单。

## 核心文件说明

### project.md —— 全局上下文

定义项目的技术栈、架构模式、编码规范等全局信息，所有 AI 工具读取此文件来理解项目背景：

```markdown
# 项目名称

## 技术栈
- 后端：Spring Boot 3.2, Java 17
- 数据库：PostgreSQL 15
- 缓存：Redis 7

## 架构模式
- COLA 四层架构
- DDD 领域驱动设计

## 编码规范
- 依赖注入使用 @RequiredArgsConstructor
- 日期类型使用 LocalDateTime
```

### AGENTS.md —— AI 行为指引

包含 `<openspec-instructions>` 标签，指导 AI 在生成代码前先阅读相关规范：

```markdown
<openspec-instructions>
Before generating any code:
1. Read openspec/project.md for global context
2. Check openspec/specs/ for current system state
3. Read openspec/changes/ for active proposals
4. Follow the tasks.md checklist when implementing
</openspec-instructions>
```

### proposal.md —— 变更提案

记录变更的业务动机和范围：

```markdown
# 提案：添加双因素认证（2FA）

## 背景
当前系统仅支持用户名密码登录，安全性不足。

## 目标
- 支持 TOTP 方式的双因素认证
- 用户可选择开启/关闭 2FA

## 范围
- 新增：2FA 配置接口、验证接口
- 修改：登录流程增加 2FA 校验步骤
- 不变：注册流程、密码重置流程
```

### tasks.md —— 实现任务清单

将变更拆分为原子化的实现步骤：

```markdown
# 任务清单

- [ ] 创建 `totp_config` 数据表
- [ ] 实现 TOTP 密钥生成服务
- [ ] 实现 2FA 配置 API（开启/关闭）
- [ ] 修改登录流程，增加 2FA 校验
- [ ] 添加单元测试
- [ ] 更新 API 文档
```

### design.md —— 技术方案

记录关键技术决策：

```markdown
# 技术设计

## TOTP 实现
- 使用 `com.eatthepath:java-otp` 库
- 密钥存储在 `totp_config` 表，加密存储

## 接口设计
- POST /v1/pt/totp/enable —— 开启 2FA，返回密钥和二维码
- POST /v1/pt/totp/verify —— 验证 TOTP 码
- DELETE /v1/pt/totp/disable —— 关闭 2FA
```

## 规范差异格式（Spec Delta）

变更中的规范使用标准化标记，类似 Gherkin 风格的 GIVEN/WHEN/THEN：

```markdown
## ADDED Requirements

### Requirement: 双因素认证
用户登录时需要提供第二重验证因素。

#### Scenario: 需要 OTP 验证
- **GIVEN** 用户已开启 2FA
- **WHEN** 提供了正确的用户名和密码
- **THEN** 系统返回 OTP 挑战而非直接颁发 Token

## MODIFIED Requirements

### Requirement: 用户登录
登录流程增加 2FA 校验环节。

## REMOVED Requirements
（无）
```

## 工作流：提案 → 实现 → 归档

### 第一步：提案（Propose）

告诉 AI 你想要什么功能：

```
/opsx:propose add-two-factor-auth
```

或使用完整命令：

```
/opsx:new add-two-factor-auth
/opsx:ff
```

AI 会在 `openspec/changes/add-two-factor-auth/` 下自动生成：
- `proposal.md` —— 业务理由和范围
- `design.md` —— 技术方案
- `tasks.md` —— 实现任务清单
- `specs/` —— 规范差异

此时你需要**审查这些文件**，与 AI 反复对齐，直到规范准确表达了你的意图。

### 第二步：实现（Apply）

确认规范无误后，让 AI 按照任务清单逐步实现：

```
/opsx:apply
```

AI 会依照 `tasks.md` 中的清单逐项执行，完成后自动勾选。

如果实现被中断（比如关闭了终端），可以用 `/opsx:continue` 从中断处继续。

### 第三步：归档（Archive）

功能开发完成后，将变更合并到主规范：

```
/opsx:archive
```

这会：
1. 将 `changes/add-two-factor-auth/specs/` 中的差异合并到 `specs/`
2. 将整个变更文件夹移动到 `changes/archive/`
3. 主规范（Source of Truth）得到更新

## 完整命令参考

### 斜杠命令（在 AI 工具中使用）

| 命令 | 功能 |
|------|------|
| `/opsx:new <name>` | 创建一个新的变更文件夹 |
| `/opsx:propose <name>` | 创建变更并生成完整提案 |
| `/opsx:ff` | 快进：为已创建的变更生成提案文件 |
| `/opsx:apply` | 按照任务清单实现代码 |
| `/opsx:continue` | 从中断处继续实现 |
| `/opsx:verify` | 验证实现是否符合规范 |
| `/opsx:archive` | 归档已完成的变更，合并到主规范 |
| `/opsx:sync` | 同步规范和代码的状态 |
| `/opsx:onboard` | 生成项目入门引导 |
| `/opsx:bulk-archive` | 批量归档多个已完成的变更 |

### CLI 命令（在终端中使用）

```bash
# 初始化项目
openspec init

# 列出所有活跃变更
openspec list

# 查看具体变更详情
openspec show <change-name>

# 校验规范格式
openspec validate <change-name>

# 归档变更
openspec archive <change-name>

# 切换配置 profile
openspec config profile

# 更新到最新版本
openspec update
```

## 实战示例

### 场景：为博客系统添加评论功能

**1. 初始化 OpenSpec（首次使用）**

```bash
cd my-blog-project
npm install -g @fission-ai/openspec@latest
openspec init --tools claude
```

**2. 提出变更**

在 Claude Code 中输入：

```
/opsx:propose add-comment-feature
```

AI 生成以下文件：

```
openspec/changes/add-comment-feature/
├── proposal.md      # 评论功能的业务背景和目标
├── design.md        # 数据库设计、接口设计、前端方案
├── tasks.md         # 12个实现步骤
└── specs/
    └── comment/
        └── spec.md  # 评论模块的完整规范
```

**3. 审查和调整**

阅读生成的文件，和 AI 讨论需要调整的地方：

```
proposal.md 中的范围太大了，先不做评论审核功能，
只做基本的发表和展示。请更新 proposal 和 tasks。
```

AI 更新相关文件，缩小范围。

**4. 实现**

```
/opsx:apply
```

AI 按照 `tasks.md` 逐项实现：创建数据表、编写 API、开发前端组件...

**5. 验证**

```
/opsx:verify
```

AI 检查实现是否完整覆盖了规范中的所有需求。

**6. 归档**

```
/opsx:archive
```

评论模块的规范合并到 `openspec/specs/comment/spec.md`，变更文件归档。

## 在不同 AI 工具中使用

OpenSpec 的设计是工具无关的，通过不同的适配方式支持各种 AI 编程工具：

| AI 工具 | 集成方式 |
|---------|---------|
| **Claude Code** | `AGENTS.md` + `config.toml` 注册斜杠命令 |
| **Cursor** | `AGENTS.md` + `.cursor/rules/` |
| **GitHub Copilot** | `.github/prompts/*.prompt.md` |
| **Windsurf** | `.windsurf/workflows/` |
| **通用** | 任何 AI 工具只要能读取 `AGENTS.md` 即可工作 |

## 最佳实践

### 模型选择

推荐使用高推理能力的模型（Claude Opus、GPT-4 等），因为规范理解和任务分解需要较强的推理能力。

### 渐进采用

- **不要**试图一次性为整个项目写完规范
- **从新功能开始**：每次新需求都走 propose → apply → archive 流程
- 随着变更的积累，`specs/` 目录自然成长为完整的系统规范

### 保持简洁

- 每个变更聚焦于一个功能点
- `proposal.md` 写清楚"为什么"和"范围"即可
- `tasks.md` 中每个任务应该是可独立完成的原子操作

### 上下文管理

- 在开始 `/opsx:apply` 之前，清理 AI 对话的上下文窗口
- 让 AI 在实现前重新读取相关的 spec 文件
- 大功能拆分为多个小变更，避免单次变更过于庞大

## SDD 框架对比

| 特性 | OpenSpec | spec-kit | BMAD |
|------|----------|----------|------|
| 定位 | 轻量通用 | 简约极致 | 全流程 |
| 学习成本 | 低 | 极低 | 较高 |
| 存量项目支持 | 好 | 一般 | 好 |
| 工具支持 | 20+ | 少数 | Claude 为主 |
| 适合场景 | 通用开发 | 小项目/个人 | 企业级项目 |

## 参考资料

- [OpenSpec GitHub 仓库](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec 官网](https://openspec.pro/)
- [OpenSpec 深度指南 - Architecture & Practice](https://redreamality.com/garden/notes/openspec-guide/)
- [SDD 框架对比：BMAD vs spec-kit vs OpenSpec vs PromptX](https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)
- [OpenSpec 入门实践 - Echo Blog](https://houbb.github.io/2025/11/20/ai-sdd-03-opensepc-intro)
- [Linear MCP + OpenSpec 工作流](https://intent-driven.dev/blog/2026/01/11/linear-mcp-openspec-sdd-workflow/)
