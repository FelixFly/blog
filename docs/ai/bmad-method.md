---
title: "BMAD Method"
sidebar_position: 10
tags:
  - AI
  - SDD
  - BMAD
---

# BMAD Method：AI 驱动的敏捷开发框架

> [BMAD](https://github.com/bmad-code-org/BMAD-METHOD)（Breakthrough Method for Agile AI-Driven Development）是一个全生命周期的 AI 驱动开发框架。与 [OpenSpec](./openspec-sdd.md) 和 [Spec Kit](./spec-kit.md) 专注于"规范"不同，BMAD 的独特之处在于它引入了**多智能体协作**——用 12+ 个专业 AI 角色组成虚拟团队，从需求分析到代码实现全流程覆盖。

## 核心理念

传统 AI 编程工具帮你"做思考"，产出平庸结果。BMAD 的理念不同：

> **AI 不替你思考，而是作为专家协作者，引导你通过结构化流程产出最佳方案。**

BMAD 将开发过程分为两大阶段：

1. **智能体规划（Agentic Planning）**：专业 Agent 协作生成详尽的 PRD 和架构文档
2. **上下文工程开发（Context-Engineered Development）**：将规划转化为携带完整上下文的开发故事，交给 AI 逐个实现

## 与其他 SDD 框架的对比

| 维度 | BMAD | Spec Kit | OpenSpec |
|------|------|----------|----------|
| **架构** | 全生命周期多智能体团队 | 规范生成工具 | 轻量规范标准 |
| **Agent 数量** | 12+ 专业角色 | 单一 LLM | 单一 LLM |
| **工作流管理** | 内置敏捷/Sprint 管理 | 任务清单 | 提案→归档循环 |
| **上下文优化** | 自动分片（Context Sharding） | 手动管理 | IDE 依赖 |
| **学习曲线** | 较高（需敏捷经验） | 中等 | 低 |
| **适合场景** | 从零构建复杂系统 | 规范化开发 | 增量迭代开发 |

## 安装

### 环境要求

- Node.js v20+
- NPM v9+
- Git
- AI 编程工具：Claude Code、Cursor 或 VS Code

### 标准安装

```bash
npx bmad-method install
```

安装过程会引导你选择：
- 项目目录
- 安装模块（BMM 核心模块、BMB 构建器、TEA 测试架构等）
- AI 工具（Claude Code、Cursor、Copilot）

### 非交互安装（CI/CD 场景）

```bash
npx bmad-method install \
  --directory /path/to/project \
  --modules bmm \
  --tools claude-code \
  --yes
```

### 版本选择

```bash
# v6（推荐，最新特性）
npx bmad-method@alpha install

# v6 稳定版
npx bmad-method@6.0.1 install
```

## 官方模块

BMAD 采用模块化设计，按需安装：

| 模块 | 缩写 | 功能 |
|------|------|------|
| **BMad Method** | BMM | 核心框架，34+ 工作流 |
| **BMad Builder** | BMB | 自定义 Agent 和工作流创建 |
| **Test Architect** | TEA | 基于风险的测试策略自动化 |
| **Game Dev Studio** | BMGD | 游戏开发（Unity/Unreal/Godot） |
| **Creative Intelligence** | CIS | 创新、头脑风暴、设计思维 |

## 智能体（Agent）体系

BMAD 的核心是一组各司其职的 AI 智能体，每个都有独立的专业领域和行为约束：

### 规划阶段 Agent

| Agent | 职责 | 产出物 | 行为特征 |
|-------|------|--------|---------|
| **Analyst（分析师）** | 模糊意图 → 结构化需求 | `product-brief.md` | 刨根问底，不接受模糊描述 |
| **PM（产品经理）** | 需求优先级排序 | `PRD.md` + 用户故事 | 范围守门人，阻止功能膨胀 |
| **Architect（架构师）** | 需求 → 技术蓝图 | `ARCHITECTURE.md` + 数据库 Schema | 保守严谨，关注非功能需求 |
| **UX Designer（设计师）** | 前端交互规范 | 线框图描述 + 用户旅程 | 确保功能与布局兼顾 |

### 执行阶段 Agent

| Agent | 职责 | 产出物 | 行为特征 |
|-------|------|--------|---------|
| **Scrum Master（SM）** | 上下文分片 + 进度追踪 | Story 文件 + 状态文档 | 全局视野，心跳监控 |
| **Developer（开发者）** | 故事实现 | 源代码 + 单元测试 | 严格执行，遇冲突立即停止而非自行发挥 |
| **QA（测试架构师）** | 质量验证 | 测试框架 + 验证报告 | V6 支持视觉模型检查 UI |

### Agent 工作原则

每个 Agent 都有严格的行为边界：

- **Analyst** 不做技术决策，只关注业务需求
- **Architect** 不写业务代码，只定义技术方案
- **Developer** 不修改架构，遇到架构问题回退给 Architect
- **QA** 独立验证，不受 Developer 影响

这种角色隔离防止了 AI "越界"导致的一致性问题。

## 四阶段开发生命周期

```
Phase 1          Phase 2          Phase 3           Phase 4
分析与发现   →    规划    →      方案设计    →      实现
(Analyst)      (PM)          (Architect)     (SM + Dev + QA)
     ↓              ↓              ↓                ↓
product-brief   PRD.md      ARCHITECTURE.md    源代码 + 测试
```

### Phase 1：分析与发现

**主导 Agent**：Analyst（分析师）

启动方式：

```
# 在 AI 工具中加载 Analyst Agent
*workflow-init
```

Agent 会自动检测技术栈并推荐开发轨道：

| 轨道 | 适用场景 |
|------|---------|
| Quick Flow | 单文件修改、补丁、Bug 修复 |
| Standard Method | 典型应用开发 |
| Enterprise Flow | 大型系统，需合规审计 |

Analyst 通过多轮对话深入探索需求：

```
Analyst: 这个项目要解决什么核心问题？
你: 我想做一个在线预约系统
Analyst: 目标用户是谁？预约什么类型的服务？
你: 医疗机构的患者，预约门诊挂号
Analyst: 需要支持多科室吗？是否需要排班管理？
你: 是的，需要按科室和医生排班
...
```

**产出**：`product-brief.md`（简洁的产品愿景文档）

### Phase 2：规划

**主导 Agent**：PM（产品经理）

PM 基于产品简报，生成详尽的产品需求文档：

```markdown
# PRD：门诊预约系统

## 核心功能（MoSCoW 优先级）

### Must Have
- 患者注册和登录
- 科室和医生查询
- 在线预约挂号
- 预约取消和改期

### Should Have
- 预约提醒通知
- 就诊评价

### Could Have
- 智能推荐科室
- 候诊排队展示

### Won't Have (本期)
- 在线问诊
- 处方管理
```

PM 的核心价值：**零容忍范围蔓延**，非核心功能一律推入 Backlog。

**产出**：`PRD.md`、`epics.md`、`user_stories.md`

### Phase 3：方案设计

**主导 Agent**：Architect（架构师）

架构师基于 PRD 生成技术蓝图：

```markdown
# 架构文档：门诊预约系统

## 技术栈
- Spring Boot 3.2 + Java 17
- PostgreSQL 15 + Redis 7
- COLA 四层架构

## 核心模型
- Patient（患者）
- Doctor（医生）
- Department（科室）
- Schedule（排班）
- Appointment（预约）

## API 设计
- POST /v1/pt/appointment/add — 创建预约
- PUT /v1/pt/appointment/{id} — 修改预约
- DELETE /v1/pt/appointment/{id} — 取消预约
- POST /v1/pb/schedule/query — 查询排班
```

**产出**：`ARCHITECTURE.md`、`db-schema.sql`、`api_spec.json`、`tech-stack.md`

### Phase 4：实现

**主导 Agent**：Scrum Master → Developer → QA

这个阶段引入了 BMAD 最关键的创新——**上下文分片（Context Sharding）**。

## 核心创新：上下文分片

### 问题

LLM 的上下文窗口有限。当项目文档（PRD + 架构 + 故事）达到 MB 级别时，AI 会出现：
- 指令遗忘
- 幻觉输出
- 代码质量下降

### 解决方案

Scrum Master 将庞大的 PRD 分片为**原子化的 Story 文件**，每个文件只包含完成一个功能所需的全部信息：

```
docs/stories/
├── story-001-patient-register.md
├── story-002-doctor-query.md
├── story-003-schedule-query.md
├── story-004-appointment-create.md
├── story-005-appointment-cancel.md
└── story-006-appointment-remind.md
```

每个 Story 文件包含：

```markdown
# Story 004：创建预约

## 验收标准
- 患者可以选择科室、医生、时间段创建预约
- 同一时段不可重复预约
- 预约成功后发送确认通知

## 相关 Schema
CREATE TABLE t_appointment (
    id BIGINT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ...
);

## API 定义
POST /v1/pt/appointment/add
Request: AppointmentCreateRequest { patientId, doctorId, scheduleId }
Response: Response<AppointmentDetailResponse>

## 设计说明
- 使用乐观锁防止超约
- 预约成功后通过异步事件发送通知
```

### 效果

| 指标 | 不分片 | 分片后 |
|------|--------|--------|
| 上下文 Token 消耗 | 100% | ~10% |
| 指令遵循率 | 较低 | 极高 |
| 代码准确度 | 一般 | 显著提升 |

Developer Agent 加载 Story 文件时，只需读取 KB 级别的内容，而非 MB 级别的完整文档。

## 开发循环

Phase 4 的标准开发流程：

```
1. 你: "Start Story 004"
2. Developer Agent 加载 story-004.md + tech-stack.md
3. （可选 TDD）Agent 先写失败的单元测试
4. Agent 实现业务代码
5. Agent 运行本地测试自我验证
6. QA Agent 独立验证（Enterprise Flow）
7. Scrum Master 更新 workflow-status.md，解锁依赖故事
```

### Quick Spec Flow（快速修复）

不需要走完整流程的小改动：

```
1. 加载 Developer Agent
2. 描述要修改的内容
3. Agent 扫描代码库，生成微规范
4. 确认修改范围
5. 直接实现（通常 5 分钟内完成）
```

## 常用命令

在 AI 工具中使用：

| 命令 | 功能 |
|------|------|
| `/bmad-help` | 交互式引导，告诉你下一步该做什么 |
| `/bmad-help I just finished X` | 询问完成 X 后的下一步 |
| `*workflow-init` | 初始化工作流，检测技术栈 |
| `*brainstorming` | 启动头脑风暴工作流 |
| `*party-mode` | 多 Agent 协作讨论 |

### 工作流命令（BMM 模块）

| 工作流 | 功能 |
|--------|------|
| `create-product-brief` | 创建产品简报 |
| `prd` | 创建/验证/编辑 PRD |
| `create-architecture` | 架构设计 |
| `create-epics-and-stories` | 从 PRD 生成 Epic 和 Story |
| `sprint-planning` | Sprint 规划 |
| `dev-story` | 执行开发故事 |
| `code-review` | 对抗性代码审查 |
| `quick-spec` | 快速规范工程 |
| `quick-dev` | 快速开发（执行技术规范或直接指令） |

## Party Mode：多 Agent 协作

BMAD 的特色功能——在一个会话中让多个 Agent 角色协作讨论：

```
*party-mode

你: 讨论一下预约系统的并发处理方案

Architect: 建议使用乐观锁 + 版本号机制，避免悲观锁的性能瓶颈...
Developer: 实现上可以用 @Version 注解配合 QueryDSL 的 update...
QA: 需要编写并发测试用例，模拟多人同时预约同一时段...
PM: 从产品角度，超约时应该给用户友好的提示而非技术错误...
```

多个 Agent 从各自专业角度贡献意见，比单一 AI 助手的回答更全面。

## 自定义 Agent

通过 BMad Builder（BMB）模块，可以创建团队专属的 Agent：

在 `.bmad/agents/` 目录下创建 Markdown 文件：

```markdown
# Role: 安全审计师

## Context
专注于医疗信息系统安全合规

## Responsibilities
- 审查 API 接口的认证和授权
- 检查敏感数据（患者信息）的加密存储
- 验证 HIPAA / 等保合规性

## Constraints
- 不修改业务逻辑
- 不更改数据库 Schema
- 只提出安全建议和风险报告
```

保存后，该 Agent 即可在工作流中调用。

## 项目配置

安装后在项目中生成 `.bmad/` 目录：

```
.bmad/
├── config.yaml          # 项目配置
├── agents/              # 自定义 Agent
├── workflows/           # 自定义工作流
└── templates/           # 文档模板
```

`config.yaml` 示例：

```yaml
project:
  name: "appointment-system"
  type: "java_springboot"

agents:
  default: "java-dev"
  available:
    - "java-architect"
    - "security-auditor"

quality:
  pre_commit:
    - "mvn test"
    - "mvn checkstyle:check"

paths:
  docs: "docs/"
  tests: "src/test/"
```

关键配置项：

- **project.type**：决定加载哪些框架特定的最佳实践
- **quality.pre_commit**：Story 完成前的强制质量门禁

## 常见问题

### `*workflow-init` 无响应

- 检查 Node.js 版本：`node -v`（需 v20+）
- 检查 IDE 文件监听权限
- 重启终端

### Agent 引用不存在的库

- 确认 Phase 3 生成了 `tech-stack.md`
- 验证 Developer Agent 的系统提示包含技术栈文件引用

### 上下文过长导致质量下降

- 让 Scrum Master 重新分片，确保每个 Story 文件不超过目标大小
- 实现前清理 AI 对话窗口
- 每个 Story 启动新的对话上下文

## 最佳实践

### 渐进采用

不需要一次性使用所有 Agent。建议的采用路径：

```
入门：Quick Spec + Quick Dev（快速体验）
  ↓
进阶：Analyst + PM + Architect（完整规划）
  ↓
精通：全流程 + 自定义 Agent + Party Mode
```

### 文档即真相

BMAD 的核心信条：文档是第一公民，代码是它的派生物。每次架构变更都应该先更新文档，再修改代码。

### 信任角色边界

不要让 Developer Agent 做架构决策，也不要让 Architect 写业务代码。角色隔离是保证一致性的关键。

### 善用 Context Sharding

Story 文件越小越好。一个 Story 应该在一次 AI 对话中就能完成实现。如果需要多次对话，说明 Story 粒度太粗，需要拆分。

## 参考资料

- [BMAD Method GitHub 仓库](https://github.com/bmad-code-org/BMAD-METHOD)
- [BMAD 官方文档](https://docs.bmad-method.org/)
- [Applied BMAD：Reclaiming Control in AI Development](https://bennycheung.github.io/bmad-reclaiming-control-in-ai-dev)
- [BMAD Method 深度指南](https://redreamality.com/garden/notes/bmad-method-guide/)
- [Introducing BMAD-METHOD：A Universal AI Agent Framework](https://ziyu4huang.github.io/blogs/posts/2025-10-04-introducing-bmad-method/)
- [SDD 框架对比：BMAD vs Spec Kit vs OpenSpec vs PromptX](https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)
