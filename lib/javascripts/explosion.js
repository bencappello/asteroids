if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

//Ship Explosion

var ShipExplosion = Asteroids.ShipExplosion = function () {
  this.pos = [0, 0];
  this.radius = 30;
  this.img = new Image();
  this.img.src = 'lib/images/ship_exp_sprite.png';
  this.img_obj = {
    'total_frames': 25,
    'width': 4800,
    'height': 195,
  };
  this.frame = this.img_obj.total_frames + 1;
};

ShipExplosion.prototype.explode = function (callback, pos) {
  var increase_frame = function() {
    this.frame += 1;
  };
  this.frame = 1;
  this.pos[0] = pos[0] - (currentGame.ship.radius*1.5);
  this.pos[1] = pos[1] - (currentGame.ship.radius*1.5);
  Asteroids.Util.repeat(
    increase_frame.bind(this),
    60,
    this.img_obj.total_frames,
    callback
  );
};

ShipExplosion.prototype.draw = function (ctx) {
  if (this.frame > this.img_obj.total_frames) {
    return;
  }
  var xCanvas = Math.floor(this.pos[0]);
  var yCanvas = Math.floor(this.pos[1]);
  var drawnWidth = this.radius * 2;
  var drawnHeight = this.radius * 2;
  var spriteWidth = this.img_obj.width / this.img_obj.total_frames;
  var spriteHeight = this.img_obj.height;
  var spriteX = spriteWidth * (this.frame - 1);
  var spriteY = 0;

  ctx.drawImage(this.img, spriteX, spriteY, spriteWidth, spriteHeight,
    xCanvas, yCanvas, drawnWidth, drawnHeight);
};


//Asteroid Explosion

var AsteroidExplosion = Asteroids.AsteroidExplosion = function (obj) {
  this.pos = obj.pos;
  this.radius = obj.radius || 30;
  this.img = new Image();
  this.img.src = 'lib/images/ast_exp_sprite.png';
  this.img_obj = {
    'total_frames': 40,
    'frames_per_row': 10,
    'rows': 4,
    'width': 930,
    'height': 400,
  };
  this.frame = this.img_obj.total_frames + 1;
};

AsteroidExplosion.prototype.explode = function (pos) {
  var increase_frame = function() {
    this.frame += 1;
  };
  var removeThis = function() {
    currentGame.remove(this);
  };
  this.frame = 1;
  this.pos[0] -= this.radius;
  this.pos[1] -= this.radius;
  Asteroids.Util.repeat(
    increase_frame.bind(this),
    40,
    this.img_obj.total_frames,
    removeThis.bind(this)
  );
};

AsteroidExplosion.prototype.draw = function (ctx) {
  if (this.frame > this.img_obj.total_frames) {
    return
  }
  var xCanvas = Math.floor(this.pos[0]);
  var yCanvas = Math.floor(this.pos[1]);
  var drawnWidth = this.radius * 2;
  var drawnHeight = this.radius * 2;
  var spriteWidth = this.img_obj.width / this.img_obj.frames_per_row;
  var spriteHeight = this.img_obj.height / this.img_obj.rows;
  var spriteX = spriteWidth * ((this.frame - 1) % this.img_obj.frames_per_row);
  var spriteY = spriteHeight * Math.floor((this.frame - 1) / this.img_obj.frames_per_row);

  ctx.drawImage(this.img, spriteX, spriteY, spriteWidth, spriteHeight,
    xCanvas, yCanvas, drawnWidth, drawnHeight);
};

// Add CommonJS export for Node/Jest environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ShipExplosion: ShipExplosion,
    AsteroidExplosion: AsteroidExplosion
  };
}
