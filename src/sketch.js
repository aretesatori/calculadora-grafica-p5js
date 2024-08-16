
/*** MATHQUILL ***/
let MQ;
let inputCounter = 1;
const inputs = [];
const functions = [];
const points = {};

const colors = ['#36C2CE', '#88D66C', '#FF6500', '#AF47D2', '#50B498', '#FFC107', '#03A9F4', '#008000', '#673AB7'];
/*** MATHQUILL ***/


/*** 3D ***/
const maximum = 500;
const strokeXYZ = 5;

// Definir radio y altura del cono con base a la proporción global de 'maximum'
const coneHeight = maximum / 12;
const coneRadius = maximum / 30;

let currentAxis = 'Y';
let angleY = 0;
/*** 3D ***/


/*** VARIABLES DE CONTROL GENERAL ***/
let font;
let mode = "3D"; // "2D" o "3D"
/*** VARIABLES DE CONTROL GENERAL ***/


/*** BOTONES ***/
let button;
let homeButton;
let settingsButton;
let verticalAxis;
// let showPoints;
let showGridXY;
let showGridXZ;
let showBox;

let buttonsVisible = false;
/*** BOTONES ***/


/*** CONTROL DE CÁMARA ***/
let cam;

let initialCameraPosition;
let initialCameraCenter;
let currentCameraPosition;
let currentCameraCenter;
let transitioning = false;
let transitionProgress = 0;

let initialZoomCamera = 2.4;

let scaleZoomCamera = 0.5 * (2 * Math.pow(2 / 3, (1 + Math.log(initialZoomCamera / 1.6) / Math.log(3 / 2)) - 1));
/*** CONTROL DE CÁMARA ***/


/*** 2D ***/
let scalarFactor = 60 * (initialZoomCamera * 2 / 3);
let n = 12; // Unit measure for grid
var zoomStroke = 60;
let centerX = 0;
let centerY = 0;

let offsetX = 0;
let offsetY = 0;

let dragging = false;
let startMouseX, startMouseY;
let startOffsetX, startOffsetY;
/*** 2D ***/


const constants = {
  e: Math.E,
  pi: Math.PI
};

function preload() {
  font = loadFont('fonts/SourceCodePro-Regular.otf');
}

function createMathQuillInput(id) {
  const mathFieldSpan = document.getElementById(id);
  const mathField = MQ.MathField(mathFieldSpan, {
    spaceBehavesLikeTab: true,
    handlers: {
      edit: function () {
        const enteredMath = mathField.latex();
        const plainTextMath = convertLaTeXToPlainText(enteredMath);

        if (plainTextMath !== '') {
          if (!inputs.includes(id) && inputCounter < 10) {
            inputs.push(id);
            inputCounter++;
            const newId = 'math-field-' + inputCounter;
            const newDiv = document.createElement('div');
            newDiv.id = newId;
            newDiv.className = 'math-field';
            document.querySelector('.equations').appendChild(newDiv);
            createMathQuillInput(newId);
          }
        }

        plotFunctions();
      }
    }
  });
}

function convertLaTeXToPlainText(latex) {
  return latex
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]*)\}/g, 'Math.sqrt($1)')
    .replace(/\\sin/g, 'Math.sin')
    .replace(/\\cos/g, 'Math.cos')
    .replace(/\\tan/g, 'Math.tan')
    .replace(/\\ln/g, 'Math.log')
    .replace(/\\log/g, 'Math.log10')
    .replace(/\\cdot/g, '*')
    .replace(/\\abs/g, 'Math.abs')
    .replace(/\^/g, '**')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\{/g, '{')
    .replace(/\\right\}/g, '}');
}

