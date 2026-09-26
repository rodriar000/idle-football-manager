app.component("window-season", {
    emits: ["closed"],
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        season(){
            return this.$root.lastSeason;
        },
        outcomeText(){
            return {
                promoted: "Promoted to the next Division!",
                relegated: "Relegated to the previous Division.",
                champion: "Champion of the League!",
                stayed: "Staying in this Division."
            }[this.season.outcome];
        }
    },
    template: `<window class="window-season" @closed="$emit('closed')">
    <template v-slot:header><div class="icon-flex"><img src="images/icons/league.png"/><span>Season Summary</span></div></template>
    <template v-slot:body>
        <p class="season-division">{{season.divisionName}} (Division {{season.divisionNumber}})</p>
        <p class="position">{{season.position}}. of {{season.teams}}</p>
        <p class="outcome" :class="season.outcome">{{outcomeText}}</p>
        <div class="stats">
            <p><b>{{season.points}}</b> Points</p>
            <p><b>{{season.stats.win}}</b> W · <b>{{season.stats.draw}}</b> D · <b>{{season.stats.lose}}</b> L</p>
            <p>Goals <b>{{season.stats.goalsShot}} - {{season.stats.goalsOpponent}}</b></p>
            <p>Match Rewards <b>+{{formatNumber(season.money)}} $</b></p>
        </div>
        <div v-if="season.topScorers.length" class="scorers">
            <h4>Top Scorers</h4>
            <p v-for="s in season.topScorers">⚽ {{s.name}}: {{s.goals}}</p>
        </div>
    </template>
</window>`
});
