class Team {
    constructor(name, players, divisionRank, country, seed) {
        this.name = name;
        this.players = players;
        this.divisionRank = divisionRank;
        this.country = country;
        this.strategy = Strategy.NORMAL;
        this.aggressivity = Strategy.NORMAL;
        this.seed = seed; //used for team logo
        this.formation = Formations.default;
        this.logo = this.generateLogo();
        this.resetDivisionStats();
    }

    generateLogo(){
        let r  = new Random(this.seed);
        let gradient = [];
        let colorAmount = 2 + r.nextInt(Math.min(3, 1 + Math.floor(this.divisionRank / 4) + this.country));
        for(let i = 0; i < colorAmount; i++){
            gradient.push(Utils.colorFromRGB(r.nextInt(256), r.nextInt(256), r.nextInt(256)));
        }
        return new TeamLogo(this.name.substr(0, 1), gradient,3 + r.nextInt(5), "#ffffff");
    }

    generatePlayers(){
        let players = [];
        let r = new Random(this.seed);
        let normRank = GeneratorUtils.getNormRank(this.divisionRank, this.country);
        let minStat = Decimal.pow(16, normRank + r.nextDouble());
        minStat = minStat.mul(new Decimal(17 / 16).pow(Math.max(0, normRank - 4)).add(1));
        minStat = minStat.mul(new Decimal(20 / 17).pow(Math.max(0, normRank - 12)).add(1));
        minStat = minStat.mul(new Decimal(1.1).pow(Decimal.pow(1.01, Decimal.max(0, normRank - 50))));
        let maxStat = minStat.mul(1 + 0.5 * r.nextDouble());
        for(let i = 0; i < 11; i++) {
            players.push(GeneratorUtils.generatePlayer(r.nextInt(), minStat, maxStat, true));
        }
        //every club plays its own formation, with its players in the places that suit them
        let keys = Formations.keys();
        this.formation = keys[new Random(this.seed + 11).nextInt(keys.length)];
        let places = Formations.places(this.formation);
        Array.from(players).sort((a, b) => Positions.attackShare(a) - Positions.attackShare(b))
            .forEach((p, i) => p.position = places[i]);
        return players;
    }

    getSortedPlayers(){
        return Array.from(this.players).sort((p1, p2) => (p2.attack.add(p2.defense)).gte(p1.attack.add(p1.defense)) ? 1 : -1);
    }

    getActiveSortedPlayers(){
        return this.getSortedPlayers().filter(p => p.active).reverse();
    }

    getInactiveSortedPlayers(){
        return this.getSortedPlayers().filter(p => !p.active);
    }

    getTotalGames(){
        return this.divisionStats.win + this.divisionStats.draw + this.divisionStats.lose;
    }

    getPoints(){
        return 3 * this.divisionStats.win + this.divisionStats.draw;
    }

    getGoalDifference(){
        return this.divisionStats.goalsShot - this.divisionStats.goalsOpponent;
    }

    getActivePlayingPlayers() {
        return this.players.filter(p => p.active && !p.hasRedCard());
    }

    getActivePlayers() {
        return this.players.filter(p => p.active);
    }

    getInactivePlayers() {
        return this.players.filter(p => !p.active);
    }

    getRedCardChance(){
        let base = 0.000003;
        if(this.aggressivity === Strategy.OFFENSIVE){
            base *= 2;
        }
        else if(this.aggressivity === Strategy.DEFENSIVE){
            base /= 2;
        }
        if(this === game.team){
            base *= game.career.mul("discipline");
        }
        return base;
    }

    //less players -> less synergy; encourages filling the team; 50% to 150%
    getSynergy(){
        return 0.25 + 0.75 * (this.getActivePlayingPlayers().length / 11) ** 2;
    }

    //the playing players in the places of the formation: [{place, player, fit}]
    getLineup(){
        return Formations.assign(this.getActivePlayingPlayers(), this.formation, Formations.power,
            this === game.team ? game.career.add("versatility") : 0);
    }

    //the place an active player plays in and how much of their stats they give there (fit 1 = own position)
    getSlot(player){
        return this.getLineup().find(s => s.player === player) || null;
    }

    getCombinedStats() {
        let stats = {attack: new Decimal(0), defense: new Decimal(0)};
        let synergy = this.getSynergy();
        for (let slot of this.getLineup()) {
            if(slot.player){
                stats.attack = stats.attack.add(slot.player.getAttack().mul(synergy * slot.fit));
                stats.defense = stats.defense.add(slot.player.getDefense().mul(synergy * slot.fit));
            }
        }
        let formation = Formations.get(this.formation);
        stats.attack = stats.attack.mul(formation.att);
        stats.defense = stats.defense.mul(formation.def);
        //the manager's perks only help your own Team
        if(this === game.team){
            let career = game.career;
            stats.attack = stats.attack.mul(career.mul("pressing") * career.mul("matchday") * game.staff.teamMul());
            stats.defense = stats.defense.mul(career.mul("organisation") * career.mul("matchday") * game.staff.teamMul());
        }
        if(this.strategy === Strategy.OFFENSIVE){
            stats.attack = stats.attack.mul(1.3);
            stats.defense = stats.defense.div(1.3);
        }
        else if(this.strategy === Strategy.DEFENSIVE){
            stats.attack = stats.attack.div(1.3);
            stats.defense = stats.defense.mul(1.3);
        }
        if(this.aggressivity === Strategy.OFFENSIVE){
            stats.attack = stats.attack.mul(1.1);
            stats.defense = stats.defense.mul(1.1);
        }
        else if(this.aggressivity === Strategy.DEFENSIVE){
            stats.attack = stats.attack.div(1.1);
            stats.defense = stats.defense.div(1.1);
        }
        return stats;
    }

