app.component("match", {
    props: ["match"],
    data(){
        return {
            matchTimeScaleLog: 0,
            windowOpen: true,
            goal: null,
            scoreFlash: false
        }
    },
    beforeUnmount(){
        clearTimeout(this.goalTimeout);
    },
    mounted(){
        this.matchTimeScaleLog = Math.log10(game.settings.match.speed);
    },
    watch: {
        match(){
            //the component is reused for the next match, so the end-of-match window must be reopened
            this.windowOpen = true;
            this.goal = null;
        },
        //a new match starts at 0, so only an increase is a goal
        "match.score1"(value, old){
            if(value > old){
                this.celebrateGoal(0);
            }
        },
        "match.score2"(value, old){
            if(value > old){
                this.celebrateGoal(1);
            }
        }
    },
    methods: {
        formatTime: functions.formatTime,
        formatNumber: functions.formatNumber,
        setTimeScale(){
            this.match.timeScale = this.timeScale;
            game.settings.match.speed = this.timeScale;
        },
        celebrateGoal(teamIndex){
            let team = teamIndex === 0 ? this.match.team1 : this.match.team2;
            let goals = this.match.gameEvents.filter(e => e.event === 0 && e.teamIndex === teamIndex);
            let last = goals[goals.length - 1];
            this.goal = {
                key: Date.now(),
                own: team === this.$root.team,
                team: team.name,
                scorer: last ? last.name + " " + last.minute + "'" : ""
            };
            this.scoreFlash = false;
            this.$nextTick(() => this.scoreFlash = true);
            clearTimeout(this.goalTimeout);
            this.goalTimeout = setTimeout(() => {
                this.goal = null;
                this.scoreFlash = false;
            }, 1600);
        },
        playNextMatch(){
            if(this.canPlayNextMatch){
                game.league.divisions[game.team.divisionRank].playNextMatch();
            }
        }
    },
    computed: {
        money(){
            return game.money;
        },
        stadiumUnlocked(){
            return Stadium.isUnlocked;
        },
        team1Events(){
            return this.match.gameEvents.filter(goal => goal.teamIndex === 0);
        },
        team2Events(){
            return this.match.gameEvents.filter(goal => goal.teamIndex === 1);
        },
        maxTimeScaleLog(){
            return Math.log10(game.moneyUpgrades.matchSpeed.apply() * game.tv.upgrades.matchSpeed.apply());
        },
        timeScale(){
            return Math.round(10 ** this.matchTimeScaleLog);
        },
        reward(){
            return this.match.getRewardMoney();
        },
        chances(){
            //only depends on the minute, not every frame
            this.match.score1; this.match.score2; Math.floor(this.match.time / 60);
            let c = this.match.getOutcomeChances();
            return this.match.team2 === game.team ? {win: c.lose, draw: c.draw, lose: c.win} : c;
        },
        team1Stats(){
            return this.match.team1.getCombinedStats();
        },
        team2Stats(){
            return this.match.team2.getCombinedStats();
        },
        state(){
            if(this.match.ended){
                return {name: "ended", text: "Full Time"};
            }
            return this.match.time === 0 ? {name: "waiting", text: "Kick-off"} : {name: "live", text: "Live"};
        },
        ownScore(){
            return this.match.team2 === this.$root.team ? this.match.score2 : this.match.score1;
        },
        otherScore(){
            return this.match.team2 === this.$root.team ? this.match.score1 : this.match.score2;
        },
        result(){
            if(this.ownScore > this.otherScore){
                return {name: "win", text: "Victory"};
            }
            return this.ownScore < this.otherScore ? {name: "lose", text: "Defeat"} : {name: "draw", text: "Draw"};
        },
        ownIndex(){
            return this.match.team2 === this.$root.team ? 1 : 0;
        },
        ownStats(){
            return this.ownIndex === 1 ? this.team2Stats : this.team1Stats;
        },
        otherStats(){
            return this.ownIndex === 1 ? this.team1Stats : this.team2Stats;
        },
        //your attack against their defence and the other way round, as shares of one bar
        duels(){
            let share = (a, b) => a.add(b).gt(0) ? a.div(a.add(b)).toNumber() * 100 : 50;
            return [
                {id: "att", icon: "attack", label: "Your Attack vs their Defense", own: this.ownStats.attack, other: this.otherStats.defense,
                    share: share(this.ownStats.attack, this.otherStats.defense)},
                {id: "def", icon: "defend", label: "Your Defense vs their Attack", own: this.ownStats.defense, other: this.otherStats.attack,
                    share: share(this.ownStats.defense, this.otherStats.attack)}
            ];
        },
        scorers(){
            let list = [[], []];
            for(let e of this.match.gameEvents){
                if(e.event === 0 || e.event === 1){
                    list[e.teamIndex].push(e);
                }
            }
            return list;
        },
        divisionName(){
            let division = this.$root.league.divisions[this.match.divisionRank];
            return division ? division.getName() : "";
        },
        restTime(){
            return this.$root.team.getTimeUntilRested();
        },
        canPlayNextMatch(){
            return (this.match.time === 0 || this.match.ended) && game.team.canPlayNextMatch();
        }
    },
    template: `<div class="match match-page">
<transition name="goal-pop">
    <div v-if="goal" :key="goal.key" class="goal-overlay" :class="{against: !goal.own}">
        <div class="burst"></div>
        <p class="goal-text">{{goal.own ? "GOAL!" : "Goal"}}</p>
        <p class="goal-scorer"><ui-icon name="ball"></ui-icon> {{goal.scorer || goal.team}}</p>
    </div>
</transition>
<section class="scoreboard" :class="state.name">
    <div class="sb-top">
        <span class="sb-state" :class="state.name"><i></i>{{state.text}}</span>
        <span class="sb-meta" v-if="divisionName"><ui-icon name="trophy"></ui-icon> {{divisionName}}</span>
    </div>
    <div class="sb-main">
        <div class="sb-team" :class="{own: ownIndex === 0}">
            <team-logo :logo="match.team1.logo"></team-logo>
            <p class="sb-name">{{match.team1.name}}</p>
            <ul class="sb-scorers">
                <li v-for="e in scorers[0]"><ui-icon :name="e.event === 0 ? 'ball' : 'redcard'"></ui-icon><span>{{e.name}} {{e.minute}}'</span></li>
            </ul>
        </div>
        <div class="sb-center">
            <p class="sb-score" :class="{flash: scoreFlash}"><span>{{match.score1}}</span><i>-</i><span>{{match.score2}}</span></p>
            <p class="sb-clock">{{formatTime(match.time)}}</p>
        </div>
        <div class="sb-team away" :class="{own: ownIndex === 1}">
            <team-logo :logo="match.team2.logo"></team-logo>
            <p class="sb-name">{{match.team2.name}}</p>
            <ul class="sb-scorers">
                <li v-for="e in scorers[1]"><ui-icon :name="e.event === 0 ? 'ball' : 'redcard'"></ui-icon><span>{{e.name}} {{e.minute}}'</span></li>
            </ul>
        </div>
    </div>
    <div class="sb-actions" v-if="match.time === 0 || match.ended">
        <button class="kick" :disabled="!canPlayNextMatch" @click="playNextMatch()">
            <ui-icon name="play"></ui-icon> {{match.ended ? "Play next Match" : "Kick off"}}</button>
        <p class="sb-hint" v-if="!canPlayNextMatch">Put at least 1 Player in your Team first</p>
        <p class="sb-hint" v-else-if="restTime > 0"><ui-icon name="timer"></ui-icon> Team fully rested in {{formatTime(Math.ceil(restTime))}}</p>
    </div>
</section>
<div class="match-body">
    <div class="pitch-card">
        <match-view :match="match"></match-view>
        <div class="speed-row">
            <ui-icon name="bolt"></ui-icon>
            <span class="speed-label">Match Speed</span>
            <input type="range" step="any" v-model="matchTimeScaleLog" @input="setTimeScale()" min="0" :max="maxTimeScaleLog" aria-label="Match Speed"/>
            <b class="speed-value">x{{timeScale.toFixed(0)}}</b>
        </div>
    </div>
    <aside class="match-side">
        <section class="m-panel odds">
            <h3>{{match.ended ? "Final Result" : "Win Chances"}} <small v-if="!match.ended">estimate for {{$root.team.name}}</small></h3>
            <div class="odds-bar">
                <i class="win" :style="{width: chances.win * 100 + '%'}"></i>
                <i class="draw" :style="{width: chances.draw * 100 + '%'}"></i>
                <i class="lose" :style="{width: chances.lose * 100 + '%'}"></i>
            </div>
            <div class="odds-legend">
                <span class="win"><i></i>Win <b>{{(chances.win * 100).toFixed(0)}}%</b></span>
                <span class="draw"><i></i>Draw <b>{{(chances.draw * 100).toFixed(0)}}%</b></span>
                <span class="lose"><i></i>Lose <b>{{(chances.lose * 100).toFixed(0)}}%</b></span>
            </div>
        </section>
        <section class="m-panel duels">
            <h3>Power</h3>
            <div class="duel" v-for="d in duels" :key="d.id" :class="[d.id, {ahead: d.share > 50}]">
                <p class="duel-head"><ui-icon :name="d.icon"></ui-icon><span>{{d.label}}</span></p>
                <div class="duel-bar"><i :style="{width: d.share + '%'}"></i></div>
                <p class="duel-nums"><b>{{formatNumber(d.own)}}</b><span>{{formatNumber(d.other)}}</span></p>
            </div>
        </section>
        <section class="m-panel feed">
            <h3>Events</h3>
            <p class="feed-empty" v-if="match.gameEvents.length === 0">Nothing has happened yet.</p>
            <ul v-else>
                <li v-for="(g, i) in match.gameEvents" :key="i" :class="['kind-' + g.event, g.teamIndex === ownIndex ? 'own' : 'other']">
                    <span class="feed-min">{{g.minute}}'</span>
                    <span class="feed-icon"><ui-icon :name="['ball', 'redcard', 'swap', 'settings'][g.event] || 'ball'"></ui-icon></span>
                    <span class="feed-text" v-if="g.event === 2"><span class="sub-in"><ui-icon name="subin"></ui-icon> {{g.name}}</span><span class="sub-out"><ui-icon name="subout"></ui-icon> {{g.nameOut}}</span></span>
                    <span class="feed-text" v-else>{{g.name}}</span>
                    <span class="feed-team">{{g.teamIndex === 1 ? match.team2.name : match.team1.name}}</span>
                </li>
            </ul>
        </section>
    </aside>
</div>
<transition name="window-grow">
    <window class="full-time" v-if="match.ended && windowOpen" @closed="windowOpen = false">
        <template v-slot:header><div class="icon-flex"><ui-icon name="match"></ui-icon><span>Full Time</span></div></template>
        <template v-slot:body>
            <p class="ft-result" :class="result.name">{{result.text}}</p>
            <div class="ft-score">
                <span class="ft-team"><team-logo :logo="match.team1.logo"></team-logo><b>{{match.team1.name}}</b></span>
                <span class="ft-nums">{{match.score1}} - {{match.score2}}</span>
                <span class="ft-team away"><b>{{match.team2.name}}</b><team-logo :logo="match.team2.logo"></team-logo></span>
            </div>
            <ul class="ft-money">
                <li><ui-icon name="match"></ui-icon><span>Match reward</span><b class="pos">+{{formatNumber(reward)}} $</b></li>
                <li v-if="stadiumUnlocked"><ui-icon name="stadium"></ui-icon><span>Stadium tickets</span><b class="pos">+{{formatNumber(match.stadiumReward)}} $</b></li>
                <li class="total"><ui-icon name="coins"></ui-icon><span>Balance</span><b>{{formatNumber(money)}} $</b></li>
            </ul>
            <button class="kick" :disabled="!canPlayNextMatch" @click="playNextMatch()"><ui-icon name="play"></ui-icon> Play next Match</button>
        </template>
    </window>
</transition>
</div>`
});