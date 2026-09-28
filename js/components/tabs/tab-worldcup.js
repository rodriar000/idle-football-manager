app.component("tab-worldcup", {
    mixins: [mixinHelp],
    computed: {
        wc(){
            return this.$root.worldCup;
        },
        //games change after every match of yours, read them for reactivity
        tick(){
            return [this.wc.games.length, this.wc.step, this.wc.running, this.wc.entries.length, this.$root.records.seasons];
        },
        own(){
            this.tick;
            return this.wc.getOwnIndex();
        },
        ownNation(){
            this.$root.country;
            let n = WorldCup.getOwnNation();
            return {name: n.name, flag: WorldCup.flag(n)};
        },
        hasDraw(){
            this.tick;
            return this.wc.entries.length === 16;
        },
        nextSeason(){
            this.tick;
            return this.wc.getNextSeason();
        },
        seasonsLeft(){
            return Math.max(0, this.nextSeason - this.$root.records.seasons);
        },
        status(){
            this.tick;
            if(this.wc.running){
                return {name: "in", text: "Live · " + WorldCupStages.steps[this.wc.step]};
            }
            if(this.wc.note && this.wc.note.won){
                return {name: "won", text: "World Champions"};
            }
            return {name: "out", text: "Next after Season " + this.nextSeason};
        },
        groups(){
            this.tick;
            if(!this.hasDraw){
                return [];
            }
            return WorldCupStages.groups.map((name, g) => ({
                name,
                own: this.wc.getGroupOf(this.own) === g,
                rows: this.wc.getStandings(g).map((r, i) => Object.assign({}, r, {place: i + 1, gd: r.gf - r.ga, entry: this.entryView(r.idx)}))
            }));
        },
        //quarter-finals, semi-finals and the final
        rounds(){
            this.tick;
            if(!this.hasDraw){
                return [];
            }
            let rounds = [];
            for(let step = 3; step < WorldCupStages.count; step++){
                let played = this.wc.games.filter(m => m.step === step);
                let pairs = this.wc.getPairs(step);
                let count = 2 ** (5 - step);
                let ties = [];
                for(let i = 0; i < count; i++){
                    let m = played[i] || null;
                    let pair = m ? [m.a, m.b] : pairs[i] || [null, null];
                    ties.push({
                        key: step + "-" + i,
                        own: pair.includes(this.own),
                        sides: pair.map((idx, s) => ({
                            entry: idx === null ? null : this.entryView(idx),
                            score: m ? (s === 0 ? m.s1 : m.s2) : null,
                            pens: m && m.p1 !== null && m.p1 !== undefined ? (s === 0 ? m.p1 : m.p2) : null,
                            won: m ? m.winner === idx : false,
                            lost: m ? m.winner !== idx : false
                        }))
                    });
                }
                rounds.push({name: WorldCupStages.steps[step], ties, current: this.wc.running && step === this.wc.step, prize: this.wc.getPrize(step)});
            }
            return rounds;
        },
        //your next match while the World Cup is on
        next(){
            this.tick; this.$root.nextMatch;
            if(!this.wc.running){
                return null;
            }
            let pair = this.wc.getPairs(this.wc.step).find(p => p.includes(this.own));
            if(!pair){
                return null;
            }
            let other = pair[0] === this.own ? pair[1] : pair[0];
            let stage = this.wc.step < 3 ? "Group " + WorldCupStages.groups[this.wc.getGroupOf(this.own)] + " · Matchday " + (this.wc.step + 1) : WorldCupStages.steps[this.wc.step];
            return {stage, opponent: this.entryView(other), prize: this.wc.getPrize(this.wc.step)};
        },
        //your results in this World Cup
        ownGames(){
            this.tick;
            return this.wc.games.filter(m => m.a === this.own || m.b === this.own).map((m, i) => {
                let home = m.a === this.own;
                let mine = home ? m.s1 : m.s2, theirs = home ? m.s2 : m.s1;
                let result = m.winner === this.own ? "win" : m.winner === null ? "draw" : "lose";
                let pens = m.p1 !== null && m.p1 !== undefined ? " (" + (home ? m.p1 : m.p2) + "-" + (home ? m.p2 : m.p1) + " pens)" : "";
                return {key: i, stage: WorldCupStages.steps[m.step], opponent: this.entryView(home ? m.b : m.a), score: mine + " - " + theirs + pens, result};
            });
        },
        titles(){
            return this.$root.records.worldCups || 0;
        },
        history(){
            return this.wc.history;
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        entryView(idx){
            let nation = this.wc.getNation(idx);
            return {
                name: nation ? nation.name : "",
                own: idx === this.own,
                flag: nation ? WorldCup.flag(nation) : null
            };
        },
        goToMatch(){
            this.$root.tab = "tab-match";
        }
    },
    template: `<div class="tab-worldcup">
<div class="page-head">
    <span class="page-icon"><ui-icon name="worldcup"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Every 3 Seasons</p><h2>World Cup <button class="help" @click="showHelpDialog()" aria-label="How the World Cup works"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="cup-status" :class="status.name">{{status.text}}</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="worldcup"></ui-icon> World Cup</div></template>
        <template v-slot:body>
            <p>Every <b>3 Seasons</b>, in the summer before the new league starts, <b>16 nations</b> play the World Cup. Your Players are the squad of <b>{{ownNation.name}}</b>.</p>
            <p>There are <b>4 groups of 4</b>. A win gives 3 points and a draw 1. The <b>top 2</b> of each group reach the quarter-finals, and from there a draw goes to <b>penalties</b>.</p>
            <p>Every win pays a <b>prize</b>, and going far gives Manager XP. The league waits until the World Cup is over.</p>
        </template>
    </window>
</transition>
<section class="cup-next" v-if="next">
    <div class="cn-text">
        <small>Next: {{next.stage}}</small>
        <p class="cn-vs"><span class="wc-flag big" :style="{background: ownNation.flag}"></span><b>{{ownNation.name}}</b><span class="wc-vs">vs</span><span class="wc-flag big" :style="{background: next.opponent.flag}"></span><b>{{next.opponent.name}}</b></p>
        <p class="cn-when"><ui-icon name="play"></ui-icon> Ready to play in the Match tab</p>
    </div>
    <div class="cn-prize"><small>Win it for</small><b>+{{formatNumber(next.prize)}} $</b></div>
    <button class="kick" @click="goToMatch()"><ui-icon name="play"></ui-icon> Go to the Match</button>
</section>
<section class="cup-next" :class="wc.note.won ? 'done' : 'out'" v-else-if="wc.note && seasonsLeft === 3">
    <div class="cn-text">
        <small>World Cup after Season {{wc.note.season}}</small>
        <p class="cn-vs"><ui-icon name="worldcup"></ui-icon><b>{{wc.note.won ? ownNation.name + " are World Champions!" : "Out in the " + wc.note.reached}}</b></p>
        <p class="cn-when"><ui-icon name="calendar"></ui-icon> The next one is played after Season {{nextSeason}}</p>
    </div>
    <div class="cn-prize" v-if="wc.note.xp"><small>Manager XP</small><b>+{{wc.note.xp}}</b></div>
</section>
<section class="wc-hero" v-else>
    <span class="wc-flag huge" :style="{background: ownNation.flag}"></span>
    <div class="wc-hero-text">
        <small>Your nation</small>
        <b>{{ownNation.name}}</b>
        <p>The next World Cup is played after <b>Season {{nextSeason}}</b>, {{seasonsLeft === 1 ? "at the end of this Season" : "in " + seasonsLeft + " Seasons"}}. Your Players will be the national squad.</p>
    </div>
    <div class="wc-countdown"><b>{{seasonsLeft}}</b><small>{{seasonsLeft === 1 ? "Season" : "Seasons"}} to go</small></div>
</section>
<section class="wc-section" v-if="ownGames.length">
    <h3 class="section-title">Your matches</h3>
    <div class="wc-games">
        <div class="wc-game" v-for="g in ownGames" :key="g.key" :class="g.result">
            <small>{{g.stage}}</small>
            <span class="wc-flag" :style="{background: g.opponent.flag}"></span>
            <b :title="g.opponent.name">{{g.opponent.name}}</b>
            <span class="wc-score">{{g.score}}</span>
        </div>
    </div>
</section>
<section class="wc-section" v-if="groups.length">
    <h3 class="section-title">Groups</h3>
    <div class="wc-groups">
        <div class="wc-group" v-for="g in groups" :key="g.name" :class="{own: g.own}">
            <h4>Group {{g.name}}</h4>
            <table>
                <thead><tr><th></th><th class="wg-name">Nation</th><th>P</th><th>GD</th><th>Pts</th></tr></thead>
                <tbody>
                    <tr v-for="r in g.rows" :key="r.idx" :class="{mine: r.entry.own, through: r.place <= 2 && r.p === 3}">
                        <td class="wg-place">{{r.place}}</td>
                        <td class="wg-name"><span class="wc-flag" :style="{background: r.entry.flag}"></span><span :title="r.entry.name">{{r.entry.name}}</span></td>
                        <td>{{r.p}}</td>
                        <td>{{r.gd > 0 ? "+" + r.gd : r.gd}}</td>
                        <td class="wg-pts">{{r.pts}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>
<section class="wc-section" v-if="rounds.length">
    <h3 class="section-title">Knockout</h3>
    <div class="cup-bracket wc-bracket">
        <div class="cb-round" v-for="r in rounds" :key="r.name" :class="{current: r.current}">
            <h4><span>{{r.name}}</span><small>+{{formatNumber(r.prize)}} $</small></h4>
            <div class="cb-ties">
                <div class="cb-tie" v-for="t in r.ties" :key="t.key" :class="{own: t.own}">
                    <div class="cb-side" v-for="(s, i) in t.sides" :key="i" :class="{won: s.won, lost: s.lost, mine: s.entry && s.entry.own}">
                        <template v-if="s.entry">
                            <span class="wc-flag" :style="{background: s.entry.flag}"></span>
                            <span class="cb-name" :title="s.entry.name">{{s.entry.name}}</span>
                        </template>
                        <span class="cb-name tbd" v-else>To be decided</span>
                        <b class="cb-score" v-if="s.score !== null">{{s.score}}<small v-if="s.pens !== null"> ({{s.pens}})</small></b>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<section class="cup-honours">
    <h3 class="section-title">Honours</h3>
    <div class="cup-trophies"><ui-icon name="worldcup"></ui-icon><b>{{titles}}</b><span>{{titles === 1 ? "World Cup won" : "World Cups won"}}</span></div>
    <div class="retired-list" v-if="history.length">
        <div class="retired" v-for="(h, i) in history" :key="i">
            <b>After Season {{h.season}}</b>
            <small :class="{'cup-won': h.won}">{{h.won ? "Winner" : h.reached}}</small>
        </div>
    </div>
</section>
</div>`
});
