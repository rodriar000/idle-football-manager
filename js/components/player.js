app.component("player", {
    props: ["player", "signing"],
    data() {
        return {
            showStatBreakdown: false,
            confirmSell: false,
            confirmSellTimeout: null
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
        buy(){
            this.player.buy();
            if(this.player.isBought()){
                uiFx.showSigning(this.player);
            }
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
        toggleLock(){
            this.player.locked = !this.player.locked;
            this.cancelSell();
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
        //computed props read through this.$root: cards rendered at startup exist before the global game is reactive
        canMove(){
            let match = this.$root.currentMatch;
            if(this.player.hasRedCard() && (match && !match.ended || !this.player.active)){
                return false;
            }
            if(this.player.active && this.player.locked){
                return false;
            }
            return (!this.teamFull && !this.player.active) || this.player.active;
        },
        canSell(){
            return keyMap.keyPressed("Shift") || !this.$root.settings.players.shiftToSell;
        },
        teamFull(){
            return this.$root.team.getActivePlayers().length >= 11;
        },
        isBought(){
            return this.$root.team.players.includes(this.player) || this.$root.training.players.includes(this.player);
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
        //card colour: strength compared to the typical (median) Player of your Team
        tier(){
            let team = this.$root.team;
            let ref = team.getActivePlayers();
            if(ref.length === 0){
                ref = team.players;
            }
            if(ref.length === 0){
                return "gold";
            }
            let total = p => p.getBaseAttack().add(p.getBaseDefense());
            let totals = ref.map(total).sort((a, b) => a.cmp(b));
            let median = totals[Math.floor(totals.length / 2)];
            let ratio = total(this.player).div(median).toNumber();
            return ratio >= 1.6 ? "elite" : ratio >= 1.15 ? "gold" : ratio >= 0.85 ? "silver" : "bronze";
        },
        tierTitle(){
            return {
                elite: "Elite: much stronger than your typical Player",
                gold: "Gold: stronger than your typical Player",
                silver: "Silver: about as strong as your typical Player",
                bronze: "Bronze: weaker than your typical Player"
            }[this.tier];
        },
        buttonWidth(){
            if(!this.trainingUnlocked){
                return "100%";
            }
            return this.player.active ? "100%" : "50%";
        }
    },
    template: `<div class="player" :class="['tier-' + tier, {compared: isCompared, locked: player.locked}]">
<button class="lock-toggle" v-if="isBought" :class="{active: player.locked}" @click="toggleLock()" :title="player.locked ? 'Protected: cannot be sold or taken out of the Team. Tap to unprotect' : 'Protect this Player'">{{player.locked ? "🔒" : "🔓"}}</button>
<button class="compare-toggle" :class="{active: isCompared}" :disabled="!canCompare" @click="toggleCompare()" :title="isCompared ? 'Remove from Comparison' : 'Compare'">⇄</button>
<p class="header"><div @click="showStatBreakdown = true" class="icon-flex"><player-avatar :player="player"></player-avatar><img v-if="player.hasRedCard()" alt="" src="images/icons/red-card.png"/> {{player.name}}</div>
<div class="icon-flex" v-if="isBought"><img alt="" src="images/icons/stamina.png"/> <progress-bar :value="player.currentStamina"></progress-bar></div>
<div class="signing" v-else-if="signing" title="Buying this Player improves your best Eleven the most">★ Best Signing <span>{{formatChange(signing.attack)}} ATT · {{formatChange(signing.defense)}} DEF</span></div></p>
<div class="stats">
    <p><span>ATT</span> {{formatNumber(player.getBaseAttack())}}</p>
    <p>{{formatNumber(player.getBaseDefense())}} <span>DEF</span></p>
    <p><span>AGG</span> {{formatNumber(player.aggressivity * 100)}}</p>
    <p>{{formatNumber(player.stamina * 100)}} <span>STA</span></p>
    <p class="total" :title="'Attack + Defense. ' + tierTitle"><span>ATT+DEF</span> {{formatNumber(player.getBaseAttack().add(player.getBaseDefense()))}}</p>
</div>
<div class="actions">
    <div v-if="isBought">
        <div v-if="isTraining">
            <button v-if="!player.active" @click="removeFromTraining()">Stop Training</button>
        </div>
        <div v-else>
            <button :style="{width: buttonWidth}" :disabled="!canMove" v-if="isBought" @click="player.active = !player.active" :title="player.active && player.locked ? 'Protected: unprotect the Player (🔒) to take them out' : ''"><span v-if="!player.active">Move to Team</span><span v-else>Move from Team</span></button>
            <button :style="{width: '50%'}" v-if="!player.active && trainingUnlocked" @click="addToTraining()">Train</button>
            <button class="sell protected" disabled v-if="!player.active && player.locked" title="Unprotect the Player (🔒) to sell">🔒 Protected</button>
            <button class="negative sell" :class="{armed: confirmSell}" v-else-if="!player.active" @click="sellPlayer()" @blur="cancelSell()">
                <span v-if="confirmSell">Tap again to sell ({{formatNumber(player.getSellAmount())}} $)</span>
                <span v-else>Sell ({{formatNumber(player.getSellAmount())}} $)</span>
            </button>
        </div>
    </div>
    <div v-else>
        <button :disabled="!player.canAfford()" :class="{'cant-afford': !player.canAfford()}" @click="buy()">Buy ($ {{formatNumber(player.getPrice())}})</button>
    </div>
</div>
<transition name="window-grow">
    <window-player @closed="showStatBreakdown = false" v-if="showStatBreakdown" :player="player">
    
    </window-player>
</transition>
</div>`
});