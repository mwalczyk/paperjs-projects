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
            var p = _origin.add(_direction.multiply(stepSize * i));
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
            var p = _origin.add(_direction.multiply(stepSize * i));
            p = p.add(normal.multiply( maxOffset * Math.random() * (i / _segmentCount)));
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
                visiblePath.add(point.add(norm.multiply(this.thickness * 0.5 * taperScale)));
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
                visiblePath.add(point.subtract(norm.multiply(this.thickness * 0.5 * taperScale)));
            }
        }
        
        //remove the helper path
        tmppath.remove();
        
        visiblePath.smooth();
        
        return visiblePath;
    }
}

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
            point: _position.subtract( (new Point(w, h)).multiply(0.5)),
            size: [w, h]
        });
        
        var ellipse = new Path.Ellipse(rectangle);
        ellipse.strokeColor = "black";
        ellipse.fillColor = new Color(Math.random(), Math.random(), Math.random());
        
        return ellipse;
    }
}

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
                line.add(p.add(n.multiply(_leafLength * (0.75 + Math.random() * 0.25))));
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
                var circle = new Path.Circle(p.add( n.multiply( circleRad)), circleRad);
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

function onMouseDown(e) {
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
    var stemPoints = growPreset.generate(e.point, dir, 15.0 + Math.random() * 150.0, 5 + Math.random() + 5);

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

//a global arrays storing the different presets for the different flower parts
var g_growPresets = [StraightGrowPreset, WobblyGrowPreset];
var g_lineRenderPresets = [SimpleLineRenderPreset, TaperedLineRenderPreset];
var g_blossomCenterRenderPresets = [BlossomCenterEllipsePreset, BlossomCenterCirclePreset, BlossomCenterStarPreset];
var g_blossomLeafRenderPresets = [BlossomLeavesAsLines, BlossomLeavesAsCircles];
