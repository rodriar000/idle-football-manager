//Youth academy, player ages and retirement.
//Every season end: players age a year (the young ones get better, the old ones worse), players past their
//retirement age leave, prospects in the academy grow towards their potential and new ones join.
const PlayerAges = Object.freeze({
    //ATT and DEF change at the end of a season by the age the player had during it
    growth(age){
        if(age <= 20){
            return 1.25;
        }
        if(age <= 23){
            return 1.12;
        }
        if(age <= 28){
            return 1;
        }
        return age <= 31 ? 0.95 : 0.9;
    },

    //stable made up age for players from before ages existed, from their name
    fromName(name, min, range){
        let h = 0;
        for(let c of String(name)){
            h = (h * 31 + c.charCodeAt(0)) % 100003;
        }
        return min + h % range;
    }
});

class Prospect{
    constructor(){
        this.name = Utils.capitalize(firstNames[Math.floor(Math.random() * firstNames.length)]) + " "
            + Utils.capitalize(lastNames[Math.floor(Math.random() * lastNames.length)]);
        this.position = Positions.random();
        let [from, to] = Positions.shares[this.position];
        this.share = from + (to - from) * Math.random();
        this.age = 16 + Math.floor(Math.random() * 2);
        //share of the level of the Division you play in
        this.quality = 0.25 + 0.25 * Math.random();
        //the Chief Scout looks at more youngsters: the best of several rolls
        this.stars = 1;
        for(let i = 0; i < game.staff.prospectRolls(); i++){
            let r = Math.random();
            this.stars = Math.max(this.stars, r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.82 ? 3 : r < 0.95 ? 4 : 5);
        }
        this.aggressivity = 0.5 + 1.5 * Math.random();
        this.stamina = 0.5 + 1.5 * Math.random();
    }

    //the quality the prospect grows towards
    getPotential(){
        return 0.7 + 0.35 * this.stars;
    }

    //ATT and DEF if they joined the Team now: they grow with your Division, so they never fall behind
    getStats(){
        let total = GeneratorUtils.getStatLevel(game.team.divisionRank, game.country).mul(2 * this.quality);
        return {attack: total.mul(this.share), defense: total.mul(1 - this.share)};
    }

    grow(){
        let speed = Math.min(1, game.academy.upgrades.coaching.apply().toNumber() + game.career.add("mentor"));
        this.quality += (this.getPotential() - this.quality) * speed;
        this.age++;
    }

    toPlayer(){
        let stats = this.getStats();
        //the price the Market would ask for a player this good
        let stat = stats.attack.add(stats.defense).div(2);
        let marketValue = Decimal.pow(stat.div(2e-3).max(1), Math.log(11) / Math.log(16));
        let player = new Player(this.name, stats.attack, stats.defense, this.aggressivity, this.stamina, false, marketValue, this.position);
        player.age = this.age;
        player.retireAge = 33 + Math.floor(Math.random() * 5);
        player.academy = true;
        return player;
    }

    load(obj){
        Object.assign(this, obj);
        this.quality = Number(obj.quality);
        this.share = Number(obj.share);
    }
}

class Academy{
    constructor(){
        this.prospects = [];
        this.retired = [];
        this.started = false;
        this.upgrades = {
            scouting: new MoneyUpgrade(level => Decimal.pow(8, level).mul(2e5),
                level => new Decimal(2 + level), {
                    maxLevel: 3,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "", " per Season")
                }),
            coaching: new MoneyUpgrade(level => Decimal.pow(4, level).mul(5e5),
                level => new Decimal(0.35 + 0.05 * level), {
                    maxLevel: 8,
                    getEffectDisplay: effectDisplayTemplates.percentStandard(0)
                }),
            facilities: new MoneyUpgrade(level => Decimal.pow(10, level).mul(1e6),
                level => new Decimal(4 + level), {
                    maxLevel: 4,
                    getEffectDisplay: effectDisplayTemplates.numberStandard(0, "", " Places")
                })
        };
    }

    getMaxProspects(){
        return this.upgrades.facilities.apply().toNumber();
    }

    //new prospects join while there is room; returns them
    intake(amount){
        let added = [];
        for(let i = 0; i < amount && this.prospects.length < this.getMaxProspects(); i++){
            let p = new Prospect();
            this.prospects.push(p);
            added.push(p);
        }
        return added;
    }

    //the academy opens with two prospects, for new games and old saves alike
    start(){
        if(!this.started){
            this.started = true;
            this.intake(2);
        }
    }

    promote(prospect){
        if(this.prospects.includes(prospect)){
            this.prospects = this.prospects.filter(p => p !== prospect);
            let player = prospect.toPlayer();
            game.team.players.push(player);
            return player;
        }
        return null;
    }

    release(prospect){
        this.prospects = this.prospects.filter(p => p !== prospect);
    }

    //what happened this season end, for the Season Summary
    endSeason(){
        let news = {grown: [], retired: [], promoted: [], joined: []};
        let squad = game.team.players.concat(game.training.players);
        for(let p of squad){
            let factor = PlayerAges.growth(p.age);
            p.attack = p.attack.mul(factor);
            p.defense = p.defense.mul(factor);
            p.age++;
            if(factor > 1){
                news.grown.push(p.name);
            }
        }
        for(let p of squad.filter(p => p.age > p.getRetireAge())){
            let total = p.getBaseAttack().add(p.getBaseDefense());
            this.retired.unshift({name: p.name, position: p.position, age: p.age - 1, total, academy: p.academy === true});
            game.team.players = game.team.players.filter(x => x !== p);
            game.training.players = game.training.players.filter(x => x !== p);
            news.retired.push(p.name);
        }
        this.retired = this.retired.slice(0, 30);
        if(game.training.players.length === 0){
            game.training.pauseAllTasks();
        }
        //19 year olds are ready: they join the Team's bench
        for(let p of Array.from(this.prospects)){
            p.grow();
            if(p.age >= 19){
                this.promote(p);
                news.promoted.push(p.name);
            }
        }
        news.joined = this.intake(this.upgrades.scouting.apply().toNumber()).map(p => p.name);
        if(news.retired.length > 0 && game.settings.team.refillPlayers){
            game.team.refillPlayers();
        }
        return news;
    }

    load(obj){
        this.started = obj.started === true;
        this.prospects = (obj.prospects || []).map(o => {
            let p = new Prospect();
            p.load(o);
            return p;
        });
        this.retired = obj.retired || [];
        for(let k of Object.keys(this.upgrades)){
            if(obj.upgrades && obj.upgrades[k]){
                this.upgrades[k].level = obj.upgrades[k].level;
            }
        }
    }
}