function plotFunctions() {
  functions.length = 0;
  Object.keys(points).forEach(key => delete points[key]);
  inputs.forEach((id, index) => {
    const mathFieldSpan = document.getElementById(id);
    const mathField = MQ.MathField(mathFieldSpan);
    const funcString = convertLaTeXToPlainText(mathField.latex());

    if (funcString !== '') {
      try {
        let func;
        if (funcString.includes('y=')) {
          const expr = funcString.split('y=')[1];
          func = new Function('x', `with (constants) { return ${expr}; }`);
        } else if (funcString.includes('f(x)=')) {
          const expr = funcString.split('f(x)=')[1];
          func = new Function('x', `with (constants) { return ${expr}; }`);
        } else if (funcString.includes('x=')) {
          const xVal = parseFloat(funcString.split('x=')[1]);
          func = () => xVal;
          func.isVertical = true;
        } else if (funcString.match(/[A-Z]\(([^)]*)\)/)) {
          const isPoint = funcString.match(/([A-Z])\(([^)]*)\)/);
          const pointName = isPoint[1];
          const coords = isPoint[2].split(',').map(Number);
          if (coords.length === 2) {
            points[pointName] = { x: coords[0], y: coords[1], z: 0 };
          } else if (coords.length === 3) {
            points[pointName] = { x: coords[0], y: coords[1], z: coords[2] };
          }

        } else {
          // func = new Function('x', `with (constants) { return ${funcString}; }`);
        }
        functions[index] = func;
      } catch (e) {
        console.error(`Invalid function in ${id}`);
      }
    }
  });
}

function setup() {
  /*** CANVAS ***/
  // const canvasContainer = document.getElementById('container');
  const canvas = createCanvas(windowWidth - (windowWidth * 0.2), windowHeight - 20, WEBGL);
  canvas.parent('container');
  /*** CANVAS ***/

  /*** PROPIEDADES GENERALES ***/
  textFont(font);
  textSize(25);

  strokeJoin(ROUND); // Bordes con curvas para una mayor suavidad
  /*** PROPIEDADES GENERALES ***/

  /*** BOTONES ***/
  button = createButton('Vista 3D');
  button.position(windowWidth - 100, 30);
  button.mousePressed(toggleMode);

  // Configurar el botón "Home"
  homeButton = createButton("Home");
  homeButton.position(windowWidth - 100, 60);

  homeButton.mousePressed(startPosition3D);
  // homeButton.hide();

  // Configurar el botón "Settings"
  settingsButton = createButton("Settings");
  settingsButton.position(windowWidth - 100, 90);
  settingsButton.mousePressed(toggleButtons);

  // Configurar el input de tipo radio para seleccionar el centro de los ejes
  verticalAxis = createRadio();
  verticalAxis.option('Centro Y');
  verticalAxis.option('Centro Z');
  verticalAxis.selected('Centro Y');
  verticalAxis.position(windowWidth - 96, 140);
  verticalAxis.changed(changeAxis);
  verticalAxis.hide();

  // Configurar el checkbox
  // showPoints = createCheckbox('Mostrar Puntos', false);
  // showPoints.position(windowWidth - 120, 260);
  // showPoints.changed(toggleFunction);
  // showPoints.hide();

  if (currentAxis === 'Y') {
    showGridXY = createCheckbox('Cuadrícula XY', true);
    showGridXZ = createCheckbox('Cuadrícula XZ', false);
  } else {
    showGridXY = createCheckbox('Cuadrícula XY', false);
    showGridXZ = createCheckbox('Cuadrícula XZ', true);
  }

  showGridXY.position(windowWidth - 120, 220);
  showGridXY.hide();

  showGridXZ.position(windowWidth - 120, 240);
  showGridXZ.hide();

  showBox = createCheckbox('Mostrar Cubo 3D', true);
  showBox.position(windowWidth - 140, 280);
  showBox.hide();
  /*** BOTONES ***/

  /*** CONTROL 2D ***/
  canvas.mousePressed(startDragging);
  canvas.mouseReleased(stopDragging);
  /*** CONTROL 2D ***/

  /*** MATHQUILL ***/
  MQ = MathQuill.getInterface(2);
  createMathQuillInput('math-field-1');
  /*** MATHQUILL ***/


  /*** CÁMARA ***/
  // Crear cámara
  cam = createCamera();
  // cam.setPosition(500, -300, 600)
  // Definir posición inicial
  cam.setPosition(0, 0, initialZoomCamera * maximum);
  cam.lookAt(0, 0, 0);


  // Guardar posiciones iniciales
  initialCameraPosition = createVector(0, 0, initialZoomCamera * maximum);
  initialCameraCenter = createVector(0, 0, 0);

  initialPosition2D = createVector(0, 0, 1200);

  /*** CÁMARA ***/
}

