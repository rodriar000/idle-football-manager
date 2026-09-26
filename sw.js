//offline support for the installed game: answer from the cache, refresh it in the background
const CACHE = "idle-football-manager";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    let url = new URL(e.request.url);
    if(e.request.method !== "GET" || url.origin !== location.origin){
        return;
    }
    e.respondWith(caches.open(CACHE).then(async cache => {
        let cached = await cache.match(e.request);
        let fresh = fetch(e.request).then(response => {
            if(response.ok){
                cache.put(e.request, response.clone());
            }
            return response;
        });
        if(cached){
            //keep the cache current, errors while offline don't matter
            fresh.catch(() => null);
            return cached;
        }
        return fresh;
    }));
});
