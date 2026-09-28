app.component("tab-academy", {
    mixins: [mixinHelp],
    data(){
        return {
            armed: null
        };
    },
    computed: {
        squadFull(){
            return this.$root.team.players.length + this.$root.training.players.length >= PlayerWages.maxSquad;
        },
        academy(){
            return this.$root.academy;
        },
        prospects(){
            //stats follow your Division, so read it for reactivity
            this.$root.team.divisionRank; this.$root.country;
            return this.academy.prospects.map(p => ({p, stats: p.getStats()}));
        },
        money(){
            return this.$root.money;
        },
        perSeason(){
            return this.academy.upgrades.scouting.apply().toNumber();
        },
        maxProspects(){
            return this.academy.getMaxProspects();
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        promote(p){
            this.academy.promote(p);
        },
        release(p){
            if(this.armed === p){
                this.academy.release(p);
                this.armed = null;
                return;
            }
            this.armed = p;
            clearTimeout(this.armedTimeout);
            this.armedTimeout = setTimeout(() => this.armed = null, 3000);
        },
        potentialShare(p){
            return Math.min(100, p.quality / p.getPotential() * 100);
        },
        seasonsLeft(p){
            return Math.max(0, 19 - p.age);
        }
    },
    beforeUnmount(){
        clearTimeout(this.armedTimeout);
    },
    template: `<div class="tab-academy">
<div class="page-head">
    <span class="page-icon"><ui-icon name="academy"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Youth Academy</p><h2>Academy <button class="help" @click="showHelpDialog()" aria-label="How the Academy works"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="academy"></ui-icon> Academy</div></template>
        <template v-slot:body>
            <p>Every Season end, <b>new prospects</b> (16 or 17 years old) join your Academy while there is room.</p>
            <p>Prospects grow towards their <b>potential</b> (the stars) every Season, and their stats always follow the Division you play in, so they never fall behind. Promote them whenever you like; at 19 they join the Team on their own.</p>
            <p>All your Players get a year older every Season end: they <b>improve until 23</b>, are at their best from 24 to 28 and <b>decline from 29</b>. Between 33 and 37 they <b>retire</b>, and their card warns you in their last Season.</p>
        </template>
    </window>
</transition>
<div class="academy-strip">
    <div class="s-kpi"><small>Prospects</small><b><ui-icon name="academy"></ui-icon> {{academy.prospects.length}} / {{maxProspects}}</b><small>places in the Academy</small></div>
    <div class="s-kpi"><small>Scouting</small><b><ui-icon name="star"></ui-icon> {{perSeason}}</b><small>new prospects per Season</small></div>
    <div class="s-kpi"><small>Coaching</small><b><ui-icon name="training"></ui-icon> {{formatNumber(academy.upgrades.coaching.apply().mul(100))}} %</b><small>closer to their potential per Season</small></div>
</div>
<section class="academy-panel">
    <h3 class="section-title">Prospects</h3>
    <p class="academy-empty" v-if="prospects.length === 0"><ui-icon name="academy"></ui-icon> New prospects arrive at the end of every Season.</p>
    <div class="prospect-grid" v-else>
        <div class="prospect" v-for="{p, stats} in prospects" :key="p.name + p.age">
            <div class="pr-head">
                <span class="p-pos" :class="'pos-' + p.position">{{p.position}}</span>
                <b class="pr-name" :title="p.name">{{p.name}}</b>
                <span class="pr-age">{{p.age}} y</span>
            </div>
            <div class="pr-stars" :title="p.stars + ' of 5 stars potential'"><ui-icon v-for="i in 5" :key="i" name="star" :class="{on: i <= p.stars}"></ui-icon></div>
            <div class="pr-stats">
                <p><small>ATT</small><b class="att">{{formatNumber(stats.attack)}}</b></p>
                <p><small>DEF</small><b class="def">{{formatNumber(stats.defense)}}</b></p>
                <p><small>ATT+DEF</small><b>{{formatNumber(stats.attack.add(stats.defense))}}</b></p>
            </div>
            <div class="pr-growth" :title="'Grows towards its potential every Season'">
                <span>Potential</span>
                <div class="bar"><i :style="{width: potentialShare(p) + '%'}"></i></div>
                <small>{{seasonsLeft(p) > 0 ? "Joins the Team in " + seasonsLeft(p) + (seasonsLeft(p) === 1 ? " Season" : " Seasons") : "Joins the Team this Season end"}}</small>
            </div>
            <div class="pr-actions">
                <button class="promote" @click="promote(p)" :disabled="squadFull" :title="squadFull ? 'Your squad has 25 Players' : ''"><ui-icon name="swap"></ui-icon> {{squadFull ? "Squad full" : "Promote"}}</button>
                <button class="negative" :class="{armed: armed === p}" @click="release(p)">{{armed === p ? "Tap again" : "Release"}}</button>
            </div>
        </div>
        <div class="prospect slot" v-for="i in Math.max(0, maxProspects - prospects.length)" :key="'slot' + i"><ui-icon name="academy"></ui-icon><small>Free place</small></div>
    </div>
</section>
<h3 class="section-title">Upgrades</h3>
<div class="upgrade-container">
    <upgrade :upgrade="academy.upgrades.scouting" icon="star">
        <template v-slot:title>Scouting Network</template>
        <template v-slot:description>More prospects join the Academy each Season.</template>
    </upgrade>
    <upgrade :upgrade="academy.upgrades.coaching" icon="training">
        <template v-slot:title>Youth Coaches</template>
        <template v-slot:description>Prospects get closer to their potential each Season.</template>
    </upgrade>
    <upgrade :upgrade="academy.upgrades.facilities" icon="stadium">
        <template v-slot:title>Academy Facilities</template>
        <template v-slot:description>More places for prospects.</template>
    </upgrade>
</div>
<section class="academy-panel" v-if="academy.retired.length">
    <h3 class="section-title">Retired Players</h3>
    <div class="retired-list">
        <div class="retired" v-for="(r, i) in academy.retired" :key="i">
            <span class="p-pos" :class="'pos-' + r.position">{{r.position}}</span>
            <b>{{r.name}}</b>
            <small>{{r.age}} y<template v-if="r.academy"> · Academy</template></small>
            <span class="retired-total">{{formatNumber(r.total)}} <small>ATT+DEF</small></span>
        </div>
    </div>
</section>
</div>`
});
