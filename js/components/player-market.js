app.component("player-market", {
    props: ["playerMarket"],
    computed: {
        sortedPlayers(){
            return Array.from(this.playerMarket.players).sort((p1, p2) => (p2.attack.add(p2.defense)).gte(p1.attack.add(p1.defense)) ? 1 : -1);
        }
    },
    template: `<div class="player-market">
    <player v-for="(p, i) in sortedPlayers" :player="p" :key="i"></player>
    <p class="empty" v-if="sortedPlayers.length === 0">No Players left in the Market. New Players arrive with the next refresh.</p>
</div>`
});