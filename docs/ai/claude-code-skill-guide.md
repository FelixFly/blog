# Claude Code Skill 创建与使用指南

> 面向小白的 Skill 最佳实践

## 什么是 Skill？

Skill 是 Claude Code 的**可复用能力扩展包**。你可以把它理解为给 Claude 写的"标准操作手册"——将你的专业知识、工作流程、常用脚本打包成一个模块，让 Claude 在遇到特定场景时自动按照你定义的流程执行。

**一句话总结：Skill = 触发条件 + 执行指令 + 可选资源文件**

### 解决的核心问题

| 问题 | Skill 如何解决 |
|------|-------------|
| 每次都要重复解释同样的流程 | 写一次，永久复用 |
| Claude 不了解公司内部规范 | 把规范写进 Skill |
| 复杂操作容易遗漏步骤 | 定义明确的步骤流程 |
| 同样的脚本每次都要重写 | 脚本打包在 Skill 里 |

## Skill 的目录结构

```
~/.claude/skills/         ← 所有 Skill 存放在这里
└── my-skill/             ← 一个 Skill = 一个文件夹
    ├── SKILL.md          ← 【必须】核心文件：触发条件 + 执行指令
    ├── scripts/          ← 【可选】可执行脚本
    ├── references/       ← 【可选】参考文档（按需加载到上下文）
    └── assets/           ← 【可选】模板、图片等输出资源
```

### 各部分职责

| 部分 | 作用 | 何时加载 |
|------|------|---------|
| `SKILL.md` 的 frontmatter | name + description，告诉 Claude 何时触发 | **始终**在上下文中 |
| `SKILL.md` 的正文 | 具体执行指令 | 触发后才加载 |
| `scripts/` | 确定性操作的脚本 | 可直接执行，不一定需要读入上下文 |
| `references/` | 详细参考资料 | Claude 判断需要时才读取 |
| `assets/` | 模板文件、静态资源 | 在输出中使用，不读入上下文 |

## 两种创建方式

### 方式一：自上而下 — 先设计后实现

适合你已经清楚知道想要什么 Skill 的场景。按照下面"创建你的第一个 Skill"章节的 5 步流程，从需求分析开始，逐步构建。

### 方式二：自下而上 — 从会话中提炼（推荐新手）

**这是最自然、最实用的方式。** 你不需要提前设计任何东西，而是先在对话中完成一次任务，然后让 Claude 把刚才的工作流程提炼成 Skill。

#### 完整流程

```
第一步：正常完成任务
    ↓ 你在对话中让 Claude 帮你完成了一个任务（比如迁移代码、生成文档）
第二步：发现可复用
    ↓ 你意识到"这个操作以后还会用到"
第三步：要求提炼
    ↓ 告诉 Claude："把刚才的流程创建成一个 Skill"
第四步：Claude 自动提取
    ↓ Claude 从对话上下文中提取关键步骤、决策点、使用的工具
第五步：生成 SKILL.md
    ↓ 自动创建完整的 Skill 文件
第六步：迭代优化
    下次使用时发现不足，继续修改完善
```

#### 实际对话示例

```
# 第一步：你正常工作
你: 帮我把 src/service/UserService.java 迁移到 COLA 架构的 domain 层

Claude: [完成迁移工作：分析依赖、移动文件、修改包名、更新引用...]

# 第二步：你觉得这个流程值得复用
你: 这个迁移流程很好，帮我创建一个 Skill，以后其他 Service 也按这个流程迁移

# 第三步：Claude 从上下文提取流程，生成 SKILL.md
Claude: 我从刚才的操作中提取了以下流程...
        [创建 ~/.claude/skills/cola-migration/SKILL.md]
```

#### 什么时候该用这种方式？

| 信号 | 说明 |
|------|------|
| 你发现自己在不同对话中重复解释同一个流程 | 是时候固化成 Skill 了 |
| Claude 刚帮你完成了一个多步骤的复杂任务 | 趁热打铁，流程还在上下文里 |
| 你摸索出一套有效的工作方法 | 先跑通再提炼，比凭空设计更靠谱 |
| 你不确定 Skill 该包含什么内容 | 让实际操作告诉你答案 |

