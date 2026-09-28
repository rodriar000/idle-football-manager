//World Cup: every few Seasons, in the summer before the new league starts, 16 nations play for the world title.
//Your players are your nation's squad. It has to qualify first: a group of 5 nations played between matchdays
//in the Season before, the top 2 go. At the World Cup: 4 groups of 4, the top 2 of each group go on to the knockout rounds.
const WorldCupStages = Object.freeze({
    every: 3, //Seasons between World Cups
    groups: ["A", "B", "C", "D"],
    //steps of the tournament: 3 group matchdays, then the knockout rounds
    steps: ["Group stage", "Group stage", "Group stage", "Quarter-final", "Semi-final", "Final"],
    //who meets who on the 3 group matchdays (places in the group)
    groupDays: [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]],
    //prize for a win, in wins of your Division: group match, quarter-final, semi-final, final
    prizes: [3, 8, 14, 30],
    xp: {"Group stage": 20, "Quarter-final": 60, "Semi-final": 120, "Final": 200, "Winner": 400},
    count: 6,
    //national teams play at the level of this Division rank of your country (6 = Division 4)
    nationRank: 6,
    //qualifying: the league matches played before each of the 5 rounds, in ninths of the Season
    qualDays: [1, 3, 5, 7, 8.5],
    qualBoost: [0.8, 1.2],
    qualRounds: 5
});

//strength of a nation: pot 1 are the favourites
const WorldCupPots = Object.freeze([[1.25, 1.4], [1.08, 1.22], [0.94, 1.06], [0.78, 0.9]]);

const WorldNations = Object.freeze([
    {name: "Norvalia", colors: ["#1f5fbf", "#ffffff", "#1f5fbf"]},
    {name: "Kestria", colors: ["#c8102e", "#f6c700", "#c8102e"]},
    {name: "Ostmark", colors: ["#111111", "#d52b1e", "#f2c300"]},
    {name: "Valdoria", colors: ["#007a3d", "#ffffff", "#ce1126"]},
    {name: "Lumeria", colors: ["#6a1b9a", "#ffd54f", "#6a1b9a"]},
    {name: "Brisca", colors: ["#00a3e0", "#ffffff", "#00a3e0"]},
    {name: "Tarvos", colors: ["#e65100", "#ffffff", "#2e7d32"]},
    {name: "Selvin", colors: ["#0d47a1", "#ffeb3b", "#c62828"]},
    {name: "Montavia", colors: ["#b71c1c", "#ffffff", "#b71c1c"]},
    {name: "Caldera", colors: ["#ff8f00", "#212121", "#ff8f00"]},
    {name: "Irindor", colors: ["#2e7d32", "#fdd835", "#1565c0"]},
    {name: "Sundhaven", colors: ["#fdd835", "#1e88e5", "#fdd835"]},
    {name: "Palomar", colors: ["#ffffff", "#d81b60", "#ffffff"]},
    {name: "Draskov", colors: ["#ffffff", "#1a237e", "#c62828"]},
    {name: "Veloria", colors: ["#00897b", "#ffffff", "#00897b"]},
    {name: "Quarzen", colors: ["#37474f", "#80deea", "#37474f"]},
    {name: "Anti-Football Nation", colors: ["#ffffff", "#87ceeb", "#1565c0"]},
    {name: "Nowhereia", colors: ["#ffffff", "#e0e0e0", "#ffffff"]}
]);

class WorldCup{
    constructor(){
        this.entries = []; //16 nations, 4 per group in group order: {own} or {seed, nation, boost}
        this.games = []; //played games: {step, a, b, s1, s2, p1, p2, winner}
        this.step = 0; //next step to play
        this.running = false;
        this.leagueMatch = null; //the first league match of the Season, waiting for the World Cup to end
        this.season = 0; //the World Cup is played after this Season
        this.rank = 0; //Division and country the nations were made for
        this.country = 0;
        this.history = []; //past World Cups: {season, reached, won}
        this.note = null; //how the last World Cup ended, for the tab
        this.qual = null; //qualifying group: {season, entries, games, step, rank, country}
    }

    //the Season before a World Cup has the qualifying
    isQualifyingSeason(){
        return (game.records.seasons + 1) % WorldCupStages.every === 0;
    }

    //the qualifying group of this Season, if there is one
    getQual(){
        return this.qual && this.qual.season === game.records.seasons + 1 ? this.qual : null;
    }

    start(){
        if(this.isQualifyingSeason() && !this.getQual() && !this.running){
            this.drawQualifying();
        }
    }

