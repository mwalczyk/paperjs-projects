
// function randomPosition()
// {
//     return project.view.size * Point.random();
// }

// function random(_min , _max )
// {
//     return _min + Math.random() * (_max - _min);
// }

// var w = project.view.size.width;
// var h = project.view.size.height;
// var samplesX = 10;
// var incrX = w / samplesX;
// var s = (new Color(184, 140, 125)) / 255;
// var e = (new Color(130, 102, 92)) / 255;
// var o = 100;
// var samples = 200;

// for(var i = 0; i < samplesX; i++) {

//     var path = new Path({
//         // shadowColor: new Color(0.4, 0.4, 0.4),
//         // shadowBlur: 12,
//         // shadowOffset: new Point(3, 3),
//     });

//     var last = new Point(w * 0.5, h * 0.5);//random(o, w - o), random(o, h - o));
//     path.add(last);

//     for (var j = 0; j < samples; j++) {
//         last += new Point(random(-30, 30), random(-30, 30));
//         path.add(last);
//     }

//     path.smooth();
    
//     // for (var j = 0; j < 1; j++) {
//     //     if (random() < 0.9) {
//     //         path = path.splitAt(
//     //             path.getLocationAt(
//     //                 random(path.length * 0.25, path.length * 0.75)
//     //             )
//     //         );
//     //     }
//     // }
//     var strA = 'hsl('.concat(random(200, 215).toString(), ', 60%, 60%)');
//     var hslA = (new Color(strA)).convert('rgb');

//     var strB = 'hsl('.concat(random(200, 215).toString(), ', 60%, 50%)');
//     var hslB = (new Color(strB)).convert('rgb');

//     path.strokeColor = {
//         gradient: {
//             stops: [[hslA, 0.5], [hslB, 1]],
//         },
//         origin: path.strokeBounds.topCenter,
//         destination: path.strokeBounds.bottomCenter
//     };
    
//     path.strokeWidth = random(4, 20);
//     path.strokeCap = 'round';

//     var offset = 0;
//     var sampleDist = 3;
//     var last = new Point();
//     while(offset < path.length)
//     {
//         var currentOffset = Math.min(path.length, offset);
//         var location = path.getLocationAt(currentOffset);
        

//         var str = 'hsl('.concat(random(20, 150).toString(), ', 60%, 60%)');
//         var hsl = (new Color(str )).convert('rgb');

//         var hair = new Path();
//         hair.strokeColor = hsl;
//         hair.strokeCap = 'round';
//         hair.strokeWidth = random(2, 5);
//         var a = location.point + location.normal * random(1, 10);
//         var b = a + location.normal * random(1, 4);
//         hair.add(a);
//         hair.add(b);
//         offset += sampleDist;
//     }
// }




class ClassicalNoise
{
    /**
     * You can pass in a random number generator object if you like.
     * It is assumed to have a random() method.
     */
    constructor(r)
    {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0], 
                                         [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1], 
                                         [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]; 
        this.p = [];
        for (var i=0; i<256; i++) {
            this.p[i] = Math.floor(r.random()*256);
        }
        // To remove the need for index wrapping, double the permutation table length 
        this.perm = []; 
        for(var i=0; i<512; i++) {
            this.perm[i]=this.p[i & 255];
        }
    }

    dot(g, x, y, z)
    { 
        return g[0]*x + g[1]*y + g[2]*z; 
    }

    mix(a, b, t) 
    { 
        return (1.0-t)*a + t*b; 
    }

    fade(t) { 
        return t*t*t*(t*(t*6.0-15.0)+10.0); 
    }

    // Classic Perlin noise, 3D version 
    noise(x, y, z) 
    { 
        // Find unit grid cell containing point 
        var X = Math.floor(x); 
        var Y = Math.floor(y); 
        var Z = Math.floor(z); 
          
        // Get relative xyz coordinates of point within that cell 
        x = x - X; 
        y = y - Y; 
        z = z - Z; 
          
        // Wrap the integer cells at 255 (smaller integer period can be introduced here) 
        X = X & 255; 
        Y = Y & 255; 
        Z = Z & 255;
            
        // Calculate a set of eight hashed gradient indices 
        var gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12; 
        var gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12; 
        var gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12; 
        var gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12; 
        var gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12; 
        var gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12; 
        var gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12; 
        var gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12; 

        // Calculate noise contributions from each of the eight corners 
        var n000= this.dot(this.grad3[gi000], x, y, z); 
        var n100= this.dot(this.grad3[gi100], x-1, y, z); 
        var n010= this.dot(this.grad3[gi010], x, y-1, z); 
        var n110= this.dot(this.grad3[gi110], x-1, y-1, z); 
        var n001= this.dot(this.grad3[gi001], x, y, z-1); 
        var n101= this.dot(this.grad3[gi101], x-1, y, z-1); 
        var n011= this.dot(this.grad3[gi011], x, y-1, z-1); 
        var n111= this.dot(this.grad3[gi111], x-1, y-1, z-1);

        // Compute the fade curve value for each of x, y, z 
        var u = this.fade(x); 
        var v = this.fade(y); 
        var w = this.fade(z); 
        // Interpolate along x the contributions from each of the corners 
        var nx00 = this.mix(n000, n100, u); 
        var nx01 = this.mix(n001, n101, u); 
        var nx10 = this.mix(n010, n110, u); 
        var nx11 = this.mix(n011, n111, u); 
        // Interpolate the four results along y 
        var nxy0 = this.mix(nx00, nx10, v); 
        var nxy1 = this.mix(nx01, nx11, v); 
        // Interpolate the two last results along z 
        var nxyz = this.mix(nxy0, nxy1, w);

        return nxyz; 
    }
}

