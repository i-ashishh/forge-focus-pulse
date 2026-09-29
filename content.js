(() => {
  'use strict';
  if (window.top !== window) return;
  const ROOT_ID = '__forge_focus_root__';
  let timer;

  function remove() {
    clearTimeout(timer);
    document.getElementById(ROOT_ID)?.remove();
  }

  function esc(value) {
    return String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  }

  function show(item, settings = {}) {
    remove();
    if (!document.body) return;

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'FORGE focus pulse');
    root.innerHTML = `
      <div class="forge-backdrop" data-forge-dismiss></div>
      <section class="forge-card" tabindex="-1">
        <div class="forge-top">
          <div class="forge-brand"><span class="forge-mark">F</span><span>FORGE</span></div>
          <button class="forge-x" aria-label="Dismiss" data-forge-dismiss>×</button>
        </div>
        <div class="forge-meta"><span>${esc(item.type)}</span><i></i><span>${esc(item.source || 'FORGE')}</span></div>
        <h2>${esc(item.title)}</h2>
        <p>${esc(item.body)}</p>
        <div class="forge-actions">
          <button class="forge-primary" data-forge-next>ANOTHER</button>
          <button class="forge-secondary" data-forge-save>${settings.savedIds?.includes(item.id) ? 'SAVED' : 'SAVE'}</button>
          <button class="forge-secondary" data-forge-dismiss>DISMISS</button>
        </div>
        <div class="forge-foot">${settings.jeeMode ? 'JEE MODE · EXECUTION OVER MOOD' : 'FOCUS PULSE · BACK TO THE WORK'}</div>
      </section>`;

    const style = document.createElement('style');
    style.textContent = `
      #${ROOT_ID}{all:initial;position:fixed;inset:0;z-index:2147483647;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f1e8}
      #${ROOT_ID} *{box-sizing:border-box}
      #${ROOT_ID} .forge-backdrop{position:absolute;inset:0;background:rgba(5,7,10,.28);backdrop-filter:blur(2px)}
      #${ROOT_ID} .forge-card{position:absolute;right:28px;bottom:28px;width:min(430px,calc(100vw - 36px));padding:24px;border:1px solid rgba(255,255,255,.13);border-radius:24px;background:linear-gradient(145deg,rgba(19,21,26,.985),rgba(9,11,14,.985));box-shadow:0 24px 80px rgba(0,0,0,.48),0 0 0 1px rgba(255,255,255,.025);animation:forge-in .28s cubic-bezier(.2,.8,.2,1);outline:none}
      #${ROOT_ID} .forge-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
      #${ROOT_ID} .forge-brand{display:flex;gap:9px;align-items:center;font-size:11px;letter-spacing:.22em;font-weight:800;opacity:.9}
      #${ROOT_ID} .forge-mark{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#f2ead9;color:#111;font-family:Georgia,serif;font-size:15px;letter-spacing:0}
      #${ROOT_ID} .forge-x{all:unset;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#bcb9b0;font-size:23px}
      #${ROOT_ID} .forge-x:hover{background:rgba(255,255,255,.08);color:#fff}
      #${ROOT_ID} .forge-meta{display:flex;align-items:center;gap:9px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#a9a69f;margin-bottom:12px}
      #${ROOT_ID} .forge-meta i{width:4px;height:4px;border-radius:50%;background:#8e8a80}
      #${ROOT_ID} h2{margin:0 0 12px;font:700 clamp(24px,4vw,32px)/1.06 Georgia,"Times New Roman",serif;letter-spacing:-.02em;color:#faf6ed}
      #${ROOT_ID} p{margin:0;color:#c8c4bb;font-size:15px;line-height:1.65}
      #${ROOT_ID} .forge-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:21px}
      #${ROOT_ID} button{font:700 11px/1 system-ui,sans-serif;letter-spacing:.08em}
      #${ROOT_ID} .forge-primary,#${ROOT_ID} .forge-secondary{border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:10px 13px;cursor:pointer}
      #${ROOT_ID} .forge-primary{background:#f2ead9;color:#111;border-color:#f2ead9}
      #${ROOT_ID} .forge-secondary{background:rgba(255,255,255,.045);color:#ddd8ce}
      #${ROOT_ID} .forge-primary:hover{filter:brightness(1.04)}
      #${ROOT_ID} .forge-secondary:hover{background:rgba(255,255,255,.09)}
      #${ROOT_ID} .forge-foot{margin-top:17px;padding-top:13px;border-top:1px solid rgba(255,255,255,.08);font-size:9px;letter-spacing:.14em;color:#77756f}
      @keyframes forge-in{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}
      @media(max-width:520px){#${ROOT_ID} .forge-card{right:10px;bottom:10px;width:calc(100vw - 20px);padding:20px}}
    `;
    root.appendChild(style);
    document.documentElement.appendChild(root);
    root.querySelector('.forge-card')?.focus();

    root.querySelectorAll('[data-forge-dismiss]').forEach(el => el.addEventListener('click', remove));
    root.querySelector('[data-forge-save]')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({type:'FORGE_SAVE', item}).catch(()=>{});
      const b = root.querySelector('[data-forge-save]');
      if (b) b.textContent = 'SAVED';
    });
    root.querySelector('[data-forge-next]')?.addEventListener('click', () => chrome.runtime.sendMessage({type:'FORGE_NEXT'}).catch(()=>{}));
    document.addEventListener('keydown', onKey, true);
    timer = setTimeout(remove, Math.max(5000, Number(settings.displaySeconds || 18) * 1000));
    function onKey(e){ if(e.key === 'Escape'){ remove(); document.removeEventListener('keydown', onKey, true); } }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'FORGE_PULSE') show(msg.item, msg.settings || {});
    if (msg?.type === 'FORGE_DISMISS') remove();
  });
})();
