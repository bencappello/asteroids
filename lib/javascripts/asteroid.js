if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Asteroid = Asteroids.Asteroid = function (obj) {
  this.direction = Math.floor(Math.random() * 360);
  this.magnitude = obj.mag || Math.random() * 0.8 + obj.min_speed;
  obj.vel = obj.vel || Asteroids.Util.generateVec(this.magnitude, this.direction);
  obj.radius = obj.radius || Math.floor((Math.random() * 30) + 20);
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/asteroid.png';
  this.rotation = obj.rotation || Math.random() * 0.04;
  this.angleInRadians = 0;
};

Asteroids.Util.inherits(Asteroids.Asteroid, Asteroids.movingObject);

Asteroid.prototype.collideWith = function (otherObject) {
  if (otherObject instanceof Asteroids.Ship && !otherObject.suspended) {
    if (!otherObject.isInvincible) {
      console.log("Ship hit by asteroid. Calling handleDeath.");
      this.game.handleDeath();
    } else {
      console.log("Ship hit by asteroid but is invincible.");
    }
  }
};

Asteroid.prototype.draw = function (ctx) {
  //rotaion code:
  //temporarily resets the asteroid's current position as the context
  //origin in order to have the whole ctx rotate around that point
  ctx.save();
  ctx.translate(this.pos[0], this.pos[1]);
  this.angleInRadians += this.rotation
  ctx.rotate(this.angleInRadians);

  //draws image at the center point of the screen since
  //that was temporarily reset as the ctx origin point
  ctx.drawImage(this.img, 0 - this.radius, 0 - this.radius, this.radius*2, this.radius*2);

  //then resets the context origin to the top left corner of the screen
  //after the asteroid is drawn
  ctx.restore();
};