#### 这种方式的优势

1. **零设计负担** — 不需要提前想好所有步骤，做完了自然就有了
2. **经过验证** — 提炼出的流程是实际跑通过的，不是纸上谈兵
3. **上下文完整** — Claude 能从对话中捕获你可能想不到的细节（比如中间遇到的坑、做出的判断）
4. **快速迭代** — 第一版不完美没关系，下次用的时候再改

#### 提炼时的关键提示词

以下是一些有效的触发话术：

```
"把刚才的流程创建成一个 Skill"
"总结刚才的操作步骤，生成一个可复用的 Skill"
"Create a skill from what we just did"
"这个流程以后还会用到，帮我保存成 Skill"
"提取刚才的工作流，写成 SKILL.md 放到 ~/.claude/skills/ 下"
```

你还可以补充具体要求：

```
"创建 Skill，触发关键词包含：迁移、migrate、COLA"
"创建 Skill，同时把刚才用的那个 Python 脚本放到 scripts/ 目录"
"创建 Skill，把数据库表结构说明放到 references/ 里"
```

---

## 创建你的第一个 Skill

### 第一步：明确需求

在动手之前，回答三个问题：

1. **这个 Skill 做什么？** → 一句话描述核心功能
2. **什么时候触发？** → 用户会说什么话、提到什么关键词
3. **执行流程是什么？** → 分几步，每步做什么

**示例思考过程：**

```
做什么：把 Markdown 文件转换成微信公众号格式
什么时候触发：用户说"转公众号"、"微信排版"、"wechat format"
执行流程：
  1. 读取目标 Markdown 文件
  2. 转换样式（标题、代码块、引用等）
  3. 输出为适配公众号的 HTML
```

### 第二步：初始化 Skill

使用 skill-creator 提供的初始化脚本：

```bash
python3 ~/.claude/skills/skill-creator/scripts/init_skill.py wechat-format --path ~/.claude/skills
```

这会自动生成模板目录结构，比手动创建更可靠。

### 第三步：编写 SKILL.md

这是最核心的一步。SKILL.md 由两部分组成：

#### 1) YAML Frontmatter（触发条件）

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

**关键要点：**

- `description` 是触发机制的核心 —— Claude 根据它决定是否使用这个 Skill
- 必须同时包含**做什么**和**什么时候触发**
- 建议中英文关键词都写上，提高触发率
- 不要加其他字段，只需要 `name` 和 `description`

#### 2) Markdown 正文（执行指令）

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

## Example

Input: `docs/my-article.md`
Output: `output/my-article-wechat.html`
```

### 第四步：添加资源文件（可选）

根据需要添加脚本、参考文档或模板：

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

### 第五步：打包发布

```bash
python3 ~/.claude/skills/skill-creator/scripts/package_skill.py ~/.claude/skills/wechat-format
```

脚本会自动验证格式是否正确，通过后生成 `.skill` 文件。

## SKILL.md 编写最佳实践

### 1. Description 写法

**好的 description：**

```yaml
description: >
  Generate SDK methods from controller REST API URLs.
  Given one or more v1/v2 endpoint URLs, generates Feign interface
  in the api module, business Client interface + implementation
  in the sdk module. Use when the user mentions "generate SDK",
  "SDK method", "生成SDK", or provides controller URLs for SDK wrapping.
```

为什么好？明确说了**做什么** + **什么场景触发** + **具体的触发关键词**。

**差的 description：**

```yaml
description: A tool for SDK generation.
```

为什么差？太笼统，Claude 无法判断何时该用这个 Skill。

### 2. 正文的自由度控制

根据任务的性质选择合适的"约束程度"：

#### 低自由度 — 操作脆弱、必须精确

```markdown
## Deploy Steps

1. Run `scripts/build.sh` (do NOT modify this script)
2. Copy output to `/var/www/` using exact command:
   ```bash
   rsync -avz --delete build/ /var/www/app/
   ```
3. Restart nginx: `sudo systemctl restart nginx`
```

#### 高自由度 — 多种方案都可以

```markdown
## Code Review Guidelines

