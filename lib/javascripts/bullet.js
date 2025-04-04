if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Bullet = Asteroids.Bullet = function (obj) {
  obj.radius = Bullet.RADIUS;
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/fireball.png';
}

Bullet.RADIUS = 5;

Asteroids.Util.inherits(Bullet, Asteroids.movingObject);

Bullet.prototype.isWrappable = false;

Asteroids.Bullet.prototype.collideWith = function (otherObject) {
  if (otherObject instanceof Asteroids.Asteroid) {
    this.game.add(explosion);
    this.game.remove(otherObject);
    this.game.remove(this);
    this.game.score += 100;
    $('#score').html(this.game.score);

    //split asteroid into 2
    if (otherObject.radius >= 20) {
      if (otherObject.radius <= 30) {
        var rad_reduc = 0.7;
      } else {
        var rad_reduc = Game.LARGE_ASTEROID_RADIUS_REDUCTION;
      }
      var asteroid_1 = {
        pos: [otherObject.pos[0], otherObject.pos[1]],
        vel: Asteroids.Util.generateVec((otherObject.magnitude * 0.8), (otherObject.direction + 30)),
        mag: otherObject.magnitude,
        rotation: otherObject.rotation,
        radius: otherObject.radius * rad_reduc,
        game: currentGame
      };
      var asteroid_2 = {
        pos: [otherObject.pos[0], otherObject.pos[1]],
        vel: Asteroids.Util.generateVec((otherObject.magnitude * 0.8), (otherObject.direction - 30)),
        mag: otherObject.magnitude,
        rotation: otherObject.rotation,
        radius: otherObject.radius * rad_reduc,
        game: currentGame
      };
      currentGame.add(new Asteroids.Asteroid(asteroid_1));
      currentGame.add(new Asteroids.Asteroid(asteroid_2));
    }

    // Create and add asteroid explosion
    var exp_obj = {
      pos: [otherObject.pos[0], otherObject.pos[1]],
      radius: otherObject.radius
    };
    var explosion = new Asteroids.AsteroidExplosion(exp_obj);
    currentGame.add(explosion);
    explosion.explode();

    currentGame.remove(otherObject);
    currentGame.remove(this);
  } else if (otherObject instanceof Asteroids.Ufo) {
    console.log("Bullet hit UFO");
    // Remove UFO and Bullet
    this.game.remove(otherObject);
    this.game.remove(this);
    // Award points
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
