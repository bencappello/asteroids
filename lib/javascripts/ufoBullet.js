if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var UfoBullet = Asteroids.UfoBullet = function (obj) {
  obj.radius = UfoBullet.RADIUS;
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/ufo_bullet.png'; // Placeholder image path
  this.game = obj.game;
}

UfoBullet.RADIUS = 8;

Asteroids.Util.inherits(UfoBullet, Asteroids.movingObject);

UfoBullet.prototype.isWrappable = false;

UfoBullet.prototype.collideWith = function (otherObject) {
  // Check if colliding with an active (not suspended) ship
  if (otherObject instanceof Asteroids.Ship && !otherObject.suspended) {
    // A UFO bullet hitting the ship costs a life
    this.game.newLife(); 
    this.game.remove(this); // Remove the bullet after impact
  } 
  // UFO bullets currently ignore asteroids and player bullets
};

UfoBullet.prototype.draw = function (ctx) {
  ctx.drawImage(this.img,
    Math.floor(this.pos[0]-this.radius),
    Math.floor(this.pos[1]-this.radius),
    this.radius*2,
    this.radius*2
  );
}; 