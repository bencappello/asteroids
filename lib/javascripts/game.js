if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Game = Asteroids.Game = function(width, height) {
  this.width = width;
  this.height = height;
  this.level = 1; // Start at level 1
  this.levelStartTime = null; // Will be set when level actually starts
  this.preLevelState = null; // { countdown: number, timerId: number | null }
  this.num_asteroids = 15;
  this.min_asteroid_speed = 1;
  this.asteroids = this.addInitialAsteroids();
  this.ship = new Asteroids.Ship({ pos: [this.width/2, this.height/2], game: this });
  this.ship_explosion = new Asteroids.ShipExplosion();
  this.asteroid_explosions = [];
  this.bullets = [];
  this.ufos = [];
  this.ufoBullets = [];
  this.powerUp = null;
  this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
  this.gameOver = false
  $('.menu-btn').on('mouseup', this.setGameParamaters.bind(this));
  $('.new-game-btn').on('mouseup', this.newGame.bind(this));
};

Game.UFO_SPAWN_RATE = 0.002;
Game.POWERUP_MIN_SPAWN_DELAY = 1; // seconds
Game.POWERUP_MAX_SPAWN_DELAY = 3; // seconds

Game.prototype.secondsToFrames = function(seconds) {
    // Approximate frames based on Frame_Rate interval (defaulting to ~33fps if not set)
    return seconds * (1000 / (Frame_Rate || 30)); 
};

Game.prototype.resetPowerupSpawnTimer = function() {
    var delaySeconds = Math.random() * (Game.POWERUP_MAX_SPAWN_DELAY - Game.POWERUP_MIN_SPAWN_DELAY) + Game.POWERUP_MIN_SPAWN_DELAY;
    return this.secondsToFrames(delaySeconds);
};

Game.prototype.getSpawnDurationSeconds = function() {
    const baseDuration = 10; // seconds for level 1
    const incrementPerLevel = 2; // seconds added per level
    return baseDuration + (this.level - 1) * incrementPerLevel;
};

Game.prototype.getElapsedLevelTime = function() {
    return Date.now() - this.levelStartTime;
};

Game.prototype.isSpawningAllowed = function() {
    return this.getElapsedLevelTime() <= (this.getSpawnDurationSeconds() * 1000);
};

Game.prototype.setGameParamaters = function () {
  // Add 1 to the data-level to make it 1-based (e.g., Tourist data-level=0 becomes level 1)
  currentGame.level = parseInt($(event.currentTarget).data('level')) + 1;
  // currentGame.levelStartTime = Date.now(); // Don't set time yet
  currentGame.ship.reanimateSelf();

  lives = 5;
  score = 0;
  Frame_Rate = 2; // Assuming this is set correctly elsewhere or needed?

  Radius_Reduction = 0.5;

  currentGame.min_asteroid_speed = 0.1 + (0.03 * currentGame.level);
  currentGame.num_asteroids = 8 + (currentGame.level * 2);
  $('#modal-screen').addClass('hide');

  currentGame.startPreLevelSequence(); // Start countdown instead of reset
};

Game.prototype.reset = function () {
  // Don't reset everything immediately, start countdown
  this.startPreLevelSequence();
  // this.levelStartTime = Date.now(); // Reset level start time on reset
  // this.asteroids = this.addInitialAsteroids();
  // this.bullets = [];
  // this.ufos = [];
  // this.ufoBullets = [];
  // this.powerUp = null;
  // this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
  // this.ship.pos = [this.width/2, this.height/2];
  // this.ship.vel = [0, 0];
  // this.ship.angle = 90;
  // this.ship.isPoweredUp = false;
  // this.ship.powerUpTimer = 0;
  // this.ship.reanimateSelf();
};

Game.prototype.newGame = function () {
  $('#game-over').addClass('hide');
  $('#modal-screen').removeClass('hide');
  this.level = 1; // Reset level on new game
  // this.levelStartTime = Date.now(); // Don't set time yet
  this.ship.suspendSelf(); // Keep ship suspended until level starts
  this.ufos = []; // Clear existing objects
  this.ufoBullets = [];
  this.powerUp = null;
  this.asteroids = []; // Clear asteroids
  this.bullets = [];
  score = 0;
  lives = 5;
  $('#score').html(score);
  $('#lives').html(lives);
  // Wait for difficulty selection which calls setGameParamaters -> startPreLevelSequence
};

Game.prototype.newLife = function () {
  this.ship.suspendSelf();
  lives -= 1;
  $('#lives').html(lives);
  if (lives <= 0) {
    this.ship_explosion.explode(function() {
      currentGame.gameOver = true;
      $('#game-over').removeClass('hide');
    }, this.ship.pos);
  } else {
    this.ship_explosion.explode(this.reset.bind(this), this.ship.pos);
  }
};

Game.prototype.addInitialAsteroids = function () {
  var new_asteroids = [];
  for (var i = 0; i < this.num_asteroids; i++) {
    var temp_asteroid = {
      pos: this.randomPosition(),
      min_speed: this.min_asteroid_speed,
      game: this
    };
    new_asteroids.push(new Asteroids.Asteroid(temp_asteroid));
  }

  return new_asteroids;
};

