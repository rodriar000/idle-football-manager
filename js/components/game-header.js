//tabs shown in the header, also used for keyboard shortcuts
function getVisibleTabs(){
    return [
        {id: "tab-team", name: "Team", logo: true},
        {id: "tab-player-market", name: "Market", img: "images/icons/player-market.png"},
        {id: "tab-upgrades", name: "Upgrades", img: "images/icons/upgrades.png"},
        {id: "tab-league", name: "League", img: "images/icons/league.png"},
        {id: "tab-match", name: "Match", img: "images/icons/football.png"},
        {id: "tab-stadium", name: "Stadium", img: "images/icons/stadium.png", unlocked: () => Stadium.isUnlocked},
        {id: "tab-player-training", name: "Training", img: "images/icons/player-training.png", unlocked: () => PlayerTraining.isUnlocked},
        {id: "tab-tv-channels", name: "TV", img: "images/tv-filled.png", unlocked: () => game.tv.isUnlocked()},
        {id: "tab-countries", name: "Countries", img: "images/icons/country.png", unlocked: () => Country.isUnlocked},
        {id: "tab-achievements", name: "Achievements", img: "images/icons/achievements.png"},
        {id: "tab-settings", name: "Settings", img: "images/icons/settings.png"}
    ].filter(t => !t.unlocked || t.unlocked());
}

//key shown for the n-th visible tab: 1-9, then 0, then none
function getTabShortcut(i){
    return i < 9 ? String(i + 1) : i === 9 ? "0" : "";
}

app.component("game-header", {
    methods: {
        changeTab(tab){
            this.$root.tab = tab;
        },
        getTabShortcut,
        formatNumber: functions.formatNumber
    },
    computed:{
        logo(){
            return this.$root.team.logo;
        },
        term(){
            return this.$root.settings.term;
        },
        tabs(){
            //touch reactive state the unlock checks depend on
            this.$root.maxDivisionRank; this.$root.country; this.$root.stadium.upgrades.capacity.level;
            return getVisibleTabs();
        }
    },
    template: `<header>
<h1>Idle {{term}} Manager</h1>
<p class="header-money">{{formatNumber($root.money)}} $</p>
<nav>
    <ul>
        <li v-for="(t, i) in tabs" :key="t.id" class="icon-flex" :class="{active: $root.tab === t.id}" @click="changeTab(t.id)"
            :title="getTabShortcut(i) ? 'Shortcut: ' + getTabShortcut(i) : ''">
            <team-logo v-if="t.logo" :logo="logo"></team-logo><img v-else :src="t.img"/> {{t.name}}
        </li>
    </ul>
</nav>
</header>`
});
