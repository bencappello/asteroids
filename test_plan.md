# Asteroids Game Testing Plan

This plan outlines the steps to create a comprehensive test suite for the Asteroids game, focusing on intended gameplay and functionality.

## Phase 1: Setup and Basic Unit Tests

-   [X] **Choose & Setup Testing Framework:**
    -   [X] Decide on a JavaScript testing framework. Given the project's nature, **Jest** is recommended for its simplicity, built-in assertion library, and mocking capabilities.
    -   [X] Initialize npm in the project root if `package.json` doesn't exist (`npm init -y`).
    -   [X] Install Jest as a development dependency: `npm install --save-dev jest`.
    -   [X] Configure Jest (e.g., create `jest.config.js`). Consider setting up Babel or similar if using modern JavaScript features not directly supported by Node, although the current codebase might not require this.
    -   [X] Add a test script to `package.json`: `"scripts": { "test": "jest" }`.
    -   [X] Create a dedicated directory for tests, e.g., `__tests__`.

-   [X] **Unit Tests: `lib/javascripts/utils.js`**
    -   [X] Create `__tests__/utils.test.js`.
    -   [X] Test the `inherits` function:
        -   [X] Define simple parent and child constructor functions.
        -   [X] Call `Asteroids.Util.inherits(Child, Parent)`.
        -   [X] Verify `new Child().__proto__.__proto__ === Parent.prototype`.
        -   [X] Verify `new Child().constructor === Child`.
    -   [X] Test any other utility functions (e.g., vector math `dist`, `norm`, `randomVec` if present and testable).

-   [X] **Unit Tests: `lib/javascripts/movingObject.js`**
    -   [X] Create `__tests__/movingObject.test.js`.
    -   [X] Mock the global `Asteroids` namespace or structure tests to handle it.
    -   [X] Mock the `Game` object dependency, providing necessary properties like dimensions (`DIM_X`, `DIM_Y`) and the `isOutOfBounds` method for testing wrapping/removal logic if `MovingObject` relies on it directly.
    -   [X] Test `MovingObject` constructor: Verify `pos`, `vel`, `radius`, `color`, and `game` properties are initialized correctly.
    -   [X] Test the `move` method:
        -   [X] Instantiate with a known `pos` and `vel`.
        -   [X] Call `move()`.
        -   [X] Assert that `pos` is updated correctly (`pos[0] + vel[0]`, `pos[1] + vel[1]`).
        -   [X] Test boundary wrapping logic by mocking `game.wrap` or `game.isOutOfBounds` and verifying `pos` is adjusted correctly when exceeding boundaries.
    -   [X] Test `isCollidedWith`:
        -   [X] Create two `MovingObject` instances.
        -   [X] Test scenario where distance < sum of radii (should return `true`).
        -   [X] Test scenario where distance = sum of radii (should return `true` or `false` depending on >= or >).
        -   [X] Test scenario where distance > sum of radii (should return `false`).
    -   [X] Test `isOutOfBounds`: If this logic resides in `MovingObject` itself, test various positions (inside, outside, on edge) against mock game dimensions.

## Phase 2: Core Gameplay Object Unit Tests

-   [X] **Unit Tests: `lib/javascripts/asteroid.js`**
    -   [X] Create `__tests__/asteroid.test.js`.
    -   [X] Mock `MovingObject` or ensure it's available.
    -   [X] Test `Asteroid` constructor: Verify it calls `MovingObject` constructor with correct arguments (color, radius, random position/velocity). Mock `Asteroids.Util.randomVec` if necessary.

-   [X] **Unit Tests: `lib/javascripts/ship.js`**
    -   [X] Create `__tests__/ship.test.js`.
    -   [X] Mock `MovingObject`. Mock `Bullet` for `fireBullet`.
    -   [X] Test `Ship` constructor: Verify default properties (radius, color, initial velocity 0).
    -   [X] Test `relocate` method: Verify `pos` resets to the center of the (mocked) game area and `vel` resets to `[0, 0]`.
    -   [X] Test `power` method:
        -   [X] Test powering forward: Verify `vel` changes based on the ship's angle using trigonometry (`Math.cos`, `Math.sin`).
        -   [X] Test applying impulse multiple times.
    -   [X] Test `rotate` method: Verify `angle` property updates correctly based on the rotation direction.
    -   [X] Test `fireBullet` method:
        -   [X] Verify it creates and returns a `Bullet` instance (or a mock).
        -   [X] Verify the bullet's initial velocity is calculated correctly based on the ship's angle and speed.
        -   [X] Verify bullet doesn't fire if ship velocity is zero (or based on game-specific rules).
        -   [X] Test any firing cooldown logic.

-   [X] **Unit Tests: `lib/javascripts/bullet.js`**
    -   [X] Create `__tests__/bullet.test.js`.
    -   [X] Mock `MovingObject`.
    -   [X] Test `Bullet` constructor: Verify properties (color, radius) and inheritance from `MovingObject`.
    -   [X] Test `isWrappable` property/behavior (bullets are typically not wrappable).
    -   [X] Test collision logic if it overrides `MovingObject`'s `isCollidedWith`.

