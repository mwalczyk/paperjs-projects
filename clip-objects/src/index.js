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
    if (path instanceof CompoundPath) {
        return;
    }
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

const hexBackground = '#f5f2eb';
const hexDarkGray = '#262523';

function drawInto(rect, background, circles) {
    let prev = null;
    let prevPath = null;

    const numLines = 50; 
    const numCircles = 50; 
    const numDots =  50; 

    // Draw circles
    const minRadius = 3;
    const maxRadius = 30;
    for (let i = 0; i < numCircles; i++) {
        //if (random(0, 1) < 0.75) continue;
        //const center = circles[i].center; 
        //const radius = circles[i].radius;

        // Choose to draw either a full circle or an arc
        const center = randomPointInRectangle(rect);
        const radius = random(minRadius, maxRadius);
        let path = random() < 0.001 ? 
            new Path.Arc(randomPointInCircle(radius, center), randomPointInCircle(radius, center), randomPointInCircle(radius, center)) : 
            new Path.Circle(center, radius);
 
        path.strokeColor = hexDarkGray;
        path.strokeCap = 'round';

        applyNoiseToPath(path, 6, 40, 5);

        // let group = new Group();
        // group.addChild(path);
        // group.clipped = true;

        // Choose fill color (or no fill at all)
        let chanceDarkFill = map(radius, minRadius, maxRadius, 1.0, 0.0);
        chanceDarkFill = Math.pow(chanceDarkFill, 3.0);
        let chanceLightFill = 0.35;

        if (random() < chanceDarkFill) {
            // "Paint" the inside a dark gray color
            const numStrokes = 50;
            const sides = 50;
            for (let j = 0; j < numStrokes; j++) {
                let paint = new Path.RegularPolygon(
                    randomPointInCircle(radius, center), 
                    sides, 
                    random(0.1 * radius, 0.75 * radius)
                );
                
                applyNoiseToPath(paint, 6, 5, 3);

                let cut = path.intersect(paint);
                cut.strokeColor = undefined;
                cut.fillColor = random() < 0.1? '#343942': hexDarkGray;
                cut.fillColor.alpha = 0.5;
                cut.closePath();

                // TODO: this breaks?
                //applyNoiseToPath(cut, 6, 5, 5);
                
                if (random() < 0.5) {
                    cut.insertAbove(background);
                }

                paint.remove();
            }
        } else if (random() < chanceLightFill) {
            path.fillColor = hexBackground;
        } 

        // Maybe reorder?
        if (random() < 0.5) {
            path.insertAbove(background);
        }

        // Maybe duplicate and scale the path?
        if (random() < 0.35) {
            let dup = path.clone();
            dup.scale(1.25);
            dup.fillColor = undefined;

            // Stroke path that "erases" stuff
            if (random() < 0.5) {
                dup.strokeColor = hexBackground;
                dup.strokeWidth = random(5, 10) * 0.5;
            // Typical, dark stroke path
            } else {
                dup.strokeColor = hexDarkGray;
                dup.strokeWidth = 2;
            }
            applyNoiseToPath(dup, 6, 40, 5);
        }

        // Maybe duplicate the path and redraw with scribbles?
        if (random() < 0.1) {
            let redraw = Math.floor(random(1, 10));
            let prev = path;
            for (let j = 0; j < redraw; j++) {
                let dup = prev.clone();
                dup.fillColor = undefined;
                dup.strokeWidth = 0.5;
                applyNoiseToPath(dup, 6, random(10, 80), random(1, 10));

                if (random() < 0.5) dup.dashArray = [10, 4];

                prev = dup;
            }
        }


    }

    // Draw small "dots" (circles)
    for (let i = 0; i < numDots; i++) {
        const center = randomPointInRectangle(rect);
        const radius = random(1, 3);

        let path = new Path.Circle(center, radius);
        path.strokeColor = hexDarkGray;
        path.fillColor = hexDarkGray;
    
        applyNoiseToPath(path, 6, 40, 5);
    }
    
    for (let i = 0; i < numLines; i++) {
        // Maybe pick up where the previous line ended?
        let start = new Point();
        if (prev !== null && false){//} random() < 0.2) {
            start = prev.clone();
        } else {
            start = randomPointInRectangle(rect);
        }

        let end = start.clone();

        let path = new Path();

        if (random() < 0.725) {
            const center = start;
            const radius = random(10, 400);
            const theta = random(0, 2 * Math.PI);

            // Random point on circle centered on start point
            end = new Point(center.x + Math.cos(theta) * radius, 
                            center.y + Math.sin(theta) * radius);
        } else {
            // Random vertical offset
            end = end.add(new Point(0, random(10, 400)));
        }

        const dir = end.subtract(start).normalize();

        
        path.strokeColor = hexDarkGray;
        path.strokeCap = 'round';
        path.strokeColor.alpha = 0.5;
        
        let divisions = random(10, 100);
        let incr = start.getDistance(end) / divisions;
        for (let j = 0; j < divisions; j++) {
            let curr = start.add(dir.multiply(j * incr));
            path.add(curr);
        }   

        let freq = 40;
        let amp = 5;

        // Sometimes draw really wiggly lines
        if (random() < 0.2) {
            // was 200, 40
            freq /= 200;
            amp *= 20;

            // if (random() < 0.1) {
            //     let a = path.clone();
            //     a.strokeColor = 'red';
            //     applyNoiseToPath(a, 6, freq * 2, amp * 2);
    
            //     let b = path.clone();
            //     b.strokeColor = 'blue';
            //     applyNoiseToPath(b, 6, freq, amp * 2);
            // }
        }
        applyNoiseToPath(path, 6, freq, amp);

        // Sometimes draw another copy on top
        if (random() < 0.1) {
            let dup = path.clone();
            applyNoiseToPath(dup, 6, freq, amp);
        }

        // Save endpoint of this path
        prev = end.clone();
    }

    // Erase some stuff
    const numStrokes = 100; 
    const sides = 100;
    for (let i = 0; i < 40; i++) {
        const c = randomPointInRectangle(rect);
        const r = random(10, 200);

        for (let j = 0; j < numStrokes; j++) {
            let paint = new Path.RegularPolygon(
                randomPointInCircle(r, c), 
                sides, 
                random(5, 20)
            );
            
            applyNoiseToPath(paint, 6, 5, 13);
            paint.strokeColor = undefined;
            paint.fillColor = hexBackground;
            paint.fillColor.alpha = 0.1;
    
        }
    }
    

}

// Add `paper` keyword to the global scope
paper.install(window);

window.onload = function() {
    paper.setup('drawing');

    const center = view.center;

    // Set the "background color" by drawing a full-screen rectangle
    let background = new Path.Rectangle(view.bounds.topLeft, view.size);
    background.fillColor = hexBackground;

    let canvas = view.bounds.clone();
    canvas = canvas.scale(0.5); // was 0.35
    drawInto(canvas, background, []);

    // const rows = 5;
    // const cols = 5;
    // const cell = new Size(view.bounds.width / cols, view.bounds.height / rows);
    // for (let i = 0; i < rows; i++) {
    //     for (let j = 0; j < cols; j++) {
            
    //         if (random() < 0.5) continue;
    //         const corner = new Point(cell.width * j, cell.height * i);
    //         const rect = new Rectangle(corner, cell);
    //         drawInto(rect, background, []);
    //         console.log('Done drawing cell:', i, ',', j);
    //     }
    // }

    applyGrainToPath(background, 10_000);
    applyGrainToPath(background, 1_000, 0.5, 2.0);
}