function draw() {
  background(255);

  // Variables para control de cámara en 3D
  let camX = (width / 2) / tan(PI * 30 / 180);
  let camY = 0;
  let camZ = 0;

  // Actualizar los valores de la cámara en cada loop
  setCamera(cam);

  if (mode === "3D") {
    if (!transitioning) {
      orbitControl(1, 1, 1);
    }
    // Dibujar el cubo 3D alrededor de los ejes
    if (showBox.checked()) {
      drawBox();
    }
    // Posición de inicio en 3D con eje Y hacia arriba y eje X hacia la derecha
    homeButton.mousePressed(startPosition3D)

    // Manejar movimientos de cámara y transición, y aplicar rotaciones a los ejes
    handleTransition();
    applyAxisRotation();

    /*** Generar números en 3D ***/
    drawNumbers3D(camX, camY, camZ);

    // Verificar si el botón está activo para dibujar las cuadrículas
    if (showGridXY.checked()) {
      drawGridXY((maximum / 100), 3 / 2, 150);
    }
    if (showGridXZ.checked()) {
      drawGridXZ((maximum / 100), 3 / 2, 150);
    }
    // Si el eje Z está vertical, de forma inicial dibujar las cuadrículas entre eje X y Z
    // Si el eje Y está vertical, de forma inicial dibujar las cuadrículas entre eje X e Y
    if (currentAxis === 'Z' && showGridXZ.checked()) {
      drawGridXZ((maximum / 100), 3 / 2, 150);
    } else if (currentAxis === 'Y' && showGridXY.checked()) {
      drawGridXY((maximum / 100), 3 / 2, 150);
    }

    // Dibujar ejes, conos y puntos en 3D
    push();
    drawAxes();
    drawPositiveAxesCones();
    drawNegativeAxesCones();
    drawAxesPoints();
    pop();

    /*** GRAFICAR FUNCIÓN EN 3D ***/
    push();

    functions.forEach((func, index) => {
      plotGraph3D(func, colors[index % colors.length]);
    });
    drawPoints3D();
    pop();
    /*** GRAFICAR FUNCIÓN EN 3D ***/
  }

  if (mode === "2D") {
    currentCameraPosition = createVector(cam.eyeX, cam.eyeY, cam.eyeZ);
    if (currentCameraPosition != initialPosition2D) {
      // orbitControl(1, 1, 1);
      // center2D();
      homeButton.mousePressed(center2D);
      // drawNumbers2D(camX, camY, camZ);
    }

    scalarFactor = constrain(scalarFactor, 10, 500);
    n = scalarFactor / 5;
    zoomStroke = scalarFactor;

    // Verificar si se presionan las teclas, para así desplazar el plano 2D a preferencia el usuario
    if (keyIsPressed) {
      if (keyIsDown(RIGHT_ARROW)) {
        centerX = centerX - 3; // Desplazarse hacia la derecha
      }

      if (keyIsDown(LEFT_ARROW)) {
        centerX = centerX + 3; // Desplazarse hacia la izquierda
      }

      if (keyIsDown(UP_ARROW)) {
        centerY = centerY + 3; // Desplazarse hacia arriba
      }

      if (keyIsDown(DOWN_ARROW)) {
        centerY = centerY - 3; // Desplazarse hacia abajo
      }

      // (-)
      if (keyIsDown(109)) {
        scalarFactor--; // Zoom menos
      }

      // (+)
      if (keyIsDown(107)) {
        scalarFactor++; // Zoom más
      }
    }

    // Posicionar todo respecto a los valores de centerX y centerY, para dar el efecto de desplazamiento por el plano cartesiano
    translate(centerX, centerY, 0);

    /* Dibujar cuadrículas */
    drawSmallGridXY(n);
    drawLargeGridXY(n);

    /* Dibujar los ejes X, Y */
    drawAxesXY2D();

    /* Dibujar puntos en los ejes X, Y */
    drawAxesPoints2D();

    /*** GRAFICAR FUNCIÓN EN 2D ***/
    push();
    // translate(offsetX / 2, offsetY / 2);
    functions.forEach((func, index) => {
      if (func !== undefined) {
        plotGraph2D(func, colors[index % colors.length]);
      }
    });
    drawPoints2D();
    pop();
    /*** GRAFICAR FUNCIÓN EN 2D ***/
  }
}


/*** GENERAR CUBO 3D ALREDEDOR DE LOS EJES ***/
function drawBox() {
  push();
  strokeWeight(2);
  stroke(100, 100, 100, 75);
  noFill();
  box(maximum * 2, maximum * 2, maximum * 2, 0, 0);
  pop();
}

