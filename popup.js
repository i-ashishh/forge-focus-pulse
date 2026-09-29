const D={enabled:true,interval:15,category:'mixed',jeeMode:true,quietHours:false,quietStart:'23:00',quietEnd:'06:30'};
const $=id=>document.getElementById(id);
async function load(){const s=await chrome.storage.local.get(D); for(const k of Object.keys(D)) {const el=$(k); if(!el) continue; el.type==='checkbox'?el.checked=s[k]:el.value=s[k];}}
async function save(){const s={enabled:$('enabled').checked,interval:Number($('interval').value),category:$('category').value,jeeMode:$('jeeMode').checked,quietHours:$('quietHours').checked,quietStart:$('quietStart').value,quietEnd:$('quietEnd').value}; await chrome.storage.local.set(s); $('status').textContent='Saved'; setTimeout(()=>$('status').textContent='',900);}
['enabled','interval','category','jeeMode','quietHours','quietStart','quietEnd'].forEach(id=>$(id)?.addEventListener('change',save));
$('test').addEventListener('click',async()=>{await chrome.runtime.sendMessage({type:'FORGE_TEST'});$('status').textContent='Pulse sent';setTimeout(()=>$('status').textContent='',1200)});
load();
