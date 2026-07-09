# 飞书报告落地

该文件用于把竞品调研报告写入飞书文档/wiki。仅当环境中已连接 `feishu-mcp-pro` MCP server 时走飞书路径；未连接时退回 Markdown，不要因此中断调研。

## 依赖说明

- **依赖：** `feishu-mcp-pro` MCP server（提供 `doc_create` / `doc_append` / `doc_write` / `doc_insert` / `doc_update` / `doc_rename` / `wiki_create_node` / `wiki_move_docs_to_wiki` 等工具）。
- 该依赖为**可选**。skill 本身不硬绑定飞书；无该 MCP 时，输出 Markdown 即可，所有报告结构（callout、矩阵、章节）在 Markdown 中均有等价表达。
- 飞书扩展 markdown 语法（callout / lark-table / grid / mention 等）的完整清单见 MCP 资源 `feishu://md-syntax`，写作前如有不确定的标签应先读取该资源。

## 正文 vs 过程文件（重要）

**飞书正文只放正式报告 5 节，过程内容一律不进飞书。**

| 内容 | 去处 |
|---|---|
| 背景与目标、近期动作、策略对比、用户口碑、总结 | 飞书正文 |
| 一句话结论 callout、表格、矩阵 | 飞书正文 |
| 检索记录、来源表、来源门禁结果 | 过程 markdown（本地文件） |
| 缺口说明、过程备注、合规下调记录 | 过程 markdown |
| 结论卡五字段（事实依据/公开观察/分析判断/启示/待验证） | 过程 markdown |
| "资料来源与覆盖说明" | 过程 markdown（不占飞书正文一节；如需在飞书提示限制，用一句 callout 带过） |

这样飞书文档干净、可交付、不像 AI 凑的；过程信息仍在本地可溯源。

## 何时用飞书 vs Markdown

| 场景 | 选择 |
|---|---|
| 最终交付物是飞书文档/wiki、需团队协作 | 飞书 |
| 用户明确要求"写到飞书""发到 wiki" | 飞书 |
| 用户要 Markdown 文件、本地预览或外部系统 | Markdown |
| 环境无 feishu MCP | Markdown |
| 调研仍在进行、只做中间对齐 | Markdown，定稿后再迁飞书 |

不确定时直接问用户偏好，不要默认选飞书。

## 工具选型

| 需求 | 工具 | 说明 |
|---|---|---|
| 从零新建报告 | `doc_create` | 传 `title` 和初始 `markdown`，返回 document_id |
| 分阶段追加章节 | `doc_append` | 非破坏性，按阶段把近期动作/功能矩阵/口碑/总结逐段追加分最自然 |
| 全量覆写已有文档 | `doc_write` | 破坏性，仅在整体重排时用；会清空原文 |
| 在指定块后插入 | `doc_insert` | 需 after_block_id，用于局部补内容 |
| 替换/删除某一节 | `doc_update` | 支持 `select` / `select_title`，mode=replace/insert-before/insert-after/delete |
| 改标题 | `doc_rename` | 支持 docx token 或 wiki URL |
| 落地到 wiki 知识库 | `wiki_create_node` 或 `wiki_move_docs_to_wiki` | 见下"wiki 落地" |

默认主流程：`doc_create` 建文档 → 每完成一个调研阶段用 `doc_append` 追加该阶段产物。这样报告生长和调研进度一致，且任一阶段中断都不会丢失已完成内容。

## 报告结构 → 飞书写法映射

| 报告元素 | 飞书写法 |
|---|---|
| 文档标题 | `doc_create` 的 `title` 参数，**不要**在正文再写一级标题 |
| 结论卡 / 一句话总结 | `<callout>`，见下 |
| 近期动作表、功能矩阵、口碑矩阵 | 标准 `\| --- \|` markdown 表格；单元格需列表/代码时用 `<lark-table>` |
| 章节标题 | `##` / `###`，飞书自动生成目录，不要手写 TOC |
| 资料来源与覆盖说明 | 单独一节，或用 `<callout background-color="pale-gray">` 强调限制 |
| 用户原话 | 引用块 `>` 或 `<quote-container>` |
| 提及同事 | `<mention-user id="ou_xxx"/>`，先 `user_resolve` 拿 open_id |
| 待验证点清单 | `- [ ]` 任务勾选或普通列表 |

### 结论卡写法（正文用，简洁版）

