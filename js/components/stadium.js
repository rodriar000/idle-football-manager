app.component("stadium", {
    props: ["stadium"],
    mixins: [mixinHelp],
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        nextRing(){
            let tiers = StadiumRenderer.getTiers(this.stadium.getCapacity());
            return tiers === 0 || tiers >= 6 ? null : new Decimal(10).pow(tiers + 2);
        },
        maxPayment(){
            return this.stadium.getTicketPrice().mul(this.stadium.getCapacity());
        }
    },
    template: `<div class="stadium">
<h2 class="big-heading"><ui-icon name="stadium"></ui-icon> Your Stadium <button class="help" @click="showHelpDialog()"><ui-icon name="help"></ui-icon></button></h2>
<transition name="window-grow">
    <window v-if="helpDialogActive" @closed="hideHelpDialog()">
        <template v-slot:header><div class="icon-flex"><ui-icon name="stadium"></ui-icon> Stadium</div></template>
        <template v-slot:body><p>Every good Football Team needs a Stadium! Building a stadium earns you <b>more money</b> after each Match.</p>
        <p>When a Match begins, a <b>random amount</b> of viewers come to watch your Match (0% - 100%) plus all the <b>fans</b> you have (fans are guaranteed viewers).</p>
        <p>There also are <b>Upgrades</b> to boost your Stadium income.</p></template>
    </window>
</transition>
<div class="info">
    <p>{{formatNumber(stadium.attendance)}} / {{formatNumber(stadium.getCapacity())}} watching</p>
    <p>{{formatNumber(stadium.fans)}} Fans</p>
    <p>{{formatNumber(stadium.getTicketPrice(), 2, 2)}} $ per Ticket → {{formatNumber(maxPayment)}} $ possible</p>
    <stadium-view :stadium="stadium"></stadium-view>
    <p class="next-ring" v-if="nextRing">Next ring of stands at {{formatNumber(nextRing)}} seats</p>
</div>
<h4>Upgrades</h4>
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