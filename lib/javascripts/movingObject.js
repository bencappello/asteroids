if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}


Asteroids.movingObject = function(obj) {
  this.pos = obj.pos;
  this.vel = obj.vel;
  this.radius = obj.radius; 
  this.game = obj.game;
}

Asteroids.movingObject.prototype.isWrappable = true;

Asteroids.movingObject.prototype.move = function () {
  this.pos[0] += this.vel[0];
  this.pos[1] += this.vel[1];

  if (currentGame.isOutOfBounds(this.pos, this.radius) && !this.isWrappable) {
    return currentGame.remove(this);
  }
  this.pos = currentGame.wrap(this.pos, this.radius);
};


Asteroids.movingObject.prototype.isCollidedWith = function (otherObject) {
  var radii = this.radius + otherObject.radius;
  var xDist = this.pos[0] - otherObject.pos[0];
  var yDist = this.pos[1] - otherObject.pos[1];
  var distance = Math.sqrt(Math.pow(xDist,2) + Math.pow(yDist,2));
  return distance < radii;
};

Asteroids.movingObject.prototype.collideWith = function (otherObject) {
};
