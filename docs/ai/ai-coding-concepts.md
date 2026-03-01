---
title: "AI 编程核心概念"
sidebar_position: 1
tags:
  - AI
  - Claude Code
  - 概念
---

# AI 编程核心概念：CLAUDE.md、Skill、Command、Agent、Hook、MCP、Plugin

> 以 [Claude Code](https://code.claude.com/) 为例，现代 AI 编程工具提供了一套分层的扩展机制。理解每个概念的定位和适用场景，是高效使用 AI 编程的前提。本文梳理七大核心概念：它们**是什么、怎么用、什么时候用**。

## 概念全景图

```
                    ┌──────────────────────────────┐
                    │         Plugin（插件）         │  ← 打包分发层
                    │  捆绑 Skill + Command + Hook  │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
  ┌─────┴──────┐           ┌──────┴──────┐           ┌───────┴───────┐
  │   Skill    │           │  Command    │           │    Hook       │
  │ 自动激活    │           │  手动触发    │           │  事件驱动     │
  │ 上下文注入  │           │  斜杠命令    │           │  确定性控制   │
  └─────┬──────┘           └──────┬──────┘           └───────┬───────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │        Agent / Subagent       │  ← 隔离执行层
                    │    独立上下文 + 工具限制       │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │          MCP Server           │  ← 外部集成层
                    │   连接数据库、API、第三方服务   │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │          CLAUDE.md            │  ← 记忆基础层
                    │     项目知识、规范、约定       │
                    └──────────────────────────────┘
```

## 快速选择指南

| 我想要... | 用什么 |
|-----------|--------|
| 让 AI 始终记住项目的技术栈和编码规范 | **CLAUDE.md** |
| AI 在特定场景下自动加载专业知识 | **Skill** |
| 创建一个我手动触发的可复用工作流 | **Command** |
| 把任务委派给独立的 AI 助手执行 | **Agent / Subagent** |
| 在 AI 操作前后自动执行检查或格式化 | **Hook** |
| 连接 GitHub、数据库、Slack 等外部系统 | **MCP Server** |
| 把以上配置打包分享给团队 | **Plugin** |

## 一、CLAUDE.md —— 项目记忆

### 是什么

CLAUDE.md 是 Markdown 格式的项目记忆文件，告诉 AI"这个项目是什么、有哪些约定"。它在每次对话开始时自动加载，无需手动触发。

### 存放位置（按优先级）

| 位置 | 作用范围 | 是否共享 |
|------|---------|---------|
| `~/.claude/CLAUDE.md` | 所有项目 | 否（个人） |
| 项目根目录 `CLAUDE.md` | 当前项目 | 是（可提交 Git） |
| 子目录 `CLAUDE.md` | 该目录及其子目录 | 是 |

### 内容示例

```markdown
# 项目：门诊预约系统

## 技术栈
- Spring Boot 3.2 + Java 17
- PostgreSQL 15 + Redis 7
- COLA 四层架构（domain / app / infrastructure / start）

## 编码规范
- 依赖注入使用 @RequiredArgsConstructor + final，禁止 @Autowired
- 日期类型使用 LocalDateTime，字段名以 Time 结尾
- Controller 返回 Response<T>，分页使用 Response<PageList<T>>

## 常用命令
- 运行测试：mvn test -pl app
- 本地启动：mvn spring-boot:run -pl start
```

### 何时使用

- 技术栈、编码规范、项目架构等**不常变化**的静态知识
- 团队约定和命名规则
- 常用命令速查

### 何时不使用

- 需要根据上下文动态加载的知识 → 用 **Skill**
- 需要手动触发的特定工作流 → 用 **Command**

## 二、Skill —— 自动激活的技能

### 是什么

Skill 是一个包含 `SKILL.md` 的文件夹，描述了一项专业能力。当 AI 检测到对话内容**匹配技能描述**时，自动加载该技能的指令——无需手动触发。

### 与 CLAUDE.md 的区别

| 特性 | CLAUDE.md | Skill |
|------|-----------|-------|
| 加载方式 | 每次对话都加载 | 按需自动加载 |
| 适合内容 | 始终需要的全局知识 | 特定场景的专业知识 |
| Token 消耗 | 始终占用上下文 | 仅匹配时占用 |

### 目录结构

```
~/.claude/skills/              # 个人技能（所有项目可用）
  └── tdd/
      └── SKILL.md

.claude/skills/                # 项目技能（提交 Git 共享）
  └── api-review/
      ├── SKILL.md
      └── checklist.md         # 附带的资源文件
```

### SKILL.md 示例

```markdown
---
name: api-review
description: |
  API 接口审查技能。当用户创建或修改 Controller 接口时自动激活。
  不要在讨论前端、数据库 Migration 或部署时加载此技能。
---

## 审查清单

1. URL 格式是否符合规范：/version/access-control/domain-object/action
2. 请求类是否继承 Request 或 PageRequest
3. 是否包含 @ApiModel / @ApiModelProperty 注解
4. 是否使用 JSR-303 校验注解
5. Controller 是否返回 Response<T>
```

### 技能激活关键

**描述（description）的质量决定了激活的准确性**。推荐使用 "WHEN + WHEN NOT" 模式：

```yaml
description: |
  当讨论 REST API 设计、创建 Controller 或审查接口时激活。
  不要在讨论前端组件、数据库设计或 DevOps 时加载。
```

### 何时使用

- 特定场景下的专业知识（代码审查标准、测试规范、安全检查）
- 不希望始终占用上下文的领域知识
- 需要 AI **自动判断**是否加载的场景

## 三、Command —— 手动触发的斜杠命令

### 是什么

Command 是用户手动输入 `/command-name` 触发的可复用提示词。适合明确的、重复性的工作流。

### 目录结构

```
.claude/commands/              # 项目命令
  ├── review.md                # /review
  └── gen-test.md              # /gen-test

~/.claude/commands/            # 个人命令（所有项目可用）
  └── daily.md                 # /daily
```

### Command 示例

`.claude/commands/review.md`：

```markdown
---
description: 审查指定文件的代码质量
---

请审查以下文件的代码质量：$ARGUMENTS

审查要点：
1. 命名规范是否符合项目标准
2. 方法长度是否超过 80 行
3. 是否使用了正确的依赖注入方式
4. 是否有安全漏洞（SQL注入、XSS 等）
5. 测试覆盖是否充分

@CLAUDE.md
```

使用方式：

```bash
/review src/main/java/com/example/UserController.java
```

### 特性

- `$ARGUMENTS`：用户输入的参数
- `@file`：内联引用文件内容
- 支持前置 Bash 步骤（预处理）

### 何时使用

- **明确的、可重复的**工作流：代码审查、生成测试、重构
- 需要**标准化执行**的操作（每次步骤完全一致）
- 团队共享的操作流程

### Skill vs Command 对比

| 特性 | Skill | Command |
|------|-------|---------|
| 触发方式 | AI 自动判断 | 用户手动 `/command` |
| 适合场景 | "AI 应该知道这个" | "我要执行这个流程" |
| 执行时机 | 对话中随时激活 | 用户显式触发 |
| 类比 | 专家的知识储备 | 标准操作手册 |

## 四、Agent / Subagent —— 隔离执行的 AI 助手

### 是什么

Subagent 是在**独立上下文窗口**中运行的 AI 助手，有自己的系统提示、工具权限和对话记录。主对话可以将任务委派给 Subagent，Subagent 独立工作后返回结果摘要。

### 为什么需要 Subagent

| 问题 | Subagent 的解决方式 |
|------|-------------------|
| 运行测试输出太多，挤占主对话上下文 | 在 Subagent 中执行，只返回摘要 |
| 需要限制 AI 只能读不能写 | 配置 Subagent 只允许 Read 工具 |
| 多个独立任务想并行执行 | 派发多个 Subagent 同时工作 |
| 担心 AI 做出危险操作 | Subagent 可配置 Hook 进行拦截 |

### 内置 Subagent

| Agent | 模型 | 能力 | 用途 |
|-------|------|------|------|
| **Explore** | Haiku（快速） | 只读 | 搜索和分析代码库 |
| **Plan** | 继承主对话 | 只读 | Plan 模式下的调研 |
| **General-purpose** | 继承主对话 | 全部工具 | 复杂多步骤任务 |

### 自定义 Subagent

`.claude/agents/code-reviewer.md`：

```markdown
---
name: code-reviewer
description: 代码审查专家。在代码修改后主动审查质量和安全性。
tools: Read, Grep, Glob, Bash
model: sonnet
---

你是一个高级代码审查专家。当被调用时：

1. 运行 git diff 查看最近的变更
2. 聚焦修改的文件
3. 按以下清单审查：
   - 代码是否清晰可读
   - 命名是否规范
   - 是否有安全风险
   - 错误处理是否完善
4. 按优先级输出：Critical → Warning → Suggestion
```

### Agent 的运行方式

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| **前台运行** | 阻塞主对话，权限提示透传给用户 | 需要交互确认的任务 |
| **后台运行** | 并发执行，完成后通知 | 独立的、无需交互的任务 |
| **隔离执行** | 在 Git Worktree 中运行 | 需要修改文件但不影响主分支 |

### 何时使用

- 任务产出大量输出，不想污染主对话上下文
- 需要对 AI 的工具访问做严格限制
- 多个独立任务需要并行处理
- 需要领域专家角色（代码审查、安全审计、数据分析）

### 何时不使用

- 需要频繁交互的迭代任务 → 在主对话中直接做
- 需要嵌套委派（Subagent 不能再派发 Subagent）→ 用 Skill 或在主对话中链式调用

## 五、Hook —— 事件驱动的自动化

### 是什么

Hook 是在 AI 操作生命周期中特定时间点自动执行的 Shell 命令。它提供**确定性控制**——确保某些动作一定发生，而非依赖 AI 的判断。

### 与 Skill 的核心区别

| 特性 | Hook | Skill |
|------|------|-------|
| 本质 | 确定性的 Shell 命令 | AI 阅读的指导文档 |
| 可靠性 | 100% 执行 | 依赖 AI 判断 |
| 适合 | 格式化、拦截、通知 | 知识注入、流程指导 |

### 所有事件类型

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `SessionStart` | 会话开始或恢复 | 注入上下文、环境检查 |
| `UserPromptSubmit` | 用户提交提示词后 | 注入额外上下文 |
| `PreToolUse` | 工具调用前（可拦截） | 拦截危险操作、校验输入 |
| `PostToolUse` | 工具调用成功后 | 自动格式化、运行 Lint |
| `PostToolUseFailure` | 工具调用失败后 | 错误记录 |
| `PermissionRequest` | 权限对话框弹出时 | 自动授权/拒绝 |
| `Notification` | 通知发送时 | 桌面通知 |
| `SubagentStart` | Subagent 启动时 | 环境准备 |
| `SubagentStop` | Subagent 结束时 | 资源清理 |
| `Stop` | AI 完成回复时 | 完整性检查 |
| `PreCompact` | 上下文压缩前 | 保存关键信息 |
| `ConfigChange` | 配置文件变更时 | 审计日志 |
| `SessionEnd` | 会话终止时 | 清理临时文件 |

### Hook 类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `command` | 执行 Shell 命令 | 格式化、拦截、通知 |
| `prompt` | 发送给 LLM 做判断（返回 ok/not ok） | 需要 AI 判断的场景 |
| `agent` | 派发 Subagent 验证（可读文件、运行命令） | 需要检查代码库状态的验证 |
| `http` | POST 事件数据到 HTTP 端点 | 外部服务集成 |

### 配置位置

| 位置 | 作用范围 |
|------|---------|
| `~/.claude/settings.json` | 所有项目 |
| `.claude/settings.json` | 当前项目（可提交 Git） |
| `.claude/settings.local.json` | 当前项目（不提交） |

### 实用示例

#### 示例 1：文件编辑后自动格式化

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

#### 示例 2：禁止修改敏感文件

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

`protect-files.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROTECTED=(".env" "package-lock.json" ".git/")

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2  # exit 2 = 拦截操作
  fi
done
exit 0
```

#### 示例 3：AI 完成时检查任务是否完整

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "检查所有请求的任务是否都已完成。如果没有，返回 {\"ok\": false, \"reason\": \"剩余工作描述\"}。"
          }
        ]
      }
    ]
  }
}
```

#### 示例 4：桌面通知（AI 等待输入时提醒你）

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code 需要你的注意\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

### 退出码含义

| 退出码 | 含义 |
|--------|------|
| `0` | 操作继续，stdout 添加到上下文 |
| `2` | **拦截操作**，stderr 作为反馈告知 AI |
| 其他 | 操作继续，stderr 记录到日志 |

### 何时使用

- 需要 **100% 确定性**执行的动作（格式化、校验、拦截）
- 文件编辑后自动运行 Linter / Formatter
- 拦截危险操作（修改 .env、删除重要文件）
- 桌面通知、审计日志
- 上下文压缩后重新注入关键信息

## 六、MCP Server —— 外部系统集成

### 是什么

MCP（Model Context Protocol）是一个开放协议，让 AI 工具通过统一的适配器连接外部系统——数据库、API、GitHub、Slack 等。每个 MCP Server 暴露工具（tools）、资源（resources）和提示（prompts）供 AI 使用。

### 类比

```
MCP Server 之于 AI ≈ 驱动程序 之于操作系统
```

不需要为每个外部系统写定制集成，只需安装对应的 MCP Server。

### 安装方式

```bash
# 添加 GitHub MCP Server
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# 添加数据库 MCP Server
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb
```

### 常见 MCP Server

| Server | 功能 |
|--------|------|
| GitHub | PR、Issue、仓库操作 |
| PostgreSQL | 数据库查询 |
| Filesystem | 文件系统操作（用于沙盒环境） |
| Slack | 消息发送和读取 |
| Playwright | 浏览器自动化 |
| Lark/飞书 | 飞书文档和消息 |

### MCP 工具命名

MCP 工具的命名格式为 `mcp__<server>__<tool>`，例如：
- `mcp__github__search_repositories`
- `mcp__postgres__query`

在 Hook 中可以用 `mcp__github__.*` 正则匹配某个 Server 的所有工具。

### 何时使用

- 需要 AI 直接操作 GitHub、数据库、消息系统等外部服务
- 有现成的 MCP Server 可用时（避免重复造轮子）
- 需要在 AI 对话中查询实时数据

## 七、Plugin —— 打包与分发

### 是什么

Plugin 是一个将 Skill、Command、Hook、Subagent、MCP Server **打包在一起**的分发单元。安装一个 Plugin 就能获得一整套配置好的工作流。

### 类比

```
Plugin 之于 Claude Code ≈ npm 包 之于 Node.js
```

### 安装方式

```bash
# 从市场添加源
/plugin marketplace add obra/superpowers-marketplace

