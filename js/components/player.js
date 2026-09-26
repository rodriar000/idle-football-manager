app.component("player", {
    props: ["player", "signing"],
    data() {
        return {
            showStatBreakdown: false,
            confirmSell: false,
            confirmSellTimeout: null,
            teamPlayers: game.team.players
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        formatChange(n){
            return (n.lt(0) ? "-" : "+") + this.formatNumber(n.abs());
        },
        addToTraining(){
            game.training.addPlayer(this.player);
        },
        removeFromTraining(){
            game.training.removePlayer(this.player);
        },
        toggleCompare(){
            playerCompare.toggle(this.player);
        },
        //selling needs a second tap (or Shift held), so a missed tap on "Move to Team" can't sell
        sellPlayer(){
            let shift = keyMap.keyPressed("Shift");
            if(!shift && game.settings.players.shiftToSell){
                return;
            }
            if(shift || this.confirmSell){
                this.cancelSell();
                this.player.sell();
                return;
            }
            this.confirmSell = true;
            this.confirmSellTimeout = setTimeout(() => this.cancelSell(), 3000);
        },
        cancelSell(){
            clearTimeout(this.confirmSellTimeout);
            this.confirmSell = false;
        }
    },
    beforeUnmount(){
        clearTimeout(this.confirmSellTimeout);
    },
    computed: {
        canMove(){
            if(this.player.hasRedCard() && (game.currentMatch && !game.currentMatch.ended || !this.player.active)){
                return false;
            }
            return (!this.teamFull && !this.player.active) || this.player.active;
        },
        canSell(){
            return keyMap.keyPressed("Shift") || !game.settings.players.shiftToSell;
        },
        teamFull(){
            return game.team.getActivePlayers().length >= 11;
        },
        isBought(){
            return this.teamPlayers.find(p => p === this.player) !== undefined || game.training.players.find(p => p === this.player) !== undefined;
        },
        trainingUnlocked(){
            return PlayerTraining.isUnlocked;
        },
        isTraining(){
            return this.$root.training.players.find(p => p === this.player) !== undefined;
        },
        isCompared(){
            return playerCompare.isSelected(this.player);
        },
        canCompare(){
            return this.isCompared || playerCompare.players.length < 2;
        },
        buttonWidth(){
            if(!this.trainingUnlocked){
                return "100%";
            }
            return this.player.active ? "100%" : "50%";
        }
    },
    template: `<div class="player" :class="{compared: isCompared}">
<button class="compare-toggle" :class="{active: isCompared}" :disabled="!canCompare" @click="toggleCompare()" :title="isCompared ? 'Remove from Comparison' : 'Compare'">⇄</button>
<p class="header"><div @click="showStatBreakdown = true" class="icon-flex"><img alt="" src="images/player.png"/><img v-if="player.hasRedCard()" alt="" src="images/icons/red-card.png"/> {{player.name}}</div>
<div class="icon-flex" v-if="isBought"><img alt="" src="images/icons/stamina.png"/> <progress-bar :value="player.currentStamina"></progress-bar></div>
<div class="signing" v-else-if="signing" title="Buying this Player improves your best Eleven the most">★ Best Signing <span>{{formatChange(signing.attack)}} ATT · {{formatChange(signing.defense)}} DEF</span></div></p>
<div class="stats">
    <p><span>ATT</span> {{formatNumber(player.getBaseAttack())}}</p>
    <p>{{formatNumber(player.getBaseDefense())}} <span>DEF</span></p>
    <p><span>AGG</span> {{formatNumber(player.aggressivity * 100)}}</p>
    <p>{{formatNumber(player.stamina * 100)}} <span>STA</span></p>
    <p class="total" title="Attack + Defense"><span>ATT+DEF</span> {{formatNumber(player.getBaseAttack().add(player.getBaseDefense()))}}</p>
</div>
<div class="actions">
    <div v-if="isBought">
        <div v-if="isTraining">
            <button v-if="!player.active" @click="removeFromTraining()">Stop Training</button>
        </div>
        <div v-else>
            <button :style="{width: buttonWidth}" :disabled="!canMove" v-if="isBought" @click="player.active = !player.active"><span v-if="!player.active">Move to Team</span><span v-else>Move from Team</span></button>
            <button :style="{width: '50%'}" v-if="!player.active && trainingUnlocked" @click="addToTraining()">Train</button>
            <button class="negative sell" :class="{armed: confirmSell}" v-if="!player.active" @click="sellPlayer()" @blur="cancelSell()">
                <span v-if="confirmSell">Tap again to sell ({{formatNumber(player.getSellAmount())}} $)</span>
                <span v-else>Sell ({{formatNumber(player.getSellAmount())}} $)</span>
            </button>
        </div>
    </div>
    <div v-else>
        <button :disabled="!player.canAfford()" @click="player.buy()">Buy ($ {{formatNumber(player.getPrice())}})</button>
    </div>
</div>
<transition name="window-grow">
    <window-player @closed="showStatBreakdown = false" v-if="showStatBreakdown" :player="player">
    
    </window-player>
</transition>
</div>`
});