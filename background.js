'use strict';

const DEFAULTS = {
  enabled: true,
  interval: 15,
  displaySeconds: 18,
  mode: 'overlay',
  category: 'mixed',
  jeeMode: true,
  quietHours: false,
  quietStart: '23:00',
  quietEnd: '06:30',
  savedIds: [],
  shownIds: [],
  pulseCount: 0,
  lastPulseAt: 0
};

const CONTENT = [
  ['brutal','The cost is still being paid.','Every hour you spend avoiding the work is not erased. It is charged to your future self.','FORGE ORIGINAL'],
  ['discipline','Motivation is not the system.','Build the routine so your mood becomes irrelevant. The task begins because the clock says begin.','FORGE PRINCIPLE'],
  ['failure','Failure is data when you stop lying about it.','Extract the cause, change the process, and make the next attempt structurally different.','FORGE PRINCIPLE'],
  ['philosophy','You become what you repeatedly permit.','A single distraction is an event. Repeatedly choosing it is a training program.','FORGE ORIGINAL'],
  ['jee','A lecture watched is not a chapter mastered.','Understanding begins in the lecture. Skill is built through questions, mistakes, revision, and retrieval.','FORGE JEE'],
  ['jee','Your backlog is not a monster.','It is a finite list of unfinished actions. Stop staring at the pile and execute the next item.','FORGE JEE'],
  ['focus','Do not negotiate with the first five minutes.','Open the material and solve one question before your brain invents a courtroom for the excuse.','FORGE ORIGINAL'],
  ['villain','The villain usually has a reason.','The interesting question is not whether the character is evil. What belief made the action feel justified?','FORGE STORY LAB'],
  ['idea','A useful life has an error log.','Record recurring mistakes without drama. Patterns become visible when memory stops protecting your ego.','FORGE PRINCIPLE'],
  ['story','The strongest character keeps showing up.','Power is dramatic. Consistency is terrifying because it compounds while everyone else waits to feel inspired.','FORGE STORY LAB'],
  ['philosophy','Control the controllable.','You do not control the paper, the competition, or yesterday. You control the next focused block.','FORGE PRINCIPLE'],
  ['brutal','Potential is a dangerous drug.','Being capable means almost nothing if your behavior repeatedly contradicts it.','FORGE ORIGINAL'],
  ['discipline','Make the desired action easier than the excuse.','Put the book open. Remove the phone. Queue the lecture. Reduce decisions between you and the work.','FORGE PRINCIPLE'],
  ['jee','Accuracy beats heroic attempt counts.','A giant attempt count full of guesses is not bravery. Learn the pattern, then attack.','FORGE JEE'],
  ['failure','The result is a receipt, not a prophecy.','A score describes what happened under specific conditions. Change the conditions, then produce new evidence.','FORGE PRINCIPLE'],
  ['idea','Use friction as a diagnostic.','If starting feels unusually hard, inspect the environment before insulting your character.','FORGE PRINCIPLE'],
  ['focus','One block. One target. No mythology.','You do not need to become legendary this morning. You need to complete the next block.','FORGE ORIGINAL'],
  ['philosophy','Time is neutral.','It does not care whether you used it brilliantly or fed it to an algorithm. The clock keeps receipts.','FORGE ORIGINAL'],
  ['story','Every transformation has an unglamorous middle.','The montage is fiction. Real progress is repetitive, quiet, and occasionally boring enough to offend your ego.','FORGE STORY LAB'],
  ['brutal','You cannot out-plan non-execution.','A beautiful timetable that is not followed is decorative fiction.','FORGE ORIGINAL'],
  ['jee','The question bank is the courtroom.','Knowing a formula is testimony. Solving unfamiliar questions under time pressure is evidence.','FORGE JEE'],
  ['jee','Revision is not rereading.','Close the notes. Retrieve the idea. Solve. Check. Repair the gap. Then repeat later.','FORGE JEE'],
  ['discipline','Make starting embarrassingly easy.','Tell yourself to work for five minutes. Starting is often the wall; once moving, momentum does the rest.','FORGE PRINCIPLE'],
  ['focus','Protect the first hour.','The beginning of a study session is where attention is easiest to steal. Guard it like something valuable.','FORGE ORIGINAL'],
  ['failure','Do not romanticize the comeback.','A comeback is mostly ordinary days executed without needing a cinematic soundtrack.','FORGE PRINCIPLE'],
  ['philosophy','Identity follows evidence.','You do not become disciplined by declaring it. You build the identity by repeatedly doing disciplined things.','FORGE ORIGINAL'],
  ['idea','Your environment is part of your willpower.','If distraction is one click away and study requires ten steps, the system is quietly voting against you.','FORGE PRINCIPLE'],
  ['villain','A belief can become a prison.','The most dangerous character is sometimes the person who cannot imagine a life outside their own explanation of the world.','FORGE STORY LAB'],
  ['story','The hidden cost of genius is inconsistency.','A brilliant day is memorable. A thousand ordinary days are transformative.','FORGE STORY LAB'],
  ['brutal','You are not short on information.','You are short on converted information: solved problems, recalled concepts, corrected mistakes, and completed work.','FORGE ORIGINAL']
].map((x,i)=>({id:`forge-${i+1}`, type:x[0].toUpperCase(), title:x[1], body:x[2], source:x[3]}));