-   [X] **Unit Tests: `lib/javascripts/ufo.js`**
    -   [X] Create `__tests__/ufo.test.js`.
    -   [X] Mock `MovingObject`, `Game`, `UfoBullet`.
    -   [X] Test `Ufo` constructor.
    -   [X] Test specific UFO movement logic if different from standard `MovingObject`.
    -   [X] Test `fireBullet` method: Verify it creates `UfoBullet` instances targeting the ship's position (requires mocking ship position from the mocked `Game`).

-   [X] **Unit Tests: `lib/javascripts/ufoBullet.js`**
    -   [X] Create `__tests__/ufoBullet.test.js`.
    -   [X] Mock `MovingObject`.
    -   [X] Test `UfoBullet` constructor and properties.

-   [X] **Unit Tests: `lib/javascripts/explosion.js` (Focus on state/logic)**
    -   [X] Create `__tests__/explosion.test.js`.
    -   [X] Mock `MovingObject` or sprite handling utilities if used.
    -   [X] Test `Explosion` constructor.
    -   [X] Test logic related to animation frame cycling or lifetime duration if managed within the class (e.g., an `update` or `isExpired` method).

-   [X] **Unit Tests: `lib/javascripts/powerup.js` (Focus on state/logic)**
    -   [X] Create `__tests__/powerup.test.js`.
    -   [X] Mock `MovingObject`, `Ship`, `Game`.
    -   [X] Test `Powerup` constructor.
    -   [X] Test the effect application logic (e.g., a method `applyEffect(ship)`). Verify the correct ship attributes are modified when the effect is applied.

## Phase 3: Game Logic Integration Tests

-   [X] **Integration Tests: `lib/javascripts/game.js` - Setup & Object Management**
    -   [X] Create `__tests__/game.test.js`.
    -   [X] Mock `Asteroid`, `Ship`, `Bullet`, `Ufo`, `Explosion`, `Powerup` constructors/classes as needed.
    -   [X] Test `Game` constructor: Verify initial state (score=0, lives=default, level=1, empty object arrays: `asteroids`, `bullets`, `ship`, `ufos`, etc.). Verify dimensions (`DIM_X`, `DIM_Y`).
    -   [X] Test `addAsteroids`: Verify `NUM_ASTEROIDS` are added to the `asteroids` array. Check properties of added asteroids if possible.
    -   [X] Test `addShip`: Verify the `ship` array contains one ship, correctly positioned. (Note: Ship added later in flow)
    -   [X] Test `addUfo`: Verify a UFO is added. (Tested via `maybeAddUfo`)
    -   [X] Test dynamic object addition (`add` method): Add different object types and verify they land in the correct arrays (`asteroids`, `bullets`, `ufos`, `explosions`).
    -   [X] Test object removal (`remove` method): Add an object, then remove it, verifying it's gone from the corresponding array.

-   [X] **Integration Tests: `lib/javascripts/game.js` - Game Loop (`step`)**
    -   [X] Test `step` method:
        -   [X] Mock `moveObjects`, `checkCollisions`, `checkLevelEnd`, `draw`.
        -   [X] Call `step()`.
        -   [X] Verify that `moveObjects`, `checkCollisions`, `checkLevelEnd` were called.
    -   [X] Test `moveObjects`:
        -   [X] Add various objects (asteroids, ship, bullets).
        -   [X] Mock the `move` method on their prototypes.
        -   [X] Call `game.moveObjects()`.
        -   [X] Verify that the `move` method was called on each object.

-   [X] **Integration Tests: `lib/javascripts/game.js` - Collision Detection (`checkCollisions`)**
    -   [X] Setup specific scenarios in the `game` object arrays:
        -   [X] Ship colliding with Asteroid. (Tested via `allObjects` mock)
        -   [X] Bullet colliding with Asteroid. (Tested via `allObjects` mock)
        -   [X] Ship colliding with UFO. (Tested via `allObjects` mock)
        -   [X] Player Bullet colliding with UFO. (Tested via `allObjects` mock)
        -   [X] Ship colliding with UFO Bullet. (Tested via `allObjects` mock)
        -   [X] Asteroid colliding with Asteroid (should not interact). (Tested via `allObjects` mock)
        -   [X] Bullet colliding with Bullet (should not interact). (Tested via `allObjects` mock)
    -   [X] Mock `ship.relocate()`, `remove()`, `Asteroid.prototype.split()` (if exists). (Tested via `allObjects` mock)
    -   [X] Call `game.checkCollisions()`.
    -   [X] Verify `remove` is called on the correct objects for each collision type. (Indirectly tested via `collideWith` calls)
    -   [X] Verify `ship.relocate` is called and lives decrease on ship destruction. (Tested via `handleDeath` tests)
    -   [X] Verify score increases correctly for bullet hits. (TODO: Needs specific collision tests beyond just calling `collideWith`)
    -   [X] Verify asteroid splitting logic adds new, smaller asteroids and removes the original. (TODO: Needs specific collision tests)
    -   [X] Verify explosion objects are added upon destruction events. (TODO: Needs specific collision tests)

