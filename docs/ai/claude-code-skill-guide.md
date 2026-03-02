# Claude Code Skill 创建与使用指南

> 面向小白的 Skill 最佳实践

## 什么是 Skill？

Skill 是 Claude Code 的**可复用能力扩展包**。你可以把它理解为给 Claude 写的"标准操作手册"——将你的专业知识、工作流程、常用脚本打包成一个模块，让 Claude 在遇到特定场景时自动按照你定义的流程执行。

**一句话总结：Skill = 触发条件 + 执行指令 + 可选资源文件**

| 问题 | Skill 如何解决 |
|------|-------------|
| 每次都要重复解释同样的流程 | 写一次，永久复用 |
| Claude 不了解公司内部规范 | 把规范写进 Skill |
| 复杂操作容易遗漏步骤 | 定义明确的步骤流程 |
| 同样的脚本每次都要重写 | 脚本打包在 Skill 里 |

## Skill 的组成结构

### 目录布局

```
~/.claude/skills/         ← 所有 Skill 存放在这里
└── my-skill/             ← 一个 Skill = 一个文件夹
    ├── SKILL.md          ← 【必须】核心文件
    ├── scripts/          ← 【可选】可执行脚本
    ├── references/       ← 【可选】参考文档
    └── assets/           ← 【可选】模板、图片等资源
```

### 三层加载机制

Skill 不会一次性把所有内容塞进上下文，而是分三层按需加载：

| 层级 | 内容 | 何时加载 | 大小建议 |
|------|------|---------|---------|
| 第一层 | `SKILL.md` 的 frontmatter（name + description） | **始终**在上下文中 | ~100 词 |
| 第二层 | `SKILL.md` 的正文（执行指令） | 触发后才加载 | < 500 行 |
| 第三层 | `scripts/` `references/` `assets/` | Claude 按需读取或执行 | 无限制 |

这个设计意味着：**description 写得好不好，直接决定 Skill 能否被正确触发。**

### SKILL.md 的两部分

每个 SKILL.md 由 YAML frontmatter + Markdown 正文组成：

```yaml
---
name: my-skill                    # Skill 名称
description: >                    # 触发条件（最重要的部分）
  做什么 + 什么场景触发 + 触发关键词
---
```

```markdown
# 正文：具体执行指令

## Workflow
1. 步骤一
2. 步骤二
3. 步骤三
```

### 资源文件的定位

| 目录 | 放什么 | 怎么用 |
|------|--------|--------|
| `scripts/` | 重复执行的确定性脚本 | Claude 直接运行，不一定读入上下文 |
| `references/` | 详细参考资料（API 文档、Schema 等） | Claude 需要时才读取，节省上下文空间 |
| `assets/` | 模板文件、图片、静态资源 | 用在输出中，不读入上下文 |

**不要创建的文件：** README.md、CHANGELOG.md、INSTALLATION_GUIDE.md 等辅助文档。Skill 只需要对 Claude 有用的内容。

## 如何创建 Skill

### 方式一：从会话中提炼（推荐新手）

**最自然的方式 —— 先干活，再提炼。** 你不需要提前设计，而是在对话中完成一次任务后，让 Claude 把流程固化成 Skill。

#### 对话示例

```
# 1. 你正常工作
你: 帮我把 src/service/UserService.java 迁移到 COLA 架构的 domain 层

Claude: [完成迁移：分析依赖、移动文件、修改包名、更新引用...]

# 2. 你觉得这个流程值得复用
你: 这个迁移流程很好，帮我创建一个 Skill，以后其他 Service 也按这个流程迁移

# 3. Claude 从上下文提取流程，自动生成 SKILL.md
Claude: 我从刚才的操作中提取了以下流程...
        [创建 ~/.claude/skills/cola-migration/SKILL.md]
```

#### 有效的提示词

```
"把刚才的流程创建成一个 Skill"
"Create a skill from what we just did"
"这个流程以后还会用到，帮我保存成 Skill"
```

补充具体要求效果更好：

```
"创建 Skill，触发关键词包含：迁移、migrate、COLA"
"创建 Skill，同时把刚才用的 Python 脚本放到 scripts/ 目录"
"创建 Skill，把数据库表结构说明放到 references/ 里"
```

#### 什么时候该用这种方式？

- 你发现自己在不同对话中**重复解释**同一个流程
- Claude 刚帮你完成了一个**多步骤复杂任务**，流程还在上下文里
- 你**不确定** Skill 该包含什么内容，让实际操作告诉你答案

#### 优势

- **零设计负担** — 做完了自然就有了
- **经过验证** — 提炼的流程是实际跑通过的
- **上下文完整** — Claude 能捕获你可能想不到的细节

### 方式二：从零设计

适合你已经清楚知道想要什么 Skill 的场景。

