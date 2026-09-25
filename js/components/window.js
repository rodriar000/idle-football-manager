app.component("window", {
    emits: ["closed"],
    data(){
        return{
            x: 0,
            y: 0,
            focus: false //movable
        };
    },
    mounted(){
        this.resetPosition();
        addEventListener("pointermove", this.move);
        addEventListener("pointerup", this.mouseup);
        addEventListener("resize", this.clampPosition);
    },
    beforeUnmount(){
        removeEventListener("pointermove", this.move);
        removeEventListener("pointerup", this.mouseup);
        removeEventListener("resize", this.clampPosition);
    },
    methods: {
        getWidth(){
            //rect size is 0 on mount (transition), so read the width from css
            return parseFloat(getComputedStyle(this.$refs.window).width) || 600;
        },
        resetPosition(){
            this.x = innerWidth / 2 - this.getWidth() / 2;
            this.y = scrollY + innerHeight / 4;
            this.clampPosition();
        },
        clampPosition(){
            let width = this.getWidth();
            this.x = Math.max(0, Math.min(this.x, innerWidth - width));
            this.y = Math.max(scrollY, this.y);
        },
        mousedown(e){
            if(e.target.closest("button")){
                return;
            }
            this.focus = true;
            this.lastPointer = {x: e.clientX, y: e.clientY};
        },
        move(e){
            if(this.focus){
                this.x += e.clientX - this.lastPointer.x;
                this.y += e.clientY - this.lastPointer.y;
                this.lastPointer = {x: e.clientX, y: e.clientY};
            }
        },
        mouseup(){
            if(this.focus){
                this.focus = false;
                this.clampPosition();
            }
        },
        close(){
            this.resetPosition();
            this.$emit("closed");
        }
    },
    template: `<div ref="window" class="window" :style="{left: x + 'px', top: y + 'px'}">
        <div class="header" @pointerdown="mousedown($event)">
            <slot name="header"></slot>
            <button @click="close()">X</button>
        </div>
        <div class="body">
            <slot name="body"></slot>
        </div>
    </div>`
});
