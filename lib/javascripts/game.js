if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Game = Asteroids.Game = function(width, height) {
  this.width = width;
  this.height = height;
  this.attractMode = true; // Start in attract mode
  this.level = 1; // Start at level 1
  this.levelStartTime = null; // Will be set when level actually starts
  this.preLevelState = null; // { countdown: number, timerId: number | null }
  // Set base parameters - these might be adjusted slightly per level later if needed
  this.base_num_asteroids = 5; // Starting number for level 1
  this.base_min_asteroid_speed = 0.5; // Reverted to original base speed
  this.num_asteroids = this.base_num_asteroids;
  this.min_asteroid_speed = this.base_min_asteroid_speed;

  this.asteroids = this.addInitialAsteroids(true); // Add asteroids for attract mode
  this.ship = null; // Don't create ship yet
  this.ship_explosion = new Asteroids.ShipExplosion();
  this.ufoSpawnTimer = this.secondsToFrames(Game.UFO_SPAWN_INTERVAL_SECONDS); // Timer for UFO spawn
  this.asteroid_explosions = [];
  this.bullets = [];
  this.ufos = [];
  this.ufoBullets = [];
  this.powerUp = null;
  this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
  this.gameOver = false;
  this.gameOverScreenShown = false;
  this.score = 0; // Initialize score on the game instance
  this.lives = Game.NUM_LIVES; // Initialize lives on the game instance
  // Remove menu-btn listener
  // $('.menu-btn').on('mouseup', this.setGameParamaters.bind(this));

  // Add listener for the new start button - NOTE: This might be better placed in index.html onload
  // to ensure currentGame exists. Let's assume it's called from index.html for now.
  // Example of handler function:
  this.startGameHandler = function() {
      console.log("Start game button clicked");
      this.attractMode = false; // Exit attract mode
      $('#modal-screen').addClass('hide');
      // Create the ship now
      this.ship = new Asteroids.Ship({ pos: [this.width/2, this.height/2], game: this });
      // Set initial parameters (level 1)
      this.level = 1;
      $('#level').html(this.level);
      // Calculate asteroids for level 1
      this.num_asteroids = this.base_num_asteroids; // Level 1 starts with base
      this.min_asteroid_speed = this.base_min_asteroid_speed;
      this.lives = Game.NUM_LIVES; // Use instance lives
      this.score = 0; // Use this.score
      $('#lives').html(this.lives); // Use instance lives for display
      $('#score').html(this.score); // USE this.score
      this.startPreLevelSequence(); // Start the countdown
  }.bind(this);

  $('.new-game-btn').on('mouseup', this.newGame.bind(this));
};

Game.UFO_SPAWN_INTERVAL_SECONDS = 3; // Spawn UFO every 3 seconds
Game.POWERUP_MIN_SPAWN_DELAY = 1; // seconds
Game.POWERUP_MAX_SPAWN_DELAY = 3; // seconds
Game.LARGE_ASTEROID_RADIUS_REDUCTION = 0.5; // Factor to reduce radius for large asteroid splits

Game.DIM_X = 1000;
Game.DIM_Y = 600;
Game.FPS = 32;
Game.NUM_ASTEROIDS = 10;
Game.NUM_LIVES = 5; // Define starting lives constant

Game.prototype.secondsToFrames = function(seconds) {
    // Approximate frames based on Frame_Rate interval (defaulting to ~33fps if not set)
    return seconds * (1000 / (Frame_Rate || 30)); 
};

Game.prototype.resetPowerupSpawnTimer = function() {
    var delaySeconds = Math.random() * (Game.POWERUP_MAX_SPAWN_DELAY - Game.POWERUP_MIN_SPAWN_DELAY) + Game.POWERUP_MIN_SPAWN_DELAY;
    return this.secondsToFrames(delaySeconds);
};

