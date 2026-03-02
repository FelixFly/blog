---
title: "BMAD + Claude Code Team Mode 实战指南"
sidebar_position: 11
tags:
  - AI
  - BMAD
  - Claude Code
  - Agent Teams
---

# BMAD + Claude Code Team Mode 实战指南

> BMAD 定义了 12+ 个专业 AI 角色和结构化工作流，Claude Code Team Mode 提供了多 Agent 并行协作的运行时能力。将两者结合，可以让 BMAD 的虚拟团队从"角色扮演"升级为"真正的多 Agent 并行工作"。

## 背景：为什么要结合？

### BMAD 的设计与现实差距

[BMAD Method](./bmad-method.md) 设计了完整的多智能体团队：Analyst（Mary）、PM（John）、Architect（Winston）、Scrum Master（Bob）、Developer（Amelia）等。但在实际使用中，这些 Agent 只能**串行切换**——同一时刻只有一个 Agent 活跃，通过 `/bmad:bmm:agents:pm` 等命令手动切换角色。

这意味着：
- **Phase 3（Solutioning）**：Architect 设计架构后，需要手动切换到 PM 创建 Epics，再切到 TEA 设计测试——全是串行的
- **Phase 4（Implementation）**：多个 Story 只能逐个执行，无法并行开发
- **Party Mode** 虽然支持多 Agent 讨论，但本质是单会话内的角色模拟，不是真并行

### Claude Code Team Mode 的能力

Claude Code 的 [Agent Teams](https://code.claude.com/docs/en/agent-teams) 功能提供了：

| 能力 | 说明 |
|------|------|
| **并行执行** | 多个 Teammate 同时工作，各自拥有独立上下文 |
| **共享任务列表** | 基于 `TaskCreate`/`TaskUpdate` 的协作机制 |
| **消息通信** | Teammate 之间可以直接发消息协调 |
| **计划审批** | Team Lead 可以审批 Teammate 的实施方案 |
| **tmux 分屏** | 可视化看到每个 Teammate 的工作进展 |

### 结合的价值

```
BMAD 单会话模式：  Analyst → PM → Architect → SM → Dev → Dev → Dev （串行）
                   ════════════════════════════════════════════════
Team Mode 模式：   Analyst ──→ PM ──────→ Architect ──→ SM ──→ Dev₁ ──→
                                  └→ UX Designer ──→       └→ Dev₂ ──→  （并行）
                                                           └→ Dev₃ ──→
                                                           └→ TEA  ──→
```

## 前置条件

### 1. 开启 Team Mode

确认 `~/.claude/settings.json` 包含：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "true"
  },
  "teammateMode": "tmux"
}
```

> `teammateMode` 推荐 `tmux`，可在终端分屏查看每个 Agent 的实时输出。需要先安装 tmux。

### 2. 安装 BMAD

```bash
npx bmad-method@alpha install
```

确保 `~/.claude/commands/bmad/` 目录下有 BMAD 的 skill 文件，Claude Code 中可通过 `/bmad:bmm:agents:*` 调用各 Agent。

### 3. 项目初始化

在目标项目中确保存在：
- `_bmad/bmm/config.yaml` — BMAD 配置（用户名、语言、输出目录）
- `_bmad-output/` — BMAD 文档输出目录

## 核心概念：角色映射

将 BMAD Agent 映射为 Claude Code Team 的 Teammate：

| BMAD Agent | 名称 | Team Mode 角色 | 适合并行 |
|------------|------|---------------|---------|
| Analyst（Mary） | 业务分析师 | 研究型 Teammate | Phase 1 可与 Research 并行 |
| PM（John） | 产品经理 | 规划型 Teammate | Phase 2 串行（依赖 Brief） |
| Architect（Winston） | 架构师 | 设计型 Teammate | Phase 3 可与 UX 并行 |
| UX Designer | UX 设计师 | 设计型 Teammate | Phase 3 可与 Architect 并行 |
| SM（Bob） | Scrum Master | 协调型（建议做 Lead） | Phase 4 作为 Team Lead |
| Dev（Amelia） | 开发者 | 实现型 Teammate | Phase 4 多实例并行 |
| TEA | 测试架构师 | 测试型 Teammate | Phase 4 与 Dev 并行 |

## 实战场景

### 场景一：Phase 1-2 分析与规划（串行为主）

Phase 1-2 通常是探索性的、需要人工深度参与的阶段，**不建议用 Team Mode**，直接用单会话 BMAD 即可：

```
# 启动 Analyst
/bmad:bmm:agents:analyst
> PB    # 创建 Product Brief

