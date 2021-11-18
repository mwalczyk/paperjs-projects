import paper from 'paper';

// Random number (float) between a and b
function random(a = 0.0, b = 1.0) {
    return a + Math.random() * (b - a);
}

// Random point with x-coord between a and b and y-coord between c and d
function randomPoint(a, b, c, d) {
    return new Point(random(a, b), random(c, d));
}

// Random point inside of the specified rectangle
function randomPointInRectangle(rect) {
    return randomPoint(
        rect.x, rect.x + rect.width, 
        rect.y, rect.y + rect.height
    );
}

// Random point inside of the circle with the specified radius and center 
function randomPointInCircle(radius, center) {
    const r = radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2.0 * Math.PI;
    return new Point(center.x + r * Math.cos(theta), center.y + r * Math.sin(theta));
}

// Random HSL color
function randomHSLColor(minHue = 0, maxHue = 360, sat = 100, lightness = 100) {
    const hue = random(minHue, maxHue);
    const str = `hsl(${hue}, ${sat}%, ${lightness}%)`;
    return (new Color(str)).convert('rgb');
}

// Linearly interpolate between a and b
function lerp(a, b, percent = 0.5) {
    percent = percent < 0 ? 0 : percent;
    percent = percent > 1 ? 1 : percent;
    return a + (b - a) * percent;
}

// Maps a number from range a to range b
function map(v, aMin, aMax, bMin = 0.0, bMax = 1.0) {
    return (v - aMin) * (bMax - bMin) / (aMax - aMin) + bMin;
}

// Returns true if the specified path fully encloses the specified rectangle
function pathContainsRect(path, rect) { 
    return
        path.contains(rect.topLeft) && 
        path.contains(rect.topRight) && 
        path.contains(rect.bottomLeft) &&
        path.contains(rect.bottomRight);
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
        return (1.0 - t) * a + t * b; 
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
        let gi000 = this.perm[X + this.perm[Y + this.perm[Z]]] % 12; 
        let gi001 = this.perm[X + this.perm[Y + this.perm[Z + 1]]] % 12; 
        let gi010 = this.perm[X + this.perm[Y + 1 + this.perm[Z]]] % 12; 
        let gi011 = this.perm[X + this.perm[Y + 1 + this.perm[Z + 1]]] % 12; 
        let gi100 = this.perm[X + 1 + this.perm[Y + this.perm[Z]]] % 12; 
        let gi101 = this.perm[X + 1 + this.perm[Y + this.perm[Z + 1]]] % 12; 
        let gi110 = this.perm[X + 1 + this.perm[Y + 1 + this.perm[Z]]] % 12; 
        let gi111 = this.perm[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]] % 12; 

        // Calculate noise contributions from each of the eight corners 
        let n000 = this.dot(this.grad3[gi000], x, y, z); 
        let n100 = this.dot(this.grad3[gi100], x - 1, y, z); 
        let n010 = this.dot(this.grad3[gi010], x, y - 1, z); 
        let n110 = this.dot(this.grad3[gi110], x - 1, y - 1, z); 
        let n001 = this.dot(this.grad3[gi001], x, y, z - 1); 
        let n101 = this.dot(this.grad3[gi101], x - 1, y, z - 1); 
        let n011 = this.dot(this.grad3[gi011], x, y - 1, z - 1); 
        let n111 = this.dot(this.grad3[gi111], x - 1, y - 1, z - 1);

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

const noise = new ClassicalNoise();
const noiseSeed = Math.random() * 255;

function applyNoiseToPath(path, sampleDist, noiseDivisions, noiseScale) {
    if (path instanceof Group) {
        for(let i = 0; i < path.children.length; i++) {
            applyNoiseToPath(path.children[i], sampleDist, noiseDivisions, noiseScale);
        }
    }
    else {
        if(sampleDist < path.length) {
            path.flatten(sampleDist);
        }

        for(let i = 0; i < path.segments.length; i++) {
            let noiseX = noise.noise(
                path.segments[i].point.x / noiseDivisions,
                path.segments[i].point.y / noiseDivisions,
                noiseSeed
            );

            let noiseY = noise.noise(
                path.segments[i].point.y / noiseDivisions,
                noiseSeed,
                path.segments[i].point.x / noiseDivisions
            );

            path.segments[i].point = path.segments[i].point.add((new Point(noiseX, noiseY)).multiply(noiseScale));
        }

        path.smooth();
    }
}

function applyGrainToPath(path, maxPoints = 10, minPointSize = 0.25, maxPointSize = 1.0, hueVar = 25.0, saturationVar = 0.25, lightnessVar = 0.25, alpha = 0.5) {
    let group = new Group();
    for (let i = 0; i < maxPoints; i++) {
        const position = randomPointInRectangle(path.bounds);
        if (path.contains(position)) {
            // Create a circular dot with a random radius and color (w.r.t. the parent path's color)
            let dot = new Path.Circle(position, random(minPointSize, maxPointSize));
            dot.fillColor = path.fillColor.clone();
            dot.fillColor.hue += random(-hueVar, hueVar);
            dot.fillColor.saturation += random(-saturationVar, saturationVar);
            dot.fillColor.lightness += random(-lightnessVar, lightnessVar);
            dot.fillColor.alpha = alpha;
            group.addChild(dot);
        }
    }
    return group;
}

