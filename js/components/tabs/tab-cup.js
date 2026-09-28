app.component("tab-cup", {
    mixins: [mixinHelp],
    computed: {
        cup(){
            return this.$root.cup;
        },
        own(){
            return this.cup.getOwnIndex();
        },
        rounds(){
            //ties change after every round, read them for reactivity
            this.cup.ties.length; this.cup.round; this.cup.entries;
            let rounds = [];
            for(let r = 0; r < CupRounds.count; r++){
                let played = this.cup.ties[r];
                let pairs = this.cup.getPairs(r);
                let count = 2 ** (CupRounds.count - 1 - r);
                let ties = [];
                for(let i = 0; i < count; i++){
                    let tie = played ? played[i] : null;
                    let pair = tie ? [tie.a, tie.b] : pairs[i] || [null, null];
                    ties.push({
                        key: r + "-" + i,
                        own: pair.includes(this.own),
                        sides: pair.map((idx, s) => ({
                            entry: idx === null ? null : this.entryView(idx),
                            score: tie ? (s === 0 ? tie.s1 : tie.s2) : null,
                            pens: tie && tie.p1 !== null && tie.p1 !== undefined ? (s === 0 ? tie.p1 : tie.p2) : null,
                            won: tie ? tie.winner === idx : false,
                            lost: tie ? tie.winner !== idx : false
                        }))
                    });
                }
                rounds.push({name: CupRounds.names[r], short: CupRounds.short[r], ties, current: r === this.cup.round, prize: this.cup.getPrize(r)});
            }
            return rounds;
        },
        status(){
            this.cup.ties.length; this.cup.round; this.cup.entries;
            if(!this.cup.isQualified()){
                return {name: "out", text: "Not qualified"};
            }
            if(this.cup.hasWon()){
                return {name: "won", text: "Champion"};
            }
            if(this.cup.isOut()){
                return {name: "out", text: "Out · " + this.cup.getReached()};
            }
            return {name: "in", text: "Still in · " + CupRounds.names[Math.min(this.cup.round, CupRounds.count - 1)]};
        },
        //your next tie, while you are still in the cup
        next(){
            this.cup.ties.length; this.cup.round; this.$root.nextMatch;
            if(this.cup.isOver() || this.cup.isOut()){
                return null;
            }
            let pair = this.cup.getPairs(this.cup.round).find(p => p.includes(this.own));
            if(!pair){
                return null;
            }
            let other = pair[0] === this.own ? pair[1] : pair[0];
            let division = this.$root.league.divisions[this.$root.team.divisionRank];
            let after = this.cup.getSchedule()[this.cup.round];
            let left = Math.max(0, after - (division.matchDay - 1));
            return {
                round: CupRounds.names[this.cup.round],
                opponent: this.entryView(other),
                ready: this.cup.leagueMatch !== null,
                left,
                prize: this.cup.getPrize(this.cup.round)
            };
        },
        //who knocked you out
        knockedOutBy(){
            this.cup.ties.length;
            for(let round of this.cup.ties){
                let t = round.find(t => t && (t.a === this.own || t.b === this.own) && t.winner !== this.own);
                if(t){
                    return this.entryView(t.winner);
                }
            }
            return null;
        },
        cupsWon(){
            return this.$root.records.cups || 0;
        },
        history(){
            return this.cup.history;
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        entryView(idx){
            let team = this.cup.getTeam(idx);
            let entry = this.cup.entries[idx] || {};
            let nation = entry.seed !== undefined ? CupNations[entry.nation % CupNations.length] : null;
            return {
                name: team ? team.name : entry.name,
                logo: team ? team.logo : null,
                own: idx === this.own,
                nation,
                flag: nation ? "linear-gradient(to bottom, " + nation.colors[0] + " 0 33%, " + nation.colors[1] + " 33% 67%, " + nation.colors[2] + " 67%)" : null
            };
        },
        goToMatch(){
            this.$root.tab = "tab-match";
        }
    },
    template: `<div class="tab-cup">
<div class="page-head">
    <span class="page-icon"><ui-icon name="cup"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Season {{cup.season}}</p><h2>Continental Cup <button class="help" @click="showHelpDialog()" aria-label="How the Cup works"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="cup-status" :class="status.name">{{status.text}}</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="cup"></ui-icon> Continental Cup</div></template>
        <template v-slot:body>
            <p>Every Season, <b>16 clubs</b> play a knockout Cup alongside the league: 8 from your Division and 8 guest clubs from abroad at the same level.</p>
            <p>You only play it if you finished the Season before in the <b>top 3</b>.</p>
            <p>The rounds are played <b>between matchdays</b>: when a round is due, your Cup match comes before your next league match. A draw goes to <b>penalties</b>.</p>
            <p>Every round you win pays a <b>prize</b>, and winning the Final gives extra Manager XP at the Season end. A new draw is made every Season.</p>
        </template>
    </window>
</transition>
<section class="cup-next out" v-if="!cup.isQualified()">
    <div class="cn-text">
        <small>Season {{cup.season}}</small>
        <p class="cn-vs"><ui-icon name="cup"></ui-icon><b>You didn't qualify this Season</b></p>
        <p class="cn-when"><ui-icon name="league"></ui-icon> Finish in the top 3 of your league to play it next Season</p>
    </div>
</section>
<section class="cup-next" v-else-if="next">
    <div class="cn-text">
        <small>Next: {{next.round}}</small>
        <p class="cn-vs"><team-logo v-if="next.opponent.logo" :logo="next.opponent.logo"></team-logo><b>{{next.opponent.name}}</b><span class="cup-flag" v-if="next.opponent.nation" :style="{background: next.opponent.flag}" :title="next.opponent.nation.name"></span></p>
        <p class="cn-when" v-if="next.ready"><ui-icon name="play"></ui-icon> Ready to play in the Match tab</p>
        <p class="cn-when" v-else><ui-icon name="calendar"></ui-icon> After {{next.left}} more league {{next.left === 1 ? "match" : "matches"}}</p>
    </div>
    <div class="cn-prize"><small>Win it for</small><b>+{{formatNumber(next.prize)}} $</b></div>
    <button class="kick" v-if="next.ready" @click="goToMatch()"><ui-icon name="play"></ui-icon> Go to the Match</button>
</section>
<section class="cup-next done" v-else-if="cup.hasWon()">
    <div class="cn-text"><small>Season {{cup.season}}</small><p class="cn-vs"><ui-icon name="cup"></ui-icon><b>You won the Continental Cup!</b></p></div>
</section>
<section class="cup-next out" v-else-if="knockedOutBy">
    <div class="cn-text"><small>Knocked out in the {{cup.getReached()}}</small>
        <p class="cn-vs"><team-logo v-if="knockedOutBy.logo" :logo="knockedOutBy.logo"></team-logo><b>by {{knockedOutBy.name}}</b></p>
        <p class="cn-when"><ui-icon name="calendar"></ui-icon> A new draw is made at the Season end</p>
    </div>
</section>
<div class="cup-bracket">
    <div class="cb-round" v-for="r in rounds" :key="r.name" :class="{current: r.current}">
        <h4><span>{{r.name}}</span><small>+{{formatNumber(r.prize)}} $</small></h4>
        <div class="cb-ties">
            <div class="cb-tie" v-for="t in r.ties" :key="t.key" :class="{own: t.own}">
                <div class="cb-side" v-for="(s, i) in t.sides" :key="i" :class="{won: s.won, lost: s.lost, mine: s.entry && s.entry.own}">
                    <template v-if="s.entry">
                        <team-logo v-if="s.entry.logo" :logo="s.entry.logo"></team-logo>
                        <span class="cb-name" :title="s.entry.name">{{s.entry.name}}</span>
                        <span class="cup-flag" v-if="s.entry.nation" :style="{background: s.entry.flag}" :title="s.entry.nation.name"></span>
                    </template>
                    <span class="cb-name tbd" v-else>To be decided</span>
                    <b class="cb-score" v-if="s.score !== null">{{s.score}}<small v-if="s.pens !== null"> ({{s.pens}})</small></b>
                </div>
            </div>
        </div>
    </div>
</div>
<section class="cup-honours">
    <h3 class="section-title">Honours</h3>
    <div class="cup-trophies"><ui-icon name="cup"></ui-icon><b>{{cupsWon}}</b><span>{{cupsWon === 1 ? "Continental Cup won" : "Continental Cups won"}}</span></div>
    <div class="retired-list" v-if="history.length">
        <div class="retired" v-for="(h, i) in history" :key="i">
            <b>Season {{h.season}}</b>
            <small :class="{'cup-won': h.won}">{{h.won ? "Winner" : h.reached}}</small>
        </div>
    </div>
</section>
</div>`
});
