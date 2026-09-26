app.component("season-calendar", {
    computed: {
        division(){
            return this.$root.league.divisions[this.$root.team.divisionRank];
        },
        rounds(){
            let division = this.division;
            let team = this.$root.team;
            let history = this.$root.matchHistory;
            let rounds = [];
            for(let md = 0; md < division.matchDays; md++){
                let pair = division.getMatchDay(md).find(m => m[0] === team || m[1] === team);
                if(!pair){
                    continue;
                }
                let round = md + 1;
                let home = pair[0] === team;
                let played = history.find(m => m.matchDay === round);
                let state = played ? "played" : round === division.matchDay ? "next" : round < division.matchDay ? "played" : "upcoming";
                rounds.push({round, home, opponent: (home ? pair[1] : pair[0]).name, played, state});
            }
            return rounds;
        },
        matchRunning(){
            return this.$root.currentMatch && !this.$root.currentMatch.ended;
        }
    },
    methods: {
        resultLetter(m){
            return m.result === MATCH_WIN ? "W" : m.result === MATCH_LOSE ? "L" : "D";
        },
        score(m){
            return m.ownIndex === 0 ? m.score1 + " - " + m.score2 : m.score2 + " - " + m.score1;
        }
    },
    template: `<div class="season-calendar">
    <h3>Season Calendar</h3>
    <div class="rounds">
        <div class="round" v-for="r in rounds" :key="r.round" :class="r.state">
            <span class="round-number">{{r.round}}</span>
            <span class="venue" :title="r.home ? 'Home' : 'Away'">{{r.home ? "H" : "A"}}</span>
            <span class="opponent" :title="r.opponent">{{r.opponent}}</span>
            <span v-if="r.played" class="outcome"><span class="result" :class="resultLetter(r.played)">{{resultLetter(r.played)}}</span> {{score(r.played)}}</span>
            <span v-else-if="r.state === 'next'" class="outcome next-label">{{matchRunning ? "Live" : "Next"}}</span>
        </div>
    </div>
</div>`
});
