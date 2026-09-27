app.component("season-archive", {
    data(){
        return {
            showAll: false
        };
    },
    computed: {
        seasons(){
            let archive = this.$root.seasonArchive;
            return archive.map((s, i) => Object.assign({number: i + 1}, s)).reverse();
        },
        shownSeasons(){
            return this.showAll ? this.seasons : this.seasons.slice(0, 10);
        }
    },
    methods: {
        badge(s){
            return {promoted: "promo", relegated: "releg", champion: "trophy", stayed: "balance"}[s.outcome];
        },
        outcomeText(s){
            return {promoted: "Promoted", relegated: "Relegated", champion: "Champion", stayed: "Stayed"}[s.outcome];
        },
        countryName(s){
            let country = this.$root.countries[s.country];
            return country ? country.name : "";
        }
    },
    template: `<div class="match-history season-archive">
    <h3>Past Seasons</h3>
    <p v-if="seasons.length === 0" class="empty">Finished seasons will be listed here.</p>
    <div class="row" v-for="s in shownSeasons" :key="s.number">
        <span class="matchday">{{s.number}}</span>
        <span class="result" :class="s.outcome" :title="outcomeText(s)"><ui-icon :name="badge(s)"></ui-icon></span>
        <span class="teams"><b>{{s.position}}. of {{s.teams}}</b> · {{s.divisionName}} (Division {{s.divisionNumber}})
            <small>{{countryName(s)}} · {{s.win}} W · {{s.draw}} D · {{s.lose}} L · Goals {{s.goalsShot}} - {{s.goalsOpponent}}</small></span>
        <span class="points">{{s.points}} Pts</span>
    </div>
    <button class="show-all" v-if="seasons.length > 10" @click="showAll = !showAll">{{showAll ? "Show less" : "Show all " + seasons.length + " Seasons"}}</button>
</div>`
});
