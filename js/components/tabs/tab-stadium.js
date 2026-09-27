app.component("tab-stadium", {
    data(){
        return {
            stadium: game.stadium
        }
    },
    computed: {
        money(){
            return game.money;
        }
    },
    methods: {
        formatNumber: functions.formatNumber
    },
    template: `<div class="tab-stadium">
<stadium :stadium="stadium"></stadium>
</div>`
});