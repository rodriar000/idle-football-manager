app.component("tab-achievements", {
    data(){
        return{
            achievements: game.achievements,
            filter: "all"
        }
    },
    computed: {
        numAchievements(){
            return this.achievements.filter(a => a.completed).length;
        },
        share(){
            return Math.round(this.numAchievements / this.achievements.length * 100);
        },
        shown(){
            if(this.filter === "all"){
                return this.achievements;
            }
            return this.achievements.filter(a => a.completed === (this.filter === "done"));
        }
    },
    template: `<div class="tab-achievements">
    <div class="page-head">
        <span class="page-icon"><ui-icon name="achievements"></ui-icon></span>
        <div class="page-title">
            <p class="eyebrow">Achievements</p>
            <h2>{{numAchievements}} <small>of {{achievements.length}} unlocked</small></h2>
            <div class="bar" :title="share + ' %'"><i :style="{width: share + '%'}"></i></div>
        </div>
        <p class="page-share">{{share}} %</p>
    </div>
    <section class="records-panel">
        <h3>Club Records</h3>
        <club-records></club-records>
        <p class="records-note">Counted since this Version of the Game.</p>
    </section>
    <div class="chips achievement-filter" role="group" aria-label="Show Achievements">
        <button :class="{selected: filter === 'all'}" @click="filter = 'all'"><ui-icon name="grid"></ui-icon> All</button>
        <button :class="{selected: filter === 'done'}" @click="filter = 'done'"><ui-icon name="check"></ui-icon> Unlocked</button>
        <button :class="{selected: filter === 'open'}" @click="filter = 'open'"><ui-icon name="lock"></ui-icon> Locked</button>
    </div>
    <div class="ach-grid">
        <achievement v-for="a in shown" :achievement="a" :key="a.title"></achievement>
    </div>
</div>`
});
