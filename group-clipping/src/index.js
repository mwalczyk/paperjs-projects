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
function randomHSLColor(minHue = 0, maxHue = 360, sat = 100, lightness = 30) {
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

        //path.smooth();
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

function lineBetween(a, b, samples = 10) {
    const length = a.getDistance(b);
    const incr = length / samples;
    let dir = b.subtract(a).normalize();
    let path = new Path();
    for (let i = 0; i < samples; i++) {
        path.add(a.add(dir.multiply(i * incr)));
    }
    return path;
}

function thicken(path, thickness, samples = 100) {        
    // The widened path, maybe with ends tapered
    let widened =  new Path();
    widened.fillColor = path.fillColor.clone();
    widened.fillColor.alpha = 1;
    widened.fillColor.lightness -= 0.1;
    widened.strokeCap = 'round';
    widened.strokeJoin = 'round';
    //widened.clipMask = true;

    let sampleDist = path.length / samples;
    let offset = 10;
    for(let i = offset; i < samples; i++)
    {
        const sp = Math.min(Math.max(0.01, sampleDist * i), path.length * 0.99);
        const point = path.getPointAt(sp); 
        const norm = path.getNormalAt(sp); 
        if(norm && point)
        {
            norm = norm.normalize();
            widened.add(point.add(norm.multiply(thickness * 0.5)));
        }
    }
    
    for(let i = samples - 1; i >= offset; i--) 
    {
        const sp = Math.min(Math.max(0.01, sampleDist * i), path.length * 0.99);
        const point = path.getPointAt(sp); 
        const norm = path.getNormalAt(sp); 
        if(norm && point)
        {
            norm = norm.normalize();
            widened.add(point.subtract(norm.multiply(thickness * 0.5)));
        }
    }   
    widened.closePath();
    applyNoiseToPath(widened, 6, 100, 1);

    //widened.smooth({ type: 'geometric' });


    let group = new Group();
    group.addChild(widened);

    // Paint along
    const step = 10; // 10
    let traveled = sampleDist * offset;
    while (traveled < path.length - (sampleDist * offset)) {

        const point = path.getPointAt(traveled); 
        const t = path.getTangentAt(traveled); 
        const n = path.getNormalAt(traveled); 
        const curv = path.getCurvatureAt(traveled);

        // Create a new curve that will "walk" a random number of steps through the noise field
        let stroke = new Path();
        const steps = random(3, 10);
        let current = point.clone();

        if (false) {
            // Build curve by moving through the noise field
            for (let i = 0; i < steps; i++) {
                stroke.add(current);  

                const n = noise.noise(
                    current.x * 0.001, 
                    current.y * 0.001, 
                    traveled // Can offset noise here too, z-coord
                ); 
                const angle = n * (Math.PI * 2);
                const step = new Point(
                    5.0 * Math.cos(angle), 
                    5.0 * Math.sin(angle)
                );

                current = current.add(step);
            }
            stroke.smooth();
            stroke.fillColor =  path.fillColor.clone();
            stroke.fillColor.hue += random(-30, 30);// + 100;
            stroke.fillColor.lightness += random(-0.3, 0.0);
            stroke.fillColor.alpha = 1;
            let paint = taper(stroke, 1, 5);

            if (random() < 0.25) {
                paint.insertBelow(widened);
            }
        }

        if (false) {
            for (let j = 0; j < 3; j++) {

                let start = point.clone();
                let end = point.add(t.multiply(random(10, 50)));
                let offsetAlongWidth = random(-12, 12);

                start = start.add(n.multiply(offsetAlongWidth));
                end = end.add(n.multiply(offsetAlongWidth));

                
                let stroke = lineBetween(start, end, 10) ;
                stroke.fillColor =  path.fillColor.clone();
                stroke.fillColor.hue += random(-30, 30);
                stroke.fillColor.lightness += random(-0.2, 0.0);
                stroke.fillColor.alpha = 1;

                if (random() < 0.0125) {
                    stroke.fillColor.hue += random(-180, 180);
                }

                applyNoiseToPath(stroke, 6, 30, 5);

                let final = taper(stroke, 7, 12);

                //group.addChild(final);
            }
        }

        traveled += step;
    }
    return widened;
}

// Add `paper` keyword to the global scope
paper.install(window);

class Node {
    constructor() {
        this.l = null;
        //this.m = null;
        this.r = null;
        this.level = 0;

        this.x = 0;
        this.y = 0;
    }
}

class Tree {
    constructor() {
        this.nodes = [];
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
  
function randomBalancedWord(n) {
    let word = [];
    let positions = [];
    for (let i = 0; i < 2 * n; i++) {
        positions.push(i);
        word.push(false);
    }

    for (let i = n; i > 0; i--) {
        let index = getRandomInt(n + i);
        let e = positions[index];
        positions.splice(index, 1);
        word[e] = true;
    }
    return word;
}

function arrayCopy(sourceArr, sourcePos, destArray, destPos, len) {
    for (let i = 0; i < len; i++) {
        destArray[destPos + i] = sourceArr[sourcePos + i];
    }
}

function rearrange(word, start, end) {
    let sum = 0;
    let defectIndex = -1;

    for (let i = start; i < end; i++) {

        sum = sum + (word[i] ? 1 : -1);

        if (defectIndex < 0 && sum < 0) {
            defectIndex = i;
        } else if (defectIndex >= 0 && sum == 0) {
            // We now have irreducible u = rtl spanning [defectIndex, i]
            let uLength = i - defectIndex + 1;
            let flipped = new Array(uLength - 2);

            for (let j = 0; j < flipped.length; j++) {
                flipped[j] = !word[defectIndex + j + 1];
            }

            // Shift the remaining word
            if (i + 1 < end) {
                arrayCopy(word, i + 1, word, defectIndex + 1, end - (i + 1));
            }

            // Rewrite uw as lwrt*, t* being the flipped array
            word[defectIndex] = true;
            arrayCopy(flipped, 0, word, end - flipped.length, flipped.length);
            word[end - uLength + 1] = false;

            // Now recurse on w, worst case we go (word.length/2)-deep
            rearrange(word, defectIndex + 1, end - uLength + 1);
            break;
        }
    }
}

function printLevels(root) {

    let current = root;

}

let k = 0;
let xSpacing = 10;
let ySpacing = 20;
function knuthLayout(root, depth) {
    if (root.l !== null) {
        knuthLayout(root.l, depth + 1);
    }
    root.x = k;
    root.y = depth * ySpacing;
    k += xSpacing;
    if (root.r !== null) {
        knuthLayout(root.r, depth + 1);
    }
}

function randomTree() {
    // The number of internal vertices
    const n = 50;

    let word = randomBalancedWord(n);
    rearrange(word, 0, word.length);
    let asParens = word.map(item => item ? '(' : ')');
    console.log(asParens.join(' '));

    // Translate the balanced word into an actual tree data structure
    let stack = [];
    let root = null;
    let currentNode = null;
    let insertRight = false;

    for (let i = 0; i < word.length; i++) {
        
        if (word[i]) {

            // Open paren '('
            let previousNode = currentNode;
            currentNode = new Node();

            // Set level
            if (previousNode !== null) {
                currentNode.level = previousNode.level + 1;
            }

            if (root === null) {
                root = currentNode;
            } else if (insertRight) {
                previousNode.r = currentNode;
                insertRight = false;
            } else {
                previousNode.l = currentNode;
            }

            stack.push(currentNode);

        } else {

            // Closed paren ')'
            currentNode = stack.pop();
            insertRight = true;

        }
    }

    // Basic Knuth layout to calculate draw positions
    knuthLayout(root, 0);
    console.log(root)

    // Draw the tree
     stack = [root];
    while(stack.length > 0) {
        let current = stack.pop();
        let center = new Point(current.x + view.bounds.center.x, current.y  + view.bounds.center.y);
        let path = new Path.Circle(center, 5);
        path.fillColor = 'red';

        if (current.l !== null) {
            let line = new Path.Line(
                center, 
                new Point(current.l.x + view.bounds.center.x, current.l.y  + view.bounds.center.y)
            );
            line.strokeColor = 'black';
            stack.push(current.l);
        }
        if (current.r !== null) {
            let line = new Path.Line(
                center, 
                new Point(current.r.x + view.bounds.center.x, current.r.y  + view.bounds.center.y)
            );
            line.strokeColor = 'black';
            stack.push(current.r);
        }
    }


    return root;

}

window.onload = function() {
    paper.setup('drawing');

    // Set the "background color" by drawing a full-screen rectangle
    let background = new Path.Rectangle(new Point(0, 0), view.size);
    background.fillColor = '#f7efeb';

    randomTree();

    // let base = new Path.Circle(view.bounds.center, 100);
    // base.strokeColor = 'black';
    // base.clipMask = true;

    // let group = new Group();
    // group.addChild(base);

    // for (let i = 0; i < 100; i++) {
    //     const center = randomPointInCircle(100, view.bounds.center);
    //     const radius = random(10, 50);

    //     let child = new Path.Circle(center, radius);
    //     child.fillColor = random() < 0.5 ? 'red' : 'blue';//randomHSLColor().convert('rgb');
    //     child.fillColor.alpha = 0.25;
    //     child.strokeColor = 'black';
    
    //     group.addChild(child); 
    // }





    // const svg = document.getElementById('knot');
    // let knot = new Path();
    // knot = knot.importSVG(svg);
    // knot.removeChildren(0, 1);
    // knot.strokeScaling = false;

    // knot.fitBounds(view.bounds);
    // knot.scale(0.75);

    // knot.children.forEach(child => {
    //     // Don't know why we can't see these?
    //     let dup = new Path();
    //     dup.copyContent(child);
    //     dup.fillColor =  randomHSLColor(0, 360, 45, 60); // 180 - 210
    //     dup.fillColor.alpha = 0;
    //     dup.strokeColor = 'black';
    //     dup.strokeWidth = 2;
    //     dup.strokeCap = 'round';

    //     // Draw scribbles over path
    //     // for (let i = 0; i < 1; i++) {
    //     //     let scribble = dup.clone();
    //     //     scribble.strokeColor = 'black';
    //     //     scribble.strokeWidth = 0.5;
    //     //     scribble.strokeCap = 'round';
    //     //     applyNoiseToPath(scribble, 6, random(10, 30), random(1, 10));
    //     // }


    //     // let r = new Path.Rectangle(dup.bounds);
    //     // r.fillColor = dup.fillColor.clone();
    //     // r.fillColor.alpha = 1;

    //     thicken(dup, 10, 50);
    // });

    // applyGrainToPath(background, 10_000, 0.5, 1.0);
}