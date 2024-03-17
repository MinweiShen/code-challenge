const ROW = 200;
const COLUMN = 400;
const GRID_SIZE = 3;
const DROP_SIZE = 2;
let hue = 0;
let dirty = false;

function HSBtoRGB(hue, saturation, brightness) {
  const s = saturation / 100;
  const bValue = brightness / 100; // Renamed to avoid conflict with variable name
  const chroma = bValue * s;
  const hue1 = hue / 60;
  const x = chroma * (1 - Math.abs((hue1 % 2) - 1));
  let r, g, b;

  if (hue1 >= 0 && hue1 <= 1) {
    [r, g, b] = [chroma, x, 0];
  } else if (hue1 >= 1 && hue1 <= 2) {
    [r, g, b] = [x, chroma, 0];
  } else if (hue1 >= 2 && hue1 <= 3) {
    [r, g, b] = [0, chroma, x];
  } else if (hue1 >= 3 && hue1 <= 4) {
    [r, g, b] = [0, x, chroma];
  } else if (hue1 >= 4 && hue1 <= 5) {
    [r, g, b] = [x, 0, chroma];
  } else if (hue1 >= 5 && hue1 <= 6) {
    [r, g, b] = [chroma, 0, x];
  }

  const m = bValue - chroma;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 0.3;
  ctx.strokeRect(0, 0, width, height);
  document.body.appendChild(canvas);
  return canvas;
}

class SafeBox {
  constructor(row, column) {
    this.row = row;
    this.column = column;
    this.box = [];
    for (let i = 0; i < row; i++) {
      const r = new Array(column).fill(-1);
      this.box.push(r);
    }
  }
  set(row, column, state) {
    if (
      row >= 0 &&
      row < this.row &&
      column >= 0 &&
      column < this.column &&
      this.box[row][column] === -1
    ) {
      this.box[row][column] = state;
      return true;
    }

    return false;
  }

  get(row, column) {
    if (row >= 0 && row < this.row && column >= 0 && column < this.column) {
      return this.box[row][column];
    }
    return -1;
  }
}

class Grid {
  constructor(row, column) {
    this.row = row;
    this.column = column;
    this.grid = new SafeBox(row, column);
    this.c = createCanvas(COLUMN * GRID_SIZE, ROW * GRID_SIZE);
  }

  set(row, column, state) {
    const result = this.grid.set(row, column, state);
    if (result) {
      dirty = true;
    }
  }

  draw() {
    const ctx = this.c.getContext("2d");
    // clear
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, this.c.width, this.c.height);
    ctx.lineWidth = 0.3;
    ctx.strokeRect(0, 0, this.c.width, this.c.height);

    for (let i = 0; i < this.row; i++) {
      for (let j = 0; j < this.column; j++) {
        const hue = this.grid.get(i, j);
        if (hue > 0) {
          const rgbColor = HSBtoRGB(hue, 100, 100);
          ctx.fillStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
          ctx.fillRect(j * GRID_SIZE, i * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
      }
    }
    dirty = false;
  }

  update() {
    const newGrid = new SafeBox(this.row, this.column);

    for (let i = this.row - 1; i >= 0; i--) {
      for (let j = this.column - 1; j >= 0; j--) {
        const hue = this.grid.get(i, j);
        if (hue > 0) {
          if (newGrid.set(i + 1, j, hue)) {
            dirty = true;
            continue;
          }
          const direction = Math.random() < 0.5 ? 1 : -1;
          if (newGrid.set(i + 1, j + direction, hue)) {
            dirty = true;
            continue;
          }
          if (newGrid.set(i + 1, j - direction, hue)) {
            dirty = true;
            continue;
          }
          newGrid.set(i, j, hue);
        }
      }
    }

    this.grid = newGrid;
  }

  bindEvents() {
    const rect = this.c.getBoundingClientRect();
    let isDragging = false;
    function logPosition(event) {
      let mouseX, mouseY;
      if (rect.left < event.clientX && event.clientX < rect.right) {
        mouseX = event.clientX - rect.left;
      }
      if (rect.top < event.clientY && event.clientY < rect.bottom) {
        mouseY = event.clientY - rect.top;
      }

      if (mouseX && mouseY) {
        const column = Math.floor(mouseX / GRID_SIZE);
        const row = Math.floor(mouseY / GRID_SIZE);
        for (let i = row - DROP_SIZE; i < row + DROP_SIZE; i++) {
          for (let j = column - DROP_SIZE; j < column + DROP_SIZE; j++) {
            if (Math.random() < 0.5) {
              this.set(i, j, hue);
            }
          }
        }
        hue = (hue + 1) % 360;
      }
    }
    document.addEventListener("mousedown", () => {
      isDragging = true;
    });
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        logPosition.bind(this)(e);
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }
}

function work(grid) {
  grid.update();
  if (dirty) {
    grid.draw();
  }
  requestIdleCallback(() => {
    work(grid);
  });
}

function main() {
  const grid = new Grid(ROW, COLUMN);
  grid.bindEvents();
  requestIdleCallback(() => {
    work(grid);
  });
}

main();
