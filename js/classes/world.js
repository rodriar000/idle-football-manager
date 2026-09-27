//Living world: rival clubs bid for your players (and you can negotiate), sign players from the Market,
//and invest or fall back every Season, so the league table changes from Season to Season.
class TransferOffer{
    constructor(club = null, player = null){
        this.club = club ? club.name : "";
        this.player = player;
        this.amount = new Decimal(0);
        this.max = new Decimal(0); //the most the club would pay, hidden
        this.left = 3; //your matches until the offer ends
        this.counters = 0;
        this.message = "";
        if(player){
            let value = TransferOffer.getValue(player);
            this.amount = value.mul(1.1 + 0.7 * Math.random());
            this.max = this.amount.mul(1.1 + 0.5 * Math.random());
        }
    }

    //what the Market thinks the player is worth, training included
    static getValue(player){
        return player.getBasePrice().mul(player.trainingFactor.pow(0.8));
    }

    getClub(){
        for(let d of game.league.divisions){
            let t = d.teams.find(t => t.name === this.club);
            if(t){
                return t;
            }
        }
        return null;
    }
}

class World{
    constructor(){
        this.offers = [];
        this.news = []; //newest first: {icon, text, when}
        this.moves = {}; //club name -> strength change at the last Season end
    }

    when(){
        let d = game.league.divisions[game.team.divisionRank];
        return "Season " + (game.records.seasons + 1) + " · Matchday " + Math.max(1, d.matchDay);
    }

    addNews(icon, text){
        this.news = [{icon, text, when: this.when()}].concat(this.news).slice(0, 40);
    }

    //players rival clubs can bid for: not locked, and while a match runs not on the pitch
    getBiddable(){
        let running = game.currentMatch && !game.currentMatch.ended && game.currentMatch.time > 0;
        return game.team.players.filter(p => !p.locked && !(running && p.active) && !this.offers.some(o => o.player === p));
    }

    //a club of your Division or the one above, stronger players get more interest
    makeOffer(){
        let players = this.getBiddable().sort((a, b) => b.attack.add(b.defense).cmp(a.attack.add(a.defense)));
        if(players.length === 0){
            return null;
        }
        let player = players[Math.floor(Math.random() ** 2 * Math.min(players.length, 11))];
        let divisions = game.league.divisions;
        let rank = Math.min(divisions.length - 1, game.team.divisionRank + (Math.random() < 0.35 ? 1 : 0));
        let clubs = divisions[rank].teams.filter(t => t !== game.team);
        let club = clubs[Math.floor(Math.random() * clubs.length)];
        let offer = new TransferOffer(club, player);
        this.offers = this.offers.concat([offer]);
        this.addNews("transfer", club.name + " bid " + functions.formatNumber(offer.amount) + " $ for " + player.name);
        return offer;
    }

    //after every league match of yours; returns the new offer, if any
    afterMatch(){
        for(let o of this.offers){
            o.left--;
        }
        for(let o of this.offers.filter(o => o.left <= 0 || !game.team.players.includes(o.player))){
            if(o.left <= 0){
                this.addNews("clock", o.club + " withdrew their bid for " + o.player.name);
            }
        }
        this.offers = this.offers.filter(o => o.left > 0 && game.team.players.includes(o.player));
        if(Math.random() < 0.18 && game.playerMarket.players.length > 5){
            this.marketSigning();
        }
        if(this.offers.length < 3 && game.team.players.length > 11 && Math.random() < 0.3){
            return this.makeOffer();
        }
        return null;
    }

    //a rival club buys a player from the Market and gets a little stronger
    marketSigning(){
        let market = game.playerMarket.players;
        let player = market[Math.floor(Math.random() * market.length)];
        let clubs = game.league.divisions[game.team.divisionRank].teams.filter(t => t !== game.team);
        let club = clubs[Math.floor(Math.random() * clubs.length)];
        game.playerMarket.players = market.filter(p => p !== player);
        World.strengthen(club, 1.03);
        this.addNews("market", club.name + " signed " + player.name + " from the Market for " + functions.formatNumber(player.getBasePrice()) + " $");
    }

