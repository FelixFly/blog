---
title: "Superpowers"
sidebar_position: 4
tags:
  - AI
  - Claude Code
  - Superpowers
---

# Superpowers：Claude Code 的技能框架

> [Superpowers](https://github.com/obra/superpowers) 是一个为 AI 编程助手设计的技能框架（Skills Framework），它将 Claude Code 从一个"代码生成器"转变为一个遵循工程纪律的"高级开发者"。核心思想：**不是让 AI 随意写代码，而是让 AI 遵循结构化的开发流程——先设计、再规划、后实现、最后验证。**

## 为什么需要 Superpowers

直接使用 Claude Code 时，AI 倾向于：
- 收到需求后**立即开始写代码**，跳过设计思考
- 遇到 Bug 时**猜测修复**，而非系统排查根因
- 声称"已修复"但**没有验证**就标记完成
- 多步骤任务中**丢失上下文**，前后不一致

Superpowers 通过一系列"技能（Skill）"解决这些问题：

| 问题 | Superpowers 的解决方式 |
|------|----------------------|
| 跳过设计直接编码 | `brainstorming` 技能强制先进行设计讨论 |
| 猜测性修复 Bug | `systematic-debugging` 强制四阶段根因分析 |
| 未验证就宣布完成 | `verification-before-completion` 要求运行验证命令 |
| 上下文丢失 | 将计划写入文件，跨会话持久化 |
| 测试覆盖不足 | `test-driven-development` 强制 RED-GREEN-REFACTOR |

## 四大核心原则

| 原则 | 说明 |
|------|------|
| **测试驱动开发** | 测试先于实现，没有测试的代码可能被删除 |
| **系统化方法** | 用定义好的流程取代临时起意 |
| **简单优先** | YAGNI + DRY，复杂度最小化 |
| **基于证据** | 修复必须被验证通过，而非口头声称 |

## 安装

### 通过插件市场安装（推荐）

```bash
# 在 Claude Code 中执行
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### 手动安装

在项目的 `.claude/plugins.json` 中添加：

```json
{
  "plugins": {
    "superpowers": {
      "type": "github",
      "owner": "obra",
      "repo": "superpowers"
    }
  }
}
```

### Cursor 安装

```
/plugin-add superpowers
```

### 更新

```bash
/plugin update superpowers
```

### 验证安装

安装后，尝试让 Claude 规划一个功能或调试一个问题。如果技能正确加载，Claude 会自动进入结构化流程而非直接写代码。

## 核心工作流

Superpowers 定义了一条从设计到交付的完整开发流水线：

```
brainstorming → writing-plans → using-git-worktrees → executing-plans → test-driven-development
     设计            规划            隔离环境             执行               测试驱动
                                                          ↓
                                        requesting-code-review → finishing-a-development-branch
                                              代码审查                   完成分支
```

### 第一步：头脑风暴（Brainstorming）

**触发时机**：任何创建性工作——新功能、新组件、修改行为

这是 Superpowers 最重要的技能。当你描述一个需求时，Claude **不会立即写代码**，而是：

1. 通过苏格拉底式提问深入理解需求
2. 探索替代方案和边界条件
3. 生成结构化的设计文档
4. 分段展示设计，逐段让你确认

```
你: 我想给博客添加评论功能

Claude (brainstorming):
  好的，让我先理解几个问题：
  1. 评论需要用户登录吗？还是支持匿名评论？
  2. 需要嵌套回复吗？还是只支持平级评论？
  3. 需要评论审核机制吗？
  4. 评论数据存在哪里？自建还是第三方服务（如 Giscus）？
  ...

  基于你的回答，我生成了以下设计文档：

  ## 设计方案：博客评论系统
  ### 功能范围
  - 支持已登录用户发表评论
  - 支持两级嵌套回复
  - 作者可以删除评论
  ...

  你觉得这个方案如何？有需要调整的地方吗？
```

**产出**：设计文档（保存到文件，不依赖对话记忆）

### 第二步：编写计划（Writing Plans）

**触发时机**：设计方案获批后

将设计拆分为 2-5 分钟的小任务，每个任务包含：

- 准确的文件路径
- 完整的代码变更说明
- 验证步骤

```markdown
# 实现计划：博客评论系统

## Phase 1: 数据层
### Task 1.1: 创建评论数据表
- 文件: src/db/migrations/001_create_comments.sql
- 操作: 创建 t_comment 表（id, article_id, user_id, content, parent_id, create_time）
- 验证: 运行 migration，确认表已创建

### Task 1.2: 创建 Comment 模型
- 文件: src/domain/comment/Comment.java
- 操作: 创建领域模型，继承 BaseQuerydslEntity
- 验证: 编译通过

## Phase 2: 业务逻辑
### Task 2.1: 编写评论服务测试（RED）
- 文件: src/test/java/.../CommentDomainServiceTest.java
- 操作: 编写 addComment、deleteComment、queryComments 的测试用例
- 验证: 测试全部失败（RED 状态）
...
```

计划生成的目录结构：

```
.plans/
├── PLAN.md          # 完整路线图
├── progress.md      # 当前进度
└── verification.md  # 验证命令和成功标准
```

### 第三步：隔离开发（Using Git Worktrees）

**触发时机**：计划获批后，开始实现前

自动创建 Git Worktree，在隔离的分支中工作：

```bash
# Superpowers 自动执行：
git worktree add .worktrees/feature-comments -b feature/blog-comments
cd .worktrees/feature-comments
# 运行测试基线，确认主干是绿色的
npm test  # 或 mvn test
```

好处：
- 不影响主分支的工作状态
- 可以同时开发多个功能
- 出问题时随时丢弃，零风险

### 第四步：执行计划（Executing Plans / Subagent-Driven Development）

**触发时机**：环境就绪后

两种执行模式：

**批量执行（Executing Plans）**：Claude 按任务清单逐项实现，每完成一批任务暂停，等你审查后继续。

**子代理执行（Subagent-Driven Development）**：为每个任务派发独立的子代理（Subagent），每个子代理有新鲜的上下文窗口。完成后进行两阶段审查：
1. **规范合规性**：实现是否符合设计文档
2. **代码质量**：代码是否清晰、可维护

子代理可以自主工作最长 2 小时，无需人工干预。

### 第五步：测试驱动开发（TDD）

**触发时机**：实现过程中自动激活

严格的 RED-GREEN-REFACTOR 循环：

```
RED:     编写失败的测试 → 确认测试确实失败
GREEN:   编写最少量的代码让测试通过
REFACTOR: 重构代码，保持测试绿色
COMMIT:  提交这一轮的变更
```

如果 Claude 在没有测试的情况下写了代码，Superpowers 可能会删除这段代码并要求重写。

### 第六步：代码审查（Code Review）

**触发时机**：任务完成后

**请求审查（Requesting Code Review）**：
- 生成预审清单
- 按严重程度报告问题（Critical / Major / Minor）
- Critical 问题会阻断后续流程

**接收审查（Receiving Code Review）**：
- 对审查意见进行技术验证，而非盲目接受
- 分类处理反馈
- 不确定的建议先测试再决定

### 第七步：完成分支（Finishing a Development Branch）

**触发时机**：所有任务完成且测试通过后

提供四个选项：

| 选项 | 说明 |
|------|------|
| **Merge** | 合并到主分支 |
| **PR** | 创建 Pull Request |
| **Retain** | 保留分支，稍后处理 |
| **Discard** | 丢弃分支和所有变更 |

自动清理 Worktree。

## 完整技能清单

### 测试与质量

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `test-driven-development` | RED-GREEN-REFACTOR 循环 | 写代码时自动激活 |
| `verification-before-completion` | 运行验证命令确认结果 | 声称完成前 |

### 调试

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `systematic-debugging` | 四阶段根因分析 | 遇到 Bug 或错误时 |

四阶段流程：
1. **根因追踪**：追溯问题源头，而非修表面症状
2. **模式分析**：检查代码库中是否有类似问题
3. **假设验证**：形成假说并用证据验证
4. **实施修复**：确认根因后才修复

如果三次修复尝试都失败，触发架构审查。

### 规划与设计

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `brainstorming` | 苏格拉底式设计对话 | 创建性工作启动时 |
| `writing-plans` | 生成详细实现计划 | 设计获批后 |
| `executing-plans` | 批量执行并设检查点 | 开始实现时 |

### 开发流程

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `using-git-worktrees` | 创建隔离开发环境 | 功能开发启动时 |
| `subagent-driven-development` | 子代理并行开发 | 执行计划时 |
| `finishing-a-development-branch` | 分支合并/PR/清理 | 开发完成时 |

### 协作

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `dispatching-parallel-agents` | 并行子代理调度 | 独立任务并行时 |
| `requesting-code-review` | 发起代码审查 | 任务完成后 |
| `receiving-code-review` | 处理审查反馈 | 收到反馈时 |

### 元技能

| 技能 | 功能 | 触发时机 |
|------|------|---------|
| `writing-skills` | 创建新的自定义技能 | 需要扩展技能库时 |
| `using-superpowers` | 技能系统入门引导 | 首次使用时 |

## 实战示例：调试随机登出问题

```
你: 用户反馈登录后会随机被登出

Claude (systematic-debugging 激活):

## 第一阶段：根因追踪
让我检查相关代码...
- Token 刷新逻辑: src/auth/tokenRefresh.js
- 会话管理: src/auth/sessionManager.js
- 发现: tokenRefresh 中存在竞态条件——多个并发请求同时触发刷新，
  旧 Token 被新 Token 覆盖但部分请求仍持有旧 Token

## 第二阶段：模式分析
检查代码库中是否有类似的竞态问题...
- 找到 2 处类似模式：缓存刷新和配置重载

## 第三阶段：假设验证
假说：并发请求触发多次 Token 刷新导致旧 Token 失效
验证方案：编写并发测试模拟多请求同时刷新

## 第四阶段：实施修复（TDD 模式）
RED:  编写测试——模拟 10 个并发请求同时触发 Token 刷新
GREEN: 用锁机制确保只有一个刷新请求执行，其他等待结果
REFACTOR: 抽取通用的 SingleFlight 模式

验证：运行全部测试，确认通过 ✓
```

## 实战示例：开发邮箱验证器

```
你: 创建一个邮箱地址验证器

Claude (brainstorming 激活):
  在开始之前，我需要了解几个问题：
  1. 需要支持哪些格式？仅 RFC 5322 标准还是包括国际化地址？
  2. 是否需要验证域名存在性（DNS MX 记录）？
  3. 是否需要处理子地址（user+tag@example.com）？

你: 支持标准格式和子地址，不需要 DNS 验证

Claude (writing-plans 激活):
  ## 实现计划
  ### Task 1: 编写基础测试（RED）
  - 测试标准格式: user@example.com ✓
  - 测试缺少 @: userexample.com ✗
  - 测试子地址: user+tag@example.com ✓

  ### Task 2: 最小实现（GREEN）
  - 基础字符串验证

  ### Task 3: 增强实现（REFACTOR）
  - RFC 5322 正则表达式
  - 本地部分和域名分别验证

Claude (test-driven-development 激活):
  开始执行...

  RED: 3 个测试编写完成，全部失败 ✓
  GREEN: EmailValidator.isValid() 实现，测试通过 ✓
  REFACTOR: 拆分为 validateLocalPart + validateDomain ✓

  所有测试通过，提交变更。
```

## 自定义技能

Superpowers 支持创建团队专属的技能。使用 `writing-skills` 元技能来创建：

技能文件结构（`SKILL.md`）：

```markdown
# Skill: 数据库变更审查

## Purpose
在执行数据库 Migration 前，自动审查 SQL 变更的安全性。

## Trigger
当检测到 SQL migration 文件被创建或修改时自动激活。

## Methodology
1. 检查是否有破坏性变更（DROP TABLE/COLUMN）
2. 检查是否有索引影响（大表加索引需要 CONCURRENTLY）
3. 检查是否有锁表风险
4. 生成审查报告

## Anti-patterns
- 不要在生产环境直接执行未审查的 Migration
- 不要在大表上添加 NOT NULL 列而不提供默认值

## Verification
- 审查报告已生成
- 所有 Critical 问题已标记
```

自定义技能保存在 `~/.config/superpowers/` 目录中，通过 Git 管理版本。

个人技能可以**覆盖**同名的核心技能（Shadow 机制），实现定制化。

## 与其他 SDD 框架的关系

| 维度 | Superpowers | OpenSpec | Spec Kit | BMAD |
|------|------------|----------|----------|------|
| **定位** | 开发流程技能库 | 轻量规范标准 | 规范生成工具 | 全生命周期框架 |
| **工作方式** | 自动激活技能链 | 手动斜杠命令 | 阶段线性推进 | 多 Agent 协作 |
| **核心优势** | TDD + 自动化流程 | 双文件夹模型 | 模板约束 AI | 上下文分片 |
| **学习曲线** | 低（自动激活） | 低 | 中 | 高 |
| **侧重点** | 代码质量和流程 | 规范管理 | 规范生成 | 团队协作 |

Superpowers 专注于**开发过程的工程纪律**，而 [OpenSpec](./openspec-sdd.md)、[Spec Kit](./spec-kit.md)、[BMAD](./bmad-method.md) 更侧重于**需求和规范管理**。它们不是互斥的——可以用 BMAD 做规划，用 Superpowers 做实现。

## 最佳实践

### 信任流程

当 `brainstorming` 技能激活时，不要急于跳到实现。设计阶段投入的时间会在实现阶段成倍节省。

### 提供充分上下文

头脑风暴阶段，把你知道的需求细节、约束条件、边界情况尽量说清楚。信息越充分，设计方案越精准。

### 不要跳过验证

`verification-before-completion` 是最后一道防线。如果你发现 Claude 声称"已完成"但没有运行测试，说明技能可能未正确加载。

### 善用子代理

对于可并行的任务（如前端组件 A 和 API 接口 B 互不依赖），使用 `dispatching-parallel-agents` 让多个子代理同时工作，大幅提升效率。

### 监控技能差距

检查 `~/.config/superpowers/search-log.jsonl`，这里记录了你搜索过但不存在的技能。频繁出现的条目说明你需要创建新的自定义技能。

## 参考资料

- [Superpowers GitHub 仓库](https://github.com/obra/superpowers)
- [Superpowers 插件市场](https://github.com/obra/superpowers-marketplace)
- [Superpowers 博客：How I'm using coding agents](https://blog.fsck.com/2025/10/09/superpowers/)
- [Superpowers 完整指南 2026](https://pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide)
- [Superpowers 核心技能深度解析](https://www.vibesparking.com/en/blog/ai/claude-code/superpowers/2025-12-26-obra-superpowers-claude-code-core-skills-library/)
- [Superpowers 实战教程](https://www.trevorlasn.com/blog/superpowers-claude-code-skills)
- [Superpowers Skills Deep Dive](https://skills.deeptoai.com/en/docs/development/superpowers-deep-dive)
