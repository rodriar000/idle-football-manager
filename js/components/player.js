app.component("player", {
    props: ["player"],
    data() {
        return {
            showStatBreakdown: false,
            teamPlayers: game.team.players
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
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
        sellPlayer(){
            if(keyMap.keyPressed("Shift") || !game.settings.players.shiftToSell){
                this.player.sell();
            }
        }
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
    template: `<div class="player" :class="['tier-' + tier, {compared: isCompared}]">
<button class="compare-toggle" :class="{active: isCompared}" :disabled="!canCompare" @click="toggleCompare()" :title="isCompared ? 'Remove from Comparison' : 'Compare'">⇄</button>
<p class="header"><div @click="showStatBreakdown = true" class="icon-flex"><player-avatar :player="player"></player-avatar><img v-if="player.hasRedCard()" alt="" src="images/icons/red-card.png"/> {{player.name}}</div>
<div class="icon-flex" v-if="isBought"><img alt="" src="images/icons/stamina.png"/> <progress-bar :value="player.currentStamina"></progress-bar></div></p>
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
            <button :style="{width: buttonWidth}" :disabled="!canMove" v-if="isBought" @click="player.active = !player.active"><span v-if="!player.active">Move to Team</span><span v-else>Move from Team</span></button>
            <button :style="{width: '50%'}" v-if="!player.active && trainingUnlocked" @click="addToTraining()">Train</button>
            <button class="negative" v-if="!player.active" @click="sellPlayer()">Sell ({{formatNumber(player.getSellAmount())}} $)</button>
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