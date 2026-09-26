//offline support for the installed game: always try the network first so updates show
//right away, and fall back to the last copy when offline
const CACHE = "idle-football-manager";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    let url = new URL(e.request.url);
    if(e.request.method !== "GET" || url.origin !== location.origin){
        return;
    }
    e.respondWith(caches.open(CACHE).then(cache =>
        fetch(e.request).then(response => {
            if(response.ok){
                cache.put(e.request, response.clone());
            }
            return response;
        }).catch(async () => (await cache.match(e.request)) || Response.error())
    ));
});
