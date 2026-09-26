//installable app: service worker, install button and the start screen
const gamePwa = Vue.reactive({
    installEvent: null,
    installed: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    //iOS has no install prompt, it's done from the share menu
    isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),

    async install(){
        if(!this.installEvent){
            return;
        }
        this.installEvent.prompt();
        let choice = await this.installEvent.userChoice;
        if(choice.outcome === "accepted"){
            this.installed = true;
        }
        this.installEvent = null;
    }
});

addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    gamePwa.installEvent = e;
});

addEventListener("appinstalled", () => gamePwa.installed = true);

//sandboxed pages can throw just for reading navigator.serviceWorker
try{
    if("serviceWorker" in navigator && location.protocol.startsWith("http")){
        navigator.serviceWorker.register("sw.js").catch(() => null);
    }
}
catch(e){
    //no offline support here, the game works the same
}

//start screen stays at least a moment so the logo can be seen, a tap skips it
const splashShown = Date.now();

function hideSplash(){
    let splash = document.getElementById("splash");
    if(!splash){
        return;
    }
    setTimeout(() => {
        splash.classList.add("hidden");
        setTimeout(() => splash.remove(), 600);
    }, Math.max(0, 1200 - (Date.now() - splashShown)));
}