Review the PR for:
- Security vulnerabilities (SQL injection, XSS, etc.)
- Performance concerns (N+1 queries, missing indexes)
- Code readability and naming conventions

Adapt the review depth based on the size and risk of the change.
```

### 3. 保持精简

上下文窗口是共享资源，每个 Skill 都在"消费"这个资源。

**原则：Claude 已经很聪明了，只写它不知道的东西。**

| 需要写 | 不需要写 |
|--------|---------|
| 公司内部 API 的调用方式 | 什么是 REST API |
| 特定项目的命名规范 | 什么是驼峰命名 |
| 业务特有的校验规则 | 如何写 if 语句 |

### 4. 用示例代替解释

```markdown
## 不好 — 冗长的文字解释

Commit message 的第一行应该使用动词原形开头，
不超过 50 个字符，后面空一行再写详细描述...

## 好 — 直接给示例

## Commit Format

Example:
feat(auth): implement JWT authentication

Add login endpoint with token refresh support.
Includes rate limiting for failed attempts.
```

### 5. 渐进式披露（Progressive Disclosure）

不要把所有信息都塞进 SKILL.md。将详细内容拆分到 `references/` 下：

```markdown
# Database Migration Skill

## Quick Start
Run: `scripts/migrate.py --target <version>`

## Advanced

- **Rollback procedures**: See references/rollback.md
- **Multi-tenant migration**: See references/multi-tenant.md
- **Schema reference**: See references/schema.md
```

这样 Claude 只在需要时才加载对应的参考文档，节省上下文空间。

**注意：** 只保持一层引用深度，不要 references 里再引用 references。

## 使用 Skill 的最佳实践

### 触发方式

Skill 不需要手动调用。Claude Code 会根据 description 自动判断是否匹配当前任务，匹配时自动加载并执行。

你也可以用斜杠命令显式调用：

```
/skill-name
```

例如 `/sdk-gen` 就会触发 SDK 生成 Skill。

### 多 Skill 协作

当多个 Skill 可能适用时，遵循优先级：

1. **流程类 Skill 优先**（brainstorming、debugging）—— 决定"怎么做"
2. **实现类 Skill 其次**（frontend-design、sdk-gen）—— 指导"具体做"

例如：
- 用户说"帮我构建 X 功能" → 先用 brainstorming，再用实现类 Skill
- 用户说"修复这个 bug" → 先用 debugging，再用领域 Skill

### 常见误区

| 误区 | 正确做法 |
|------|---------|
| 在 SKILL.md 正文里写 "When to Use" | 触发条件**只在 description 里写** |
| 创建 README.md、CHANGELOG.md 等 | Skill 只需要 SKILL.md + 资源文件 |
| 把所有内容都写在 SKILL.md | 超过 500 行就应该拆分到 references/ |
| description 写得太短太模糊 | 详细列出功能描述 + 触发关键词 |
| 解释 Claude 已经知道的常识 | 只写领域特定知识和流程 |

## 实战案例：从零创建一个 Skill

### 场景：自动生成 API 文档

需求：给一个 Spring Boot Controller，自动生成 Markdown 格式的 API 文档。

#### 完整的 SKILL.md

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

这个 Skill 的特点：
- **Description** 详细列出了触发条件（中英文关键词都有）
- **Workflow** 清晰的步骤流程
- **Template** 给出了具体的输出格式
- **Rules** 补充约束条件
- 没有多余的文件，保持简洁

## 总结

### 新手推荐路径

```
先在对话中完成任务 → 觉得可复用 → 让 Claude 提炼成 Skill → 下次使用时迭代优化
```

不要一开始就追求完美的 Skill 设计，**先用起来，再慢慢改进**。

### 核心原则

1. **Description 是灵魂** — 决定何时触发，写清楚、写全面
2. **正文要精简** — 只写 Claude 不知道的，用示例代替解释
3. **资源按需加载** — 大文档放 references/，脚本放 scripts/
4. **匹配约束程度** — 脆弱操作写死，灵活操作放宽
5. **不要过度设计** — 不需要 README、CHANGELOG 等辅助文件
6. **从实践中提炼** — 先跑通流程，再固化为 Skill，比凭空设计更可靠
