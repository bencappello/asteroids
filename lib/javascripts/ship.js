if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var Ship = Asteroids.Ship = function (obj) {
  obj.radius = Ship.RADIUS;
  obj.vel = [0,0];
  Asteroids.movingObject.call(this, obj);
  this.img = new Image();
  this.img.src = 'lib/images/directional_ship.png';
  this.angle = 90;
  this.suspended = true;
  this.game = obj.game; // Store game reference if not already done

  // Power-up state
  this.isPoweredUp = false;
  this.powerUpTimer = 0;
};

Asteroids.Util.inherits(Ship, Asteroids.movingObject);
Ship.RADIUS = 20;
Ship.BULLET_SPEED = 3;
Ship.POWERUP_ANGLE_OFFSET = 15; // Angle offset for side bullets in degrees

Ship.prototype.rotate = function (direction) {
  this.angle += direction * 2;
};

Ship.prototype.power = function (direction) {
  var xVector = Asteroids.Util.cos(this.angle) * direction * 0.01;
  var yVector = Asteroids.Util.sin(this.angle) * direction * 0.01;
  this.vel[0] += xVector;
  this.vel[1] += yVector;
};

Ship.prototype.fireBullet = function () {
  if (this.suspended) return; // Don't fire if suspended

  var bulletSpeed = Ship.BULLET_SPEED;

  // Helper function to create a bullet with velocity based on angle
  var createBulletAtAngle = (angle) => {
    var xVel = Asteroids.Util.cos(angle) * bulletSpeed * -1; // Replicate original bullet logic (incl. -1)
    var yVel = Asteroids.Util.sin(angle) * bulletSpeed * -1;
    return new Asteroids.Bullet({
      pos: [this.pos[0], this.pos[1]],
      vel: [xVel, yVel],
      game: this.game 
    });
  };

  // Central bullet (always fired)
  this.game.add(createBulletAtAngle(this.angle));

  // Side bullets (only if powered up)
  if (this.isPoweredUp) {
    var leftAngle = this.angle - Ship.POWERUP_ANGLE_OFFSET;
    var rightAngle = this.angle + Ship.POWERUP_ANGLE_OFFSET;

    this.game.add(createBulletAtAngle(leftAngle));
    this.game.add(createBulletAtAngle(rightAngle));
  }
};

Ship.prototype.activatePowerUp = function (durationSeconds) {
    this.isPoweredUp = true;
    // Calculate duration in frames (approximate)
    this.powerUpTimer = durationSeconds * (1000 / (Frame_Rate || 30)); 
    console.log("Power-up activated! Duration frames:", this.powerUpTimer);
};

// Override move to include power-up timer decrement
Ship.prototype.move = function () {
    // Call original move
    Asteroids.movingObject.prototype.move.call(this);

    // Decrement power-up timer if active
    if (this.isPoweredUp) {
        this.powerUpTimer -= 1;
        if (this.powerUpTimer <= 0) {
            this.isPoweredUp = false;
            this.powerUpTimer = 0;
            console.log("Power-up expired.");
        }
    }
};

Ship.prototype.suspendSelf = function () {
  window.removeEventListener("keydown", gameView.downKeyState, true);
  window.removeEventListener("keyup", gameView.upKeyState, true);
  gameView.keyState = {};
  this.suspended = true;
};

Ship.prototype.reanimateSelf = function () {
  window.addEventListener('keydown', gameView.downKeyState, true);
  window.addEventListener('keyup', gameView.upKeyState, true);
  this.suspended = false;
};

Ship.prototype.draw = function (ctx) {

  if (!this.suspended) {
    //rotaion code:
    //temporarily resets the ship's current position as the context
    //origin in order to have the whole ctx rotate around that point
    ctx.save();

    ctx.translate(this.pos[0], this.pos[1]);
    ctx.rotate(Asteroids.Util.toRadians(this.angle));

    //draws image at the center point of the screen since
    //that was temporarily reset as the ctx origin point
    ctx.drawImage(this.img, 0 - this.radius, 0 - this.radius, this.radius*2, this.radius*2);

    //then resets the context origin to the top left corner of the screen
    //after the ship is drawn
    ctx.restore();
  }
};
