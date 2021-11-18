import paper from 'paper';

function random(a , b) {
    return a + Math.random() * (b - a);
}

function randomPoint(a, b, c, d) {
    return new Point(random(a, b), random(c, d));
}

function randomInRect(rect) {
    return randomPoint(
        rect.x, rect.x + rect.width, 
        rect.y, rect.y + rect.height
    );
}

function randomInCircle(radius, center) {
    const r = radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2.0 * Math.PI;
    return new Point(center.x + r * Math.cos(theta), center.y + r * Math.sin(theta));
}

function randomHSL(minHue, maxHue, sat = 60, lightness = 60) {
    //const str = 'hsl('.concat(random(a, b).toString(), ', 60%, 60%)');

    const hue = random(minHue, maxHue);
    const str = `hsl(${hue}, ${sat}%, ${lightness}%)`;
    return (new Color(str)).convert('rgb');
}

function lerp(value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
}

function map(v, in_min, in_max, out_min, out_max) {
    return (v - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function completelyInside(R1, R2) {
    if (
        (R2.x+R2.width) < (R1.x+R1.width)
        && (R2.x) > (R1.x)
        && (R2.y) > (R1.y)
        && (R2.y+R2.height) < (R1.y+R1.height)
    ) {
        return true;
    }
    return false;
}

function pathContainsRect(path, rect) {
    if (
        path.contains(rect.topLeft) && 
        path.contains(rect.topRight) && 
        path.contains(rect.bottomLeft) &&
        path.contains(rect.bottomRight)
    ) {
        return true;
    }
    return false;
}

class ClassicalNoise {
    /**
     * You can pass in a random number generator object if you like.
     * It is assumed to have a random() method.
     */
    constructor(r = Math) {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
                      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
                      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]; 
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(r.random()*256);
        }

        // To remove the need for index wrapping, double the permutation table length 
        this.perm = []; 
        for(let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    dot(g, x, y, z) { 
        return g[0] * x + g[1] * y + g[2] * z; 
    }

    mix(a, b, t) { 
        return (1.0-t) * a + t * b; 
    } 

    fade(t) { 
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); 
    } 

    noise(x, y, z) { 
        // Find unit grid cell containing point 
        let X = Math.floor(x); 
        let Y = Math.floor(y); 
        let Z = Math.floor(z); 
          
        // Get relative xyz coordinates of point within that cell 
        x = x - X; 
        y = y - Y; 
        z = z - Z; 
          
        // Wrap the integer cells at 255 (smaller integer period can be introduced here) 
        X = X & 255; 
        Y = Y & 255; 
        Z = Z & 255;
            
        // Calculate a set of eight hashed gradient indices 
        let gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12; 
        let gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12; 
        let gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12; 
        let gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12; 
        let gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12; 
        let gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12; 
        let gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12; 
        let gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12; 

        // Calculate noise contributions from each of the eight corners 
        let n000= this.dot(this.grad3[gi000], x, y, z); 
        let n100= this.dot(this.grad3[gi100], x-1, y, z); 
        let n010= this.dot(this.grad3[gi010], x, y-1, z); 
        let n110= this.dot(this.grad3[gi110], x-1, y-1, z); 
        let n001= this.dot(this.grad3[gi001], x, y, z-1); 
        let n101= this.dot(this.grad3[gi101], x-1, y, z-1); 
        let n011= this.dot(this.grad3[gi011], x, y-1, z-1); 
        let n111= this.dot(this.grad3[gi111], x-1, y-1, z-1);

        // Compute the fade curve value for each of x, y, z 
        let u = this.fade(x); 
        let v = this.fade(y); 
        let w = this.fade(z); 
        // Interpolate along x the contributions from each of the corners 
        let nx00 = this.mix(n000, n100, u); 
        let nx01 = this.mix(n001, n101, u); 
        let nx10 = this.mix(n010, n110, u); 
        let nx11 = this.mix(n011, n111, u); 
        // Interpolate the four results along y 
        let nxy0 = this.mix(nx00, nx10, v); 
        let nxy1 = this.mix(nx01, nx11, v); 
        // Interpolate the two last results along z 
        let nxyz = this.mix(nxy0, nxy1, w);

        return nxyz; 
    }
}

//initialize a global perlin noise instance and noise seed
const noise = new ClassicalNoise();
const noiseSeed = Math.random() * 255;

function applyNoiseToPath(path, sampleDist, noiseFreq, noiseScale) {
    if (path instanceof Group) {
        for(let i = 0; i < path.children.length; i++) {
            applyNoiseToPath(path.children[i], sampleDist, noiseFreq, noiseScale);
        }
    }
    else {
        if(sampleDist < path.length) {
            path.flatten(sampleDist);
        }

        for(let i = 0; i < path.segments.length; i++) {
            let noiseX = noise.noise(
                path.segments[i].point.x / noiseFreq,
                path.segments[i].point.y / noiseFreq,
                noiseSeed
            );

            let noiseY = noise.noise(
                path.segments[i].point.y / noiseFreq,
                noiseSeed,
                path.segments[i].point.x / noiseFreq
            );

            path.segments[i].point = path.segments[i].point.add((new Point(noiseX, noiseY)).multiply(noiseScale));
        }

        path.smooth();
    }
}

function applyGrainToPath(path, maxPoints, minPointSize = 0.25, maxPointSize = 1.0, hueVar = 50.0, lightnessVar = 0.2, falloffTowardsCenter = true) {
    const center = path.bounds.center;
    const w = path.bounds.width;
    const h = path.bounds.height;
    const maxD = Math.sqrt(w * w + h * h) * 0.5;

    for (let i = 0; i < maxPoints; i++) {
        const offset = randomPoint(-w * 0.5, w * 0.5, -h * 0.5, h * 0.5);
        const displaced = center.add(offset);

        const d = displaced.getDistance(center);
        const falloff = map(d, 0.0, maxD, 0.0, 1.0);

        if (path.contains(displaced) && (falloffTowardsCenter && random(0.0, 1.0) < falloff)) {
            let dot = new Path.Circle(displaced, random(minPointSize, maxPointSize));

            dot.fillColor = path.fillColor.clone();
            dot.fillColor.hue += random(-hueVar, hueVar);
            dot.fillColor.lightness += random(-lightnessVar, lightnessVar);
            dot.fillColor.alpha = 0.5;

            path.addChild(dot);
        }
    }
}

function overlap(path, count, r, resolution = 80) {

    const center = path.bounds.center;
    //const r = Math.max(path.bounds.width, path.bounds.height);

    for (let i = 0; i < count; i++) {

        // Draw a displaced circular shape with the given offset
        let position = randomInRect(path.bounds);

        let blob = new Path.RegularPolygon(position, resolution, random(r * 0.025, r * 0.120));
        applyNoiseToPath(blob, 6, 30.5, 10.0);

        if (!pathContainsRect(path, blob.bounds)) {
            blob = blob.intersect(path);
        }

        const d = position.getDistance(center);

        const falloff = map(d, 0, r, 1, 0);
        
        blob.fillColor = path.fillColor.clone();
        blob.fillColor.hue += random(-30 * falloff, 30 * falloff);
        blob.fillColor.lightness += map(d, 0, r, 0.2, 0);
        blob.fillColor.saturation += random(-0.2 * falloff, 0.2 * falloff);

        path.addChild(blob);
    }
}

function drawBody(center) {
    let r = 200;
    let ret = new Group();
    
    // Generate the main body shape
    let bodyColor = randomHSL(0, 30, 30);
    let body = new Path.RegularPolygon(center, 80, 200);
    body.fillColor = bodyColor;
    body.smooth();
    applyNoiseToPath(body, 6, 70, 10.0);
    applyNoiseToPath(body, 6, 30.5, 10.0);
    ret.addChild(body);

    overlap(body, 2000, r);
    // let overlaps = 2000;
    // let checks = 0;

    // for (let i = 0; i < overlaps; i++) {
    //     // Draw a displaced circular shape with the given offset
    //     let position = randomInCircle(200, center);

    //     let blob = new Path.RegularPolygon(position, 80, random(r * 0.025, r * 0.120));
    //     applyNoiseToPath(blob, 6, 30.5, 10.0);

    //     if (!pathContainsRect(body, blob.bounds)) {
    //         blob = blob.intersect(body);
    //         checks++;
    //     }

    //     const d = position.getDistance(center);

    //     const falloff = map(d, 0, r, 1, 0);
        
    //     blob.fillColor = bodyColor.clone();
    //     blob.fillColor.hue += random(-30 * falloff, 30 * falloff);
    //     blob.fillColor.lightness += map(d, 0, r, 0.2, 0);
    //     blob.fillColor.saturation += random(-0.2 * falloff, 0.2 * falloff);

    //     //applyGrainToPath(o, 300, 0.25, 1.0);

    //     ret.addChild(blob);
    // }
    // console.log('Did checks:', checks);

    applyGrainToPath(body, 4000, 0.25, 1.0);
    
    return ret;
}

function drawShadow(body) {
    const center = body.bounds.bottomCenter.add(new Point(0.0, 50.0));
    let shadow = new Path.RegularPolygon(center, 80, body.bounds.width * 0.5);
    applyNoiseToPath(shadow, 6, 70, 10.0);
    applyNoiseToPath(shadow, 6, 30.5, 10.0);
    shadow.fillColor = '#7c788a';
    shadow.fillColor.alpha = 0.1;
    shadow.scale(1, 0.2);
}

paper.install(window);
window.onload = function() {
    paper.setup('drawing');

    const center = view.center;
    const origin = new Point(0, 0);

    let background = new Path.Rectangle(origin, view.size);
    background.fillColor = new Color(240 / 255, 233 / 255, 230 / 255);

    let body = drawBody(center);

    drawShadow(body);
}