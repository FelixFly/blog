---
title: "Spec Kit"
sidebar_position: 9
tags:
  - AI
  - SDD
  - Spec Kit
---

# GitHub Spec Kit：规范驱动开发（SDD）工具包

> [Spec Kit](https://github.com/github/spec-kit) 是 GitHub 官方开源的 SDD 工具包，核心理念是**规范生成实现**——不是从模糊需求直接跳到代码，而是通过 Constitution → Specify → Plan → Tasks → Implement 五个阶段，逐步将意图细化为可执行的规范，再由 AI 生成代码。

## SDD 的核心翻转

传统开发中，代码是主角，文档是附属品。SDD 颠倒了这个关系：

> **规范不服务于代码，代码服务于规范。**

代码只是规范在某个语言和框架中的"表达"。维护软件 = 演进规范，而非手动修改代码。

### SDD 六大原则

| 原则 | 说明 |
|------|------|
| **规范即主要产出物** | 规范是第一公民，代码是它的表达 |
| **可执行的规范** | 规范足够精确，可以直接驱动代码生成 |
| **持续精炼** | 不是一次性定稿，而是持续发现歧义和矛盾 |
| **研究驱动的上下文** | AI 代理调研技术选项、性能影响、组织约束 |
| **双向反馈** | 生产数据和运维经验反哺规范演进 |
| **分支探索** | 同一规范可生成多种实现方案进行对比 |

## Spec Kit vs OpenSpec

在阅读本文之前，建议先了解 [OpenSpec & SDD](./openspec-sdd.md) 中关于 SDD 的基础概念。两者的核心区别：

| 维度 | Spec Kit | OpenSpec |
|------|----------|----------|
| 出品方 | GitHub 官方 | Fission AI 社区 |
| 定位 | 结构化、模板驱动 | 轻量级、灵活 |
| 工作流 | 五阶段线性流程 | 三步循环（提案→实现→归档） |
| 核心特色 | Constitution 宪章机制 | 双文件夹分离模型 |
| 模板系统 | 内置丰富模板，约束 AI 行为 | 较自由，手动定义 |
| 适合场景 | 新项目从零开始、需要严格规范 | 存量项目增量开发 |

## 安装

### 环境要求

- Python 3.11+
- Git
- [uv](https://docs.astral.sh/uv/) 包管理器
- 支持的 AI 编程工具

### 安装 CLI

```bash
# 持久安装（推荐）
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 一次性使用（不安装）
uvx --from git+https://github.com/github/spec-kit.git specify init my-project

# 升级到最新版
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
```

### 检查环境

```bash
specify check
```

验证 Git、Python、AI 工具等是否就绪。

## 初始化项目

### 新项目（Greenfield）

```bash
specify init my-project --ai claude
```

### 已有项目（Brownfield）

```bash
cd existing-project
specify init --here --ai claude
```

### 支持的 AI 工具

通过 `--ai` 参数指定：

| 参数值 | AI 工具 |
|--------|---------|
| `claude` | Claude Code |
| `copilot` | GitHub Copilot |
| `gemini` | Google Gemini CLI |
| `cursor-agent` | Cursor |
| `windsurf` | Windsurf |
| `qwen` | Qwen Code |

### init 可选参数

```bash
specify init my-project \
  --ai claude \           # 指定 AI 工具
  --no-git \              # 跳过 git 初始化
  --script sh \           # 脚本类型：sh 或 ps（PowerShell）
  --ai-skills \           # 同时安装 AI 技能文件
  --force                 # 非空目录强制初始化
```

## 项目结构

初始化后生成以下目录：

```
my-project/
├── .github/
│   └── prompts/                    # AI 代理的提示词模板
│       ├── specify.prompt.md       # Specify 阶段提示词
│       ├── plan.prompt.md          # Plan 阶段提示词
│       └── tasks.prompt.md         # Tasks 阶段提示词
├── .specify/
│   ├── memory/
│   │   └── constitution.md         # 项目宪章（不可违反的原则）
│   ├── scripts/
│   │   └── helpers.sh              # 辅助脚本
│   └── templates/
│       ├── specification.md        # 规范模板
│       ├── plan.md                 # 计划模板
│       └── tasks.md                # 任务模板
├── .specify/features/              # 功能目录（工作流产出物）
│   └── 001-feature-name/
│       ├── specification.md        # 需求规范
│       ├── plan.md                 # 技术方案
│       └── tasks.md                # 任务清单
└── src/                            # 源代码
```

## 五阶段工作流

Spec Kit 的工作流是**线性递进**的，每个阶段审查通过后才进入下一阶段：

```
Constitution → Specify → Plan → Tasks → Implement
    宪章          规范       计划     任务      实现
```

### 第一阶段：Constitution（宪章）

宪章是项目的"根本法"，定义不可违反的开发原则。它在项目初始化时创建，贯穿整个生命周期。

```bash
/speckit.constitution
```

宪章示例（`constitution.md`）：

```markdown
# 项目宪章

## Article I: 库优先
每个功能先作为独立、可复用的库组件实现。

## Article II: CLI 接口
库通过命令行接口暴露功能，支持文本和 JSON 输入输出。

## Article III: 测试先行
任何实现之前必须先编写全面的测试，测试必须先确认失败。

## Article IV: 最小依赖
每个项目最多 3 个外部依赖，优先使用标准库。

## Article V: 简单至上
禁止过度抽象，直接使用框架能力而非包装层。

## Article VI: 集成测试优先
优先使用真实数据库和服务，而非 Mock；实现前必须有契约测试。
```

宪章的意义：**即使换了不同的 AI 工具、不同的开发者，只要遵循同一份宪章，产出就保持一致。**

### 第二阶段：Specify（规范）

定义"做什么"和"为什么"，**刻意排除技术实现细节**：

```bash
/speckit.specify
```

AI 根据你的描述生成 `specification.md`，包含：

- 用户故事和使用场景
- 验收标准
- 工作流描述
- 成功指标
- `[NEEDS CLARIFICATION]` 标记（AI 不确定的地方）

规范示例：

```markdown
# 功能规范：用户评论系统

## 用户故事
- 作为读者，我希望能对文章发表评论，以便表达观点
- 作为作者，我希望能管理评论，以便维护讨论质量

## 验收标准
- [ ] 已登录用户可以发表评论
- [ ] 评论支持 Markdown 格式
- [ ] 作者可以删除不当评论
- [ ] 评论按时间倒序展示

## 非功能需求
- 评论加载时间 < 200ms
- 支持每篇文章 1000+ 条评论

## [NEEDS CLARIFICATION]
- 是否需要评论审核功能？
- 是否支持嵌套回复？
```

如果规范中有不清晰的地方，可以用 `/speckit.clarify` 进一步澄清。

### 第三阶段：Plan（计划）

确定"怎么做"——技术栈、架构、数据库设计等：

```bash
/speckit.plan
```

AI 生成 `plan.md`，包含：

- 技术选型及理由
- 数据模型设计
- API 接口设计
- 架构方案
- 安全考虑

计划示例：

```markdown
# 技术方案：用户评论系统

## 技术选型
- 后端：Spring Boot 3.2 + Java 17
- 数据库：PostgreSQL（已有基础设施）
- 缓存：Redis（热门文章评论缓存）

## 数据模型
### t_comment
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键（雪花 ID） |
| article_id | BIGINT | 文章 ID |
| user_id | BIGINT | 评论者 ID |
| content | TEXT | 评论内容（Markdown） |
| parent_id | BIGINT | 父评论 ID（支持嵌套） |
| create_time | DATETIME | 创建时间 |

## API 设计
- POST /v1/pt/comment/add — 发表评论
- DELETE /v1/pt/comment/{commentId} — 删除评论
- POST /v1/pt/comment/query — 分页查询评论
```

同一份规范可以生成**多套技术方案**进行对比（分支探索）。

### 第四阶段：Tasks（任务）

将计划分解为可独立执行的原子任务：

```bash
/speckit.tasks
```

AI 生成 `tasks.md`：

```markdown
# 任务清单

## Phase 1: 基础设施
- [ ] 创建 t_comment 数据表和索引
- [ ] 创建 Comment 领域模型和 Q 类
- [ ] 实现 CommentRepository

## Phase 2: 核心逻辑
- [ ] 实现 CommentDomainService（发表、删除、查询）
- [ ] 实现 CommentAppService（编排层）
- [ ] 编写单元测试

## Phase 3: 接口层
- [ ] 实现 CommentController（3 个接口）
- [ ] 创建 Request/Response DTO
- [ ] 编写 Controller 测试

## Phase 4: 增强
- [ ] 添加 Redis 缓存
- [ ] 添加评论内容审核
- [ ] 更新 API 文档
```

任务标注了哪些可以并行执行，哪些有依赖关系。

### 第五阶段：Implement（实现）

AI 按照任务清单逐项实现：

```bash
/speckit.implement
```

每个任务的实现都可以追溯到具体的规范需求，审查时非常清晰。

## 辅助命令

除了五个核心阶段命令，还有几个辅助工具：

| 命令 | 功能 | 使用时机 |
|------|------|---------|
| `/speckit.clarify` | 澄清规范中的模糊点 | Specify 之后、Plan 之前 |
| `/speckit.analyze` | 检查各产出物之间的一致性 | 任何阶段之间 |
| `/speckit.checklist` | 生成质量验证清单 | Plan 或 Tasks 之后 |

## 模板机制

Spec Kit 的模板不只是格式指引，它通过七种机制**约束 AI 的行为**：

| 机制 | 作用 |
|------|------|
| **抽象强制** | 模板要求关注 WHAT 和 WHY，显式排除 HOW |
| **不确定标记** | 强制 AI 用 `[NEEDS CLARIFICATION]` 标记模糊点，而非自行假设 |
| **系统化清单** | 自我审查框架确保覆盖完整 |
| **架构门禁** | 实现前的检查点，确保符合宪章原则 |
| **细节层次** | 将实现复杂度抽取到独立文件 |
| **测试优先** | 要求在源代码之前创建契约和测试 |
| **防止臆测** | 禁止"可能需要"的功能，每个需求必须追溯到具体用户故事 |

## 实战示例：从零构建待办应用

### 1. 初始化

```bash
# 安装 CLI
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 创建项目
specify init todo-app --ai claude

cd todo-app
```

### 2. 定义宪章

在 Claude Code 中：

```
/speckit.constitution
```

输入项目原则：
- 使用 React + TypeScript
- 后端 Node.js + Express
- 数据库 SQLite（轻量）
- 测试覆盖率 > 80%

### 3. 编写规范

```
/speckit.specify
```

描述你想要什么：

> 我想构建一个待办事项应用。用户可以添加任务、标记完成、删除任务。
> 任务可以设置优先级（高/中/低）和截止日期。
> 支持按优先级和截止日期排序。

AI 生成详尽的 `specification.md`，标记出需要澄清的点。

### 4. 制定方案

```
/speckit.plan
```

AI 基于规范和宪章，生成技术方案：数据模型、API 设计、前端组件结构。

审查后如果不满意，可以要求生成替代方案对比。

### 5. 分解任务

```
/speckit.tasks
```

AI 将方案拆分为 10-15 个原子任务，标注依赖关系和并行机会。

### 6. 逐步实现

```
/speckit.implement
```

AI 按照任务清单逐项实现，每完成一项你都可以审查。

## 最佳实践

### 初始提示要详尽

给 AI 的第一个描述越详细越好。边界条件、错误处理、性能要求——提前说清楚，比事后修改成本低得多。

> 花 1 小时写好规范，节省 10 小时返工。

### 规范是活文档

规范不是写完就扔的。随着对需求理解加深，持续更新规范，就像重构代码一样。

### 自定义模板

Spec Kit 内置的模板是通用的。根据你团队的实际情况修改模板，加入团队特有的约定和检查项。

### 拥抱分支探索

同一份规范，让 AI 用不同技术栈实现。比如一个用 React 一个用 Vue，对比后选择更合适的方案。这在传统开发中成本极高，但在 SDD 中几乎免费。

### 宪章要精炼

宪章不是技术文档，而是原则。3-9 条核心原则足够，过多反而让 AI 无所适从。

## 参考资料

- [GitHub Spec Kit 仓库](https://github.com/github/spec-kit)
- [Spec-Driven Development 原理文档](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [Microsoft 官方博客：Diving Into SDD With Spec Kit](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
- [Microsoft Learn：规范驱动开发与 Spec Kit 入门](https://learn.microsoft.com/zh-cn/training/modules/spec-driven-development-github-spec-kit-greenfield-intro/)
- [IntuitionLabs：A Guide to Spec-Driven AI Development](https://intuitionlabs.ai/articles/spec-driven-development-spec-kit)
- [Scott Logic：Putting Spec Kit Through Its Paces](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html)