# 切换到 PM
/bmad:bmm:agents:pm
> CP    # 基于 Brief 创建 PRD
```

### 场景二：Phase 3 设计阶段（适度并行）

架构设计和 UX 设计可以并行进行，两者依赖同一份 PRD 但产出不同。

**操作步骤：**

**Step 1：创建团队**

在 Claude Code 中告诉 Lead 创建团队：

```
创建一个 BMAD 设计团队来并行完成架构设计和 UX 设计。
PRD 文档在 _bmad-output/prd.md。

团队安排：
- 我作为 Team Lead 协调
- Teammate "architect"：负责架构设计，按 BMAD Architect 角色工作
- Teammate "ux-designer"：负责 UX 设计，按 BMAD UX Designer 角色工作
```

**Step 2：为 Teammate 编写 Prompt**

关键是在 Spawn Teammate 时注入 BMAD Agent 的角色定义。以 Architect 为例：

```
Spawn teammate "architect" with this prompt:

你是 BMAD 架构师 Winston。请执行以下步骤：
1. 读取 _bmad/bmm/config.yaml 获取项目配置
2. 读取 _bmad-output/prd.md 理解产品需求
3. 如果存在 project-context.md，将其作为实施指南
4. 执行架构设计工作流 _bmad/bmm/workflows/3-solutioning/create-architecture/workflow.md
5. 将架构文档输出到 _bmad-output/architecture.md

要求：使用计划审批模式，先输出架构方案让我审核。
```

**Step 3：审核与合并**

两个 Teammate 完成后，Lead 审核产出物，确保架构和 UX 设计一致。

### 场景三：Phase 4 并行开发（最大价值）

这是 Team Mode 价值最大的场景——多个 Story 由不同 Dev Teammate 并行实现。

**操作步骤：**

**Step 1：准备工作（SM 串行完成）**

先用单会话完成 Sprint 规划：

```
/bmad:bmm:agents:sm
> SP    # 生成 sprint-status.yaml
> CS    # 逐个创建 Story 文件（story-1.md, story-2.md, story-3.md）
```

**Step 2：创建开发团队**

```
创建一个 BMAD 开发团队来并行实现 Sprint 中的多个 Story。

团队安排：
- 我作为 Scrum Master（Team Lead）协调
- Teammate "dev-1"：实现 story-1.md
- Teammate "dev-2"：实现 story-2.md
- Teammate "dev-3"：实现 story-3.md
- Teammate "tester"：编写测试框架和集成测试

每个 Dev Teammate 使用计划审批模式，实现前先提交方案。
```

**Step 3：为每个 Dev Teammate 编写 Prompt**

```
Spawn teammate "dev-1" in plan mode with this prompt:

你是 BMAD 开发者 Amelia。请执行以下步骤：
1. 读取 _bmad/bmm/config.yaml 获取项目配置
2. 读取 _bmad-output/story-1.md 作为唯一的实现指南
3. 读取 _bmad-output/architecture.md 了解技术架构
4. 如果存在 project-context.md，遵循其中的规则
5. 严格按 Story 中的 tasks/subtasks 顺序实现
6. 遵循 red-green-refactor 循环：先写失败测试，再实现，再重构
7. 每完成一个 task 后标记 [x] 并运行全量测试

你的代码范围仅限于 story-1.md 中列出的文件，不要修改其他 Story 的文件。
```

**Step 4：Lead 协调**

作为 Team Lead（SM 角色），你的职责：

1. **审批计划**：每个 Dev 提交实施计划后，检查是否遵循 Story 要求
2. **防止文件冲突**：确保不同 Teammate 不会编辑同一文件
3. **依赖管理**：如果 Story 之间有依赖，用 Task 的 `blockedBy` 管理
4. **进度跟踪**：定期查看 TaskList 了解各 Teammate 进展

**Step 5：Code Review**

所有 Story 完成后，Spawn 一个新的 Teammate 做代码审查：

```
Spawn teammate "reviewer" with this prompt:

