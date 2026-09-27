app.component("tab-transfers", {
    mixins: [mixinHelp],
    data(){
        return {
            walked: ""
        };
    },
    computed: {
        world(){
            return this.$root.world;
        },
        money(){
            return this.$root.money;
        },
        offers(){
            this.$root.team.players.length;
            return this.world.offers.map(o => {
                let club = o.getClub();
                let p = o.player;
                let value = TransferOffer.getValue(p);
                return {
                    o,
                    club,
                    clubDivision: club ? this.$root.league.divisions.length - club.divisionRank : null,
                    p,
                    total: p.attack.add(p.defense),
                    value,
                    ratio: o.amount.div(value.max(1)).toNumber()
                };
            });
        },
        //clubs of your Division: strength this Season, and how it changed at the last Season end
        rivals(){
            this.$root.team.divisionRank; this.world.moves;
            let division = this.$root.league.divisions[this.$root.team.divisionRank];
            return division.getSortedTeams().filter(t => t !== this.$root.team).map(t => ({
                t,
                boost: Math.round(((t.boost || 1) - 1) * 100),
                move: Math.round((this.world.moves[t.name] || 0) * 100),
                power: t.getCombinedStats().attack.add(t.getCombinedStats().defense)
            }));
        },
        news(){
            return this.world.news;
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        accept(v){
            this.world.accept(v.o);
        },
        reject(v){
            this.world.reject(v.o);
        },
        counter(v, raise){
            let club = v.o.club;
            if(this.world.counter(v.o, raise) === "walked"){
                this.walked = club + " walked away from the talks.";
                clearTimeout(this.walkedTimeout);
                this.walkedTimeout = setTimeout(() => this.walked = "", 4000);
            }
        },
        signed(n){
            return (n > 0 ? "+" : "") + n + " %";
        }
    },
    beforeUnmount(){
        clearTimeout(this.walkedTimeout);
    },
    template: `<div class="tab-transfers">
<div class="page-head">
    <span class="page-icon"><ui-icon name="transfer"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Living World</p><h2>Transfers <button class="help" @click="showHelpDialog()" aria-label="How Transfers work"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="transfer"></ui-icon> Transfers</div></template>
        <template v-slot:body>
            <p>Rival clubs <b>bid for your Players</b> after your league matches. A bid lasts <b>3 matches</b>. Locked Players get no bids.</p>
            <p>Accept it, reject it, or <b>ask for more</b>: a club pays up to a secret limit. Ask above it and they may improve once, or walk away.</p>
            <p>The world moves too: clubs <b>sign Players from the Market</b>, and at every Season end each rival club invests or loses players, so it gets <b>stronger or weaker</b>.</p>
        </template>
    </window>
</transition>
<section class="transfer-section">
    <h3 class="section-title">Bids for your Players</h3>
    <p class="transfer-flash" v-if="walked"><ui-icon name="close"></ui-icon> {{walked}}</p>
    <p class="academy-empty" v-if="offers.length === 0"><ui-icon name="transfer"></ui-icon> No bids right now. Clubs make them after your league matches.</p>
    <div class="offer-list" v-else>
        <div class="offer-card" v-for="v in offers" :key="v.o.club + v.p.name">
            <div class="of-club">
                <team-logo v-if="v.club" :logo="v.club.logo"></team-logo>
                <div><b :title="v.o.club">{{v.o.club}}</b><small v-if="v.clubDivision">Division {{v.clubDivision}}</small></div>
                <span class="of-left" :class="{last: v.o.left === 1}"><ui-icon name="clock"></ui-icon> {{v.o.left === 1 ? "Last match" : v.o.left + " matches"}}</span>
            </div>
            <div class="of-player">
                <span class="p-pos" :class="'pos-' + v.p.position">{{v.p.position}}</span>
                <b :title="v.p.name">{{v.p.name}}</b>
                <small>{{v.p.age}} y · {{formatNumber(v.total)}} ATT+DEF<template v-if="v.p.active"> · Starter</template></small>
            </div>
            <div class="of-money">
                <div><small>Their bid</small><b>{{formatNumber(v.o.amount)}} $</b></div>
                <div><small>Market value</small><span>{{formatNumber(v.value)}} $ <em :class="{good: v.ratio >= 1}">×{{v.ratio.toFixed(2)}}</em></span></div>
            </div>
            <p class="of-message" v-if="v.o.message">{{v.o.message}}</p>
            <div class="of-actions">
                <button class="of-accept" @click="accept(v)"><ui-icon name="check"></ui-icon> Accept</button>
                <button class="negative" @click="reject(v)">Reject</button>
            </div>
            <div class="of-counter" v-if="v.o.counters < 2">
                <small>Ask for more</small>
                <button @click="counter(v, 0.1)">+10 %</button>
                <button @click="counter(v, 0.25)">+25 %</button>
                <button @click="counter(v, 0.5)">+50 %</button>
            </div>
        </div>
    </div>
</section>
<div class="transfer-cols">
    <section class="transfer-section">
        <h3 class="section-title">Rival Clubs</h3>
        <div class="rival-list">
            <div class="rival" v-for="r in rivals" :key="r.t.name">
                <team-logo :logo="r.t.logo"></team-logo>
                <b :title="r.t.name">{{r.t.name}}</b>
                <span class="rv-move" v-if="r.move !== 0" :class="r.move > 0 ? 'up' : 'down'"><ui-icon :name="r.move > 0 ? 'promo' : 'releg'"></ui-icon>{{signed(r.move)}}</span>
                <span class="rv-power">{{formatNumber(r.power)}}</span>
            </div>
        </div>
        <p class="st-note">Strength is ATT+DEF of the starting eleven. Arrows show the change at the last Season end.</p>
    </section>
    <section class="transfer-section">
        <h3 class="section-title">News</h3>
        <p class="academy-empty" v-if="news.length === 0"><ui-icon name="list"></ui-icon> Nothing has happened yet.</p>
        <div class="news-list" v-else>
            <div class="news" v-for="(n, i) in news" :key="i">
                <ui-icon :name="n.icon"></ui-icon>
                <div><p>{{n.text}}</p><small>{{n.when}}</small></div>
            </div>
        </div>
    </section>
</div>
</div>`
});
