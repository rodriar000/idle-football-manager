app.component("team-management", {
    props: ["team"],
    computed: {
        totalAttack(){
            return this.team.getCombinedAttack();
        },
        totalDefense(){
            return this.team.getCombinedDefense();
        },
        activePlayers(){
            return this.team.getActivePlayers();
        },
        inactivePlayers(){
            return this.team.getInactivePlayers();
        },
        playerCount(){
            return this.team.players.length;
        },
        strategyNormal(){
            return Strategy.NORMAL
        },
        strategyOffensive(){
            return Strategy.OFFENSIVE
        },
        strategyDefensive(){
            return Strategy.DEFENSIVE
        },
        teamSettings(){
            return this.$root.settings.team;
        },
        restTime(){
            return this.team.getTimeUntilRested();
        },
        restPaused(){
            let match = this.$root.currentMatch;
            return match && !match.ended;
        },
        division(){
            return this.$root.league.divisions[this.team.divisionRank];
        },
        divisionLabel(){
            return this.division.getName() + " · Division " + (this.$root.league.divisions.length - this.division.rank);
        },
        position(){
            return this.division.getSortedTeams().indexOf(this.team) + 1;
        },
        teamCount(){
            return this.division.teams.length;
        },
        //last five results of this season, oldest first
        form(){
            return this.$root.matchHistory.slice(-5).map(m => m.result === MATCH_WIN ? "W" : m.result === MATCH_LOSE ? "L" : "D");
        },
        stadiumSeats(){
            this.$root.stadium.upgrades.capacity.level;
            return Stadium.isUnlocked ? this.$root.stadium.getCapacity() : null;
        },
        matchRunning(){
            let match = this.$root.currentMatch;
            return match && !match.ended;
        },
        //the match on the card: the live one, else the next one
        shownMatch(){
            return this.matchRunning ? this.$root.currentMatch : this.$root.nextMatch;
        },
        opponent(){
            let m = this.shownMatch;
            if(!m || !m.team1 || !m.team2){
                return null;
            }
            let home = m.team1.name === this.team.name;
            return {team: home ? m.team2 : m.team1, home};
        },
        canPlay(){
            return !this.matchRunning && this.team.canPlayNextMatch();
        },
        view(){
            return uiFx.playerView;
        },
        activeSorted(){
            return this.team.getActiveSortedPlayers();
        },
        benchSorted(){
            return this.team.getInactiveSortedPlayers();
        },
        formationKeys(){
            return Formations.keys();
        },
        formationInfo(){
            return Formations.get(this.team.formation);
        },
        lineup(){
            return this.team.getLineup();
        },
        //the pitch from the attack down to the keeper
        pitchRows(){
            return ["FWD", "MID", "DEF", "GK"].map(place => ({place, slots: this.lineup.filter(s => s.place === place)}));
        },
        misfits(){
            return this.lineup.filter(s => s.player && s.fit < 1).length;
        },
        //the positions the formation lacks a Player of, as "2 MID, 1 FWD"
        neededPlaces(){
            let count = {};
            for(let s of this.lineup){
                if(!s.player || s.fit < 1){
                    count[s.place] = (count[s.place] || 0) + 1;
                }
            }
            return Object.keys(count).map(k => count[k] + " " + k).join(", ");
        },
        openPlaces(){
            return this.lineup.filter(s => !s.player).length;
        }
    },
    methods: {
        pickBestEleven(){
            let settings = this.$root.settings.team;
            this.team.pickBestEleven(settings.autoSubstitute ? settings.substituteStamina : 0);
        },
        setStrategy(strategy){
            this.team.strategy = strategy;
            //a manual pick during the match is what auto strategy goes back to
            let match = this.$root.currentMatch;
            if(match && !match.ended && match.baseStrategy !== null){
                match.baseStrategy = strategy;
            }
        },
        setFormation(key){
            this.team.formation = key;
        },
        shortName(p){
            let parts = p.name.split(" ");
            return parts[parts.length - 1];
        },
        tiltText(value){
            return value === 1 ? "x1" : value > 1 ? "x" + value : "\u00f7" + (1 / value).toFixed(2);
        },
        setAggressivity(strategy){
            this.team.aggressivity = strategy;
        },
        strategySelected(strategy){
            return this.team.strategy === strategy;
        },
        aggressivitySelected(strategy){
            return this.team.aggressivity === strategy;
        },
        formatNumber: functions.formatNumber,
        formatTime: functions.formatTime,
        ordinal(n){
            let s = ["th", "st", "nd", "rd"], v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        },
        setView(view){
            uiFx.setPlayerView(view);
        },
        keyOf(p){
            return uiFx.keyOf(p);
        },
        playOrWatch(){
            if(this.canPlay){
                this.division.playNextMatch();
            }
            this.$root.tab = "tab-match";
        }
    },
    template: `<div class="team-management">
<section class="club-hero">
    <div class="hero-main">
        <team-logo class="hero-crest" :logo="team.logo"></team-logo>
        <div class="hero-text">
            <p class="eyebrow">Your Club</p>
            <h2 class="hero-name">{{team.name}}</h2>
            <div class="hero-meta">
                <span><ui-icon name="league"></ui-icon> {{ordinal(position)}} of {{teamCount}} · {{divisionLabel}}</span>
                <span v-if="stadiumSeats"><ui-icon name="stadium"></ui-icon> {{formatNumber(stadiumSeats)}} seats</span>
                <span class="form" v-if="form.length" :title="'Last ' + form.length + ' Matches'"><i v-for="(r, i) in form" :key="i" :class="r">{{r}}</i></span>
            </div>
        </div>
    </div>
    <div class="next-card" v-if="opponent">
        <p class="eyebrow">{{matchRunning ? "Live now" : "Next Match · Matchday " + (division.matchDay + 1)}}</p>
        <div class="vs"><team-logo :logo="opponent.team.logo"></team-logo><b>{{opponent.team.name}}</b><small>{{opponent.home ? "home" : "away"}}</small></div>
        <button class="primary" :disabled="!matchRunning && !canPlay" @click="playOrWatch()"><ui-icon name="play"></ui-icon> {{matchRunning ? "Watch live" : "Play next Match"}}</button>
    </div>
</section>
<div class="club-kpis">
    <div class="kpi att"><span class="eyebrow">Attack</span><b><ui-icon name="attack"></ui-icon>{{formatNumber(totalAttack)}}</b><small>Starting XI</small></div>
    <div class="kpi def"><span class="eyebrow">Defense</span><b><ui-icon name="defend"></ui-icon>{{formatNumber(totalDefense)}}</b><small>Starting XI</small></div>
    <div class="kpi syn"><span class="eyebrow">Synergy</span><b><ui-icon name="bolt"></ui-icon>{{formatNumber(team.getSynergy() * 100)}} %</b><small>Players who know each other</small></div>
    <div class="kpi fit ready-in" :class="{rested: activePlayers.length > 0 && restTime <= 0}" title="Time until every Player in the Team is at full Stamina">
        <span class="eyebrow">Fitness</span>
        <b v-if="activePlayers.length === 0"><ui-icon name="player"></ui-icon>No Team</b>
        <b v-else-if="restTime <= 0"><ui-icon name="check"></ui-icon>Rested</b>
        <b v-else><ui-icon :name="restPaused ? 'pause' : 'timer'"></ui-icon>{{formatTime(Math.ceil(restTime))}}</b>
        <small>{{activePlayers.length === 0 ? "Move Players to the Team" : restTime <= 0 ? "Everyone at full Stamina" : restPaused ? "Resting after the Match" : "Until everyone is rested"}}</small>
    </div>
</div>
<section class="club-panel formation-panel">
    <div class="lineup-pitch" aria-label="Your formation">
        <div class="lp-row" v-for="row in pitchRows" :key="row.place">
            <div class="lp-slot" v-for="(s, i) in row.slots" :key="i" :class="[s.player ? 'pos-' + s.player.position : 'open', {misfit: s.player && s.fit < 1}]"
                :title="s.player ? s.player.name + ' (' + s.player.position + ') in ' + s.place + ': ' + Math.round(s.fit * 100) + '%' : 'Open ' + s.place + ' place'">
                <span class="lp-dot">{{s.player ? s.player.position : s.place}}</span>
                <span class="lp-name">{{s.player ? shortName(s.player) : "Open"}}</span>
                <span class="lp-fit" v-if="s.player && s.fit < 1">{{Math.round(s.fit * 100)}}%</span>
            </div>
        </div>
    </div>
    <div class="formation-side">
        <h3>Formation <b class="formation-name">{{team.formation}}</b></h3>
        <div class="formation-chips" role="group" aria-label="Formation">
            <button v-for="key in formationKeys" :key="key" :class="{selected: team.formation === key}" @click="setFormation(key)">{{key}}</button>
        </div>
        <p class="formation-tilt"><span class="att"><ui-icon name="attack"></ui-icon> ATT {{tiltText(formationInfo.att)}}</span><span class="def"><ui-icon name="defend"></ui-icon> DEF {{tiltText(formationInfo.def)}}</span></p>
        <p class="formation-state" :class="{ok: misfits === 0 && openPlaces === 0}">
            <ui-icon :name="misfits === 0 && openPlaces === 0 ? 'check' : 'swap'"></ui-icon>
            <span v-if="misfits === 0 && openPlaces === 0">Every Player is in their own position</span>
            <span v-else><template v-if="misfits">{{misfits}} out of position</template><template v-if="misfits && openPlaces"> · </template><template v-if="openPlaces">{{openPlaces}} open</template>. Needs {{neededPlaces}}: try Best XI, or sign one in the Market.</span>
        </p>
        <p class="formation-help">Players give all their stats in their own position: 85% next to it, 70% far from it, 50% in or out of goal.</p>
    </div>
</section>
<div class="club-panels">
    <section class="club-panel tactics">
        <h3>Tactics</h3>
        <div class="tactic">
            <h4>Strategy</h4>
            <div class="seg-tiles">
                <button :class="{'selected': strategySelected(strategyNormal)}" @click="setStrategy(strategyNormal)"><ui-icon name="balance"></ui-icon><b>Balanced</b>ATT x1 · DEF x1</button>
                <button :class="{'selected': strategySelected(strategyOffensive)}" @click="setStrategy(strategyOffensive)"><ui-icon class="att" name="attack"></ui-icon><b>Offensive</b>ATT x1.3 · DEF &div;1.3</button>
                <button :class="{'selected': strategySelected(strategyDefensive)}" @click="setStrategy(strategyDefensive)"><ui-icon class="def" name="defend"></ui-icon><b>Defensive</b>DEF x1.3 · ATT &div;1.3</button>
            </div>
        </div>
        <div class="tactic">
            <h4>Aggressiveness</h4>
            <div class="seg-tiles">
                <button :class="{'selected': aggressivitySelected(strategyDefensive)}" @click="setAggressivity(strategyDefensive)"><ui-icon class="def" name="drop"></ui-icon><b>Calm</b>Stats &div;1.1 · Red Cards &div;2</button>
                <button :class="{'selected': aggressivitySelected(strategyNormal)}" @click="setAggressivity(strategyNormal)"><ui-icon name="balance"></ui-icon><b>Normal</b>Stats x1 · Red Cards x1</button>
                <button :class="{'selected': aggressivitySelected(strategyOffensive)}" @click="setAggressivity(strategyOffensive)"><ui-icon class="att" name="flame"></ui-icon><b>Hot</b>Stats x1.1 · Red Cards x2</button>
            </div>
        </div>
    </section>
    <section class="club-panel automation">
        <h3>Match Automation</h3>
        <div class="auto-list">
            <label><input type="checkbox" v-model="teamSettings.autoSubstitute"/> Auto Substitutions</label>
            <label :class="{disabled: !teamSettings.autoSubstitute}">Sub out below {{formatNumber(teamSettings.substituteStamina * 100)}} % Stamina
                <input type="range" min="0.05" max="0.95" step="0.05" :disabled="!teamSettings.autoSubstitute" v-model.number="teamSettings.substituteStamina"/></label>
            <label title="Late in the Match: Defensive when winning, Offensive when losing, your Strategy when level"><input type="checkbox" v-model="teamSettings.autoStrategy"/> Auto Strategy</label>
            <label :class="{disabled: !teamSettings.autoStrategy}">from minute {{teamSettings.autoStrategyMinute}}
                <input type="range" min="45" max="85" step="5" :disabled="!teamSettings.autoStrategy" v-model.number="teamSettings.autoStrategyMinute"/></label>
        </div>
    </section>
</div>
<section class="club-panel squad">
    <div class="squad-head">
        <h3>Starting XI</h3>
        <span class="count-chip">{{activePlayers.length}} / 11</span>
        <card-guide></card-guide>
        <div class="squad-tools">
            <div class="seg" role="group" aria-label="Show Players as">
                <button :class="{selected: view === 'cards'}" @click="setView('cards')" aria-label="Cards" title="Cards"><ui-icon name="grid"></ui-icon></button>
                <button :class="{selected: view === 'list'}" @click="setView('list')" aria-label="List" title="List"><ui-icon name="list"></ui-icon></button>
            </div>
            <button class="best-eleven" :disabled="playerCount === 0" @click="pickBestEleven()" title="Put the strongest rested Player of each position in your formation; protected players stay (B)"><ui-icon name="star"></ui-icon> Best XI</button>
        </div>
    </div>
    <div class="no-players" v-if="playerCount === 0">You don't have any Players yet. Buy some in the Market first.</div>
    <div :class="view === 'list' ? 'player-list' : 'player-grid'" v-else>
        <player v-for="p in activeSorted" :player="p" :key="keyOf(p)" :layout="view === 'list' ? 'row' : 'card'"></player>
        <template v-if="view === 'cards'"><div v-for="i in 11 - activePlayers.length" class="slot"><ui-icon name="player"></ui-icon></div></template>
    </div>
</section>
<section class="club-panel squad bench" v-if="benchSorted.length">
    <div class="squad-head">
        <h3>Bench</h3>
        <span class="count-chip">{{benchSorted.length}}</span>
        <p class="squad-note">Benched Players rest, and can be trained or sold.</p>
    </div>
    <div :class="view === 'list' ? 'player-list' : 'player-grid'">
        <player v-for="p in benchSorted" :player="p" :key="keyOf(p)" :layout="view === 'list' ? 'row' : 'card'"></player>
    </div>
</section>
</div>`
});
