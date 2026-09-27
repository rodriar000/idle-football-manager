app.component("player", {
    props: ["player", "signing", "layout"],
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
        tierName(){
            return {elite: "Elite", gold: "Gold", silver: "Silver", bronze: "Bronze"}[this.tier];
        },
        total(){
            return this.player.getBaseAttack().add(this.player.getBaseDefense());
        },
        //how much of ATT+DEF is attack, for the split bar
        attackShare(){
            let total = this.total;
            return total.gt(0) ? Math.round(this.player.getBaseAttack().div(total).toNumber() * 100) : 50;
        }
    },
    template: `<div :class="[layout === 'row' ? 'prow' : 'pcard', 'tier-' + tier, {compared: isCompared, locked: player.locked, owned: isBought, 'cant-afford': !isBought && !player.canAfford(), 'window-open': showStatBreakdown}]">
<player-avatar class="p-avatar" :player="player" @click="showStatBreakdown = true"></player-avatar>
<div class="p-id" @click="showStatBreakdown = true" title="Show all stats">
    <b class="p-name" :title="player.name">{{player.name}}</b>
    <span class="p-sub">
        <span class="p-tier" :title="tierTitle">{{tierName}}</span>
        <ui-icon class="red-card" v-if="player.hasRedCard()" name="redcard" title="Red card"></ui-icon>
        <ui-icon class="p-locked" v-if="player.locked" name="lock"></ui-icon>
    </span>
</div>
<div class="p-ovr" :title="'Attack + Defense. ' + tierTitle"><b>{{formatNumber(total)}}</b><small>ATT+DEF</small></div>
<div class="p-stats">
    <p class="p-att"><small>ATT</small><b>{{formatNumber(player.getBaseAttack())}}</b></p>
    <div class="p-split" :title="attackShare + '% Attack, ' + (100 - attackShare) + '% Defense'"><i :style="{width: attackShare + '%'}"></i></div>
    <p class="p-def"><b>{{formatNumber(player.getBaseDefense())}}</b><small>DEF</small></p>
</div>
<div class="p-extra">
    <span title="Aggressiveness: higher means more red cards"><small>AGG</small> {{formatNumber(player.aggressivity * 100)}}</span>
    <span title="Stamina: higher means faster recovery"><small>STA</small> {{formatNumber(player.stamina * 100)}}</span>
</div>
<div class="p-fitness" v-if="isBought" :title="'Fitness ' + Math.round(player.currentStamina * 100) + '%'"><ui-icon class="stamina-icon" name="stamina"></ui-icon><progress-bar :value="player.currentStamina"></progress-bar></div>
<div class="p-signing" v-else-if="signing" title="Buying this Player improves your best Eleven the most"><ui-icon name="star"></ui-icon><span><b>Best Signing</b> {{formatChange(signing.attack)}} ATT · {{formatChange(signing.defense)}} DEF</span></div>
<div class="p-tools">
    <button class="icon-btn lock-toggle" v-if="isBought" :class="{active: player.locked}" @click="toggleLock()" :aria-label="player.locked ? 'Unprotect' : 'Protect'" :title="player.locked ? 'Protected: cannot be sold or taken out of the Team. Tap to unprotect' : 'Protect this Player'"><ui-icon :name="player.locked ? 'lock' : 'unlock'"></ui-icon></button>
    <button class="icon-btn compare-toggle" :class="{active: isCompared}" :disabled="!canCompare" @click="toggleCompare()" aria-label="Compare" :title="isCompared ? 'Remove from Comparison' : 'Compare'"><ui-icon name="compare"></ui-icon></button>
</div>
<div class="actions">
    <template v-if="isBought">
        <button v-if="isTraining && !player.active" @click="removeFromTraining()"><ui-icon name="swap"></ui-icon> Stop Training</button>
        <template v-else-if="!isTraining">
            <button class="move" :disabled="!canMove" @click="player.active = !player.active" :title="player.active && player.locked ? 'Protected: unprotect the Player (lock button) to take them out' : ''"><ui-icon name="swap"></ui-icon> {{player.active ? "To Bench" : "To Team"}}</button>
            <button class="train" v-if="!player.active && trainingUnlocked" @click="addToTraining()"><ui-icon name="training"></ui-icon> Train</button>
            <button class="sell protected" disabled v-if="!player.active && player.locked" title="Unprotect the Player (lock button) to sell"><ui-icon name="lock"></ui-icon> Protected</button>
            <button class="negative sell" :class="{armed: confirmSell}" v-else-if="!player.active" @click="sellPlayer()" @blur="cancelSell()">
                <ui-icon name="sell"></ui-icon>
                <span v-if="confirmSell">Tap again: {{formatNumber(player.getSellAmount())}} $</span>
                <span v-else>Sell {{formatNumber(player.getSellAmount())}} $</span>
            </button>
        </template>
    </template>
    <button v-else class="buy" :disabled="!player.canAfford()" :class="{'cant-afford': !player.canAfford()}" @click="buy()"><ui-icon name="coins"></ui-icon> Buy {{formatNumber(player.getPrice())}} $</button>
</div>
<transition name="window-grow">
    <window-player @closed="showStatBreakdown = false" v-if="showStatBreakdown" :player="player"></window-player>
</transition>
</div>`
});
