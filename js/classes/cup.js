//Continental Cup: every Season 16 clubs play a knockout alongside the league. Half of them come from your
//Division, the other half are guest clubs from abroad at the same level. You play in it only after
//finishing the Season before in the top 3. Rounds are played between matchdays,
//draws go to penalties, and every round you win pays a prize.
const CupRounds = Object.freeze({
    names: ["Round of 16", "Quarter-final", "Semi-final", "Final"],
    short: ["R16", "QF", "SF", "F"],
    //prize for winning a round, in wins of your Division
    prizes: [4, 6, 10, 20],
    count: 4
});

const CupNations = Object.freeze([
    {name: "Norvalia", colors: ["#1f5fbf", "#ffffff", "#1f5fbf"]},
    {name: "Kestria", colors: ["#c8102e", "#f6c700", "#c8102e"]},
    {name: "Ostmark", colors: ["#111111", "#d52b1e", "#f2c300"]},
    {name: "Valdoria", colors: ["#007a3d", "#ffffff", "#ce1126"]},
    {name: "Lumeria", colors: ["#6a1b9a", "#ffd54f", "#6a1b9a"]},
    {name: "Brisca", colors: ["#00a3e0", "#ffffff", "#00a3e0"]},
    {name: "Tarvos", colors: ["#e65100", "#ffffff", "#2e7d32"]},
    {name: "Selvin", colors: ["#0d47a1", "#ffeb3b", "#c62828"]}
]);

class Cup{
    constructor(){
        this.entries = []; //16 clubs in draw order: {name} for league clubs, {seed, nation} for guests
        this.ties = []; //per round: [{a, b, s1, s2, p1, p2, winner}] with entry indices
        this.round = 0; //next round to play
        this.leagueMatch = null; //the league match waiting while the cup match is played
        this.history = []; //past cups: {season, reached, won}
        this.season = 0;
        this.guests = []; //generated guest Teams, same order as the guest entries
    }

    static get qualifyingPlace(){
        return 3;
    }

    //you qualify with a top 3 finish in the Season just played
    static qualifies(){
        return game.lastSeason !== null && game.lastSeason !== undefined && game.lastSeason.position <= Cup.qualifyingPlace;
    }

    isQualified(){
        return this.getOwnIndex() >= 0;
    }

    //league matches your club plays before each round
    getSchedule(){
        let days = game.league.divisions[game.team.divisionRank].matchDays;
        return [1, 2, 3, 4].map(k => Math.floor(days * k / 4.5));
    }

    getTeam(index){
        let entry = this.entries[index];
        if(!entry){
            return null;
        }
        if(entry.own){
            return game.team;
        }
        if(entry.seed !== undefined){
            return entry.team || null;
        }
        for(let d of game.league.divisions){
            let t = d.teams.find(t => t.name === entry.name);
            if(t){
                return t;
            }
        }
        return null;
    }

    getOwnIndex(){
        return this.entries.findIndex(e => e.own);
    }

    indexOf(team){
        for(let i = 0; i < this.entries.length; i++){
            if(this.getTeam(i) === team){
                return i;
            }
        }
        return -1;
    }

    //the pairs of a round: the draw, then the winners of the round before
    getPairs(round){
        if(round === 0){
            let pairs = [];
            for(let i = 0; i < this.entries.length; i += 2){
                pairs.push([i, i + 1]);
            }
            return pairs;
        }
        let before = this.ties[round - 1];
        if(!before || before.length < 2 ** (CupRounds.count - round)){
            return [];
        }
        let pairs = [];
        for(let i = 0; i < before.length; i += 2){
            pairs.push([before[i].winner, before[i + 1].winner]);
        }
        return pairs;
    }

    isOut(){
        let own = this.getOwnIndex();
        return this.ties.some(round => round.some(t => (t.a === own || t.b === own) && t.winner !== own));
    }

    hasWon(){
        let final = this.ties[CupRounds.count - 1];
        return final !== undefined && final.length === 1 && final[0].winner === this.getOwnIndex();
    }

    isOver(){
        return this.round >= CupRounds.count;
    }

    //how far you got: the round you play or were knocked out in
    getReached(){
        let own = this.getOwnIndex();
        let reached = 0;
        for(let r = 0; r < this.ties.length; r++){
            if(this.ties[r].some(t => t.a === own || t.b === own)){
                reached = r;
            }
        }
        return this.hasWon() ? "Winner" : CupRounds.names[reached];
    }

    //the draw for a new Season: you (if you qualified) and clubs from your Division, and 8 guests from abroad
    draw(){
        let division = game.league.divisions[game.team.divisionRank];
        let locals = division.teams.filter(t => t !== game.team);
        locals.sort(() => Math.random() - 0.5);
        let own = Cup.qualifies() ? [{name: game.team.name, own: true}] : [];
        let entries = own.concat(locals.slice(0, 8 - own.length).map(t => ({name: t.name})));
        for(let i = 0; i < 8; i++){
            entries.push({seed: Math.floor(Math.random() * 1e9), nation: i});
        }
        entries.sort(() => Math.random() - 0.5);
        this.entries = entries;
        this.ties = [];
        this.round = 0;
        this.leagueMatch = null;
        this.season = game.records.seasons + 1;
        this.createGuests();
    }

