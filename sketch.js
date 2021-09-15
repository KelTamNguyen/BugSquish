//Kelvin Nguyen
//CSC 2463

var bugs = [];
var count = 50;
var score = 0;
var timeLeft = 10;
var orientations = ["up", "right", "down", "left"];
var fr = 15;
const timeOsc = new Tone.Oscillator().toDestination();
var pattern;
const musicSynth = make_poly().instrument;
const gameOverSynth = new Tone.Synth().toDestination();
// Declare a "SerialPort" object
var serial;
var portName = 'COM7';
// this is the message that will be sent to the Arduino:
var outMessage = 'H';

function preload() {
  for (let i = 0; i < count; i++) {
    let orientation = Math.floor(Math.random() * 4);
    bugs[i] = new Bug(random(windowWidth - 100), random(windowHeight - 100), orientations[orientation]);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  frameRate(fr);
  textFont("Hellvetica");

  // make an instance of the SerialPort object
  serial = new p5.SerialPort();

  // Get a list the ports available
  // You should have a callback defined to see the results. See gotList, below:
  serial.list();

  // Assuming our Arduino is connected,  open the connection to it
  serial.open(portName);

  // When you get a list of serial ports that are available
  serial.on('list', gotList);

  // When you some data from the serial port
  serial.on('data', gotData);

  pattern = new Tone.Pattern((time, note) => {
    musicSynth.triggerAttackRelease(note, "8n", time);
  }, ["G4", "A4", 'b4', 'e4'], 'alternateDown').start();

  startPart = createButton("music on")
    .position(10, 110)
    .mousePressed(() => pattern.start());

  stopPart = createButton("music off")
    .position(10, 140)
    .mousePressed(() => pattern.stop());

  Tone.Transport.start();
}

function draw() {
  var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  background("cream");

  textSize(20);
  fill(0);
  text("Score: " + score, 10, 50);
  text("Time: " + timeLeft, 10, 80);

  if (frameCount % fr === 0 && timeLeft > 0) {
    timeLeft--;
    if (timeLeft <= 5 && timeLeft > 0) {
      timeOsc.start().stop("+0.1");
    }
  }
  if (timeLeft === 0) {
    fill("red");
    textSize(50);
    text("GAME OVER", windowWidth/2, windowHeight/2);
    pattern.stop();
    gameOverSynth.triggerAttackRelease("C0", "8n");
  }

  for (let i = 0; i < count; i++) {
    if(timeLeft > 0) {
      bugs[i].animate();
    }
  }
}

function mousePressed() {
  for (let i = 0; i < count; i++) {
    bugs[i].handleMousePress();
  }
}

function mouseReleased() {
  serial.write(outMessage);
  if (outMessage === 'H') {
    outMessage = 'L';
  } else {
    outMessage = 'H';
  }
  console.log(outMessage);
}

function make_poly() {
  // create synth
  var instrument = new Tone.FMSynth();
  var synthJSON = {
    harmonicity: 5,
    modulationIndex: 10,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    },
    modulation: {
      type: "square"
    },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.2,
      sustain: 0,
      release: 0.2
    }
  };

  instrument.set(synthJSON);

  var effect1, effect2, effect3;

  // make connections
  instrument.connect(Tone.Master);

  // define deep dispose function
  function deep_dispose() {
    if (instrument != undefined && instrument != null) {
      instrument.dispose();
      instrument = null;
    }
  }

  return {
    instrument: instrument,
    deep_dispose: deep_dispose
  };
}

function make_DuoSynth() {
  // create synth
  var instrument = new Tone.FMSynth();
  var synthJSON = {
    harmonicity: 5,
    modulationIndex: 10,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 2,
      sustain: 0.1,
      release: 2
    },
    modulation: {
      type: "square"
    },
    modulationEnvelope: {
      attack: 0.002,
      decay: 0.2,
      sustain: 0,
      release: 0.2
    }
  };

  instrument.set(synthJSON);

  var effect1, effect2, effect3;

  // make connections
  instrument.connect(Tone.Destination);

  // define deep dispose function
  function deep_dispose() {
    if (instrument != undefined && instrument != null) {
      instrument.dispose();
      instrument = null;
    }
  }

  return {
    instrument: instrument,
    deep_dispose: deep_dispose
  };
}

// Got the list of ports
function gotList(thelist) {
  console.log("List of Serial Ports:");
  // theList is an array of their names
  for (var i = 0; i < thelist.length; i++) {
    // Display in the console
    console.log(i + " " + thelist[i]);
  }
}

// Called when there is data available from the serial port
function gotData() {
  var currentString = serial.readLine();
  console.log(currentString);
}

function Bug(x, y, orientation) {
  this.spriteSheet = loadImage("images/GreenBugSpritesheet.png");
  this.frame = 0;
  this.x = x;
  this.y = y;
  this.speed = 5;
  this.isDead = false;
  this.isScored = false;
  this.orientation = orientation;
  this.scoreSynth = make_DuoSynth().instrument;

  this.animate = function() {
    push();
    translate(this.x,this.y);

    if(orientation === "up") {
      scale(1.0);
    }
    if(orientation === "down") {
      scale(-1.0);
    }
    if (orientation === "right") {
      rotate(PI/2);
    }
    if (orientation === "left") {
      rotate(3*PI/2);
    }

    if (this.isDead) {
      image(this.spriteSheet, 0, 0, 40, 40, 300, 0, 150, 150);
    } else {
      if (this.frame === 0) {
        image(this.spriteSheet, 0, 0, 40, 40, 0, 0, 150, 150);
      }
      if (this.frame === 1) {
        image(this.spriteSheet, 0, 0, 40, 40, 150, 0, 150, 150);
      }
      if (frameCount % 2 === 0) {
        this.frame = (this.frame + 1) % 2;
        if (this.orientation === "up") {
          this.y -= this.speed;
        }
        if (this.orientation === "down") {
          this.y += this.speed;
        }
        if (this.orientation === "right") {
          this.x += this.speed;
        }
        if (this.orientation === "left") {
          this.x -= this.speed;
        }
      }
    }
  pop();

    this.handleMousePress = function() {
      var distance  = dist(mouseX, mouseY, this.x, this.y);
      if (distance < 20) {
        this.isDead = true;
        if (!this.isScored) {
          score++;
          this.scoreSynth.triggerAttackRelease("c6", "8n");
          musicSynth.playbackRate *= 1.10;
          console.log(musicSynth.playbackRate);
          this.isScored = true;
        }
      } else {
         this.speed += 2;
      }
    }
  }
}
