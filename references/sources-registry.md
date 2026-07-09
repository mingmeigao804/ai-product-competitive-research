# AI 产品权威信息源 Registry

该文件列出主流 AI 产品的权威信息源直链和检索入口。检索时**先直抓官方源**，绕过搜索引擎污染；官方源没有的再用搜索引擎补。

> **环境声明：** 以下可达性基于本机 Windows + curl 实测（2026-07-09）。换机/换环境时需重新探测，不要直接套用。通道路由规则（"SPA 改抓 sitemap""Bing 需 cookie jar"）跨环境通用，但具体 ✅/❌ 状态需实测确认。新环境探测命令见本文末尾。

实测可达性（2026-07-09 复核，本机环境）见下表；其他环境以实测为准。

| 通道 | 可达 | 说明 |
|---|---|---|
| 公众号全文 `mp.weixin.qq.com/s/...` | ✅ | 正文在 `<div id="js_content">`，标题在 `var msg_title = '...'`。需先有 URL（用户贴或百度发现） |
| iTunes Search API（App Store 更新说明） | ✅ | `itunes.apple.com/search?term=<拼音/英文>&country=cn&entity=software`，解析 JSON `releaseNotes`+`version`+`currentVersionReleaseDate`。**中文产品场景化/运营功能（高考、购物助手、课堂等）的一级通道**——中文 term 会 400，用拼音/英文 |
| 服务端渲染官方页（Anthropic `/news`、Google blog、TechCrunch、HuggingFace） | ✅ | 直 curl 抓，内容真实，可解析文章列表+正文 |
| SPA 官方页（Seed `/zh/blog`、OpenAI `/news/product-releases`、qwenlm.ai、kimi.com、deepseek.com、doubao.com） | ⚠️ 半可读 | curl 只拿到 HTML 壳，文章列表由 JS 渲染拿不到。**改抓同站 `sitemap.xml`** 取文章 URL+lastmod，再直抓单篇博文正文（单篇博文通常是服务端渲染可读） |
| 官方 sitemap.xml（Seed/OpenAI 等） | ✅ | `<loc>`+`<lastmod>` 定位窗口内文章，绕过 SPA。OpenAI sitemap 是 sitemapindex，需取子 sitemap；Seed sitemap 直接列博文 |
| `www.bing.com/search?q=&mkt=zh-CN&cc=CN` + cookie jar | ✅ 但污染 | **必须 `-c jar -b jar`**：无 cookie 时连 www.bing.com 会 SSL exit 35（HTTP 000）。完整命令见下。中文产品词被 SEO 镜像站/工业目录垄断（"Qwen3.6"曾被 TRUSCO 目录污染）；`site:` 语法在此变体不生效 |
| 百度 `www.baidu.com/s?wd=` | ❌ | curl 返回 ~1.5KB 反爬挑战页（2026-07-09 实测）。不要用 |
| 搜狗微信 `weixin.sogou.com/weixin?type=2&query=` | ❌ | 自动化连发必触发验证码/挑战页。不要用 |
| cn.bing.com | ❌ | curl 直连 SSL exit 35。用 www.bing.com + cookie jar |
| 内置 WebSearch | ❌/US-only | 中文 AI 产品基本搜不到 |
| 小红书/知乎/微博全文 | 反爬强 | 口碑部分通常需用户补料 |

