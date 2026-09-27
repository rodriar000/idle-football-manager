//tabs shown in the header, also used for keyboard shortcuts
function getVisibleTabs(){
    return [
        {id: "tab-team", name: "Team", icon: "team"},
        {id: "tab-player-market", name: "Market", icon: "market"},
        {id: "tab-academy", name: "Academy", icon: "academy"},
        {id: "tab-manager", name: "Manager", icon: "manager"},
        {id: "tab-staff", name: "Staff", icon: "whistle"},
        {id: "tab-upgrades", name: "Upgrades", icon: "upgrades"},
        {id: "tab-league", name: "League", icon: "league"},
        {id: "tab-match", name: "Match", icon: "match"},
        {id: "tab-stadium", name: "Stadium", icon: "stadium", unlocked: () => Stadium.isUnlocked},
        {id: "tab-player-training", name: "Training", icon: "training", unlocked: () => PlayerTraining.isUnlocked},
        {id: "tab-tv-channels", name: "TV", icon: "tv", unlocked: () => game.tv.isUnlocked()},
        {id: "tab-countries", name: "Countries", icon: "globe", unlocked: () => Country.isUnlocked},
        {id: "tab-achievements", name: "Achievements", icon: "achievements"},
        {id: "tab-settings", name: "Settings", icon: "settings"}
    ].filter(t => !t.unlocked || t.unlocked());
}

//key shown for the n-th visible tab: 1-9, then 0, then none
function getTabShortcut(i){
    return i < 9 ? String(i + 1) : i === 9 ? "0" : "";
}

app.component("game-header", {
    data(){
        return {
            moneyUp: false
        };
    },
    watch: {
        "$root.money"(value, old){
            //short glow on the money chip when money comes in
            if(old && value.gt(old.mul(1.01))){
                this.moneyUp = true;
                clearTimeout(this.moneyTimeout);
                this.moneyTimeout = setTimeout(() => this.moneyUp = false, 500);
            }
        }
    },
    beforeUnmount(){
        clearTimeout(this.moneyTimeout);
    },
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
        divisionName(){
            let divisions = this.$root.league.divisions;
            let division = divisions[this.$root.team.divisionRank];
            return division ? division.getName() + " · Division " + (divisions.length - division.rank) : "";
        },
        liveMinute(){
            let match = this.$root.currentMatch;
            return match && !match.ended && match.time > 0 ? Math.min(90, match.getMinute()) + "'" : "";
        },
        freePoints(){
            return this.$root.career.getFreePoints();
        },
        tabs(){
            //touch reactive state the unlock checks depend on
            this.$root.maxDivisionRank; this.$root.country; this.$root.stadium.upgrades.capacity.level;
            return getVisibleTabs();
        }
    },
    template: `<header>
<h1 class="brand"><span class="brand-mark"><ui-icon name="ball"></ui-icon></span><span class="brand-text">Idle <span>{{term}}</span> Manager</span></h1>
<div class="club-bar">
    <div class="club-id" @click="changeTab('tab-team')">
        <team-logo :logo="logo"></team-logo>
        <p><b>{{$root.team.name}}</b><small>{{divisionName}}</small></p>
    </div>
    <p class="header-money" :class="{up: moneyUp}"><ui-icon name="coins"></ui-icon>{{formatNumber($root.money)}} $</p>
</div>
<nav>
    <ul>
        <li v-for="(t, i) in tabs" :key="t.id" class="icon-flex" :class="{active: $root.tab === t.id}" @click="changeTab(t.id)"
            :title="getTabShortcut(i) ? 'Shortcut: ' + getTabShortcut(i) : ''">
            <ui-icon :name="t.icon"></ui-icon><span class="tab-name">{{t.name}}</span>
            <span class="tab-badge" v-if="t.id === 'tab-match' && liveMinute">{{liveMinute}}</span>
            <span class="tab-badge points" v-if="t.id === 'tab-manager' && freePoints > 0" :title="freePoints + ' skill points to spend'">{{freePoints}}</span>
        </li>
    </ul>
</nav>
</header>`
});
