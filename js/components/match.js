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
        canPlayNextMatch(){
            return (this.match.time === 0 || this.match.ended) && game.team.canPlayNextMatch();
        }
    },
    template: `<div class="match">
<transition name="goal-pop">
    <div v-if="goal" :key="goal.key" class="goal-overlay" :class="{against: !goal.own}">
        <div class="burst"></div>
        <p class="goal-text">{{goal.own ? "GOAL!" : "Goal"}}</p>
        <p class="goal-scorer">⚽ {{goal.scorer || goal.team}}</p>
    </div>
</transition>
<div class="stats">
    <p class="match-state" :class="state.name">{{state.text}}</p>
    <p class="time">{{formatTime(match.time)}}<button :disabled="!canPlayNextMatch" v-if="match.time === 0" @click="playNextMatch()">Start</button></p>
    <div class="score">
        <div class="icon-flex">
            <team-logo :logo="match.team1.logo"></team-logo>
            <p>{{match.team1.name}}</p>
        </div> 
        <p class="numbers" :class="{flash: scoreFlash}">{{match.score1}} - {{match.score2}}</p> 
        <div class="icon-flex">
            <p>{{match.team2.name}}</p>
            <team-logo :logo="match.team2.logo"></team-logo>
        </div>
    </div>
    <p class="win-chance-label">{{match.ended ? "Final Result" : "Chances for " + $root.team.name + " (estimate)"}}</p>
    <div class="win-chance">
        <div class="win" :style="{width: chances.win * 100 + '%'}" :title="'Win ' + (chances.win * 100).toFixed(0) + '%'">Win {{(chances.win * 100).toFixed(0)}}%</div>
        <div class="draw" :style="{width: chances.draw * 100 + '%'}" :title="'Draw ' + (chances.draw * 100).toFixed(0) + '%'">Draw {{(chances.draw * 100).toFixed(0)}}%</div>
        <div class="lose" :style="{width: chances.lose * 100 + '%'}" :title="'Lose ' + (chances.lose * 100).toFixed(0) + '%'">Lose {{(chances.lose * 100).toFixed(0)}}%</div>
    </div>
    <div class="power">
        <p><span :class="{stronger: team1Stats.attack.gt(team2Stats.defense)}">ATT {{formatNumber(team1Stats.attack)}}</span>
            <span :class="{stronger: team1Stats.defense.gt(team2Stats.attack)}">DEF {{formatNumber(team1Stats.defense)}}</span></p>
        <p></p>
        <p><span :class="{stronger: team2Stats.attack.gt(team1Stats.defense)}">ATT {{formatNumber(team2Stats.attack)}}</span>
            <span :class="{stronger: team2Stats.defense.gt(team1Stats.attack)}">DEF {{formatNumber(team2Stats.defense)}}</span></p>
    </div>
</div>
<match-view :match="match"></match-view>
<div class="events">
    <div>
        <p v-for="g in team1Events">
            <template v-if="g.event === 2"><span class="sub-in">▲ {{g.name}}</span>&nbsp;<span class="sub-out">▼ {{g.nameOut}}</span>&nbsp;{{g.minute}}'</template>
            <template v-else>{{g.name}} {{g.minute}}'</template>
            <img alt="⚽" v-if="g.event === 0" src="images/icons/football.png"/>
            <img alt="🟥" v-else-if="g.event === 1" src="images/icons/red-card.png"/>
        </p>
    </div>
    <div>
    
    </div>
    <div>
        <p v-for="g in team2Events">
            <img alt="⚽" v-if="g.event === 0" src="images/icons/football.png"/>
            <img alt="🟥" v-else-if="g.event === 1" src="images/icons/red-card.png"/>
            <template v-if="g.event === 2">{{g.minute}}'&nbsp;<span class="sub-in">▲ {{g.name}}</span>&nbsp;<span class="sub-out">▼ {{g.nameOut}}</span></template>
            <template v-else>{{g.name}} {{g.minute}}'</template>
        </p>
    </div>
</div>
<transition name="window-grow">
    <window v-if="match.ended && windowOpen" @closed="windowOpen = false">
        <template v-slot:header><div class="icon-flex"><img src="images/icons/football.png"/><span>Match Ended</span></div></template>
        <template v-slot:body>
            <p class="result-banner" :class="result.name">{{result.text}}</p>
            <p class="final-score">{{match.team1.name}} {{match.score1}} - {{match.score2}} {{match.team2.name}}</p>
            <p>Your performance in this match rewarded you:</p>
            <p class="reward">+ {{formatNumber(reward)}} $</p>
            <div v-if="stadiumUnlocked">
                <p>Your Stadium earned you:</p>
                <p class="reward">+ {{formatNumber(match.stadiumReward)}} $</p>
            </div>
            <p>You now have {{formatNumber(money)}} $</p>
            <p>
                <button @click="playNextMatch()">→ Play next Match</button>
            </p>
        </template>
    </window>
</transition>
<div class="speed-controls">
    <label>Match Speed (x{{timeScale.toFixed(0)}})<br/><input type="range" step="any" v-model="matchTimeScaleLog" @input="setTimeScale()" min="0" :max="maxTimeScaleLog"/></label>
</div>
</div>`
});