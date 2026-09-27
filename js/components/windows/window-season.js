app.component("window-season", {
    emits: ["closed"],
    methods: {
        formatNumber: functions.formatNumber
    },
    computed: {
        season(){
            return this.$root.lastSeason;
        },
        emblem(){
            return {champion: "trophy", promoted: "promo", relegated: "releg", stayed: "ball"}[this.season.outcome];
        },
        celebrate(){
            return this.season.outcome === "champion" || this.season.outcome === "promoted";
        },
        //podium order: 2nd, 1st, 3rd
        podium(){
            let p = this.season.podium || [];
            return [p[1], p[0], p[2]].map((team, i) => team && Object.assign({place: [2, 1, 3][i]}, team)).filter(Boolean);
        },
        confetti(){
            let colors = ["#f5c542", "#22c55e", "#ffffff", "#ef4444", "#3b82f6", this.$root.team.logo.gradient[0]];
            return Array.from({length: 70}, (_, i) => ({
                left: Math.random() * 100 + "%",
                backgroundColor: colors[i % colors.length],
                animationDelay: Math.random() * 1.2 + "s",
                animationDuration: 2.2 + Math.random() * 1.8 + "s",
                transform: "rotate(" + Math.random() * 360 + "deg)"
            }));
        },
        outcomeText(){
            return {
                promoted: "Promoted to the next Division!",
                relegated: "Relegated to the previous Division.",
                champion: "Champion of the League!",
                stayed: "Staying in this Division."
            }[this.season.outcome];
        }
    },
    template: `<window class="window-season" @closed="$emit('closed')">
    <template v-slot:header><div class="icon-flex"><ui-icon name="league"></ui-icon><span>Season Summary</span></div></template>
    <template v-slot:body>
        <div class="confetti" v-if="celebrate" aria-hidden="true"><i v-for="c in confetti" :style="c"></i></div>
        <div class="season-emblem" :class="season.outcome"><ui-icon :name="emblem"></ui-icon></div>
        <p class="season-division">{{season.divisionName}} (Division {{season.divisionNumber}})</p>
        <p class="position">{{season.position}}. of {{season.teams}}</p>
        <p class="outcome" :class="season.outcome">{{outcomeText}}</p>
        <div class="podium" v-if="podium.length">
            <div v-for="t in podium" :class="['place-' + t.place, {own: t.own}]">
                <p class="podium-team">{{t.name}}</p>
                <p class="podium-points">{{t.points}} pts</p>
                <div class="podium-block">{{t.place}}</div>
            </div>
        </div>
        <div class="stats">
            <p><b>{{season.points}}</b> Points</p>
            <p><b>{{season.stats.win}}</b> W · <b>{{season.stats.draw}}</b> D · <b>{{season.stats.lose}}</b> L</p>
            <p>Goals <b>{{season.stats.goalsShot}} - {{season.stats.goalsOpponent}}</b></p>
            <p>Match Rewards <b>+{{formatNumber(season.money)}} $</b></p>
        </div>
        <div v-if="season.academy" class="season-academy">
            <h4>Squad changes</h4>
            <p v-if="season.academy.grown.length"><ui-icon name="upgrades"></ui-icon> {{season.academy.grown.length}} young Players improved</p>
            <p v-if="season.academy.retired.length"><ui-icon name="timer"></ui-icon> Retired: {{season.academy.retired.join(", ")}}</p>
            <p v-if="season.academy.promoted.length"><ui-icon name="academy"></ui-icon> Joined the Team from the Academy: {{season.academy.promoted.join(", ")}}</p>
            <p v-if="season.managerXp"><ui-icon name="manager"></ui-icon> +{{season.managerXp}} Manager XP for the Season</p>
            <p v-if="season.academy.joined.length"><ui-icon name="star"></ui-icon> New prospects: {{season.academy.joined.join(", ")}}</p>
            <p v-if="season.cup"><ui-icon name="cup"></ui-icon> Continental Cup: {{season.cup.won ? "Winner! +" + season.cup.xp + " Manager XP" : "out in the " + season.cup.reached}}</p>
            <p v-if="season.staff && season.staff.left.length"><ui-icon name="whistle"></ui-icon> Contract ended: {{season.staff.left.join(", ")}}</p>
            <p v-if="season.staff"><ui-icon name="whistle"></ui-icon> New Staff candidates are waiting in the Staff tab</p>
        </div>
        <div v-if="season.topScorers.length" class="scorers">
            <h4>Top Scorers</h4>
            <p v-for="s in season.topScorers"><ui-icon name="ball"></ui-icon> {{s.name}}: {{s.goals}}</p>
        </div>
    </template>
</window>`
});
