app.component("stadium", {
    props: ["stadium"],
    mixins: [mixinHelp],
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        tiers(){
            return StadiumRenderer.getTiers(this.stadium.getCapacity());
        },
        nextRing(){
            return this.tiers === 0 || this.tiers >= 6 ? null : new Decimal(10).pow(this.tiers + 2);
        },
        //how far the capacity is on the way to the next ring, in powers of ten like the rings
        ringShare(){
            let capacity = this.stadium.getCapacity();
            if(!this.nextRing || capacity.lte(1)){
                return 0;
            }
            let from = this.tiers === 1 ? 0 : this.tiers + 1;
            return Math.max(0, Math.min(100, (capacity.log10() - from) / (this.tiers + 2 - from) * 100));
        },
        maxPayment(){
            return this.stadium.getTicketPrice().mul(this.stadium.getCapacity());
        },
        fillShare(){
            let capacity = this.stadium.getCapacity();
            return capacity.gt(0) ? Math.min(100, this.stadium.attendance.div(capacity).toNumber() * 100) : 0;
        },
        money(){
            return this.$root.money;
        }
    },
    template: `<div class="stadium stadium-page">
<div class="page-head">
    <span class="page-icon"><ui-icon name="stadium"></ui-icon></span>
    <div class="page-title"><p class="eyebrow">Home Ground</p><h2>Your Stadium <button class="help" @click="showHelpDialog()" aria-label="How the Stadium works"><ui-icon name="help"></ui-icon></button></h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="stadium"></ui-icon> Stadium</div></template>
        <template v-slot:body><p>Every good Football Team needs a Stadium! Building a stadium earns you <b>more money</b> after each Match.</p>
        <p>When a Match begins, a <b>random amount</b> of viewers come to watch your Match (0% - 100%) plus all the <b>fans</b> you have (fans are guaranteed viewers).</p>
        <p>There also are <b>Upgrades</b> to boost your Stadium income.</p></template>
    </window>
</transition>
<div class="stadium-hero">
    <div class="stadium-shot">
        <stadium-view :stadium="stadium"></stadium-view>
        <p class="stadium-tag"><ui-icon name="crowd"></ui-icon> {{formatNumber(stadium.getCapacity())}} seats</p>
    </div>
    <div class="stadium-kpis">
        <div class="s-kpi crowd">
            <small>Watching now</small>
            <b><ui-icon name="crowd"></ui-icon> {{formatNumber(stadium.attendance)}}</b>
            <div class="bar"><i :style="{width: fillShare + '%'}"></i></div>
            <small v-if="stadium.attendance.gt(0)">{{fillShare.toFixed(0)}}% of the seats are full</small>
            <small v-else>The crowd comes in when a Match kicks off</small>
        </div>
        <div class="s-kpi">
            <small>Fans</small>
            <b><ui-icon name="player"></ui-icon> {{formatNumber(stadium.fans)}}</b>
            <small>Always come to watch</small>
        </div>
        <div class="s-kpi">
            <small>Ticket Price</small>
            <b><ui-icon name="coins"></ui-icon> {{formatNumber(stadium.getTicketPrice(), 2, 2)}} $</b>
            <small>per viewer</small>
        </div>
        <div class="s-kpi best">
            <small>Full Stadium pays</small>
            <b>{{formatNumber(maxPayment)}} $</b>
            <small>per Match</small>
        </div>
    </div>
</div>
<div class="ring-card" v-if="nextRing">
    <p><ui-icon name="stadium"></ui-icon><span>Next ring of stands at <b>{{formatNumber(nextRing)}}</b> seats</span><b class="ring-share">{{ringShare.toFixed(0)}}%</b></p>
    <div class="bar"><i :style="{width: ringShare + '%'}"></i></div>
</div>
<div class="ring-card done" v-else-if="tiers >= 6">
    <p><ui-icon name="check"></ui-icon><span>Every ring of stands is built</span></p>
</div>
<h3 class="section-title">Upgrades</h3>
<div class="upgrade-container">
    <upgrade :upgrade="stadium.upgrades.capacity" icon="stadium">
        <template v-slot:title>Stadium Capacity</template>
        <template v-slot:description>Increase the Amount of people that can watch the match at once.</template>
    </upgrade>
    <upgrade :upgrade="stadium.upgrades.ticketPrice" icon="coins">
        <template v-slot:title>Pricing Tactics</template>
        <template v-slot:description>Increase the Price for each Ticket. Don't worry, this won't decrease attendance.</template>
    </upgrade>
    <upgrade :upgrade="stadium.upgrades.fanGain" icon="crowd">
        <template v-slot:title>The Famous Factor</template>
        <template v-slot:description>More people decide to become a fan.</template>
    </upgrade>
</div>
</div>`
});