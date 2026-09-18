const OWNER = "helloyikai86-droid";
const REPO = "last30days-reports";

function cors(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || "https://helloyikai86-droid.github.io";
  const ok = origin && origin.startsWith(allowed);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Notes-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8", ...headers}});
}
function authed(req, env) {
  const key = req.headers.get("X-Notes-Key") || "";
  return !!env.NOTES_KEY && key === env.NOTES_KEY;
}
async function gh(path, env, init={}) {
  const r = await fetch("https://api.github.com"+path, {
    ...init,
    headers:{
      "Accept":"application/vnd.github+json",
      "Authorization":"Bearer "+env.GITHUB_TOKEN,
      "X-GitHub-Api-Version":"2022-11-28",
      "User-Agent":"github-opportunity-notes-worker",
      ...(init.headers||{})
    }
  });
  if (!r.ok) throw new Error("GitHub "+r.status+" "+await r.text());
  return r.status===204 ? null : r.json();
}
function parse(body="") {
  const get = (heading) => {
    const re = new RegExp("##\\s+"+heading+"\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)", "i");
    const m = body.match(re); return m ? m[1].trim() : "";
  };
  const rawRating = get("我的评分");
  const n = Number((rawRating.match(/[1-5]/)||[])[0]||0) || null;
  const status = get("当前状态") || "👀 观察";
  const note = get("我的备注");
  const next_action = get("下一步行动");
  const defaultNote = /^（在这里记录/.test(note);
  const defaultNext = /^（例如：/.test(next_action);
  return {rating:n,status,note:defaultNote?"":note,next_action:defaultNext?"":next_action,has_notes:(!defaultNote&&!!note)||(!defaultNext&&!!next_action)};
}
function buildBody(issue, payload) {
  const title = issue.title.replace(/^\[项目笔记\]\s*/,"");
  const old = parse(issue.body||"");
  const projectUrl = (issue.body||"").match(/项目地址：(https?:\/\/\S+)/)?.[1] || "";
  const quote = (issue.body||"").match(/^>\s*(.+)$/m)?.[1] || "";
  const rating = payload.rating ?? old.rating;
  const status = payload.status || old.status || "👀 观察";
  const note = payload.note ?? old.note ?? "";
  const next = payload.next_action ?? old.next_action ?? "";
  return `# ${title}

项目地址：${projectUrl}

> ${quote}

## 当前状态
${status}

## 我的评分
${rating ? rating+" 分 "+ "★".repeat(rating)+"☆".repeat(5-rating) : "未评分"}

## 我的备注
${note || "（在这里记录这个项目给你的启发、可借鉴点、风险或想法）"}

## 下一步行动
${next || "（例如：让 Codex 跑一下 / 研究国内竞品 / 做一个 Demo / 过几天再看 Star 增速）"}

## 笔记时间线
后续修改会保留在 GitHub Issue 历史中，也可以继续追加评论。

---
此 Issue 用作该项目的长期个人研究笔记。`;
}

export default {
  async fetch(req, env) {
    const origin=req.headers.get("Origin")||"";
    const ch=cors(origin,env);
    if(req.method==="OPTIONS") return new Response(null,{status:204,headers:ch});
    try {
      const u=new URL(req.url);
      if(u.pathname==="/health") return json({ok:true},200,ch);
      if(u.pathname==="/summary" && req.method==="GET"){
        const issues=await gh(`/repos/${OWNER}/${REPO}/issues?state=open&per_page=100`,env);
        const out={};
        for(const it of issues){
          if(it.pull_request || !/^\[项目笔记\]/.test(it.title)) continue;
          const p=parse(it.body||"");
          out[it.number]={issue_number:it.number,rating:p.rating,status:p.status,has_notes:p.has_notes};
        }
        return json({notes:out},200,ch);
      }
      if(!authed(req,env)) return json({error:"unauthorized"},401,ch);

      if(u.pathname==="/notes" && req.method==="GET"){
        const issues=await gh(`/repos/${OWNER}/${REPO}/issues?state=open&per_page=100`,env);
        const out={};
        for(const it of issues){
          if(it.pull_request || !/^\[项目笔记\]/.test(it.title)) continue;
          const p=parse(it.body||"");
          out[it.number]={issue_number:it.number,name:it.title.replace(/^\[项目笔记\]\s*/,""),url:it.html_url,...p};
        }
        return json({notes:out},200,ch);
      }

      const m=u.pathname.match(/^\/notes\/(\d+)$/);
      if(m){
        const num=Number(m[1]);
        if(req.method==="GET"){
          const issue=await gh(`/repos/${OWNER}/${REPO}/issues/${num}`,env);
          return json({issue_number:num,url:issue.html_url,...parse(issue.body||"")},200,ch);
        }
        if(req.method==="POST"){
          const payload=await req.json();
          const issue=await gh(`/repos/${OWNER}/${REPO}/issues/${num}`,env);
          const body=buildBody(issue,payload);
          const updated=await gh(`/repos/${OWNER}/${REPO}/issues/${num}`,env,{
            method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body})
          });
          if(payload.timeline){
            await gh(`/repos/${OWNER}/${REPO}/issues/${num}/comments`,env,{
              method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:payload.timeline})
            });
          }
          return json({ok:true,issue_number:num,url:updated.html_url,...parse(updated.body||"")},200,ch);
        }
      }
      return json({error:"not_found"},404,ch);
    } catch(e) {
      return json({error:String(e.message||e)},500,ch);
    }
  }
};