if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Ufo = Asteroids.Ufo = function (obj) {
  obj.radius = Ufo.RADIUS;
  obj.vel = obj.vel || Asteroids.Util.randomVec(Ufo.SPEED); // Give it a random initial velocity
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/ufo.png'; // Placeholder image path
  this.game = obj.game; // Store reference to the game
};

Asteroids.Util.inherits(Ufo, Asteroids.movingObject);

Ufo.RADIUS = 25;
Ufo.SPEED = 0.5; // Reduced speed
Ufo.BULLET_SPEED = 0.5; // Reduced bullet speed (half of ship's bullet speed)
Ufo.FIRE_RATE = 0.002; // Reduced firing rate (approx 1/sec with 2ms frame interval)

Ufo.prototype.draw = function (ctx) {
  ctx.drawImage(this.img, this.pos[0] - this.radius, this.pos[1] - this.radius, this.radius * 2, this.radius * 2);
};

// Override move to add firing logic
Ufo.prototype.move = function () {
  // Call the original move method
  Asteroids.movingObject.prototype.move.call(this);

  // Randomly decide to fire
  if (Math.random() < Ufo.FIRE_RATE) {
    this.fireBullet();
  }
};

Ufo.prototype.fireBullet = function () {
  // Basic firing logic: shoot straight down for now
  var bulletVel = [0, Ufo.BULLET_SPEED]; // Reduced bullet speed (half of ship's bullet speed)
  var bulletPos = [this.pos[0], this.pos[1]]; // Start at UFO's center

  var new_bullet = new Asteroids.UfoBullet({
    pos: bulletPos,
    vel: bulletVel,
    game: this.game
  });

  this.game.add(new_bullet);
};

// UFOs are removed when hit, not wrapped
Ufo.prototype.isWrappable = true;

// Collision handling
Ufo.prototype.collideWith = function (otherObject) {
  // Check if colliding with an active (not suspended) ship
  if (otherObject instanceof Asteroids.Ship && !otherObject.suspended) {
    // Check if ship is vulnerable before triggering death
    if (!otherObject.isInvincible) {
      console.log("Ship hit by UFO. Calling handleDeath.");
      this.game.handleDeath(); // CHANGED FROM newLife
      // Optionally remove UFO on collision with ship?
      // this.game.remove(this);
    } else {
      console.log("Ship hit by UFO but is invincible.");
    }
  } else if (otherObject instanceof Asteroids.Asteroid) {
    // UFO hitting an asteroid destroys both
    var explosion = new Asteroids.AsteroidExplosion({ pos: this.pos, radius: this.radius });
    this.game.add(explosion);
    explosion.explode();
    this.game.remove(this);
    this.game.remove(otherObject);
    // Optional: Add points?
  } else if (otherObject instanceof Asteroids.Bullet) {
    // UFO hit by player bullet
    var explosion = new Asteroids.AsteroidExplosion({ pos: this.pos, radius: this.radius });
    this.game.add(explosion);
    explosion.explode();
    this.game.remove(this);       // Remove UFO
    this.game.remove(otherObject); // Remove bullet
    // Optional: Add points?
  }
  // UFOs ignore collisions with UFO bullets and other UFOs for now
}; 