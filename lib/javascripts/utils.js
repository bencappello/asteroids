if (typeof Asteroids === "undefined") {
  window.Asteroids = {};
}

if (typeof Asteroids.Util === "undefined") {
  window.Asteroids.Util = {};
}

Asteroids.Util.inherits = function (childClass, parentClass) {
  function Surrogate() {};
  Surrogate.prototype = parentClass.prototype;
  childClass.prototype = new Surrogate();
};

Asteroids.Util.sin = function(angle) {
  return Math.sin(angle * (Math.PI / 180));
};

Asteroids.Util.cos = function(angle) {
  return Math.cos(angle * (Math.PI / 180));
};

Asteroids.Util.toRadians = function(angle) {
  return angle * (Math.PI / 180);
};

Asteroids.Util.randCorner = function() {
  var corners = [
    [0,0],
    [currentGame.width, 0],
    [0, currentGame.height],
    [currentGame.width, currentGame.height]
  ];
  var randIdx = Math.floor(Math.random() * 4);
  return corners[randIdx];
};

Asteroids.Util.randomVec = function (length) {
  var deg = 2 * Math.PI * Math.random(); // Random angle in radians
  return Asteroids.Util.scale([Math.sin(deg), Math.cos(deg)], length);
};

Asteroids.Util.scale = function (vec, m) {
  return [vec[0] * m, vec[1] * m];
};

Asteroids.Util.generateVec = function(magnitude, angle) {
  var xVec = Asteroids.Util.sin(angle) * magnitude
  var yVec = Asteroids.Util.cos(angle) * magnitude

  return [xVec, yVec];
};

Asteroids.Util.repeat = function(callback, interval, repetitions, callback2) {
  var that = this;
  function repeater(repetitions) {
    if (repetitions >= 0) {
        callback.call();
        setTimeout(function () {
            repeater(--repetitions)
        }, interval)
    } else if (callback2) {
      callback2.call()
    }
  }
  setTimeout(function () {
    repeater(--repetitions)
  }, interval)
};