    //you and 4 other nations
    drawQualifying(){
        let own = WorldCup.getOwnNation().name;
        let nations = WorldNations.map((n, i) => i).filter(i => WorldNations[i].name !== own);
        nations.sort(() => Math.random() - 0.5);
        let [from, to] = WorldCupStages.qualBoost;
        let entries = [{own: true}].concat(nations.slice(0, 4).map(n => ({
            seed: Math.floor(Math.random() * 1e9), nation: n, boost: Math.round((from + (to - from) * Math.random()) * 1000) / 1000
        })));
        entries.sort(() => Math.random() - 0.5);
        this.qual = {season: game.records.seasons + 1, entries, games: [], step: 0, rank: WorldCupStages.nationRank, country: game.country};
        this.createTeams(this.qual.entries, this.qual.rank, this.qual.country);
    }

    getQualTeam(index){
        let e = this.qual ? this.qual.entries[index] : null;
        if(!e){
            return null;
        }
        return e.own ? game.team : e.team || null;
    }

    getQualNation(index){
        let e = this.qual ? this.qual.entries[index] : null;
        if(!e){
            return null;
        }
        return e.own ? WorldCup.getOwnNation() : WorldNations[e.nation % WorldNations.length];
    }

    getQualOwn(){
        return this.qual ? this.qual.entries.findIndex(e => e.own) : -1;
    }

    qualIndexOf(team){
        return this.qual ? this.qual.entries.findIndex((e, i) => this.getQualTeam(i) === team) : -1;
    }

    //5 rounds, one nation rests in each
    getQualPairs(step){
        let r = step;
        return [[(r + 1) % 5, (r + 4) % 5], [(r + 2) % 5, (r + 3) % 5]];
    }

    //league matches played before each qualifying round
    getQualSchedule(){
        let days = game.league.divisions[game.team.divisionRank].matchDays;
        return WorldCupStages.qualDays.map(k => Math.round(days * k / 9));
    }

