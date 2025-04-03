if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Asteroid = Asteroids.Asteroid = function (obj) {
  this.direction = Math.floor(Math.random() * 360);
  this.magnitude = obj.mag || Math.random() * 0.8 + obj.min_speed;
  obj.vel = obj.vel || Asteroids.Util.generateVec(this.magnitude, this.direction);
  obj.radius = obj.radius || Math.floor((Math.random() * 30) + 20);
  Asteroids.movingObject.call(this, obj);
  this.game = obj.game;
  this.img = new Image();
  this.img.src = 'lib/images/asteroid.png';
  this.rotation = obj.rotation || Math.random() * 0.04;
  this.angleInRadians = 0;
};

Asteroids.Util.inherits(Asteroids.Asteroid, Asteroids.movingObject);

Asteroid.prototype.collideWith = function (otherObject) {
  if (otherObject instanceof Asteroids.Ship) {
    if (otherObject.invulnerable()) {
      return;
    }
    otherObject.hitByAsteroid();
    this.explode();
    this.game.remove(this);
  } else if (otherObject instanceof Asteroids.Bullet) {
    var points = 0;
    switch(this.size) {
    case "medium":
      points = 20;
      break;
    case "small":
      points = 50;
      break;
    case "large":
      points = 10;
      this.split();
      break;
    default:
      break;
    }
    if (points > 0) {
      this.game.incrementScore(points);
      this.game.remove(otherObject);
      this.explode();
      this.game.remove(this);
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

Asteroid.prototype.explode = function () {
  // Implementation of explode method
};

Asteroid.prototype.split = function () {
  // Implementation of split method
};
