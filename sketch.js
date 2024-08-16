let font;

function preload() {
  font = loadFont('fonts/SourceCodePro-Regular.otf');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvasContainer');
  cam = createCamera();
  textFont(font);
  textSize(25);
}

function draw() {
  background(255);
  // orbitControl(0, 0, 1);
  orbitControl();

  // rotateY(frameCount * 0.01)

  // Get the current camera position
  let camX = (width / 2.0) / tan(PI * 30.0 / 180.0);
  let camY = 0;
  let camZ = 0;

  // rotate(PI)

  // Draw axes
  drawAxes();

  // Draw cube
  // push();
  // translate(100, 0, 0);  // Move the cube to (100, 0, 0)
  // orientObject(camX, camY, camZ);
  // box(50);
  // pop();

  let minimum = -400;
  let maximum = 400;

  for (let i = minimum; i <= maximum; i = i + 100) {
    if (i != 0) {
      push();
      translate(i, 0, 0);
      stroke('black');
      sphere(2);
      pop();

      push();
      translate(0, i, 0);
      stroke('black');
      sphere(2);
      pop();

      // push();
      // translate(0, 0, i);
      // stroke('black');
      // sphere(2);
      // pop();
    }
  }

  // Números en X positivo
  for (let i = -4; i <= 4; i++) {
    if (i != 0) {
      drawNumber(i, i * 100, 20, 0, camX, camY, camZ);
      // drawNumber(i, 20, i * 100, 0, camX, camY, camZ);
      // drawNumber(i, 0, -20, i * 100, camX, camY, camZ);
    }
  }


  // Números en X negativo
  push();
  translate(-100, 20, 0);  // Move the text to (100, 0, 0)
  orientObject(camX, camY, camZ);
  // print(camX, camY, camZ)
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text('-1', 0, 0);
  pop();

  push();
  translate(-200, 20, 0);
  orientObject(camX, camY, camZ);
  // print(camX, camY, camZ)
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text('-2', 0, 0);
  pop();

  push();
  translate(-300, 20, 0);
  orientObject(camX, camY, camZ);
  // print(camX, camY, camZ)
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text('-3', 0, 0);
  pop();

  push();
  translate(-400, 20, 0);
  orientObject(camX, camY, camZ);
  // print(camX, camY, camZ)
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text('-4', 0, 0);
  pop();
}

function drawAxes() {
  strokeWeight(4);
  // X axis
  stroke(255, 0, 0);  // Red
  line(-500, 0, 0, 500, 0, 0);

  // Y axis
  stroke(0, 255, 0);  // Green
  line(0, -500, 0, 0, 500, 0);

  // Z axis
  stroke(0, 0, 255);  // Blue
  line(0, 0, -500, 0, 0, 500);
}

function drawNumber(number, x, y, z, camX, camY, camZ) {
  push();
  translate(x, y, z);
  orientObject(camX, camY, camZ);
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text(number.toString(), 0, 0);
  pop();
}


function orientObject(camX, camY, camZ) {
  // Calculate the vector from the object to the camera
  let objToCam = createVector(cam.eyeX, camY + cam.eyeY, camZ - cam.eyeZ);
  print(cam.eyeX, cam.eyeY, cam.eyeZ)

  // Calculate the angle to rotate around the y-axis
  let angleY = atan2(objToCam.z, objToCam.x);

  // Calculate the angle to rotate around the x-axis
  let angleX = atan2(sqrt(objToCam.x * objToCam.x + objToCam.z * objToCam.z), objToCam.y);

  // Rotate the object
  rotateY(angleY + PI / 2);
  rotateX(angleX - PI / 2);

  // rotateY(-frameCount * 0.01)

  // Ajuste necesario para que las letras no queden al revés
  // if(cam.eyeX > 0 && cam.eyeY > 0 && cam.eyeZ > 0) {
  //   rotateY(PI); rotateY(PI)
  // }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}