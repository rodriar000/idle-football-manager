class TeamLogo{
    constructor(icon, gradient, sides, stripeColor){
        this.icon = icon;
        this.gradient = gradient;
        this.sides = sides;
        this.stripeColor = stripeColor;
        //customization, defaults match the original look
        this.pattern = "stripes";
        this.gradientDirection = "vertical";
        this.outlineColor = "#000000";
        this.iconColor = "#ffffff";
    }

    static get patterns(){
        return {stripes: "Two Stripes", center: "Center Stripe", hoops: "Hoops", sash: "Sash", halves: "Halves", checkered: "Checkered", none: "None"};
    }

    static get gradientDirections(){
        return {vertical: "Top to Bottom", horizontal: "Left to Right", diagonal: "Diagonal", radial: "From Center"};
    }

    createGradient(ctx, w, h){
        let grad;
        switch(this.gradientDirection){
            case "horizontal":
                grad = ctx.createLinearGradient(w * 0.1, h / 2, w * 0.9, h / 2);
                break;
            case "diagonal":
                grad = ctx.createLinearGradient(w * 0.15, h * 0.15, w * 0.85, h * 0.85);
                break;
            case "radial":
                grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h / 2);
                break;
            default:
                grad = ctx.createLinearGradient(w / 2, h * 0.2, w / 2, h);
        }
        for(let i = 0; i < this.gradient.length; i++) {
            grad.addColorStop(i / this.gradient.length, this.gradient[i]);
        }
        return grad;
    }

    drawPattern(ctx, w, h){
        let band = (x, y, bw, bh) => {
            ctx.fillRect(x, y, bw, bh);
            ctx.strokeRect(x, y, bw, bh);
        };
        switch(this.pattern){
            case "center":
                band(w * 0.4, 0, w * 0.2, h);
                break;
            case "hoops":
                band(0, h * 0.3, w, h * 0.13);
                band(0, h * 0.57, w, h * 0.13);
                break;
            case "sash":
                ctx.save();
                ctx.translate(w / 2, h / 2);
                ctx.rotate(-Math.PI / 4);
                band(-w, -h * 0.1, 2 * w, h * 0.2);
                ctx.restore();
                break;
            case "halves":
                ctx.fillRect(w / 2, 0, w / 2, h);
                ctx.beginPath();
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2, h);
                ctx.stroke();
                break;
            case "checkered":
                for(let x = 0; x < 6; x++){
                    for(let y = 0; y < 6; y++){
                        if((x + y) % 2 === 0){
                            ctx.fillRect(x * w / 6, y * h / 6, w / 6, h / 6);
                        }
                    }
                }
                break;
            case "none":
                break;
            default: {
                let off = 0.2;
                band(w * (0.5 - off - 0.075), 0, w * 0.15, h);
                band(w * (0.5 + off - 0.075), 0, w * 0.15, h);
            }
        }
    }

    draw(ctx){
        //base
        let w = ctx.canvas.width, h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = this.createGradient(ctx, w, h);
        Utils.drawPolygon(ctx, w / 2, h / 2, h / 2 - 16, this.sides, false);
        //stripes
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = this.stripeColor;
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 8;
        this.drawPattern(ctx, w, h);
        //outline
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 16;
        Utils.drawPolygon(ctx, w / 2, h / 2, h / 2 - 16, this.sides, true, false);
        //icon
        ctx.fillStyle = this.iconColor;
        ctx.lineWidth = 12;
        ctx.lineJoin = "round";
        ctx.font = "900 " + (h * 0.5) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        //outline first so the icon color stays fully visible
        ctx.strokeText(this.icon, w / 2, h / 2);
        ctx.fillText(this.icon, w / 2, h / 2);
        ctx.lineJoin = "miter";
    }

    load(obj){
        this.gradient = obj.gradient;
        this.sides = obj.sides;
        this.stripeColor = obj.stripeColor;
        this.icon = obj.icon;
        this.pattern = obj.pattern || "stripes";
        this.gradientDirection = obj.gradientDirection || "vertical";
        this.outlineColor = obj.outlineColor || "#000000";
        this.iconColor = obj.iconColor || "#ffffff";
    }
}