function wiggle(line, stops = 10, freq = 5, amp = 1) {
    for (let i = 0; i < stops; i++) {
        line.divideAt((line.length / stops) * i);
    }
    applyNoiseToPath(line, 6, freq, amp);
}

function presetCover(center, radius, path) {
    const total = path.bounds.width;
    const steps = random(10, 20);
    const div = total / steps;
    const offset = new Point(div, 0);

    // Set up clipping path and group
    let clipPath = new Path();
    clipPath.copyContent(path);
    clipPath.clipMask = true;
    applyNoiseToPath(clipPath, 6, 30, 5);

    let clipGroup = new Group();
    clipGroup.addChild(clipPath);
    
    let hatchGroup = new Group();

    for (let i = 0; i < steps; i++) {
        let a = path.bounds.topLeft.add(offset.multiply(i));
        let b = path.bounds.bottomLeft.add(offset.multiply(i));

        let hatch = new Path.Line(a, b);
        hatch.strokeColor = 'black';

        wiggle(hatch);

        hatchGroup.addChild(hatch);
    }

    clipGroup.addChild(hatchGroup);

    // Maybe add another version going the other way
    if (random() < 0.5) {
        let crossHatchGroup = new Group();
        crossHatchGroup.copyContent(hatchGroup);
        crossHatchGroup.rotate(random(0, 180));
        clipGroup.addChild(crossHatchGroup);
    }

    let angle = random(-10, 10);

    // Randomly rotate both the original path and the hatchings
    path.rotate(angle);
    clipGroup.rotate(angle);
}

function presetCrossHatch(center, radius, path) {
    // Create a copy that we'll use ask a clip mask
    let clipPath = new Path();
    clipPath.copyContent(path);
    clipPath.clipMask = true;

    let clipGroup = new Group();
    clipGroup.addChild(clipPath);


    // How many distinct, directional hatching layers to add
    let numLayers = Math.floor(random(1, 4));

    // How far to move each step (percent of total path length)
    let stepFraction = random(0.01, 0.025);
    let step = path.length * stepFraction;

    // Where the hatching starts and ends w.r.t. the total path length
    let startFract = random(0.0, 0.1);
    let endFract = random(0.3, 1.0);
    let distDesired = endFract * path.length - startFract * path.length;
    
    // First, compute the average normal along the specified part of the path
    let averageNormal = new Point();    
    let count = 0;
    let distTraveled = 0.0;
    while (distTraveled < distDesired) {
        const t = Math.min(Math.max(0.01, distTraveled), path.length * 0.99);
        averageNormal = averageNormal.add(path.getNormalAt(t));
        distTraveled += step;
        count++;
    }
    averageNormal = averageNormal.normalize();

    // Each hatch "layer" can undergo an additional rotation
    let angle = 0;

    for (let layer = 0; layer < numLayers; layer++) {
        
        let distTraveled = 0.0;
        
        while (distTraveled < distDesired) {
            const t = Math.min(Math.max(0.01, distTraveled), path.length * 0.99);
            
            const hatchLength = random(radius * 0.2, radius * 0.5);
            
            // Start and end points of this hatch: note we multiply end by -1 since path normals
            // face *outwards* not *inwards*
            let start = path.getPointAt(t);
            let end = start.add(averageNormal.multiply(-hatchLength));
            
            // Create a single "hatch" stroke line
            let hatch = new Path.Line(start, end);
            hatch.rotate(angle, start);
            hatch.strokeColor = 'black';
            wiggle(hatch);

            clipGroup.addChild(hatch);

            distTraveled += step;
        }

        angle += random(45, 135);

    }
}

function drawRock(center, radius) {
    // The base shape
    let path = new Path.RegularPolygon(center, 50, radius);
    path.strokeColor = 'black';

    // Coarse noise
    applyNoiseToPath(path, 6, 60, 20);

    // Fine noise
    applyNoiseToPath(path, 6, 20, 5);

    // Shade the rock somehow
    if (random() < 0.5) {
        presetCrossHatch(center, radius, path);
    } else {
        presetCover(center, radius, path);
    }

    // Add "doughnut hole"
    if (random() < 0.25) {
        
        let cutout = new Path.RegularPolygon(
            center, 
            Math.floor(random(3, 7)), 
            random(radius * 0.1, radius * 0.25));

        cutout.fillColor = 'white';  
        cutout.strokeColor = 'black';
        wiggle(cutout, 100, 10, 3);

        // TODO: there should be a way to do this? Can't do before presets above because
        // normal calculation fails for compound paths
        //path = path.subtract(cutout);
    }
}


// Add `paper` keyword to the global scope
paper.install(window);

window.onload = function() {
    paper.setup('drawing');

    const center = view.center;

    let drawableRegion = view.bounds.scale(0.5);
    for (let i = 0; i < 10; i++) {
        let center = randomPointInRectangle(drawableRegion);
        let radius = random(20, 100);
        drawRock(center, radius);
    }
    

    // Set the "background color" by drawing a full-screen rectangle
    let background = new Path.Rectangle(origin, view.size);
    background.fillColor = '#ffffff'
}