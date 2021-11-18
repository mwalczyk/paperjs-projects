import paper from 'paper';

// Random number (float) between a and b
function random(a , b) {
    return a + Math.random() * (b - a);
}

// Random point with x-coord between a and b and y-coord between c and d
function randomPoint(a, b, c, d) {
    return new Point(random(a, b), random(c, d));
}

// Random point inside of the specified rectangle
function randomInRect(rect) {
    return randomPoint(
        rect.x, rect.x + rect.width, 
        rect.y, rect.y + rect.height
    );
}

// Random point inside of the circle with the specified radius and center 
function randomInCircle(radius, center) {
    const r = radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2.0 * Math.PI;
    return new Point(center.x + r * Math.cos(theta), center.y + r * Math.sin(theta));
}

// Random HSL color
function randomHSL(minHue, maxHue, sat = 60, lightness = 60) {
    const hue = random(minHue, maxHue);
    const str = `hsl(${hue}, ${sat}%, ${lightness}%)`;
    return (new Color(str)).convert('rgb');
}

// Linearly interpolate between a and b
function lerp(a, b, percent) {
    percent = percent < 0 ? 0 : percent;
    percent = percent > 1 ? 1 : percent;
    return a + (b - a) * percent;
}

// Maps a number from range a to range b
function map(v, amin, amax, bmin, bmax) {
    return (v - amin) * (bmax - bmin) / (amax - amin) + bmin;
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

const r = 400;

function overlap(path, count, hueVar, saturationVar, lightnessVar, sizePctMin, sizePctMax, noiseScale = 30, clip = true, resolution = 20, level = 0) {
    if (level > 2) return;

    const center = path.bounds.center;
    //const r = Math.max(path.bounds.width, path.bounds.height);

    const size = Math.max(path.bounds.width, path.bounds.height);

    let blobs = [];
    for (let i = 0; i < count; i++) {

        // Draw a displaced circular shape with the given offset
        let position = randomInRect(path.bounds);
        let blob = new Path.RegularPolygon(position, resolution, random(size * sizePctMin, size * sizePctMax));
        applyNoiseToPath(blob, 6, noiseScale, 10);

        if (clip && !pathContainsRect(path, blob.bounds)) {
            blob = blob.intersect(path);
        }

        const dist = position.getDistance(view.center);
        const falloff = map(dist, 0, r, 1, 0.25);
        
        blob.fillColor = path.fillColor.clone();
        blob.fillColor.hue += random(-hueVar * falloff, hueVar * falloff);
        blob.fillColor.lightness += lightnessVar * falloff;
        blob.fillColor.saturation += random(-saturationVar * falloff, saturationVar * falloff);
        //blob.strokeColor = 'black';
        blobs.push(blob);

        // Apparently this doesn't work?
        //path.addChild(blob);

        if (Math.random() < 0.3) {
            const childCount = random(1, 100);
            const childHueVar = hueVar * 1.25; //random(10, 20);
            const childSaturationVar = saturationVar * 1.05;
            const childLightnessVar = -lightnessVar * 0.5;
            const childSizePctMin = random(0.01, 0.05); 
            const childSizePctMax = random(0.05, 0.2); 
            overlap(blob, childCount, childHueVar, childSaturationVar, -0.1, childSizePctMin, childSizePctMax, noiseScale * 1.5, false, resolution, level + 1); 
        }
    }
    return blobs;
}

function drawBody(center) {

    let ret = new Group();
    
    // Generate the main body shape
    let bodyColor = randomHSL(0, 50, 30); // 0 - 50 looks good
    console.log(bodyColor.hue);
    let body = new Path.RegularPolygon(center, 10, r);
    body.fillColor = bodyColor;
    body.smooth();
    applyNoiseToPath(body, 6, 70, 10);
    applyNoiseToPath(body, 6, 30, 10);
    ret.addChild(body);

    // sizePctMax 0.05
    // chance of grandchild: 0.1
    // 1300 children

    let children = overlap(body, 100, 15, 0.2, 0.1, 0.01, 0.25, 30);
    ret.addChildren(children);

    // for (let i = 0; i < children.length; i++) {
    //     if (Math.random() < 0.3) {
    //         const hueVar = random(10, 20);
    //         const sizePctMin = random(0.01, 0.05); // was 0.01
    //         const sizePctMax = random(0.05, 0.2); // was 0.1
    //         let grandchildren = overlap(children[i], 50, hueVar, 0.3, -0.1, sizePctMin, sizePctMax, false); // Also looks good if size pcts match the ones above
    //     }
    // }

    applyGrainToPath(body, 4000, 0.25, 2);
    
    return ret;
}

function drawShadow(body) {
    const center = body.bounds.bottomCenter.add(new Point(0.0, 50.0));
    let shadow = new Path.RegularPolygon(center, 80, body.bounds.width * 0.5);
    applyNoiseToPath(shadow, 6, 70, 10.0);
    applyNoiseToPath(shadow, 6, 30.5, 10.0);
    shadow.fillColor = '#7c788a';
    shadow.fillColor.alpha = 0.15;
    shadow.scale(1, 0.2);
    return shadow;
}

paper.install(window);
window.onload = function() {
    paper.setup('drawing');

    const center = view.center;
    const origin = new Point(0, 0);

    let background = new Path.Rectangle(origin, view.size);
    background.fillColor = new Color(240 / 255, 233 / 255, 230 / 255);
    applyGrainToPath(background, 8000, 0.25, 1.0);

    let body = drawBody(center);

    let shadow = drawShadow(body);
    shadow.insertBelow(body);
}