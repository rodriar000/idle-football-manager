//Backroom staff: a Head Coach, a Chief Scout and a Physio. Each one has 1 to 5 stars, costs a signing fee,
//takes a wage from every match reward and stays for the Seasons of their contract.
const StaffRoles = Object.freeze({
    list: [
        {id: "coach", name: "Head Coach", icon: "whistle"},
        {id: "scout", name: "Chief Scout", icon: "binoculars"},
        {id: "physio", name: "Physio", icon: "physio"}
    ],

    get(id){
        return StaffRoles.list.find(r => r.id === id);
    },

    //what a member with these stars does
    effects(role, stars){
        switch(role){
            case "coach":
                return [
                    {icon: "attack", text: "Your Team's Attack and Defense", value: "+" + 3 * stars + " %"},
                    {icon: "training", text: "Training speed", value: "+" + 10 * stars + " %"}
                ];
            case "scout":
                return [
                    {icon: "market", text: "Stats of new Market Players", value: "+" + 6 * stars + " %"},
                    {icon: "star", text: "Chances for star prospects", value: "×" + (1 + Math.floor(stars / 2))}
                ];
            case "physio":
                return [
                    {icon: "stamina", text: "Stamina regeneration", value: "+" + 10 * stars + " %"},
                    {icon: "drop", text: "Tiredness in matches", value: "-" + 6 * stars + " %"}
                ];
        }
        return [];
    }
});

class StaffMember{
    constructor(role = "coach"){
        this.role = role;
        this.name = Utils.capitalize(firstNames[Math.floor(Math.random() * firstNames.length)]) + " "
            + Utils.capitalize(lastNames[Math.floor(Math.random() * lastNames.length)]);
        this.age = 34 + Math.floor(Math.random() * 29);
        let r = Math.random();
        this.stars = r < 0.35 ? 1 : r < 0.65 ? 2 : r < 0.85 ? 3 : r < 0.96 ? 4 : 5;
        this.contract = 1 + Math.floor(Math.random() * 3); //Seasons offered
        this.seasonsLeft = 0; //once hired
    }

    //a win's reward in your Division: fees and wages follow what you earn
    static getScale(){
        return game.league.divisions[game.team.divisionRank].getRewards().win;
    }

    getFee(){
        return StaffMember.getScale().mul(3 * this.stars ** 1.7);
    }

    getRenewFee(){
        return this.getFee().div(2);
    }

    getWage(){
        return StaffMember.getScale().mul(0.02 * this.stars);
    }

    load(obj){
        this.role = obj.role;
        this.name = obj.name;
        this.age = Number(obj.age) || 40;
        this.stars = Math.max(1, Math.min(5, Number(obj.stars) || 1));
        this.contract = Number(obj.contract) || 1;
        this.seasonsLeft = Number(obj.seasonsLeft) || 0;
    }
}

class Staff{
    constructor(){
        this.members = {coach: null, scout: null, physio: null};
        this.candidates = [];
    }

    stars(role){
        let m = this.members[role];
        return m ? m.stars : 0;
    }

    //effects used around the game (1 when nobody is hired)
    teamMul(){
        return 1 + 0.03 * this.stars("coach");
    }

    trainSpeedMul(){
        return 1 + 0.1 * this.stars("coach");
    }

    marketMul(){
        return 1 + 0.06 * this.stars("scout");
    }

    prospectRolls(){
        return 1 + Math.floor(this.stars("scout") / 2);
    }

    regenMul(){
        return 1 + 0.1 * this.stars("physio");
    }

    tireMul(){
        return 1 - 0.06 * this.stars("physio");
    }

    getWages(){
        return Object.values(this.members).filter(m => m).reduce((s, m) => s.add(m.getWage()), new Decimal(0));
    }

    //three candidates per role, new ones every Season end
    refreshCandidates(){
        this.candidates = [];
        for(let role of StaffRoles.list){
            for(let i = 0; i < 3; i++){
                this.candidates.push(new StaffMember(role.id));
            }
        }
    }

    canHire(candidate){
        return this.candidates.includes(candidate) && game.money.gte(candidate.getFee());
    }

    //hiring for a role that is taken replaces the current member
    hire(candidate){
        if(this.canHire(candidate)){
            game.money = game.money.sub(candidate.getFee());
            candidate.seasonsLeft = candidate.contract;
            this.members = Object.assign({}, this.members, {[candidate.role]: candidate});
            this.candidates = this.candidates.filter(c => c !== candidate);
        }
    }

    canRenew(role){
        let m = this.members[role];
        return m !== null && game.money.gte(m.getRenewFee());
    }

    //two more Seasons for half the fee
    renew(role){
        if(this.canRenew(role)){
            let m = this.members[role];
            game.money = game.money.sub(m.getRenewFee());
            m.seasonsLeft += 2;
        }
    }

    dismiss(role){
        this.members = Object.assign({}, this.members, {[role]: null});
    }

    start(){
        if(this.candidates.length === 0){
            this.refreshCandidates();
        }
    }

    //what happened this Season end, for the Season Summary
    endSeason(){
        let news = {left: []};
        let members = Object.assign({}, this.members);
        for(let role of Object.keys(members)){
            let m = members[role];
            if(m){
                m.age++;
                m.seasonsLeft--;
                if(m.seasonsLeft <= 0){
                    news.left.push(m.name + " (" + StaffRoles.get(role).name + ")");
                    members[role] = null;
                }
            }
        }
        this.members = members;
        this.refreshCandidates();
        return news;
    }

    load(obj){
        this.members = {coach: null, scout: null, physio: null};
        for(let role of Object.keys(this.members)){
            if(obj.members && obj.members[role]){
                let m = new StaffMember(role);
                m.load(obj.members[role]);
                this.members[role] = m;
            }
        }
        this.candidates = (obj.candidates || []).map(o => {
            let m = new StaffMember(o.role);
            m.load(o);
            return m;
        });
    }
}
