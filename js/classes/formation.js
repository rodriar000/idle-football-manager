//Player positions and team formations.
//A player gives full ATT and DEF in their own position and less anywhere else;
//the formation decides how many places each position has and tilts the team a bit towards attack or defense.
const Positions = Object.freeze({
    list: ["GK", "DEF", "MID", "FWD"],
    names: {GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward"},
    //share of ATT in ATT+DEF each outfield position is generated with
    shares: {GK: [0.12, 0.28], DEF: [0.2, 0.4], MID: [0.4, 0.6], FWD: [0.6, 0.8]},

    //how much of their stats a player gives in a place: [player position][place]
    fits: {
        GK: {GK: 1, DEF: 0.5, MID: 0.5, FWD: 0.5},
        DEF: {GK: 0.5, DEF: 1, MID: 0.85, FWD: 0.7},
        MID: {GK: 0.5, DEF: 0.85, MID: 1, FWD: 0.85},
        FWD: {GK: 0.5, DEF: 0.7, MID: 0.85, FWD: 1}
    },

    fit(position, place){
        return Positions.fits[position || "MID"][place];
    },

    //outfield position from how attacking a player is (players from before positions existed)
    fromShare(share){
        if(share < 0.38){
            return "DEF";
        }
        return share > 0.62 ? "FWD" : "MID";
    },

    attackShare(player){
        let total = player.attack.add(player.defense);
        return total.gt(0) ? player.attack.div(total).toNumber() : 0.5;
    },

    //market players: a few keepers, the rest spread over the outfield
    random(){
        let r = Math.random();
        return r < 0.12 ? "GK" : r < 0.42 ? "DEF" : r < 0.72 ? "MID" : "FWD";
    }
});

const Formations = Object.freeze({
    list: {
        "3-4-3": {DEF: 3, MID: 4, FWD: 3, att: 1.12, def: 0.9},
        "4-3-3": {DEF: 4, MID: 3, FWD: 3, att: 1.08, def: 0.94},
        "3-5-2": {DEF: 3, MID: 5, FWD: 2, att: 1.05, def: 0.97},
        "4-4-2": {DEF: 4, MID: 4, FWD: 2, att: 1, def: 1},
        "4-5-1": {DEF: 4, MID: 5, FWD: 1, att: 0.97, def: 1.05},
        "5-3-2": {DEF: 5, MID: 3, FWD: 2, att: 0.94, def: 1.08},
        "5-4-1": {DEF: 5, MID: 4, FWD: 1, att: 0.9, def: 1.12}
    },
    default: "4-4-2",

    keys(){
        return Object.keys(Formations.list);
    },

    get(key){
        return Formations.list[key] || Formations.list[Formations.default];
    },

    //the 11 places of a formation, keeper first
    places(key){
        let f = Formations.get(key);
        let places = ["GK"];
        for(let pos of ["DEF", "MID", "FWD"]){
            for(let i = 0; i < f[pos]; i++){
                places.push(pos);
            }
        }
        return places;
    },

    power(player){
        return player.getAttack().add(player.getDefense());
    },

    //puts players into the places of a formation: first everyone who fits a place of their own position
    //(strongest first), then the rest where they fit best. Returns [{place, player, fit}], 11 entries.
    //With more than 11 players this is the best eleven for the formation.
    //fitBonus raises what players give out of position (the manager's Versatility perk)
    assign(players, key, power = Formations.power, fitBonus = 0){
        let slots = Formations.places(key).map(place => ({place, player: null, fit: 0}));
        let left = Array.from(players).sort((a, b) => power(b).cmp(power(a)));
        for(let slot of slots){
            let i = left.findIndex(p => p.position === slot.place);
            if(i >= 0){
                slot.player = left.splice(i, 1)[0];
                slot.fit = 1;
            }
        }
        //the keeper place is filled first: every team needs someone in goal
        for(let slot of slots){
            if(slot.player || left.length === 0){
                continue;
            }
            let best = 0;
            for(let i = 1; i < left.length; i++){
                let a = power(left[i]).mul(Positions.fit(left[i].position, slot.place));
                let b = power(left[best]).mul(Positions.fit(left[best].position, slot.place));
                if(a.gt(b)){
                    best = i;
                }
            }
            slot.player = left.splice(best, 1)[0];
            slot.fit = Math.min(1, Positions.fit(slot.player.position, slot.place) + fitBonus);
        }
        return slots;
    }
});
