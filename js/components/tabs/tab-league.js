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
        },
        //the promotion play-off: while you play it, and after the Season it was for
        playoff(){
            let p = this.$root.playoff;
            p.ties.length; p.round; p.season;
            if(!p.seeds.length || !(p.active || p.season === this.$root.records.seasons)){
                return null;
            }
            let own = p.getOwnIndex();
            let rounds = [0, 1].map(r => {
                let played = p.ties[r];
                let pairs = played ? played.map(t => [t.a, t.b]) : p.getPairs(r);
                if(pairs.length === 0){
                    pairs = [[null, null]];
                }
                let ties = pairs.map((pair, i) => {
                    let tie = played ? played[i] : null;
                    return {
                        key: r + "-" + i,
                        own: own >= 0 && pair.includes(own),
                        sides: pair.map((idx, s) => {
                            let team = idx === null ? null : p.getTeam(idx);
                            return {
                                name: idx === null ? "To be decided" : p.seeds[idx],
                                place: idx === null ? null : idx + 3,
                                logo: team ? team.logo : null,
                                score: tie ? (s === 0 ? tie.s1 : tie.s2) : null,
                                pens: tie && tie.p1 !== null && tie.p1 !== undefined ? (s === 0 ? tie.p1 : tie.p2) : null,
                                won: tie ? tie.winner === idx : false,
                                lost: tie ? tie.winner !== idx : false,
                                mine: idx !== null && idx === own
                            };
                        })
                    };
                });
                return {name: PlayoffRounds.short[r], ties};
            });
            let winner = p.getWinnerIndex();
            let note = "";
            if(winner >= 0){
                note = winner === own ? "You won the play-off: promoted!" : p.seeds[winner] + " won promotion";
            }
            else if(p.active){
                note = "Your " + PlayoffRounds.short[Math.min(p.round, 1)].toLowerCase() + " is the next match";
            }
            return {live: p.active, division: p.division, rounds, note, won: winner >= 0 && winner === own};
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
    <section class="league-playoff" v-if="playoff" :class="{live: playoff.live}">
        <div class="po-head">
            <h3 class="section-title"><ui-icon name="promo"></ui-icon> {{playoff.live ? "Promotion play-off" : "Last Season's play-off"}}</h3>
            <p>{{playoff.division}} · 3rd to 6th play for the last promotion place</p>
        </div>
        <div class="po-rounds">
            <div class="po-round" v-for="r in playoff.rounds" :key="r.name">
                <h4>{{r.name}}</h4>
                <div class="po-tie" v-for="t in r.ties" :key="t.key" :class="{own: t.own}">
                    <div class="po-side" v-for="(s, i) in t.sides" :key="i" :class="{won: s.won, lost: s.lost, mine: s.mine}">
                        <small class="po-seed" v-if="s.place">{{s.place}}.</small>
                        <team-logo v-if="s.logo" :logo="s.logo"></team-logo>
                        <span class="po-name" :title="s.name">{{s.name}}</span>
                        <b v-if="s.score !== null">{{s.score}}<small v-if="s.pens !== null"> ({{s.pens}})</small></b>
                    </div>
                </div>
            </div>
        </div>
        <p class="po-note" v-if="playoff.note"><ui-icon :name="playoff.won ? 'promo' : 'match'"></ui-icon> {{playoff.note}}</p>
    </section>
    <section class="league-table">
        <div class="standings-scroll"><division @team-selected="selectedTeam = $event" :division="division"></division></div>
        <p class="zones"><span class="zone up"><i></i> Promotion</span><span class="zone playoff" v-if="division.getPlayoffRanks()"><i></i> Play-off</span><span class="zone down" v-if="division.getRelegationRanks() > 0"><i></i> Relegation</span><span class="hint">Tap a Team to see its Players</span></p>
    </section>
    <season-calendar></season-calendar>
    <match-history :history="matchHistory"></match-history>
    <season-archive></season-archive>
</div>`
});