//small scoreboard on every other tab while a match is running
app.component("live-score", {
    computed: {
        match(){
            return this.$root.currentMatch;
        },
        visible(){
            return this.match && !this.match.ended && this.$root.tab !== "tab-match";
        },
        minute(){
            return Math.min(90, this.match.getMinute());
        }
    },
    methods: {
        openMatch(){
            this.$root.tab = "tab-match";
        }
    },
    template: `<transition name="live-score">
<button v-if="visible" class="live-score" @click="openMatch()" title="Go to the Match">
    <span class="live-dot"></span>
    <span class="team">{{match.getTeamName(0)}}</span>
    <span class="numbers">{{match.score1}} - {{match.score2}}</span>
    <span class="team">{{match.getTeamName(1)}}</span>
    <span class="minute">{{minute}}'</span>
</button>
</transition>`
});
