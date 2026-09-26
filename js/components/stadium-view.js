//your stadium from above, it grows a ring of stands for each 10x capacity
app.component("stadium-view", {
    props: ["stadium"],
    computed: {
        capacity(){
            return this.stadium.getCapacity();
        },
        tiers(){
            return StadiumRenderer.getTiers(this.capacity);
        },
        fill(){
            if(this.capacity.lte(0)){
                return 0;
            }
            let people = Decimal.max(this.stadium.attendance, this.stadium.fans);
            return Math.round(Math.min(1, people.div(this.capacity).toNumber()) * 20) / 20;
        },
        drawKey(){
            return [this.tiers, this.fill, StadiumRenderer.getCrowdColors(this.$root.team).join()].join("|");
        }
    },
    watch: {
        drawKey(){
            this.draw();
        }
    },
    methods: {
        draw(){
            let canvas = this.$refs.canvas;
            let dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
            canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
            StadiumRenderer.draw(canvas.getContext("2d"), canvas.width, canvas.height, {
                tiers: this.tiers,
                fill: this.fill,
                colors: StadiumRenderer.getCrowdColors(this.$root.team),
                rowSize: Math.max(3, canvas.height * 0.02),
                seed: 12345
            });
        }
    },
    mounted(){
        this.draw();
        if(window.ResizeObserver){
            this.observer = new ResizeObserver(() => this.draw());
            this.observer.observe(this.$refs.canvas);
        }
    },
    beforeUnmount(){
        if(this.observer){
            this.observer.disconnect();
        }
    },
    template: `<canvas class="stadium-view" ref="canvas" aria-label="Your Stadium"></canvas>`
});