/*** GENERAR EJES X, Y, Z ***/
function drawAxes() {
  strokeWeight(strokeXYZ);
  // rotateY(PI);
  // rotateZ(PI);

  // Eje X en rojo
  push();
  beginShape();
  stroke(255, 0, 0);
  vertex(-(maximum - (coneHeight / 2)), 0, 0);
  vertex(maximum - (coneHeight / 2), 0, 0);
  endShape();
  pop();

  // Eje Y en verde
  push();
  beginShape();
  stroke(0, 255, 0);
  vertex(0, -(maximum - (coneHeight / 2)), 0);
  vertex(0, maximum - (coneHeight / 2), 0);
  endShape();
  pop();

  // Eje Z en azul
  push();
  beginShape();
  stroke(0, 0, 255);
  vertex(0, 0, -(maximum - (coneHeight / 2)));
  vertex(0, 0, maximum - (coneHeight / 2));
  endShape();
}


/*** GENERAR CONOS 3D HACIA LOS POSITIVOS ***/
function drawPositiveAxesCones() {
  // Cono rojo al final del lado positivo del eje X
  push();
  translate(maximum - (coneHeight / 2), 0, 0);
  rotateZ(-HALF_PI);
  fill(255, 0, 0);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();

  // Cono verde al final del lado positivo del eje Y
  push();
  translate(0, maximum - (coneHeight / 2), 0);
  fill(0, 255, 0);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();

  // Cono azul al final del lado ***negativo*** del eje Z (Invertir eje Z por adaptación en la visualización)
  push();
  translate(0, 0, -(maximum - (coneHeight / 2)));
  rotateX(-HALF_PI);
  fill(0, 0, 255);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();
}

/*** GENERAR CONOS 3D HACIA LOS NEGATIVOS (GRISES) ***/
function drawNegativeAxesCones() {
  // Cono rojo al final del lado negativo del eje X
  push();
  translate(-(maximum - (coneHeight / 2)), 0, 0);
  rotateZ(HALF_PI);
  fill(100);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();

  // Cono verde al final del lado negativo del eje Y
  push();
  translate(0, -(maximum - (coneHeight / 2)), 0);
  fill(100);
  rotateZ(PI);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();

  // Cono azul al final del lado ***positivo*** del eje Z (Invertir eje Z por adaptación en la visualización)
  push();
  translate(0, 0, (maximum - (coneHeight / 2)));
  rotateX(HALF_PI);
  fill(100);
  noStroke();
  cone(coneRadius, coneHeight);
  pop();
}

/*** GENERAR PUNTOS DE REFERENCIA EN LOS EJES X, Y, Z (SOLO EN MODO 3D) ***/
function drawAxesPoints() {
  for (let i = 0; i < maximum; i = i + 100) {
    if (i != 0) {
      stroke(50);

      // Puntos en eje X positivo
      push();
      translate(i, 0, 0);
      sphere(2);
      pop();

      // Puntos en eje Y positivo
      push();
      translate(0, i, 0);
      sphere(2);
      pop();

      // Puntos en eje Z positivo
      push();
      stroke(0);
      translate(0, 0, -i);
      sphere(2);
      pop();

      // Puntos en eje X negativo
      push();
      translate(-i, 0, 0);
      sphere(2);
      pop();

      // Puntos en eje Y negativo
      push();
      translate(0, -i, 0);
      sphere(2);
      pop();

      // Puntos en eje Z negativo
      push();
      stroke(0);
      translate(0, 0, i);
      sphere(2);
      pop();
    }
  }
}

/*** GENERAR CUADRÍCULA ENTRE LOS EJES X, Y, EN MODO 3D ***/
function drawGridXY(numLines, lineWeight, lineColor) {
  // Primer parámetro es el número de líneas a dibujar en la cuadrícula
  // Segundo parámetro es el grosor de la línea, idealmente entre 0.5 (min) y 2 (max)

  let spacing = maximum / numLines;

  for (let i = 1; i <= numLines; i++) {
    let pos = i * spacing;

    stroke(lineColor);
    strokeWeight(lineWeight);

    // Lineas XY
    beginShape();
    vertex(pos, -maximum, 0);
    vertex(pos, maximum, 0);
    endShape();
    beginShape();
    vertex(-pos, -maximum, 0);
    vertex(-pos, maximum, 0);
    endShape();

    // Lineas YX
    beginShape();
    vertex(-maximum, pos, 0);
    vertex(maximum, pos, 0);
    endShape();
    beginShape();
    vertex(-maximum, -pos, 0);
    vertex(maximum, -pos, 0);
    endShape();
  }
}

