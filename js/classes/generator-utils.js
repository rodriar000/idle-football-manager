class GeneratorUtils {
    //without a position the player's position comes from their stats
    static generatePlayer(seed, minStat, maxStat, active, marketValue = new Decimal(0), position = null) {
        let r = new Random(seed);
        let weight = 0.2 + 0.6 * r.nextDouble();
        if(position){
            let [from, to] = Positions.shares[position];
            weight = from + (to - from) * (weight - 0.2) / 0.6;
        }
        let attack = minStat.add((maxStat.sub(minStat)).mul(r.nextDouble())).mul(2 * weight);
        let defense = minStat.add((maxStat.sub(minStat)).mul(r.nextDouble())).mul(2 * (1 - weight));
        let aggressivity = 0.5 + 1.5 * r.nextDouble();
        let stamina = 0.5 + 1.5 * r.nextDouble();
        let name = Utils.capitalize(firstNames[r.nextInt(firstNames.length)]) + " "
                    + Utils.capitalize(lastNames[r.nextInt(lastNames.length)]);
        let player = new Player(name, attack, defense, aggressivity, stamina, active, marketValue, position);
        player.age = 18 + Math.floor(16 * r.nextDouble() ** 1.3);
        player.retireAge = Math.max(player.age + 1, 33 + r.nextInt(5));
        if(!player.position){
            player.position = Positions.fromShare(Positions.attackShare(player));
        }
        return player;
    }

    static generateTeam(seed, rank, country) {
        let r = new Random(seed);
        let teamSeed = r.nextInt();

        let placeSuffixes = ["berg", "heim", "ton", "dorf", "creek", "fort"];
        let nameSuffixes = ["Club", "Kickers", "Undertakers", "United", "City", "FC", "Dreamers", "Runners", "Warriors"];
        let namePrefix = Utils.capitalize(nouns[r.nextInt(nouns.length)]) + placeSuffixes[r.nextInt(placeSuffixes.length)];
        let nameSuffix = nameSuffixes[r.nextInt(nameSuffixes.length)];
        let team = new Team(namePrefix + " " + nameSuffix, [], rank, country, teamSeed);
        team.players = team.generatePlayers();
        return team;
    }

    static generateDivision(seed, rank, country) {
        let r = new Random(seed);
        let teams = [];
        for(let i = 0; i < 10; i++) {
            teams.push(GeneratorUtils.generateTeam(r.nextInt(), rank, country));
        }
        return new Division(rank, country, teams);
    }

    static generateLeague(seed, country) {
        let r = new Random(seed + country);
        let divisions = [];
        for(let i = 0; i < 10; i++){
            divisions.push(GeneratorUtils.generateDivision(r.nextInt(), i, country));
        }
        return new League(divisions);
    }

    //typical stat of a player in this Division (the middle of what its clubs are generated with)
    static getStatLevel(rank, country){
        let normRank = GeneratorUtils.getNormRank(rank, country);
        let stat = Decimal.pow(16, normRank + 0.5);
        stat = stat.mul(new Decimal(17 / 16).pow(Math.max(0, normRank - 4)).add(1));
        stat = stat.mul(new Decimal(20 / 17).pow(Math.max(0, normRank - 12)).add(1));
        stat = stat.mul(new Decimal(1.1).pow(Decimal.pow(1.01, Decimal.max(0, normRank - 50))));
        return stat.mul(1.125);
    }

    static getNormRank(rank, country){
        let power = Math.max(10 * country + rank - 40, 0);
        return (10 * country + rank) * 1.01 ** power;
    }
}