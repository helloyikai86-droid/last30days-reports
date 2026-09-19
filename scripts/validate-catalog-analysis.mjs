import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "overview", "what_it_is", "target_users", "problem", "past_solution",
  "how_it_works", "architecture", "why_hot", "difference", "business",
  "china_opportunity", "beginner_guide", "usage_scenarios", "use_cases",
  "risks", "inspiration", "judgment", "full_analysis"
];
const bad = value => typeof value !== "string" || !value.trim() || /历史日报恢复|该项目曾出现在|历史日报恢复记录/.test(value);
const catalog = JSON.parse(fs.readFileSync(path.join(root, "docs", "projects.json"), "utf8"));
const byId = new Map(catalog.projects.map(p => [p.id, p]));
const errors = [];

for (const project of catalog.projects) {
  for (const key of required) if (bad(project[key])) errors.push(`projects.json: ${project.id}.${key}`);
  if ((project.analysis_quality_version || 1) >= 2) {
    const minimums = {
      what_it_is: 80, target_users: 35, problem: 55, past_solution: 55,
      how_it_works: 100, architecture: 75, why_hot: 55, difference: 55,
      business: 70, china_opportunity: 70, beginner_guide: 120,
      usage_scenarios: 180, use_cases: 70, risks: 80, inspiration: 55,
      judgment: 55, full_analysis: 900
    };
    for (const [key, min] of Object.entries(minimums)) {
      if (Array.from(project[key]?.trim() || "").length < min) errors.push(`projects.json: ${project.id}.${key} shorter than ${min}`);
    }
    const scenarios = project.usage_scenarios?.match(/场景\s*[一二三四五六七八九\d]+/g) || [];
    if (scenarios.length < 3) errors.push(`projects.json: ${project.id}.usage_scenarios needs at least 3 concrete scenarios`);
    const comparable = ["overview", "what_it_is", "how_it_works"].map(key => String(project[key] || "").replace(/[\s，。；：、]/g, ""));
    if (new Set(comparable).size !== comparable.length) errors.push(`projects.json: ${project.id} repeats overview/what_it_is/how_it_works`);
  }
}

const dailyDir = path.join(root, "docs", "daily");
for (const filename of fs.readdirSync(dailyDir).filter(x => /^\d{4}-\d{2}-\d{2}\.json$/.test(x))) {
  const daily = JSON.parse(fs.readFileSync(path.join(dailyDir, filename), "utf8"));
  if ((daily.projects || []).length !== 10) errors.push(`${filename}: expected 10 projects`);
  for (const project of daily.projects || []) {
    if (!byId.has(project.id)) errors.push(`${filename}: missing canonical project ${project.id}`);
    for (const key of required) if (bad(project[key])) errors.push(`${filename}: ${project.id}.${key}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Catalog analysis valid: ${catalog.projects.length} canonical projects; all daily appearances have ${required.length} detailed fields.`);