### Bing + cookie jar 完整命令（自包含配方）

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -s -L -m 25 -c jar -b jar -A "$UA" "https://www.bing.com/search?q=<enc>&mkt=zh-CN&cc=CN" -o out.html
# 解析：<li class="b_algo"> 块内 <h2><a href> 取标题+链接（链接是 bing.com/ck/a 跳转包装，
#   直抓真实 URL 需跟随重定向；摘要 <p> 可直接用），<cite> 取域名，<p> 取摘要
```

要点：`-c jar -b jar` 缺一不可（首次请求 -c 创建 jar，-b 复用）；用 `mkt/cc` 不要用 `setlang`（会跳 cn.bing 触发 SSL 错误）；请求间隔 ≥4s 避免限频。

## 检索引擎分流规则

- **中文 AI 产品动态** → 官方博客 sitemap + 单篇博文直抓 + HuggingFace 模型卡 + Bing(cookie jar)。百度/搜狗微信已 ❌ 不可用。
- **海外产品动态** → 官方博客/changelog 直抓（服务端渲染页直接抓；SPA 页走 sitemap）+ TechCrunch `?s=` + HuggingFace。
- **已知官方域** → 直接 curl 官方页，不搜。SPA 页改抓 sitemap.xml。
- **公众号文章** → 拿到 URL 后 curl 全文，从 `js_content` 提取正文、`msg_title` 提取标题。URL 来源：用户贴，或 Bing 搜索发现的 `mp.weixin.qq.com/s/...` 链接。

## 产品源清单

### 豆包 / 字节 Seed

- 官方博客列表页（SPA，curl 拿不到文章列表）：https://seed.bytedance.com/zh/blog → **改抓 sitemap.xml**：https://seed.bytedance.com/sitemap.xml （含每篇博文 `<loc>`+`<lastmod>`）
- 单篇博文（服务端渲染，curl 可读）：如 https://seed.bytedance.com/blog/seed2-1-officially-released-advancing-ai-productivity
- 模型卡（服务端渲染）：https://seed.bytedance.com/zh/seed2_1
- 火山方舟文档：https://www.volcengine.com/docs/82379?lang=zh
- 公众号：用户贴 URL 后 curl 全文（百度/搜狗微信发现 URL 不可用）

### Kimi / 月之暗面

- 官网：https://kimi.com
- 公众号搜索：Kimi、月之暗面
- 用户文档实证：公众号文章 `mp.weixin.qq.com/s/...` 可读全文（如"Kimi Work 上新"系列）

### 通义千问 / 阿里

- 官网：https://qwenlm.ai 、https://tongyi.aliyun.com
- 公众号搜索：通义千问、阿里云 AI
- 媒体：机器之心"通义千问"

### DeepSeek

- 官网：https://www.deepseek.com
- API status：https://status.deepseek.com
- 公众号搜索：DeepSeek 深度求索
- 媒体：机器之心"DeepSeek"

### ChatGPT / OpenAI

- 产品发布页（SPA，curl 拿不到文章列表）：https://openai.com/zh-Hans-CN/news/product-releases/ → **改抓 sitemap**：https://openai.com/sitemap.xml （是 sitemapindex，需取子 sitemap 如 `/sitemap.xml/chatgpt/`）
- ChatGPT changelog（服务端渲染，curl 可读，信息最密集）：https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 英文博客：https://openai.com/blog
- X：https://x.com/OpenAI

### Claude / Anthropic

- 新闻（curl 可读）：https://www.anthropic.com/news
- 文档/模型卡：https://docs.anthropic.com
- X：https://x.com/AnthropicAI

### Gemini / Google

- Gemini 应用博客（curl 可读）：https://blog.google/innovation-and-ai/products/gemini-app/
- 官网：https://gemini.google.com
- X：https://x.com/GoogleAI

### 星野 / MiniMax / Talkie / Character.AI

- 星野官网：https://xingye.minimaxi.com
- MiniMax：https://www.minimaxi.com
- Talkie / Character.AI：海外，走官方博客 + X + Reddit
- 公众号搜索：星野、MiniMax、Talkie

### 政策 / 行业

- 网信办（curl 可读）：https://www.cac.gov.cn
- 机器之心：https://www.jiqizhixin.com
- 量子位：https://www.qbitai.com
- 即刻 / 少数派 / AppSo

## 口碑源（多数需用户补料）

- 小红书：https://www.xiaohongshu.com （反爬强，URL 可访问但全文难抓）
- 知乎：https://www.zhihu.com
- 应用商店：App Store / 应用宝 / 酷安（评论页反爬）
- 微博：https://weibo.com

口碑结论若 curl 拿不到真实评论，输出"待补充口碑采样"并请用户贴评论/截图，不编口碑主题。

## 新环境通道快速探测

换机或换环境时，运行以下 30 秒快速探测，标记当前环境可用通道：

```bash
# 1. 百度（中文信息源）
curl -s -L -m 10 "https://www.baidu.com/s?wd=test" -o /dev/null -w "%{http_code}"
# 200=✅, 非200/空=❌

# 2. Bing（中英文兜底搜索引擎）
curl -s -L -m 10 -c /tmp/jar -b /tmp/jar -A "Mozilla/5.0" "https://www.bing.com/search?q=test" -o /dev/null -w "%{http_code}"
# 200=✅

# 3. 官方博客 sitemap（以 Seed 为例，换其他产品同理）
curl -s -L -m 10 "https://seed.bytedance.com/sitemap.xml" -o /dev/null -w "%{http_code}"
# 200=✅

# 4. iTunes Search API（中文产品场景化功能）
curl -s -L -m 10 "https://itunes.apple.com/search?term=doubao&country=cn&entity=software" -o /dev/null -w "%{http_code}"
# 200=✅

# 5. HuggingFace（开源模型矩阵）
curl -s -L -m 10 "https://huggingface.co/deepseek-ai" -o /dev/null -w "%{http_code}"
# 200=✅

# 6. TechCrunch（英文媒体）
curl -s -L -m 10 "https://techcrunch.com/?s=test" -o /dev/null -w "%{http_code}"
# 200=✅
```

将结果写入 `research-state.md` 的 `检索进度.已检索平台`，后续检索只用 ✅ 通道。

## 维护

- 该 registry 是种子，用户用过程中发现新的权威源应追加。
- 官方博客/changelog URL 变更时更新。
- 新增产品时补全：官方博客、公众号搜索词、changelog、X、媒体标签五项。
