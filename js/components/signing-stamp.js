app.component("signing-stamp", {
    computed: {
        signing(){
            return uiFx.signing;
        }
    },
    template: `<transition name="stamp">
    <div class="signing-stamp" v-if="signing" :key="signing.key" aria-live="polite">
        <div class="signing-card">
            <player-avatar :player="signing.player"></player-avatar>
            <p class="signing-name">{{signing.player.name}}</p>
            <p class="signing-club">joins {{$root.team.name}}</p>
            <p class="stamp">Signed!</p>
        </div>
    </div>
</transition>`
});
