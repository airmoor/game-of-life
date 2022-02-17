class LifeGame {
    constructor() {
        this.width = undefined;
        this.height = undefined;
        this.values = undefined;
        this.counters = undefined;
        this.neighbors = undefined;
        this.candidates = undefined;
    }

    reset() {
        this.values.fill(0);
        this.counters.fill(0);
        this.candidates = {};
    }

    init() {
        const square = this.width * this.height;
        this.values = Array(square);
        this.counters = Array(square);
        this.neighbors = Array(square);

        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                let xStart = x === 0 ? 0 : x - 1;
                let xEnd = x === this.width - 1 ? x : x + 1;
                let yStart = y === 0 ? 0 : y - 1;
                let yEnd = y === this.height - 1 ? y : y + 1;
                let currentNeighbors = [];
                for (let j = yStart; j <= yEnd; ++j) {
                    for (let a = xStart; a <= xEnd; ++a) {
                        if (!(a === x && j === y)) {
                            currentNeighbors.push(a + this.width * j);
                        }
                    }
                }
                this.neighbors[x + this.width * y] = currentNeighbors;
            }
        }
        this.reset();
    }

    updateElement(index, value, dn) {
        this.values[index] = value;
        this.candidates[index] = undefined;
        const neighbors = this.neighbors[index];
        for (let i = 0; i < neighbors.length; ++i) {
            let x = neighbors[i];
            this.counters[x] += dn;
            this.candidates[x] = undefined;
        }
    }

    inverse(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 0;
        }
        const pos = x + this.width * y;
        const value = this.values[pos] ? 0 : 1;
        this.updateElement(pos, value, value === 0 ? -1 : 1);
        return value;
    }

    analyzeCandidates(letOn, letOff) {
        const keys = Object.keys(this.candidates);
        for (let i = 0; i < keys.length; ++i) {
            let stepKeys = keys[i];
            let stepValues = this.values[stepKeys];
            let count = this.counters[stepKeys];
            if (stepValues) {
                if (!(count === 2 || count === 3)) {
                    letOff.push(stepKeys);
                }
            } else if (count === 3) {
                letOn.push(stepKeys);
            }
        }
    }

    step() {
        const letOff = [];
        const letOn = [];
        this.analyzeCandidates(letOn, letOff);
        this.candidates = {};
        for (let i = 0; i < letOff.length; ++i) {
            this.updateElement(letOff[i], 0, -1);
        }
        for (let i = 0; i < letOn.length; ++i) {
            this.updateElement(letOn[i], 1, 1);
        }
        return [this.width, letOff, letOn];
    }
}

class Canvas {
    constructor(game) {
        this.cellSize = 2;
        this.backgroundColor = '#222';
        this.color = '#a600ff';
        this.borderColor = '#555555';
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.game = game;
    }

    reset() {
        this.game.reset();
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const width = this.game.width;
        const height = this.game.height;
        this.context.fillStyle = this.backgroundColor;
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        if (this.cellSize > 3) {
            this.context.fillStyle = this.borderColor;
            for (let i = 0; i < width; i++) {
                this.context.fillRect(i * this.cellSize, 1, 1, canvasHeight);
            }
            for (let i = 0; i < height; i++) {
                this.context.fillRect(1, i * this.cellSize, canvasWidth, 1);
            }
        }

        this.fillBorders();
    }

    update() {
        const width = Math.floor(this.width / this.cellSize);
        const height = Math.floor(this.height / this.cellSize);

        this.game.width = width;
        this.game.height = height;
        this.game.init();

        this.canvas.width = width * this.cellSize;
        this.canvas.height = height * this.cellSize;
        this.context = this.canvas.getContext('2d');
        this.reset();
    }

    step() {
        const [width, off, on] = this.game.step();

        this.context.fillStyle = this.backgroundColor;
        this.context.lineWidth = 1;
        this.context.strokeStyle = this.borderColor;
        for (let i = 0; i < off.length; ++i) {
            const tmp = off[i];
            this.context.fillRect((tmp % width) * this.cellSize + 1, Math.floor(tmp / width) * this.cellSize + 1, this.cellSize, this.cellSize);

            if (this.cellSize > 3) {
                this.context.strokeRect((tmp % width) * this.cellSize + 1, Math.floor(tmp / width) * this.cellSize + 1, this.cellSize, this.cellSize);
            }
        }

        this.context.fillStyle = this.color;
        for (let i = 0; i < on.length; ++i) {
            const tmp = on[i];
            this.context.fillRect((tmp % width) * this.cellSize + 1, Math.floor(tmp / width) * this.cellSize + 1, this.cellSize, this.cellSize);

            if (this.cellSize > 3) {
                this.context.strokeRect((tmp % width) * this.cellSize + 1, Math.floor(tmp / width) * this.cellSize + 1, this.cellSize, this.cellSize);
            }
        }

        this.fillBorders();

        return {updated: off.length + on.length};
    }

