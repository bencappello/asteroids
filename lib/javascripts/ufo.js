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
    // UFO hitting the ship harms the player
    this.game.newLife(); // Correctly call newLife, not relocate
    this.game.remove(this); // Remove the UFO
  } else if (otherObject instanceof Asteroids.Asteroid) {
    // UFO hitting an asteroid destroys both
    this.game.remove(this);
    this.game.remove(otherObject);
    // Optional: Add points? Add explosion effect?
  }
  // UFOs ignore collisions with bullets (player or UFO) and other UFOs for now
}; 