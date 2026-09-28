//Sponsors: every Season brands offer contracts with a goal. A signed sponsor pays a fee after every match
//of yours and a big bonus the moment its goal is reached. Contracts end with the Season.
const SponsorGoals = Object.freeze({
    //ratio: share of the league matches left when the offer is made
    types: {
        wins: {icon: "check", ratios: [0.35, 0.5, 0.65], text: n => "Win " + n + " league matches"},
        goals: {icon: "ball", ratios: [1.2, 1.7, 2.3], text: n => "Score " + n + " league goals"},
        cleanSheets: {icon: "defend", ratios: [0.2, 0.3, 0.42], text: n => "Keep " + n + " clean sheets in the league"},
        streak: {icon: "flame", fixed: [3, 4, 6], text: n => "Win " + n + " league matches in a row"},
        position: {icon: "league", fixed: [5, 3, 1], text: n => n === 1 ? "Finish the Season 1st" : "Finish the Season in the top " + n},
        cup: {icon: "cup", fixed: [1, 2, 3], text: n => "Reach the " + CupRounds.names[n] + " of the Continental Cup"}
    },
    //reward in wins of your Division, by difficulty
    bonus: [6, 12, 24],
    perMatch: [0.05, 0.08, 0.12],
    difficulty: ["Easy", "Medium", "Hard"]
});

const SponsorBrands = Object.freeze({
    first: ["Nova", "Volt", "Apex", "Zenith", "Orbit", "Pulse", "Astra", "Terra", "Blue", "Iron", "Swift", "Solar", "Echo", "Prime", "Vista", "Crown"],
    second: ["Tech", "Bank", "Air", "Cola", "Motors", "Energy", "Foods", "Mobile", "Sports", "Wear", "Games", "Media", "Travel", "Bet", "Insure", "Coffee"],
    colors: ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#fdd835", "#3949ab", "#d81b60", "#6d4c41", "#00897b", "#546e7a"]
});

class Sponsor{
    constructor(goal = "wins", level = 0){
        let b = SponsorBrands;
        this.name = b.first[Math.floor(Math.random() * b.first.length)] + " " + b.second[Math.floor(Math.random() * b.second.length)];
        this.color = b.colors[Math.floor(Math.random() * b.colors.length)];
        this.color2 = b.colors[Math.floor(Math.random() * b.colors.length)];
        this.goal = goal;
        this.level = level;
        this.target = 1;
        this.from = 0; //matches of the Season's history before signing
        this.done = false;
    }

    getGoal(){
        return SponsorGoals.types[this.goal];
    }

    getText(){
        return this.getGoal().text(this.target);
    }

    getBonus(){
        return Sponsor.getScale().mul(SponsorGoals.bonus[this.level]);
    }

    getPerMatch(){
        return Sponsor.getScale().mul(SponsorGoals.perMatch[this.level]);
    }

    static getScale(){
        return game.league.divisions[game.team.divisionRank].getRewards().win;
    }

    //league matches of yours since signing
    getMatches(){
        return game.matchHistory.slice(this.from);
    }

    //{value, max} for the progress bar; position goals show your place instead
    getProgress(){
        let own = m => m.ownIndex === 0 ? m.score1 : m.score2;
        let other = m => m.ownIndex === 0 ? m.score2 : m.score1;
        let matches = this.getMatches();
        switch(this.goal){
            case "wins":
                return {value: matches.filter(m => m.result === MATCH_WIN).length, max: this.target};
            case "goals":
                return {value: matches.reduce((s, m) => s + own(m), 0), max: this.target};
            case "cleanSheets":
                return {value: matches.filter(m => other(m) === 0).length, max: this.target};
            case "streak":{
                let best = 0, now = 0;
                for(let m of matches){
                    now = m.result === MATCH_WIN ? now + 1 : 0;
                    best = Math.max(best, now);
                }
                return {value: best, max: this.target};
            }
            case "position":{
                let place = game.league.divisions[game.team.divisionRank].getSortedTeams().indexOf(game.team) + 1;
                return {value: place, max: this.target, place: true};
            }
            case "cup":{
                let cup = game.cup, own = cup.getOwnIndex();
                let reached = 0;
                for(let r = 1; r < CupRounds.count; r++){
                    if(cup.getPairs(r).some(p => p.includes(own))){
                        reached = r;
                    }
                }
                return {value: reached, max: this.target, cup: true};
            }
        }
        return {value: 0, max: 1};
    }

