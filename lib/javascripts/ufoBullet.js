if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var UfoBullet = Asteroids.UfoBullet = function (obj) {
  obj.radius = UfoBullet.RADIUS;
  obj.color = '#ffff00'; // Yellow for UFO bullets
  Asteroids.movingObject.call(this, obj);
  this.type = 'UfoBullet'; // Add type
  this.img = new Image();
  this.img.src = 'lib/images/ufo_bullet.png'; // Placeholder image path
  this.game = obj.game;
}

UfoBullet.RADIUS = 8;

Asteroids.Util.inherits(UfoBullet, Asteroids.movingObject);

UfoBullet.prototype.isWrappable = false;

UfoBullet.prototype.collideWith = function (otherObject) {
  if (otherObject.type === 'Ship') {
    // Check if ship is vulnerable before triggering death
    if (!otherObject.isInvincible && !otherObject.suspended) {
      console.log("Ship hit by UFO bullet. Calling handleDeath.");
      this.game.handleDeath(); // CHANGED FROM newLife
      this.game.remove(this); // Remove bullet after hit
    } else {
      console.log("Ship hit by UFO bullet but is invincible or suspended.");
      this.game.remove(this); // Remove bullet even if invincible/suspended
    }
  }
  // UFO bullets do not interact with Asteroids or other Bullets or UFOs or PowerUps
};

UfoBullet.prototype.draw = function (ctx) {
  ctx.drawImage(this.img,
    Math.floor(this.pos[0]-this.radius),
    Math.floor(this.pos[1]-this.radius),
    this.radius*2,
    this.radius*2
  );
};

// Add CommonJS export for Node/Jest environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UfoBullet;
} 