你是 BMAD Code Reviewer。请执行代码审查工作流：
1. 读取 _bmad/bmm/workflows/4-implementation/code-review/workflow.yaml
2. 对照每个 Story 的验收标准检查实现
3. 审查代码质量、测试覆盖、架构合规性
4. 输出审查报告，列出所有发现的问题
```

### 场景四：Quick Flow + Team Mode（快速开发）

对于不需要完整 BMAD 流程的小型项目，可以用 Quick Flow 结合 Team Mode：

```
创建团队并行完成以下工作：

Teammate "spec-writer"：
- 执行 quick-spec 工作流，生成技术规格文档
- 读取 _bmad/bmm/workflows/quick-flow/quick-spec/workflow.md

Teammate "researcher"：
- 研究技术方案可行性
- 调研相关库和最佳实践

两个 Teammate 完成后，我再基于产出创建开发任务。
```

## 最佳实践

### 1. Team 规模控制

| 项目规模 | 建议 Team 规模 | 说明 |
|---------|--------------|------|
| 小型（1-3 Story） | 不用 Team | 单会话 BMAD 足够 |
| 中型（4-8 Story） | 3-4 Teammate | Lead + 2-3 Dev + 1 Tester |
| 大型（8+ Story） | 5-6 Teammate | Lead + 3-4 Dev + 1-2 Tester |

> Token 消耗与 Teammate 数量线性增长，注意控制成本。

### 2. 文件所有权隔离

**最重要的原则**：每个 Teammate 只修改自己负责的文件，避免并行写冲突。

```
# 好的拆分方式 - 按 Story/模块划分文件所有权
dev-1: src/auth/         # 认证模块
dev-2: src/payment/      # 支付模块
dev-3: src/notification/  # 通知模块

# 差的拆分方式 - 多个 Dev 修改同一文件
dev-1: src/app.ts (添加路由)
dev-2: src/app.ts (添加中间件)  # 冲突！
```

BMAD 的 Context Sharding（上下文分片）天然适合这种拆分——每个 Story 本身就定义了独立的文件范围。

### 3. 沟通模式

```
                  ┌─────────┐
                  │  Lead   │
                  │  (SM)   │
                  └────┬────┘
              ┌────────┼────────┐
              ▼        ▼        ▼
          ┌──────┐ ┌──────┐ ┌──────┐
          │Dev-1 │ │Dev-2 │ │ TEA  │
          └──────┘ └──────┘ └──────┘
```

- **Lead → Teammate**：分配任务、审批计划、反馈问题
- **Teammate → Lead**：报告完成、请求澄清、遇到阻塞
- **Teammate → Teammate**：避免直接通信，通过 Lead 协调（减少消息开销）

> 使用 `SendMessage type: "message"` 而非 `broadcast`。broadcast 会发送给所有 Teammate，Token 成本高。

### 4. 计划审批门禁

对修改代码的 Teammate，**始终启用计划审批模式**：

```
Spawn teammate "dev-1" in plan mode
```

这确保 Dev 先制定实施计划，Lead 审批后才开始编码。避免 Teammate "自由发挥"导致返工。

### 5. BMAD 产出物作为共享上下文

所有 Teammate 都应读取的共享文件：

| 文件 | 用途 |
|------|------|
| `_bmad-output/architecture.md` | 技术架构决策 |
| `_bmad-output/prd.md` | 产品需求 |
| `project-context.md` | 项目规则和约定 |
| `_bmad-output/story-N.md` | 各自负责的 Story |

在 Spawn Prompt 中明确列出需要读取的文件，因为 Teammate 不继承 Lead 的会话历史。

## 阶段性工作流总览

```
Phase 1: Analysis                    Phase 2: Planning
┌─────────────────────┐              ┌─────────────────────┐
│   单会话 BMAD        │              │   单会话 BMAD        │
│   Analyst → Brief   │──────────────▶│   PM → PRD          │
└─────────────────────┘              └──────────┬──────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                                   ▼
Phase 3: Solutioning    ┌──────────┐                        ┌──────────┐
（Team Mode 可选）       │Architect │                        │UX Design │
                        │架构设计   │                        │UX 设计    │
                        └────┬─────┘                        └────┬─────┘
                             │              合并                  │
                             └──────────────┬────────────────────┘
                                            ▼
