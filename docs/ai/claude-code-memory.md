---
title: "Claude Code 记忆系统"
sidebar_position: 2
tags:
  - AI
  - Claude Code
  - 记忆系统
---

# Claude Code 记忆系统：CLAUDE.md 与 Auto Memory

> Claude Code 每次会话都从空白上下文开始。记忆系统让知识跨会话持久化——你不必每次都重复说明项目约定、构建命令、代码规范。记忆系统由两部分组成：**CLAUDE.md**（你写给 Claude 的指令）和 **Auto Memory**（Claude 自己积累的笔记）。

## 两套记忆，各司其职

| 维度 | CLAUDE.md | Auto Memory |
|------|-----------|-------------|
| **谁来写** | 你 | Claude |
| **内容** | 指令和规则 | 学习到的模式和偏好 |
| **作用域** | 项目 / 用户 / 组织 | 按项目（Git 仓库） |
| **加载方式** | 整个文件 | MEMORY.md 前 200 行 |
| **典型内容** | 编码规范、架构约定、工作流 | 构建命令、调试经验、用户偏好 |

## CLAUDE.md：你写的指令

### 文件层级

CLAUDE.md 存在于多个层级，**越具体的位置优先级越高**：

```
~/.claude/CLAUDE.md                  # 用户级：所有项目生效
./CLAUDE.md 或 ./.claude/CLAUDE.md   # 项目级：团队共享，纳入版本管理
./CLAUDE.local.md                    # 本地级：个人项目偏好，不提交 Git
```

组织级（IT 管理）：

