#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge public daily GitHub research into the long-term public project index.
Never replace existing analysis with empty or placeholder text. Never touch private notes.
"""
import json
import re
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DAY=sys.argv[1] if len(sys.argv)>1 else None
dates=json.loads((ROOT/"docs/daily/index.json").read_text(encoding="utf-8"))["dates"]
if not DAY:
    DAY=dates[0]["date"] if isinstance(dates[0],dict) else dates[0]
assert re.fullmatch(r"20\d{2}-\d{2}-\d{2}",DAY)
p=ROOT/"docs"/"daily"/f"{DAY}.json"
daily=json.loads(p.read_text(encoding="utf-8"))
catalog_path=ROOT/"docs/projects.json"
catalog=json.loads(catalog_path.read_text(encoding="utf-8"))
assert isinstance(catalog,dict) and isinstance(catalog.get("projects"),list)
projects=catalog["projects"]
incoming=daily["projects"]
assert len(incoming)==10 and sorted(x["rank"] for x in incoming)==list(range(1,11)), "Top10 rankings invalid"
private={"rating","has_notes","status","user_note","next_action","notes_issue","notes_url","notes","notes_key","is_starred","my_rating","my_status","private_issue"}
analysis={"description","tags","why","business","target_users","problem","past_solution","what_it_is","how_it_works","architecture","why_hot","difference","china_opportunity","use_cases","risks","inspiration","judgment","full_analysis","overview","beginner_guide","usage_scenarios"}
snapshot={"total_stars","stars_today","language","stars_today_metric","metric_kind","metric_observed_at","speed_up","license"}
placeholder=re.compile(r"^(?:该项目曾出现在|历史日报恢复|暂无详细分析|稍后补充|TODO|待补充|待完善)",re.I)
def valid(v):
    return v is not None and v!="" and (not isinstance(v,str) or (bool(v.strip()) and not placeholder.match(v.strip()))) and (not isinstance(v,(list,dict)) or bool(v))
def canonical(url):
    m=re.match(r"https://github\.com/([^/]+)/([^/#?]+)",str(url),re.I)
    return "/".join(m.groups()).lower().removesuffix(".git") if m else ""
byid={str(x.get("id")):x for x in projects}
byurl={canonical(x.get("url")):x for x in projects if canonical(x.get("url"))}
seen=set()
added=0
changed=0
for day in incoming:
    assert not (set(day)&private), "Private fields in daily JSON"
    assert canonical(day.get("url")), "Invalid GitHub repo URL"
    assert valid(day.get("full_analysis")) and len(day["full_analysis"])>=650, "No detailed public analysis"
    assert all(valid(day.get(k)) for k in ("name","description","target_users","problem","past_solution","what_it_is","how_it_works","architecture","why_hot","difference","business","china_opportunity","use_cases","risks","inspiration","judgment")), "Missing core analysis"
    old=byurl.get(canonical(day["url"])) or byid.get(str(day.get("id")))
    if old is None:
        old={"id":day["id"],"first_seen":DAY}
        projects.append(old)
        byid[old["id"]]=old
        byurl[canonical(day["url"])]=old
        added+=1
    if old["id"] in seen: raise AssertionError("Repeated stable ID in daily Top10")
    seen.add(old["id"])
    if day["id"]!=old["id"]:
        day["id"]=old["id"]
        changed+=1
    for field in ("name","url","repo"):
        if valid(day.get(field)): old[field]=day[field]
    for field in analysis|snapshot:
        if field in day and valid(day[field]): old[field]=day[field]
    old.setdefault("first_seen",DAY)
    old["last_seen"]=DAY
    old["latest_analysis_date"]=DAY
    old["latest_rank"]=day["rank"]
    if valid(day.get("stars_today")):old["latest_stars_today"]=day["stars_today"]
    if not valid(old.get("why")) and valid(day.get("why_hot")):old["why"]=day["why_hot"]
    if not valid(old.get("tags")):old["tags"]=["开发工具"]
    assert not (set(old)&private), "Public catalog contains forbidden private fields"
assert len({x["id"] for x in projects})==len(projects),"Duplicate project IDs"
catalog["projects"]=projects
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if changed:
    p.write_text(json.dumps(daily,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"PUBLIC_SYNC day={DAY} total={len(projects)} newly_added={added} corrected_daily_ids={changed} matched={len(incoming)-added}")
