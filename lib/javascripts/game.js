if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Game = Asteroids.Game = function(width, height) {
  this.width = width;
  this.height = height;
  this.num_asteroids = 15;
  this.min_asteroid_speed = 1;
  this.asteroids = this.addInitialAsteroids();
  this.ship = new Asteroids.Ship({ pos: [this.width/2, this.height/2], game: this });
  this.ship_explosion = new Asteroids.ShipExplosion();
  this.asteroid_explosions = [];
  this.bullets = [];
  this.ufos = [];
  this.ufoBullets = [];
  this.gameOver = false
  $('.menu-btn').on('mouseup', this.setGameParamaters.bind(this));
  $('.new-game-btn').on('mouseup', this.newGame.bind(this));
};

Game.UFO_SPAWN_RATE = 0.002;

Game.prototype.setGameParamaters = function () {
  currentGame.level = parseInt($(event.currentTarget).data('level'));
  currentGame.ship.reanimateSelf();

  lives = 5;
  score = 0;
  Frame_Rate = 2;

  Radius_Reduction = 0.5;

  currentGame.min_asteroid_speed = 0.1 + (0.03 * currentGame.level);
  currentGame.num_asteroids = 8 + (currentGame.level * 2);
  $('#modal-screen').addClass('hide');

  currentGame.reset();
};

Game.prototype.reset = function () {
  this.asteroids = this.addInitialAsteroids();
  this.bullets = [];
  this.ufos = [];
  this.ufoBullets = [];
  this.ship.pos = [this.width/2, this.height/2];
  this.ship.vel = [0, 0];
  this.ship.angle = 90;
  this.ship.reanimateSelf();
};

Game.prototype.newGame = function () {
  $('#game-over').addClass('hide');
  $('#modal-screen').removeClass('hide');
  this.ship.suspendSelf();
  this.ufos = [];
  this.ufoBullets = [];
  score = 0;
  lives = 5;
  $('#score').html(score);
  $('#lives').html(lives);
};

Game.prototype.newLife = function () {
  this.ship.suspendSelf();
  lives -= 1;
  $('#lives').html(lives);
  if (lives <= 0) {
    this.ship_explosion.explode(function() {
      currentGame.gameOver = true;
      $('#game-over').removeClass('hide');
    }, this.ship.pos);
  } else {
    this.ship_explosion.explode(this.reset.bind(this), this.ship.pos);
  }
};

Game.prototype.addInitialAsteroids = function () {
  var new_asteroids = [];
  for (var i = 0; i < this.num_asteroids; i++) {
    var temp_asteroid = {
      pos: this.randomPosition(),
      min_speed: this.min_asteroid_speed,
      game: this
    };
    new_asteroids.push(new Asteroids.Asteroid(temp_asteroid));
  }

  return new_asteroids;
};

Game.prototype.randomPosition = function () {
  var pos = [];
  var that = this;
  var inCenter = function(x, y) {
    if (x > (that.width * 0.2) &&
        x < (that.width * 0.8) &&
        y > (that.height * 0.2) &&
        y < (that.height * 0.8)) {
      return true;
    } else {
      return false;
    }
  };
  pos[0] = Math.random() * this.width;
  pos[1] = Math.random() * this.height;
  for (var i = 0; inCenter(pos[0], pos[1]); i++) {
    pos[0] = Math.random() * this.width;
    pos[1] = Math.random() * this.height;
  }
  return pos;
};

Game.prototype.draw = function (ctx) {
  ctx.clearRect ( 0 , 0 , this.width, this.height );
  this.allObjects().forEach(function(el) {
    if (el && typeof el.draw === 'function') {
        el.draw(ctx);
    } else {
        console.error("Attempted to draw an object without a draw method:", el);
    }
  });
  this.asteroid_explosions.forEach(function(el) {
    el.draw(ctx);
  });
  this.ship_explosion.draw(ctx);
};