Game.prototype.randomPosition = function () {
  var pos = [];
  var that = this;
  var inCenter = function(x, y) {
    if (x > (that.width * 0.2) &&
        x < (that.width * 0.8) &&
        y > (that.height * 0.2) &&
        y < (that.height * 0.8)) {
      return true;
    } else {
      return false;
    }
  };
  pos[0] = Math.random() * this.width;
  pos[1] = Math.random() * this.height;
  for (var i = 0; inCenter(pos[0], pos[1]); i++) {
    pos[0] = Math.random() * this.width;
    pos[1] = Math.random() * this.height;
  }
  return pos;
};

Game.prototype.draw = function (ctx) {
  ctx.clearRect ( 0 , 0 , this.width, this.height );
  this.allObjects().forEach(function(el) {
    if (el && typeof el.draw === 'function') {
        el.draw(ctx);
    } else {
        console.error("Attempted to draw an object without a draw method:", el);
    }
  });
  this.asteroid_explosions.forEach(function(el) {
    el.draw(ctx);
  });
  this.ship_explosion.draw(ctx);
};

Game.prototype.moveObjects = function () {
  this.allObjects().forEach(function(el) {
    if (el && typeof el.move === 'function') {
      el.move();
    } else {
      console.error("Attempted to move an object without a move method:", el);
    }
  });
};

Game.prototype.wrap = function (pos, objRadius) {
  var startX = pos[0];
  var startY = pos[1];


  var x = (pos[0] % (this.width + objRadius*2));
  var y = (pos[1] % (this.height + objRadius*2));


  if (x !== startX) {
    x -= objRadius;
  }

  if (y !== startY) {
    y -= objRadius;
  }

  if (x < (-1 * objRadius)) {
    x = this.width + ((2 * objRadius) + x);
  }

  if (y < (-1 * objRadius)) {
    y = this.height + ((2 * objRadius) + y);
  }

  return [x,y];
};

Game.prototype.checkCollisions = function () {
  var allObjs = this.allObjects();
  for (var i = 0; i < allObjs.length; i++) {
    for (var j = i + 1; j < allObjs.length; j++) {
      var obj1 = allObjs[i];
      var obj2 = allObjs[j];

      if (obj1 && typeof obj1.isCollidedWith === 'function' &&
          obj2 && typeof obj2.isCollidedWith === 'function' &&
          obj1.isCollidedWith(obj2)) {
        if (typeof obj1.collideWith === 'function') {
            obj1.collideWith(obj2);
        } else {
            console.error("obj1 missing collideWith method", obj1);
        }
      }
    }
  }
};

Game.prototype.step = function () {
  // Pause game logic during countdown
  if (this.preLevelState) return;

  this.moveObjects();
  this.checkCollisions();

  if (!this.isSpawningAllowed() && this.asteroids.length === 0 && this.ufos.length === 0) {
      this.advanceLevel();
  } else {
      if (this.isSpawningAllowed()) {
          this.maybeAddUfo();
          this.maybeSpawnPowerUp();
      }
  }
};

Game.prototype.remove = function (object) {
  var list, index = -1;

  if (object instanceof Asteroids.Asteroid) {
    list = this.asteroids;
  } else if (object instanceof Asteroids.Bullet) {
    list = this.bullets;
  } else if (object instanceof Asteroids.Ufo) {
    list = this.ufos;
  } else if (object instanceof Asteroids.UfoBullet) {
    list = this.ufoBullets;
  } else if (object instanceof Asteroids.AsteroidExplosion) {
     list = this.asteroid_explosions;
  } else if (object instanceof Asteroids.PowerUp) {
     if (this.powerUp === object) {
         this.powerUp = null;
         this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
     }
     return;
  } else {
    console.warn("Attempted to remove unknown object type:", object);
    return;
  }

  if (list) {
      index = list.indexOf(object);
  }

  if (index !== -1) {
    list.splice(index, 1);
  } else {
      if (!(object instanceof Asteroids.AsteroidExplosion)){
          console.warn("Attempted to remove object not found in its list:", object);
      }
  }
};

Game.prototype.add = function (obj) {
  if (obj instanceof Asteroids.Asteroid) {
    this.asteroids.push(obj);
  } else if (obj instanceof Asteroids.Bullet) {
    this.bullets.push(obj);
  } else if (obj instanceof Asteroids.Ufo) {
    this.ufos.push(obj);
  } else if (obj instanceof Asteroids.UfoBullet) {
    this.ufoBullets.push(obj);
  } else if (obj instanceof Asteroids.AsteroidExplosion) {
    this.asteroid_explosions.push(obj);
  } else if (obj instanceof Asteroids.PowerUp) {
      this.powerUp = obj;
  } else {
      console.warn("Attempted to add unknown object type:", obj);
  }
};

Game.prototype.allObjects = function () {
  var currentPowerUp = this.powerUp ? [this.powerUp] : [];
  var objects = [].concat(this.bullets, this.asteroids, this.ufos, this.ufoBullets, currentPowerUp);
  if (this.ship) {
    objects.push(this.ship);
  }
  return objects;
};