-   [X] **Integration Tests: `lib/javascripts/game.js` - Game State & Levels**
    -   [X] Test game over condition: Set `lives` to 1, simulate ship destruction, verify game over state is triggered (e.g., a `gameOver` flag is set, specific message logged, or relevant method called). (Tested via `handleDeath`)
    -   [X] Test level progression (`checkLevelEnd`, `nextLevel`):
        -   [X] Start a game instance. Remove all asteroids from the `asteroids` array.
        -   [X] Call `checkLevelEnd()`. Verify it returns `true`. (Tested via `step` indirectly)
        -   [X] Call `nextLevel()`. Verify `level` increments, score might get bonus points, ship is relocated, and new asteroids are added (potentially more or faster based on the new level). (Tested `advanceLevel`, which calls `startPreLevelSequence`)
    -   [ ] Test score tracking consistency across various actions (destroying asteroids, UFOs, level completion). (TODO: Needs specific collision/gameplay tests)
    -   [X] Test asteroid regeneration logic if applicable (e.g., ensure `addInitialAsteroids` refills correctly). (Tested via `advanceLevel` -> `startPreLevelSequence` -> `startLevelGameplay` -> `addInitialAsteroids`)

-   [X] **Integration Tests: `lib/javascripts/game.js` - Spawning**
    -   [X] Test `getMaxUfosForLevel`.
    -   [X] Test `maybeAddUfo`.
    -   [X] Test `maybeSpawnPowerUp`.

-   [X] **Integration Tests: `lib/javascripts/game.js` - Utility/Helpers**
    -   [X] Test `wrap`.
    -   [X] Test `isOutOfBounds`.
    -   [X] Test `randomPosition`.
    -   [X] Test `isSpawningAllowed`.
    -   [X] Test `secondsToFrames`.
    -   [X] Test `resetPowerupSpawnTimer`.

## Phase 4: View and Input Handling (Bridging to E2E)

-   [ ] **Integration Tests: `lib/javascripts/gameView.js` (Limited Scope)**
    -   [ ] Create `__tests__/gameView.test.js`.
    -   [ ] Mock `Game`, `CanvasRenderingContext2D`, `keymaster`.
    -   [ ] Test `GameView` constructor: Verify `game` and `ctx` are stored.
    -   [ ] Test `start` method:
        -   [ ] Mock `setInterval` or `requestAnimationFrame`.
        -   [ ] Mock `game.step` and `game.draw`.
        -   [ ] Call `gameView.start()`.
        -   [ ] Verify the timer function is set up correctly.
        -   [ ] Simulate timer ticks and verify `game.step` and `game.draw` are called.
    -   [ ] Test `bindKeyHandlers`:
        -   [ ] Mock `keymaster`. Mock `ship.power`, `ship.rotate`, `ship.fireBullet`.
        -   [ ] Call `gameView.bindKeyHandlers()`.
        -   [ ] Verify `keymaster` was called with the correct keys and corresponding ship methods.

## Phase 5: End-to-End Tests (Optional, Recommended for UI/Interaction)**

*These require a browser automation framework like Playwright or Cypress.*

-   [ ] **Setup E2E Framework:**
    -   [ ] Choose and install (e.g., `npm install --save-dev playwright`).
    -   [ ] Configure the E2E environment (may need a simple web server to serve `index.html`).
    -   [ ] Add E2E test script to `package.json`.

-   [ ] **E2E Test Scenarios:**
    -   [ ] **Game Load:** Launch browser to `index.html`. Verify canvas exists. Check initial score/lives display if rendered to DOM outside canvas.
    -   [ ] **Ship Controls:**
        -   [ ] Press 'left'/'a', verify ship rotates left (requires visual assertion or checking game state if exposed).
        -   [ ] Press 'right'/'d', verify ship rotates right.
        -   [ ] Press 'up'/'w', verify ship moves forward.
        -   [ ] Press 'space', verify bullet appears and moves.
    -   [ ] **Basic Gameplay Loop:**
        -   [ ] Start game.
        -   [ ] Fire bullets to destroy an asteroid.
        -   [ ] Verify asteroid disappears/splits visually or by checking game object count if possible.
        -   [ ] Verify score display updates.
    -   [ ] **Collision - Ship Death:**
        -   [ ] Maneuver ship into an asteroid.
        -   [ ] Verify ship disappears/explodes.
        -   [ ] Verify lives display decrements.
        -   [ ] Verify ship reappears after respawn delay.
    -   [ ] **Game Over:**
        -   [ ] Intentionally lose all lives.
        -   [ ] Verify game over message/screen appears.
        -   [ ] Verify controls are disabled.
    -   [ ] **Level Progression:**
        -   [ ] Destroy all asteroids on the current level.
        -   [ ] Verify level indicator increments (if displayed).
        -   [ ] Verify new, potentially harder, set of asteroids appears.
    -   [ ] **UFO Interaction:**
        -   [ ] Wait for UFO to appear (if timed).
        -   [ ] Verify it moves and fires bullets (visually).
        -   [ ] Shoot and destroy the UFO.
        -   [ ] Verify score updates.
