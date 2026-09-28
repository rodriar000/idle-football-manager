//the National Cup: the same page as the Continental Cup (tab-cup.js), for the cup of your country
app.component("tab-national-cup", Object.assign({}, TabCup, {
    computed: Object.assign({}, TabCup.computed, {
        cup(){
            return this.$root.nationalCup;
        },
        info(){
            return {
                icon: "natcup",
                title: "National Cup",
                won: "You won the National Cup!",
                honours: ["National Cup won", "National Cups won"],
                wins: this.$root.records.nationalCups || 0,
                help: [
                    "Every Season, <b>16 clubs of your country</b> play a knockout Cup alongside the league: 4 from the Division above yours, 8 from yours and 4 from the Division below.",
                    "Everybody plays it, and the club from the <b>lower Division plays at home</b>, so a small club can knock out a big one.",
                    "The rounds are played <b>between matchdays</b>, on other days than the Continental Cup. A draw goes to <b>penalties</b>.",
                    "Every round you win pays a <b>prize</b>, and winning the Final gives extra Manager XP at the Season end. A new draw is made every Season."
                ]
            };
        }
    })
}));
