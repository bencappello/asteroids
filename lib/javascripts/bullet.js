if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Bullet = Asteroids.Bullet = function (obj) {
  obj.radius = Bullet.RADIUS;
  obj.color = Bullet.COLOR;
  Asteroids.movingObject.call(this, obj);
  this.type = 'Bullet';
  this.isWrappable = false;
  this.img = new Image();
  this.img.src = 'lib/images/fireball.png';
}

Bullet.RADIUS = 5;
Bullet.COLOR = '#ff0000';

Asteroids.Util.inherits(Bullet, Asteroids.movingObject);

Asteroids.Bullet.prototype.collideWith = function (otherObject) {
  // --- DEBUG LOG --- 
  // console.log('[DEBUG] Bullet collideWith check: otherObject.type =', otherObject ? otherObject.type : 'undefined/null');
  // --- END DEBUG LOG ---

  if (otherObject.type === 'Asteroid') {
    // Create and add asteroid explosion FIRST
    var exp_obj = {
      pos: [otherObject.pos[0], otherObject.pos[1]],
      radius: otherObject.radius,
      game: this.game
    };
    var explosion = new Asteroids.AsteroidExplosion(exp_obj);
    this.game.add(explosion);
    explosion.explode();

    // Now remove objects and add score
    this.game.remove(otherObject);
    this.game.remove(this);
    this.game.score += 100;
    $('#score').html(this.game.score);

    // Split asteroid if large enough
    if (otherObject.radius >= 20) {
      var rad_reduc = (otherObject.radius <= 30) ? 0.7 : window.Asteroids.Game.LARGE_ASTEROID_RADIUS_REDUCTION;
      var asteroid_1_params = {
        pos: [otherObject.pos[0], otherObject.pos[1]],
        vel: Asteroids.Util.generateVec((otherObject.magnitude * 0.8), (otherObject.direction + 30)),
        radius: otherObject.radius * rad_reduc,
        min_speed: 0,
        game: this.game
      };
      var asteroid_2_params = {
        pos: [otherObject.pos[0], otherObject.pos[1]],
        vel: Asteroids.Util.generateVec((otherObject.magnitude * 0.8), (otherObject.direction - 30)),
        radius: otherObject.radius * rad_reduc,
        min_speed: 0,
        game: this.game
      };
      this.game.add(new Asteroids.Asteroid(asteroid_1_params));
      this.game.add(new Asteroids.Asteroid(asteroid_2_params));
    }
  } else if (otherObject.type === 'Ufo') {
    // Create and add UFO explosion FIRST
    var exp_obj = {
      pos: [otherObject.pos[0], otherObject.pos[1]],
      radius: otherObject.radius,
      game: this.game
    };
    var explosion = new Asteroids.AsteroidExplosion(exp_obj);
    this.game.add(explosion);
    explosion.explode();

    // Now remove objects and add score
    this.game.remove(otherObject);
    this.game.remove(this);
    this.game.score += 500;
    $('#score').html(this.game.score);
  }
};

Bullet.prototype.draw = function (ctx) {
  ctx.drawImage(this.img,
    Math.floor(this.pos[0]-this.radius),
    Math.floor(this.pos[1]-this.radius),
    this.radius*2,
    this.radius*2
  );
};

// Add CommonJS export for Node/Jest environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Bullet;
}