#### 第一步：明确需求

开始之前，先想清楚三个问题：

1. **做什么？** → 一句话描述核心功能
2. **什么时候触发？** → 用户会说什么话、提到什么关键词
3. **怎么执行？** → 分几步，每步做什么

```
示例：
做什么：把 Markdown 文件转换成微信公众号格式
什么时候触发：用户说"转公众号"、"微信排版"、"wechat format"
执行流程：
  1. 读取目标 Markdown 文件
  2. 转换样式（标题、代码块、引用等）
  3. 输出为适配公众号的 HTML
```

#### 第二步：让 Claude 创建 Skill

直接用 `/skill-creator` 斜杠命令，Claude 会引导你完成整个创建过程：

```
你: /skill-creator
你: 我想创建一个把 Markdown 转公众号格式的 Skill，
    触发词包含"转公众号"、"微信排版"、"wechat format"
    流程是读取 md → 转换样式 → 输出 HTML

Claude: [引导你确认需求，自动生成目录结构和 SKILL.md]
```

Claude 会自动完成：
- 创建 `~/.claude/skills/wechat-format/` 目录
- 生成带 frontmatter 的 SKILL.md
- 根据需要创建 `scripts/`、`references/`、`assets/` 子目录
- 验证格式是否正确

你也可以直接描述需求，不用斜杠命令：

```
"帮我创建一个 Skill，功能是..."
"Create a new skill called wechat-format that..."
```

#### 第三步：检查并调整

Claude 生成后，检查 SKILL.md 的内容是否符合预期。重点关注：

- **description** 是否包含了所有触发关键词
- **正文流程**是否完整准确
- 是否需要补充 `scripts/`（脚本）或 `references/`（参考文档）

生成的 SKILL.md 结构大致如下：

```yaml
---
name: wechat-format
description: >
  将 Markdown 文档转换为微信公众号兼容的排版格式。
  Use when the user mentions "转公众号", "微信排版",
  "wechat format", "公众号格式", or wants to convert
  markdown for WeChat publishing.
---
```

```markdown
# WeChat Format Converter

## Workflow

1. Read the target Markdown file
2. Apply WeChat-compatible styling:
   - H1 → bold 20px with bottom border
   - Code blocks → gray background, monospace
   - Images → centered with max-width
3. Output the formatted HTML to a new file

## Style Rules

- Primary color: #3f51b5
- Code background: #f6f8fa
- Font: system default (no custom fonts)
```

编写技巧详见下一章"如何写好 SKILL.md"。

#### 可选：添加资源文件

根据需要让 Claude 补充脚本、参考文档或模板：

```
"把格式转换的逻辑写成 Python 脚本放到 scripts/ 下"
"把公众号 CSS 兼容性说明放到 references/ 下"
```

最终目录结构：

```
wechat-format/
├── SKILL.md
├── scripts/
│   └── convert.py          ← 格式转换脚本
├── references/
│   └── wechat-css-rules.md ← 公众号 CSS 兼容性参考
└── assets/
    └── template.html       ← HTML 输出模板
```

## 如何写好 SKILL.md

### Description — 最重要的部分

Description 决定 Skill 能否被正确触发。必须包含三要素：**做什么 + 什么场景 + 触发关键词**。

**好的写法：**

```yaml
description: >
  Generate SDK methods from controller REST API URLs.
  Given one or more v1/v2 endpoint URLs, generates Feign interface
  in the api module, business Client interface + implementation
  in the sdk module. Use when the user mentions "generate SDK",
  "SDK method", "生成SDK", or provides controller URLs for SDK wrapping.
```

**差的写法：**

```yaml
description: A tool for SDK generation.
```

差在哪？太笼统，Claude 无法判断何时该触发。

**要点：**

- 中英文关键词都写上，提高触发率
- 只需要 `name` 和 `description` 两个字段
- 触发条件**只在 description 里写**，不要放在正文

### 正文 — 匹配约束程度

根据任务的脆弱性选择"管多宽"：

**低自由度** — 操作脆弱、必须精确（部署、数据迁移）：

```markdown
## Deploy Steps

1. Run `scripts/build.sh` (do NOT modify this script)
2. Copy output using exact command:
   rsync -avz --delete build/ /var/www/app/
3. Restart nginx: `sudo systemctl restart nginx`
```

**高自由度** — 多种方案都可以（Code Review、架构建议）：

```markdown
## Code Review Guidelines

Review the PR for:
- Security vulnerabilities (SQL injection, XSS)
- Performance concerns (N+1 queries, missing indexes)
- Code readability and naming conventions

Adapt the review depth based on the change's size and risk.
```

### 保持精简

上下文窗口是共享资源。**原则：只写 Claude 不知道的东西。**

