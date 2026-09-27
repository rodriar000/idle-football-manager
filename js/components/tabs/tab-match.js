app.component("tab-match", {
    computed: {
        currentMatch(){
            return game.currentMatch;
        },
        nextMatch(){
            return game.nextMatch;
        }
    },
    template: `<div class="tab-match">
<match v-if="currentMatch" :match="currentMatch"></match>
<match v-else-if="nextMatch" :match="nextMatch"></match>
<div v-else class="match-empty"><ui-icon name="match"></ui-icon><p>There is no pending match. Check back later.</p></div>
</div>`
});