/*** GENERAR CUADRÍCULA ENTRE LOS EJES X, Z, EN MODO 3D ***/
function drawGridXZ(numLines, lineWeight, lineColor) {
  // Primer parámetro es el número de líneas a dibujar en la cuadrícula
  // Segundo parámetro es el grosor de la línea, idealmente entre 0.5 (min) y 2 (max)

  let spacing = maximum / numLines;

  for (let i = 1; i <= numLines; i++) {
    let pos = i * spacing;

    stroke(lineColor);
    strokeWeight(lineWeight);

    // Lineas XZ
    beginShape();
    vertex(pos, 0, -maximum);
    vertex(pos, 0, maximum);
    endShape();
    beginShape();
    vertex(-pos, 0, -maximum);
    vertex(-pos, 0, maximum);
    endShape();

    // Lineas ZX
    beginShape();
    vertex(-maximum, 0, pos);
    vertex(maximum, 0, pos);
    endShape();
    beginShape();
    vertex(-maximum, 0, -pos);
    vertex(maximum, 0, -pos);
    endShape()
  }
}


/*** GRAFICAR FUNCIÓN EN MODO 3D ***/
function plotGraph3D(func, plotColor) {
  noFill();
  stroke(plotColor);
  strokeWeight(4);

  try {
    // Si la función es constante (x = 1) ejecutar esto
    beginShape();
    if (func.isVertical) {
      for (let i = -(maximum / 100); i <= (maximum / 100); i += 1) {
        vertex(func() * 100, i * 100);
      }
    }
    endShape();

    if (!func.isVertical) {
      beginShape();
      for (let i = -(maximum / 100); i < 0; i = i + 0.02) {
        let x = i;
        let y = func(i);

        if (y <= (maximum / 100) + 0.1 && y >= -(maximum / 100) - 0.1 && isFinite(y) && !isNaN(y)) {
          vertex(x * 100, y * 100);
        }
      }
      endShape();

      beginShape();
      for (let i = 0; i <= (maximum / 100); i = i + 0.02) {
        let x = i;
        let y = func(i);

        if (y <= (maximum / 100) + 0.1 && y >= -(maximum / 100) - 0.1 && isFinite(y) && !isNaN(y)) {
          vertex(x * 100, y * 100);
        }
      }
      endShape();
    }
  } catch (e) {
    // Ignore invalid points
  }
}

/*** GRAFICAR PUNTOS SEGÚN COORDENADAS INGRESADAS (SOLO EN MODO 3D) ***/
function drawPoints3D() {
  Object.keys(points).forEach(key => {
    const point = points[key];
    if (point.z !== undefined) {
      fill(0);
      noStroke();
      push();
      translate(point.x * 100, point.y * 100, -point.z * 100);
      sphere(5);
      pop();
    } else {
      fill(0);
      noStroke();
      push();
      translate(point.x * 100, point.y * 100, 0);
      sphere(5);
      pop();
    }
  });
}


/*** AUTOMATIZAR LA CREACIÓN DE NÚMEROS EN LOS EJES ***/
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


/*** ORIENTAR NÚMEROS PARA QUE SIEMPRE ESTÉN HACIA EL OBSERVADOR ***/
function orientObject(camX, camY, camZ) {
  // Calcular el vector entre el objeto y la cámara
  let objToCam = createVector(0 + cam.eyeX, camY + cam.eyeY, camZ - cam.eyeZ);
  // print(cam.eyeX, cam.eyeY, cam.eyeZ)

  // Calcular el ángulo de rotación respecto al eje Y
  let angleY = atan2(objToCam.z, objToCam.x);

  // Calcular el ángulo de rotación respecto al eje X
  let angleX = atan2(sqrt(objToCam.x * objToCam.x + objToCam.z * objToCam.z), objToCam.y);

  // Ajuste final en los ángulos
  rotateY(-angleY + PI / 2);
  rotateX(-angleX - PI / 2);

  // rotateY(angleY + PI/2);
  // rotateX(angleX - PI/2);

  if (currentAxis === 'Z') {
    rotateY(-angleY + PI);
    rotateX(-angleX - PI / 2);
    rotateX(HALF_PI);
    rotateY(PI);
    rotateZ(PI / 2);
    // rotateY(PI)
    // rotateX(PI);
  } else {
    rotateX(PI);
    rotateZ(PI);
    // rotateY(HALF_PI);
  }
}