    //position goals only count at the Season end
    isReached(){
        let p = this.getProgress();
        return this.goal === "position" ? false : p.value >= p.max;
    }

    load(obj){
        Object.assign(this, obj);
        this.level = Math.max(0, Math.min(2, Number(obj.level) || 0));
        this.target = Number(obj.target) || 1;
        this.from = Number(obj.from) || 0;
        this.done = obj.done === true;
    }
}

class Sponsors{
    constructor(){
        this.active = [];
        this.offers = [];
        this.totalBonus = 0; //goals reached, all time
    }

    getSlots(){
        return 2;
    }

    //new offers: one of each difficulty and a fourth, fitting what is left of the Season
    makeOffers(){
        let division = game.league.divisions[game.team.divisionRank];
        let left = Math.max(1, division.matchDays - game.matchHistory.length);
        let goals = Object.keys(SponsorGoals.types);
        let cupNow = new Sponsor("cup").getProgress().value;
        if(!game.cup.isQualified() || game.cup.isOut() || game.cup.isOver() || cupNow >= CupRounds.count - 1){
            goals = goals.filter(g => g !== "cup");
        }
        goals.sort(() => Math.random() - 0.5);
        this.offers = [0, 1, 2, Math.floor(Math.random() * 3)].map((level, i) => {
            let s = new Sponsor(goals[i % goals.length], level);
            let type = s.getGoal();
            if(type.ratios){
                s.target = Math.max(1, Math.round(left * type.ratios[level]));
            }
            else{
                s.target = type.fixed[level];
            }
            if(s.goal === "cup"){
                s.target = Math.min(CupRounds.count - 1, Math.max(s.target, cupNow + 1));
            }
            if(s.goal === "streak"){
                s.target = Math.min(s.target, left);
            }
            return s;
        });
    }

    canSign(offer){
        return this.offers.includes(offer) && this.active.length < this.getSlots();
    }

    sign(offer){
        if(this.canSign(offer)){
            offer.from = game.matchHistory.length;
            this.active = this.active.concat([offer]);
            this.offers = this.offers.filter(o => o !== offer);
        }
    }

    start(){
        if(this.offers.length === 0 && this.active.length === 0){
            this.makeOffers();
        }
    }

    //after every match of yours: the fees, and the bonus for goals reached. Returns what was paid
    payMatch(){
        let paid = {fees: new Decimal(0), bonus: new Decimal(0), reached: []};
        for(let s of this.active){
            paid.fees = paid.fees.add(s.getPerMatch());
            if(!s.done && s.isReached()){
                s.done = true;
                paid.bonus = paid.bonus.add(s.getBonus());
                paid.reached.push(s.name);
                this.totalBonus++;
            }
        }
        game.money = game.money.add(paid.fees).add(paid.bonus);
        return paid;
    }

    //Season end: position goals are checked, contracts end and new brands make offers
    endSeason(season){
        let news = {reached: [], missed: [], bonus: new Decimal(0)};
        for(let s of this.active){
            if(!s.done && s.goal === "position" && season && season.position <= s.target){
                s.done = true;
                news.bonus = news.bonus.add(s.getBonus());
                this.totalBonus++;
            }
            (s.done ? news.reached : news.missed).push(s.name);
        }
        game.money = game.money.add(news.bonus);
        this.active = [];
        return news;
    }

    load(obj){
        let make = o => {
            let s = new Sponsor();
            s.load(o);
            return s;
        };
        this.active = (obj.active || []).map(make);
        this.offers = (obj.offers || []).map(make);
        this.totalBonus = Number(obj.totalBonus) || 0;
    }
}
