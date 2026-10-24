let bg;
let sticks = [];
let bokehOrbs = [];
let mouseTrails = [];

let song;
let fft;

let isStopped = true;
let lastTrigger = 0;

const DESIGN_W = 1242;
const DESIGN_H = 886;

function preload() {
  bg = loadImage("bg_f.png");
  song = loadSound("talkin.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);

  song.setVolume(1);

  fft = new p5.FFT();
  fft.setInput(song);

  generateArtwork();
}

function draw() {
  background(255);

  if (!isStopped) {
    fft.analyze();
  }

  const scaleValue = min(width / DESIGN_W, height / DESIGN_H);
  const drawW = DESIGN_W * scaleValue;
  const drawH = DESIGN_H * scaleValue;
  const offsetX = (width - drawW) / 2;
  const offsetY = (height - drawH) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleValue);

  drawBackground();
  drawMagicDust();
  drawBokehOrbs();
  drawMouseTrails();
  pop();
}

function generateArtwork() {
  sticks = [];
  bokehOrbs = [];
  mouseTrails = [];

  generateMagicDust();
  generateBokehOrbs();
}

function drawBackground() {
  imageMode(CORNER);
  let pX = map(mouseX, 0, width, -5, 5);
  let pY = map(mouseY, 0, height, -5, 5);
  image(bg, pX, pY, DESIGN_W, DESIGN_H);
}

function generateMagicDust() {
  for (let i = 0; i < 600; i++) {
    sticks.push({
      x: random(DESIGN_W),
      y: random(DESIGN_H),
      size: random(2, 8),
      color: random([
        [255, 190, 215],
        [255, 235, 240],
        [40, 255, 120]
      ]),
      phase: random(TWO_PI),
      speed: random(0.02, 0.05)
    });
  }
}

function drawMagicDust() {
  noStroke();

  let treble = !isStopped ? fft.getEnergy("treble") : 0;
  let trebleBoost = map(treble, 0, 255, 1, 1.5);

  for (let s of sticks) {
    let pulse = 1;
    if (!isStopped) {
      pulse = (1 + sin(frameCount * s.speed + s.phase) * 0.25) * trebleBoost;
    }

    fill(s.color[0], s.color[1], s.color[2], 140);
    circle(s.x, s.y, s.size * pulse);
  }
}

function generateBokehOrbs() {
  for (let i = 0; i < 80; i++) {
    bokehOrbs.push({
      x: random(DESIGN_W),
      y: random(DESIGN_H),
      size: random(30, 120),
      color: random([
        [255, 105, 180, 80],
        [147, 112, 219, 80],
        [255, 182, 193, 100],
        [0, 255, 127, 70]
      ]),
      phase: random(TWO_PI),
      pulseSpeed: random(0.02, 0.05),
      minScale: 0.5,
      maxScale: random(1.5, 2.2)
    });
  }
}

function drawBokehOrbs() {
  noStroke();

  const scaleValue = min(width / DESIGN_W, height / DESIGN_H);
  const offsetX = (width - DESIGN_W * scaleValue) / 2;
  const offsetY = (height - DESIGN_H * scaleValue) / 2;
  let mX = (mouseX - offsetX) / scaleValue;
  let mY = (mouseY - offsetY) / scaleValue;

  let bass = !isStopped ? fft.getEnergy("bass") : 0;
  let bassFactor = map(bass, 0, 255, 1.0, 1.4);

  for (let b of bokehOrbs) {
    let currentScale = 1;

    if (!isStopped) {
      let wave = (sin(frameCount * b.pulseSpeed + b.phase) + 1) / 2;
      currentScale = lerp(b.minScale, b.maxScale, wave) * bassFactor;
    }

    let d = dist(b.x, b.y, mX, mY);
    let hoverBoost = 1;
    if (d < 150 && !isStopped) {
      hoverBoost = map(d, 0, 150, 1.8, 1.0);
    }

    fill(b.color[0], b.color[1], b.color[2], b.color[3]);
    circle(b.x, b.y, b.size * currentScale * hoverBoost);
  }
}

function addTrail() {
  if (isStopped) return;

  const scaleValue = min(width / DESIGN_W, height / DESIGN_H);
  const offsetX = (width - DESIGN_W * scaleValue) / 2;
  const offsetY = (height - DESIGN_H * scaleValue) / 2;
  let mX = (mouseX - offsetX) / scaleValue;
  let mY = (mouseY - offsetY) / scaleValue;

  if (mX >= 0 && mX <= DESIGN_W && mY >= 0 && mY <= DESIGN_H) {
    mouseTrails.push({
      x: mX + random(-10, 10),
      y: mY + random(-10, 10),
      size: random(6, 16),
      alpha: 200,
      color: random([
        [255, 255, 150],
        [255, 150, 200],
        [150, 255, 200]
      ])
    });
  }
}

function mouseMoved() {
  addTrail();
}

function touchMoved() {
  addTrail();
  return false;
}

function drawMouseTrails() {
  noStroke();
  for (let i = mouseTrails.length - 1; i >= 0; i--) {
    let t = mouseTrails[i];
    fill(t.color[0], t.color[1], t.color[2], t.alpha);
    circle(t.x, t.y, t.size);

    t.alpha -= 6;
    t.size *= 0.95;

    if (t.alpha <= 0) {
      mouseTrails.splice(i, 1);
    }
  }
}

function triggerSound() {
  if (millis() - lastTrigger < 400) return;
  lastTrigger = millis();

  if (!isStopped) {
    isStopped = true;

    if (song.isPlaying()) {
      song.stop();
    }
  } else {
    generateArtwork();
    isStopped = false;
    userStartAudio();
    getAudioContext().resume();
    song.play();
  }
}

function mousePressed() {
  triggerSound();
  return false;
}

function touchStarted() {
  triggerSound();
  return false;
}

document.addEventListener("touchstart", (event) => {
  triggerSound();
  event.preventDefault();
}, { passive: false });


window.addEventListener("message", (event) => {
  if (event.data === "triggerSound") {
    triggerSound();
  }
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === "r" || key === "R") {
    saveGif("poison-garden", 8);
  }

  if (key === "s" || key === "S") {
    saveCanvas("poison-garden", "png");
  }
}
