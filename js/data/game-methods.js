let functions = {
    formatNumber(n, prec = 2, prec1000 = 0, lim = 1e6){
        if(typeof n === "number"){
            n = new Decimal(n);
        }
        if(!["Standard", "Letters", "Scientific", "Engineering"].includes(game.numberFormatter.name)){
            lim = 0;
        }
        return n.lt(lim) ? n.toNumber().toLocaleString("en-US", {minimumFractionDigits: prec1000, maximumFractionDigits: prec1000})
            : game.numberFormatter.format(n, prec, prec1000);
    },
    formatTime(s){
        let times = [Math.floor(s / 60), Math.floor(s) % 60];
        return times.map(t => t.toString().padStart(2, "0")).join(":");
    },
    //saves from before positions: the starting XI keeps its strength. Its players get the places of a 4-4-2
    //from most defensive (keeper) to most attacking; everyone else gets a position from their stats
    introducePositions(){
        let team = game.team;
        let byShare = list => Array.from(list).sort((a, b) => Positions.attackShare(a) - Positions.attackShare(b));
        team.formation = Formations.default;
        let active = byShare(team.getActivePlayers());
        if(active.length === 11){
            let places = Formations.places(team.formation);
            active.forEach((p, i) => p.position = places[i]);
        }
        else{
            let squad = byShare(active.length > 0 ? active : team.players.concat(game.training.players));
            if(squad.length > 0){
                squad[0].position = "GK";
            }
        }
    },
    getSaveString(){
        let json = JSON.stringify(game, (key, value) => {
            if(key === "numberFormatter"){
                return value.name;
            }

            if(value instanceof Team){
                let isPlayerTeam = value === game.team;
                value = JSON.parse(JSON.stringify(value)); //clone
                if(isPlayerTeam){
                    value.isPlayerTeam = true;
                }
                else{
                    value.players = undefined;
                }
                return value;
            }
            else if(value instanceof Match){
                value.team1Idx = game.league.divisions[game.team.divisionRank].teams.findIndex(t => t === value.team1);
                value.team2Idx = game.league.divisions[game.team.divisionRank].teams.findIndex(t => t === value.team2);
            }
            else if(value instanceof AbstractUpgrade){
                return {level: value.level};
            }
            return value;
        });

        return btoa(unescape(encodeURIComponent(json)));
    },
    saveGame(){
        localStorage.setItem("idleSoccerManager", this.getSaveString());
    },
    loadGame(str){
        let loadVal = (v, alt) => v ? v : alt;

        str = str || localStorage.getItem("idleSoccerManager");
        if(str){
            let json;
            try{
                json = decodeURIComponent(escape(atob(str)));
            }
            catch(e){
                console.warn(e);
                return false;
            }
            let obj = JSON.parse(json, (key, value) => {
                if(typeof value === "string" && !isNaN(value) && !isNaN(parseFloat(value)) && !isNaN(new Decimal(value))){
                    return new Decimal(value);
                }
                return value;
            });

            game.money = loadVal(obj.money, new Decimal(25000));
            game.maxDivisionRank = loadVal(obj.maxDivisionRank, 0);
            game.country = loadVal(obj.country, 0);
            game.canEnterNextCountry = loadVal(obj.canEnterNextCountry, false);
            game.matchHistory = obj.matchHistory || [];
            game.seasonArchive = obj.seasonArchive || [];
            game.lastSeason = obj.lastSeason || null;
            game.showSeasonSummary = false;
            game.records = Object.assign(Match.emptyRecords, obj.records || {});
            game.records.money = new Decimal(game.records.money);

            if(obj.league){
                for(let d = 0; d < obj.league.divisions.length; d++){
                    for(let t = 0; t < obj.league.divisions[d].teams.length; t++){
                        let tObj = obj.league.divisions[d].teams[t];
                        let team = new Team(tObj.name, [], tObj.divisionRank, tObj.country, tObj.seed);
                        team.load(tObj);
                        game.league.divisions[d].teams[t] = team;
                        if(tObj.isPlayerTeam){
                            game.team = team;
                        }
                    }
                    game.league.divisions[d].load(obj.league.divisions[d]);
                }

                if(obj.team){
                    game.team.logo.load(obj.team.logo);
                }
            }

            if(obj.playerMarket){
                game.playerMarket.load(obj.playerMarket);
            }

            if(obj.stadium){
                game.stadium.load(obj.stadium);
            }

            if(obj.currentMatch){
                game.currentMatch = new Match();
                game.currentMatch.load(obj.currentMatch);
            }
            else{
                game.currentMatch = null;
            }
            if(obj.nextMatch){
                game.nextMatch = new Match();
                game.nextMatch.load(obj.nextMatch);
            }
            else{
                game.nextMatch = null;
            }

            if(obj.training){
                game.training.load(obj.training);
            }

            if(obj.academy){
                game.academy.load(obj.academy);
            }

            if(obj.career){
                game.career.load(obj.career);
            }

            if(game.team && game.team.formation === null){
                functions.introducePositions();
            }

            if(obj.tv){
                for(let i = 0; i < obj.tv.channels.length; i++){
                    game.tv.channels[i].bought = obj.tv.channels[i].bought;
                }
                for(let k of Object.keys(obj.tv.upgrades)){
                    game.tv.upgrades[k].level = obj.tv.upgrades[k].level;
                }
            }

            for(let k of Object.keys(obj.moneyUpgrades)){
                game.moneyUpgrades[k].level = obj.moneyUpgrades[k].level;
            }

            if(obj.achievements){
                for(let i = 0; i < obj.achievements.length; i++){
                    //keep working when achievement order changes
                    let ach = game.achievements.find(a => a.title === obj.achievements[i].title);
                    if(ach){
                        ach.completed = obj.achievements[i].completed;
                    }
                }
            }

            game.settings.match.speed = loadVal(obj.settings.match.speed, 1);
            game.settings.match.autoPlay = loadVal(obj.settings.match.autoPlay, false);
            game.settings.match.minAutoPlayStamina = loadVal(obj.settings.match.minAutoPlayStamina, 0);
            if(obj.settings.team){
                game.settings.team.refillPlayers = loadVal(obj.settings.team.refillPlayers, true);
                game.settings.team.autoSubstitute = obj.settings.team.autoSubstitute ?? false;
                game.settings.team.substituteStamina = obj.settings.team.substituteStamina ?? 0.5;
                game.settings.team.autoStrategy = obj.settings.team.autoStrategy ?? false;
                game.settings.team.autoStrategyMinute = obj.settings.team.autoStrategyMinute ?? 70;
            }
            if(obj.settings.players){
                game.settings.players.shiftToSell = loadVal(obj.settings.players.shiftToSell, false);
            }
            if(obj.settings.tv){
                game.settings.tv.renderCanvas = loadVal(obj.settings.tv.renderCanvas, false);
            }
            game.settings.term = loadVal(obj.settings.term, "Football");
            game.settings.notifications.matchEnd = obj.settings.notifications?.matchEnd ?? false;
            game.settings.notifications.seasonEnd = obj.settings.notifications?.seasonEnd ?? false;
            game.settings.theme = obj.settings.theme ?? "light";
            if(obj.numberFormatter){
                let notation = notations.find(n => n.name === obj.numberFormatter);
                if(notation){
                    game.numberFormatter = notation;
                }
            }
        }

        return true;
    }
};