app.component("player-market", {
    props: ["playerMarket"],
    data(){
        return {
            sorts: [
                {id: "recommended", label: "Recommended", icon: "star"},
                {id: "total", label: "ATT+DEF", icon: "chart"},
                {id: "attack", label: "Attack", icon: "attack"},
                {id: "defense", label: "Defense", icon: "defend"},
                {id: "price", label: "Cheapest", icon: "coins"}
            ]
        };
    },
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
        sort(){
            return uiFx.marketSort;
        },
        view(){
            return uiFx.playerView;
        },
        sortedPlayers(){
            let total = p => p.getBaseAttack().add(p.getBaseDefense());
            let by = {
                recommended: (a, b) => total(b).cmp(total(a)),
                total: (a, b) => total(b).cmp(total(a)),
                attack: (a, b) => b.getBaseAttack().cmp(a.getBaseAttack()),
                defense: (a, b) => b.getBaseDefense().cmp(a.getBaseDefense()),
                price: (a, b) => a.getPrice().cmp(b.getPrice())
            }[this.sort];
            let sorted = Array.from(this.playerMarket.players).sort(by);
            if(this.sort === "recommended" && this.bestSigning){
                sorted = [this.bestSigning.player].concat(sorted.filter(p => p !== this.bestSigning.player));
            }
            return sorted;
        }
    },
    methods: {
        setSort(sort){
            uiFx.marketSort = sort;
        },
        setView(view){
            uiFx.setPlayerView(view);
        },
        keyOf(p){
            return uiFx.keyOf(p);
        }
    },
    template: `<div class="player-market">
    <div class="market-tools" v-if="playerMarket.players.length">
        <div class="chips" role="group" aria-label="Sort Players by">
            <button v-for="s in sorts" :key="s.id" :class="{selected: sort === s.id}" @click="setSort(s.id)"><ui-icon :name="s.icon"></ui-icon> {{s.label}}</button>
        </div>
        <card-guide></card-guide>
        <div class="seg" role="group" aria-label="Show Players as">
            <button :class="{selected: view === 'cards'}" @click="setView('cards')" aria-label="Cards" title="Cards"><ui-icon name="grid"></ui-icon></button>
            <button :class="{selected: view === 'list'}" @click="setView('list')" aria-label="List" title="List"><ui-icon name="list"></ui-icon></button>
        </div>
    </div>
    <div :class="view === 'list' ? 'player-list' : 'player-grid'" v-if="sortedPlayers.length">
        <player v-for="p in sortedPlayers" :player="p" :key="keyOf(p)" :layout="view === 'list' ? 'row' : 'card'" :signing="bestSigning && bestSigning.player === p ? bestSigning : null"></player>
    </div>
    <p class="empty" v-else>No Players left in the Market. New Players arrive with the next refresh.</p>
</div>`
});