# 安装插件
/plugin install superpowers@superpowers-marketplace

# 更新插件
/plugin update superpowers
```

### Plugin 内部结构

```
my-plugin/
├── skills/               # 自动激活的技能
│   └── my-skill/
│       └── SKILL.md
├── commands/              # 斜杠命令
│   └── my-command.md
├── agents/                # 自定义 Subagent
│   └── my-agent.md
├── hooks/                 # 事件钩子
│   └── hooks.json
└── plugin.json            # 插件元数据
```

安装后，各组件无缝合并到 Claude Code 中——Hook 自动生效、Command 出现在自动补全中、Skill 按上下文激活。

### 何时使用

- 团队统一工具链和工作流标准
- 分享已验证的最佳实践配置
- 使用社区提供的成熟解决方案（如 [Superpowers](./superpowers.md)）

## 概念关系总结

```
用户输入
  │
  ├─ 匹配 /command → 执行 Command
  │
  ├─ 匹配 Skill 描述 → 自动加载 Skill
  │
  ├─ AI 决定调用工具
  │    ├─ PreToolUse Hook → 拦截/放行
  │    ├─ 执行工具
  │    └─ PostToolUse Hook → 格式化/检查
  │
  ├─ AI 决定委派任务 → 启动 Subagent
  │    ├─ SubagentStart Hook
  │    ├─ Subagent 独立工作
  │    └─ SubagentStop Hook
  │
  ├─ 需要外部数据 → 调用 MCP Server
  │
  └─ AI 完成回复 → Stop Hook
