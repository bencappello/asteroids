if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

var GameView = Asteroids.GameView = function(ctx) {
  this.ctx = ctx;
  this.intervalID = null; // Initialize interval ID
};

GameView.prototype.start = function() {
  console.log("Starting MAIN game loop");
  this.bindKeyHandlers();
  var gameCycle = function() {
    this.assessKeys();
    currentGame.draw(this.ctx);
    currentGame.step();
  };
  if (this.intervalID) {
    clearInterval(this.intervalID);
    this.intervalID = null;
  }
  this.intervalID = setInterval(gameCycle.bind(this), Frame_Rate);
};

GameView.prototype.startAttractModeLoop = function() {
    console.log("Starting ATTRACT MODE loop");
    var attractCycle = function() {
        currentGame.draw(this.ctx);
        currentGame.step();
    };
    if (this.intervalID) {
        clearInterval(this.intervalID);
    }
    this.intervalID = setInterval(attractCycle.bind(this), Frame_Rate);
};

GameView.prototype.stopLoop = function() {
    if (this.intervalID) {
        console.log("Stopping loop interval ID:", this.intervalID);
        clearInterval(this.intervalID);
        this.intervalID = null;
    }
};

GameView.prototype.bindKeyHandlers = function() {
  this.keyState = {};
  var that = this
  this.downKeyState = function(e) {
      that.keyState[e.keyCode || e.which] = true;
  }
  this.upKeyState = function(e) {
      that.keyState[e.keyCode || e.which] = false;
  }
  var ship = currentGame.ship;
  this.shipFire = _.throttle(ship.fireBullet.bind(ship), 150, {trailing: false});
};

GameView.prototype.assessKeys = function() {
  if (currentGame.preLevelState) return;

  //up
  if (this.keyState[38]) {
    currentGame.ship.power(-1);
  }
  //down
  if (this.keyState[40]) {
    currentGame.ship.power(1);
  }
  //left
  if (this.keyState[37]) {
    currentGame.ship.rotate(-1);
  }
  //right
  if (this.keyState[39]) {
    currentGame.ship.rotate(1);
  }
  //space
  if (this.keyState[32]) {
    this.shipFire();
  }
};