/*** FUNCIÓN PARA DIBUJAR LOS NÚMEROS EN MODO 3D ***/
function drawNumbers3D(camX, camY, camZ) {
  for (let i = -(maximum / 100) + 1; i <= (maximum / 100) - 1; i++) {
    if (i != 0) {
      drawNumber(i, i * 100 + 2, -20, 0, camX, camY, camZ);
      drawNumber(i, 20, i * 100, 0, camX, camY, camZ);
      drawNumber(i, 0 + 2, -20, -i * 100, camX, camY, camZ);
    }
  }
}

/*** INTENTO DE FUNCIÓN PARA DIBUJAR LOS NÚMEROS EN MODO 2D ***/
function drawNumbers2D(camX, camY, camZ) {
  for (let i = -(maximum / 100) + 1; i <= (maximum / 100) - 1; i++) {
    if (i != 0) {
      push();
      // rotateY(PI)
      rotateX(PI)
      rotateZ(PI / 2)
      textSize(scalarFactor / 4)
      drawNumber(i, i * 100 + centerX, -20 + centerY, 0, 0, 0, 0);
      drawNumber(i, (-20 + centerX), -i * 100 + centerY, 0, 0, 0, 0);
      pop();
    }
  }
}

function center2D() {
  centerX = 0;
  centerY = 0;
  scalarFactor = 60 * (initialZoomCamera * 2 / 3);
  zoomStroke = 60;
}

/***  MODO 2D  ***/

/*** INTERCAMBIAR ENTRE VISTA 2D Y 3D ***/
function toggleMode() {
  if (mode === "2D") {
    mode = "3D";
    button.html('Vista 2D');
    startPosition3D()
  } else {
    mode = "2D";
    button.html('Vista 3D');
    startPosition3D();
    center2D();
  }
}

/*** GRAFICAR FUNCIÓN EN MODO 2D ***/
function plotGraph2D(func, plotColor) {
  noFill();
  zoomStroke = constrain(zoomStroke, 40, 500);
  strokeWeight(zoomStroke / 20);
  stroke(plotColor);
  // Gráfica
  try {
    // Si la función es constante (x = 1) ejecutar esto
    beginShape();
    if (func.isVertical) {
      for (let i = -height; i <= height; i += 1) {
        vertex(func() * scalarFactor, i * scalarFactor);
      }
    }
    endShape();

    if (!func.isVertical) {
      push();
      beginShape();

      for (let x = -100; x < 0; x += 0.02) {
        let y = func(x);

        if (y <= 100 && y >= -100) {
          vertex((scalarFactor * x), -(scalarFactor * y));
        }
      }
      endShape();

      beginShape();
      for (let x = 0; x <= 100; x += 0.02) {
        let y = func(x);

        if (y <= 100 && y >= -100) {
          vertex((scalarFactor * x), -(scalarFactor * y));
        }
      }
      endShape();
      pop();
    }
  } catch (e) {

  }
}

/*** GENERAR EJES X, Y (SOLO EN MODO 2D) ***/
function drawAxesXY2D() {
  push();
  zoomStroke = constrain(zoomStroke, 60, 500);
  strokeWeight(round(zoomStroke / 40));
  stroke(120);
  beginShape(LINES);
  vertex((-width / scaleZoomCamera) - centerX, 0, 0); // Eje X
  vertex((width / scaleZoomCamera) - centerX, 0, 0);  // Eje X
  vertex(0, (height / scaleZoomCamera) - centerY, 0);  // Eje Y
  vertex(0, (-height / scaleZoomCamera) - centerY, 0); // Eje Y
  endShape();
  pop();
}