//initialize a global perlin noise instance and noise seed
var noise = new ClassicalNoise(Math);
var noiseSeed = Math.random() * 255;

//helper function to noisify a paperjs path or a paperjs group of paths
function applyNoiseToPath(_path, _sampleDist, _noiseDiv, _noiseScale)
{
    if(_path instanceof Group)
    {
        for(var i = 0; i < _path.children.length; i++)
        {
            applyNoiseToPath(_path.children[i], _sampleDist, _noiseDiv, _noiseScale);
        }
    }
    else
    {
        if(_sampleDist < _path.length)
            _path.flatten(_sampleDist);
        for(var i = 0; i < _path.segments.length; i++)
        {
            var noiseX = noise.noise(_path.segments[i].point.x / _noiseDiv,
                _path.segments[i].point.y / _noiseDiv,
                noiseSeed);
            var noiseY = noise.noise(_path.segments[i].point.y / _noiseDiv,
                noiseSeed,
                _path.segments[i].point.x / _noiseDiv);

            _path.segments[i].point = _path.segments[i].point + new Point(noiseX, noiseY) * _noiseScale;
        }
        _path.smooth();
    }
}

//Presets for generating a list of points
//========================================================================

//generates a list of points in a straight line
class StraightGrowPreset
{
    //_origin: The coordinate of the first point
    //_direction: The direction to grow
    //_length: The length to grow
    //_segmentCount: The number of subdivisions
    generate(_origin, _direction, _length, _segmentCount)
    {
        var ret = [];
        
        var stepSize = _length / _segmentCount;
        
        for(var i = 0; i < _segmentCount; i++)
        {
            var p = _origin + _direction * stepSize * i;
            ret.push(p);
        }
        
        return ret;
    }
}

//generates a list of points that are randomly offset from their main direction
class WobblyGrowPreset
{
    constructor()
    {
        //randomize the offset factor for every instance
        this.offsetFact = 0.01 + Math.random() * 0.2;
    }
    
    //_origin: The coordinate of the first point
    //_direction: The direction to grow
    //_length: The length to grow
    //_segmentCount: The number of subdivisions
    generate(_origin, _direction, _length, _segmentCount)
    {
        var ret = [];
        
        var stepSize = _length / _segmentCount;
        
        var normal = _direction.rotate(90);
        normal = normal.normalize();
        
        var maxOffset = _length * this.offsetFact;
        
        for(var i = 0; i < _segmentCount; i++)
        {
            var p = _origin + _direction * stepSize * i;
            p += normal * maxOffset * Math.random() * (i / _segmentCount);
            ret.push(p);
        }
        
        return ret;
    }
}

//Presets for rendering a list of points
//========================================================================

//renders the points as simple lines
class SimpleLineRenderPreset
{
    constructor()
    {
        this.bSmoothPath = Math.random() >= 0.5 ? true : false;
    }

    //_points: An array of points to draw
    draw(_points)
    {
        var path = new Path();
        path.strokeColor = "black";
        
        for(var i = 0; i < _points.length; i++)
        {
            path.add(_points[i]);
        }
        
        if(this.bSmoothPath)
            path.smooth();
        
        return path;
    }
}

