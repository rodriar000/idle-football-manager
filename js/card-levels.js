//card colour of a player: fixed levels by ATT+DEF, one family per power of ten (about one Division),
//the upper half of each power of ten is the rare card of that family; past the list the levels go on as Galactic 1, 2, 3...
const CardLevels = {
    families: [
        {id: "bronze", name: "Bronze"},
        {id: "silver", name: "Silver"},
        {id: "gold", name: "Gold"},
        {id: "inform", name: "In-Form"},
        {id: "future", name: "Future Stars", short: "Future"},
        {id: "headliner", name: "Headliners"},
        {id: "hero", name: "Hero"},
        {id: "tots", name: "Team of the Season", short: "TOTS"},
        {id: "toty", name: "Team of the Year", short: "TOTY"},
        {id: "icon", name: "Icon"},
        {id: "ultimate", name: "Ultimate"},
        {id: "legend", name: "Legend"},
        {id: "mythic", name: "Mythic"},
        {id: "cosmic", name: "Cosmic"}
    ],
    //Bronze covers everything below 100, every other family one power of ten
    firstPower: 2,

    of(total){
        let log = total.gt(0) ? total.log10() : 0;
        let index = Math.max(0, Math.floor(log) - this.firstPower + 1);
        let rare = index === 0 ? log >= 1.5 : log - Math.floor(log) >= 0.5;
        return this.level(index, rare);
    },

    level(index, rare){
        let last = this.families.length - 1;
        let family = this.families[Math.min(index, last + 1)] || null;
        let galactic = index > last ? index - last : 0;
        let name = galactic ? "Galactic " + galactic : family.name;
        return {
            index, rare, galactic,
            id: galactic ? "galactic" : family.id,
            name,
            short: galactic ? "Galactic " + galactic : family.short || family.name,
            label: (rare ? "Rare " : "") + name,
            //galactic cards turn through the colour wheel, one step per level
            hue: galactic ? (13 + galactic * 47) % 360 : null,
            min: this.min(index),
            max: this.min(index + 1)
        };
    },

    //smallest ATT+DEF of a level
    min(index){
        return index === 0 ? new Decimal(0) : Decimal.pow(10, index + this.firstPower - 1);
    },

    //every family once, then the first Galactic levels, for the guide
    ladder(extra = 3){
        let list = [];
        for(let i = 0; i < this.families.length + extra; i++){
            list.push(this.level(i, false));
        }
        return list;
    }
};
