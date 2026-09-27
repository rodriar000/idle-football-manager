app.component("achievement", {
    props: ["achievement"],
    computed: {
        icon(){
            return Icons.forImage(this.achievement.image);
        },
        desc(){
            return typeof this.achievement.description === "string" ? this.achievement.description : this.achievement.description();
        }
    },
    template: `<div class="ach-card" :class="{completed: achievement.completed}">
<span class="achievement-icon"><ui-icon :name="icon"></ui-icon></span>
<div class="achievement-text">
    <h4 v-html="achievement.title"></h4>
    <p v-html="desc"></p>
</div>
<ui-icon class="achievement-state" :name="achievement.completed ? 'check' : 'lock'"></ui-icon>
</div>`
});