//renders the points as a shape, tapers the shape towards the end by a 50% chance
class TaperedLineRenderPreset
{
    constructor()
    {
        this.thickness = 1.0 + Math.random() * 10.0;
        this.bTaper = Math.random() >= 0.5 ? true : false;
        this.sampleCount = 20;
    }
    
    //_points: An array of points to draw
    draw(_points)
    {
        //helper path that we sample to generate the actual shape, not drawn
        var tmppath = new Path();
        for(var i = 0; i < _points.length; i++)
        {
            tmppath.add(_points[i]);
        }
        tmppath.smooth();
        
        //the actual shape that we render
        var visiblePath = new Path();
        visiblePath.strokeColor = "black";
        visiblePath.fillColor = "white";
        
        var sampleDist = tmppath.length / this.sampleCount;
        
        var taperScale = 1.0;
        
        //generate the first half of the shape
        for(var i = 0; i < this.sampleCount; i++)
        {
            var sp = Math.min(Math.max(0.01, sampleDist * i), tmppath.length * 0.99);
            var point = tmppath.getPointAt(sp); //get the point at the current sample position
            var norm = tmppath.getNormalAt(sp); //get the normal at the current sample position (perpendicular to the tmppath direction)
            
            //make sure the samples are both valid (due to floating point in accuracies this is not guaranteed, or maybe a buf in paper :D)
            if(norm && point)
            {
                norm = norm.normalize();
                
                if(this.bTaper)
                    taperScale = Math.cos((Math.PI * 0.5 / this.sampleCount) * i);
            
                //add the point to the path
                visiblePath.add(point + norm * this.thickness * 0.5 * taperScale);
            }
        }
        
        //generate the second half of the shape
        for(var i = this.sampleCount-1; i >= 0; i--)
        {
            var sp = Math.min(Math.max(0.01, sampleDist * i), tmppath.length * 0.99);
            var point = tmppath.getPointAt(sp); //get the point at the current sample position
            var norm = tmppath.getNormalAt(sp); //get the normal at the current sample position (perpendicular to the tmppath direction)
            
            //make sure the samples are both valid (due to floating point in accuracies this is not guaranteed, or maybe a buf in paper :D)
            if(norm && point)
            {
                norm = norm.normalize();
                
                if(this.bTaper)
                    taperScale = Math.cos((Math.PI * 0.5 / this.sampleCount) * i);
                
                //add the point to the path
                visiblePath.add(point - norm * this.thickness * 0.5 * taperScale);
            }
        }
        
        //remove the helper path
        tmppath.remove();
        
        visiblePath.smooth();
        
        return visiblePath;
    }
}


//Presets for rendering the blossom center
//========================================================================

//just creates a simple circle path
class BlossomCenterCirclePreset
{
    draw (_position, _size)
    {
        var circle = new Path.Circle(_position, _size * 0.5);
        circle.strokeColor = "black";
        circle.fillColor = new Color(Math.random(), Math.random(), Math.random());
        
        return circle;
    }
}

//just creates a simple star path
class BlossomCenterStarPreset
{
    draw(_position, _size)
    {
        var c = Math.round(3 + Math.random() * 3);
        
        var innerRadFact = 0.25 + Math.random() * 0.75;
        var outerRadFact = 1.0 - innerRadFact;
        
        var str = new Path.Star(_position, c, _size * innerRadFact, _size * outerRadFact);
        str.strokeColor = "black";
        str.fillColor = new Color(Math.random(), Math.random(), Math.random());
        
        return str;
    }
}

//just creates a simple ellipse path
class BlossomCenterEllipsePreset
{
    draw(_position, _size)
    {
        //var bHorizontal = Math.random() >= 0.5 ? true : false;
        
        var w = _size * (0.75 + Math.random() * 0.75);
        var h = _size * (0.75 + Math.random() * 0.75);
        
        var rectangle = new Rectangle({
            point: _position - new Point(w, h) * 0.5,
            size: [w, h]
        });
        
        var ellipse = new Path.Ellipse(rectangle);
        ellipse.strokeColor = "black";
        ellipse.fillColor = new Color(Math.random(), Math.random(), Math.random());
        
        return ellipse;
    }
}


//Presets for rendering the blossom leaves
//========================================================================

