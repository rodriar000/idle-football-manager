app.component("division", {
    emits: ["team-selected"],
    props: ["division"],
    computed: {
        sortedTeams(){
            return this.division.getSortedTeams();
        },
        promotion(){
            return this.division.getPromotionRanks();
        },
        relegation(){
            return this.division.getRelegationRanks();
        }
    },
    methods: {
        getStatsDisplay(team){
            return "ATT " + functions.formatNumber(team.getCombinedAttack()) + "  DEF " + functions.formatNumber(team.getCombinedDefense());
        },
        selectTeam(team){
            this.$emit("team-selected", team);
        },
        isOwnTeam(team){
            return team === game.team;
        }
    },
    template: `<table class="standings">
<thead><tr>
    <th class="pos">#</th>
    <th class="team">Team</th>
    <th class="num games" title="Games played">P</th>
    <th class="num wdl">W</th>
    <th class="num wdl">D</th>
    <th class="num wdl">L</th>
    <th class="num goals">Goals</th>
    <th class="num">GD</th>
    <th class="num pts">Pts</th>
</tr></thead>
<tbody>
<tr :class="{'own-team': isOwnTeam(team), promotion: i < promotion, relegation: i > sortedTeams.length - relegation - 1}" v-for="(team, i) in sortedTeams" :key="i" @click="selectTeam(team)">
    <td class="pos">{{i + 1}}</td>
    <td class="team" :title="getStatsDisplay(team)"><team-logo :logo="team.logo"></team-logo> <span>{{team.name}}</span></td>
    <td class="num games">{{team.getTotalGames()}}</td>
    <td class="num wdl">{{team.divisionStats.win}}</td>
    <td class="num wdl">{{team.divisionStats.draw}}</td>
    <td class="num wdl">{{team.divisionStats.lose}}</td>
    <td class="num goals">{{team.divisionStats.goalsShot}}:{{team.divisionStats.goalsOpponent}}</td>
    <td class="num gd">{{team.getGoalDifference() > 0 ? "+" : ""}}{{team.getGoalDifference()}}</td>
    <td class="num pts">{{team.getPoints()}}</td>
</tr>
</tbody>
</table>`
});