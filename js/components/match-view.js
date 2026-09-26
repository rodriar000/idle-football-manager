//top-down view of the match: your stadium, both teams and the ball.
//Only a picture of match.ballX and the score, it doesn't change the match.
const FORMATION = [
    [0.04, 0.5],
    [0.2, 0.17], [0.17, 0.39], [0.17, 0.61], [0.2, 0.83],
    [0.4, 0.14], [0.37, 0.38], [0.37, 0.62], [0.4, 0.86],
    [0.58, 0.4], [0.58, 0.6]
];

//"rgb(1, 2, 3)", "#abc" or "white" -> [r, g, b]
function colorToRGB(color){
    let ctx = colorToRGB.ctx || (colorToRGB.ctx = document.createElement("canvas").getContext("2d", {willReadFrequently: true}));
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
}

function colorDistance(a, b){
    let c1 = colorToRGB(a), c2 = colorToRGB(b);
    return Math.hypot(c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2]);
}

function isLightColor(color){
    let [r, g, b] = colorToRGB(color);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

app.component("match-view", {
    props: ["match"],
    data(){
        return {
            ctx: null
        };
    },
    methods: {
        resize(){
            let canvas = this.$refs.canvas;
            let dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
            canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
            this.bgKey = null;
        },
        getStadiumOptions(){
            let stadium = game.stadium;
            let capacity = stadium.getCapacity();
            let tiers = StadiumRenderer.getTiers(capacity);
            let fill = capacity.gt(0) ? Math.max(0.05, stadium.attendance.div(capacity).toNumber()) : 0;
            return {
                tiers,
                fill: Math.round(fill * 20) / 20,
                colors: StadiumRenderer.getCrowdColors(game.team),
                seed: 12345
            };
        },
        //the stadium is drawn once into two images (calm and cheering crowd)
        prepareBackground(w, h){
            let opts = this.getStadiumOptions();
            let key = [w, h, opts.tiers, opts.fill, opts.colors.join()].join("|");
            if(key === this.bgKey){
                return;
            }
            this.bgKey = key;
            opts.rowSize = Math.max(3, h * 0.014);
            this.backgrounds = [false, true].map(jump => {
                let canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                this.pitch = StadiumRenderer.draw(canvas.getContext("2d"), w, h, Object.assign({jump}, opts));
                return canvas;
            });
        },
        prepareTeams(){
            if(this.teamsFor === this.match){
                return;
            }
            this.teamsFor = this.match;
            let kit1 = this.match.team1.logo.gradient[0];
            let kit2 = this.match.team2.logo.gradient[0];
            //clashing kits: the away team wears its second colour, or white/black
            if(colorDistance(kit1, kit2) < 110){
                let options = this.match.team2.logo.gradient.slice(1).concat(["#f8fafc", "#111827"]);
                kit2 = options.find(c => colorDistance(kit1, c) >= 110) || "#f8fafc";
            }
            this.kits = [kit1, kit2];
            this.players = [0, 1].map(team => FORMATION.map(([x, y]) => ({x: team === 0 ? x : 1 - x, y})));
            this.ball = {y: 0.5, target: 0.5, next: 0};
            this.lastScore = this.match.score1 + this.match.score2;
        },
        update(dt, now){
            let bx = 0.5 + Math.max(-1, Math.min(1, this.match.ballX)) * 0.5;
            let ball = this.ball;
            //ball wanders across the width, and towards the middle near the goals
            if(now > ball.next){
                ball.target = 0.15 + 0.7 * Math.random();
                ball.next = now + 800 + Math.random() * 1200;
            }
            let target = Math.abs(bx - 0.5) > 0.4 ? 0.5 : ball.target;
            ball.y += (target - ball.y) * (1 - Math.exp(-dt * 1.5));
            ball.x = bx;
            let follow = 1 - Math.exp(-dt * 4);
            for(let team = 0; team < 2; team++){
                let count = this.getPlayerCount(team);
                let list = this.players[team];
                //the outfield player closest to the ball goes for it
                let chaser = -1, best = Infinity;
                for(let i = 1; i < count; i++){
                    let d = Math.hypot(list[i].x - bx, list[i].y - ball.y);
                    if(d < best){
                        best = d;
                        chaser = i;
                    }
                }
                for(let i = 0; i < count; i++){
                    let [fx, fy] = FORMATION[i];
                    let shift = (bx - 0.5) * (i === 0 ? 0.06 : 0.5);
                    let tx = (team === 0 ? fx : 1 - fx) + shift;
                    let ty = fy + (ball.y - 0.5) * (i === 0 ? 0.3 : 0.25);
                    if(i === chaser){
                        tx = bx + (team === 0 ? -0.015 : 0.015);
                        ty = ball.y;
                    }
                    tx += Math.sin(now / 900 + i * 1.7 + team) * 0.01;
                    ty += Math.cos(now / 1100 + i * 2.3 + team) * 0.012;
                    list[i].x += (Math.max(0.01, Math.min(0.99, tx)) - list[i].x) * follow;
                    list[i].y += (Math.max(0.03, Math.min(0.97, ty)) - list[i].y) * follow;
                }
            }
        },
        getPlayerCount(team){
            let t = team === 0 ? this.match.team1 : this.match.team2;
            return Math.min(11, t.getActivePlayingPlayers().length);
        },
        drawPlayer(ctx, x, y, r, kit, number){
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.ellipse(x + r * 0.25, y + r * 0.35, r, r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = kit;
            ctx.strokeStyle = isLightColor(kit) ? "#111827" : "#f8fafc";
            ctx.lineWidth = Math.max(1, r * 0.22);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if(r >= 6){
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "700 " + Math.round(r * 1.05) + "px Montserrat, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(number, x, y + r * 0.06);
            }
        },
        draw(){
            this.frame = requestAnimationFrame(this.draw);
            let ctx = this.ctx;
            let w = ctx.canvas.width, h = ctx.canvas.height;
            let now = performance.now();
            let dt = Math.min(0.1, (now - (this.lastFrame || now)) / 1000);
            this.lastFrame = now;
            this.prepareBackground(w, h);
            this.prepareTeams();

            let score = this.match.score1 + this.match.score2;
            if(score > this.lastScore){
                this.cheerUntil = now + 2000;
            }
            this.lastScore = score;
            this.update(dt, now);

            let cheering = now < (this.cheerUntil || 0);
            ctx.drawImage(this.backgrounds[cheering && Math.floor(now / 180) % 2 === 0 ? 1 : 0], 0, 0);
            let p = this.pitch;

            //camera flashes in the stands while cheering
            if(cheering){
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                for(let i = 0; i < 6; i++){
                    let fx = Math.random() * w, fy = Math.random() < 0.5 ? Math.random() * p.y : p.y + p.h + Math.random() * (h - p.y - p.h);
                    ctx.beginPath();
                    ctx.arc(fx, fy, Math.max(1.5, h * 0.004), 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            let r = Math.max(3, p.h * 0.03);
            for(let team = 0; team < 2; team++){
                let count = this.getPlayerCount(team);
                for(let i = 0; i < count; i++){
                    let pl = this.players[team][i];
                    this.drawPlayer(ctx, p.x + pl.x * p.w, p.y + pl.y * p.h, r, this.kits[team], i + 1);
                }
            }

            let bx = p.x + this.ball.x * p.w, by = p.y + this.ball.y * p.h;
            let br = r * 0.75;
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.beginPath();
            ctx.ellipse(bx + br * 0.4, by + br * 0.5, br, br * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            Utils.drawRotatedImage(ctx, images.ball, bx, by, br * 2, br * 2, this.ball.x * 40);
        }
    },
    mounted(){
        this.ctx = this.$refs.canvas.getContext("2d");
        this.resize();
        if(window.ResizeObserver){
            this.observer = new ResizeObserver(() => this.resize());
            this.observer.observe(this.$refs.canvas);
        }
        this.draw();
    },
    beforeUnmount(){
        cancelAnimationFrame(this.frame);
        if(this.observer){
            this.observer.disconnect();
        }
    },
    template: `<canvas class="match-view" ref="canvas" aria-label="Match view"></canvas>`
});