| 需要写 | 不需要写 |
|--------|---------|
| 公司内部 API 的调用方式 | 什么是 REST API |
| 特定项目的命名规范 | 什么是驼峰命名 |
| 业务特有的校验规则 | 如何写 if 语句 |

### 用示例代替解释

```markdown
## 不好 — 冗长描述
Commit message 的第一行应该使用动词原形开头，
不超过 50 个字符，后面空一行再写详细描述...

## 好 — 直接给示例
feat(auth): implement JWT authentication

Add login endpoint with token refresh support.
Includes rate limiting for failed attempts.
```

### 渐进式披露

超过 500 行的内容拆分到 `references/`，Claude 按需加载：

```markdown
# Database Migration Skill

## Quick Start
Run: `scripts/migrate.py --target <version>`

## Advanced
- **Rollback procedures**: See references/rollback.md
- **Multi-tenant migration**: See references/multi-tenant.md
- **Schema reference**: See references/schema.md
```

**注意：** 只保持一层引用深度，不要 references 里再引用 references。

## 如何使用 Skill

### 触发方式

- **自动触发** — Claude Code 根据 description 自动匹配，无需手动干预
- **手动触发** — 用斜杠命令 `/skill-name`，如 `/sdk-gen`

### 多 Skill 协作优先级

当多个 Skill 可能适用时：

1. **流程类 Skill 优先**（brainstorming、debugging）— 决定"怎么做"
2. **实现类 Skill 其次**（frontend-design、sdk-gen）— 指导"具体做"

例如：
- "帮我构建 X 功能" → 先 brainstorming，再实现类 Skill
- "修复这个 bug" → 先 debugging，再领域 Skill

### 迭代优化

Skill 不需要一步到位。推荐的迭代循环：

```
使用 Skill 完成任务 → 发现不足 → 修改 SKILL.md 或资源文件 → 再次使用验证
```

## 实战案例

### 场景：自动生成 API 文档

需求：给一个 Spring Boot Controller，自动生成 Markdown 格式的 API 文档。

**完整的 SKILL.md：**

```yaml
---
name: api-doc-gen
description: >
  Generate Markdown API documentation from Spring Boot Controller classes.
  Extracts endpoints, parameters, response types, and Javadoc comments
  to produce structured API docs. Use when the user mentions "生成API文档",
  "API documentation", "接口文档", "generate api docs", or wants to
  document REST endpoints.
---
```

```markdown
# API Documentation Generator

## Workflow

1. Locate the target Controller class
2. For each endpoint method, extract:
   - HTTP method + URL path
   - Request parameters (@RequestParam, @RequestBody, @PathVariable)
   - Response type (Response<T>)
   - Javadoc description
3. Generate Markdown doc following the template below

## Output Template

For each endpoint:

### [HTTP_METHOD] [URL]

**Description**: [from Javadoc]

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| ...  | ...  | ...      | ...         |

**Response**: `Response<T>`

**Example**:
[Generate a realistic example based on the parameter types]

## Rules

- Group endpoints by Controller class
- Sort by URL path alphabetically
- Include request body schema for POST/PUT endpoints
- Mark deprecated endpoints with ~~strikethrough~~
```

**这个案例体现的原则：**

- Description 同时列出中英文触发关键词
- Workflow 步骤清晰，没有多余解释
- Output Template 用格式示例代替文字描述
- Rules 补充约束，不啰嗦

## 常见误区

| 误区 | 正确做法 |
|------|---------|
| 在正文里写 "When to Use" | 触发条件**只在 description 里写**，正文加载时已经触发了 |
| 创建 README.md、CHANGELOG.md | Skill 只需要 SKILL.md + 资源文件 |
| 把所有内容塞进 SKILL.md | 超过 500 行就拆分到 references/ |
| description 写得太短太模糊 | 详细列出功能描述 + 触发关键词 |
| 解释 Claude 已经知道的常识 | 只写领域特定知识和流程 |
| 一开始追求完美设计 | 先用起来，再迭代改进 |

## 总结

### 新手推荐路径

```
先在对话中完成任务 → 觉得可复用 → 让 Claude 提炼成 Skill → 下次使用时迭代优化
```

不要一开始就追求完美设计，**先用起来，再慢慢改进**。

### 核心原则

1. **Description 是灵魂** — 决定何时触发，写清楚、写全面
2. **正文要精简** — 只写 Claude 不知道的，用示例代替解释
3. **资源按需加载** — 大文档放 references/，脚本放 scripts/
4. **匹配约束程度** — 脆弱操作写死，灵活操作放宽
5. **不要过度设计** — 不需要 README、CHANGELOG 等辅助文件
6. **从实践中提炼** — 先跑通流程，再固化为 Skill，比凭空设计更可靠
