#!/usr/bin/env node
/*
 * research-gate.js — AI 产品竞品调研门禁脚本（零依赖，node 运行）。
 *
 * 两个阶段：
 *   scope   : 检查 research-state.md 中 "范围已确认: yes"
 *   sources : 解析 source-table.md，按竞品统计来源数与来源类型数，对照阈值
 * 不通过 exit 1 并打印明确指引；通过 exit 0。
 *
 * 用法：
 *   node scripts/research-gate.js scope
 *   node scripts/research-gate.js sources
 *   node scripts/research-gate.js sources --source source-table.md --min-sources 5 --min-types 4
 *
 * 阈值默认每竞品 >=3 来源、>=2 来源类型。可在 research-state.md 中用
 *   "来源阈值: <n>/<m>" 覆盖，或通过 --min-sources / --min-types 覆盖。
 * 注：默认 2 类而非 3 类——中文竞品在本机环境下第 3 类"中文媒体/社媒"
 *   常因百度反爬、Bing SEO 污染、公众号需 URL 直达而难以稳定获取。
 *   海外竞品通常可达 3/3；需要更严时显式 --min-types 3。
 */

const fs = require("fs");

function parseArgs(argv) {
  const args = { stage: null, state: "research-state.md", source: "source-table.md", minSources: -1, minTypes: -1 };
  const rest = argv.slice(2);
  if (rest.length === 0) {
    console.error("用法: node research-gate.js <scope|sources> [--state <f>] [--source <f>] [--min-sources N] [--min-types M]");
    process.exit(2);
  }
  args.stage = rest[0];
  for (let i = 1; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--state") args.state = rest[++i];
    else if (a === "--source") args.source = rest[++i];
    else if (a === "--min-sources") args.minSources = parseInt(rest[++i], 10);
    else if (a === "--min-types") args.minTypes = parseInt(rest[++i], 10);
  }
  if (!["scope", "sources"].includes(args.stage)) {
    console.error("stage 必须是 scope 或 sources");
    process.exit(2);
  }
  return args;
}

function fail(msg) {
  console.log(msg);
  console.log("");
  console.log("GATE FAILED");
  process.exit(1);
}

function pass(msg) {
  console.log(msg);
  console.log("");
  console.log("GATE PASSED");
  process.exit(0);
}

// 从 research-state.md 读 "来源阈值: n/m"，未写或未传参则默认 3/2
function getThresholds(minSourcesArg, minTypesArg, stateFile) {
  let src = minSourcesArg >= 0 ? minSourcesArg : 3;
  let typ = minTypesArg >= 0 ? minTypesArg : 2;
  try {
    const c = fs.readFileSync(stateFile, "utf8");
    const m = c.match(/来源阈值\s*[:：]\s*(\d+)\s*[/／]\s*(\d+)/im);
    if (m) {
      if (minSourcesArg < 0) src = parseInt(m[1], 10);
      if (minTypesArg < 0) typ = parseInt(m[2], 10);
    }
  } catch (e) { /* state file may not exist in sources stage; ignore */ }
  return { src, typ };
}

// ---------- 阶段 1：范围门禁 ----------
function gateScope(stateFile) {
  if (!fs.existsSync(stateFile)) {
    fail(`GATE(scope) FAILED: 未找到 ${stateFile}。
下一步：先输出【范围确认块】并等用户回复，用户确认后把 research-state.md 的 '范围已确认' 置为 yes，再重跑本门禁。在通过前不得做任何检索或生成。`);
  }
  const content = fs.readFileSync(stateFile, "utf8");
  if (!/^\s*[-*]?\s*范围已确认\s*[:：]\s*yes\b/im.test(content)) {
    fail(`GATE(scope) FAILED: research-state.md 中 '范围已确认' 不是 yes。
下一步：先与用户确认范围（主题/对标主体/竞品/时间范围/输出形式/决策用途），用户确认后置 yes 再重跑。在通过前不得检索或生成。`);
  }
  pass("GATE(scope) PASSED: 范围已确认，可进入检索阶段。");
}

// ---------- 阶段 2：来源门禁 ----------
function gateSources(stateFile, sourceFile, minSourcesArg, minTypesArg) {
  if (!fs.existsSync(sourceFile)) {
    fail(`GATE(sources) FAILED: 未找到 ${sourceFile}。
下一步：先执行真实联网检索，把每条来源写入 source-table.md。若确实搜不到，唯一允许的输出是缺口报告（references/gap-report.md），不可生成报告正文。`);
  }

  const { src: minSrc, typ: minTyp } = getThresholds(minSourcesArg, minTypesArg, stateFile);

  const lines = fs.readFileSync(sourceFile, "utf8").split(/\r?\n/);
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("|")) { inTable = false; continue; }
    // 跳过分隔行 |---|---|
    if (/^\|[\s:|-]+\|$/.test(t)) continue;
    if (!inTable) { inTable = true; continue; } // 每个表格块第一行是表头
    const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|").map(s => s.trim());
    if (cells.length < 3) continue;
    const comp = cells[0];
    const type = cells[2];
    if (!comp) continue;
    rows.push({ comp, type });
  }

  if (rows.length === 0) {
    fail(`GATE(sources) FAILED: ${sourceFile} 中未解析到来源数据行。
下一步：执行真实检索并按来源表格式写入；搜不到则只能输出缺口报告。`);
  }

  // 按竞品分组
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.comp)) groups.set(r.comp, []);
    groups.get(r.comp).push(r);
  }

  const failures = [];
  console.log(`来源覆盖（阈值：每竞品 >= ${minSrc} 来源、>= ${minTyp} 类型）：`);
  console.log("");
  for (const [comp, items] of groups) {
    const srcCount = items.length;
    const types = [...new Set(items.map(i => i.type).filter(t => t && !/待验证/.test(t)))];
    const typeCount = types.length;
    const ok = srcCount >= minSrc && typeCount >= minTyp;
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${comp}`);
    console.log(`        来源 ${srcCount} 条 (需 ${minSrc}), 类型 ${typeCount} 种 (需 ${minTyp})`);
    console.log(`        类型: ${types.length ? types.join(", ") : "(无)"}`);
    if (!ok) failures.push(comp);
  }
  console.log("");

  if (failures.length > 0) {
    fail(`GATE(sources) FAILED: 以下竞品来源不足 -> ${failures.join(", ")}

下一步：
- 能补检索的：补齐该竞品来源后重跑本门禁。
- 补不齐的：唯一允许的输出是【缺口报告】(references/gap-report.md)，不得生成报告正文、近期动作结论、功能现状或口碑结论。`);
  }

  pass("GATE(sources) PASSED: 所有竞品来源达标，可进入报告正文生成。");
}

const args = parseArgs(process.argv);
if (args.stage === "scope") gateScope(args.state);
else gateSources(args.state, args.source, args.minSources, args.minTypes);
