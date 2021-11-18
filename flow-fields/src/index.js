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
function randomHSLColor(minHue = 0, maxHue = 360, saturation = 100, lightness = 60) {
    const hue = random(minHue, maxHue);
    const str = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    return (new Color(str)).convert('rgb');
}

// Linearly interpolate between a and b
function lerp(a, b, percent = 0.5) {
    percent = percent < 0 ? 0 : percent;
    percent = percent > 1 ? 1 : percent;
    return a + (b - a) * percent;
}

function lerpColors(a, b, percent = 0.5) {
    return new Color(
        lerp(a.red, b.red, percent),
        lerp(a.green, b.green, percent),
        lerp(a.blue, b.blue, percent)
    );
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

function taper(path, minThickness = 2, maxThickness = 5, samples = 20, chanceOfThinning = 0.1) {        
    // The widened path, maybe with ends tapered
    let widened = new Path();
    widened.fillColor = path.fillColor.clone();

    let thickness = random(minThickness, maxThickness);
    const taper = true;
    const sampleDist = path.length / samples;
    
    // Sometimes, make an extremely thin stroke instead
    if (random() < chanceOfThinning) {
        thickness /= 2.0;
    }

    let taperScale = 1.0;

    for(let i = 0; i < samples; i++)
    {
        const sp = Math.min(Math.max(0.01, sampleDist * i), path.length * 0.99);
        const point = path.getPointAt(sp); 
        const norm = path.getNormalAt(sp); 
        if(norm && point)
        {
            norm = norm.normalize();
            if(taper) {
                const falloff = Math.abs(i - samples / 2) * 2;
                taperScale = Math.cos((Math.PI * 0.5 / samples) * falloff);
            }
            widened.add(point.add(norm.multiply(thickness * 0.5 * taperScale)));
        }
    }
    
    for(let i = samples - 1; i >= 0; i--)
    {
        const sp = Math.min(Math.max(0.01, sampleDist * i), path.length * 0.99);
        const point = path.getPointAt(sp); 
        const norm = path.getNormalAt(sp); 
        if(norm && point)
        {
            norm = norm.normalize();
            if(taper) {
                const falloff = Math.abs(i - samples / 2) * 2;
                taperScale = Math.cos((Math.PI * 0.5 / samples) * falloff);
            }
            widened.add(point.subtract(norm.multiply(thickness * 0.5 * taperScale)));
        }
    }   

    widened.closePath();
    widened.smooth();
    
    return widened;
}

function drawPaintStrokes(body, radius, center, index, samples, hueFalloff, minThickness, maxThickness, minSteps = 3, maxSteps = 5, stepSize = 5, chanceOfHueChange = 0.015) {
    // 0.0095 looks good, so does 0.0195 for a "bunched up" look
    const frequency = 0.0095; 

    for (let sample = 0; sample < samples; sample++) {
        // Keep track of where we are in the flow field and where we started
        const start = randomPointInCircle(radius, center);
        let current = start.clone();

        // Create a new curve that will "walk" a random number of steps through the noise field
        let path = new Path();
        const steps = random(minSteps, maxSteps);

        // Build curve by moving through the noise field
        for (let i = 0; i < steps; i++) {
            path.add(current);  

            const n = noise.noise(
                current.x * frequency, 
                current.y * frequency, 
                0 // Can offset noise here too, z-coord
            ); 
            const angle = n * (Math.PI * 2);
            const step = new Point(
                stepSize * Math.cos(angle), 
                stepSize * Math.sin(angle)
            );

            current = current.add(step);
        }
        path.smooth();
        
        const distTo = path.bounds.center.getDistance(center);
        const effect = distTo / radius;
        
        // Copy the body color but modify the hue by some amount that scales based on the distance of this
        // path's center to the body's center
        path.fillColor = body.fillColor.clone();
        path.fillColor.hue += random(-360, 360) * hueFalloff * effect;

        // Darken sub-paths a little too (but make sure they don't fall below some threshold)
        path.fillColor.lightness -= 0.075 * effect;
        path.fillColor.lightness = Math.max(0.35, path.fillColor.lightness);

        // Sometimes, change hue dramatically
        if (random() < chanceOfHueChange) {
            path.fillColor.hue += random(0, 360);
        }

        // Widen the path so that it looks sort of like a brush stroke
        let widened = taper(path, minThickness, maxThickness);
        applyNoiseToPath(widened, 6, 100, 10);
        
        // Remove the "skeleton" path, which is no longer needed
        path.remove();
    }
}

function drawGrowth(radius, center, index, chanceOfHueChange = 0.05) {
    // First, create the "body" of the growth, which is basically a noisy circle
    let body = Path.Circle(center, radius);
    body.fillColor = randomHSLColor(180, 230, 45);

    // Rarely, offset the hue by some large amount
    if (random() < chanceOfHueChange) {
        body.fillColor.hue += random(-180, 180);
    }

    applyNoiseToPath(body, 6, 30, 10);

    const layers = 2;

    let params = {
        'minThickness': [2, 2],
        'maxThickness': [4, 5],
        'minSteps': [3 * 24, 3],
        'maxSteps': [5 * 24, 5],
        'samples': [5, 100], 
        'hueFalloff': [0.025, 0.1]
    };

    for (let layer = 0; layer < layers; layer++) {
        drawPaintStrokes(
            body, radius, center, index,
            params['samples'][layer],
            params['hueFalloff'][layer],
            params['minThickness'][layer],
            params['maxThickness'][layer],
            params['minSteps'][layer],
            params['maxSteps'][layer]
        );
    }
    console.log('Done');
}

class Circle {
    constructor(radius, center) {
        this.radius = radius;
        this.center = center.clone();
    }

    intersects(other) {
        return this.center.getDistance(other.center) < (this.radius + other.radius);
    }

    draw() {
        let path = new Path.Circle(this.center, this.radius);
        path.strokeColor = 'black';
        path.strokeWidth = 1;
    }
}

function circlePacking(rect, maxRadius = 150, iters = 500) {

    let circles = [];

    const startRadius = 1;
    const stepRadius = 1;

    for (let i = 0; i < iters; i++) {

        let current = new Circle(startRadius, randomPointInRectangle(rect));

        while(true) {
            // Stop if the current circle has exceeded the maximum draw radius
            if (current.radius >= maxRadius) {
                circles.push(current);
                break;
            }

            // Check for intersections with all existing circles
            let intersects = false;
            for (let j = 0; j < circles.length; j++) {
                if (current.intersects(circles[j])) {
                    intersects = true;
                    break;
                }
            }

            if (intersects) {
                // This happens if the circle was initialized inside of another circle
                if (current.radius === startRadius) {
                    break;
                } else {
                    // Otherwise, just stop
                    circles.push(current);
                    break;
                }
            } else {
                current.radius += stepRadius;
            }
        }

    }

    circles.forEach(circle => {
        //circle.draw();
    });
    console.log(`Computed ${circles.length} circles`);

    return circles;
}

// Add `paper` keyword to the global scope
paper.install(window);

window.onload = function() {
    paper.setup('drawing');

    const center = view.center;

    // Set the "background color" by drawing a full-screen rectangle
    let background = new Path.Rectangle(view.bounds.topLeft, view.size);
    background.fillColor = '#f2ebe9'

    const growthCount = 800;
    for (let i = 0; i < growthCount; i++) { 
        const radius = random(10, 20); 
        const center = randomPointInRectangle(view.bounds);
        drawGrowth(radius, center, i);
    }
    applyGrainToPath(background, 10_000);

    // // Circle packing
    // let minRadius = 1;
    // let maxRadius = 250;
    // let circles = circlePacking(view.bounds, maxRadius);

    // circles.forEach((circle, circleIndex) => {
        
    //     console.log(`At circle ${circleIndex}...`);

    //     //if (circle.radius > maxRadius * 0.01625) {

    //         drawGrowth(circle.radius * 0.25, circle.center, circleIndex);

    //         // let scale = random(0.5, 3);

    //         // let growthCount = Math.floor(map(circle.radius, minRadius, maxRadius, 1, 50));
    //         // for (let i = 0; i < growthCount; i++) { 
    //         //     const radius = random(10, 20) * scale; 
    //         //     const center = randomPointInCircle(circle.radius, circle.center);
    //         //     drawGrowth(radius, center, circleIndex);
    //         // }
    //     //}
    // });

    applyGrainToPath(background, 10_000);
}

