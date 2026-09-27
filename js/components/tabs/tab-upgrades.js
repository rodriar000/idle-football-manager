app.component("tab-upgrades", {
    data(){
        return {
            upgrades: game.moneyUpgrades
        }
    },
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        money(){
            return game.money
        }
    },
    template: `<div class="tab-upgrades">
<div class="page-head">
    <span class="page-icon"><ui-icon name="upgrades"></ui-icon></span>
    <div><p class="eyebrow">Club Upgrades</p><h2>Upgrades</h2></div>
    <p class="page-money"><ui-icon name="coins"></ui-icon> {{formatNumber(money)}} $</p>
</div>
<div class="upgrade-container">
    <upgrade :upgrade="upgrades.matchSpeed" icon="clock">
        <template v-slot:title>Match Speed</template>
        <template v-slot:description>Increase the maximum Match Speed you can configure.</template>
    </upgrade>
    <upgrade :upgrade="upgrades.matchRewards" icon="coins">
        <template v-slot:title>Match Rewards</template>
        <template v-slot:description>Get more Money per match played.</template>
    </upgrade>
    <upgrade :upgrade="upgrades.cheaperPlayers" icon="market">
        <template v-slot:title>Market Strategy</template>
        <template v-slot:description>Decrease the Price of Players in the Market.</template>
    </upgrade>
    <upgrade :upgrade="upgrades.playerRegeneration" icon="stamina">
        <template v-slot:title>Energy Drink</template>
        <template v-slot:description>Increase the rate at which Players regenerate stamina.</template>
    </upgrade>
</div>
</div>`
});