Game.prototype.getSpawnDurationSeconds = function() {
    const baseDuration = 5; // seconds for level 1
    let incrementPerLevel;

    if (this.level <= 7) {
        // Increase by 2 seconds per level up to level 7
        incrementPerLevel = 2;
        return baseDuration + (this.level - 1) * incrementPerLevel;
    } else {
        // Duration up to level 7: base + 6 * 2 = 5 + 12 = 17 seconds
        const durationAtLevel7 = baseDuration + 6 * 2;
        // Increase by 5 seconds for each level beyond 7
        incrementPerLevel = 5;
        return durationAtLevel7 + (this.level - 7) * incrementPerLevel;
    }
};

Game.prototype.getElapsedLevelTime = function() {
    return Date.now() - this.levelStartTime;
};

Game.prototype.isSpawningAllowed = function() {
    return this.getElapsedLevelTime() <= (this.getSpawnDurationSeconds() * 1000);
};

Game.prototype.reset = function () {
  console.log("Resetting ship after life lost.");
  if (this.ship) {
    this.ship.pos = [this.width / 2, this.height / 2]; // Center ship
    this.ship.vel = [0, 0]; // Stop movement
    this.ship.angle = 90; // Reset angle
    this.ship.reanimateSelf(); // Ensure active
    // Make invincible
    this.ship.isInvincible = true;
    this.ship.invincibleTimer = this.secondsToFrames(this.ship.INVINCIBILITY_DURATION_SECONDS);
    // Reset powerup state
    this.ship.isPoweredUp = false;
    this.ship.powerUpTimer = 0;
    console.log("Ship invincible for", this.ship.invincibleTimer, "frames");
  }
};

Game.prototype.newGame = function () {
  // Called by the 'New Game' button in sidebar or game over screen
  $('#game-over').addClass('hide');
  this.gameOver = false; // Reset game over flag
  this.attractMode = true; // Re-enter attract mode

  // Stop any existing game loops/timers
  if (window.gameView) { // Ensure gameView exists
      window.gameView.stopLoop();
  }
  // Stop any ongoing countdown timers
  if (this.preLevelState && this.preLevelState.timerId) {
    clearTimeout(this.preLevelState.timerId);
  }
  this.preLevelState = null;
  $('#level-display').addClass('hide');
  $('#countdown-display').addClass('hide');
  $('#initials-input-modal').addClass('hide');
  $('#modal-screen').removeClass('hide');
  this.gameOverScreenShown = false; // Explicitly reset this flag
  this.asteroids = this.addInitialAsteroids(true); // Add asteroids for attract mode

  // Reset core game state
  // this.level = 1; // Level is reset implicitly by starting attract mode
  $('#level').html('-'); // Show placeholder in sidebar
  this.ship = null; // Remove ship
  // this.ship.suspendSelf(); // No ship to suspend
  this.ufos = [];
  this.ufoBullets = [];
  this.powerUp = null;
  this.bullets = [];
  this.asteroid_explosions = [];
  // Reset ship explosion animation by setting frame past the end
  if (this.ship_explosion) { // Ensure it exists
    this.ship_explosion.frame = this.ship_explosion.img_obj.total_frames + 1;
  }
  this.score = 0; // USE this.score
  this.lives = Game.NUM_LIVES; // Use instance lives
  $('#score').html(this.score); // USE this.score
  $('#lives').html(this.lives); // Use instance lives for display

  // Display high scores on start screen
  Asteroids.Util.displayHighScores('high-scores-start');

  // Show the initial start modal screen again
  $('#modal-screen').removeClass('hide');

  // Start the attract mode loop again
  if (window.gameView) { // Ensure gameView exists
      window.gameView.startAttractModeLoop();
  }
};

