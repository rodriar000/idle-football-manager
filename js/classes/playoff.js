//Promotion play-off: when the Season ends, the 3rd to the 6th of every Division that has one above play for
//the last promotion place: semi-finals 3rd v 6th and 4th v 5th, then the final, one match each at the ground
//of the better placed club. A draw goes to penalties. The top 2 still go up directly, and the Division above
//sends down 3 clubs instead of 2. When your club is in it you play your matches before the Season ends.
const PlayoffRounds = Object.freeze({
    names: ["Play-off semi-final", "Play-off final"],
    short: ["Semi-final", "Final"],
    //prize for winning each round, in wins of your Division
    prizes: [2, 4],
    //places in it after the direct promotion places
    places: 4
});

class Playoff{
    constructor(){
        this.season = 0; //Season the last play-off of your Division was for
        this.division = ""; //its name
        this.seeds = []; //names of the clubs from 3rd to 6th, best placed first
        this.ties = []; //per round: [{a, b, s1, s2, p1, p2, winner}] with seed indices, a plays at home
        this.round = 0;
        this.active = false; //your club plays in it right now; the Season ends when it's over
        this.pending = null; //the other semi-final while you play yours
        this.winners = null; //Division index -> winning Team, only while the teams move at the Season end
    }

    static hasPlayoff(division){
        return division.getPromotionRanks() > 0;
    }

    //the clubs of a finished Division that play it
    static getSeeds(division){
        let first = division.getPromotionRanks();
        return division.getSortedTeams().slice(first, first + PlayoffRounds.places);
    }

    getTeam(index){
        let name = this.seeds[index];
        //the clubs may have moved to another Division since
        let own = game.league.divisions[game.team.divisionRank];
        for(let d of [own].concat(game.league.divisions)){
            let t = d.teams.find(t => t.name === name);
            if(t){
                return t;
            }
        }
        return null;
    }

    getOwnIndex(){
        return this.seeds.findIndex((name, i) => this.getTeam(i) === game.team);
    }

    getPairs(round){
        if(round === 0){
            return [[0, 3], [1, 2]];
        }
        let semis = this.ties[0];
        if(!semis || semis.length < 2){
            return [];
        }
        let finalists = [semis[0].winner, semis[1].winner].sort((a, b) => a - b);
        return [finalists];
    }

    isOver(){
        return this.round >= PlayoffRounds.names.length;
    }

    getWinnerIndex(){
        let final = this.ties[1];
        return final && final[0] ? final[0].winner : -1;
    }

    isOut(){
        let own = this.getOwnIndex();
        return own >= 0 && this.ties.some(r => r.some(t => (t.a === own || t.b === own) && t.winner !== own));
    }

    hasWon(){
        let own = this.getOwnIndex();
        return own >= 0 && this.getWinnerIndex() === own;
    }

    //how far you got
    getReached(){
        if(this.hasWon()){
            return "Promoted";
        }
        let own = this.getOwnIndex();
        let reached = 0;
        this.ties.forEach((r, i) => {
            if(r.some(t => t.a === own || t.b === own)){
                reached = i;
            }
        });
        return "Lost in the " + PlayoffRounds.short[reached];
    }

    //your Division just ended: if your club finished 3rd to 6th, the play-off starts with your semi-final
    //as the next match and true is returned; otherwise the Season can end right away
    start(){
        let division = game.league.divisions[game.team.divisionRank];
        if(!Playoff.hasPlayoff(division)){
            return false;
        }
        let seeds = Playoff.getSeeds(division);
        if(!seeds.includes(game.team)){
            return false;
        }
        this.reset(division, seeds);
        this.active = true;
        this.nextRound();
        return true;
    }

    reset(division, seeds){
        this.season = game.records.seasons + 1;
        this.division = division.getName();
        this.seeds = seeds.map(t => t.name);
        this.ties = [];
        this.round = 0;
        this.pending = null;
    }

