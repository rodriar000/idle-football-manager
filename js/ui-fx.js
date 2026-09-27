//short visual moments shared between components
//players shown as cards or as a list; a display choice, kept outside the savegame
function loadPlayerView(){
    try{
        return localStorage.getItem("ifmPlayerView") === "list" ? "list" : "cards";
    }
    catch(e){
        return "cards";
    }
}

//stable list keys for players: two players can share a name
const playerKeys = new WeakMap();
let nextPlayerKey = 1;

const uiFx = Vue.reactive({
    signing: null,
    playerView: loadPlayerView(),
    marketSort: "recommended",

    keyOf(player){
        let raw = Vue.toRaw(player);
        if(!playerKeys.has(raw)){
            playerKeys.set(raw, nextPlayerKey++);
        }
        return playerKeys.get(raw);
    },

    setPlayerView(view){
        this.playerView = view;
        try{
            localStorage.setItem("ifmPlayerView", view);
        }
        catch(e){}
    },

    //"Signed!" stamp after buying a player
    showSigning(player){
        clearTimeout(this.signingTimeout);
        this.signing = {player, key: Date.now()};
        this.signingTimeout = setTimeout(() => this.signing = null, 1500);
    }
});
