//keyboard shortcuts: 1-9 / 0 switch sections, Space plays the next match, B picks the best XI
addEventListener("keydown", e => {
    if(e.ctrlKey || e.metaKey || e.altKey || e.repeat){
        return;
    }
    let target = e.target;
    if(target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)){
        return;
    }
    //space on a focused button already clicks it
    if(e.key === " " && target.tagName === "BUTTON"){
        return;
    }
    if(!game.init){
        return;
    }

    let sections = getVisibleSections();
    let index = sections.findIndex((s, i) => getTabShortcut(i) === e.key);
    if(index !== -1){
        openSection(sections[index]);
    }
    else if(e.key === " "){
        let matchRunning = game.currentMatch && !game.currentMatch.ended;
        if(!matchRunning && game.team.canPlayNextMatch()){
            game.league.divisions[game.team.divisionRank].playNextMatch();
            game.tab = "tab-match";
        }
        e.preventDefault();
    }
    else if(e.key.toLowerCase() === "b"){
        let settings = game.settings.team;
        game.team.pickBestEleven(settings.autoSubstitute ? settings.substituteStamina : 0);
    }
});