正文 callout 只放一句话结论，最多带 1-2 条要点，**不堆五字段**（五字段放过程 markdown）。callout 内不能放代码块、表格、图片，只放文字/列表：

```html
<callout emoji="💡" background-color="light-blue">
{{一句话结论}}
</callout>
```

需要补充时：

```html
<callout emoji="💡" background-color="light-blue">
{{一句话结论}}
- {{要点 1}}
- {{要点 2}}
</callout>
```

常用配色：💡light-blue（核心发现）、⚠️light-yellow（风险/限制）、✅light-green（机会点）、❌light-red（短板/警示）。

过程 markdown 里的结论卡字段（事实依据/公开观察/分析判断/启示-取长/启示-补短/启示-避坑/待验证点）是溯源用，不进飞书正文。

### 表格写法

普通对比表直接用标准 markdown 表格：

```markdown
| 功能维度 | 产品 A | 产品 B | 自家产品 | 证据来源 |
|---|---|---|---|---|
```

仅当单元格内需要多行列表、代码或嵌套内容时，才改用 `<lark-table>`（结构 `lark-table > lark-tr > lark-td`，每行单元格数必须一致，单元格内容前后需空行）。不要把两种表格语法混用。

### 表格配套规范

每张关键矩阵/对比表必须配套三部分，禁止只贴表格不解释：

1. **表前读法**（1-2 句）：说明这张表看什么、怎么看。如"这张表按策略维度横向对比，主要看各家在信息组织方式上的差异。"
2. **表格本体**：单元格使用关键词或短语，避免塞长句。
3. **表后结论**（2-4 条 bullet）：从表里读出了什么。如"- A 和 B 都采用结论前置，但 A 更偏清单式、B 更偏段落式。"

## 分阶段写入流程

飞书正文按 5 节生长，每完成一节 `doc_append` 一次；过程内容同步写本地过程 markdown，不进飞书：

```text
1. 范围确认后：doc_create 建文档（title=报告标题），doc_append 写"一、背景与目标"
2. 阶段 2 检索完成：来源表/检索记录写过程 markdown；飞书暂不写
3. 近期动作整理完：doc_append 写"二、近期动作总览"（含 2.1/2.2/亮点）
4. 策略对比完成：doc_append 写"三、策略对比"（功能矩阵 + 策略维度矩阵）
5. 口碑完成：doc_append 写"四、用户口碑"
6. 总结完成：doc_append 写"五、总结"（场景矩阵 + 差异化与机会点）
7. 全部正文写完后：把过程 markdown 路径告知用户，不追加进飞书
```

每次 `doc_append` / `doc_write` 后检查返回的 `warnings` 字段：若有 warning，说明部分内容降级为纯文本，需告知用户哪些标签没渲染成功。

**注意：`doc_create`/`doc_append` 的 `blocks_added` 字段常返回 0 但内容实际写入成功，不要把 0 当失败。**

**写入验证：** 每次 `doc_append` 后，调 `doc_fetch`（scope=outline）验证刚写入的章节标题是否出现在文档大纲中。若不在，重试一次 `doc_append`；两次均失败则告知用户"第 X 节可能未写入成功，请手动检查飞书文档"。不要仅凭 `blocks_added`（常返回 0）判断写入是否成功。

## wiki 落地

两种方式，按用户需求选：

| 方式 | 工具 | 适用 |
|---|---|---|
| 直接在 wiki 空间新建节点 | `wiki_create_node`（传 space_id、title、可选 parent_node_token） | 报告从一开始就要落在 wiki |
| 把已建好的 docx 迁进 wiki | `wiki_move_docs_to_wiki`（传 space_id、obj_type=docx、obj_token） | 先在 drive 写完再迁 |

需要 space_id 时先用 `wiki_list_spaces` 列出可访问空间；需要放在某节点下时先用 `wiki_list_nodes` 找 parent_node_token。

## 飞书写作注意

- 不要把标题在正文里再写一遍一级标题（`doc_create` 的 title 已是文档标题）。
- 不要手写目录，飞书自动生成。
- 不同类型 block（标题、表格、callout、列表）之间留空行。
- 来源链接放表格单元格内，不要在正文堆链接。
- 没有真实 case 测试时，不要写"测试发现"，改写为"公开反馈显示"或"公开材料显示"。
- 大表格前先给一句 callout 总结，降低阅读成本。
- 报告中写明检索时间；时效敏感信息标注日期。
