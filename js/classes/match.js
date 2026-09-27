const MATCH_LOSE = -1, MATCH_DRAW = 0, MATCH_WIN = 1;

class Match {
    constructor(team1, team2, divisionRank){
        this.divisionRank = divisionRank;
        this.time = 0;
        this.timeScale = 1;
        this.team1 = team1;
        this.team2 = team2;
        this.score1 = 0;
        this.score2 = 0;
        this.powerMulti = [1, 1];
        this.powerMultiFreq = [600 + 1800 * Math.random(), 600 + 1800 * Math.random()];
        this.ended = false;

        this.gameEvents = []; //recorded goals
        this.stadiumReward = new Decimal(0); //used for display

        this.ballX = 0; //-1 to 1
        this.ballSpeed = 0;

        this.baseStrategy = null; //strategy chosen by the player while auto strategy has changed it
    }

    addGoal(team, player, minute){
        //every player of the team can be sent off
        let name = player ? player.name : "Own Goal";
        this.gameEvents.push({teamIndex: team === this.team2 ? 1 : 0, event: 0, name, minute});
    }

    addSubstitution(team, playerOut, playerIn, minute){
        this.gameEvents.push({teamIndex: team === this.team2 ? 1 : 0, event: 2, name: playerIn.name, nameOut: playerOut.name, minute});
    }

    checkSubstitutions(){
        let settings = game.settings.team;
        let team = this.getPlayerTeam();
        if(!team || !settings.autoSubstitute){
            return;
        }
        for(let sub of team.substituteTiredPlayers(settings.substituteStamina)){
            this.addSubstitution(team, sub.out, sub.in, this.getMinute());
        }
    }

    //late in the match: defend a lead, attack when behind, back to the chosen strategy when level
    checkAutoStrategy(){
        let settings = game.settings.team;
        let team = this.getPlayerTeam();
        if(!team || !settings.autoStrategy || this.getMinute() < settings.autoStrategyMinute){
            return;
        }
        if(this.baseStrategy === null){
            this.baseStrategy = team.strategy;
        }
        let own = team === this.team1 ? this.score1 : this.score2;
        let other = team === this.team1 ? this.score2 : this.score1;
        let wanted = own > other ? Strategy.DEFENSIVE : own < other ? Strategy.OFFENSIVE : this.baseStrategy;
        if(team.strategy !== wanted){
            team.strategy = wanted;
            let name = {[Strategy.NORMAL]: "Neutral", [Strategy.OFFENSIVE]: "Offensive", [Strategy.DEFENSIVE]: "Defensive"}[wanted];
            this.gameEvents.push({teamIndex: team === this.team2 ? 1 : 0, event: 3, name: "Strategy: " + name, minute: this.getMinute()});
        }
    }

    restoreStrategy(){
        let team = this.getPlayerTeam();
        if(team && this.baseStrategy !== null){
            team.strategy = this.baseStrategy;
            this.baseStrategy = null;
        }
    }

    addRedCard(team, player, minute){
        this.gameEvents.push({teamIndex: team === this.team2 ? 1 : 0, event: 1, name: player.name, minute});
        player.redCard = 2;
    }

    getNormPower() {
        let att1 = this.team1.getCombinedAttack(), def1 = this.team1.getCombinedDefense();
        let att2 = this.team2.getCombinedAttack(), def2 = this.team2.getCombinedDefense();

        att1 = att1.eq(0) ? 0 : att1.log10();
        att2 = att2.eq(0) ? 0 : att2.log10();
        def1 = def1.eq(0) ? 0 : def1.log10();
        def2 = def2.eq(0) ? 0 : def2.log10();

        let team1 = 1 + Math.max(0, (att1 - def2));
        let team2 = 1 + Math.max(0, (att2 - def1));

        return {
            team1: (att1 - def2 > 0 ? team1 : 1 / team2) ** 0.325,
            team2: (att2 - def1 > 0 ? team2 : 1 / team1) ** 0.325
        };
    }

    getPlayerTeam(){
        if(this.team1 === game.team){
            return this.team1;
        }
        else if(this.team2 === game.team){
            return this.team2;
        }
        return null;
    }

    //used for goal display
    getMinute(){
        return Math.ceil(this.time / 60);
    }