//draws the normals of the blossom center shape as lines
class BlossomLeavesAsLines
{
    draw(_bloomCenterPath, _leafLength)
    {
        var leafCount = 5 + Math.random() * 10;
        
        var stepSize = _bloomCenterPath.length / leafCount;
        
        var retGroup = new Group();
        for(var i = 0; i < leafCount; i++)
        {
            var samplePos = Math.min(_bloomCenterPath.length, stepSize * i);
            var p = _bloomCenterPath.getPointAt(samplePos);
            var n = _bloomCenterPath.getNormalAt(samplePos);
            
            if(p && n)
            {
                n = n.normalize();
                var line = new Path();
                line.add(p);
                line.add(p + n * _leafLength * (0.75 + Math.random() * 0.25));
                line.strokeColor = "black";
                
                retGroup.addChild(line);
            }
        }
        
        return retGroup;
    }
}

//draws circles around the blossom center shape
class BlossomLeavesAsCircles
{
    draw(_bloomCenterPath, _leafLength)
    {
        var leafCount = 5 + Math.random() * 10;
        
        var stepSize = _bloomCenterPath.length / leafCount;
        
        var circleRad = 1 + Math.random() * 5;
        
        var retGroup = new Group();
        for(var i = 0; i < leafCount; i++)
        {
            var samplePos = Math.min(_bloomCenterPath.length, stepSize * i);
            var p = _bloomCenterPath.getPointAt(samplePos);
            var n = _bloomCenterPath.getNormalAt(samplePos);
            
            if(p && n)
            {
                n = n.normalize();
                var rad = circleRad * (0.75 + Math.random() * 0.25);
                var circle = new Path.Circle(p + n * circleRad, circleRad);
                circle.strokeColor = "black";
                circle.fillColor = "white";
                
                retGroup.addChild(circle);
            }
        }
        
        return retGroup;
    }
}

//select a random preset from an array of presets
function randomPreset(_presets)
{
    var presetIndex = Math.round(Math.random() * (_presets.length - 1));
    return _presets[presetIndex];
}

//a global arrays storing the different presets for the different flower parts
var g_growPresets = [StraightGrowPreset, WobblyGrowPreset];
var g_lineRenderPresets = [SimpleLineRenderPreset, TaperedLineRenderPreset];
var g_blossomCenterRenderPresets = [BlossomCenterEllipsePreset, BlossomCenterCirclePreset, BlossomCenterStarPreset];
var g_blossomLeafRenderPresets = [BlossomLeavesAsLines, BlossomLeavesAsCircles];


//the paperJS mouse handler, called when a mouse button is pressed
function onMouseDown(_event)
{
    //chose the random presets and initialize them
    var growPreset = new (randomPreset(g_growPresets))();
    var stemRenderPreset = new (randomPreset(g_lineRenderPresets))();
    var blossomPreset = new (randomPreset(g_blossomCenterRenderPresets))();
    var blossomLeafPreset = new (randomPreset(g_blossomLeafRenderPresets))();
    
    //generate random direction
    var dir = new Point(0, -1);
    dir = dir.rotate(-60.0 + Math.random() * 120.0);
    dir = dir.normalize();
    
    //generate the stem path points
    var stemPoints = growPreset.generate(_event.point, dir, 15.0 + Math.random() * 150.0, 5 + Math.random() + 5);
    
    //generate the different parts of the weird flower / magic wand, whatever
    var stemPath = stemRenderPreset.draw(stemPoints);
    var blossomPosition = stemPoints[stemPoints.length-1];
    var blossomPath = blossomPreset.draw(blossomPosition, 5.0 + Math.random() * 10.0);
    var blossomLeafPaths = blossomLeafPreset.draw(blossomPath, 1.0 + Math.random() * 5.0);
    
    //add all the drawing parts to a group
    var drawingGroup = new Group();
    drawingGroup.addChild(stemPath);
    drawingGroup.addChild(blossomPath);
    drawingGroup.addChild(blossomLeafPaths);
    
    //apply noise to that group to give it a more hand drawn feeling
    applyNoiseToPath(drawingGroup, 6, 40.0, 6.0);
    
    //clone that group to make a second outline
    var shakyOutlinesGroup = drawingGroup.clone();
    shakyOutlinesGroup.strokeWidth = 0.35;
    shakyOutlinesGroup.fillColor = undefined; //remove fill
    
    //apply some more noise to the cloned group
    applyNoiseToPath(shakyOutlinesGroup, 6, 10.0, 4.0);
}