'use strict';
/* =====================================================================
   PWA (manifest data URI di <head>, Service Worker dibuat dari Blob)
===================================================================== */
function setupPWA() {
  try { const mf = document.querySelector('link[rel="manifest"]'); if (mf && !document.head.contains(mf)) document.head.appendChild(mf.cloneNode()); const mt = document.querySelector('meta[name="theme-color"]'); if (mt && !document.head.contains(mt)) document.head.appendChild(mt.cloneNode()); } catch (e) {}
  try {
    const sw = "const C='cbt-v1';self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();if(r.ok&&e.request.url.startsWith('http'))caches.open(C).then(x=>x.put(e.request,c)).catch(()=>{});return r}).catch(()=>caches.match(e.request)))});";
    const url = URL.createObjectURL(new Blob([sw], { type: 'text/javascript' }));
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(url).catch(() => {});
  } catch (e) {}
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installEvt = e; if (S.role) render(); });
}
