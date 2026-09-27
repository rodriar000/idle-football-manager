app.component("tab-staff", {
    mixins: [mixinHelp],
    data(){
        return {
            armed: null
        };
    },
    computed: {
        staff(){
            return this.$root.staff;
        },
        money(){
            return this.$root.money;
        },
        roles(){
            //fees and wages follow your Division, so read it for reactivity
            this.$root.team.divisionRank; this.$root.country;
            return StaffRoles.list.map(role => {
                let member = this.staff.members[role.id];
                return {
                    role,
                    member,
                    effects: member ? StaffRoles.effects(role.id, member.stars) : StaffRoles.effects(role.id, 3),
                    wage: member ? member.getWage() : null,
                    renewFee: member ? member.getRenewFee() : null,
                    candidates: this.staff.candidates.filter(c => c.role === role.id).map(c => ({
                        c,
                        fee: c.getFee(),
                        wage: c.getWage(),
                        effects: StaffRoles.effects(role.id, c.stars)
                    }))
                };
            });
        },
        wages(){
            this.$root.team.divisionRank; this.$root.country;
            return this.staff.getWages();
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        seasons(n){
            return n + (n === 1 ? " Season" : " Seasons");
        },
        //a second tap confirms anything that loses someone
        confirm(key, action){
            if(this.armed === key){
                this.armed = null;
                action();
                return;
            }
            this.armed = key;
            clearTimeout(this.armedTimeout);
            this.armedTimeout = setTimeout(() => this.armed = null, 3000);
        },
        hire(entry, filled){
            if(filled){
                this.confirm(entry.c, () => this.staff.hire(entry.c));
            }
            else{
                this.staff.hire(entry.c);
            }
        },
        dismiss(role){
            this.confirm(role, () => this.staff.dismiss(role));
        },
        renew(role){
            this.staff.renew(role);
        }
    },
    beforeUnmount(){
        clearTimeout(this.armedTimeout);
    },
    template: `<div class="tab-staff">
<div class="page-head">
    <span class="page-icon"><ui-icon name="whistle"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Backroom Staff</p><h2>Staff <button class="help" @click="showHelpDialog()" aria-label="How the Staff works"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="whistle"></ui-icon> Staff</div></template>
        <template v-slot:body>
            <p>Hire a <b>Head Coach</b>, a <b>Chief Scout</b> and a <b>Physio</b>. The more stars they have, the more they help.</p>
            <p>Hiring costs a <b>signing fee</b>, and every match the staff take their <b>wages</b> from what you earn. Both follow the Division you play in.</p>
            <p>They stay for the Seasons of their <b>contract</b>. Extend it before it ends, or they leave at the Season end. New candidates arrive every Season end.</p>
        </template>
    </window>
</transition>
<div class="staff-roles">
    <div class="staff-card" v-for="r in roles" :key="r.role.id" :class="{empty: !r.member, last: r.member && r.member.seasonsLeft === 1}">
        <div class="st-head">
            <span class="st-icon"><ui-icon :name="r.role.icon"></ui-icon></span>
            <div class="st-title">
                <small>{{r.role.name}}</small>
                <b v-if="r.member" :title="r.member.name">{{r.member.name}}</b>
                <b v-else>Nobody yet</b>
            </div>
        </div>
        <template v-if="r.member">
            <div class="pr-stars" :title="r.member.stars + ' of 5 stars'"><ui-icon v-for="i in 5" :key="i" name="star" :class="{on: i <= r.member.stars}"></ui-icon></div>
            <p class="st-meta">{{r.member.age}} y · <span class="st-left">{{r.member.seasonsLeft === 1 ? "Last Season" : seasons(r.member.seasonsLeft) + " left"}}</span></p>
        </template>
        <p class="st-hint" v-else>A 3 star {{r.role.name}} would give:</p>
        <ul class="st-fx">
            <li v-for="fx in r.effects" :key="fx.text"><ui-icon :name="fx.icon"></ui-icon><span>{{fx.text}}</span><b>{{fx.value}}</b></li>
        </ul>
        <template v-if="r.member">
            <p class="st-wage"><ui-icon name="coins"></ui-icon> {{formatNumber(r.wage)}} $ per match</p>
            <div class="st-actions">
                <button class="st-renew" :disabled="!staff.canRenew(r.role.id)" @click="renew(r.role.id)">+2 Seasons · {{formatNumber(r.renewFee)}} $</button>
                <button class="negative" :class="{armed: armed === r.role.id}" @click="dismiss(r.role.id)">{{armed === r.role.id ? "Tap again" : "Dismiss"}}</button>
            </div>
        </template>
        <p class="st-hint" v-else>Pick one from the candidates below.</p>
    </div>
</div>
<p class="staff-wages"><ui-icon name="coins"></ui-icon> <span>Staff wages</span> <b>{{formatNumber(wages)}} $</b> <small>per match</small></p>
<section class="staff-market">
    <h3 class="section-title">Candidates</h3>
    <p class="st-note">New candidates arrive every Season end.</p>
    <div class="staff-group" v-for="r in roles" :key="'c' + r.role.id">
        <h4><ui-icon :name="r.role.icon"></ui-icon> {{r.role.name}}</h4>
        <p class="academy-empty" v-if="r.candidates.length === 0"><ui-icon :name="r.role.icon"></ui-icon> No more candidates this Season.</p>
        <div class="staff-offers" v-else>
            <div class="staff-offer" v-for="e in r.candidates" :key="e.c.name + e.c.age">
                <div class="pr-head">
                    <b class="pr-name" :title="e.c.name">{{e.c.name}}</b>
                    <span class="pr-age">{{e.c.age}} y</span>
                </div>
                <div class="pr-stars" :title="e.c.stars + ' of 5 stars'"><ui-icon v-for="i in 5" :key="i" name="star" :class="{on: i <= e.c.stars}"></ui-icon></div>
                <ul class="st-fx">
                    <li v-for="fx in e.effects" :key="fx.text"><ui-icon :name="fx.icon"></ui-icon><span>{{fx.text}}</span><b>{{fx.value}}</b></li>
                </ul>
                <p class="st-terms"><span><ui-icon name="calendar"></ui-icon> {{seasons(e.c.contract)}}</span><span><ui-icon name="coins"></ui-icon> {{formatNumber(e.wage)}} $ per match</span></p>
                <button class="st-hire" :class="{armed: armed === e.c}" :disabled="money.lt(e.fee)" @click="hire(e, !!r.member)">
                    <template v-if="armed === e.c">Tap again to replace</template>
                    <template v-else>{{r.member ? "Replace" : "Hire"}} · {{formatNumber(e.fee)}} $</template>
                </button>
            </div>
        </div>
    </div>
</section>
</div>`
});
