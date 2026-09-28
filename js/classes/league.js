class League {
    constructor(divisions) {
        this.divisions = divisions;
    }

    simulate() {
        for(let d of this.divisions) {
            d.simulate();
        }
    }

    moveTeams(){
        let promotingTeams = [];
        let relegatingTeams = [];
        //the top 2 go up directly and the play-off winner (3rd to 6th) goes with them
        let playoffWinners = game.playoff.resolveAll();
        for(let [i, d] of this.divisions.entries()){
            d.sort();
            promotingTeams[i + 1] = d.getPromotionRanks() > 0 ? d.teams.splice(0, d.getPromotionRanks()) : [];
            let winner = playoffWinners[i];
            if(winner && d.teams.includes(winner)){
                promotingTeams[i + 1].push(d.teams.splice(d.teams.indexOf(winner), 1)[0]);
            }
            relegatingTeams[i - 1] = d.getRelegationRanks() > 0 ? d.teams.splice(-d.getRelegationRanks()) : [];
        }
        for(let [i, d] of this.divisions.entries()){
            if(promotingTeams[i]){
                for(let t of promotingTeams[i]){
                    t.divisionRank++;
                    this.divisions[i].teams.push(t);
                }
            }
            if(relegatingTeams[i]){
                for(let t of relegatingTeams[i]){
                    t.divisionRank--;
                    this.divisions[i].teams.push(t);
                }
            }
            for(let team of d.teams){
                team.resetDivisionStats();
            }
            d.matchDay = 0;
        }
        game.currentMatch = undefined;
        game.maxDivisionRank = Math.max(game.maxDivisionRank, game.team.divisionRank);
        this.simulate();
    }
}