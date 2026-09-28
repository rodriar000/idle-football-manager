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
        this.managerXp = 0; //used for display
        this.staffWages = new Decimal(0); //used for display
        this.playerWages = new Decimal(0); //used for display
        this.injuries = []; //used for display: {name, matches}
        this.suspensions = []; //used for display: names out for 5 yellow cards
        this.sponsorPay = new Decimal(0); //used for display
        this.sponsorsReached = []; //used for display
        this.offerNote = ""; //used for display: a new bid for one of your players
        this.cup = null; //the Continental Cup round, null for league matches
        this.domestic = null; //the National Cup round, null for other matches
        this.playoff = null; //the promotion play-off round, null for other matches
        this.penalties = null; //[team1, team2] when a cup match ends level
        this.worldCup = null; //the World Cup step, null for other matches
        this.qualifier = null; //the World Cup qualifying round, null for other matches
        this.worldCupLine = ""; //used for display: where the World Cup match left you
        this.playoffLine = ""; //used for display: where the play-off match left you

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

    addYellowCard(team, player, minute){
        let teamIndex = team === this.team2 ? 1 : 0;
        let second = this.gameEvents.some(e => e.event === 5 && e.teamIndex === teamIndex && e.name === player.name);
        this.gameEvents.push({teamIndex, event: 5, name: player.name, minute});
        if(team === game.team){
            player.yellows = (player.yellows || 0) + 1;
        }
        //a second yellow is a red
        if(second){
            this.addRedCard(team, player, minute);
        }
    }

    //only your players get injured: out for 1 to 4 matches, the physio makes it shorter
    addInjury(team, player, minute){
        let matches = 1 + Math.floor(4 * Math.random() ** 1.6);
        matches = Math.max(1, matches - Math.floor(game.staff.stars("physio") / 2));
        player.injury = matches + 1; //counted down at the end of this match
        this.gameEvents.push({teamIndex: team === this.team2 ? 1 : 0, event: 4, name: player.name, minute});
        this.injuries.push({name: player.name, matches});
        //the auto substitution brings someone on
        if(game.settings.team.autoSubstitute){
            let bench = team.getInactivePlayers().filter(p => !p.isUnavailable());
            if(bench.length){
                let best = team.getBestFor(player.position, bench);
                player.active = false;
                best.active = true;
                this.addSubstitution(team, player, best, minute);
            }
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
        //home advantage: the home side (team1) plays about 12 % stronger, the World Cup is on neutral ground
        if(this.worldCup === null && att1 > 0){
            att1 += Match.homeAdvantage;
            def1 += Match.homeAdvantage;
        }

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
            p.injury = Math.max(0, (p.injury || 0) - 1);
        }
        //5 yellow cards in a Season: out for the next match
        let own = this.getPlayerTeam();
        if(own){
            for(let p of own.players.filter(p => p.yellows >= 5)){
                p.yellows -= 5;
                p.redCard = Math.max(p.redCard, 1);
                this.suspensions.push(p.name);
            }
        }
        if(this.cup !== null || this.domestic !== null){
            this.endCupGame();
            return;
        }
        if(this.playoff !== null){
            this.endPlayoffGame();
            return;
        }
        if(this.worldCup !== null || this.qualifier !== null){
            this.endWorldCupGame();
            return;
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
            let reward = game.stadium.getPaidMoney().mul(game.career.mul("tickets"));
            game.money = game.money.add(reward);
            this.stadiumReward = reward;
            game.stadium.emptyStadium();
            this.addToHistory();
            Match.updateRecords(game.matchHistory[game.matchHistory.length - 1], game.league.divisions[this.divisionRank].getName());
            let ownIndex = this.team1 === playerTeam ? 0 : 1;
            let own = ownIndex === 0 ? this.score1 : this.score2, other = ownIndex === 0 ? this.score2 : this.score1;
            this.managerXp = ManagerCareer.matchXp(own, other);
            game.career.addXp(this.managerXp);
            this.paySponsors();
            let offer = game.world.afterMatch();
            this.offerNote = offer ? offer.club + " bid " + functions.formatNumber(offer.amount) + " $ for " + offer.player.name : "";

            for(let p of playerTeam.getActivePlayers()){
                if(p.isUnavailable()){
                    p.active = false;
                }
            }

            if(game.settings.team.refillPlayers){
                playerTeam.refillPlayers();
            }

            if(game.league.divisions[playerTeam.divisionRank].hasEnded()){
                //3rd to 6th: the promotion play-off comes first, the Season ends after it
                if(!game.playoff.start()){
                    Match.endSeason();
                    seasonEnded = true;
                }
            }
            else{
                game.league.simulate();
                game.cup.check();
                game.nationalCup.check();
                game.worldCup.checkQualifier();
            }
            game.money = game.money.add(this.getRewardMoney());
            //the staff take their wages from every match
            this.payWages();

            if(seasonEnded){
                gameNotifications.seasonEnded(game.lastSeason);
            }
            else{
                gameNotifications.matchEnded(this);
            }
        }

        this.ended = true;
    }

    //the staff and your players take their wages from every match
    payWages(){
        this.staffWages = Decimal.min(game.money, game.staff.getWages());
        game.money = game.money.sub(this.staffWages);
        this.playerWages = Decimal.min(game.money, PlayerWages.getBill());
        game.money = game.money.sub(this.playerWages);
    }

    paySponsors(){
        let paid = game.sponsors.payMatch();
        this.sponsorPay = paid.fees.add(paid.bonus);
        this.sponsorsReached = paid.reached;
    }

    //the cup this match is for
    getCup(){
        return this.domestic !== null ? game.nationalCup : this.cup !== null ? game.cup : null;
    }

    getCupRound(){
        return this.domestic !== null ? this.domestic : this.cup;
    }

    //Continental and National Cup: no table, a level score goes to penalties and the league match comes next
    endCupGame(){
        if(this.score1 === this.score2){
            let power = this.getNormPower();
            this.penalties = Cup.penalties(power.team1, power.team2);
        }
        if(this.getPlayerTeam()){
            let playerTeam = this.getPlayerTeam();
            game.stadium.changeFans(this.getGameResult());
            let reward = game.stadium.getPaidMoney().mul(game.career.mul("tickets"));
            game.money = game.money.add(reward);
            this.stadiumReward = reward;
            game.stadium.emptyStadium();
            let ownIndex = this.team1 === playerTeam ? 0 : 1;
            let own = ownIndex === 0 ? this.score1 : this.score2, other = ownIndex === 0 ? this.score2 : this.score1;
            Match.updateRecords({
                team1: this.team1.name, team2: this.team2.name, score1: this.score1, score2: this.score2, ownIndex,
                result: this.getGameResult(),
                goals: this.gameEvents.filter(e => e.event === 0).map(e => ({teamIndex: e.teamIndex, name: e.name, minute: e.minute})),
                reward: this.getRewardMoney().add(this.stadiumReward)
            }, this.getCup().name);
            this.managerXp = ManagerCareer.matchXp(own, other);
            game.career.addXp(this.managerXp);
            for(let p of playerTeam.getActivePlayers()){
                if(p.isUnavailable()){
                    p.active = false;
                }
            }
            if(game.settings.team.refillPlayers){
                playerTeam.refillPlayers();
            }
            game.money = game.money.add(this.getRewardMoney());
            this.payWages();
            this.getCup().finishOwnTie(this);
            this.paySponsors();
            gameNotifications.matchEnded(this);
        }
        this.ended = true;
    }

    //promotion play-off: a level score goes to penalties, and the Season ends when the play-off is over for you
    endPlayoffGame(){
        if(this.score1 === this.score2){
            let power = this.getNormPower();
            this.penalties = Cup.penalties(power.team1, power.team2);
        }
        if(this.getPlayerTeam()){
            let playerTeam = this.getPlayerTeam();
            game.stadium.changeFans(this.getGameResult());
            let reward = game.stadium.getPaidMoney().mul(game.career.mul("tickets"));
            game.money = game.money.add(reward);
            this.stadiumReward = reward;
            game.stadium.emptyStadium();
            let ownIndex = this.team1 === playerTeam ? 0 : 1;
            let own = ownIndex === 0 ? this.score1 : this.score2, other = ownIndex === 0 ? this.score2 : this.score1;
            Match.updateRecords({
                team1: this.team1.name, team2: this.team2.name, score1: this.score1, score2: this.score2, ownIndex,
                result: this.getGameResult(),
                goals: this.gameEvents.filter(e => e.event === 0).map(e => ({teamIndex: e.teamIndex, name: e.name, minute: e.minute})),
                reward: this.getRewardMoney().add(this.stadiumReward)
            }, "Promotion play-off");
            this.managerXp = ManagerCareer.matchXp(own, other);
            game.career.addXp(this.managerXp);
            for(let p of playerTeam.getActivePlayers()){
                if(p.isUnavailable()){
                    p.active = false;
                }
            }
            if(game.settings.team.refillPlayers){
                playerTeam.refillPlayers();
            }
            game.money = game.money.add(this.getRewardMoney());
            this.payWages();
            this.paySponsors();
            let more = game.playoff.finishOwnTie(this);
            let won = this.getGameResult() === MATCH_WIN;
            this.playoffLine = won ? (more ? "Through to the play-off final" : "Promoted through the play-off!") : "Out of the play-off in the " + PlayoffRounds.short[this.playoff];
            if(more){
                gameNotifications.matchEnded(this);
            }
            else{
                Match.endSeason();
                gameNotifications.seasonEnded(game.lastSeason);
            }
        }
        this.ended = true;
    }

    //World Cup: group games can end level, knockout games go to penalties; the league waits until it ends
    endWorldCupGame(){
        if(this.worldCup !== null && this.score1 === this.score2 && game.worldCup.isKnockout(this.worldCup)){
            let power = this.getNormPower();
            this.penalties = Cup.penalties(power.team1, power.team2);
        }
        if(this.getPlayerTeam()){
            let playerTeam = this.getPlayerTeam();
            let ownIndex = this.team1 === playerTeam ? 0 : 1;
            let own = ownIndex === 0 ? this.score1 : this.score2, other = ownIndex === 0 ? this.score2 : this.score1;
            Match.updateRecords({
                team1: this.getTeamName(0), team2: this.getTeamName(1), score1: this.score1, score2: this.score2, ownIndex,
                result: this.getGameResult(),
                goals: this.gameEvents.filter(e => e.event === 0).map(e => ({teamIndex: e.teamIndex, name: e.name, minute: e.minute})),
                reward: this.getRewardMoney()
            }, this.qualifier !== null ? "World Cup qualifying" : "World Cup");
            this.managerXp = ManagerCareer.matchXp(own, other);
            game.career.addXp(this.managerXp);
            for(let p of playerTeam.getActivePlayers()){
                if(p.isUnavailable()){
                    p.active = false;
                }
            }
            if(game.settings.team.refillPlayers){
                playerTeam.refillPlayers();
            }
            game.money = game.money.add(this.getRewardMoney());
            this.payWages();
            this.paySponsors();
            this.worldCupLine = this.qualifier !== null ? game.worldCup.finishOwnQualifier(this) : game.worldCup.finishOwnMatch(this);
            gameNotifications.matchEnded(this);
        }
        this.ended = true;
    }

    //in the World Cup your club plays as your nation
    getTeamName(index){
        let team = index === 0 ? this.team1 : this.team2;
        if((this.worldCup !== null || this.qualifier !== null) && team === game.team){
            return WorldCup.getOwnNation().name;
        }
        return team.name;
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
        if(ownScore === otherScore && this.penalties){
            let own = game.team === this.team1 ? 0 : 1;
            return this.penalties[own] > this.penalties[1 - own] ? MATCH_WIN : MATCH_LOSE;
        }
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
        if(this.cup !== null || this.domestic !== null){
            return result === MATCH_WIN ? this.getCup().getPrize(this.getCupRound()) : rewards.lose;
        }
        if(this.playoff !== null){
            return result === MATCH_WIN ? game.playoff.getPrize(this.playoff) : rewards.lose;
        }
        if(this.worldCup !== null || this.qualifier !== null){
            let step = this.worldCup !== null ? this.worldCup : 0;
            return result === MATCH_WIN ? game.worldCup.getPrize(step) : result === MATCH_DRAW ? rewards.draw : rewards.lose;
        }
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

                for(let team of [this.team1, this.team2]){
                    let yellow = team.getRedCardChance() * 7;
                    for(let p of team.getActivePlayingPlayers()){
                        if(Math.random() < yellow * p.aggressivity * dt * tm){
                            this.addYellowCard(team, p, this.getMinute());
                        }
                    }
                }
                let ownTeam = this.getPlayerTeam();
                for(let p of ownTeam.getActivePlayingPlayers()){
                    if(Math.random() < Match.injuryChance * dt * tm){
                        this.addInjury(ownTeam, p, this.getMinute());
                    }
                }

                for(let p of this.getPlayerTeam().getActivePlayingPlayers()){
                    p.currentStamina = Math.max(0, p.currentStamina - Math.random() * 3e-5 * dt * tm * (1 / p.stamina) * game.staff.tireMul());
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
        this.managerXp = Number(obj.managerXp) || 0;
        this.staffWages = obj.staffWages || new Decimal(0);
        this.playerWages = obj.playerWages || new Decimal(0);
        this.injuries = obj.injuries || [];
        this.suspensions = obj.suspensions || [];
        this.sponsorPay = obj.sponsorPay || new Decimal(0);
        this.sponsorsReached = obj.sponsorsReached || [];
        this.offerNote = obj.offerNote || "";
        if(obj.cup !== undefined && obj.cup !== null){
            this.cup = Number(obj.cup);
            this.team1 = game.cup.getTeam(obj.team1Cup);
            this.team2 = game.cup.getTeam(obj.team2Cup);
            this.penalties = obj.penalties || null;
        }
        if(obj.domestic !== undefined && obj.domestic !== null){
            this.domestic = Number(obj.domestic);
            this.team1 = game.nationalCup.getTeam(obj.team1Dc);
            this.team2 = game.nationalCup.getTeam(obj.team2Dc);
            this.penalties = obj.penalties || null;
        }
        if(obj.playoff !== undefined && obj.playoff !== null){
            this.playoff = Number(obj.playoff);
            this.penalties = obj.penalties || null;
        }
        if(obj.worldCup !== undefined && obj.worldCup !== null){
            this.worldCup = Number(obj.worldCup);
            this.team1 = game.worldCup.getTeam(obj.team1Wc);
            this.team2 = game.worldCup.getTeam(obj.team2Wc);
            this.penalties = obj.penalties || null;
        }
        if(obj.qualifier !== undefined && obj.qualifier !== null){
            this.qualifier = Number(obj.qualifier);
            this.team1 = game.worldCup.getQualTeam(obj.team1Wq);
            this.team2 = game.worldCup.getQualTeam(obj.team2Wq);
        }
        this.worldCupLine = obj.worldCupLine || "";
        this.playoffLine = obj.playoffLine || "";
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

    static get homeAdvantage(){
        return 0.05;
    }

    //per player and second of play: about one injury in four matches
    static get injuryChance(){
        return 0.25 / (11 * 5400);
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
            seasons: 0, promotions: 0, titles: 0, cups: 0, cupFinals: 0, bestSaleRatio: 0, worldCups: 0, worldCupFinals: 0
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
    //the league (and your play-off) is over: summary, teams move, the new Season is drawn
    static endSeason(){
        if(game.league.divisions[game.team.divisionRank].getSortedTeams()[0] === game.team && game.team.divisionRank === game.league.divisions.length - 1){
            game.canEnterNextCountry = true;
        }
        Match.createSeasonSummary();
        game.lastSeason.sponsors = game.sponsors.endSeason(game.lastSeason);
        game.league.moveTeams();
        game.lastSeason.playoff = game.playoff.getNews();
        game.lastSeason.world = game.world.endSeason();
        game.lastSeason.academy = game.academy.endSeason();
        game.lastSeason.staff = game.staff.endSeason();
        game.lastSeason.cup = game.cup.endSeason();
        game.lastSeason.nationalCup = game.nationalCup.endSeason();
        game.sponsors.makeOffers();
        game.lastSeason.managerXp = ManagerCareer.seasonXp(game.lastSeason.outcome) + game.lastSeason.cup.xp + game.lastSeason.nationalCup.xp;
        game.career.addXp(game.lastSeason.managerXp);
        game.playerMarket.refresh();
        game.team.players.forEach(p => p.yellows = 0);
        game.lastSeason.worldCup = game.worldCup.afterSeason();
    }

    static createSeasonSummary(){
        let division = game.league.divisions[game.team.divisionRank];
        let sorted = division.getSortedTeams();
        let position = sorted.indexOf(game.team) + 1;
        let outcome = "stayed";
        if(position <= division.getPromotionRanks() || (game.playoff.season === game.records.seasons + 1 && game.playoff.hasWon())){
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
        let m = new Match(match.team1, match.team2, match.divisionRank);
        m.cup = match.cup ?? null;
        m.domestic = match.domestic ?? null;
        m.playoff = match.playoff ?? null;
        m.worldCup = match.worldCup ?? null;
        m.qualifier = match.qualifier ?? null;
        return m;
    }
}