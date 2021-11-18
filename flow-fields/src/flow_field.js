class Generator {
    constructor() {
        if (this.constructor === Generator) {
            throw new TypeError('Can not construct abstract class');
        }
    }

    static generate(field) {
        if(!(field instanceof FlowField)) {
            throw new TypeError('Generators must be constructed with an object of type FlowField');
        }
    }
}

class FieldBasic extends Generator {
    static generate(field) {
        super.generate(field);
        for (let i = 0; i < field.rows; i++) {
            for (let j = 0; j < field.cols; j++) {
                const angle = (i / field.rows) * Math.PI;
                field.grid[i][j] = angle;
            }
        }
    }
}

class FieldNoise extends Generator {
    static generate(field, frequency = 0.15) {
        super.generate(field);
        for (let i = 0; i < field.rows; i++) {
            for (let j = 0; j < field.cols; j++) {
                const n = noise.noise(i * frequency, 
                                      j * frequency, 
                                      0.0);

                const angle = map(n, 0, 1, 0, Math.PI * 2);
                field.grid[i][j] = angle;
            }
        }
    }
}

class FlowField {

    constructor(rect, rows = 50, cols = 50) {
        // Make a copy of the rect passed in
        this.rect = rect.clone();
        this.rows = rows;
        this.cols = cols;
        this.cell = new Size(this.rect.width / (this.cols - 1), 
                             this.rect.height / (this.rows - 1));

        this.init();
    }

    init() {
        // Reinit grid
        this.grid = [];

        for (let i = 0; i < this.rows; i++) {
            let rowValues = [];
            for (let j = 0; j < this.cols; j++) {
                const angle = (i / this.rows) * Math.PI;
                rowValues.push(angle);
            }
            this.grid.push(rowValues);
        }
    }

    draw(arrowLength = 10, arrowStrokeWidth = 2, dotRadius = 2) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const angle = this.grid[i][j];
                // Draw an arrow 
                const from = new Point(this.cell.width * j, this.cell.height * i);
                const to = new Point(from.x + Math.cos(angle) * arrowLength, from.y + Math.sin(angle) * arrowLength);
                let path = new Path(from, to);
                path.strokeWidth = arrowStrokeWidth;
                path.strokeColor = 'black';
    
                const dot = Path.Circle(from, dotRadius);
                dot.fillColor = 'red';
            }
        }
    }

    query(point) {
        const col = Math.round(point.x / this.cell.width);
        const row = Math.round(point.y / this.cell.height);
        if (col < 0 || row < 0 || col > this.cols - 1 || row > this.rows - 1) {
            return undefined;
        }
        const angle = this.grid[row][col];
        return angle;
    }
}

function drawCurves(field) {
    // Keep track of where we are in the flow field and where we started
    let start = new Point(view.bounds.center);
    let current = start.clone();

    // Create a new curve
    let path = new Path();
    path.strokeColor = 'blue';
    path.strokeWidth = 2;

    const numSteps = 100;
    const stepSize = 5;

    for (let i = 0; i < numSteps; i++) {
        // Add the current point to the path
        path.add(current);  

        const angle = field.query(current);
        if (angle === undefined) {
            break;
        }
        const step = new Point(stepSize * Math.cos(angle), 
                               stepSize * Math.sin(angle));
        current = current.add(step);
    }
    path.smooth();

    return path;
}