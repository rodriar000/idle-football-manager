app.component("club-records", {
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        records(){
            return this.$root.records;
        },
        topScorers(){
            return Object.entries(this.records.scorers).sort((a, b) => b[1] - a[1]).slice(0, 3);
        },
        goalsPerMatch(){
            return this.records.matches ? (this.records.goalsFor / this.records.matches).toFixed(2) : "0.00";
        }
    },
    template: `<div class="club-records">
    <div class="record">
        <h4>Biggest Win</h4>
        <p class="value" v-if="records.biggestWin">{{records.biggestWin.own}} - {{records.biggestWin.other}}</p>
        <p class="value" v-else>-</p>
        <p v-if="records.biggestWin">vs {{records.biggestWin.opponent}}<br/>{{records.biggestWin.division}}</p>
    </div>
    <div class="record">
        <h4>Longest Streaks</h4>
        <p class="value">{{records.bestWinStreak}} <small>Wins</small></p>
        <p class="value">{{records.bestUnbeatenStreak}} <small>Unbeaten</small></p>
        <p>Current: {{records.winStreak}} W · {{records.unbeatenStreak}} unbeaten</p>
    </div>
    <div class="record">
        <h4>Top Scorers</h4>
        <p v-for="(s, i) in topScorers" :class="{value: i === 0}">{{s[0]}}: {{s[1]}}</p>
        <p class="value" v-if="!topScorers.length">-</p>
    </div>
    <div class="record">
        <h4>Matches</h4>
        <p class="value">{{records.matches}}</p>
        <p>{{records.wins}} W · {{records.draws}} D · {{records.losses}} L</p>
        <p>Goals {{records.goalsFor}} - {{records.goalsAgainst}} ({{goalsPerMatch}} per Match)</p>
    </div>
    <div class="record">
        <h4>Seasons</h4>
        <p class="value">{{records.seasons}}</p>
        <p>{{records.promotions}} Promotions · {{records.titles}} Titles</p>
    </div>
    <div class="record">
        <h4>Match Money</h4>
        <p class="value">{{formatNumber(records.money)}} $</p>
        <p>Rewards and Stadium</p>
    </div>
</div>`
});
