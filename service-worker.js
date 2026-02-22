const CACHE_NAME="jamatna-cache-v17";
const ASSETS=["./", "./index.html", "./manifest.json", "./questions_db.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];

self.addEventListener("install",(e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  // keep the new version in "waiting" until the user taps "تحديث الآن"
});

self.addEventListener("activate",(e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});


self.addEventListener("message",(e)=>{
  if(e.data && e.data.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",(e)=>{
  const req = e.request;
  if(req.method !== "GET") return;

  // Audio/Video often use Range requests (206 Partial Content). Cache API can't store 206 responses.
  if (req.headers.has("range")) {
    e.respondWith(fetch(req));
    return;
  }

  e.respondWith((async()=>{
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if(cached) return cached;

    try{
      const res = await fetch(req);

      const url = new URL(req.url);
      const cacheable = url.origin === self.location.origin && res && res.ok && res.status === 200;
      if(cacheable){
        await cache.put(req, res.clone());
      }
      return res;
    }catch(err){
      // Offline fallback to cached index (for SPA-like navigation)
      return cached || cache.match("./index.html");
    }
  })());
});
