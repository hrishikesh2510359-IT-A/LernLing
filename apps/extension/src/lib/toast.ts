/**
 * In-page celebration card. Shown only when a lesson is finished or the day
 * first counts as studied (PLAN.md section 4). Placeholder look; real design
 * comes from the Stitch exports.
 */
export type ToastKind = 'lesson' | 'day' | 'nudge'

export interface ToastData {
  kind: ToastKind
  title: string
  body: string
}

const AUTO_HIDE_MS = 6000

export function showToast(data: ToastData): void {
  document.getElementById('lernling-toast-host')?.remove()

  const host = document.createElement('div')
  host.id = 'lernling-toast-host'
  host.style.cssText = 'all:initial;position:fixed;right:20px;bottom:90px;z-index:2147483647;'
  const root = host.attachShadow({ mode: 'closed' })
  root.innerHTML = `
    <style>
      .card{font-family:'Plus Jakarta Sans',system-ui,sans-serif;width:300px;box-sizing:border-box;
        background:#fff;border:1px solid #fdba74;border-radius:20px;padding:14px 16px;
        box-shadow:0 12px 32px -4px rgba(74,59,50,.18);color:#2c211d;display:flex;gap:12px;
        align-items:center;animation:in .25s ease-out}
      .emoji{font-size:34px;line-height:1}
      .flame{width:34px;height:42px;flex:none;overflow:visible;
        animation:ignite .9s ease-out 1,glow 1.6s ease-in-out .9s infinite}
      .flame path{transform-box:fill-box;transform-origin:50% 100%}
      .flame .o{animation:flick 1.2s ease-in-out infinite}
      .flame .i{animation:flick .85s ease-in-out infinite reverse}
      @keyframes flick{0%,100%{transform:scale(1,1) rotate(0)}25%{transform:scale(1.04,.96) rotate(-1.5deg)}
        50%{transform:scale(.96,1.05) rotate(1deg)}75%{transform:scale(1.02,.99) rotate(-.6deg)}}
      @keyframes glow{0%,100%{filter:drop-shadow(0 0 5px rgba(255,140,0,.7)) drop-shadow(0 0 12px rgba(255,90,0,.45))}
        50%{filter:drop-shadow(0 0 10px rgba(255,175,0,.95)) drop-shadow(0 0 22px rgba(255,90,0,.7))}}
      @keyframes ignite{0%{transform:scale(.35);opacity:.2}45%{transform:scale(1.35);opacity:1}75%{transform:scale(.94)}100%{transform:scale(1)}}
      @media (prefers-reduced-motion:reduce){.flame,.flame path{animation:none!important}}
      .t{font-weight:800;font-size:15px}
      .b{font-size:13px;color:#4a3b32;margin-top:2px}
      button{all:unset;cursor:pointer;margin-left:auto;color:#7c6e65;font-size:16px;padding:2px 6px}
      @keyframes in{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
    </style>
    <div class="card" role="status">
      ${
        data.kind === 'day'
          ? `<svg class="flame" viewBox="0 0 64 80" aria-hidden="true">
               <defs>
                 <linearGradient id="fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d93a07"/><stop offset=".55" stop-color="#ff7a18"/><stop offset="1" stop-color="#ffb02e"/></linearGradient>
                 <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9d1a"/><stop offset="1" stop-color="#ffe066"/></linearGradient>
               </defs>
               <path class="o" fill="url(#fo)" d="M32 2 C36 16 54 28 54 50 C54 68 44 78 32 78 C20 78 10 68 10 50 C10 40 16 32 22 26 C22 34 26 38 30 38 C26 26 28 12 32 2 Z"/>
               <path class="i" fill="url(#fi)" d="M32 36 C36 46 46 52 46 62 C46 71 40 76 32 76 C24 76 18 71 18 62 C18 54 24 50 28 44 C29 49 31 50 33 50 C30 44 30 40 32 36 Z"/>
             </svg>`
          : `<div class="emoji">${data.kind === 'nudge' ? '👋' : '🎉'}</div>`
      }
      <div><div class="t"></div><div class="b"></div></div>
      <button aria-label="Close">×</button>
    </div>`
  root.querySelector('.t')!.textContent = data.title
  root.querySelector('.b')!.textContent = data.body
  root.querySelector('button')!.addEventListener('click', () => host.remove())

  document.documentElement.appendChild(host)
  setTimeout(() => host.remove(), AUTO_HIDE_MS)
}