| 平台 | 路径 |
|------|------|
| macOS | `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| Linux/WSL | `/etc/claude-code/CLAUDE.md` |
| Windows | `C:\Program Files\ClaudeCode\CLAUDE.md` |

### 加载规则

1. Claude Code 从当前工作目录**向上遍历**，加载每一级的 `CLAUDE.md` 和 `CLAUDE.local.md`
2. 工作目录**下级**的 CLAUDE.md 不会在启动时加载，而是在 Claude 读取到对应子目录的文件时按需加载
3. 加载顺序：用户级 → 项目级 → `.claude/rules/*.md`（按字母序）→ Auto Memory
4. 冲突时项目级覆盖用户级，组织级不可排除

### 模块化规则：`.claude/rules/`

大型项目可以将规则拆分到独立文件：

```
.claude/
  CLAUDE.md
  rules/
    code-style.md       # 编码风格
    testing.md          # 测试规范
    api-design.md       # API 设计
    frontend/
      react-conventions.md
```

**路径条件加载**——通过 YAML frontmatter 限定规则只在匹配的文件上生效：

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API 开发规范

- 所有接口必须包含入参校验
- 使用标准错误响应格式
```

没有 `paths` 字段的规则在启动时无条件加载。

用户级规则放在 `~/.claude/rules/`，适用于所有项目。支持符号链接，可跨项目共享：

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
```

### 导入语法

CLAUDE.md 中可以用 `@path` 引用其他文件：

```markdown
项目概览参考 @README.md，可用命令参考 @package.json

# Git 工作流
@docs/git-workflow.md
```

- 支持相对路径和绝对路径，相对路径以当前文件所在目录为基准
- 支持递归导入，最大深度 5 层
- 首次导入外部文件会触发确认弹窗

### 排除规则

在单仓库（monorepo）场景下，可以排除不相关的 CLAUDE.md：

```json
// .claude/settings.local.json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "**/other-team/.claude/rules/**"
  ]
}
```

### 编写原则

**控制篇幅**——单文件建议 200 行以内：

| 行数 | 规则遵循率 |
|------|-----------|
| < 200 行 | ~92%+ |
| > 400 行 | ~71% |

**祈使句优于描述句**：

```markdown
# 好
- 使用 2 空格缩进
- 提交前执行 `npm test`
- API handler 放在 `src/api/handlers/`

# 差
- 项目使用 TypeScript
- 代码应该格式化
- 保持文件有条理
```

**不要放的内容**：

- 密钥/Token——用环境变量
- 单次指令——直接在对话中说
- 仅针对特定文件的规则——用 `.claude/rules/` + `paths` 过滤

### Compact 行为

执行 `/compact` 压缩上下文后，Claude 会**从磁盘重新读取** CLAUDE.md。写在 CLAUDE.md 中的指令不会丢失；仅在对话中口头给出的指令会在压缩后丢失。

## Auto Memory：Claude 写的笔记

### 工作原理

Auto Memory 让 Claude 在工作中自动积累知识，无需你手动记录。Claude 会判断哪些信息值得跨会话保留——不是每次都写，只记录对未来会话有用的内容。

### 存储结构

每个项目的记忆目录位于 `~/.claude/projects/<project>/memory/`，`<project>` 由 Git 仓库根路径派生，同一仓库的所有 worktree 和子目录共享同一个记忆目录。

```
~/.claude/projects/<project>/memory/
  MEMORY.md            # 简洁索引，每次会话加载
  debugging.md         # 调试模式笔记
  api-conventions.md   # API 设计决策
  patterns.md          # 代码模式
```

### 200 行限制

**仅 `MEMORY.md` 的前 200 行**会在会话启动时加载，超过的部分不会被读取。Claude 会保持 MEMORY.md 简洁，将详细内容拆分到独立的主题文件中。

主题文件（如 `debugging.md`）启动时不加载，Claude 需要时按需读取。

:::tip
这个 200 行限制只针对 MEMORY.md，CLAUDE.md 文件不受此限制（但越简洁遵循率越高）。
:::

### 记什么 / 不记什么

**应该记的**：

- 经过多次交互确认的稳定模式和约定
- 关键架构决策、重要文件路径、项目结构
- 用户对工作流、工具、沟通风格的偏好
- 反复出现的问题的解决方案

**不应该记的**：

- 会话特定的上下文（当前任务细节、临时状态）
- 未经验证的信息——先对照项目文档确认
- 与 CLAUDE.md 重复或矛盾的内容
- 仅从单个文件得出的推测性结论

### 主动要求记忆

当你说 "记住以后都用 pnpm" 或 "always use bun" 时，Claude 会保存到 Auto Memory。如果想写入 CLAUDE.md，需要明确说 "把这条加到 CLAUDE.md"。

### 开关配置

| 方式 | 操作 |
|------|------|
| 会话内切换 | 执行 `/memory`，使用开关 |
| 项目设置 | `.claude/settings.json` 中 `"autoMemoryEnabled": false` |
| 用户设置 | `~/.claude/settings.json` 中 `"autoMemoryEnabled": false` |
| 环境变量 | `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`（覆盖所有其他设置） |

## 常用命令

### `/init`——初始化项目记忆

```bash
/init
```

Claude 会分析代码库（目录结构、配置文件、依赖等），生成一个初始的 `CLAUDE.md`，包含构建命令、测试方式、项目约定。大约 30 秒完成，准确率约 80%，之后手动补充 Claude 无法自动发现的信息。

如果 `CLAUDE.md` 已存在，`/init` 会**建议改进**而不是覆盖。

### `/memory`——查看和管理记忆

```bash
/memory
```

列出当前会话加载的所有记忆文件（CLAUDE.md、rules、auto memory），显示行数，支持切换 auto memory 开关，可以直接在编辑器中打开任意文件。

## 实际项目示例

一个典型的项目记忆配置：

```
my-project/
  CLAUDE.md                    # 团队共享：架构说明、编码规范
  CLAUDE.local.md              # 个人：本地开发偏好（不提交）
  .claude/
    settings.json              # 项目设置
    rules/
      api-design.md            # API 设计规范
      coding-conventions.md    # 编码约定
      database.md              # 数据库规范

~/.claude/
  CLAUDE.md                    # 用户级：全局偏好
  rules/
    git-workflow.md            # 个人 Git 工作流
  projects/
    my-project/
      memory/
        MEMORY.md              # Claude 的笔记索引
        debugging.md           # 调试经验
```

对应的 `CLAUDE.md` 内容结构：

```markdown
# My Project

## 构建命令
- `npm run build` — 构建
- `npm run test` — 运行测试
- `npm run test -- --grep "pattern"` — 运行单个测试

## 架构
- 采用 COLA 分层架构
- Controller 在 app 模块，Repository 实现在 infrastructure 模块

## 编码规范
- DI 使用 @RequiredArgsConstructor + final 字段
- 日期类型使用 LocalDateTime / LocalDate
- 所有 public 方法必须有 Javadoc
```

## 完整配置案例：Spring Boot 微服务项目

以一个多人协作的 Spring Boot 微服务项目为例，展示各层级应该配置什么内容。

### 目录总览

```
# ============ 用户级（个人全局，不提交） ============
~/.claude/
  CLAUDE.md                          # 个人偏好
  rules/
    git-workflow.md                  # 个人 Git 习惯
    communication.md                 # 沟通风格
  projects/
    pcm-patient/memory/              # Auto Memory（Claude 自动维护）
      MEMORY.md
      debugging.md

# ============ 项目级（团队共享，提交到 Git） ============
pcm-patient/
  CLAUDE.md                          # 项目入口：架构、命令、核心约定
  CLAUDE.local.md                    # 个人本地覆盖（.gitignore）
  .claude/
    settings.json                    # 项目设置
    rules/
      api-design.md                  # API URL 设计规范
      coding-conventions.md          # 编码命名约定
      database.md                    # 数据库设计标准
      module-structure.md            # COLA 模块结构
      querydsl.md                    # QueryDSL 使用规范
```

### 用户级 `~/.claude/CLAUDE.md`

放**所有项目通用的个人偏好**，与具体项目无关：

```markdown
# 个人偏好

## 语言与风格
- 用中文回答技术问题
- 代码注释用中文
- 不要在输出中使用 emoji

## 工具偏好
- 包管理器使用 Maven，不要用 Gradle
- 优先使用 IntelliJ IDEA 的快捷键风格
- Git commit message 用中文

## 通用编码习惯
- 缩进使用 4 空格
- 文件末尾保留空行
- import 语句按字母排序
```

### 用户级 `~/.claude/rules/git-workflow.md`

放**个人 Git 工作流**偏好（不强制团队）：

```markdown
# Git 工作流

- 提交前先 `git pull --rebase`
- 不要自动 push，等我确认后再推
- commit message 格式：类型(范围): 描述
  - feat(patient): 新增患者搜索功能
  - fix(empi): 修复 EMPI 匹配逻辑
- 不要使用 --force push
- 不要自动 amend 上一个 commit
```

### 项目级 `CLAUDE.md`

放**团队必须统一遵守的核心规则**，是整个记忆系统的入口：

```markdown
# PCM Patient 项目

## 构建命令
- `mvn clean compile` — 编译
- `mvn test -pl pcm-patient-app` — 运行 app 模块测试
- `mvn test -pl pcm-patient-app -Dtest=PatInfoControllerTest` — 单个测试类
- `mvn package -DskipTests` — 打包跳过测试

## 项目架构
- 采用 COLA 分层架构，7 模块结构
- 依赖方向：start → legacy → infrastructure → app → domain → api
- Controller 在 app 模块（Adapter 层），不在 start 模块
- 新代码写 COLA 模块，旧代码保留在 legacy 模块

## 核心约定
- DI 使用 @RequiredArgsConstructor + final 字段，禁止 @Autowired
- 新模块使用 QueryDSL，legacy 模块使用 MyBatis Plus
- 日期类型：LocalDateTime（字段名以 Time 结尾）/ LocalDate（以 Date 结尾）
- 所有 Controller 返回 Response<T>，分页返回 Response<PageList<T>>
- 禁止 SELECT *，必须列出具体字段

## 规范详情
详见 @.claude/rules/ 目录下的各规范文件
```

### 项目级 `.claude/rules/api-design.md`

放**具体领域的详细规范**，从 CLAUDE.md 拆分出来避免主文件过长：

```markdown
# API URL 设计规范

## URL 格式
/version/access-control/domain-object/action

示例：GET /v1/pt/patient-info/{patientInfoId}

## 访问控制级别
| 代码 | 级别 | 说明 |
|------|------|------|
| pb | Public | 无需认证 |
| pt | Protected | Token 认证 |
| df | Default | Token + 加解密 |
| pv | Private | 内部调用，不经网关 |

## 规则
- 路径使用名词，不用动词
- 使用单数形式：/ticket 不是 /tickets
- 最多 2 层嵌套：/ticket/12/message
- 使用 kebab-case：ticket-config
```

### 项目级 `.claude/rules/coding-conventions.md`

```markdown
---
paths:
  - "**/*.java"
