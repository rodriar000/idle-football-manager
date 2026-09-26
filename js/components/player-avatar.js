app.component("player-avatar", {
    props: ["player"],
    computed: {
        src(){
            //touch the kit colours so a new crest colour redraws the shirt
            let logo = this.$root.team.logo;
            logo.gradient[0]; logo.stripeColor; this.$root.team.players.length;
            return PlayerAvatar.get(this.player);
        }
    },
    template: `<img class="avatar" alt="" :src="src"/>`
});
