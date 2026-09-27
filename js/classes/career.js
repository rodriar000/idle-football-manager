//Manager career: matches and seasons give experience, every level gives a skill point,
//and skill points buy permanent perks in three branches.
const CareerPerks = Object.freeze({
    branches: [
        {id: "tactician", name: "Tactician", icon: "match"},
        {id: "business", name: "Businessman", icon: "coins"},
        {id: "motivator", name: "Motivator", icon: "player"}
    ],
    //tier: points already spent in the branch before the perk opens
    list: [
        {id: "pressing", branch: "tactician", tier: 0, max: 5, icon: "attack", name: "High Press", text: "Your Team's Attack", step: 0.03, format: "percent"},
        {id: "organisation", branch: "tactician", tier: 0, max: 5, icon: "defend", name: "Organisation", text: "Your Team's Defense", step: 0.03, format: "percent"},
        {id: "versatility", branch: "tactician", tier: 3, max: 3, icon: "swap", name: "Versatility", text: "What Players give out of position", step: 0.05, format: "points"},
        {id: "matchday", branch: "tactician", tier: 6, max: 3, icon: "flame", name: "Match Day Speech", text: "Your Team's Attack and Defense", step: 0.05, format: "percent"},

        {id: "negotiator", branch: "business", tier: 0, max: 5, icon: "market", name: "Negotiator", text: "Market prices", step: -0.03, format: "percent"},
        {id: "commercial", branch: "business", tier: 0, max: 5, icon: "coins", name: "Commercial Deals", text: "Match rewards", step: 0.06, format: "percent"},
        {id: "tickets", branch: "business", tier: 3, max: 5, icon: "stadium", name: "Ticket Office", text: "Stadium income", step: 0.08, format: "percent"},
        {id: "sellHigh", branch: "business", tier: 6, max: 5, icon: "sell", name: "Sell High", text: "What you get for selling Players", step: 0.06, format: "percent"},

        {id: "recovery", branch: "motivator", tier: 0, max: 5, icon: "stamina", name: "Recovery", text: "Stamina regeneration", step: 0.08, format: "percent"},
        {id: "discipline", branch: "motivator", tier: 0, max: 4, icon: "redcard", name: "Discipline", text: "Red Cards of your Players", step: -0.15, format: "percent"},
        {id: "mentor", branch: "motivator", tier: 3, max: 3, icon: "academy", name: "Youth Mentor", text: "Academy growth per Season", step: 0.05, format: "points"},
        {id: "longevity", branch: "motivator", tier: 6, max: 2, icon: "timer", name: "Longevity", text: "Retirement age of your Players", step: 1, format: "years"}
    ],

    get(id){
        return CareerPerks.list.find(p => p.id === id);
    }
});

class ManagerCareer{
    constructor(){
        this.xp = 0; //towards the next level
        this.level = 1;
        this.totalXp = 0;
        this.ranks = {};
        this.started = false;
    }

    static xpToNext(level){
        return Math.round(100 * level ** 1.35);
    }

    //adds experience; returns how many levels were gained
    addXp(amount){
        let gained = 0;
        this.xp += amount;
        this.totalXp += amount;
        while(this.xp >= ManagerCareer.xpToNext(this.level)){
            this.xp -= ManagerCareer.xpToNext(this.level);
            this.level++;
            gained++;
        }
        return gained;
    }

    getSpentPoints(branch){
        return CareerPerks.list.filter(p => !branch || p.branch === branch).reduce((s, p) => s + this.rank(p.id), 0);
    }

    //one skill point per level after the first
    getFreePoints(){
        return this.level - 1 - this.getSpentPoints();
    }

    rank(id){
        return this.ranks[id] || 0;
    }

    isOpen(perk){
        return this.getSpentPoints(perk.branch) >= perk.tier;
    }

    canLearn(perk){
        return this.getFreePoints() > 0 && this.isOpen(perk) && this.rank(perk.id) < perk.max;
    }

    learn(perk){
        if(this.canLearn(perk)){
            this.ranks = Object.assign({}, this.ranks, {[perk.id]: this.rank(perk.id) + 1});
        }
    }

    reset(){
        this.ranks = {};
    }

    //the effect of a perk: 1 + step * rank for multipliers, step * rank for the rest
    mul(id){
        return 1 + CareerPerks.get(id).step * this.rank(id);
    }

    add(id){
        return CareerPerks.get(id).step * this.rank(id);
    }

    //experience for one of your matches
    static matchXp(own, other){
        let base = own > other ? 30 : own === other ? 15 : 5;
        return base + 2 * own;
    }

    static seasonXp(outcome){
        return {champion: 250, promoted: 200, stayed: 60, relegated: 20}[outcome] || 0;
    }

    //saves from before careers: the club's history counts
    start(){
        if(!this.started){
            this.started = true;
            let r = game.records;
            let xp = (r.wins || 0) * 30 + (r.draws || 0) * 15 + (r.losses || 0) * 5 + (r.goalsFor || 0) * 2
                + (r.titles || 0) * 250 + (r.promotions || 0) * 200;
            if(xp > 0){
                this.addXp(xp);
            }
        }
    }

    load(obj){
        this.xp = Number(obj.xp) || 0;
        this.level = Number(obj.level) || 1;
        this.totalXp = Number(obj.totalXp) || 0;
        this.ranks = {};
        for(let perk of CareerPerks.list){
            let rank = Number(obj.ranks && obj.ranks[perk.id]) || 0;
            if(rank > 0){
                this.ranks[perk.id] = Math.min(perk.max, rank);
            }
        }
        this.started = obj.started === true;
    }
}
