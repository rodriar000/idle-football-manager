//players picked for side-by-side comparison, not saved
const playerCompare = Vue.reactive({
    players: [],
    isSelected(player){
        return this.players.some(p => Vue.toRaw(p) === Vue.toRaw(player));
    },
    toggle(player){
        if(this.isSelected(player)){
            this.players = this.players.filter(p => Vue.toRaw(p) !== Vue.toRaw(player));
        }
        else if(this.players.length < 2){
            this.players.push(player);
        }
    },
    clear(){
        this.players = [];
    }
});

app.component("player-compare", {
    methods: {
        formatNumber: functions.formatNumber,
        clear(){
            playerCompare.clear();
        },
        isBought(p){
            return game.team.players.includes(p) || game.training.players.includes(p);
        },
        //which side wins a row: 0, 1 or -1 for a tie
        better(row){
            let [a, b] = row.values;
            let cmp = a instanceof Decimal ? a.cmp(b) : Math.sign(a - b);
            if(row.lowerIsBetter){
                cmp = -cmp;
            }
            return cmp > 0 ? 0 : (cmp < 0 ? 1 : -1);
        }
    },
    computed: {
        players(){
            return playerCompare.players;
        },
        trainingUnlocked(){
            return PlayerTraining.isUnlocked;
        },
        rows(){
            let [a, b] = this.players;
            let fmt = v => this.formatNumber(v);
            let rows = [
                {name: "ATT", values: [a.getBaseAttack(), b.getBaseAttack()], format: fmt},
                {name: "DEF", values: [a.getBaseDefense(), b.getBaseDefense()], format: fmt},
                {name: "ATT+DEF", values: [a.getBaseAttack().add(a.getBaseDefense()), b.getBaseAttack().add(b.getBaseDefense())], format: fmt, total: true},
                {name: "AGG", values: [a.aggressivity * 100, b.aggressivity * 100], format: fmt, lowerIsBetter: true, title: "Lower means fewer Red Cards"},
                {name: "STA", values: [a.stamina * 100, b.stamina * 100], format: fmt},
                {name: "Stamina now", values: [a.currentStamina * 100, b.currentStamina * 100], format: v => this.formatNumber(v, 0, 0) + " %"}
            ];
            if(this.trainingUnlocked){
                rows.push({name: "Training", values: [a.trainingFactor, b.trainingFactor], format: v => "x" + this.formatNumber(v, 2, 2)});
            }
            let value = p => this.isBought(p) ? p.getSellAmount() : p.getPrice();
            rows.push({name: "Value", values: [value(a), value(b)], format: v => this.formatNumber(v) + " $", neutral: true,
                title: "Sell value for your Players, Price for Market Players"});
            return rows;
        }
    },
    template: `<div class="player-compare-container">
<transition name="window-grow">
<window v-if="players.length === 2" class="window-compare" @closed="clear()">
    <template v-slot:header><div class="icon-flex"><ui-icon name="compare"></ui-icon><span>Compare Players</span></div></template>
    <template v-slot:body>
        <table>
            <thead><tr><th></th><th>{{players[0].name}}</th><th>{{players[1].name}}</th></tr></thead>
            <tbody>
                <tr v-for="row in rows" :title="row.title" :class="{total: row.total}">
                    <td>{{row.name}}</td>
                    <td v-for="(v, i) in row.values" :class="{better: !row.neutral && better(row) === i}">{{row.format(v)}}</td>
                </tr>
            </tbody>
        </table>
    </template>
</window>
</transition>
<div class="compare-bar" v-if="players.length === 1">
    <span>Comparing <b>{{players[0].name}}</b>. Pick another Player with <ui-icon name="compare"></ui-icon></span>
    <button @click="clear()">Cancel</button>
</div>
</div>`
});