    endGame() {
        this.restoreStrategy();
        for(let p of this.team1.players.concat(this.team2.players)){
            p.redCard = Math.max(0, p.redCard - 1);
        }

        if(this.score1 > this.score2) {
            this.team1.divisionStats.win++;
            this.team2.divisionStats.lose++;
        }
        else if(this.score2 > this.score1) {
            this.team2.divisionStats.win++;
            this.team1.divisionStats.lose++;
        }
        else {
            this.team1.divisionStats.draw++;
            this.team2.divisionStats.draw++;
        }
        this.team1.divisionStats.goalsShot += this.score1;
        this.team1.divisionStats.goalsOpponent += this.score2;
        this.team2.divisionStats.goalsShot += this.score2;
        this.team2.divisionStats.goalsOpponent += this.score1;

        let seasonEnded = false;
        if(this.getPlayerTeam()){
            let playerTeam = this.getPlayerTeam();

            game.stadium.changeFans(this.getGameResult());
            let reward = game.stadium.getPaidMoney();
            game.money = game.money.add(reward);
            this.stadiumReward = reward;
            game.stadium.emptyStadium();
            this.addToHistory();
            Match.updateRecords(game.matchHistory[game.matchHistory.length - 1], game.league.divisions[this.divisionRank].getName());

            for(let p of playerTeam.getActivePlayers()){
                if(p.hasRedCard()){
                    p.active = false;
                }
            }

            if(game.settings.team.refillPlayers){
                playerTeam.refillPlayers();
            }

            if(game.league.divisions[playerTeam.divisionRank].hasEnded()){
                if(game.league.divisions[game.team.divisionRank].getSortedTeams()[0] === game.team && playerTeam.divisionRank === game.league.divisions.length - 1){
                    game.canEnterNextCountry = true;
                }
                Match.createSeasonSummary();
                seasonEnded = true;
                game.league.moveTeams();
                game.lastSeason.academy = game.academy.endSeason();
                game.playerMarket.refresh();
            }
            else{
                game.league.simulate();
            }
            game.money = game.money.add(this.getRewardMoney());

            if(seasonEnded){
                gameNotifications.seasonEnded(game.lastSeason);
            }
            else{
                gameNotifications.matchEnded(this);
            }
        }

        this.ended = true;
    }

    simulate() {
        let power = this.getNormPower();
        for(let mins = 0; mins < 90; mins++){
            this.score1 += Math.random() < power.team1 ** 2.75 / 90;
            this.score2 += Math.random() < power.team2 ** 2.75 / 90;
        }
        this.endGame();
    }

    //win / draw / lose chances for team1 from the current score and minute.
    //Live matches don't use simulate()'s formula: measured over many simulated live matches (x60 to x3000 speed, 14 team pairings),
    //a team scores about 1.42 * (ownPower / otherPower) ^ 3.18 goals per 90 minutes
    getOutcomeChances(){
        let power = this.getNormPower();
        let goalsPerMinute = (own, other) => 1.42 * (own / other) ** 3.18 / 90;
        let remaining = this.ended ? 0 : Math.max(0, 90 - Math.floor(this.time / 60));
        let goalDistribution = q => {
            q = Math.min(1, q);
            let dist = [1];
            for(let m = 0; m < remaining; m++){
                let next = new Array(dist.length + 1).fill(0);
                for(let g = 0; g < dist.length; g++){
                    next[g] += dist[g] * (1 - q);
                    next[g + 1] += dist[g] * q;
                }
                dist = next;
            }
            return dist;
        };
        let d1 = goalDistribution(goalsPerMinute(power.team1, power.team2));
        let d2 = goalDistribution(goalsPerMinute(power.team2, power.team1));
        let chances = {win: 0, draw: 0, lose: 0};
        for(let g1 = 0; g1 < d1.length; g1++){
            for(let g2 = 0; g2 < d2.length; g2++){
                let diff = (this.score1 + g1) - (this.score2 + g2);
                chances[diff > 0 ? "win" : diff < 0 ? "lose" : "draw"] += d1[g1] * d2[g2];
            }
        }
        return chances;
    }

    getGameResult(){
        let ownScore = game.team === this.team1 ? this.score1 : this.score2;
        let otherScore = game.team === this.team1 ? this.score2 : this.score1;
        if(ownScore > otherScore){
            return MATCH_WIN;
        }
        else if(ownScore === otherScore){
            return MATCH_DRAW;
        }
        else{
            return MATCH_LOSE;
        }
    }