Game.prototype.moveObjects = function () {
  this.allObjects().forEach(function(el) {
    if (el && typeof el.move === 'function') {
      el.move();
    } else {
      console.error("Attempted to move an object without a move method:", el);
    }
  });
};

Game.prototype.wrap = function (pos, objRadius) {
  var startX = pos[0];
  var startY = pos[1];


  var x = (pos[0] % (this.width + objRadius*2));
  var y = (pos[1] % (this.height + objRadius*2));


  if (x !== startX) {
    x -= objRadius;
  }

  if (y !== startY) {
    y -= objRadius;
  }

  if (x < (-1 * objRadius)) {
    x = this.width + ((2 * objRadius) + x);
  }

  if (y < (-1 * objRadius)) {
    y = this.height + ((2 * objRadius) + y);
  }

  return [x,y];
};

Game.prototype.checkCollisions = function () {
  var allObjs = this.allObjects();
  for (var i = 0; i < allObjs.length; i++) {
    for (var j = i + 1; j < allObjs.length; j++) {
      var obj1 = allObjs[i];
      var obj2 = allObjs[j];

      if (obj1 && typeof obj1.isCollidedWith === 'function' &&
          obj2 && typeof obj2.isCollidedWith === 'function' &&
          obj1.isCollidedWith(obj2)) {
        if (typeof obj1.collideWith === 'function') {
            obj1.collideWith(obj2);
        } else {
            console.error("obj1 missing collideWith method", obj1);
        }
      }
    }
  }
};

Game.prototype.step = function () {
  this.moveObjects();
  this.checkCollisions();
  this.maybeAddUfo();
};

Game.prototype.remove = function (object) {
  var list, index = -1;

  if (object instanceof Asteroids.Asteroid) {
    list = this.asteroids;
  } else if (object instanceof Asteroids.Bullet) {
    list = this.bullets;
  } else if (object instanceof Asteroids.Ufo) {
    list = this.ufos;
  } else if (object instanceof Asteroids.UfoBullet) {
    list = this.ufoBullets;
  } else if (object instanceof Asteroids.AsteroidExplosion) {
     list = this.asteroid_explosions;
  } else {
    console.warn("Attempted to remove unknown object type:", object);
    return;
  }

  if (list) {
      index = list.indexOf(object);
  }

  if (index !== -1) {
    list.splice(index, 1);
  } else {
      if (!(object instanceof Asteroids.AsteroidExplosion)){
          console.warn("Attempted to remove object not found in its list:", object);
      }
  }
};

Game.prototype.add = function (obj) {
  if (obj instanceof Asteroids.Asteroid) {
    this.asteroids.push(obj);
  } else if (obj instanceof Asteroids.Bullet) {
    this.bullets.push(obj);
  } else if (obj instanceof Asteroids.Ufo) {
    this.ufos.push(obj);
  } else if (obj instanceof Asteroids.UfoBullet) {
    this.ufoBullets.push(obj);
  } else if (obj instanceof Asteroids.AsteroidExplosion) {
    this.asteroid_explosions.push(obj);
  } else {
      console.warn("Attempted to add unknown object type:", obj);
  }
};

Game.prototype.allObjects = function () {
  var objects = [].concat(this.bullets, this.asteroids, this.ufos, this.ufoBullets);
  if (this.ship) {
    objects.push(this.ship);
  }
  return objects;
};

Game.prototype.isOutOfBounds = function(pos, objRadius) {
  var x = pos[0];
  var y = pos[1];
  if (x > (this.width + objRadius) || x < (0 - objRadius)) {
    return true;
  } else if (y > (this.height + objRadius) || y < (0 - objRadius)) {
    return true;
  } else {
    return false;
  }
};

Game.prototype.maybeAddUfo = function () {
  if (Math.random() < Game.UFO_SPAWN_RATE) {
    var ufo = new Asteroids.Ufo({
      pos: this.randomPosition(),
      game: this
    });
    this.add(ufo);
  }
};
