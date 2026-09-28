app.component("tab-league", {
    data(){
        return{
            selectedTeam: null
        }
    },
    computed: {
        division(){
            return game.league.divisions[game.team.divisionRank];
        },
        nextMatch(){
            return game.nextMatch;
        },
        canPlayMatch(){
            return game.team.canPlayNextMatch() && !this.matchRunning;
        },
        matchRunning(){
            return game.currentMatch && !game.currentMatch.ended;
        },
        matchHistory(){
            return this.$root.matchHistory;
        },
        restTime(){
            return this.$root.team.getTimeUntilRested();
        },
        seasonShare(){
            return Math.min(100, this.division.matchDay / this.division.matchDays * 100);
        },
        divisionNumber(){
            return game.league.divisions.length - this.division.rank;
        }
    },
    methods: {
        formatTime: functions.formatTime,
        watch(){
            game.tab = "tab-match";
        },
        playNextMatch(){
            this.division.playNextMatch();
            game.tab = "tab-match";
        }
    },
    template: `<div class="tab-league">
    <transition name="window-grow">
        <window-team v-if="selectedTeam" :team="selectedTeam" @closed="selectedTeam = null"></window-team>
    </transition>
    <div class="league-hero">
        <div class="league-title">
            <span class="page-icon"><ui-icon name="trophy"></ui-icon></span>
            <div>
                <p class="eyebrow">Division {{divisionNumber}}</p>
                <h2>{{division.getName()}}</h2>
                <div class="season-progress" :title="'Matchday ' + division.matchDay + ' of ' + division.matchDays">
                    <span>Matchday <b>{{division.matchDay}}</b> / {{division.matchDays}}</span>
                    <div class="bar"><i :style="{width: seasonShare + '%'}"></i></div>
                </div>
            </div>
        </div>
        <div class="next-card league-next">
            <p class="eyebrow">{{matchRunning ? "Live now" : "Next Match"}}</p>
            <div class="vs" v-if="nextMatch && nextMatch.team1"><b>{{nextMatch.getTeamName(0)}}</b><small>vs</small><b>{{nextMatch.getTeamName(1)}}</b></div>
            <button class="primary" v-if="canPlayMatch" @click="playNextMatch()"><ui-icon name="play"></ui-icon> Play next Match</button>
            <button class="primary" v-else-if="matchRunning" @click="watch()"><ui-icon name="play"></ui-icon> Watch live</button>
            <button disabled v-else>Put at least 1 Player in your Team first</button>
            <p class="ready-in" v-if="canPlayMatch" :class="{rested: restTime <= 0}"><ui-icon :name="restTime <= 0 ? 'check' : 'timer'"></ui-icon> {{restTime <= 0 ? "Team rested" : "Team ready in " + formatTime(Math.ceil(restTime))}}</p>
        </div>
    </div>
    <section class="league-table">
        <div class="standings-scroll"><division @team-selected="selectedTeam = $event" :division="division"></division></div>
        <p class="zones"><span class="zone up"><i></i> Promotion</span><span class="zone down" v-if="division.getRelegationRanks() > 0"><i></i> Relegation</span><span class="hint">Tap a Team to see its Players</span></p>
    </section>
    <season-calendar></season-calendar>
    <match-history :history="matchHistory"></match-history>
    <season-archive></season-archive>
</div>`
});