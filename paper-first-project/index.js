
// function randomPosition()
// {
//     return project.view.size * Point.random();
// }

// function random(_min , _max )
// {
//     return _min + Math.random() * (_max - _min);
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

const noise = new ClassicalNoise(Math);
const noiseSeed = Math.random() * 255;

// Helper function to noisify a Paper.js path (or group of paths)
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

// Only executed our code once the DOM is ready.
window.onload = function() {
    // Get a reference to the canvas object
    var canvas = document.getElementById('drawing');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([ 200, -50 ]));
    // Draw the view now:
    paper.view.draw();
}