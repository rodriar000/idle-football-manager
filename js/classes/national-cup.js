//National Cup: every Season 16 clubs of your country play a knockout alongside the league: 4 from the
//Division above yours, 8 from yours (you always play) and 4 from the Division below. The club from the
//lower Division plays at home, so a small club can knock out a big one. Same rounds as the Continental Cup,
//played on other matchdays, with smaller prizes.
class NationalCup extends Cup{
    get name(){
        return "National Cup";
    }

    get matchKey(){
        return "domestic";
    }

    get prizes(){
        return [2, 3, 5, 10];
    }

    get recordKeys(){
        return {finals: "nationalCupFinals", wins: "nationalCups"};
    }

    get winXp(){
        return 100;
    }

    //everybody plays it
    isQualified(){
        return this.getOwnIndex() >= 0;
    }

    //between the Continental Cup rounds and the World Cup qualifiers
    getSchedule(){
        let days = game.league.divisions[game.team.divisionRank].matchDays;
        return [1.5, 3.5, 5.5, 7.5].map(k => Math.floor(days * k / 9));
    }

    getHomeAway(a, b){
        let team1 = this.getTeam(a), team2 = this.getTeam(b);
        if(team1 && team2 && team2.divisionRank < team1.divisionRank){
            return [team2, team1];
        }
        return [team1, team2];
    }

    //the draw for a new Season: you, 7 clubs of your Division and 4 from the Divisions above and below
    //(more from your own and the other one when there is none above or below)
    draw(){
        let rank = game.team.divisionRank;
        let divisions = game.league.divisions;
        let shuffled = d => d ? d.teams.filter(t => t !== game.team).sort(() => Math.random() - 0.5) : [];
        let above = shuffled(divisions[rank + 1]), own = shuffled(divisions[rank]), below = shuffled(divisions[rank - 1]);
        let nAbove = Math.min(4, above.length), nBelow = Math.min(4, below.length);
        let nOwn = Math.min(own.length, 15 - nAbove - nBelow);
        let rest = 15 - nAbove - nBelow - nOwn;
        nBelow = Math.min(below.length, nBelow + rest);
        nAbove = Math.min(above.length, 15 - nOwn - nBelow);
        let clubs = own.slice(0, nOwn).concat(above.slice(0, nAbove), below.slice(0, nBelow));
        let entries = [{name: game.team.name, own: true}].concat(clubs.map(t => ({name: t.name})));
        entries.sort(() => Math.random() - 0.5);
        this.entries = entries;
        this.ties = [];
        this.round = 0;
        this.leagueMatch = null;
        this.pending = null;
        this.season = game.records.seasons + 1;
    }
}
