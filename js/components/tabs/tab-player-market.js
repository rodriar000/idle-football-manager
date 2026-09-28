app.component("tab-player-market", {
    data(){
        return {
            playerMarket: game.playerMarket
        }
    },
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        money(){
            return game.money;
        },
        affordable(){
            return this.playerMarket.players.filter(p => p.canAfford()).length;
        },
        squad(){
            return this.$root.team.players.length + this.$root.training.players.length;
        },
        wages(){
            this.$root.team.players.length; this.$root.money;
            return PlayerWages.getBill();
        },
        refreshTime(){
            return 4 - game.league.divisions[game.team.divisionRank].matchDay % 4;
        }
    },
    template: `<div class="tab-player-market">
<div class="money transfer-window">
    <p class="window-title">Transfer Window</p>
    <p>You have {{formatNumber(money)}} $ · {{affordable}} of {{playerMarket.players.length}} Players affordable</p>
    <p class="squad-line" :class="{full: squad >= 25}">Squad {{squad}} / 25 · Player wages {{formatNumber(wages)}} $ per match</p>
    <p class="refresh">New Players in {{refreshTime}} Matchday(s)</p>
</div>
<player-market :playerMarket="playerMarket"></player-market>
</div>`
});