```

### 分层决策

| 层级 | 机制 | 核心问题 |
|------|------|---------|
| **记忆层** | CLAUDE.md | "AI 应该始终知道什么？" |
| **知识层** | Skill | "AI 在特定场景应该知道什么？" |
| **操作层** | Command | "用户想手动触发什么流程？" |
| **执行层** | Agent / Subagent | "谁来独立完成这个任务？" |
| **控制层** | Hook | "哪些操作必须被自动检查？" |
| **集成层** | MCP Server | "AI 需要连接哪些外部系统？" |
| **分发层** | Plugin | "怎么把配置分享给团队？" |

## 参考资料

- [Claude Code 官方文档](https://code.claude.com/docs/)
- [Understanding Claude Code's Full Stack: MCP, Skills, Subagents, and Hooks](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [Claude Code Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)
- [Skills vs Commands vs Subagents vs Plugins](https://www.youngleaders.tech/p/claude-skills-commands-subagents-plugins)
- [Hooks 官方指南](https://code.claude.com/docs/en/hooks-guide)
- [Subagent 官方文档](https://code.claude.com/docs/en/sub-agents)
- [My Claude Code Setup: MCP, Hooks, Skills — Real Usage 2026](https://okhlopkov.com/claude-code-setup-mcp-hooks-skills-2026/)
- [Everything Claude Code — 完整配置集合](https://github.com/affaan-m/everything-claude-code)
