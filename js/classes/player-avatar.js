//a small generated face for each player, the same for the same name
const PlayerAvatar = {
    cache: new Map(),
    skins: ["#f6d5bd", "#eab991", "#d29a6c", "#ad7449", "#7f4f2e", "#5b3822"],
    hairColors: ["#1c1714", "#3b2618", "#6b4424", "#c9a04f", "#9c3e1d", "#8e8e8e"],

    hash(text){
        let h = 2166136261;
        for(let i = 0; i < text.length; i++){
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    },

    //shirt in the club's colours for your players, grey for players without a club
    getKit(player){
        let team = game.team;
        let own = team.players.includes(player) || game.training.players.includes(player);
        return own ? [team.logo.gradient[0], team.logo.stripeColor] : ["#cbd5e1", "#64748b"];
    },

    get(player){
        let [kit, trim] = this.getKit(player);
        let key = player.name + "|" + kit + "|" + trim;
        if(!this.cache.has(key)){
            this.cache.set(key, this.draw(player.name, kit, trim));
        }
        return this.cache.get(key);
    },

    draw(name, kit, trim){
        let rand = StadiumRenderer.random(this.hash(name) % 2147483646 + 1);
        let pick = list => list[Math.floor(rand() * list.length)];
        let skin = pick(this.skins);
        let hair = pick(this.hairColors);
        let style = Math.floor(rand() * 7);
        let beard = rand() < 0.25 && style !== 2 && style !== 6;
        let s = 96;
        let canvas = document.createElement("canvas");
        canvas.width = canvas.height = s;
        let ctx = canvas.getContext("2d");
        let blob = (x, y, rx, ry, color, start = 0, end = Math.PI * 2) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, start, end);
            ctx.fill();
        };

        //hair behind the head
        if(style === 3){
            blob(48, 38, 29, 27, hair);
        }
        if(style === 2 || style === 6){
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(26, 26, 44, 46, 14) : ctx.rect(26, 26, 44, 46);
            ctx.fill();
        }
        //shirt and collar
        blob(48, 104, 40, 30, kit);
        ctx.fillStyle = trim;
        ctx.beginPath();
        ctx.moveTo(36, 76);
        ctx.lineTo(48, 90);
        ctx.lineTo(60, 76);
        ctx.lineTo(55, 76);
        ctx.lineTo(48, 84);
        ctx.lineTo(41, 76);
        ctx.fill();
        //neck, ears, head
        ctx.fillStyle = skin;
        ctx.fillRect(41, 60, 14, 18);
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        ctx.fillRect(41, 60, 14, 6);
        blob(29, 45, 4, 6, skin);
        blob(67, 45, 4, 6, skin);
        blob(48, 43, 19, 22, skin);
        //hair on top
        if(style === 0 || style === 2 || style === 6){
            blob(48, 33, 20, 14, hair, Math.PI, Math.PI * 2);
            ctx.fillRect(28, 32, 40, 4);
        }
        else if(style === 1){
            ctx.globalAlpha = 0.55;
            blob(48, 35, 19.5, 13, hair, Math.PI, Math.PI * 2);
            ctx.globalAlpha = 1;
        }
        else if(style === 3){
            blob(48, 30, 21, 12, hair);
        }
        else if(style === 5){
            ctx.fillStyle = hair;
            ctx.fillRect(43, 13, 10, 18);
        }
        if(style === 6){
            blob(48, 16, 8, 7, hair);
        }
        //beard
        if(beard){
            ctx.globalAlpha = 0.85;
            blob(48, 55, 16, 11, hair, 0, Math.PI);
            ctx.globalAlpha = 1;
            blob(48, 55, 6, 3, skin);
        }
        //face
        ctx.fillStyle = "#1f1a17";
        blob(41, 45, 2.2, 2.6, "#1f1a17");
        blob(55, 45, 2.2, 2.6, "#1f1a17");
        ctx.strokeStyle = hair === "#8e8e8e" ? "#5f5f5f" : hair;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(37, 39);
        ctx.lineTo(44, 38);
        ctx.moveTo(52, 38);
        ctx.lineTo(59, 39);
        ctx.stroke();
        ctx.strokeStyle = "rgba(90, 40, 30, 0.8)";
        ctx.beginPath();
        ctx.arc(48, 52, 5, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        return canvas.toDataURL();
    }
};
