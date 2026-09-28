//Home: the next match, what needs a look, and where the Season stands
app.component("tab-home", {
    computed: {
        team(){
            return this.$root.team;
        },
        division(){
            return this.$root.league.divisions[this.team.divisionRank];
        },
        matchRunning(){
            let m = this.$root.currentMatch;
            return m && !m.ended && m.time > 0;
        },
        canPlay(){
            return !this.matchRunning && this.team.canPlayNextMatch();
        },
        //the match on the card: the live one, else the next one
        next(){
            let m = this.matchRunning ? this.$root.currentMatch : this.$root.nextMatch;
            if(!m || !m.team1 || !m.team2){
                return null;
            }
            let home = m.team1 === this.team;
            let other = home ? m.team2 : m.team1;
            let label;
            if(m.worldCup !== null && m.worldCup !== undefined){
                label = "World Cup · " + WorldCupStages.steps[m.worldCup];
            }
            else if(m.qualifier !== null && m.qualifier !== undefined){
                label = "World Cup qualifying";
            }
            else if(m.cup !== null && m.cup !== undefined){
                label = "Continental Cup · " + CupRounds.names[m.cup];
            }
            else{
                label = this.division.getName() + " · Matchday " + (this.division.matchDay);
            }
            return {
                label,
                ownName: m.getTeamName(home ? 0 : 1),
                otherName: m.getTeamName(home ? 1 : 0),
                other,
                home
            };
        },
        restTime(){
            return this.team.getTimeUntilRested();
        },
        position(){
            return this.division.getSortedTeams().indexOf(this.team) + 1;
        },
        form(){
            return this.$root.matchHistory.slice(-5).map(m => m.result === MATCH_WIN ? "W" : m.result === MATCH_DRAW ? "D" : "L");
        },
        //things that need a look, each opens its page
        todo(){
            let root = this.$root;
            let list = [];
            let active = this.team.getActivePlayers().length;
            if(active < 11){
                list.push({key: "xi", icon: "team", tab: "tab-team", text: active === 0 ? "Put Players in your Team" : "Your Team has " + active + " of 11 Players", action: "Team"});
            }
            let open = this.team.getOpenPlaces().length;
            if(active >= 11 && open > 0){
                list.push({key: "pos", icon: "swap", tab: "tab-team", text: open + (open === 1 ? " position of your formation has" : " positions of your formation have") + " nobody in it", action: "Team"});
            }
            let offers = root.world.offers.length;
            if(offers){
                list.push({key: "bids", icon: "transfer", tab: "tab-transfers", text: offers + (offers === 1 ? " club bids" : " clubs bid") + " for your Players", action: "See bids"});
            }
            let points = root.career.getFreePoints();
            if(points){
                list.push({key: "perks", icon: "manager", tab: "tab-manager", text: points + (points === 1 ? " skill point" : " skill points") + " to spend", action: "Career"});
            }
            let slots = root.sponsors.getSlots() - root.sponsors.active.length;
            if(slots > 0 && root.sponsors.offers.length){
                list.push({key: "sponsor", icon: "sponsor", tab: "tab-sponsors", text: slots + (slots === 1 ? " free sponsor slot" : " free sponsor slots") + ", " + root.sponsors.offers.length + " offers waiting", action: "Sponsors"});
            }
            let empty = Object.keys(root.staff.members).filter(r => !root.staff.members[r]).length;
            if(empty){
                list.push({key: "staff", icon: "whistle", tab: "tab-staff", text: empty + (empty === 1 ? " staff role is" : " staff roles are") + " empty", action: "Staff"});
            }
            let upgrades = Object.values(root.moneyUpgrades).filter(u => u.canBuy()).length;
            if(upgrades){
                list.push({key: "upg", icon: "upgrades", tab: "tab-upgrades", text: upgrades + (upgrades === 1 ? " upgrade you can afford" : " upgrades you can afford"), action: "Upgrades"});
            }
            return list;
        },
        cupText(){
            let cup = this.$root.cup;
            cup.ties.length; cup.round; cup.entries;
            if(!cup.isQualified()){
                return "Not qualified";
            }
            if(cup.hasWon()){
                return "Winner";
            }
            if(cup.isOut()){
                return "Out · " + cup.getReached();
            }
            return "In the " + CupRounds.names[Math.min(cup.round, CupRounds.count - 1)];
        },
        worldCupText(){
            let wc = this.$root.worldCup;
            wc.step; wc.running; wc.qual && wc.qual.games.length;
            if(wc.running){
                return "Live · " + WorldCupStages.steps[wc.step];
            }
            if(wc.getQual()){
                let place = wc.getQualPlace();
                return "Qualifying · " + place + (["st", "nd", "rd", "th", "th"][place - 1]) + " of 5";
            }
            let left = wc.getNextSeason() - this.$root.records.seasons;
            return left === 1 ? "After this Season" : "In " + left + " Seasons";
        }
    },
    methods: {
        formatNumber: functions.formatNumber,
        formatTime: functions.formatTime,
        open(tab){
            this.$root.tab = tab;
        },
        playOrWatch(){
            if(this.canPlay){
                this.division.playNextMatch();
            }
            this.$root.tab = "tab-match";
        }
    },
    template: `<div class="tab-home">
<section class="home-next" v-if="next">
    <p class="eyebrow">{{matchRunning ? "Live now" : "Next Match"}} · {{next.label}}</p>
    <div class="hn-vs">
        <div class="hn-side mine"><team-logo :logo="team.logo"></team-logo><b>{{next.ownName}}</b></div>
        <span class="hn-at">{{next.home ? "Home" : "Away"}}</span>
        <div class="hn-side"><team-logo :logo="next.other.logo"></team-logo><b>{{next.otherName}}</b></div>
    </div>
    <div class="hn-actions">
        <button class="kick" :disabled="!matchRunning && !canPlay" @click="playOrWatch()"><ui-icon name="play"></ui-icon> {{matchRunning ? "Watch live" : "Play next Match"}}</button>
        <p class="hn-rest" v-if="!matchRunning && team.getActivePlayers().length && restTime > 0"><ui-icon name="timer"></ui-icon> Fully rested in {{formatTime(Math.ceil(restTime))}}</p>
    </div>
</section>
<section class="home-todo">
    <h3 class="section-title">To do</h3>
    <p class="home-clear" v-if="todo.length === 0"><ui-icon name="check"></ui-icon> All done. Play your next Match.</p>
    <button class="todo" v-for="t in todo" :key="t.key" @click="open(t.tab)">
        <span class="todo-icon"><ui-icon :name="t.icon"></ui-icon></span>
        <span class="todo-text">{{t.text}}</span>
        <span class="todo-go">{{t.action}} <ui-icon name="arrow"></ui-icon></span>
    </button>
</section>
<section class="home-season">
    <h3 class="section-title">Season {{$root.records.seasons + 1}}</h3>
    <div class="home-tiles">
        <button class="home-tile" @click="open('tab-league')">
            <small>League</small>
            <b>{{position}}<sup>{{["st", "nd", "rd"][position - 1] || "th"}}</sup></b>
            <span>{{team.getPoints()}} pts · {{Math.max(0, division.matchDay - 1)}}/{{division.matchDays}} played</span>
            <span class="form" v-if="form.length"><i v-for="(r, i) in form" :key="i" :class="r">{{r}}</i></span>
        </button>
        <button class="home-tile" @click="open('tab-cup')">
            <small>Continental Cup</small>
            <b class="home-tile-text">{{cupText}}</b>
        </button>
        <button class="home-tile" @click="open('tab-worldcup')">
            <small>World Cup</small>
            <b class="home-tile-text">{{worldCupText}}</b>
        </button>
    </div>
</section>
</div>`
});