    getQualStandings(){
        let rows = [0, 1, 2, 3, 4].map(idx => ({idx, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0}));
        for(let m of this.qual ? this.qual.games : []){
            WorldCup.addToTable(rows, m);
        }
        return rows.sort((x, y) => (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (x.idx - y.idx));
    }

    static addToTable(rows, m){
        let a = rows.find(r => r.idx === m.a), b = rows.find(r => r.idx === m.b);
        a.p++; b.p++;
        a.gf += m.s1; a.ga += m.s2;
        b.gf += m.s2; b.ga += m.s1;
        if(m.s1 > m.s2){
            a.w++; b.l++; a.pts += 3;
        }
        else if(m.s2 > m.s1){
            b.w++; a.l++; b.pts += 3;
        }
        else{
            a.d++; b.d++; a.pts++; b.pts++;
        }
    }

    isQualDone(){
        return this.qual !== null && this.qual.step >= WorldCupStages.qualRounds;
    }

    //your place in the qualifying group (1-5)
    getQualPlace(){
        return this.getQualStandings().findIndex(r => r.idx === this.getQualOwn()) + 1;
    }

    //after every league match of yours (and the Cup): a qualifying round may be due
    checkQualifier(){
        let q = this.getQual();
        if(!q || this.running || this.leagueMatch || game.cup.leagueMatch || game.nationalCup.leagueMatch || game.playoff.active){
            return;
        }
        let played = game.league.divisions[game.team.divisionRank].matchDay - 1;
        let schedule = this.getQualSchedule();
        let own = this.getQualOwn();
        while(q.step < WorldCupStages.qualRounds && played >= schedule[q.step]){
            let pair = this.getQualPairs(q.step).find(p => p.includes(own));
            if(pair){
                let team1 = this.getQualTeam(pair[0]), team2 = this.getQualTeam(pair[1]);
                for(let t of [team1, team2]){
                    if(t !== game.team){
                        t.players.forEach(p => p.currentStamina = 1);
                    }
                }
                let m = new Match(team1, team2, game.team.divisionRank);
                m.qualifier = q.step;
                this.leagueMatch = game.nextMatch;
                game.nextMatch = m;
                return;
            }
            this.playQualStep();
        }
    }

    //the games of a qualifying round; yours from the match when given, else lost
    playQualStep(match = null){
        let q = this.qual;
        let own = this.getQualOwn();
        for(let [a, b] of this.getQualPairs(q.step)){
            let m;
            if(a === own || b === own){
                m = match ? {a, b, s1: match.score1, s2: match.score2} : {a, b, s1: a === own ? 0 : 1, s2: a === own ? 1 : 0};
            }
            else{
                let t = Cup.simulateTie(this.getQualTeam(a), this.getQualTeam(b));
                m = {a, b, s1: t.s1, s2: t.s2};
            }
            m.step = q.step;
            q.games.push(m);
        }
        q.step++;
    }

    finishOwnQualifier(match){
        this.playQualStep(match);
        game.nextMatch = this.leagueMatch;
        this.leagueMatch = null;
        let place = this.getQualPlace();
        let played = this.qual.games.filter(m => m.a === this.getQualOwn() || m.b === this.getQualOwn()).length;
        return "Qualifying: " + place + (["st", "nd", "rd", "th", "th"][place - 1]) + " of 5 after " + played + (played === 1 ? " match" : " matches");
    }

    //Season end of the qualifying Season: rounds that are left are played, the top 2 go to the World Cup
    finishQualifying(){
        //called after the Season counter moved on: the group is of the Season just played
        if(!this.qual || this.qual.season !== game.records.seasons){
            return false;
        }
        while(this.qual.step < WorldCupStages.qualRounds){
            this.playQualStep();
        }
        return this.getQualPlace() <= 2;
    }

    //your nation: the Country you play in
    static getOwnNation(){
        let c = game.countries[game.country];
        return {name: c ? c.name : "Country #" + (game.country + 1), colors: c ? c.flag.colors : ["#ffffff", "#9e9e9e", "#ffffff"]};
    }

    static flag(nation){
        let c = nation.colors;
        let last = c[c.length - 1], mid = c[Math.floor(c.length / 2)];
        return "linear-gradient(to bottom, " + c[0] + " 0 33%, " + mid + " 33% 67%, " + last + " 67%)";
    }

    //the Season after which the next World Cup is played
    getNextSeason(){
        let every = WorldCupStages.every;
        return Math.ceil((game.records.seasons + 1) / every) * every;
    }

    getTeam(index){
        let e = this.entries[index];
        if(!e){
            return null;
        }
        return e.own ? game.team : e.team || null;
    }

    getNation(index){
        let e = this.entries[index];
        if(!e){
            return null;
        }
        return e.own ? WorldCup.getOwnNation() : WorldNations[e.nation % WorldNations.length];
    }

    getName(index){
        let nation = this.getNation(index);
        return nation ? nation.name : "";
    }

    getOwnIndex(){
        return this.entries.findIndex(e => e.own);
    }

    indexOf(team){
        return this.entries.findIndex((e, i) => this.getTeam(i) === team);
    }

    //the draw: one nation of each pot per group, you take the last place of a random group (if you qualified)
    draw(withOwn = true){
        let own = WorldCup.getOwnNation().name;
        let nations = WorldNations.map((n, i) => i).filter(i => WorldNations[i].name !== own);
        nations.sort(() => Math.random() - 0.5);
        let ownGroup = Math.floor(Math.random() * 4);
        let entries = [];
        let n = 0;
        for(let g = 0; g < 4; g++){
            let group = [];
            for(let pot = 0; pot < 4; pot++){
                if(g === ownGroup && pot === 3 && withOwn){
                    group.push({own: true});
                    continue;
                }
                let [from, to] = WorldCupPots[pot];
                group.push({seed: Math.floor(Math.random() * 1e9), nation: nations[n++], boost: Math.round((from + (to - from) * Math.random()) * 1000) / 1000});
            }
            entries = entries.concat(group.sort(() => Math.random() - 0.5));
        }
        this.entries = entries;
        this.games = [];
        this.step = 0;
        this.rank = WorldCupStages.nationRank;
        this.country = game.country;
        this.createTeams(this.entries, this.rank, this.country);
    }

    //national teams play at a fixed level of your country, stronger or weaker by their pot
    createTeams(entries, rank, country){
        for(let e of entries){
            if(e.own){
                continue;
            }
            let team = GeneratorUtils.generateTeam(e.seed, rank, country);
            team.boost = e.boost || 1;
            team.players = team.generatePlayers();
            team.nation = WorldNations[e.nation % WorldNations.length];
            team.name = team.nation.name;
            Object.defineProperty(e, "team", {value: team, enumerable: false, writable: true});
        }
    }

    getGroupOf(index){
        return Math.floor(index / 4);
    }

    //{idx, p, w, d, l, gf, ga, pts} for the 4 nations of a group, best first
    getStandings(g){
        let rows = [0, 1, 2, 3].map(i => ({idx: 4 * g + i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0}));
        for(let m of this.games.filter(m => m.step < 3 && this.getGroupOf(m.a) === g)){
            WorldCup.addToTable(rows, m);
        }
        //ties: goal difference, goals, then the draw order
        return rows.sort((x, y) => (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (x.idx - y.idx));
    }

    //the games of a step as pairs of entry indices; empty while they aren't known yet
    getPairs(step){
        if(step < 3){
            let pairs = [];
            for(let g = 0; g < 4; g++){
                for(let [x, y] of WorldCupStages.groupDays[step]){
                    pairs.push([4 * g + x, 4 * g + y]);
                }
            }
            return pairs;
        }
        if(step === 3){
            if(this.games.filter(m => m.step < 3).length < 24){
                return [];
            }
            let s = [0, 1, 2, 3].map(g => this.getStandings(g));
            return [[s[0][0].idx, s[1][1].idx], [s[2][0].idx, s[3][1].idx], [s[1][0].idx, s[0][1].idx], [s[3][0].idx, s[2][1].idx]];
        }
        let before = this.games.filter(m => m.step === step - 1);
        if(before.length < 2 ** (6 - step)){
            return [];
        }
        let pairs = [];
        for(let i = 0; i < before.length; i += 2){
            pairs.push([before[i].winner, before[i + 1].winner]);
        }
        return pairs;
    }

    isKnockout(step){
        return step >= 3;
    }

    isOut(){
        let own = this.getOwnIndex();
        if(own < 0){
            return false;
        }
        if(this.games.filter(m => m.step < 3).length >= 24){
            let top = this.getStandings(this.getGroupOf(own)).slice(0, 2).map(r => r.idx);
            if(!top.includes(own)){
                return true;
            }
        }
        return this.games.some(m => this.isKnockout(m.step) && (m.a === own || m.b === own) && m.winner !== own);
    }

    hasWon(){
        let final = this.games.find(m => m.step === 5);
        return final !== undefined && final.winner === this.getOwnIndex();
    }

    //how far you got
    getReached(){
        if(this.hasWon()){
            return "Winner";
        }
        let own = this.getOwnIndex();
        let reached = 0;
        for(let m of this.games){
            if(m.a === own || m.b === own){
                reached = Math.max(reached, m.step);
            }
        }
        return WorldCupStages.steps[reached];
    }

    //prize for a win at this step
    getPrize(step){
        let stage = Math.max(0, step - 2);
        return game.league.divisions[game.team.divisionRank].getRewards().win.mul(WorldCupStages.prizes[stage]);
    }

    //called at every Season end: the World Cup starts in the summer of its Season
    afterSeason(){
        if(game.records.seasons === 0 || game.records.seasons % WorldCupStages.every !== 0){
            if(this.isQualifyingSeason()){
                this.drawQualifying();
            }
            return {next: this.getNextSeason(), qualifying: this.isQualifyingSeason()};
        }
        this.season = game.records.seasons;
        this.note = null;
        let qualified = this.finishQualifying();
        this.draw(qualified);
        if(!qualified){
            //the World Cup is played without you
            while(this.step < WorldCupStages.count){
                this.playStep();
            }
            this.finish(false);
            return {missed: true, season: this.season, winner: this.note.winner};
        }
        this.running = true;
        this.leagueMatch = game.nextMatch;
        this.setNextMatch();
        return {started: true, season: this.season, group: WorldCupStages.groups[this.getGroupOf(this.getOwnIndex())]};
    }

    //your next World Cup match becomes the next match
    setNextMatch(){
        let own = this.getOwnIndex();
        let pair = this.getPairs(this.step).find(p => p.includes(own));
        let team1 = this.getTeam(pair[0]), team2 = this.getTeam(pair[1]);
        for(let t of [team1, team2]){
            if(t !== game.team){
                t.players.forEach(p => p.currentStamina = 1);
            }
        }
        let m = new Match(team1, team2, game.team.divisionRank);
        m.worldCup = this.step;
        game.nextMatch = m;
    }

    playAiGame(step, a, b){
        let m = Object.assign({step, a, b, p1: null, p2: null}, Cup.simulateTie(this.getTeam(a), this.getTeam(b)));
        if(!this.isKnockout(step)){
            m.p1 = m.p2 = null;
        }
        m.winner = WorldCup.winner(m);
        return m;
    }

    //null for a group draw
    static winner(m){
        if(m.s1 !== m.s2){
            return m.s1 > m.s2 ? m.a : m.b;
        }
        if(m.p1 !== null && m.p1 !== undefined){
            return m.p1 > m.p2 ? m.a : m.b;
        }
        return null;
    }

    //plays the other games of a step; yours comes from the match when given
    playStep(match = null){
        let own = this.getOwnIndex();
        for(let [a, b] of this.getPairs(this.step)){
            if(match && (a === own || b === own)){
                let m = {step: this.step, a, b, s1: match.score1, s2: match.score2,
                    p1: match.penalties ? match.penalties[0] : null, p2: match.penalties ? match.penalties[1] : null};
                m.winner = WorldCup.winner(m);
                this.games.push(m);
            }
            else if(a === own || b === own){
                //a match of yours that never came is lost
                let m = {step: this.step, a, b, s1: a === own ? 0 : 1, s2: a === own ? 1 : 0, p1: null, p2: null};
                m.winner = WorldCup.winner(m);
                this.games.push(m);
            }
            else{
                this.games.push(this.playAiGame(this.step, a, b));
            }
        }
        this.step++;
    }

    //your World Cup match ended: returns a line for the full-time window
    finishOwnMatch(match){
        this.playStep(match);
        let own = this.getOwnIndex();
        let line;
        if(this.step === 5 && !this.isOut()){
            game.records.worldCupFinals = (game.records.worldCupFinals || 0) + 1;
        }
        if(this.isOut() || this.step >= WorldCupStages.count){
            //the rest of the tournament is played at once
            while(this.step < WorldCupStages.count){
                this.playStep();
            }
            let reached = this.getReached();
            line = reached === "Winner" ? "World Champions!" : "Out of the World Cup in the " + reached;
            this.finish();
        }
        else if(this.step < 3){
            let place = this.getStandings(this.getGroupOf(own)).findIndex(r => r.idx === own) + 1;
            line = "Group " + WorldCupStages.groups[this.getGroupOf(own)] + ": " + place + (["st", "nd", "rd", "th"][place - 1]) + " after " + this.step + (this.step === 1 ? " match" : " matches");
            this.setNextMatch();
        }
        else{
            line = "Through to the " + WorldCupStages.steps[this.step];
            this.setNextMatch();
        }
        return line;
    }

    //the World Cup is over: the league starts
    finish(played = true){
        let final = this.games.find(m => m.step === 5);
        let winner = final ? this.getName(final.winner) : "";
        let reached = played ? this.getReached() : "Did not qualify";
        let won = reached === "Winner";
        if(won){
            game.records.worldCups = (game.records.worldCups || 0) + 1;
        }
        this.running = false;
        let xp = WorldCupStages.xp[reached] || 0;
        game.career.addXp(xp);
        this.note = {season: this.season, reached, won, xp, winner, qualified: played};
        this.history.unshift({season: this.season, reached, won});
        this.history = this.history.slice(0, 30);
        if(played){
            game.nextMatch = this.leagueMatch;
            this.leagueMatch = null;
        }
    }

    toJSON(){
        return {
            entries: this.entries.map(e => e.own ? {own: true} : {seed: e.seed, nation: e.nation, boost: e.boost}),
            games: this.games,
            step: this.step,
            running: this.running,
            leagueMatch: this.leagueMatch,
            season: this.season,
            rank: this.rank,
            country: this.country,
            history: this.history,
            note: this.note,
            qual: this.qual ? {
                season: this.qual.season, games: this.qual.games, step: this.qual.step, rank: this.qual.rank, country: this.qual.country,
                entries: this.qual.entries.map(e => e.own ? {own: true} : {seed: e.seed, nation: e.nation, boost: e.boost})
            } : null
        };
    }

    load(obj){
        this.entries = (obj.entries || []).map(e => e.own ? {own: true} : {seed: Number(e.seed), nation: Number(e.nation), boost: Number(e.boost) || 1});
        this.games = obj.games || [];
        this.step = Number(obj.step) || 0;
        this.running = obj.running === true && this.entries.length === 16;
        this.season = Number(obj.season) || 0;
        this.rank = Number(obj.rank) || 0;
        this.country = Number(obj.country) || 0;
        this.history = obj.history || [];
        this.note = obj.note || null;
        this.createTeams(this.entries, this.rank, this.country);
        if(obj.qual && obj.qual.entries){
            let q = obj.qual;
            this.qual = {
                season: Number(q.season) || 0, games: q.games || [], step: Number(q.step) || 0, rank: Number(q.rank) || 0, country: Number(q.country) || 0,
                entries: q.entries.map(e => e.own ? {own: true} : {seed: Number(e.seed), nation: Number(e.nation), boost: Number(e.boost) || 1})
            };
            this.createTeams(this.qual.entries, this.qual.rank, this.qual.country);
        }
        if(obj.leagueMatch){
            this.leagueMatch = new Match();
            this.leagueMatch.load(obj.leagueMatch);
        }
    }
}