    getRewardMoney(){
        let rewards = game.league.divisions[this.divisionRank].getRewards();
        let result = this.getGameResult();
        if(result === MATCH_WIN){
            return rewards.win;
        }
        else if(result === MATCH_DRAW){
            return rewards.draw;
        }
        return rewards.lose;
    }

    tick(dt) {
        if(!this.ended){
            let power = this.getNormPower();
            for(let i = 0; i < Math.min(60, this.timeScale); i++) {
                dt = Math.min(1 / 30, dt);
                let tm = Math.max(1, this.timeScale / 60);
                this.time += dt * tm;

                for(let i = 0; i < this.powerMulti.length; i++) {
                    this.powerMulti[i] = 1 + 0.5 * Math.sin(this.time / this.powerMultiFreq[i] * 2 * Math.PI);
                }

                if(Math.random() < 0.04 * dt * tm) {
                    let pow = Math.random() < 0.1 ? 3 * (Math.random() < 0.1 ? 3 : 1) : 1;
                    let pow2 = this.ballX <= -0.8 ? 4 : 1;
                    this.ballSpeed += power.team1 * 0.1 * pow * pow2 * this.powerMulti[0];
                }
                if(Math.random() < 0.04 * dt * tm) {
                    let pow = Math.random() < 0.1 ? 3 * (Math.random() < 0.1 ? 3 : 1) : 1;
                    let pow2 = this.ballX >= 0.8 ? 4 : 1;
                    this.ballSpeed -= power.team2 * 0.1 * pow * pow2 * this.powerMulti[1];
                }

                if(this.team1.getActivePlayingPlayers().length > 0){
                    for(let p of this.team1.getActivePlayingPlayers()){
                        if(Math.random() < this.team1.getRedCardChance() * p.aggressivity * dt * tm){
                            this.addRedCard(this.team1, p, this.getMinute());
                        }
                    }
                }
                if(this.team2.getActivePlayingPlayers().length > 0){
                    for(let p of this.team2.getActivePlayingPlayers()){
                        if(Math.random() < this.team2.getRedCardChance() * p.aggressivity * dt * tm){
                            this.addRedCard(this.team2, p, this.getMinute());
                        }
                    }
                }

                for(let p of this.getPlayerTeam().getActivePlayingPlayers()){
                    p.currentStamina = Math.max(0, p.currentStamina - Math.random() * 3e-5 * dt * tm * (1 / p.stamina));
                }
                this.checkSubstitutions();
                this.checkAutoStrategy();

                this.ballX += this.ballSpeed * dt;
                this.ballSpeed *= 0.2 ** dt;

                if(this.ballX <= -1) {
                    this.addGoal(this.team2, this.team2.getActivePlayingPlayers()[Math.floor(Math.random() * this.team2.getActivePlayingPlayers().length)], this.getMinute());
                    this.score2++;
                    this.ballX = 0;
                }
                else if(this.ballX >= 1) {
                    this.addGoal(this.team1, this.team1.getActivePlayingPlayers()[Math.floor(Math.random() * this.team1.getActivePlayingPlayers().length)], this.getMinute());
                    this.score1++;
                    this.ballX = 0;
                }

                if(this.time >= 60 * 90){
                    this.endGame();
                    break;
                }
            }
        }
    }

    load(obj){
        this.divisionRank = obj.divisionRank;
        this.time = obj.time;
        this.timeScale = obj.timeScale;
        this.ballX = obj.ballX;
        this.score1 = obj.score1;
        this.score2 = obj.score2;
        this.team1 = game.league.divisions[this.divisionRank].teams[obj.team1Idx];
        this.team2 = game.league.divisions[this.divisionRank].teams[obj.team2Idx];
        this.powerMulti = obj.powerMulti;
        this.powerMultiFreq = obj.powerMultiFreq;
        this.gameEvents = obj.gameEvents;
        this.stadiumReward = obj.stadiumReward || new Decimal(0);
        this.ended = obj.ended;
        this.baseStrategy = obj.baseStrategy ?? null;
    }