    getCombinedAttack() {
        return this.getCombinedStats().attack;
    }

    getCombinedDefense() {
        return this.getCombinedStats().defense;
    }

    //seconds until every starter is back at full stamina
    getTimeUntilRested(){
        let t = 0;
        for(let p of this.getActivePlayers()){
            t = Math.max(t, (1 - p.currentStamina) * p.getRegenerationTime());
        }
        return t;
    }

    getAverageStamina(){
        let s = 0;
        for(let p of this.getActivePlayers()){
            s += p.currentStamina;
        }
        return s / this.getActivePlayers().length;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p !== player);
    }

    //the positions of the formation nobody plays in, keeper first
    getOpenPlaces(){
        let places = Formations.places(this.formation);
        for(let p of this.getActivePlayers()){
            let i = places.indexOf(p.position);
            if(i >= 0){
                places.splice(i, 1);
            }
        }
        return places;
    }

    //the bench player who adds the most in one of the places: players of that position first
    getBestFor(place, candidates){
        let best = null, bestValue = null;
        for(let p of candidates){
            let value = Formations.power(p).mul(Positions.fit(p.position, place));
            if(bestValue === null || value.gt(bestValue)){
                best = p;
                bestValue = value;
            }
        }
        return best;
    }

    refillPlayers(){
        let available = () => this.getInactivePlayers().filter(p => !p.hasRedCard());
        while(this.getActivePlayers().length < 11 && available().length > 0){
            let open = this.getOpenPlaces();
            let place = open.find(pl => available().some(p => p.position === pl)) || open[0] || "MID";
            this.getBestFor(place, available()).active = true;
        }
    }

    //put the 11 strongest available players (current stamina counted) in the team
    pickBestEleven(minStamina = 0){
        //sent off players can't leave the pitch while a match is running
        let matchRunning = game.currentMatch && !game.currentMatch.ended;
        //protected players already in the team stay there too
        let keep = this.players.filter(p => p.active && (p.locked || matchRunning && p.hasRedCard()));
        let slots = 11 - keep.length;
        let available = this.players.filter(p => !p.hasRedCard() && !keep.includes(p));
        let rested = available.filter(p => p.currentStamina >= minStamina);
        //places the kept players don't already take, keeper first
        let open = Formations.places(this.formation);
        for(let p of keep){
            let i = open.indexOf(p.position);
            open.splice(i >= 0 ? i : open.length - 1, 1);
        }
        //each place gets the strongest player of its position, rested ones first;
        //places no one of that position is left for get whoever gives the most there
        let chosen = [];
        let pick = (place, ownPosition) => {
            for(let pool of [rested, available]){
                let candidates = pool.filter(p => !chosen.includes(p) && (!ownPosition || p.position === place));
                let best = this.getBestFor(place, candidates);
                if(best){
                    return best;
                }
            }
            return null;
        };
        let unfilled = [];
        for(let place of open.slice(0, slots)){
            let p = pick(place, true);
            if(p){
                chosen.push(p);
            }
            else{
                unfilled.push(place);
            }
        }
        for(let place of unfilled){
            let p = pick(place, false);
            if(p){
                chosen.push(p);
            }
        }
        for(let p of this.players){
            if(!keep.includes(p)){
                p.active = chosen.includes(p);
            }
        }
    }

    //swap tired active players for rested bench players; returns [{out, in}]
    substituteTiredPlayers(minStamina){
        let subs = [];
        let tired = this.getActivePlayingPlayers().filter(p => p.currentStamina < minStamina && !p.locked)
            .sort((p1, p2) => p1.currentStamina - p2.currentStamina);
        for(let out of tired){
            let bench = this.getInactivePlayers().filter(p => !p.hasRedCard() && p.currentStamina >= minStamina);
            if(bench.length === 0){
                break;
            }
            //someone for the same place: the tired player's position if they play in it
            let best = this.getBestFor(out.position, bench);
            out.active = false;
            best.active = true;
            subs.push({out, in: best});
        }
        return subs;
    }

    //the formation that gives the current Team the most ATT+DEF (for old saves)
    getBestFormation(){
        let current = this.formation;
        let best = Formations.default, bestValue = null;
        for(let key of Formations.keys()){
            this.formation = key;
            let stats = this.getCombinedStats();
            let value = stats.attack.add(stats.defense);
            if(bestValue === null || value.gt(bestValue)){
                best = key;
                bestValue = value;
            }
        }
        this.formation = current;
        return best;
    }

    canPlayNextMatch(){
        return this.getActivePlayingPlayers().length > 0;
    }

    resetDivisionStats(){
        this.divisionStats = {
            win: 0,
            draw: 0,
            lose: 0,
            goalsShot: 0,
            goalsOpponent: 0
        };
    }

    load(obj){
        this.divisionStats = obj.divisionStats;
        if(obj.isPlayerTeam){
            this.name = obj.name;
            this.players = [];
            this.strategy = obj.strategy;
            this.aggressivity = obj.aggressivity;
            //null for saves from before formations: the game picks one after loading
            this.formation = Formations.list[obj.formation] ? obj.formation : null;
            for(let p of obj.players){
                let player = new Player(p.name, p.attack, p.defense, p.aggressivity, p.stamina, p.active);
                player.load(p);
                this.players.push(player);
            }
        }
        else{
            this.players = this.generatePlayers();
        }
    }
}