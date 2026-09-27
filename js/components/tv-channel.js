app.component("tv-channel", {
    props: ["channel"],
    data(){
        return {
            ctx: null
        };
    },
    methods: {
        formatNumber: functions.formatNumber,
        render(){
            let ctx = this.ctx;
            let w = ctx.canvas.width, h = ctx.canvas.height;
            let t = Date.now() / 1000;
            ctx.clearRect(0, 0, w, h);
            if(!this.channel.bought){
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, w, h);
            }
            else if(this.channel.matchRunning()){
                ctx.drawImage(images.background, 0, 0, w, h);
                let x = (t / 22) % 1 < 0.5 ? ((t / 11) % 1) * w : w - ((t / 11) % 1) * w;
                let y = (t / 10) % 1 < 0.5 ? ((t / 5) % 1) * h : h - ((t / 5) % 1) * h;
                Utils.drawRotatedImage(ctx, images.ball, x, y, h / 4, h / 4, t % (2 * Math.PI));
                ctx.font = "900 " + (h * 0.2) + "px Montserrat";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(game.currentMatch.score1 + " - " + game.currentMatch.score2, w / 2, h / 2, w / 2);
            }
            else{
                for(let x = 0; x < w; x += w / 100){
                    for(let y = 0; y < h; y += w / 100){
                        ctx.fillStyle = Math.random() < 0.5 ? "white" : "black";
                        ctx.fillRect(x, y, w / 100, w / 100);
                    }
                }
                ctx.fillStyle = "#00000060";
                ctx.fillRect(0, (t / 3 * h) % (2 * h) - h * 0.4, w, h / 4)
            }

            ctx.fillStyle = "#00000090";
            ctx.fillRect(0, 0, w * 0.6, h * 0.3);
            ctx.font = "900 " + (h * 0.1) + "px Montserrat";
            ctx.fillStyle = "white";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            //the screen has rounded corners, so keep the name away from the edges
            ctx.fillText(this.channel.name, w * 0.1, h * 0.12, w * 0.45);

            this.frame = requestAnimationFrame(this.render);
        },
        startRender(){
            this.ctx = this.$refs.canvas.getContext("2d");
            this.frame = requestAnimationFrame(this.render);
        }
    },
    computed: {
        canAfford(){
            return game.money.gte(this.channel.price);
        },
        renderCanvas(){
            return game.settings.tv.renderCanvas;
        }
    },
    watch: {
        renderCanvas(){
            cancelAnimationFrame(this.frame);
            if(this.renderCanvas){
                this.$nextTick(this.startRender);
            }
        }
    },
    mounted(){
        if(this.renderCanvas){
            this.startRender();
        }
    },
    beforeUnmount(){
        cancelAnimationFrame(this.frame);
    },
    template: `<div class="tv-channel" :class="{locked: !channel.bought, live: channel.bought && channel.matchRunning()}">
<div class="tv-screen">
    <canvas v-if="renderCanvas" ref="canvas" width="240" height="160"></canvas>
    <ui-icon v-else :name="channel.bought ? 'tv' : 'tv-off'"></ui-icon>
    <span class="tv-live" v-if="channel.bought && channel.matchRunning()">On Air</span>
</div>
<div class="tv-info" v-if="!channel.bought">
    <h4><ui-icon name="lock"></ui-icon> Locked Channel</h4>
    <p>Contract it to earn Money every second of a Match.</p>
    <button class="buy" :disabled="!canAfford" @click="channel.buy()"><ui-icon name="coins"></ui-icon> Contract {{formatNumber(channel.price)}} $</button>
</div>
<div class="tv-info" v-else>
    <h4>{{channel.name}}</h4>
    <p class="tv-stats">
        <span><b>{{formatNumber(channel.getMPS(), 2, 2)}} $</b> per second in Match</span>
        <span><b>x{{formatNumber(channel.moneyMultiplier, 2, 2)}}</b> Match Rewards</span>
    </p>
</div>
</div>`
});