    fill(func) {
        this.reset();
        this.context.fillStyle = this.color;
        this.context.lineWidth = 1;
        this.context.strokeStyle = this.borderColor;
        func(this.game.width, this.game.height).forEach((value) => {
            if (this.game.inverse(value.x, value.y) === 1) {
                this.context.fillRect(value.x * this.cellSize + 1, value.y * this.cellSize + 1, this.cellSize, this.cellSize);

                if (this.cellSize > 3) {
                    this.context.strokeRect(value.x * this.cellSize + 1, value.y * this.cellSize + 1, this.cellSize, this.cellSize);
                }
            }
        });
    }

    fillBorders() {
        if (this.cellSize > 3) {
            this.context.fillStyle = this.borderColor;

            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;

            this.context.fillRect(0, 0, canvasWidth, 1);
            this.context.fillRect(0, canvasHeight - 1, canvasWidth, 1);
            this.context.fillRect(0, 0, 1, canvasHeight);
            this.context.fillRect(canvasWidth - 1, 0, 1, canvasHeight);
        }
    }

    setCell({x, y}) {
        const width = this.game.width;
        const numX = Math.floor(x / this.cellSize);
        const numY = Math.floor(y / this.cellSize);
        const index = (width * numY) + numX;

        const status = this.game.values[index];
        const value = Number(!status);

        this.context.fillStyle = value ? this.color : this.backgroundColor;
        this.context.fillRect((index % width) * this.cellSize + 1, Math.floor(index / width) * this.cellSize + 1, this.cellSize, this.cellSize);

        this.context.lineWidth = 1;
        this.context.strokeStyle = this.borderColor;

        if (this.cellSize > 3) {
            this.context.strokeRect((index % width) * this.cellSize + 1, Math.floor(index / width) * this.cellSize + 1, this.cellSize, this.cellSize);
        }

        this.game.updateElement(index, value, 1);
    }
}

class Runner {
    constructor(canvas) {
        this.canvas = canvas;
        this.canceler = undefined;

        this.scheduler = (f) => {
            const s = requestAnimationFrame(f);
            return () => cancelAnimationFrame(s);
        };
    }

    step() {
        const res = this.canvas.step();

        if (res.updated > 0) {
            this.canceler = this.scheduler(() => {
                this.step();
            });
        }
    }

    run() {
        this.stop();
        this.step();
    }

    stop() {
        if (this.canceler) {
            this.canceler();
            this.canceler = undefined;
        }
    }
}

const randomFunction = (width, height) => {
    const square = [];
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            if (Math.random() < 0.4) {
                square.push({x, y});
            }
        }
    }
    return square;
};

const runRandomFunction = (runner, canvas) => {
    runner.stop();
    canvas.fill(randomFunction);
}

const init = () => {
    const game = new Canvas(new LifeGame());
    game.height = window.innerHeight;
    game.width = window.innerWidth - 40;
    game.update();
    game.fill(randomFunction);
    const runner = new Runner(game);
    setTimeout(() => {
        runner.run();
    }, 1000);

    document.getElementById('random').onclick = () => {
        runRandomFunction(runner, game);
    };
    document.getElementById('start').onclick = () => {
        runner.run();
    };
    document.getElementById('stop').onclick = () => {
        runner.stop();
    };
    document.getElementById('step').onclick = () => {
        runner.stop();
        game.step();
    };
    document.getElementById('clear').onclick = () => {
        runner.stop();
        game.reset();
    };
    document.querySelectorAll("[data-size-x]").forEach((button) => {
        const sizeX = parseFloat(button.getAttribute("data-size-x"));
        const sizeY = parseFloat(button.getAttribute("data-size-y"));
        button.onclick = () => {
            runner.stop();
            game.height = window.innerHeight * sizeY;
            game.width = window.innerWidth * sizeX - 40;
            game.update();
        };
    })

    document.querySelectorAll("[data-cell-size]").forEach((button) => {
        const cellSize = parseInt(button.getAttribute("data-cell-size"), 10);
        button.onclick = () => {
            runner.stop();
            game.cellSize = cellSize;
            game.update();
        };
    });

    const canvas = document.getElementById('canvas');
    canvas.onclick = (e) => {
        const mousePos = {
            x: e.clientX - canvas.offsetLeft,
            y: e.clientY - canvas.offsetTop
        };

        game.setCell(mousePos);
    };
};

window.onload = init;