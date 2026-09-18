const OWNER = "helloyikai86-droid";
const NOTES_REPO = "github-opportunity-notes-private";

function cors(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || "https://helloyikai86-droid.github.io";
  const ok = origin && origin.startsWith(allowed);
  return {"Access-Control-Allow-Origin": ok ? origin : allowed,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,X-Notes-Key","Access-Control-Max-Age":"86400","Vary":"Origin"};
}
function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...headers}}); }
function authed(req,env){ return !!env.NOTES_KEY && (req.headers.get("X-Notes-Key")||"")===env.NOTES_KEY; }
async function gh(path,env,init={}) {
  const r=await fetch("https://api.github.com"+path,{...init,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+env.GITHUB_TOKEN,"X-GitHub-Api-Version":"2022-11-28","User-Agent":"github-opportunity-private-notes-worker",...(init.headers||{})}});
  if(!r.ok) throw new Error("GitHub "+r.status+" "+await r.text());
  return r.status===204?null:r.json();
}
function getSection(body,heading){
  const marker="## "+heading+"\n"; const i=(body||"").indexOf(marker); if(i<0)return "";
  const rest=(body||"").slice(i+marker.length); const j=rest.indexOf("\n## "); return (j<0?rest:rest.slice(0,j)).trim();
}
function parseIssue(issue){
  const body=issue.body||"";
  const m=body.match(/<!--\s*project-id:([^>]+)-->/i); const project_id=m?m[1].trim():"";
  const raw=getSection(body,"我的评分"); const rating=Number((raw.match(/[1-5]/)||[])[0]||0)||null;
  const status=getSection(body,"当前状态")||"👀 观察";
  let note=getSection(body,"我的备注"), next_action=getSection(body,"下一步行动");
  if(/^（在这里记录/.test(note))note=""; if(/^（例如：/.test(next_action))next_action="";
  return {project_id,issue_number:issue.number,name:issue.title.replace(/^\[项目笔记\]\s*/,""),rating,status,note,next_action,has_notes:!!(note||next_action),url:issue.html_url};
}
async function listNoteIssues(env){
  const issues=await gh("/repos/"+OWNER+"/"+NOTES_REPO+"/issues?state=open&per_page=100",env);
  return issues.filter(x=>!x.pull_request && /^\[项目笔记\]/.test(x.title));
}
async function findIssue(projectId,env){ const issues=await listNoteIssues(env); return issues.find(x=>parseIssue(x).project_id===projectId)||null; }
async function listStarred(env){
  const out=[];
  for(let page=1;page<=10;page++){
    const rows=await gh("/users/"+OWNER+"/starred?per_page=100&page="+page,env);
    for(const r of rows) if(r.full_name) out.push(r.full_name);
    if(rows.length<100) break;
  }
  return out;
}
function buildBody(issue,p){
  const old=issue?parseIssue(issue):{rating:null,status:"👀 观察",note:"",next_action:""};
  const rating=p.rating ?? old.rating; const status=p.status || old.status || "👀 观察"; const note=p.note ?? old.note ?? ""; const next=p.next_action ?? old.next_action ?? "";
  const name=p.name || (issue?issue.title.replace(/^\[项目笔记\]\s*/,""):p.project_id);
  return "<!-- project-id:"+p.project_id+" -->\n# "+name+"\n\n项目地址："+(p.project_url||"")+"\n\n> "+(p.description||"")+"\n\n## 当前状态\n"+status+"\n\n## 我的评分\n"+(rating?(rating+" 分 "+"★".repeat(rating)+"☆".repeat(5-rating)):"未评分")+"\n\n## 我的备注\n"+(note||"（在这里记录这个项目给你的启发、可借鉴点、风险或想法）")+"\n\n## 下一步行动\n"+(next||"（例如：让 Codex 跑一下 / 研究国内竞品 / 做一个 Demo / 过几天再看 Star 增速）")+"\n\n## 笔记时间线\n后续修改保存在私有仓库 Issue 中，也可通过评论追加时间线。\n\n---\n此 Issue 是私人研究笔记，仅供授权访问。";
}
export default {
  async fetch(req,env){
    const origin=req.headers.get("Origin")||""; const ch=cors(origin,env);
    if(req.method==="OPTIONS") return new Response(null,{status:204,headers:ch});
    try{
      const u=new URL(req.url);
      if(u.pathname==="/health") return json({ok:true,storage:"private-github"},200,ch);
      if(!authed(req,env)) return json({error:"unauthorized"},401,ch);
      if(u.pathname==="/starred" && req.method==="GET"){
        const starred=await listStarred(env);
        return json({starred},200,ch);
      }
      if(u.pathname==="/notes" && req.method==="GET"){
        const issues=await listNoteIssues(env), out={};
        for(const it of issues){ const p=parseIssue(it); if(p.project_id)out[p.project_id]=p; }
        return json({notes:out},200,ch);
      }
      const m=u.pathname.match(/^\/notes\/([^/]+)$/);
      if(m){
        const projectId=decodeURIComponent(m[1]);
        if(req.method==="GET"){
          const issue=await findIssue(projectId,env);
          if(!issue) return json({project_id:projectId,rating:null,status:"👀 观察",note:"",next_action:"",has_notes:false},200,ch);
          return json(parseIssue(issue),200,ch);
        }
        if(req.method==="POST"){
          const p=await req.json(); p.project_id=projectId; let issue=await findIssue(projectId,env);
          if(!issue){
            issue=await gh("/repos/"+OWNER+"/"+NOTES_REPO+"/issues",env,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"[项目笔记] "+(p.name||projectId),body:buildBody(null,p)})});
          }else{
            issue=await gh("/repos/"+OWNER+"/"+NOTES_REPO+"/issues/"+issue.number,env,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:buildBody(issue,p)})});
          }
          return json({ok:true,...parseIssue(issue)},200,ch);
        }
      }
      return json({error:"not_found"},404,ch);
    }catch(e){ return json({error:String(e.message||e)},500,ch); }
  }
};