Game.prototype.isOutOfBounds = function(pos, objRadius) {
  var x = pos[0];
  var y = pos[1];
  if (x > (this.width + objRadius) || x < (0 - objRadius)) {
    return true;
  } else if (y > (this.height + objRadius) || y < (0 - objRadius)) {
    return true;
  } else {
    return false;
  }
};

Game.prototype.maybeAddUfo = function () {
  if (this.isSpawningAllowed() && Math.random() < Game.UFO_SPAWN_RATE) {
    var ufo = new Asteroids.Ufo({
      pos: this.randomPosition(),
      game: this
    });
    this.add(ufo);
  }
};

Game.prototype.maybeSpawnPowerUp = function () {
    if (this.isSpawningAllowed() && this.powerUp === null && !this.ship.isPoweredUp) {
        this.powerUpSpawnTimer -= 1;
        if (this.powerUpSpawnTimer <= 0) {
            if (typeof Asteroids.PowerUp !== 'function') {
                console.error("CRITICAL: Asteroids.PowerUp is NOT a function just before creating!");
                return;
            }
            this.powerUp = new Asteroids.PowerUp({
                pos: this.randomPosition(),
                game: this
            });
            this.add(this.powerUp);
        }
    }
};

Game.prototype.advanceLevel = function() {
    this.level++;
    // this.levelStartTime = Date.now(); // Set in startLevelGameplay

    console.log("Advancing to level: ", this.level);

    this.startPreLevelSequence(); // Start countdown for the next level

    // // Move level setup logic to startLevelGameplay
    // this.asteroids = this.addInitialAsteroids();
    // this.bullets = [];
    // this.ufos = [];
    // this.ufoBullets = [];
    // this.powerUp = null;
    // this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
    // this.ship.pos = [this.width / 2, this.height / 2];
    // this.ship.vel = [0, 0];
    // this.ship.angle = 90;
    // this.ship.isPoweredUp = false;
    // this.ship.powerUpTimer = 0;
};

// New function to initiate the pre-level countdown
Game.prototype.startPreLevelSequence = function() {
    console.log("Starting pre-level sequence for level:", this.level);
    this.preLevelState = { countdown: 3, timerId: null };

    // Clear any existing gameplay objects from previous level/state
    this.asteroids = [];
    this.bullets = [];
    this.ufos = [];
    this.ufoBullets = [];
    this.powerUp = null;
    this.ship.vel = [0, 0]; // Stop ship movement
    this.ship.pos = [this.width / 2, this.height / 2]; // Center ship
    this.ship.reanimateSelf(); // Ensure ship is visible if previously exploded

    // Display "Level X"
    $('#level-text').html('Level ' + this.level);
    $('#level-display').removeClass('hide');

    // Hide "Level X" after 1.5 seconds, then start countdown
    setTimeout(function() {
        $('#level-display').addClass('hide');
        // Start the actual countdown ticking
        this.handleCountdownTick();
    }.bind(this), 1500);
};

// New function to handle each tick of the countdown
Game.prototype.handleCountdownTick = function() {
    if (!this.preLevelState) return; // Stop if state was cleared unexpectedly

    if (this.preLevelState.countdown > 0) {
        console.log("Countdown:", this.preLevelState.countdown);
        // Display current countdown number
        $('#countdown-number').html(this.preLevelState.countdown);
        $('#countdown-display').removeClass('hide');

        // Decrement countdown
        this.preLevelState.countdown--;

        // Schedule next tick
        this.preLevelState.timerId = setTimeout(this.handleCountdownTick.bind(this), 1000);
    } else {
        console.log("Countdown finished, starting level gameplay.");
        // Countdown finished
        $('#countdown-display').addClass('hide'); // Hide countdown number
        this.preLevelState = null; // Clear the pre-level state
        this.startLevelGameplay(); // Start the actual level
    }
};

// New function to setup and start the actual level gameplay
Game.prototype.startLevelGameplay = function() {
    console.log("Starting gameplay for level:", this.level);
    this.levelStartTime = Date.now(); // Set level start time NOW
    this.asteroids = this.addInitialAsteroids();
    this.bullets = []; // Ensure bullets are clear
    this.ufos = []; // Ensure UFOs are clear
    this.ufoBullets = []; // Ensure UFO bullets are clear
    this.powerUp = null; // Ensure powerup is clear
    this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
    this.ship.pos = [this.width / 2, this.height / 2]; // Re-center ship
    this.ship.vel = [0, 0];
    this.ship.angle = 90;
    this.ship.isPoweredUp = false;
    this.ship.powerUpTimer = 0;
    this.ship.reanimateSelf(); // Make sure ship is active

    // Ensure the game loop in GameView is running
    if (window.gameView && !window.gameView.intervalID) {
         console.warn("Game loop was not running. Attempting to restart.");
         // Ideally, GameView.start should handle this, but as a fallback:
         window.gameView.start(); // This might restart interval if stopped
    }
};
