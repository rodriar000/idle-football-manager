//every page of the game, grouped in sections: the menu shows the sections, a bar on top of the page their pages
const NavTabs = {
    "tab-home": {name: "Home", icon: "home"},
    "tab-team": {name: "Team", icon: "team"},
    "tab-player-training": {name: "Training", icon: "training", unlocked: () => PlayerTraining.isUnlocked},
    "tab-academy": {name: "Academy", icon: "academy"},
    "tab-player-market": {name: "Market", icon: "market"},
    "tab-transfers": {name: "Transfers", icon: "transfer"},
    "tab-match": {name: "Match", icon: "match"},
    "tab-league": {name: "League", icon: "league"},
    "tab-cup": {name: "Cup", icon: "cup"},
    "tab-worldcup": {name: "World Cup", icon: "worldcup"},
    "tab-stadium": {name: "Stadium", icon: "stadium", unlocked: () => Stadium.isUnlocked},
    "tab-sponsors": {name: "Sponsors", icon: "sponsor"},
    "tab-staff": {name: "Staff", icon: "whistle"},
    "tab-upgrades": {name: "Upgrades", icon: "upgrades"},
    "tab-tv-channels": {name: "TV", icon: "tv", unlocked: () => game.tv.isUnlocked()},
    "tab-manager": {name: "Career", icon: "manager"},
    "tab-achievements": {name: "Achievements", icon: "achievements"},
    "tab-countries": {name: "Countries", icon: "globe", unlocked: () => Country.isUnlocked},
    "tab-settings": {name: "Settings", icon: "settings"}
};

const NavSections = [
    {id: "home", name: "Home", icon: "home", tabs: ["tab-home"]},
    {id: "squad", name: "Squad", icon: "team", tabs: ["tab-team", "tab-player-training", "tab-academy"]},
    {id: "market", name: "Market", icon: "market", tabs: ["tab-player-market", "tab-transfers"]},
    {id: "match", name: "Match", icon: "match", tabs: ["tab-match"]},
    {id: "compete", name: "Competitions", short: "Compete", icon: "trophy", tabs: ["tab-league", "tab-cup", "tab-worldcup"]},
    {id: "club", name: "Club", icon: "stadium", tabs: ["tab-stadium", "tab-sponsors", "tab-staff", "tab-upgrades", "tab-tv-channels"]},
    {id: "manager", name: "Manager", icon: "manager", tabs: ["tab-manager", "tab-achievements", "tab-countries"]},
    {id: "settings", name: "Settings", icon: "settings", tabs: ["tab-settings"], hidden: true}
];

//the page last opened in each section
const navLastTab = {};

function getSectionTabs(section){
    return section.tabs.filter(id => !NavTabs[id].unlocked || NavTabs[id].unlocked()).map(id => Object.assign({id}, NavTabs[id]));
}

function getSectionOf(tab){
    return NavSections.find(s => s.tabs.includes(tab)) || NavSections[0];
}

//sections shown in the menu, also used for keyboard shortcuts
function getVisibleSections(){
    return NavSections.filter(s => !s.hidden);
}

function openSection(section){
    let tabs = getSectionTabs(section);
    let last = navLastTab[section.id];
    game.tab = tabs.some(t => t.id === last) ? last : tabs[0].id;
}

//key shown for the n-th section: 1-9, then 0, then none
function getTabShortcut(i){
    return i < 9 ? String(i + 1) : i === 9 ? "0" : "";
}

//small counters on the menu: what needs a look
function getNavBadges(root){
    let match = root.currentMatch;
    let live = match && !match.ended && match.time > 0 ? Math.min(90, match.getMinute()) + "'" : "";
    let offers = root.world.offers.length;
    let points = root.career.getFreePoints();
    return {
        tabs: {
            "tab-match": live ? {text: live} : null,
            "tab-transfers": offers ? {text: offers, points: true, title: offers + " bids for your Players"} : null,
            "tab-manager": points ? {text: points, points: true, title: points + " skill points to spend"} : null,
            "tab-worldcup": root.worldCup.running ? {text: "Live", title: "The World Cup is on"} : null
        },
        sections: {
            match: live ? {text: live} : null,
            market: offers ? {text: offers, points: true} : null,
            manager: points ? {text: points, points: true} : null,
            compete: root.worldCup.running ? {text: "Live"} : null
        }
    };
}

