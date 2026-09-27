app.component("upgrade", {
    props: ["upgrade", "icon"],
    computed: {
        maxed(){
            return this.upgrade.level >= this.upgrade.maxLevel;
        },
        levelText(){
            let max = this.upgrade.maxLevel;
            return "Lv " + this.upgrade.level + (isFinite(max) ? " / " + max : "");
        },
        //"x1.00 → x1.11" becomes now and next
        effect(){
            let parts = this.upgrade.getEffectDisplay().split(" → ");
            return {now: parts[0], next: parts[1]};
        }
    },
    template: `<div class="up-row" :class="{maxed, affordable: upgrade.canBuy()}">
<span class="up-icon"><ui-icon :name="icon || 'upgrades'"></ui-icon></span>
<div class="up-text">
    <h4><slot name="title"></slot> <small class="up-level">{{levelText}}</small></h4>
    <p class="up-desc"><slot name="description"></slot></p>
</div>
<p class="up-effect"><b>{{effect.now}}</b><template v-if="effect.next"><ui-icon name="arrow"></ui-icon><b class="next">{{effect.next}}</b></template></p>
<button class="up-buy" :disabled="!upgrade.canBuy()" @click="upgrade.buy()">{{upgrade.getPriceDisplay()}}</button>
</div>`
});