    //remember the player's matches of the current season
    addToHistory(){
        let ownIndex = this.team1 === game.team ? 0 : 1;
        game.matchHistory.push({
            matchDay: game.league.divisions[this.divisionRank].matchDay,
            team1: this.team1.name,
            team2: this.team2.name,
            score1: this.score1,
            score2: this.score2,
            ownIndex,
            result: this.getGameResult(),
            goals: this.gameEvents.filter(e => e.event === 0).map(e => ({teamIndex: e.teamIndex, name: e.name, minute: e.minute})),
            reward: this.getRewardMoney().add(this.stadiumReward)
        });
    }

    static get emptyRecords(){
        return {
            matches: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0,
            money: new Decimal(0),
            biggestWin: null,
            winStreak: 0, bestWinStreak: 0,
            unbeatenStreak: 0, bestUnbeatenStreak: 0,
            scorers: {},
            seasons: 0, promotions: 0, titles: 0
        };
    }

    //all time club records, updated after every match of the player's team
    static updateRecords(entry, divisionName){
        let r = game.records;
        let own = entry.ownIndex === 0 ? entry.score1 : entry.score2;
        let other = entry.ownIndex === 0 ? entry.score2 : entry.score1;
        r.matches++;
        r.goalsFor += own;
        r.goalsAgainst += other;
        r.money = r.money.add(entry.reward);
        if(entry.result === MATCH_WIN){
            r.wins++;
            r.winStreak++;
            let best = r.biggestWin;
            if(!best || own - other > best.own - best.other || (own - other === best.own - best.other && own > best.own)){
                r.biggestWin = {own, other, opponent: entry.ownIndex === 0 ? entry.team2 : entry.team1, division: divisionName};
            }
        }
        else{
            r.winStreak = 0;
            if(entry.result === MATCH_DRAW){
                r.draws++;
            }
            else{
                r.losses++;
            }
        }
        r.unbeatenStreak = entry.result === MATCH_LOSE ? 0 : r.unbeatenStreak + 1;
        r.bestWinStreak = Math.max(r.bestWinStreak, r.winStreak);
        r.bestUnbeatenStreak = Math.max(r.bestUnbeatenStreak, r.unbeatenStreak);
        for(let g of entry.goals.filter(g => g.teamIndex === entry.ownIndex && g.name !== "Own Goal")){
            r.scorers[g.name] = (r.scorers[g.name] || 0) + 1;
        }
    }

    //called before teams are promoted / relegated
    static createSeasonSummary(){
        let division = game.league.divisions[game.team.divisionRank];
        let sorted = division.getSortedTeams();
        let position = sorted.indexOf(game.team) + 1;
        let outcome = "stayed";
        if(position <= division.getPromotionRanks()){
            outcome = "promoted";
        }
        else if(position > sorted.length - division.getRelegationRanks()){
            outcome = "relegated";
        }
        else if(position === 1){
            outcome = "champion";
        }
        let scorers = {};
        for(let m of game.matchHistory){
            for(let g of m.goals.filter(g => g.teamIndex === m.ownIndex)){
                scorers[g.name] = (scorers[g.name] || 0) + 1;
            }
        }
        game.seasonArchive.push({
            country: game.country,
            divisionName: division.getName(),
            divisionNumber: game.league.divisions.length - division.rank,
            position,
            teams: sorted.length,
            outcome,
            points: game.team.getPoints(),
            win: game.team.divisionStats.win,
            draw: game.team.divisionStats.draw,
            lose: game.team.divisionStats.lose,
            goalsShot: game.team.divisionStats.goalsShot,
            goalsOpponent: game.team.divisionStats.goalsOpponent
        });
        game.lastSeason = {
            divisionName: division.getName(),
            divisionNumber: game.league.divisions.length - division.rank,
            position,
            teams: sorted.length,
            outcome,
            stats: Object.assign({}, game.team.divisionStats),
            points: game.team.getPoints(),
            money: game.matchHistory.reduce((sum, m) => sum.add(m.reward), new Decimal(0)),
            podium: sorted.slice(0, 3).map(t => ({name: t.name, points: t.getPoints(), own: t === game.team})),
            topScorers: Object.entries(scorers).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, goals]) => ({name, goals}))
        };
        game.records.seasons++;
        if(outcome === "promoted"){
            game.records.promotions++;
        }
        if(position === 1){
            game.records.titles++;
        }
        game.showSeasonSummary = true;
        game.matchHistory = [];
    }

    static from(match){
        return new Match(match.team1, match.team2, match.divisionRank);
    }
}