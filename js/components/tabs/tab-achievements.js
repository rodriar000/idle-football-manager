app.component("tab-achievements", {
    data(){
        return{
            achievements: game.achievements
        }
    },
    computed: {
        numAchievements(){
            return this.achievements.filter(a => a.completed).length;
        }
    },
    template: `<div class="tab-achievements">
    <h2 class="big-heading">Club Records</h2>
    <club-records></club-records>
    <p class="records-note">Counted since this Version of the Game.</p>
    <h2 class="big-heading"><ui-icon name="trophy"></ui-icon> {{numAchievements}} / {{achievements.length}}</h2>
    <div class="achievements">
        <achievement v-for="(a, i) in achievements" :achievement="a" :key="i"></achievement>
    </div>
</div>`
});