    //the other ties of the round are played; your match becomes the next match
    nextRound(){
        let own = this.getOwnIndex();
        let pairs = this.getPairs(this.round);
        let results = [];
        let ownPair = null;
        for(let [a, b] of pairs){
            if(a === own || b === own){
                ownPair = [a, b];
                results.push(null);
                continue;
            }
            results.push(this.playAiTie(a, b));
        }
        if(ownPair){
            this.pending = results;
            let team1 = this.getTeam(ownPair[0]), team2 = this.getTeam(ownPair[1]);
            for(let t of [team1, team2]){
                if(t !== game.team){
                    t.players.forEach(p => p.currentStamina = 1);
                }
            }
            let m = new Match(team1, team2, game.team.divisionRank);
            m.playoff = this.round;
            game.nextMatch = m;
            return;
        }
        this.ties.push(results);
        this.round++;
        if(!this.isOver()){
            this.nextRound();
        }
    }

    playAiTie(a, b){
        let tie = Object.assign({a, b, p1: null, p2: null}, Cup.simulateTie(this.getTeam(a), this.getTeam(b)));
        tie.winner = Cup.tieWinner(tie);
        return tie;
    }

    //your play-off match ended: returns true while there is another match to play
    finishOwnTie(match){
        let own = this.getOwnIndex();
        let pairs = this.getPairs(this.round);
        let results = this.pending || pairs.map(([a, b]) => (a === own || b === own) ? null : this.playAiTie(a, b));
        let i = pairs.findIndex(([a, b]) => a === own || b === own);
        let [a, b] = pairs[i];
        let tie = {a, b, s1: match.score1, s2: match.score2, p1: match.penalties ? match.penalties[0] : null, p2: match.penalties ? match.penalties[1] : null};
        tie.winner = Cup.tieWinner(tie);
        results[i] = tie;
        this.ties.push(results);
        this.pending = null;
        this.round++;
        //knocked out: the rest is played without you
        while(!this.isOver() && tie.winner !== own){
            let rest = this.getPairs(this.round).map(([x, y]) => this.playAiTie(x, y));
            this.ties.push(rest);
            this.round++;
        }
        if(this.isOver()){
            this.active = false;
            return false;
        }
        this.nextRound();
        return true;
    }

    //prize for winning a round
    getPrize(round){
        return game.league.divisions[game.team.divisionRank].getRewards().win.mul(PlayoffRounds.prizes[round]);
    }

    //Season end, before the teams move: the winner of every Division's play-off. Yours was played already
    //if your club was in it, the others are quick results (your Division's is kept to show it)
    resolveAll(){
        let winners = {};
        for(let [i, d] of game.league.divisions.entries()){
            if(!Playoff.hasPlayoff(d)){
                continue;
            }
            let own = i === game.team.divisionRank;
            let played = own && this.season === game.records.seasons && this.isOver() && this.division === d.getName();
            if(played){
                winners[i] = this.getTeam(this.getWinnerIndex());
                continue;
            }
            let seeds = Playoff.getSeeds(d);
            if(own){
                this.reset(d, seeds);
                this.season = game.records.seasons;
                while(!this.isOver()){
                    this.ties.push(this.getPairs(this.round).map(([a, b]) => this.playAiTie(a, b)));
                    this.round++;
                }
                winners[i] = this.getTeam(this.getWinnerIndex());
                continue;
            }
            let quick = (x, y) => Cup.tieWinner(Object.assign({a: x, b: y}, Cup.simulateTie(seeds[x], seeds[y])));
            let [x, y] = [quick(0, 3), quick(1, 2)].sort((m, n) => m - n);
            winners[i] = seeds[quick(x, y)];
        }
        return winners;
    }

    //for the Season summary
    getNews(){
        if(this.season !== game.records.seasons){
            return null;
        }
        let winner = this.getWinnerIndex();
        return {
            played: this.getOwnIndex() >= 0,
            reached: this.getOwnIndex() >= 0 ? this.getReached() : null,
            won: this.hasWon(),
            winner: winner >= 0 ? this.seeds[winner] : null
        };
    }

    toJSON(){
        return {
            season: this.season,
            division: this.division,
            seeds: this.seeds,
            ties: this.ties,
            round: this.round,
            active: this.active,
            pending: this.pending
        };
    }

    load(obj){
        this.season = Number(obj.season) || 0;
        this.division = obj.division || "";
        this.seeds = obj.seeds || [];
        this.ties = obj.ties || [];
        this.round = Number(obj.round) || 0;
        this.active = obj.active === true;
        this.pending = obj.pending || null;
    }
}