/*** GENERAR LA CUADRÍCULA MÁS GRUESA EN 2D ***/
function drawLargeGridXY() {
  push();
  stroke(160);
  strokeWeight(0.75);

  // Líneas horizontales
  beginShape(LINES);
  for (let i = 0; i <= (width / scaleZoomCamera) + (abs(centerY) * 2); i += (n * 5)) {
    vertex((-width / scaleZoomCamera) - centerX, i, 0);
    vertex((width / scaleZoomCamera) - centerX, i, 0);
    vertex((-width / scaleZoomCamera) - centerX, -i, 0);
    vertex((width / scaleZoomCamera) - centerX, -i, 0);
  }
  endShape();

  // Líneas verticales
  beginShape(LINES);
  for (let i = 0; i <= (height / scaleZoomCamera) + (abs(centerX) * 2); i += (n * 5)) {
    vertex(i, (height / scaleZoomCamera) - centerY, 0);
    vertex(i, (-height / scaleZoomCamera) - centerY, 0);
    vertex(-i, (height / scaleZoomCamera) - centerY, 0);
    vertex(-i, (-height / scaleZoomCamera) - centerY, 0);
  }
  endShape();
  pop();
}

/*** GENERAR LA CUADRÍCULA MÁS DELGADA EN 2D ***/
function drawSmallGridXY(n) {
  push();
  noFill();
  strokeWeight(1.4);
  stroke(235);

  // Líneas horizontales
  // x < 0
  if (centerX >= 0) {
    beginShape(LINES);
    for (let i = 0; i <= (height / scaleZoomCamera) + (abs(centerY) * 2); i += n) {
      vertex((-width / scaleZoomCamera) - abs(centerX), i, 0);
      vertex((width / scaleZoomCamera) - abs(centerX), i, 0);
      vertex((-width / scaleZoomCamera) - abs(centerX), -i, 0);
      vertex((width / scaleZoomCamera) - abs(centerX), -i, 0);
    }
    endShape();
  }

  // x > 0
  if (centerX < 0) {
    beginShape(LINES);
    for (let i = 0; i <= (height / scaleZoomCamera) + (abs(centerY) * 2); i += n) {
      vertex((-width / scaleZoomCamera) + abs(centerX), i, 0);
      vertex((width / scaleZoomCamera) + abs(centerX), i, 0);
      vertex((-width / scaleZoomCamera) + abs(centerX), -i, 0);
      vertex((width / scaleZoomCamera) + abs(centerX), -i, 0);
    }
    endShape();
  }

  // Líneas verticales
  // y > 0
  if (centerY >= 0) {
    beginShape(LINES);
    for (let i = 0; i <= (width / scaleZoomCamera) + (abs(centerX) * 2); i += n) {
      vertex(i, (height / scaleZoomCamera) - abs(centerY), 0);
      vertex(i, (-height / scaleZoomCamera) - abs(centerY), 0);
      vertex(-i, (height / scaleZoomCamera) - abs(centerY), 0);
      vertex(-i, (-height / scaleZoomCamera) - abs(centerY), 0);
    }
    endShape();
  }

  // y < 0
  if (centerY < 0) {
    beginShape(LINES);
    for (let i = 0; i <= (width / scaleZoomCamera) + (abs(centerX) * 2); i += n) {
      vertex(i, (height / scaleZoomCamera) + abs(centerY), 0);
      vertex(i, (-height / scaleZoomCamera) + abs(centerY), 0);
      vertex(-i, (height / scaleZoomCamera) + abs(centerY), 0);
      vertex(-i, (-height / scaleZoomCamera) + abs(centerY), 0);
    }
    endShape();
  }
  pop();
}


/*** GENERAR LOS PUNTOS DE REFERENCIA EN LOS EJES X, Y, EN 2D ***/
function drawAxesPoints2D() {
  // Dibujar puntos en los ejes
  push();
  stroke(0);
  strokeWeight(zoomStroke / 20);
  // strokeWeight(zoomStroke / 25);

  // Puntos eje X positivo
  for (let p = 0; p <= (width / scaleZoomCamera) + (abs(centerX)); p += (n * 5)) {
    beginShape(POINTS);
    vertex(p, 0);
    endShape(CLOSE);
  }

  // Puntos eje X negativo
  for (let p = 0; p <= (width / scaleZoomCamera) + (abs(centerX)); p += (n * 5)) {
    beginShape(POINTS);
    vertex(-p, 0);
    endShape(CLOSE);
  }

  // Puntos eje Y positivo
  for (let p = 0; p <= (height / scaleZoomCamera) + (abs(centerY)); p += (n * 5)) {
    beginShape(POINTS);
    vertex(0, p);
    endShape(CLOSE);
  }

  // Puntos eje Y negativo
  for (let p = 0; p <= (height / scaleZoomCamera) + (abs(centerY)); p += (n * 5)) {
    beginShape(POINTS);
    vertex(0, -p);
    endShape(CLOSE);
  }
  pop();
}


