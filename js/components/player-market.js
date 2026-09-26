app.component("player-market", {
    props: ["playerMarket"],
    computed: {
        //the affordable player that raises the ATT + DEF of your best eleven the most
        bestSigning(){
            let power = p => p.getBaseAttack().add(p.getBaseDefense());
            let bestEleven = players => {
                let eleven = [...players].sort((a, b) => power(b).cmp(power(a))).slice(0, 11);
                return {
                    attack: eleven.reduce((s, p) => s.add(p.getBaseAttack()), new Decimal(0)),
                    defense: eleven.reduce((s, p) => s.add(p.getBaseDefense()), new Decimal(0))
                };
            };
            let team = this.$root.team.players;
            let current = bestEleven(team);
            let best = null;
            for(let p of this.playerMarket.players.filter(p => this.$root.money.gte(p.getPrice()))){
                let next = bestEleven(team.concat([p]));
                let gain = next.attack.add(next.defense).sub(current.attack.add(current.defense));
                if(gain.gt(0) && (!best || gain.gt(best.gain))){
                    best = {player: p, gain, attack: next.attack.sub(current.attack), defense: next.defense.sub(current.defense)};
                }
            }
            return best;
        },
        sortedPlayers(){
            let sorted = Array.from(this.playerMarket.players).sort((p1, p2) => (p2.attack.add(p2.defense)).gte(p1.attack.add(p1.defense)) ? 1 : -1);
            if(this.bestSigning){
                sorted = [this.bestSigning.player].concat(sorted.filter(p => p !== this.bestSigning.player));
            }
            return sorted;
        }
    },
    template: `<div class="player-market">
    <player v-for="(p, i) in sortedPlayers" :player="p" :key="i" :signing="bestSigning && bestSigning.player === p ? bestSigning : null"></player>
    <p class="empty" v-if="sortedPlayers.length === 0">No Players left in the Market. New Players arrive with the next refresh.</p>
</div>`
});
