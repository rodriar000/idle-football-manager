app.component("card-guide", {
    data(){
        return {
            open: false
        };
    },
    computed: {
        levels(){
            return CardLevels.ladder();
        }
    },
    methods: {
        range(level){
            let f = functions.formatNumber;
            return level.index === 0 ? "under " + f(level.max) : f(level.min) + " to " + f(level.max);
        }
    },
    template: `<span class="card-guide">
    <button class="help" @click="open = true" aria-label="Card levels" title="Card levels"><ui-icon name="help"></ui-icon></button>
    <transition name="window-grow">
        <window v-if="open" @closed="open = false">
            <template v-slot:header><div class="icon-flex"><ui-icon name="star"></ui-icon> Card Levels</div></template>
            <template v-slot:body>
                <p class="guide-intro">The card colour depends only on <b>ATT+DEF</b>, the same for every Player. Each level is ten times stronger than the one before. In the upper half of a level the card is <b>Rare</b> <ui-icon name="star"></ui-icon>.</p>
                <ul class="guide-list">
                    <li v-for="l in levels" :key="l.index">
                        <span class="guide-swatch" :class="'card-' + l.id" :style="l.hue !== null ? {'--hue': l.hue} : null">{{l.short}}</span>
                        <span class="guide-name">{{l.name}}</span>
                        <span class="guide-range">{{range(l)}}</span>
                    </li>
                    <li class="guide-more">And so on: Galactic 4, 5, 6... every ten times more.</li>
                </ul>
            </template>
        </window>
    </transition>
</span>`
});
