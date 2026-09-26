//top-down stadium drawing, shared by the match view and the stadium tab
const StadiumRenderer = {
    //0 = no stadium yet, then one more ring of stands for each 10x capacity
    getTiers(capacity){
        if(capacity.lte(0)){
            return 0;
        }
        return Math.max(1, Math.min(6, Math.floor(capacity.log10()) - 1));
    },

    //colours the crowd wears: mostly the club's, some neutral
    getCrowdColors(team){
        let colors = team.logo.gradient.concat([team.logo.stripeColor]);
        return colors.concat(["#e5e7eb", "#1f2937", "#9ca3af"]);
    },

    //deterministic random so the crowd doesn't flicker between redraws
    random(seed){
        let s = seed % 2147483647;
        if(s <= 0){
            s += 2147483646;
        }
        return () => (s = s * 16807 % 2147483647) / 2147483647;
    },

    //sides with stands: 1 tier has one stand, 2 tiers face each other, 3+ go all around
    getSides(tiers){
        if(tiers <= 0){
            return [];
        }
        if(tiers === 1){
            return ["top"];
        }
        if(tiers === 2){
            return ["top", "bottom"];
        }
        return ["top", "bottom", "left", "right"];
    },

    //pitch rectangle inside a w x h stadium
    getLayout(w, h, tiers, rowSize){
        let rows = tiers <= 0 ? 1 : 1 + tiers * 2;
        let band = rows * rowSize;
        let sides = this.getSides(tiers);
        let pad = rowSize * 1.5;
        let top = (sides.includes("top") ? band : 0) + pad;
        let bottom = (sides.includes("bottom") ? band : 0) + pad;
        let left = (sides.includes("left") ? band : 0) + pad;
        let right = (sides.includes("right") ? band : 0) + pad;
        return {
            rows, band, sides,
            pitch: {x: left, y: top, w: w - left - right, h: h - top - bottom}
        };
    },

    drawPitch(ctx, p){
        let stripes = 12;
        for(let i = 0; i < stripes; i++){
            ctx.fillStyle = i % 2 === 0 ? "#2f8f3a" : "#29803a";
            ctx.fillRect(p.x + p.w * i / stripes, p.y, p.w / stripes + 1, p.h);
        }
        //lines, proportions of a 105 x 68 pitch
        let lw = Math.max(1, p.h * 0.008);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = lw;
        let m = lw * 2;
        let x = p.x + m, y = p.y + m, w = p.w - 2 * m, h = p.h - 2 * m;
        ctx.strokeRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, h * 0.135, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, lw * 1.5, 0, Math.PI * 2);
        ctx.fill();
        for(let side of [0, 1]){
            let dir = side === 0 ? 1 : -1;
            let gx = side === 0 ? x : x + w;
            let boxW = w * 16.5 / 105, boxH = h * 40.3 / 68;
            let smallW = w * 5.5 / 105, smallH = h * 18.3 / 68;
            ctx.strokeRect(side === 0 ? gx : gx - boxW, y + (h - boxH) / 2, boxW, boxH);
            ctx.strokeRect(side === 0 ? gx : gx - smallW, y + (h - smallH) / 2, smallW, smallH);
            ctx.beginPath();
            ctx.arc(gx + dir * w * 11 / 105, y + h / 2, lw * 1.5, 0, Math.PI * 2);
            ctx.fill();
            //penalty arc: the part of the circle outside the box
            ctx.save();
            ctx.beginPath();
            ctx.rect(side === 0 ? gx + boxW : gx - w, y, w - boxW, h);
            ctx.clip();
            ctx.beginPath();
            ctx.arc(gx + dir * w * 11 / 105, y + h / 2, h * 0.135, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            //goal
            let goalH = h * 7.32 / 68, depth = Math.max(4, w * 0.018);
            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.fillRect(side === 0 ? gx - depth : gx, y + (h - goalH) / 2, depth, goalH);
            ctx.strokeRect(side === 0 ? gx - depth : gx, y + (h - goalH) / 2, depth, goalH);
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        }
    },

    //a stand: rows of seats, each taken with a chance of "fill"
    drawStand(ctx, rect, horizontal, rows, rowSize, fill, colors, rand, jump){
        ctx.fillStyle = "#1b2420";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        let length = horizontal ? rect.w : rect.h;
        let cols = Math.floor(length / rowSize);
        let r = rowSize * 0.36;
        for(let row = 0; row < rows; row++){
            //alternate rows are a touch darker, like concrete steps
            ctx.fillStyle = row % 2 === 0 ? "#222c27" : "#1b2420";
            if(horizontal){
                ctx.fillRect(rect.x, rect.y + row * rowSize, rect.w, rowSize);
            }
            else{
                ctx.fillRect(rect.x + row * rowSize, rect.y, rowSize, rect.h);
            }
            for(let c = 0; c < cols; c++){
                let taken = rand() < fill;
                let color = colors[Math.floor(rand() * colors.length)];
                let up = jump && rand() < 0.7 ? rowSize * 0.3 : 0;
                let cx = horizontal ? rect.x + (c + 0.5) * rowSize : rect.x + (row + 0.5) * rowSize;
                let cy = horizontal ? rect.y + (row + 0.5) * rowSize : rect.y + (c + 0.5) * rowSize;
                if(taken){
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(cx, cy - up, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                else{
                    ctx.fillStyle = "#34413a";
                    ctx.fillRect(cx - r * 0.6, cy - r * 0.6, r * 1.2, r * 1.2);
                }
            }
        }
    },

    drawFloodlights(ctx, w, h, size){
        for(let [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]){
            let glow = ctx.createRadialGradient(x, y, 0, x, y, size * 8);
            glow.addColorStop(0, "rgba(255, 252, 230, 0.55)");
            glow.addColorStop(1, "rgba(255, 252, 230, 0)");
            ctx.fillStyle = glow;
            ctx.fillRect(x - size * 8, y - size * 8, size * 16, size * 16);
            //a pole with a row of lamps, pointing at the pitch
            let lx = x + (x ? -size * 1.6 : size * 1.6), ly = y + (y ? -size * 1.6 : size * 1.6);
            ctx.fillStyle = "#fffbe6";
            for(let i = -1; i <= 1; i++){
                ctx.beginPath();
                ctx.arc(lx + i * size * 0.55, ly, size * 0.28, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    //draws the whole stadium into ctx and returns the pitch rectangle
    draw(ctx, w, h, opts){
        let tiers = opts.tiers;
        let rowSize = opts.rowSize;
        let layout = this.getLayout(w, h, tiers, rowSize);
        let rand = this.random(opts.seed || 1);
        ctx.fillStyle = "#0e1512";
        ctx.fillRect(0, 0, w, h);
        let p = layout.pitch;
        //grass around the lines
        let pad = rowSize * 1.5;
        ctx.fillStyle = "#256f31";
        ctx.fillRect(p.x - pad, p.y - pad, p.w + pad * 2, p.h + pad * 2);
        this.drawPitch(ctx, p);
        let b = layout.band, sides = layout.sides;
        let inner = {x: p.x - pad, y: p.y - pad, w: p.w + pad * 2, h: p.h + pad * 2};
        for(let side of sides){
            let rect;
            if(side === "top"){
                rect = {x: inner.x, y: inner.y - b, w: inner.w, h: b};
            }
            else if(side === "bottom"){
                rect = {x: inner.x, y: inner.y + inner.h, w: inner.w, h: b};
            }
            else if(side === "left"){
                rect = {x: inner.x - b, y: inner.y, w: b, h: inner.h};
            }
            else{
                rect = {x: inner.x + inner.w, y: inner.y, w: b, h: inner.h};
            }
            this.drawStand(ctx, rect, side === "top" || side === "bottom", layout.rows, rowSize, opts.fill, opts.colors, rand, opts.jump);
        }
        //no stands yet: a few people standing by the fence
        if(tiers === 0){
            let rect = {x: inner.x, y: inner.y - rowSize * 1.2, w: inner.w, h: rowSize};
            this.drawStand(ctx, rect, true, 1, rowSize, 0.25, opts.colors, rand, opts.jump);
        }
        //corner blocks close the bowl
        if(sides.length === 4){
            ctx.fillStyle = "#18201c";
            for(let [cx, cy] of [[inner.x - b, inner.y - b], [inner.x + inner.w, inner.y - b], [inner.x - b, inner.y + inner.h], [inner.x + inner.w, inner.y + inner.h]]){
                ctx.fillRect(cx, cy, b, b);
            }
        }
        //roof over the outer rows of big stadiums
        if(tiers >= 5){
            ctx.strokeStyle = "rgba(210, 225, 235, 0.35)";
            ctx.lineWidth = b * 0.35;
            ctx.strokeRect(inner.x - b * 0.82, inner.y - b * 0.82, inner.w + b * 1.64, inner.h + b * 1.64);
        }
        if(tiers >= 3){
            this.drawFloodlights(ctx, w, h, Math.max(4, rowSize * 1.4));
        }
        return p;
    }
};
