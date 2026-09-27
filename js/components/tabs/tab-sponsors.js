app.component("tab-sponsors", {
    mixins: [mixinHelp],
    computed: {
        sponsors(){
            return this.$root.sponsors;
        },
        money(){
            return this.$root.money;
        },
        //progress and money follow matches and your Division, read them for reactivity
        tick(){
            return [this.$root.matchHistory.length, this.$root.team.divisionRank, this.$root.cup.round, this.$root.money];
        },
        active(){
            this.tick;
            return this.sponsors.active.map(s => this.view(s));
        },
        offers(){
            this.tick;
            return this.sponsors.offers.map(s => this.view(s));
        },
        freeSlots(){
            return Math.max(0, this.sponsors.getSlots() - this.sponsors.active.length);
        },
        income(){
            this.tick;
            return this.sponsors.active.reduce((sum, s) => sum.add(s.getPerMatch()), new Decimal(0));
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        view(s){
            let p = s.getProgress();
            let label, share;
            if(p.place){
                label = "Now " + p.value + ". of " + this.$root.league.divisions[this.$root.team.divisionRank].teams.length;
                share = p.value <= p.max ? 100 : Math.max(8, 100 * p.max / p.value);
            }
            else if(p.cup){
                label = p.value === 0 ? "Round of 16" : CupRounds.names[p.value];
                share = Math.min(100, 100 * p.value / p.max);
            }
            else{
                label = Math.min(p.value, p.max) + " / " + p.max;
                share = Math.min(100, 100 * p.value / p.max);
            }
            return {
                s,
                goal: s.getText(),
                icon: s.getGoal().icon,
                difficulty: SponsorGoals.difficulty[s.level],
                bonus: s.getBonus(),
                perMatch: s.getPerMatch(),
                label,
                share,
                initials: s.name.split(" ").map(w => w[0]).join(""),
                badge: "linear-gradient(135deg, " + s.color + ", " + s.color2 + ")"
            };
        },
        sign(v){
            this.sponsors.sign(v.s);
        }
    },
    template: `<div class="tab-sponsors">
<div class="page-head">
    <span class="page-icon"><ui-icon name="sponsor"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Commercial</p><h2>Sponsors <button class="help" @click="showHelpDialog()" aria-label="How Sponsors work"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="sponsor"></ui-icon> Sponsors</div></template>
        <template v-slot:body>
            <p>Brands offer you a contract with a <b>goal</b> for this Season. You can have <b>2 sponsors</b> at a time.</p>
            <p>A sponsor pays a <b>fee after every match</b> and a big <b>bonus</b> the moment its goal is reached. Goals count from the day you sign, so signing early makes them easier.</p>
            <p>Contracts end with the Season, and new brands make offers for the next one. Both fees and bonuses follow the Division you play in.</p>
        </template>
    </window>
</transition>
<p class="staff-wages sponsor-income"><ui-icon name="sponsor"></ui-icon> <span>Sponsor fees</span> <b>+{{formatNumber(income)}} $</b> <small>per match</small></p>
<section class="sponsor-section">
    <h3 class="section-title">Your Sponsors</h3>
    <div class="sponsor-grid">
        <div class="sponsor-card signed" v-for="v in active" :key="v.s.name + v.s.goal" :class="{done: v.s.done}">
            <div class="sp-head">
                <span class="sp-badge" :style="{background: v.badge}">{{v.initials}}</span>
                <div class="sp-title"><b :title="v.s.name">{{v.s.name}}</b><small :class="'lvl-' + v.s.level">{{v.difficulty}}</small></div>
            </div>
            <p class="sp-goal"><ui-icon :name="v.icon"></ui-icon><span>{{v.goal}}</span></p>
            <div class="sp-progress">
                <div class="bar"><i :style="{width: v.share + '%'}"></i></div>
                <small>{{v.s.done ? "Goal reached, bonus paid" : v.label}}</small>
            </div>
            <ul class="sp-pay">
                <li><span>Per match</span><b>+{{formatNumber(v.perMatch)}} $</b></li>
                <li><span>Goal bonus</span><b :class="{paid: v.s.done}">{{v.s.done ? "Paid" : "+" + formatNumber(v.bonus) + " $"}}</b></li>
            </ul>
        </div>
        <div class="sponsor-card slot" v-for="i in freeSlots" :key="'slot' + i"><ui-icon name="sponsor"></ui-icon><small>Free slot: sign an offer below</small></div>
    </div>
</section>
<section class="sponsor-section">
    <h3 class="section-title">Offers</h3>
    <p class="st-note">New brands make offers at every Season end.</p>
    <p class="academy-empty" v-if="offers.length === 0"><ui-icon name="sponsor"></ui-icon> No more offers this Season.</p>
    <div class="sponsor-grid" v-else>
        <div class="sponsor-card" v-for="v in offers" :key="v.s.name + v.s.goal">
            <div class="sp-head">
                <span class="sp-badge" :style="{background: v.badge}">{{v.initials}}</span>
                <div class="sp-title"><b :title="v.s.name">{{v.s.name}}</b><small :class="'lvl-' + v.s.level">{{v.difficulty}}</small></div>
            </div>
            <p class="sp-goal"><ui-icon :name="v.icon"></ui-icon><span>{{v.goal}}</span></p>
            <ul class="sp-pay">
                <li><span>Per match</span><b>+{{formatNumber(v.perMatch)}} $</b></li>
                <li><span>Goal bonus</span><b>+{{formatNumber(v.bonus)}} $</b></li>
            </ul>
            <button class="st-hire" :disabled="freeSlots === 0" @click="sign(v)">{{freeSlots === 0 ? "No free slot" : "Sign"}}</button>
        </div>
    </div>
</section>
</div>`
});