---

# Java 编码约定

## 命名规范
| 层 | 类型 | 后缀 | 示例 |
|----|------|------|------|
| Adapter | 写入请求 | Request | UserCreateRequest |
| Adapter | 查询请求 | QueryRequest | UserListQueryRequest |
| Adapter | 响应 | Response | UserDetailResponse |
| Domain | 领域对象 | 无 | User |
| Infra | 数据库实体 | Entity | UserEntity |
| Infra | JOIN 结果 | Projection | UserWithDeptProjection |

## 强制规则
- 方法体不超过 80 行
- 禁止使用 Object / Map / JSONObject 作为参数或返回值
- 禁止注释掉的代码，直接删除
- 禁止使用 Optional 作为返回值，用 @Nullable 代替
- 使用枚举代替常量类
```

### 本地级 `CLAUDE.local.md`

放**个人本地环境差异**，不提交到 Git：

```markdown
# 本地开发环境

## 数据库连接
- 本地 MySQL: localhost:3306/pcm_patient
- 本地 Redis: localhost:6379

## 开发习惯
- 我负责 patient-bindcard 和 patient-empi 两个业务域
- 优先看 legacy 模块的旧实现再写新代码
- 测试用 @WebMvcTest，不要启动完整 Spring 容器
```

### Auto Memory（Claude 自动维护）

`~/.claude/projects/pcm-patient/memory/MEMORY.md`——Claude 在多次会话中自动积累：

```markdown
# PCM Patient 项目笔记

