console.log("Executing powerup.js..."); // Check if file runs

if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var PowerUp = Asteroids.PowerUp = function (obj) {
  obj.radius = PowerUp.RADIUS;
  obj.vel = Asteroids.Util.randomVec(PowerUp.SPEED); // Give it a slow random velocity
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/powerup.png';
  this.game = obj.game;
  this.lifespan = PowerUp.LIFESPAN * (1000 / (window.Frame_Rate || 30)); // Use window.Frame_Rate
};

console.log("Asteroids.PowerUp assigned:", typeof Asteroids.PowerUp); // Check type after assignment

Asteroids.Util.inherits(PowerUp, Asteroids.movingObject);

PowerUp.RADIUS = 50;
PowerUp.SPEED = 0.5; // Slower than UFOs
PowerUp.LIFESPAN = 10; // Seconds
PowerUp.DURATION = 10; // Seconds the power-up lasts for the ship

PowerUp.prototype.isWrappable = true;

PowerUp.prototype.draw = function (ctx) {
  ctx.drawImage(this.img, this.pos[0] - this.radius, this.pos[1] - this.radius, this.radius * 2, this.radius * 2);
};

PowerUp.prototype.move = function () {
  // Call the original move method
  Asteroids.movingObject.prototype.move.call(this);
  
  // Decrease lifespan
  this.lifespan -= 1;
  if (this.lifespan <= 0) {
    this.game.remove(this);
  }
};


PowerUp.prototype.collideWith = function (otherObject) {
  if (otherObject instanceof Asteroids.Ship) {
    // PowerUp hits the ship
    otherObject.activatePowerUp(PowerUp.DURATION);
    this.game.remove(this); // Remove the powerup after collection
  }
  // PowerUps ignore collisions with anything else
}; 