    //guests play at the level of your Division
    createGuests(){
        for(let e of this.entries){
            if(e.seed !== undefined){
                let team = GeneratorUtils.generateTeam(e.seed, game.team.divisionRank, game.country);
                team.nation = CupNations[e.nation % CupNations.length];
                e.name = team.name;
                Object.defineProperty(e, "team", {value: team, enumerable: false, writable: true});
            }
        }
    }

    start(){
        if(this.entries.length === 0){
            this.draw();
        }
    }

    //a quick result for clubs that aren't yours
    static simulateTie(team1, team2){
        let m = new Match(team1, team2, game.team.divisionRank);
        let power = m.getNormPower();
        let s1 = 0, s2 = 0;
        for(let mins = 0; mins < 90; mins++){
            s1 += Math.random() < power.team1 ** 2.75 / 90;
            s2 += Math.random() < power.team2 ** 2.75 / 90;
        }
        let tie = {s1, s2};
        if(s1 === s2){
            [tie.p1, tie.p2] = Cup.penalties(power.team1, power.team2);
        }
        return tie;
    }

    //five kicks each, then sudden death; the stronger side scores a bit more often
    static penalties(power1 = 1, power2 = 1){
        let chance = p => Math.min(0.9, 0.72 * (p / ((power1 + power2) / 2)) ** 0.25);
        let c1 = chance(power1), c2 = chance(power2);
        let p1 = 0, p2 = 0;
        for(let i = 0; i < 5; i++){
            p1 += Math.random() < c1;
            p2 += Math.random() < c2;
        }
        while(p1 === p2){
            p1 += Math.random() < c1;
            p2 += Math.random() < c2;
        }
        return [p1, p2];
    }

    static tieWinner(tie){
        if(tie.s1 !== tie.s2){
            return tie.s1 > tie.s2 ? tie.a : tie.b;
        }
        return tie.p1 > tie.p2 ? tie.a : tie.b;
    }

    //called after every league match of yours: when a round is due, the other ties are played
    //and your cup match comes before the next league match
    check(){
        if(this.isOver() || this.leagueMatch){
            return;
        }
        let played = game.league.divisions[game.team.divisionRank].matchDay - 1;
        if(played < this.getSchedule()[this.round]){
            return;
        }
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
            m.cup = this.round;
            this.leagueMatch = game.nextMatch;
            game.nextMatch = m;
        }
        else{
            this.ties.push(results);
            this.round++;
        }
    }

    playAiTie(a, b){
        let tie = Object.assign({a, b, p1: null, p2: null}, Cup.simulateTie(this.getTeam(a), this.getTeam(b)));
        tie.winner = Cup.tieWinner(tie);
        return tie;
    }

    //your cup match ended: the round is complete and the league goes on
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
        let won = tie.winner === own;
        if(won && this.round === CupRounds.count - 1){
            game.records.cupFinals = (game.records.cupFinals || 0) + 1;
        }
        if(won && this.round === CupRounds.count){
            game.records.cups = (game.records.cups || 0) + 1;
        }
        game.nextMatch = this.leagueMatch;
        this.leagueMatch = null;
        return won;
    }

    //prize for winning this round
    getPrize(round){
        return game.league.divisions[game.team.divisionRank].getRewards().win.mul(CupRounds.prizes[round]);
    }

    //Season end: rounds that are left get played, the cup goes into the history and a new draw is made
    endSeason(){
        let safety = 0;
        while(!this.isOver() && safety++ < CupRounds.count){
            let own = this.getOwnIndex();
            let pairs = this.getPairs(this.round);
            //you can't miss your own match: if it never came, it's lost
            this.ties.push(pairs.map(([a, b]) => {
                if(a === own || b === own){
                    let tie = {a, b, s1: 0, s2: 0, p1: a === own ? 0 : 5, p2: a === own ? 5 : 0};
                    tie.winner = Cup.tieWinner(tie);
                    return tie;
                }
                return this.playAiTie(a, b);
            }));
            this.round++;
        }
        let played = this.isQualified();
        let news = {qualified: played, reached: played ? this.getReached() : "Not qualified", won: this.hasWon(), xp: this.hasWon() ? 200 : 0};
        if(this.entries.length){
            this.history.unshift({season: this.season, reached: news.reached, won: news.won});
            this.history = this.history.slice(0, 30);
        }
        this.draw();
        news.next = this.isQualified();
        return news;
    }

    toJSON(){
        return {
            entries: this.entries.map(e => e.seed !== undefined ? {seed: e.seed, nation: e.nation, name: e.name} : {name: e.name, own: e.own === true}),
            ties: this.ties,
            round: this.round,
            leagueMatch: this.leagueMatch,
            pending: this.pending || null,
            history: this.history,
            season: this.season
        };
    }

    load(obj){
        this.entries = (obj.entries || []).map(e => Object.assign({}, e));
        this.ties = obj.ties || [];
        this.round = Number(obj.round) || 0;
        this.pending = obj.pending || null;
        this.history = obj.history || [];
        this.season = Number(obj.season) || 0;
        this.createGuests();
        //your club may have been renamed
        let own = this.entries.find(e => e.own);
        if(own){
            own.name = game.team.name;
        }
        if(obj.leagueMatch){
            this.leagueMatch = new Match();
            this.leagueMatch.load(obj.leagueMatch);
        }
    }
}
