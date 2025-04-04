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
  childClass.prototype.constructor = childClass;
};

Asteroids.Util.sin = function(angle) {
  return Math.sin(angle * (Math.PI / 180));
};

Asteroids.Util.cos = function(angle) {
  return Math.cos(angle * (Math.PI / 180));
};

Asteroids.Util.toRadians = function(deg) {
  return deg * (Math.PI / 180);
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

// High Score Constants
const HIGH_SCORE_KEY = 'asteroidsHighScores';
const MAX_HIGH_SCORES = 20;

// Load high scores from localStorage
Asteroids.Util.loadHighScores = function() {
    var highScores = [];
    try {
        var storedScores = localStorage.getItem(HIGH_SCORE_KEY);
        if (storedScores) {
            highScores = JSON.parse(storedScores);
        }

        // Check if the loaded scores are empty or null, and pre-populate if necessary
        if (!highScores || highScores.length === 0) {
            console.log("No high scores found. Pre-populating with defaults.");
            highScores = [
                { initials: "ACE", score: 5000 }, { initials: "TOP", score: 4500 },
                { initials: "PRO", score: 4000 }, { initials: "GAM", score: 3500 },
                { initials: "RKT", score: 3000 }, { initials: "ZAP", score: 2500 },
                { initials: "MAV", score: 2000 }, { initials: "DGR", score: 1750 },
                { initials: "JMP", score: 1500 }, { initials: "RUN", score: 1250 },
                { initials: "FLY", score: 1000 }, { initials: "SHO", score: 900 },
                { initials: "LAS", score: 800 }, { initials: "EXP", score: 700 },
                { initials: "WIN", score: 600 }, { initials: "HI",  score: 500 },
                { initials: "SCR", score: 450 }, { initials: "ARC", score: 400 },
                { initials: "RET", score: 350 }, { initials: "ROX", score: 300 },
            ];
            // Save the defaults back to storage
            Asteroids.Util.saveHighScores(highScores);
        }

    } catch (e) {
        console.error("Error loading high scores:", e);
        highScores = []; // Reset to empty on error
        // Optionally create defaults on error too?
    }
    return highScores;
};

// Save high scores to localStorage
Asteroids.Util.saveHighScores = function(scores) {
    if (!Array.isArray(scores)) {
        console.error("Attempted to save non-array as high scores");
        return;
    }
    // Ensure sort order before saving
    scores.sort((a, b) => b.score - a.score);
    // Trim to max length
    const scoresToSave = scores.slice(0, MAX_HIGH_SCORES);
    try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scoresToSave));
    } catch (e) {
        console.error("Error saving high scores to localStorage:", e);
    }
};

// Check if a score qualifies for the high score list
Asteroids.Util.isHighScore = function(score, highScores) {
    if (typeof score !== 'number' || score <= 0) return false;
    // Qualifies if list isn't full OR score is higher than the lowest score on the full list
    const lowestScore = highScores.length > 0 ? highScores[highScores.length - 1].score : 0;
    return highScores.length < MAX_HIGH_SCORES || score > lowestScore;
};

// Add a new high score
Asteroids.Util.addHighScore = function(initials, score, highScores) {
    if (typeof score !== 'number' || score <= 0 || typeof initials !== 'string' || initials.length === 0) return highScores; // Basic validation

    const newScore = { initials: initials.toUpperCase().substring(0, 3), score: score };
    highScores.push(newScore);
    // Sort descending
    highScores.sort((a, b) => b.score - a.score);
    // Trim excess scores (lowest ones)
    const updatedScores = highScores.slice(0, MAX_HIGH_SCORES);
    Asteroids.Util.saveHighScores(updatedScores);
    return updatedScores;
};

// Display high scores in a target HTML element
Asteroids.Util.displayHighScores = function(targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
        console.error(`High score target element '${targetElementId}' not found.`);
        return;
    }

    const highScores = Asteroids.Util.loadHighScores();
    let scoresHtml = '<h3>High Scores</h3>';

    if (highScores.length === 0) {
        scoresHtml += '<p>No scores yet!</p>';
    } else {
        // Split scores into two columns (max 10 per column)
        const scoresCol1 = highScores.slice(0, 10);
        const scoresCol2 = highScores.slice(10, 20);

        scoresHtml += '<div class="score-columns">'; // Container for columns

        // Column 1
        scoresHtml += '<ol class="score-column">';
        scoresCol1.forEach((scoreData, index) => {
            const initialsPadded = scoreData.initials.padEnd(3, ' ');
            // Rank starts at 1
            scoresHtml += `<li><span>${index + 1}.</span> ${initialsPadded} - ${scoreData.score}</li>`;
        });
        scoresHtml += '</ol>';

        // Column 2 (only if there are scores for it)
        if (scoresCol2.length > 0) {
            scoresHtml += '<ol class="score-column">';
            scoresCol2.forEach((scoreData, index) => {
                const initialsPadded = scoreData.initials.padEnd(3, ' ');
                // Rank continues from 11
                scoresHtml += `<li><span>${index + 11}.</span> ${initialsPadded} - ${scoreData.score}</li>`;
            });
            scoresHtml += '</ol>';
        }

        scoresHtml += '</div>'; // Close columns container
    }

    targetElement.innerHTML = scoresHtml;
};
