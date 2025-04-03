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
  this.score = 0; // Initialize score
  this.lives = 1; // Initialize lives
  this.finalScore = 0; // Initialize finalScore
  
  // Initial DOM update (optional, as newGame/startGameHandler will update)
  // $('#score').html(this.score);
  // $('#lives').html(this.lives);

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
      this.lives = 1; // Reset lives on Game instance
      this.score = 0; // Reset score on Game instance
      this.finalScore = 0; // Reset final score
      $('#lives').html(this.lives);
      document.getElementById('score').textContent = this.score; // Use textContent
      this.startPreLevelSequence(); // Start the countdown
  }.bind(this);

  $('.new-game-btn').on('mouseup', this.newGame.bind(this));
};

Game.EASY_ASTEROID_MODE = false;
Game.EASY_UFO_MODE = false;

Game.UFO_SPAWN_INTERVAL_SECONDS = 3; // Spawn UFO every 3 seconds
Game.POWERUP_MIN_SPAWN_DELAY = 1; // seconds
Game.POWERUP_MAX_SPAWN_DELAY = 3; // seconds
Game.LARGE_ASTEROID_RADIUS_REDUCTION = 0.5; // Factor to reduce radius for large asteroid splits

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
  // This is called when ship explodes (but not game over)
  // It should restart the current level's countdown
  this.startPreLevelSequence();
};

Game.prototype.newGame = function () {
  // Called by the 'New Game' button in sidebar or game over screen
  $('#game-over').addClass('hide');
  this.gameOver = false; // Reset game over flag
  this.gameOverScreenShown = false; // Reset screen shown flag
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

  // Reset core game state
  // this.level = 1; // Level is reset implicitly by starting attract mode
  $('#level').html('-'); // Show placeholder in sidebar
  this.ship = null; // Remove ship
  this.ufos = [];
  this.ufoBullets = [];
  this.powerUp = null;
  this.asteroids = this.addInitialAsteroids(true); // Add attract mode asteroids
  this.bullets = [];
  this.asteroid_explosions = [];
  // Reset ship explosion animation by setting frame past the end
  if (this.ship_explosion) { // Ensure it exists
    this.ship_explosion.frame = this.ship_explosion.img_obj.total_frames + 1;
  }
  this.score = 0; // Reset score on instance
  this.lives = 1; // Reset lives on instance
  this.finalScore = 0; // Reset final score
  $('#lives').html(this.lives);
  document.getElementById('score').textContent = this.score; // Use textContent

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
    if (this.ship_explosion.frame > this.ship_explosion.img_obj.total_frames && !this.gameOverScreenShown) {
      console.log("Game over and explosion finished. Checking high score.");
      const highScores = Asteroids.Util.loadHighScores();
      // Use the stored this.finalScore for the check
      console.log(`Checking if score ${this.finalScore} is high score against list:`, JSON.stringify(highScores));
      const isNewHighScore = Asteroids.Util.isHighScore(this.finalScore, highScores);

      if (isNewHighScore) {
          console.log("Post-explosion check: New high score! Showing initials modal.");
          // Ensure Game Over screen is ready behind the modal
          Asteroids.Util.displayHighScores('high-scores-gameover');
          $('#game-over').removeClass('hide');
          // Store the score on the modal element for retrieval later
          $('#initials-input-modal').data('score-to-save', this.finalScore);
          // Show initials modal
          $('#initials-input').val("");
          $('#initials-input-modal').removeClass('hide');
          setTimeout(() => $('#initials-input').focus(), 100);
          // NOTE: Initials submit handler now calls newGame()
      } else {
          console.log("Post-explosion check: No high score. Showing game over screen.");
          Asteroids.Util.displayHighScores('high-scores-gameover');
          $('#game-over').removeClass('hide');
          // No high score, so we might want to allow immediate restart? 
          // Or let the user click the button on the game over screen.
      }
      this.gameOverScreenShown = true; // Flag to prevent this block running again
    }
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
    if (level < 2) return 0; // No UFOs before level 2
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
  // Decrement lives on the instance
  this.lives -= 1;
  $('#lives').html(this.lives); // Update display
  
  if (this.lives <= 0) {
    // GAME OVER state triggered
    if (!this.gameOver) {
      console.log("Game over condition met. Starting ship explosion.");
      this.gameOver = true;
      this.ship_explosion.explode(null, this.ship.pos);
      // Store the final score from the instance property
      this.finalScore = this.score; 
      console.log(`Stored finalScore: ${this.finalScore}`);
    }
  } else {
    // Not game over, just reset for new life after explosion
    console.log("Life lost. Starting ship explosion then reset.");
    this.ship_explosion.explode(this.reset.bind(this), this.ship.pos);
  }
};

// Add helper for incrementing score
Game.prototype.incrementScore = function(points) {
    this.score += points;
    document.getElementById('score').textContent = this.score; // Use textContent
}; 

// Add helper for decrementing lives (used by handleDeath)
Game.prototype.decrementLives = function() {
    // This function's logic is now directly inside handleDeath
    // Kept as placeholder if needed elsewhere, but handleDeath is simpler now.
    // this.lives -= 1;
    // $('#lives').html(this.lives);
    return this.lives;
};
