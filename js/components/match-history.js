app.component("match-history", {
    props: ["history"],
    methods: {
        formatNumber: functions.formatNumber,
        resultLetter(m){
            return m.result === MATCH_WIN ? "W" : m.result === MATCH_LOSE ? "L" : "D";
        },
        ownGoals(m){
            return m.goals.filter(g => g.teamIndex === m.ownIndex).map(g => g.name + " " + g.minute + "'").join(", ");
        }
    },
    computed: {
        matches(){
            return Array.from(this.history).reverse();
        }
    },
    template: `<div class="match-history">
    <h3>Season Matches</h3>
    <p v-if="matches.length === 0" class="empty">No matches played this season yet.</p>
    <div class="row" v-for="m in matches" :key="m.matchDay">
        <span class="matchday">{{m.matchDay}}</span>
        <span class="result" :class="resultLetter(m)">{{resultLetter(m)}}</span>
        <span class="teams"><span :class="{own: m.ownIndex === 0}">{{m.team1}}</span> {{m.score1}} - {{m.score2}} <span :class="{own: m.ownIndex === 1}">{{m.team2}}</span>
            <small v-if="ownGoals(m)">⚽ {{ownGoals(m)}}</small></span>
        <span class="reward-money">+{{formatNumber(m.reward)}} $</span>
    </div>
</div>`
});