## 构建
- mvn compile 需要先 cd 到项目根目录
- pcm-patient-app 模块测试需要 spring-boot-starter-test 依赖（test scope）

## 调试经验
- QueryDSL Q 类是手写的，不要建议用 apt-maven-plugin 生成
- BeanNameConflict 错误用 FullyQualifiedAnnotationBeanNameGenerator 解决
- 详见 @debugging.md

## 用户偏好
- 用户喜欢先看完整的 diff 再确认提交
- 重构时保持旧类名不变，不加 New 后缀
```

### 各层级职责总结

| 层级 | 文件 | 配什么 | 谁维护 | 是否提交 |
|------|------|--------|--------|---------|
| 组织级 | `/etc/claude-code/CLAUDE.md` | 公司安全红线、合规要求 | IT/DevOps | N/A |
| 用户级 | `~/.claude/CLAUDE.md` | 个人偏好：语言、工具、沟通风格 | 你自己 | 不提交 |
| 用户级 | `~/.claude/rules/*.md` | 个人通用规则：Git 工作流 | 你自己 | 不提交 |
| 项目级 | `./CLAUDE.md` | 项目入口：架构、命令、核心约定 | 团队 | 提交 |
| 项目级 | `.claude/rules/*.md` | 详细规范：API、编码、数据库、模块 | 团队 | 提交 |
| 本地级 | `./CLAUDE.local.md` | 本地环境、个人负责的模块 | 你自己 | 不提交 |
| Auto Memory | `~/.claude/projects/*/memory/` | 构建经验、调试笔记、用户偏好 | Claude | 不提交 |

:::tip 配置原则
- **会变的放低层级**——本地数据库地址放 `CLAUDE.local.md`，不污染团队配置
- **团队统一的放项目级**——编码规范放 `.claude/rules/`，所有人同步
- **个人习惯放用户级**——Git 风格、沟通偏好放 `~/.claude/`，跨项目复用
- **篇幅大的拆 rules**——CLAUDE.md 控制在 200 行以内，详细规范拆到独立文件
- **让 Claude 记 Claude 的事**——构建踩坑、调试技巧让 Auto Memory 自动积累
:::

## 要点总结

1. **CLAUDE.md 是给 Claude 的指令**，你来写，团队共享；Auto Memory 是 Claude 的笔记，自动积累
2. **越具体越好**——祈使句、可验证的规则，200 行以内
3. **模块化管理**——大项目用 `.claude/rules/` 拆分，支持路径条件加载
4. **层级覆盖**——项目级 > 用户级，本地文件不提交 Git
5. **MEMORY.md 前 200 行**是硬限制，保持简洁，详细内容拆分到主题文件
6. **`/init` 快速起步**，`/memory` 查看和管理，口头 "记住" 会写入 Auto Memory