//the pages of the open section, over the page
app.component("section-tabs", {
    computed: {
        section(){
            return getSectionOf(this.$root.tab);
        },
        tabs(){
            this.$root.maxDivisionRank; this.$root.country; this.$root.stadium.upgrades.capacity.level;
            return getSectionTabs(this.section);
        },
        badges(){
            return getNavBadges(this.$root).tabs;
        }
    },
    watch: {
        "$root.tab": {
            handler(tab){
                navLastTab[getSectionOf(tab).id] = tab;
            },
            immediate: true
        }
    },
    methods: {
        open(tab){
            this.$root.tab = tab;
        }
    },
    template: `<nav class="section-tabs" v-if="tabs.length > 1" :aria-label="section.name">
    <button v-for="t in tabs" :key="t.id" :class="{active: $root.tab === t.id}" @click="open(t.id)">
        <ui-icon :name="t.icon"></ui-icon><span>{{t.name}}</span>
        <span class="tab-badge" :class="{points: badges[t.id].points}" v-if="badges[t.id]" :title="badges[t.id].title">{{badges[t.id].text}}</span>
    </button>
</nav>`
});

app.component("game-header", {
    data(){
        return {
            moneyUp: false,
            moreOpen: false
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
        },
        "$root.tab"(){
            this.moreOpen = false;
        }
    },
    beforeUnmount(){
        clearTimeout(this.moneyTimeout);
    },
    methods: {
        changeTab(tab){
            this.$root.tab = tab;
        },
        open(section){
            this.moreOpen = false;
            openSection(section);
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
        current(){
            return getSectionOf(this.$root.tab).id;
        },
        sections(){
            return getVisibleSections();
        },
        //on phones these sit behind the More button
        extra(){
            return ["club", "manager"];
        },
        moreSections(){
            //touch reactive state the unlock checks depend on
            this.$root.maxDivisionRank; this.$root.country; this.$root.stadium.upgrades.capacity.level;
            return NavSections.filter(s => this.extra.includes(s.id)).map(s => ({s, tabs: getSectionTabs(s)}));
        },
        badges(){
            return getNavBadges(this.$root);
        },
        moreBadge(){
            return this.extra.some(id => this.badges.sections[id]);
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
    <button class="header-settings" :class="{active: current === 'settings'}" @click="changeTab('tab-settings')" aria-label="Settings" title="Settings"><ui-icon name="settings"></ui-icon></button>
</div>
<nav>
    <ul>
        <li v-for="(s, i) in sections" :key="s.id" class="icon-flex" :class="{active: current === s.id, 'nav-extra': extra.includes(s.id)}" @click="open(s)"
            :title="getTabShortcut(i) ? 'Shortcut: ' + getTabShortcut(i) : ''">
            <ui-icon :name="s.icon"></ui-icon><span class="tab-name"><span class="long">{{s.name}}</span><span class="short">{{s.short || s.name}}</span></span>
            <span class="tab-badge" :class="{points: badges.sections[s.id].points}" v-if="badges.sections[s.id]">{{badges.sections[s.id].text}}</span>
        </li>
        <li class="icon-flex nav-more" :class="{active: moreOpen || extra.includes(current)}" @click="moreOpen = !moreOpen" :aria-expanded="moreOpen">
            <ui-icon name="more"></ui-icon><span class="tab-name">More</span>
            <span class="tab-badge dot" v-if="moreBadge"></span>
        </li>
    </ul>
    <div class="more-backdrop" v-if="moreOpen" @click="moreOpen = false"></div>
    <div class="more-sheet" v-if="moreOpen">
        <section v-for="m in moreSections" :key="m.s.id">
            <h4>{{m.s.name}}</h4>
            <div class="more-grid">
                <button v-for="t in m.tabs" :key="t.id" :class="{active: $root.tab === t.id}" @click="changeTab(t.id)">
                    <ui-icon :name="t.icon"></ui-icon><span>{{t.name}}</span>
                    <span class="tab-badge points" v-if="badges.tabs[t.id]">{{badges.tabs[t.id].text}}</span>
                </button>
            </div>
        </section>
    </div>
</nav>
</header>`
});