    static strengthen(team, factor){
        team.boost = Math.max(0.7, Math.min(1.8, (team.boost || 1) * factor));
        team.players = team.generatePlayers();
    }

    accept(offer){
        if(!this.offers.includes(offer) || !game.team.players.includes(offer.player)){
            return;
        }
        let p = offer.player;
        if(game.currentMatch && !game.currentMatch.ended && game.currentMatch.time > 0 && p.active){
            offer.message = "Wait for the Match to end";
            return;
        }
        game.money = game.money.add(offer.amount);
        let ratio = offer.amount.div(TransferOffer.getValue(p).max(1)).toNumber();
        game.records.bestSaleRatio = Math.max(game.records.bestSaleRatio || 0, ratio);
        game.team.players = game.team.players.filter(x => x !== p);
        this.offers = this.offers.filter(o => o !== offer);
        let club = offer.getClub();
        if(club){
            World.strengthen(club, 1.05);
        }
        this.addNews("sell", "You sold " + p.name + " to " + offer.club + " for " + functions.formatNumber(offer.amount) + " $");
        if(p.active && game.settings.team.refillPlayers){
            game.team.refillPlayers();
        }
    }

    reject(offer){
        this.offers = this.offers.filter(o => o !== offer);
    }

    //ask for more: they agree up to what they would pay; above it they may improve a bit or walk away
    counter(offer, raise){
        if(!this.offers.includes(offer)){
            return;
        }
        let ask = offer.amount.mul(1 + raise);
        if(ask.lte(offer.max)){
            offer.amount = ask;
            offer.message = offer.club + " agree to " + functions.formatNumber(ask) + " $";
        }
        else if(offer.counters >= 1 || Math.random() < 0.5){
            this.offers = this.offers.filter(o => o !== offer);
            this.addNews("close", offer.club + " walked away from the talks for " + offer.player.name);
            return "walked";
        }
        else{
            offer.amount = offer.amount.add(offer.max).div(2);
            offer.message = "Too much. They offer " + functions.formatNumber(offer.amount) + " $, their last word";
        }
        offer.counters++;
        return "ok";
    }

    //Season end: every rival club invests or falls back
    endSeason(){
        let moves = {};
        for(let d of game.league.divisions){
            for(let t of d.teams){
                if(t === game.team){
                    continue;
                }
                let factor = 0.9 + 0.24 * Math.random();
                let before = t.boost || 1;
                t.boost = Math.max(0.7, Math.min(1.8, before * factor));
                t.players = t.generatePlayers();
                moves[t.name] = t.boost / before - 1;
            }
        }
        this.moves = moves;
        let rivals = game.league.divisions[game.team.divisionRank].teams.filter(t => t !== game.team);
        let sorted = rivals.slice().sort((a, b) => (moves[b.name] || 0) - (moves[a.name] || 0));
        let news = {risers: sorted.slice(0, 2).map(t => t.name), fallers: sorted.slice(-1).map(t => t.name)};
        for(let name of news.risers){
            this.addNews("upgrades", name + " invested big in the summer: +" + Math.round(moves[name] * 100) + " % strength");
        }
        for(let name of news.fallers){
            this.addNews("releg", name + " lost key players: " + Math.round(moves[name] * 100) + " % strength");
        }
        this.offers = [];
        return news;
    }

    toJSON(){
        return {
            offers: this.offers.map(o => ({
                club: o.club, amount: o.amount, max: o.max, left: o.left, counters: o.counters, message: o.message,
                player: game.team.players.indexOf(o.player)
            })).filter(o => o.player >= 0),
            news: this.news,
            moves: this.moves
        };
    }

    load(obj){
        this.news = obj.news || [];
        this.moves = obj.moves || {};
        this.offers = (obj.offers || []).map(o => {
            let offer = new TransferOffer();
            offer.club = o.club;
            offer.player = game.team.players[o.player];
            offer.amount = new Decimal(o.amount);
            offer.max = new Decimal(o.max);
            offer.left = Number(o.left) || 1;
            offer.counters = Number(o.counters) || 0;
            offer.message = o.message || "";
            return offer;
        }).filter(o => o.player);
    }
}
