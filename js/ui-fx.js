//short visual moments shared between components
const uiFx = Vue.reactive({
    signing: null,

    //"Signed!" stamp after buying a player
    showSigning(player){
        clearTimeout(this.signingTimeout);
        this.signing = {player, key: Date.now()};
        this.signingTimeout = setTimeout(() => this.signing = null, 1500);
    }
});