Game.prototype.addInitialAsteroids = function (isAttractMode) {
  var new_asteroids = [];
  var num = isAttractMode ? 20 : this.num_asteroids; // Fewer asteroids for attract mode
  var speed = isAttractMode ? this.base_min_asteroid_speed : this.min_asteroid_speed;

  // Optional: Increase asteroids per level (only applies if !isAttractMode)
  if (!isAttractMode) {
      // this.num_asteroids = this.base_num_asteroids + (this.level - 1) * 2; // Example increase
      // this.min_asteroid_speed = this.base_min_asteroid_speed + (this.level - 1) * 0.03; // Example increase
  }
  console.log(`Adding ${num} asteroids (Attract Mode: ${!!isAttractMode})`);

  for (var i = 0; i < num; i++) {
    var temp_asteroid = {
      pos: this.randomPosition(),
      min_speed: speed,
      mag: speed, // Ensure consistent speed for attract mode
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

  // Only draw asteroids in attract mode
  if (this.attractMode) {
    this.asteroids.forEach(function(el) {
      if (el && typeof el.draw === 'function') {
          el.draw(ctx);
      }
    });
    return; // Don't draw anything else in attract mode
  }

  // Normal drawing logic
  // If game is over, only draw the explosion, not the objects
  if (!this.gameOver) {
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
  }
  
  // Always draw ship explosion if it's running
  this.ship_explosion.draw(ctx);
};

Game.prototype.moveObjects = function () {
  // Only move asteroids in attract mode
  if (this.attractMode) {
    this.asteroids.forEach(function(el) {
      if (el && typeof el.move === 'function') {
          el.move();
      }
    });
    return; // Don't move anything else
  }

  // Normal move logic
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
  // Attract mode only needs movement
  if (this.attractMode) {
      this.moveObjects();
      return;
  }

  // If game over, check if explosion is finished
  if (this.gameOver) {
    // First, wait for explosion animation to technically finish
    if (this.ship_explosion.frame > this.ship_explosion.img_obj.total_frames) {
        // Initialize or increment delay counter only AFTER explosion frame check passes
        this.gameOverDelayCounter = (this.gameOverDelayCounter || 0) + 1;

        // Check if delay is met AND the screen hasn't been shown yet
        if (this.gameOverDelayCounter > 10 && !this.gameOverScreenShown) { // Wait 10 extra frames
            console.log("Game over, explosion finished, and delay met. Checking high score.");
            this.gameOverScreenShown = true; // Set flag immediately to prevent re-entry
            
            const highScores = Asteroids.Util.loadHighScores();
            const isNewHighScore = Asteroids.Util.isHighScore(this.finalScore, highScores);

            if (isNewHighScore) {
                console.log("New high score! Showing initials input.");
                $('#initials-input').val(""); // Clear previous input
                $('#initials-input-modal').removeClass('hide');
                setTimeout(() => $('#initials-input').focus(), 100);
                // Show game over screen underneath
                Asteroids.Util.displayHighScores('high-scores-gameover');
                $('#game-over').removeClass('hide');
            } else {
                console.log("No high score. Showing game over screen.");
                Asteroids.Util.displayHighScores('high-scores-gameover');
                $('#game-over').removeClass('hide');
            }
        }
    }
    // Return here to prevent moving objects etc. when game is over
    return; 
  }

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

Game.prototype.getMaxUfosForLevel = function(level) {
    if (level === 2) return 1;

    const baseMax = 1; // Max at level 2
    if (level <= 7) {
        return baseMax + (level - 2) * 1;
    } else {
        // Max up to level 7: base + (7-2)*1 = 1 + 5 = 6
        const maxAtLevel7 = baseMax + 5;
        // Add 2 for each level beyond 7
        return maxAtLevel7 + (level - 7) * 2;
    }
};

Game.prototype.maybeAddUfo = function () {
  // Only spawn if level 2+, spawning allowed time-wise
  if (this.level >= 2 && this.isSpawningAllowed()) {
    this.ufoSpawnTimer -= 1;

    if (this.ufoSpawnTimer <= 0) {
      // Reset timer regardless of spawning
      this.ufoSpawnTimer = this.secondsToFrames(Game.UFO_SPAWN_INTERVAL_SECONDS);

      // Check if max UFOs reached for this level
      const maxUfos = this.getMaxUfosForLevel(this.level);
      if (this.ufos.length < maxUfos) {
        console.log(`Spawning UFO (Current: ${this.ufos.length}, Max: ${maxUfos}, Level: ${this.level})`);
        var ufo = new Asteroids.Ufo({
          pos: this.randomPosition(),
          game: this
        });
        this.add(ufo);
      } else {
         console.log(`Max UFOs reached (${this.ufos.length}/${maxUfos}), resetting timer.`);
      }
    }
  }
};

Game.prototype.maybeSpawnPowerUp = function () {
    // Only consider spawning if level 2+, allowed, no powerup exists/ship isn't powered up
    if (this.level >= 2 && this.isSpawningAllowed() && this.powerUp === null && !this.ship.isPoweredUp) {
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
    $('#level').html(this.level);

    // Calculate Asteroid Count
    if (this.level <= 7) {
        this.num_asteroids = this.base_num_asteroids + (this.level - 1) * 1;
    } else {
        // Asteroids up to level 7: base + 6*1
        var asteroidsAtLevel7 = this.base_num_asteroids + 6;
        // Add 2 for each level beyond 7
        this.num_asteroids = asteroidsAtLevel7 + (this.level - 7) * 2;
    }

    // Optional: Adjust speed (keeping existing logic for now)
    this.min_asteroid_speed = this.base_min_asteroid_speed + (this.level - 1) * 0.1;

    console.log("Advancing to level: ", this.level);
    console.log("Asteroid Count: ", this.num_asteroids);
    console.log("Max UFOs for this level: ", this.getMaxUfosForLevel(this.level));
    this.startPreLevelSequence();
};

// New function to initiate the pre-level countdown
Game.prototype.startPreLevelSequence = function() {
    console.log("Starting pre-level sequence for level:", this.level);
    this.preLevelState = { countdown: 3, timerId: null };

    // Clear transient objects (bullets, UFOs, powerups)
    this.asteroids = []; // Clear existing asteroids
    this.bullets = [];
    this.ufos = [];
    this.ufoBullets = [];
    this.powerUp = null;

    // Reset ship state if it exists (it won't on initial start)
    if (this.ship) {
        this.ship.vel = [0, 0]; // Stop ship movement
        this.ship.pos = [this.width / 2, this.height / 2]; // Center ship
        this.ship.angle = 90; // Reset angle HERE
        this.ship.reanimateSelf(); // Ensure ship is visible if previously exploded
    }

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
    // Add asteroids for the actual level (false flag)
    this.asteroids = this.addInitialAsteroids(false);
    this.bullets = []; // Ensure bullets are clear
    this.ufos = []; // Ensure UFOs are clear
    this.ufoBullets = []; // Ensure UFO bullets are clear
    this.powerUp = null; // Ensure powerup is clear
    this.powerUpSpawnTimer = this.resetPowerupSpawnTimer();
    this.ship.pos = [this.width / 2, this.height / 2]; // Re-center ship
    this.ship.vel = [0, 0];
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

Game.prototype.handleDeath = function () {
  var lives_remaining = this.decrementLives(); // Get instance lives
  var score = this.score; // Store score before potentially resetting

  if (lives_remaining <= 0) {
    // GAME OVER state triggered
    if (!this.gameOver) { // Ensure we only trigger this once
      console.log("Game over condition met. Starting ship explosion.");
      this.gameOver = true;
      // Just start the explosion animation. The game loop/draw will handle the rest.
      this.ship_explosion.explode(null, this.ship.pos); 
      // Store the final score for high score check later
      this.finalScore = score; 
    }
  } else {
    // Not game over, just reset for new life after explosion
    // The explosion callback handles calling this.reset()
    console.log("Life lost. Starting ship explosion then reset.");
    this.ship.suspended = true;
    this.ship_explosion.explode(this.reset.bind(this), this.ship.pos);
  }
};

// Add the missing decrementLives function
Game.prototype.decrementLives = function() {
    if (this.lives > 0) { // Check instance lives
        this.lives -= 1; // Decrement instance lives
    }
    $('#lives').html(this.lives); // Update the display using instance lives
    return this.lives; // Return the new number of instance lives
};