/*** GRAFICAR PUNTOS SEGÚN COORDENADAS INGRESADAS (SOLO EN MODO 2D) ***/
function drawPoints2D() {
  Object.keys(points).forEach(key => {
    const point = points[key];
    push();
    stroke(0);
    strokeWeight(zoomStroke / 10);

    translate(centerX, centerY, 0);
    beginShape(POINTS);
    vertex((point.x * scalarFactor) - centerX, -(point.y * scalarFactor) - centerY);
    endShape(CLOSE);
    pop();
  });
}


/*** CONTROL DEL SCROLL DEL MOUSE EN 2D ***/
function mouseWheel(event) {
  if (mode === "2D") {
    scalarFactor = scalarFactor - event.delta / 50;
  }
}

/*** CONTROL DEL 'ARRASTRE' DEL MOUSE EN 2D ***/
function startDragging() {
  dragging = true;
  startMouseX = mouseX;
  startMouseY = mouseY;
  startOffsetX = centerX;
  startOffsetY = centerY;
}

function stopDragging() {
  dragging = false;
}

function mouseDragged() {
  if (mode === "2D") {
    if (dragging) {
      centerX = startOffsetX + (mouseX - startMouseX);
      centerY = startOffsetY + (mouseY - startMouseY);
    }
  }
}


/*** CONTROL DE CÁMARA Y BOTONES ***/

function handleTransition() {
  if (transitioning) {
    transitionProgress += 0.02;
    if (transitionProgress >= 1) {
      transitionProgress = 1;
      transitioning = false;
    }

    let newPosition = p5.Vector.lerp(currentCameraPosition, initialCameraPosition, transitionProgress);
    let newCenter = p5.Vector.lerp(currentCameraCenter, initialCameraCenter, transitionProgress);

    cam.setPosition(newPosition.x, newPosition.y, newPosition.z);
    cam.lookAt(newCenter.x, newCenter.y, newCenter.z);
  }
}

function applyAxisRotation() {
  if (currentAxis === 'Z') {
    rotateX(HALF_PI);
    rotateY(PI);
  } else {
    rotateX(PI);
    // rotateY(HALF_PI);
  }
}

function startTransition() {
  transitioning = true;
  transitionProgress = 0;
  currentCameraPosition = createVector(cam.eyeX, cam.eyeY, cam.eyeZ);
  currentCameraCenter = createVector(cam.centerX, cam.centerY, cam.centerZ);
}

function changeAxis() {
  if (verticalAxis.value() === 'Centro Y') {
    currentAxis = 'Y';
  } else {
    currentAxis = 'Z';
  }
  startTransition(); // Inicia la transición para cambiar el eje
}

function startPosition3D() {
  currentAxis = 'Y';
  initialCameraPosition = initialPosition2D;
  initialCameraCenter = createVector(0, 0, 0);
  startTransition();
}

// function change3D() {
//   initialCameraPosition = createVector(500 / 2, -300 / 2, 600 / 2);
//   initialCameraCenter = createVector(0, 0, 0);
//   startTransition();
// }


function toggleButtons() {
  buttonsVisible = !buttonsVisible;
  if (buttonsVisible) {
    verticalAxis.show();
    // showPoints.show();
    showGridXY.show();
    showGridXZ.show();
    showBox.show();
  } else {
    verticalAxis.hide();
    // showPoints.hide();
    showGridXY.hide();
    showGridXZ.hide();
    showBox.hide();
  }
}


/*** EJECUTAR SEGÚN CAMBIOS EN EL TAMANO DEL CANVAS ***/
function windowResized() {
  // resizeCanvas(windowWidth, windowHeight);
  button.position(windowWidth - 100, 30);
  homeButton.position(windowWidth - 100, 60);
  settingsButton.position(windowWidth - 100, 90);

  verticalAxis.position(windowWidth - 96, 140);
  showGridXY.position(windowWidth - 120, 220);
  showGridXZ.position(windowWidth - 120, 240);
  showBox.position(windowWidth - 140, 280);
  // showPoints.position(windowWidth - 120, 260);
}
