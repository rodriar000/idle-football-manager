class Player {
    constructor(name, attack, defense, aggressivity, stamina, active, marketValue = new Decimal(0), position = null) {
        this.name = name;
        this.attack = attack;
        this.defense = defense;
        this.active = active;
        this.marketValue = marketValue;
        this.sellMultiplier = 0.6;
        this.stamina = stamina;
        this.aggressivity = aggressivity;
        this.currentStamina = 1;
        this.trainingFactor = new Decimal(1);
        this.redCard = 0;
        //protected: can't be sold or taken out of the Team (only a red card still benches them)
        this.locked = false;
        //GK, DEF, MID or FWD (see formation.js)
        this.position = position;
        //ages a year every season end (academy.js); plays until the season they are retireAge
        this.age = 25;
        this.retireAge = 35;
        //came through your youth academy
        this.academy = false;
    }

    //the manager's Longevity perk keeps your players a little longer
    getRetireAge(){
        return this.retireAge + game.career.add("longevity");
    }

    isLastSeason(){
        return this.age >= this.getRetireAge();
    }

    //used for display on player component
    getBaseAttack() {
        return this.attack.mul(this.trainingFactor);
    }

    //used for display on player component
    getBaseDefense() {
        return this.defense.mul(this.trainingFactor);
    }

    getAttack() {
        return this.getBaseAttack().mul(0.5 + 0.5 * this.currentStamina);
    }

    getDefense(){
        return this.getBaseDefense().mul(0.5 + 0.5 * this.currentStamina);
    }

    getRegenerationTime(){
        return 500 / (this.stamina * game.moneyUpgrades.playerRegeneration.apply().toNumber() * game.career.mul("recovery") * game.staff.regenMul());
    }

    regenerate(dt){
        this.currentStamina = Math.min(1, this.currentStamina + dt * 1 / this.getRegenerationTime());
    }

    isBought(){
        return game.team.players.find(p => p === this) !== undefined;
    }

    hasRedCard(){
        return this.redCard > 0;
    }

    getBasePrice(){
        return this.marketValue.mul(game.moneyUpgrades.cheaperPlayers.apply());
    }

    //buying price, with the manager's Negotiator perk
    getPrice(){
        return this.getBasePrice().mul(game.career.mul("negotiator"));
    }

    canAfford(){
        return game.money.gte(this.getPrice());
    }

    buy(){
        if(!this.isBought() && this.canAfford()){
            game.money = game.money.sub(this.getPrice());
            game.team.players.push(this);
            game.playerMarket.players = game.playerMarket.players.filter(p => p !== this);
        }
    }

    getSellAmount(){
        return this.getBasePrice().mul(this.sellMultiplier).mul(this.trainingFactor.pow(0.8)).mul(game.career.mul("sellHigh"));
    }

    sell(){
        if(!this.active && this.isBought() && !this.locked){
            game.money = game.money.add(this.getSellAmount());
            game.playerMarket.players.push(this);
            game.team.players = game.team.players.filter(p => p !== this);
        }
    }

    load(obj){
        this.name = obj.name;
        this.attack = obj.attack;
        this.defense = obj.defense;
        this.stamina = obj.stamina;
        this.aggressivity = obj.aggressivity;
        this.currentStamina = obj.currentStamina;
        this.marketValue = obj.marketValue;
        this.sellMultiplier = obj.sellMultiplier;
        this.redCard = Number(obj.redCard);
        this.trainingFactor = obj.trainingFactor ? obj.trainingFactor : new Decimal(1);
        this.locked = obj.locked === true;
        //players saved before positions existed get one from how attacking they are
        this.position = Positions.list.includes(obj.position) ? obj.position : Positions.fromShare(Positions.attackShare(this));
        //players from before ages existed get one from 20 to 30, so nobody retires right away
        this.age = typeof obj.age === "number" ? obj.age : PlayerAges.fromName(this.name, 20, 11);
        this.retireAge = typeof obj.retireAge === "number" ? obj.retireAge : 33 + PlayerAges.fromName(this.name + "!", 0, 5);
        this.academy = obj.academy === true;
    }
}