Phase 4: Implementation           ┌───────────────────┐
（Team Mode 推荐）                 │  SM → Sprint Plan  │
                                  │  SM → Create Story │
                                  └────────┬──────────┘
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                        ┌──────────┐ ┌──────────┐ ┌──────────┐
                        │  Dev-1   │ │  Dev-2   │ │   TEA    │
                        │ Story-1  │ │ Story-2  │ │  Tests   │
                        └──────────┘ └──────────┘ └──────────┘
                              │            │            │
                              └────────────┼────────────┘
                                           ▼
                                  ┌───────────────────┐
                                  │   Code Review      │
                                  │   Retrospective    │
                                  └───────────────────┘
```

## 注意事项与限制

### Claude Code Team Mode 限制

- **每个会话只能有一个 Team**：不能同时管理多个团队
- **Teammate 无法嵌套**：Teammate 不能再创建自己的 Team
- **无法恢复会话**：`/resume` 不会恢复 Teammate
- **tmux 依赖**：分屏模式需要 tmux，VS Code 终端不支持

### BMAD 集成注意

- **Skill 加载**：Teammate 可以使用 BMAD Skill（`/bmad:bmm:agents:*`），但需在 Prompt 中明确指示
- **config.yaml**：每个 Teammate 需要独立读取 `_bmad/bmm/config.yaml`
- **输出目录冲突**：多个 Teammate 不要同时写入同一个输出文件
- **Party Mode 不兼容**：Team Mode 下不要使用 Party Mode（本质冲突——Party Mode 是单会话多角色模拟）

### 成本考量

Team Mode 的 Token 消耗 = 单会话消耗 × Teammate 数量（近似）。建议：

- 研究/分析任务用 `haiku` 模型降低成本
- 实现任务用 `sonnet` 平衡质量和成本
- 架构/审查等关键任务用 `opus` 确保质量

```
Spawn teammate "researcher" with model haiku
Spawn teammate "dev-1" with model sonnet
Spawn teammate "reviewer" with model opus
```

## 快速参考

### 常用命令

| 操作 | 命令/说明 |
|------|---------|
| 创建团队 | 告诉 Claude "创建一个团队" |
| 查看任务 | `TaskList` |
| 发送消息 | `SendMessage type: "message" recipient: "dev-1"` |
| 关闭团队 | 向每个 Teammate 发送 `shutdown_request`，然后 `TeamDelete` |
| BMAD Skill | `/bmad:bmm:agents:dev`、`/bmad:bmm:agents:sm` 等 |
| 切换分屏 | tmux: `Ctrl+b` 然后方向键 |

### Teammate Spawn 模板

```
Spawn teammate "{name}" in {plan|normal} mode with model {sonnet|opus|haiku}:

你是 BMAD {角色名} {人物名}。
1. 读取 _bmad/bmm/config.yaml
2. 读取 _bmad-output/{相关文档}
3. 读取 project-context.md（如果存在）
4. 执行 {具体任务描述}
5. 产出物保存到 {输出路径}

约束：
- 只修改 {文件范围} 内的文件
- 遵循 red-green-refactor 循环
- 完成后通知 Team Lead
```

## 总结

BMAD 提供了**角色定义和工作流规范**，Claude Code Team Mode 提供了**并行执行和协作基础设施**。两者结合的关键是：

1. **Phase 1-2**：沿用 BMAD 单会话模式，人工深度参与
2. **Phase 3**：可选并行——Architect 和 UX Designer 同时工作
3. **Phase 4**：强烈推荐并行——多 Dev 同时实现不同 Story，TEA 同步编写测试
4. **始终**：让 SM 作为 Team Lead 协调全局，用计划审批保障质量