async function settings(){ return chrome.storage.local.get(DEFAULTS); }
function inQuietHours(s){
  if(!s.quietHours) return false;
  const now = new Date();
  const mins = now.getHours()*60 + now.getMinutes();
  const [sh,sm] = s.quietStart.split(':').map(Number);
  const [eh,em] = s.quietEnd.split(':').map(Number);
  const start=sh*60+sm, end=eh*60+em;
  return start <= end ? mins>=start && mins<end : mins>=start || mins<end;
}
function poolFor(s){
  let p = CONTENT;
  if(s.jeeMode) p = p.filter(x=>x.type==='JEE' || x.type!=='JEE');
  if(s.category !== 'mixed') p = p.filter(x=>x.type===s.category.toUpperCase());
  return p.length ? p : CONTENT;
}
async function pick(s){
  const pool=poolFor(s);
  const recent=new Set((s.shownIds||[]).slice(-Math.min(pool.length-1,8)));
  const candidates=pool.filter(x=>!recent.has(x.id));
  const source=candidates.length?candidates:pool;
  return source[Math.floor(Math.random()*source.length)];
}
async function schedule(){
  const s=await settings();
  await chrome.alarms.clear('forge-pulse');
  if(s.enabled) await chrome.alarms.create('forge-pulse',{delayInMinutes:Math.max(5,Number(s.interval)||15),periodInMinutes:Math.max(5,Number(s.interval)||15)});
}
async function deliver(item,s){
  const tabs=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  const tab=tabs[0];
  let delivered=false;
  if(s.mode==='overlay' && tab?.id && /^https?:$/.test(new URL(tab.url||'').protocol)){
    try { await chrome.tabs.sendMessage(tab.id,{type:'FORGE_PULSE',item,settings:s}); delivered=true; } catch {}
  }
  if(!delivered || s.mode==='notification'){
    await chrome.notifications.create(`forge-${Date.now()}`,{type:'basic',iconUrl:'icon128.png',title:`${item.type} · FORGE`,message:item.body,priority:2});
  }
}
async function pulse(){
  const s=await settings();
  if(!s.enabled || inQuietHours(s)) return;
  const item=await pick(s);
  const shown=[...(s.shownIds||[]),item.id].slice(-30);
  await chrome.storage.local.set({currentPulse:item,shownIds:shown,pulseCount:(s.pulseCount||0)+1,lastPulseAt:Date.now()});
  await deliver(item,s);
}

chrome.runtime.onInstalled.addListener(async()=>{ await chrome.storage.local.set({...DEFAULTS,...await chrome.storage.local.get(DEFAULTS)}); await schedule(); });
chrome.runtime.onStartup.addListener(schedule);
chrome.storage.onChanged.addListener((changes,area)=>{ if(area==='local' && (changes.interval||changes.enabled)) schedule(); });
chrome.alarms.onAlarm.addListener(a=>{ if(a.name==='forge-pulse') pulse(); });
chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  (async()=>{
    if(msg.type==='FORGE_NEXT'){ const s=await settings(); const item=await pick(s); await deliver(item,s); sendResponse({ok:true}); }
    else if(msg.type==='FORGE_SAVE'){ const s=await settings(); const ids=new Set(s.savedIds||[]); ids.add(msg.item.id); await chrome.storage.local.set({savedIds:[...ids]}); sendResponse({ok:true}); }
    else if(msg.type==='FORGE_TEST'){ await pulse(); sendResponse({ok:true}); }
    else if(msg.type==='FORGE_GET_CONTENT'){ sendResponse({content:CONTENT}); }
  })().catch(e=>sendResponse({ok:false,error:String(e)}));
  return true;
});
