app.component("tab-manager", {
    mixins: [mixinHelp],
    data(){
        return {
            confirmReset: false
        };
    },
    computed: {
        career(){
            return this.$root.career;
        },
        xpNeeded(){
            return ManagerCareer.xpToNext(this.career.level);
        },
        xpShare(){
            return Math.min(100, this.career.xp / this.xpNeeded * 100);
        },
        freePoints(){
            return this.career.getFreePoints();
        },
        branches(){
            return CareerPerks.branches.map(b => ({
                ...b,
                spent: this.career.getSpentPoints(b.id),
                perks: CareerPerks.list.filter(p => p.branch === b.id)
            }));
        },
        spentTotal(){
            return this.career.getSpentPoints();
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        effect(perk, rank){
            let v = perk.step * rank;
            if(perk.format === "years"){
                return "+" + v + (v === 1 ? " year" : " years");
            }
            let pct = Math.round(v * 100);
            return (pct >= 0 ? "+" : "") + pct + (perk.format === "points" ? " points" : " %");
        },
        learn(perk){
            this.career.learn(perk);
        },
        reset(){
            if(this.confirmReset){
                this.career.reset();
                this.confirmReset = false;
                return;
            }
            this.confirmReset = true;
            clearTimeout(this.resetTimeout);
            this.resetTimeout = setTimeout(() => this.confirmReset = false, 3000);
        }
    },
    beforeUnmount(){
        clearTimeout(this.resetTimeout);
    },
    template: `<div class="tab-manager">
<div class="page-head manager-head">
    <span class="page-icon"><ui-icon name="manager"></ui-icon></span>
    <div class="page-title">
        <p class="eyebrow">Manager Career</p>
        <h2>Level {{career.level}} <button class="help" @click="showHelpDialog()" aria-label="How the Manager Career works"><ui-icon name="help"></ui-icon></button></h2>
        <div class="season-progress xp-progress" :title="career.xp + ' of ' + xpNeeded + ' XP'">
            <span><b>{{formatNumber(career.xp)}}</b> / {{formatNumber(xpNeeded)}} XP to Level {{career.level + 1}}</span>
            <div class="bar"><i :style="{width: xpShare + '%'}"></i></div>
        </div>
    </div>
    <div class="points-chip" :class="{has: freePoints > 0}"><b>{{freePoints}}</b><small>{{freePoints === 1 ? "Skill Point" : "Skill Points"}}</small></div>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="manager"></ui-icon> Manager Career</div></template>
        <template v-slot:body>
            <p>Every Match of your Team gives you <b>experience</b>: 30 for a win, 15 for a draw, 5 for a loss and 2 for each goal. Seasons give more: up to 250 for a title.</p>
            <p>Each new level gives you a <b>skill point</b>. Spend it on perks that stay forever. The deeper perks of a branch open after spending points in that branch.</p>
            <p>You can take all your points back at any time and spend them again.</p>
        </template>
    </window>
</transition>
<div class="perk-branches">
    <section class="perk-branch" v-for="b in branches" :key="b.id">
        <h3><ui-icon :name="b.icon"></ui-icon> {{b.name}} <small>{{b.spent}} {{b.spent === 1 ? "point" : "points"}}</small></h3>
        <div class="perk" v-for="perk in b.perks" :key="perk.id" :class="{locked: !career.isOpen(perk), maxed: career.rank(perk.id) >= perk.max, owned: career.rank(perk.id) > 0}">
            <span class="perk-icon"><ui-icon :name="career.isOpen(perk) ? perk.icon : 'lock'"></ui-icon></span>
            <div class="perk-text">
                <b>{{perk.name}}</b>
                <small>{{perk.text}}
                    <template v-if="career.rank(perk.id) > 0">{{effect(perk, career.rank(perk.id))}}</template>
                    <template v-if="career.rank(perk.id) < perk.max"> → <span class="next">{{effect(perk, career.rank(perk.id) + 1)}}</span></template>
                </small>
                <small class="perk-lock" v-if="!career.isOpen(perk)">Spend {{perk.tier - b.spent}} more {{perk.tier - b.spent === 1 ? "point" : "points"}} in {{b.name}}</small>
                <span class="perk-pips" :aria-label="career.rank(perk.id) + ' of ' + perk.max"><i v-for="i in perk.max" :key="i" :class="{on: i <= career.rank(perk.id)}"></i></span>
            </div>
            <button class="perk-learn" :disabled="!career.canLearn(perk)" @click="learn(perk)" :aria-label="'Learn ' + perk.name">{{career.rank(perk.id) >= perk.max ? "Max" : "+1"}}</button>
        </div>
    </section>
</div>
<div class="manager-foot">
    <p><ui-icon name="chart"></ui-icon> {{formatNumber(career.totalXp)}} XP in your whole career</p>
    <button class="negative" :disabled="spentTotal === 0" :class="{armed: confirmReset}" @click="reset()">{{confirmReset ? "Tap again to take all points back" : "Take points back"}}</button>
</div>
</div>`
});
