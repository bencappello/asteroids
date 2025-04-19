// __tests__/game.test.js

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log; // Save original console.log

describe('Asteroids.Game', () => {
    let game;
    let GameRef; // Variable to hold the Game constructor/namespace
    let MockShipExplosion;
    let MockShip;
    let MockAsteroid;
    let MockBullet; // Player bullet
    let MockUfo;
    let MockUfoBullet;
    let MockAsteroidExplosion;
    let MockPowerUp;
    let mockJQuery;
    let MockUtil;
    let MockGameView;
    let originalGameView;

    // Define jQuery mock objects at the suite level for accessibility
    const mockJQueryFoundMethods = {
        length: 1, html: jest.fn(), addClass: jest.fn(), removeClass: jest.fn(),
        on: jest.fn(), val: jest.fn(), focus: jest.fn(),
    };
    const mockJQueryNotFoundMethods = {
        length: 0, html: jest.fn(), addClass: jest.fn(), removeClass: jest.fn(),
        on: jest.fn(), val: jest.fn(), focus: jest.fn(),
    };

    const FRAME_RATE = 30;
    const DIM_X = 800;
    const DIM_Y = 600;

    // Store original Asteroids properties to restore them
    let originalAsteroids = {};

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        // Suppress specific console messages and ALL general logs during tests
        console.error = jest.fn((...args) => {
            const message = typeof args[0] === 'string' ? args[0] : '';
            // Allow only truly unexpected errors (or add specific allowed errors)
            if (!message.includes("High score target element 'high-scores-start' not found")) {
                 // originalConsoleError.apply(console, args); // Maybe suppress all errors too?
            }
        });
        console.warn = jest.fn((...args) => {
            const message = typeof args[0] === 'string' ? args[0] : '';
             // Allow only truly unexpected warnings
            if (!message.includes("Game loop was not running. Attempting to restart.")) {
                // originalConsoleWarn.apply(console, args); // Suppress unless needed
            }
        });
        // Suppress regular game logs
        console.log = jest.fn();

        originalAsteroids = { ...window.Asteroids }; // Shallow copy
        window.Asteroids = window.Asteroids || {};

        // Mock dependencies
        MockShipExplosion = jest.fn(function() {
            this.frame = 999; // Start inactive
            this.img_obj = { total_frames: 25 };
            this.explode = jest.fn(); // Add mock explode method to the instance
        });
        window.Asteroids.ShipExplosion = MockShipExplosion;

        MockShip = jest.fn(function(args = {}) {
            this.pos = args.pos; this.game = args.game; this.radius = 20;
            this.reanimateSelf = jest.fn();
            this.isInvincible = false; this.invincibleTimer = 0; this.INVINCIBILITY_DURATION_SECONDS = 2;
            this.isPoweredUp = false; this.powerUpTimer = 0;
        });
        window.Asteroids.Ship = MockShip;

        MockAsteroid = jest.fn(function(args = {}) {
             this.pos = args.pos; this.game = args.game; this.radius = args.radius || 30;
        });
        window.Asteroids.Asteroid = MockAsteroid;

        MockBullet = jest.fn(function(args = {}) {
             this.pos = args.pos; this.game = args.game; this.radius = args.radius || 5;
        });
         window.Asteroids.Bullet = MockBullet;

         MockUfo = jest.fn(function(args = {}) {
             this.pos = args.pos; this.game = args.game; this.radius = args.radius || 15;
         });
         window.Asteroids.Ufo = MockUfo;

         MockUfoBullet = jest.fn(function(args = {}) {
             this.pos = args.pos; this.game = args.game; this.radius = args.radius || 8;
         });
         window.Asteroids.UfoBullet = MockUfoBullet;

         MockAsteroidExplosion = jest.fn(function(args = {}){
             this.pos = args.pos; this.radius = args.radius || 30;
         });
         window.Asteroids.AsteroidExplosion = MockAsteroidExplosion;

         MockPowerUp = jest.fn(function(args = {}) {
             this.pos = args.pos; this.game = args.game; this.radius = args.radius || 50;
         });
         window.Asteroids.PowerUp = MockPowerUp;

        // --- Refined jQuery Mock --- 
        // Selectors expected to be found in tests
        const foundSelectors = [
            '.new-game-btn', '#lives', '#score', '#level',
            '#game-over', '#level-display', '#countdown-display',
            '#initials-input-modal', '#modal-screen', '#initials-input',
            '#level-text', '#countdown-number'
            // Add other selectors here if tests depend on them being found
        ];

        // Selectors related to high scores, likely not present/needed in detail for Game logic tests
        const notFoundSelectors = [
            '#high-scores-start', 
            '#high-scores-endgame'
        ];

        mockJQuery = jest.fn((selector) => {
            if (foundSelectors.includes(selector)) {
                return mockJQueryFoundMethods;
            }
            if (notFoundSelectors.includes(selector)) {
                return mockJQueryNotFoundMethods;
            }
            // Default behavior: return found mock, or adjust as needed
            console.warn(`jQuery mock used with unexpected selector: ${selector}`); 
            return mockJQueryFoundMethods; 
        });
        global.$ = mockJQuery;
        // --- End Refined jQuery Mock ---

        // Mock Util
        // Util is loaded from the actual file later, so we don't need a full mock here.
        // We will spy on specific Util methods after loading.

        // Mock GameView
        MockGameView = {
            stopLoop: jest.fn(),
            startAttractModeLoop: jest.fn(),
        };
        global.gameView = MockGameView;

        // Mock Frame_Rate
        global.Frame_Rate = FRAME_RATE;

        // --- Require Util script first to ensure Asteroids.Util exists ---
        // It might have been loaded by other tests, but be explicit
        require('../lib/javascripts/utils.js');

        // Now mock/spy specific Util methods if needed for Game tests
        // Ensure Asteroids.Util exists before spying
        window.Asteroids.Util = window.Asteroids.Util || {}; 
        jest.spyOn(window.Asteroids.Util, 'displayHighScores').mockImplementation(() => {}); // Spy and mock implementation
        // Add spies for other Util methods if Game interacts with them directly
        // e.g., jest.spyOn(window.Asteroids.Util, 'randomPosition'); // If we need to track calls

        // --- REMOVE require for Game script FROM HERE ---
        // require('../lib/javascripts/game.js');
    });

    afterAll(() => {
        // Restore original console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog; // Restore console.log

        // Restore original Asteroids object and other globals
        window.Asteroids = originalAsteroids;
        delete global.gameView;
        delete global.Frame_Rate;
        delete global.$;
        // Restore spied methods
        jest.restoreAllMocks(); 
    });

    // Global beforeEach to clear shared mocks
    beforeEach(() => {
        // Require the Game script HERE, just before instantiation
        require('../lib/javascripts/game.js');
        // Assign the constructor/namespace to our local variable
        GameRef = window.Asteroids.Game;

        // Initialize game instance using the reference
        game = new GameRef(DIM_X, DIM_Y);

        // Mock window.gameView
        originalGameView = window.gameView;
        window.gameView = {
            intervalID: null, // Initialize intervalID
            start: jest.fn(() => { window.gameView.intervalID = 999; }), // Simulate setting ID on start
            stopLoop: jest.fn(() => { window.gameView.intervalID = null; }), // Simulate clearing ID on stop
            startAttractModeLoop: jest.fn(() => { window.gameView.intervalID = 888; }), // Simulate setting ID
        };

        // Reset jQuery mock calls (function itself)
        mockJQuery.mockClear();
        // Reset calls on the *methods* of the mock objects (now accessible)
        Object.values(mockJQueryFoundMethods).forEach(method => {
            if (jest.isMockFunction(method)) {
                 method.mockClear();
            }
        });
        Object.values(mockJQueryNotFoundMethods).forEach(method => {
            if (jest.isMockFunction(method)) {
                 method.mockClear();
            }
        });

        // Clear calls on constructor mocks if not handled elsewhere
        MockShipExplosion.mockClear();
        MockShip.mockClear();
        MockAsteroid.mockClear();
        MockBullet.mockClear();
        MockUfo.mockClear();
        MockUfoBullet.mockClear();
        MockAsteroidExplosion.mockClear();
        MockPowerUp.mockClear();

        // Clear calls on GameView mocks
        MockGameView.stopLoop?.mockClear();
        MockGameView.startAttractModeLoop?.mockClear();

        // Clear calls on Ship instance mocks if needed
        MockShip.mock.instances.forEach(instance => {
            instance.reanimateSelf?.mockClear();
        });
    });

    afterEach(() => {
        // Restore original globals
        window.gameView = originalGameView;

        // Restore all mocks created with jest.spyOn etc.
        jest.restoreAllMocks();
    });

    // Clear mocks used within tests between tests
    // (This might be slightly redundant with the global one, but ensures isolation)
     beforeEach(() => {
        // Clear calls on all constructor mocks
        MockShipExplosion.mockClear();
        MockShip.mockClear();
        MockAsteroid.mockClear();
        MockBullet.mockClear();
        MockUfo.mockClear();
        MockUfoBullet.mockClear();
        MockAsteroidExplosion.mockClear();
        MockPowerUp.mockClear();

        // Clear calls on Util mocks (if any were spied on directly in tests)
        // e.g., window.Asteroids.Util.displayHighScores?.mockClear();

         // Clear calls on GameView mocks
         MockGameView.stopLoop?.mockClear();
         MockGameView.startAttractModeLoop?.mockClear();

        // Clear jQuery mocks (function itself)
        mockJQuery.mockClear();
         // Reset calls on the *methods* of the mock objects (now accessible)
         Object.values(mockJQueryFoundMethods).forEach(method => {
             if (jest.isMockFunction(method)) {
                 method.mockClear();
             }
         });
         Object.values(mockJQueryNotFoundMethods).forEach(method => {
             if (jest.isMockFunction(method)) {
                 method.mockClear();
             }
         });

         // Clear calls on Ship instance mocks if any exist from previous tests
         MockShip.mock.instances.forEach(instance => {
             instance.reanimateSelf?.mockClear();
         });
    });

    describe('Constructor', () => {
        let game;
        beforeEach(() => {
             // Instantiate game here to isolate constructor tests
             // Clear Asteroid calls specifically from this constructor call
             MockAsteroid.mockClear();
             game = new GameRef(DIM_X, DIM_Y);
        });

        test('should initialize dimensions', () => {
            expect(game.width).toBe(DIM_X);
            expect(game.height).toBe(DIM_Y);
        });

        test('should initialize game state properties', () => {
            expect(game.attractMode).toBe(true);
            expect(game.level).toBe(1);
            expect(game.ship).toBeNull();
            expect(game.bullets).toEqual([]);
            expect(game.ufos).toEqual([]);
            expect(game.ufoBullets).toEqual([]);
            expect(game.powerUp).toBeNull();
            expect(game.gameOver).toBe(false);
            expect(game.score).toBe(0);
            expect(game.lives).toBe(GameRef.NUM_LIVES);
        });

         test('should create a ShipExplosion instance', () => {
             // Constructor was called in outer beforeEach
             expect(MockShipExplosion).toHaveBeenCalledTimes(1);
             expect(game.ship_explosion).toBeInstanceOf(MockShipExplosion);
         });

         test('should initialize timers (UFO, PowerUp)', () => {
             const expectedUfoTimer = GameRef.UFO_SPAWN_INTERVAL_SECONDS * (1000 / FRAME_RATE);
             expect(game.ufoSpawnTimer).toBeCloseTo(expectedUfoTimer);
             const minPowerUpFrames = GameRef.POWERUP_MIN_SPAWN_DELAY * (1000 / FRAME_RATE);
             const maxPowerUpFrames = GameRef.POWERUP_MAX_SPAWN_DELAY * (1000 / FRAME_RATE);
             expect(game.powerUpSpawnTimer).toBeGreaterThanOrEqual(minPowerUpFrames);
             expect(game.powerUpSpawnTimer).toBeLessThanOrEqual(maxPowerUpFrames);
         });

        test('should call addInitialAsteroids for attract mode (creating 20 asteroids)', () => {
            expect(MockAsteroid).toHaveBeenCalledTimes(20);
            expect(game.asteroids.length).toBe(20);
            expect(MockAsteroid.mock.calls[0][0].game).toBe(game);
            expect(MockAsteroid.mock.calls[0][0].min_speed).toBe(game.base_min_asteroid_speed);
        });

        test('should bind newGame button handler', () => {
             // Find the jQuery call for the button
             const btnCall = mockJQuery.mock.calls.find(call => call[0] === '.new-game-btn');
             expect(btnCall).toBeDefined();
             // Find the result object associated with that call
             const btnQueryResult = mockJQuery.mock.results[mockJQuery.mock.calls.indexOf(btnCall)]?.value;
             expect(btnQueryResult?.on).toHaveBeenCalledWith('mouseup', expect.any(Function));
        });
    });

     describe('addInitialAsteroids', () => {
         let game;
         beforeEach(() => {
             MockAsteroid.mockClear(); // Clear before creating game for this suite
             game = new GameRef(DIM_X, DIM_Y); // Creates initial asteroids (20)
             MockAsteroid.mockClear(); // Clear again to test specific calls
         });

         test('should add specified number of asteroids for game mode', () => {
             game.num_asteroids = 5;
             game.min_asteroid_speed = 0.8;
             const asteroids = game.addInitialAsteroids(false); // Not attract mode
             expect(asteroids.length).toBe(5);
             expect(MockAsteroid).toHaveBeenCalledTimes(5);
             expect(MockAsteroid.mock.calls[0][0].game).toBe(game);
             expect(MockAsteroid.mock.calls[0][0].min_speed).toBe(0.8);
         });

          test('should add 20 asteroids for attract mode', () => {
             const asteroids = game.addInitialAsteroids(true); // Attract mode
             expect(asteroids.length).toBe(20);
             expect(MockAsteroid).toHaveBeenCalledTimes(20);
             expect(MockAsteroid.mock.calls[0][0].game).toBe(game);
             expect(MockAsteroid.mock.calls[0][0].min_speed).toBe(game.base_min_asteroid_speed);
         });

         test('should use randomPosition for each asteroid', () => {
            const randomPosSpy = jest.spyOn(game, 'randomPosition').mockReturnValue([1,1]);
            game.num_asteroids = 3;
            game.addInitialAsteroids(false);
            expect(randomPosSpy).toHaveBeenCalledTimes(3);
            expect(MockAsteroid).toHaveBeenCalledWith(expect.objectContaining({ pos: [1,1] }));
            randomPosSpy.mockRestore();
        });
     });

     describe('add / remove Objects', () => {
         let game;
         beforeEach(() => {
             game = new GameRef(DIM_X, DIM_Y);
             // Clear initial objects
             game.asteroids = [];
             game.bullets = [];
             game.ufos = [];
             game.ufoBullets = [];
             game.asteroid_explosions = [];
             game.powerUp = null;
         });

         test('add should put Asteroid in asteroids array', () => {
             const asteroid = new MockAsteroid({ game: game }); // Use mock constructor
             game.add(asteroid);
             expect(game.asteroids).toContain(asteroid);
         });

         test('add should put Bullet in bullets array', () => {
             const bullet = new MockBullet({ game: game });
             game.add(bullet);
             expect(game.bullets).toContain(bullet);
         });

         test('add should put Ufo in ufos array', () => {
             const ufo = new MockUfo({ game: game });
             game.add(ufo);
             expect(game.ufos).toContain(ufo);
         });

         test('add should put UfoBullet in ufoBullets array', () => {
             const ufoBullet = new MockUfoBullet({ game: game });
             game.add(ufoBullet);
             expect(game.ufoBullets).toContain(ufoBullet);
         });

          test('add should put AsteroidExplosion in asteroid_explosions array', () => {
             const explosion = new MockAsteroidExplosion({ game: game });
             game.add(explosion);
             expect(game.asteroid_explosions).toContain(explosion);
         });

        test('add should put PowerUp in powerUp property (replacing existing)', () => {
             const powerUp1 = new MockPowerUp({ game: game });
             const powerUp2 = new MockPowerUp({ game: game });

             game.add(powerUp1);
             expect(game.powerUp).toBe(powerUp1);
             game.add(powerUp2);
             expect(game.powerUp).toBe(powerUp2); // Should replace
         });

          test('remove should remove object from asteroids array', () => {
             const asteroid1 = new MockAsteroid({id: 1});
             const asteroid2 = new MockAsteroid({id: 2});
             game.asteroids = [asteroid1, asteroid2];
             game.remove(asteroid1);
             expect(game.asteroids).toEqual([asteroid2]);
             expect(game.asteroids).not.toContain(asteroid1);
         });

         test('remove should remove object from bullets array', () => {
             const bullet1 = new MockBullet({id: 1});
             const bullet2 = new MockBullet({id: 2});
             game.bullets = [bullet1, bullet2];
             game.remove(bullet2);
             expect(game.bullets).toEqual([bullet1]);
             expect(game.bullets).not.toContain(bullet2);
         });

          test('remove should remove object from ufos array', () => {
             const ufo1 = new MockUfo({id: 1});
             const ufo2 = new MockUfo({id: 2});
             game.ufos = [ufo1, ufo2];
             game.remove(ufo1);
             expect(game.ufos).toEqual([ufo2]);
             expect(game.ufos).not.toContain(ufo1);
         });

         test('remove should remove object from ufoBullets array', () => {
             const ufoBullet1 = new MockUfoBullet({id: 1});
             const ufoBullet2 = new MockUfoBullet({id: 2});
             game.ufoBullets = [ufoBullet1, ufoBullet2];
             game.remove(ufoBullet2);
             expect(game.ufoBullets).toEqual([ufoBullet1]);
             expect(game.ufoBullets).not.toContain(ufoBullet2);
         });

          test('remove should remove object from asteroid_explosions array', () => {
             const exp1 = new MockAsteroidExplosion({id: 1});
             const exp2 = new MockAsteroidExplosion({id: 2});
             game.asteroid_explosions = [exp1, exp2];
             game.remove(exp1);
             expect(game.asteroid_explosions).toEqual([exp2]);
             expect(game.asteroid_explosions).not.toContain(exp1);
         });

         test('remove should set powerUp to null and reset timer if removing the current powerUp', () => {
            const powerUp = new MockPowerUp({id: 1});
            game.powerUp = powerUp;
            const resetTimerSpy = jest.spyOn(game, 'resetPowerupSpawnTimer').mockReturnValue(12345);
            game.remove(powerUp);
            expect(game.powerUp).toBeNull();
            expect(resetTimerSpy).toHaveBeenCalledTimes(1);
            expect(game.powerUpSpawnTimer).toBe(12345);
            resetTimerSpy.mockRestore();
         });

         test('remove should do nothing if powerUp exists but removing different object type', () => {
            const powerUp = new MockPowerUp({ id: 1 });
            const asteroid = new MockAsteroid({ id: 2 });
            game.powerUp = powerUp;
            game.asteroids = [asteroid];
            const resetTimerSpy = jest.spyOn(game, 'resetPowerupSpawnTimer');

            game.remove(asteroid); // Remove something else

            expect(game.powerUp).toBe(powerUp); // Should remain unchanged
            expect(game.asteroids).toEqual([]); // Asteroid should be removed
            expect(resetTimerSpy).not.toHaveBeenCalled();
            resetTimerSpy.mockRestore();
         });
     });

    // Add tests for step and moveObjects within the main describe block
     describe('Game Loop (`step`)', () => {
         let game;
         let moveObjectsSpy, checkCollisionsSpy, advanceLevelSpy, maybeAddUfoSpy, maybeSpawnPowerUpSpy, isSpawningAllowedSpy;

         beforeEach(() => {
             game = new GameRef(DIM_X, DIM_Y);
             // Ensure ship exists for normal game state tests
             // Need to use the *actual* mock constructor to get mock methods
             game.ship = new MockShip({ game: game });
             // Set attractMode false for most step tests
             game.attractMode = false;
             game.gameOver = false;
             game.preLevelState = null; // Not in countdown

             // Spy on methods called by step
             moveObjectsSpy = jest.spyOn(game, 'moveObjects');
             checkCollisionsSpy = jest.spyOn(game, 'checkCollisions').mockImplementation(() => {}); // Mock implementation to avoid needing collision setup
             advanceLevelSpy = jest.spyOn(game, 'advanceLevel').mockImplementation(() => {});
             maybeAddUfoSpy = jest.spyOn(game, 'maybeAddUfo').mockImplementation(() => {});
             maybeSpawnPowerUpSpy = jest.spyOn(game, 'maybeSpawnPowerUp').mockImplementation(() => {});
             isSpawningAllowedSpy = jest.spyOn(game, 'isSpawningAllowed').mockReturnValue(true); // Default to spawning allowed
         });

         afterEach(() => {
             // Restore spies
             moveObjectsSpy.mockRestore();
             checkCollisionsSpy.mockRestore();
             advanceLevelSpy.mockRestore();
             maybeAddUfoSpy.mockRestore();
             maybeSpawnPowerUpSpy.mockRestore();
             isSpawningAllowedSpy.mockRestore();
         });

         test('step should call moveObjects and checkCollisions in normal state', () => {
             game.step();
             expect(moveObjectsSpy).toHaveBeenCalledTimes(1);
             expect(checkCollisionsSpy).toHaveBeenCalledTimes(1);
         });

         test('step should check spawning conditions if level clear condition not met', () => {
             // Simulate level not clear (e.g., asteroids exist)
             game.asteroids = [new MockAsteroid({ game: game })];
             game.ufos = [];
             isSpawningAllowedSpy.mockReturnValue(true);

             game.step();
             expect(advanceLevelSpy).not.toHaveBeenCalled();
             // isSpawningAllowed is called once in the first `if` and again in the `else`
             expect(isSpawningAllowedSpy).toHaveBeenCalledTimes(2);
             expect(maybeAddUfoSpy).toHaveBeenCalledTimes(1);
             expect(maybeSpawnPowerUpSpy).toHaveBeenCalledTimes(1);
         });

         test('step should call advanceLevel if level clear and spawning disallowed', () => {
             game.asteroids = []; // Level clear
             game.ufos = [];
             isSpawningAllowedSpy.mockReturnValue(false); // Spawning time over

             game.step();
             expect(advanceLevelSpy).toHaveBeenCalledTimes(1);
             expect(maybeAddUfoSpy).not.toHaveBeenCalled();
             expect(maybeSpawnPowerUpSpy).not.toHaveBeenCalled();
         });

         test('step should NOT spawn or advance if level clear but spawning IS allowed', () => {
            // Scenario: Player cleared screen very quickly
            game.asteroids = [];
            game.ufos = [];
            isSpawningAllowedSpy.mockReturnValue(true); // Spawning time still active

            game.step();
            // Level clear condition takes precedence in the first if, but spawning is allowed,
            // so advanceLevel is NOT called. The else block is entered, and isSpawningAllowed is checked again.
            expect(isSpawningAllowedSpy).toHaveBeenCalledTimes(2); // Called in both if conditions
            expect(advanceLevelSpy).not.toHaveBeenCalled();
            expect(maybeAddUfoSpy).toHaveBeenCalledTimes(1); // Spawning methods ARE called in this case
            expect(maybeSpawnPowerUpSpy).toHaveBeenCalledTimes(1);
         });

          test('step should NOT spawn if spawning disallowed, even if level not clear', () => {
            game.asteroids = [new MockAsteroid({ game: game })];
            game.ufos = [];
            isSpawningAllowedSpy.mockReturnValue(false); // Spawning time over

            game.step();
            expect(advanceLevelSpy).not.toHaveBeenCalled();
            // isSpawningAllowed is called once in the first `if` and again in the `else`
            expect(isSpawningAllowedSpy).toHaveBeenCalledTimes(2);
            // The inner `if` inside the `else` block fails
            expect(maybeAddUfoSpy).not.toHaveBeenCalled();
            expect(maybeSpawnPowerUpSpy).not.toHaveBeenCalled();
         });

         test('step should only call moveObjects in attractMode', () => {
             game.attractMode = true;
             game.step();
             expect(moveObjectsSpy).toHaveBeenCalledTimes(1);
             expect(checkCollisionsSpy).not.toHaveBeenCalled();
             expect(advanceLevelSpy).not.toHaveBeenCalled();
             // ... check other methods not called
         });

         test('step should do nothing if game over and explosion not finished', () => {
             game.gameOver = true;
             game.ship_explosion.frame = 10; // Explosion running
             game.ship_explosion.img_obj = { total_frames: 25 };
             game.step();
             expect(moveObjectsSpy).not.toHaveBeenCalled();
             expect(checkCollisionsSpy).not.toHaveBeenCalled();
             // ... check other methods not called
         });

          test('step should do nothing if game over, explosion finished, but delay not met', () => {
             game.gameOver = true;
             game.ship_explosion.frame = 30; // Explosion finished
             game.ship_explosion.img_obj = { total_frames: 25 };
             game.gameOverDelayCounter = 5; // Delay not met (needs > 10)
             game.gameOverScreenShown = false;

             const loadScoresSpy = jest.spyOn(window.Asteroids.Util, 'loadHighScores');
             game.step();

             expect(moveObjectsSpy).not.toHaveBeenCalled();
             expect(checkCollisionsSpy).not.toHaveBeenCalled();
             expect(loadScoresSpy).not.toHaveBeenCalled(); // High score check shouldn't happen yet
             expect(game.gameOverDelayCounter).toBe(6); // Counter increments
             loadScoresSpy.mockRestore();
         });

         // Add more tests for game over logic (high score check, showing screens) later if needed

         test('step should do nothing if preLevelState is active', () => {
             game.preLevelState = { countdown: 3, timerId: null }; // Countdown active
             game.step();
             expect(moveObjectsSpy).not.toHaveBeenCalled();
             expect(checkCollisionsSpy).not.toHaveBeenCalled();
             // ... check other methods not called
         });
     });

     describe('moveObjects', () => {
         let game;
         let mockAsteroid1, mockAsteroid2, mockBullet, mockShip;

         beforeEach(() => {
             game = new GameRef(DIM_X, DIM_Y);
             // Mock move method for each object type
             mockAsteroid1 = { id: 'a1', move: jest.fn() };
             mockAsteroid2 = { id: 'a2', move: jest.fn() };
             mockBullet = { id: 'b1', move: jest.fn() };
             mockShip = { id: 's1', move: jest.fn() }; // Use a simple object with a move mock

             game.ship = mockShip;
             game.asteroids = [mockAsteroid1, mockAsteroid2];
             game.bullets = [mockBullet];
             game.ufos = [];
             game.ufoBullets = [];
             game.powerUp = null;
         });

         test('should call move on all objects in normal mode', () => {
             game.attractMode = false;
             game.moveObjects();
             expect(mockAsteroid1.move).toHaveBeenCalledTimes(1);
             expect(mockAsteroid2.move).toHaveBeenCalledTimes(1);
             expect(mockBullet.move).toHaveBeenCalledTimes(1);
             expect(mockShip.move).toHaveBeenCalledTimes(1);
         });

         test('should call move only on asteroids in attract mode', () => {
             game.attractMode = true;
             game.moveObjects();
             expect(mockAsteroid1.move).toHaveBeenCalledTimes(1);
             expect(mockAsteroid2.move).toHaveBeenCalledTimes(1);
             expect(mockBullet.move).not.toHaveBeenCalled();
             expect(mockShip.move).not.toHaveBeenCalled();
         });

         test('should handle objects without a move method gracefully', () => {
            game.attractMode = false;
            const badObject = { id: 'bad' }; // No move method
            game.asteroids.push(badObject);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error

            expect(() => game.moveObjects()).not.toThrow(); // Should not throw an error
            expect(mockAsteroid1.move).toHaveBeenCalledTimes(1); // Others should still move
            expect(consoleSpy).toHaveBeenCalledWith("Attempted to move an object without a move method:", badObject);

            consoleSpy.mockRestore();
        });
     });

    // Test suite for collision detection
    describe('checkCollisions', () => {
        let mockObj1, mockObj2, mockObj3;
        let allObjectsSpy;

        beforeEach(() => {
            // Mocks are created here, but the spy is set up on the outer scope 'game'
            mockObj1 = { isCollidedWith: jest.fn(), collideWith: jest.fn(), id: 'obj1' };
            mockObj2 = { isCollidedWith: jest.fn(), collideWith: jest.fn(), id: 'obj2' };
            mockObj3 = { isCollidedWith: jest.fn(), collideWith: jest.fn(), id: 'obj3' };

            // Spy on the 'game' instance from the outer scope
            allObjectsSpy = jest.spyOn(game, 'allObjects');
        });

        afterEach(() => {
            // Restore the spy after each test in this block
            allObjectsSpy.mockRestore();
        });

        test('should call collideWith when isCollidedWith returns true', () => {
            allObjectsSpy.mockReturnValue([mockObj1, mockObj2]);
            mockObj1.isCollidedWith.mockReturnValue(true); // obj1 collides with obj2

            game.checkCollisions(); // Use the outer scope 'game' instance

            expect(mockObj1.isCollidedWith).toHaveBeenCalledWith(mockObj2);
            expect(mockObj1.collideWith).toHaveBeenCalledWith(mockObj2);
            expect(mockObj2.isCollidedWith).not.toHaveBeenCalled(); // Check is unidirectional
            expect(mockObj2.collideWith).not.toHaveBeenCalled();
        });

        test('should NOT call collideWith when isCollidedWith returns false', () => {
            allObjectsSpy.mockReturnValue([mockObj1, mockObj2]);
            mockObj1.isCollidedWith.mockReturnValue(false);

            game.checkCollisions(); // Use the outer scope 'game' instance

            expect(mockObj1.isCollidedWith).toHaveBeenCalledWith(mockObj2);
            expect(mockObj1.collideWith).not.toHaveBeenCalled();
            expect(mockObj2.collideWith).not.toHaveBeenCalled();
        });

        test('should handle multiple objects and multiple collisions', () => {
            allObjectsSpy.mockReturnValue([mockObj1, mockObj2, mockObj3]);
            mockObj1.isCollidedWith.mockImplementation(other => other === mockObj2); // obj1 collides with obj2
            mockObj2.isCollidedWith.mockImplementation(other => other === mockObj3); // obj2 collides with obj3

            game.checkCollisions(); // Use the outer scope 'game' instance

            // Check obj1 vs obj2
            expect(mockObj1.isCollidedWith).toHaveBeenCalledWith(mockObj2);
            expect(mockObj1.collideWith).toHaveBeenCalledWith(mockObj2);
            // Check obj1 vs obj3
            expect(mockObj1.isCollidedWith).toHaveBeenCalledWith(mockObj3);
            expect(mockObj1.collideWith).not.toHaveBeenCalledWith(mockObj3);
            // Check obj2 vs obj3
            expect(mockObj2.isCollidedWith).toHaveBeenCalledWith(mockObj3);
            expect(mockObj2.collideWith).toHaveBeenCalledWith(mockObj3);
        });

        test('should call console.error if colliding object lacks collideWith method', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            // Setup: faultyObj1 should report collision but has no collideWith
            // Ensure mockObj2 has the methods checkCollisions expects
            const faultyObj1 = { 
                id: 'faultyObj1', 
                isCollidedWith: jest.fn(() => true) // Reports collision with anything
                // Missing: collideWith 
            };
            const validObj2 = { 
                id: 'validObj2', 
                isCollidedWith: jest.fn(() => false), // Doesn't report collision back
                collideWith: jest.fn() 
            };

            allObjectsSpy.mockReturnValue([faultyObj1, validObj2]);

            game.checkCollisions(); 

            expect(faultyObj1.isCollidedWith).toHaveBeenCalledWith(validObj2);
            // Check that the error was logged because faultyObj1.collideWith is missing
            expect(consoleErrorSpy).toHaveBeenCalledWith("obj1 missing collideWith method", faultyObj1);
            // Ensure validObj2's methods weren't called inappropriately
            expect(validObj2.isCollidedWith).not.toHaveBeenCalled();
            expect(validObj2.collideWith).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        test('should skip checks if an object is null or missing isCollidedWith', () => {
            const incompleteObj1 = { collideWith: jest.fn(), id: 'incompleteObj1' }; // Missing isCollidedWith
            allObjectsSpy.mockReturnValue([incompleteObj1, mockObj2, null]);

            game.checkCollisions(); // Use the outer scope 'game' instance

            // incompleteObj1 vs mockObj2 (incompleteObj1 lacks isCollidedWith)
            expect(incompleteObj1.collideWith).not.toHaveBeenCalled();
            expect(mockObj2.isCollidedWith).not.toHaveBeenCalled();

            // mockObj2 vs null (null object)
            expect(mockObj2.isCollidedWith).not.toHaveBeenCalled();
            expect(mockObj2.collideWith).not.toHaveBeenCalled();
        });
    });

    describe('handleDeath / decrementLives / reset', () => {
        let game;
        let mockShipInstance;
        let mockExplode;

        beforeEach(() => {
            game = new GameRef(DIM_X, DIM_Y);
            // Ensure ship exists and has necessary mocks
            game.ship = new MockShip({ game: game });
            mockShipInstance = game.ship;
            mockShipInstance.suspended = false; // Start not suspended
            mockShipInstance.pos = [10, 10]; // Initial position

            // Mock the explode method on the ship_explosion instance
            mockExplode = jest.spyOn(game.ship_explosion, 'explode').mockImplementation(() => {});

            // Reset game state for death tests
            game.gameOver = false;
            game.lives = GameRef.NUM_LIVES;
            game.score = 500;
            game.finalScore = undefined;

            // Clear specific jQuery mock calls
            mockJQuery('#lives').html.mockClear(); 
        });

        afterEach(() => {
            mockExplode.mockRestore(); // Restore the spy
        });

        // -- decrementLives Tests --
        test('decrementLives should decrease lives by 1', () => {
            const initialLives = game.lives;
            game.decrementLives();
            expect(game.lives).toBe(initialLives - 1);
        });

        test('decrementLives should update #lives UI', () => {
            const expectedLives = game.lives - 1;
            game.decrementLives();
            expect(mockJQuery('#lives').html).toHaveBeenCalledWith(expectedLives);
        });

        test('decrementLives should not go below 0', () => {
            game.lives = 0;
            game.decrementLives();
            expect(game.lives).toBe(0);
            expect(mockJQuery('#lives').html).toHaveBeenCalledWith(0);
        });

        // -- handleDeath Tests --
        test('handleDeath (lives > 0) should start explosion with reset callback', () => {
            const decrementSpy = jest.spyOn(game, 'decrementLives');
            const resetSpy = jest.spyOn(game, 'reset'); // Need to spy on reset
            game.lives = 3; // Ensure lives > 0

            game.handleDeath();

            expect(decrementSpy).toHaveBeenCalledTimes(1);
            expect(game.gameOver).toBe(false);
            expect(mockShipInstance.suspended).toBe(true);
            expect(mockExplode).toHaveBeenCalledTimes(1);
            // Check the callback passed to explode is the bound reset function
            // This is tricky to assert directly. We can check the type and name.
            const passedCallback = mockExplode.mock.calls[0][0];
            expect(typeof passedCallback).toBe('function');
            // expect(passedCallback.name).toBe('bound reset'); // Might be too brittle

            // Simulate the callback being called
            passedCallback();
            expect(resetSpy).toHaveBeenCalledTimes(1);

            decrementSpy.mockRestore();
            resetSpy.mockRestore();
        });

        test('handleDeath (lives <= 0) should set gameOver, store score, explode with null callback', () => {
            const decrementSpy = jest.spyOn(game, 'decrementLives');
            game.lives = 1; // Will become 0 after decrement
            const initialScore = game.score;

            game.handleDeath();

            expect(decrementSpy).toHaveBeenCalledTimes(1);
            expect(game.lives).toBe(0);
            expect(game.gameOver).toBe(true);
            expect(game.finalScore).toBe(initialScore);
            expect(mockShipInstance.suspended).toBe(false); // Should not be suspended
            expect(mockExplode).toHaveBeenCalledTimes(1);
            expect(mockExplode).toHaveBeenCalledWith(null, mockShipInstance.pos);

            decrementSpy.mockRestore();
        });

        test('handleDeath should be idempotent when gameOver is true', () => {
            game.lives = 0;
            game.gameOver = true; // Set game over state
            const decrementSpy = jest.spyOn(game, 'decrementLives');

            game.handleDeath(); // Call again

            expect(decrementSpy).toHaveBeenCalledTimes(1); // It *is* called before the gameOver check
            expect(mockExplode).not.toHaveBeenCalled();
            expect(game.finalScore).toBeUndefined(); // Should not have been set again

            decrementSpy.mockRestore();
        });

        // -- reset Tests --
        test('reset should reposition ship, reset vel/angle, and reanimate', () => {
            mockShipInstance.pos = [1, 1];
            mockShipInstance.vel = [5, 5];
            mockShipInstance.angle = 180;

            game.reset();

            expect(mockShipInstance.pos).toEqual([DIM_X / 2, DIM_Y / 2]);
            expect(mockShipInstance.vel).toEqual([0, 0]);
            expect(mockShipInstance.angle).toBe(90);
            expect(mockShipInstance.reanimateSelf).toHaveBeenCalledTimes(1);
        });

        test('reset should make ship invincible and set timer', () => {
            const expectedInvincibleFrames = GameRef.INVINCIBILITY_SECONDS * GameRef.FRAME_RATE;
            // console.log(`TEST: Expected Invincible Frames = ${expectedInvincibleFrames}`); // REMOVED log
            // console.log(`TEST: GameRef.FRAME_RATE = ${GameRef.FRAME_RATE}`); // REMOVED log

            game.reset();
            expect(mockShipInstance.isInvincible).toBe(true);
            expect(mockShipInstance.invincibleTimer).toBeCloseTo(expectedInvincibleFrames);
        });

        test('reset should reset powerup state', () => {
            mockShipInstance.isPoweredUp = true;
            mockShipInstance.powerUpTimer = 100;

            game.reset();

            expect(mockShipInstance.isPoweredUp).toBe(false);
            expect(mockShipInstance.powerUpTimer).toBe(0);
        });

        test('reset should do nothing if ship is null', () => {
            game.ship = null;
            // Check that it doesn't throw an error accessing properties of null
            expect(() => game.reset()).not.toThrow();
        });
    });

    describe('newGame', () => {
        let game;
        // Declare spies needed for specific tests - manage within tests
        let stopLoopSpy, startAttractModeLoopSpy, clearTimeoutSpy, addInitialAsteroidsSpy, displayHighScoresSpy;
        let mockShipExplosionInstance;

        // REMOVE unnecessary beforeEach/afterEach for spies
        // beforeEach(() => {
        //     // Initialize spies here if needed for multiple tests
        // });
        // afterEach(() => {
        //     // Restore spies here if initialized in beforeEach
        //     stopLoopSpy?.mockRestore();
        //     startAttractModeLoopSpy?.mockRestore();
        //     clearTimeoutSpy?.mockRestore();
        //     addInitialAsteroidsSpy?.mockRestore();
        //     displayHighScoresSpy?.mockRestore();
        // });

        test('should reset game state flags (gameOver, attractMode, etc.)', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            game.gameOver = true; // Set non-default state
            game.attractMode = false;
            game.gameOverScreenShown = true;

            game.newGame();

            expect(game.gameOver).toBe(false);
            expect(game.attractMode).toBe(true);
            expect(game.gameOverScreenShown).toBe(false);
        });

        test('should reset score and lives and update UI', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            // Get specific mocks for elements updated by newGame
            const scoreElementMock = mockJQuery('#score');
            const livesElementMock = mockJQuery('#lives');
            const levelElementMock = mockJQuery('#level'); // Assuming #level is used for the '-'
            game.score = 100;
            game.lives = 1;

            game.newGame();

            expect(game.score).toBe(0);
            expect(game.lives).toBe(GameRef.NUM_LIVES);
            // Assert on the specific mocks
            expect(scoreElementMock.html).toHaveBeenCalledWith(0);
            expect(livesElementMock.html).toHaveBeenCalledWith(GameRef.NUM_LIVES);
            expect(levelElementMock.html).toHaveBeenCalledWith('-');
        });

        test('should reset object arrays and ship', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            game.ship = new MockShip({ game: game }); // Add a ship
            game.bullets = [{}]; // Add dummy objects
            game.ufos = [{}];
            game.ufoBullets = [{}];
            game.powerUp = {};
            game.asteroid_explosions = [{}];

            game.newGame();

            expect(game.ship).toBeNull();
            expect(game.bullets).toEqual([]);
            expect(game.ufos).toEqual([]);
            expect(game.ufoBullets).toEqual([]);
            expect(game.powerUp).toBeNull();
            expect(game.asteroid_explosions).toEqual([]);
        });

        test('should reset ship explosion frame', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            mockShipExplosionInstance = game.ship_explosion;
            mockShipExplosionInstance.frame = 10; // Set a frame

            game.newGame();

            // Check instance directly
            expect(mockShipExplosionInstance.frame).toBeGreaterThan(mockShipExplosionInstance.img_obj.total_frames);
        });

        test('should stop game loop and clear pre-level timer', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            game.preLevelState = { countdown: 1, timerId: 12345 }; // Set pre-level state
            // Initialize spies within the test where they are used
            stopLoopSpy = jest.spyOn(window.gameView, 'stopLoop');
            clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

            game.newGame();

            expect(window.gameView.stopLoop).toHaveBeenCalledTimes(1);
            expect(clearTimeoutSpy).toHaveBeenCalledWith(12345); // Check timerId was cleared
            expect(game.preLevelState).toBeNull();
            // Restore spies used in this test
            stopLoopSpy.mockRestore();
            clearTimeoutSpy.mockRestore();
        });

        test('should manipulate UI elements correctly (hide/show modals)', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            // Get specific mocks for elements manipulated
            const gameOverMock = mockJQuery('#game-over');
            const levelDisplayMock = mockJQuery('#level-display');
            const countdownMock = mockJQuery('#countdown-display');
            const initialsModalMock = mockJQuery('#initials-input-modal');
            const modalScreenMock = mockJQuery('#modal-screen');

            game.newGame();

            // Check methods called on specific mocks
            expect(gameOverMock.addClass).toHaveBeenCalledWith('hide');
            expect(levelDisplayMock.addClass).toHaveBeenCalledWith('hide');
            expect(countdownMock.addClass).toHaveBeenCalledWith('hide');
            expect(initialsModalMock.addClass).toHaveBeenCalledWith('hide');
            expect(modalScreenMock.addClass).toHaveBeenCalledWith('hide');
            // Check removeClass calls if any are expected in newGame
            // e.g., expect(someElementMock.removeClass).toHaveBeenCalledWith('hide');
        });

        test('should add initial asteroids for attract mode', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            MockAsteroid.mockClear(); // Clear calls from constructor
            // Initialize spy within the test
            addInitialAsteroidsSpy = jest.spyOn(game, 'addInitialAsteroids').mockReturnValue(Array(20).fill({})); 

            game.newGame();

            expect(addInitialAsteroidsSpy).toHaveBeenCalledWith(true); // Called for attract mode
            expect(game.asteroids.length).toBe(20); // Check that asteroids were set (mocked return)
            // Restore spy used in this test
            addInitialAsteroidsSpy.mockRestore();
        });

        test('should display high scores on start screen', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
             // Initialize spy within the test
            displayHighScoresSpy = jest.spyOn(window.Asteroids.Util, 'displayHighScores');

            game.newGame();

            expect(displayHighScoresSpy).toHaveBeenCalledWith('high-scores-start');
            // Check that the jQuery mock for this selector returned length: 0 (preventing error)
            expect(mockJQuery('#high-scores-start').length).toBe(0);
            // Restore spy used in this test
            displayHighScoresSpy.mockRestore();
        });

        test('should start attract mode loop', () => {
            // Setup inside test
            game = new GameRef(DIM_X, DIM_Y);
            // Initialize spy within the test
            startAttractModeLoopSpy = jest.spyOn(window.gameView, 'startAttractModeLoop');

            game.newGame();

            expect(window.gameView.startAttractModeLoop).toHaveBeenCalledTimes(1);
             // Restore spy used in this test
            startAttractModeLoopSpy.mockRestore();
        });
    });

    describe('Pre-Level Sequence (startPreLevelSequence, handleCountdownTick, startLevelGameplay)', () => {
        let game;
        let handleCountdownTickSpy;
        let startLevelGameplaySpy;
        let addInitialAsteroidsSpy;
        let resetPowerupSpawnTimerSpy;
        let mockShipInstance;
        let dateSpy;

        beforeEach(() => {
            jest.useFakeTimers(); // Enable fake timers
            jest.spyOn(global, 'setTimeout');
            jest.spyOn(global, 'clearTimeout');

            game = new GameRef(DIM_X, DIM_Y);
            // sharedJQueryMethods = mockJQuery(); // Removed

            // Need a ship instance for these methods
            game.ship = new MockShip({ game: game });
            mockShipInstance = game.ship;

            // Initialize spies in beforeEach as they are used across multiple tests
            handleCountdownTickSpy = jest.spyOn(game, 'handleCountdownTick');
            startLevelGameplaySpy = jest.spyOn(game, 'startLevelGameplay');
            addInitialAsteroidsSpy = jest.spyOn(game, 'addInitialAsteroids').mockReturnValue([]); // Mock return
            resetPowerupSpawnTimerSpy = jest.spyOn(game, 'resetPowerupSpawnTimer').mockReturnValue(100);
            dateSpy = jest.spyOn(Date, 'now'); // Initialize date spy

            // Ensure mocks are clear
            setTimeout.mockClear();
            clearTimeout.mockClear();
            // Clear specific jQuery mocks if needed
            mockJQuery('#level-text').html.mockClear();
            mockJQuery('#level-display').removeClass.mockClear();
            mockJQuery('#level-display').addClass.mockClear();
            mockJQuery('#countdown-number').html.mockClear();
            mockJQuery('#countdown-display').removeClass.mockClear();
            mockJQuery('#countdown-display').addClass.mockClear();
            mockShipInstance.reanimateSelf.mockClear();
        });

        afterEach(() => {
            jest.useRealTimers(); // Restore real timers
            // Restore spies initialized in beforeEach
            handleCountdownTickSpy.mockRestore();
            startLevelGameplaySpy.mockRestore();
            addInitialAsteroidsSpy.mockRestore();
            resetPowerupSpawnTimerSpy.mockRestore();
            dateSpy.mockRestore(); // Restore date spy
        });

        test('startPreLevelSequence should initialize state, clear objects, reset ship, and show level display', () => {
            game.level = 3; // Set a level
            game.asteroids = [{}]; // Add dummy objects to clear
            game.bullets = [{}];
            game.ufos = [{}];
            game.ufoBullets = [{}];
            game.powerUp = {};

            game.startPreLevelSequence();

            expect(game.preLevelState).toEqual({ countdown: 3, timerId: null });
            expect(game.asteroids).toEqual([]);
            expect(game.bullets).toEqual([]);
            expect(game.ufos).toEqual([]);
            expect(game.ufoBullets).toEqual([]);
            expect(game.powerUp).toBeNull();
            expect(mockShipInstance.vel).toEqual([0, 0]);
            expect(mockShipInstance.pos).toEqual([DIM_X / 2, DIM_Y / 2]);
            expect(mockShipInstance.angle).toBe(90);
            expect(mockShipInstance.reanimateSelf).toHaveBeenCalledTimes(1);
            expect(mockJQuery('#level-text').html).toHaveBeenCalledWith('Level 3');
            expect(mockJQuery).toHaveBeenCalledWith('#level-text');
            expect(mockJQuery('#level-display').removeClass).toHaveBeenCalledWith('hide');
            expect(mockJQuery).toHaveBeenCalledWith('#level-display');
            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
        });

        test('startPreLevelSequence timeout should hide level display and call handleCountdownTick', () => {
            jest.useFakeTimers();
            const handleCountdownTickSpy = jest.spyOn(game, 'handleCountdownTick');

            game.startPreLevelSequence(); // Starts a setTimeout

            // Run only the timer set by startPreLevelSequence
            jest.runOnlyPendingTimers();

            expect(mockJQuery('#level-display').addClass).toHaveBeenCalledWith('hide');
            expect(handleCountdownTickSpy).toHaveBeenCalledTimes(1);

            jest.useRealTimers();
            handleCountdownTickSpy.mockRestore();
        });

        test('handleCountdownTick (countdown > 0) should update UI and schedule next tick', () => {
            game.preLevelState = { countdown: 3, timerId: null };
            game.handleCountdownTick();

            expect(mockJQuery('#countdown-number').html).toHaveBeenCalledWith(3);
            expect(mockJQuery).toHaveBeenCalledWith('#countdown-number');
            expect(mockJQuery('#countdown-display').removeClass).toHaveBeenCalledWith('hide');
            expect(mockJQuery).toHaveBeenCalledWith('#countdown-display');
            expect(game.preLevelState.countdown).toBe(2);
            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
            expect(game.preLevelState.timerId).not.toBeNull(); // Timer ID should be set
            expect(startLevelGameplaySpy).not.toHaveBeenCalled();
        });

        test('handleCountdownTick (countdown <= 0) should hide UI, clear state, and start gameplay', () => {
            game.preLevelState = { countdown: 0, timerId: 555 }; // Start with countdown at 0
            game.handleCountdownTick();

            expect(mockJQuery('#countdown-display').addClass).toHaveBeenCalledWith('hide');
            expect(mockJQuery).toHaveBeenCalledWith('#countdown-display');
            expect(game.preLevelState).toBeNull();
            expect(startLevelGameplaySpy).toHaveBeenCalledTimes(1);
            expect(setTimeout).not.toHaveBeenCalled(); // Should not schedule another tick
        });

        test('handleCountdownTick should exit if preLevelState is null', () => {
            game.preLevelState = null;
            game.handleCountdownTick();
            expect(mockJQuery('#countdown-number').html).not.toHaveBeenCalled();
            expect(mockJQuery('#countdown-display').addClass).not.toHaveBeenCalled();
            expect(setTimeout).not.toHaveBeenCalled();
            expect(startLevelGameplaySpy).not.toHaveBeenCalled();
        });

        test('startLevelGameplay should set start time, add asteroids, clear objects, reset ship/timers', () => {
            dateSpy.mockReturnValue(1234567890); // Use the spy initialized in beforeEach
            game.level = 5;
            game.num_asteroids = 14; // Set expected number for level 5

            game.startLevelGameplay();

            expect(game.levelStartTime).toBe(1234567890);
            expect(addInitialAsteroidsSpy).toHaveBeenCalledWith(false); // Not attract mode
            expect(game.asteroids).toEqual([]); // Mocked to return empty
            expect(game.bullets).toEqual([]);
            expect(game.ufos).toEqual([]);
            expect(game.ufoBullets).toEqual([]);
            expect(game.powerUp).toBeNull();
            expect(resetPowerupSpawnTimerSpy).toHaveBeenCalledTimes(1);
            expect(game.powerUpSpawnTimer).toBe(100); // Mocked return value
            expect(mockShipInstance.pos).toEqual([DIM_X / 2, DIM_Y / 2]);
            expect(mockShipInstance.vel).toEqual([0, 0]);
            expect(mockShipInstance.isPoweredUp).toBe(false);
            expect(mockShipInstance.powerUpTimer).toBe(0);
            expect(mockShipInstance.reanimateSelf).toHaveBeenCalledTimes(1);

            dateSpy.mockRestore();
        });
        
        test('startLevelGameplay should call gameView.start if loop not running', () => {
            // Set up conditions where gameView might not have an intervalID
            // (Simulating a scenario where the loop stopped or wasn't running)
            window.gameView.intervalID = null; // Explicitly set intervalID to null
            window.gameView.start.mockClear(); // Clear calls from potential previous setups

            game.startLevelGameplay();

            expect(window.gameView.start).toHaveBeenCalledTimes(1); // Check the window.gameView mock
        });

         test('startLevelGameplay should NOT call gameView.start if loop is already running', () => {
             // Use the globally mocked window.gameView and simulate it running
             window.gameView.intervalID = 999; // Simulate loop running by setting ID
             window.gameView.start.mockClear(); // Ensure start wasn't called before

             game.startLevelGameplay();

             expect(window.gameView.start).not.toHaveBeenCalled();
         });
    });

    describe('advanceLevel', () => {
        let game;
        let startPreLevelSeqSpy;

        beforeEach(() => {
            game = new GameRef(DIM_X, DIM_Y);
            game.ship = new MockShip({ game: game }); 
            startPreLevelSeqSpy = jest.spyOn(game, 'startPreLevelSequence').mockImplementation(() => {}); 

            // Reset level-specific properties
            game.level = 1;
            game.base_num_asteroids = 10; // Use default
            game.num_asteroids = game.base_num_asteroids; // Sync
            game.base_min_asteroid_speed = 0.5; // Use default
            game.min_asteroid_speed = game.base_min_asteroid_speed; // Sync
            // Clear mock calls from constructor
            // sharedJQueryMethods.html.mockClear(); // Removed
            mockJQuery('#level').html.mockClear(); // Clear specific mock
        });

        afterEach(() => {
            startPreLevelSeqSpy.mockRestore();
        });

        test('should increment level', () => {
            const initialLevel = game.level;
            game.advanceLevel();
            expect(game.level).toBe(initialLevel + 1);
        });

        test('should update #level UI', () => {
            game.advanceLevel(); // Level becomes 2
            const levelElementMock = mockJQuery('#level');
            expect(levelElementMock.html).toHaveBeenCalledWith(2);
        });

        test('should calculate num_asteroids correctly (level <= 7)', () => {
            game.level = 3;
            game.advanceLevel(); // Level becomes 4
            const expectedAsteroids = game.base_num_asteroids + (4 - 1) * 1; // 10 + 3 = 13
            expect(game.num_asteroids).toBe(expectedAsteroids);
        });

        test('should calculate num_asteroids correctly (level > 7)', () => {
            game.level = 7;
            game.advanceLevel(); // Level becomes 8
            const asteroidsAtLevel7 = game.base_num_asteroids + 6; // 16
            const expectedAsteroids = asteroidsAtLevel7 + (8 - 7) * 2; // 16 + 2 = 18
            expect(game.num_asteroids).toBe(expectedAsteroids);
        });

        test('should calculate min_asteroid_speed correctly', () => {
            game.level = 5;
            game.advanceLevel(); // Level becomes 6
            const expectedSpeed = game.base_min_asteroid_speed + (6 - 1) * 0.1; // 0.5 + 0.5 = 1.0
            expect(game.min_asteroid_speed).toBeCloseTo(expectedSpeed);
        });

        test('should call startPreLevelSequence', () => {
            game.advanceLevel();
            expect(startPreLevelSeqSpy).toHaveBeenCalledTimes(1);
        });
    });

    // Test suite for Spawning Logic
    describe('Spawning Logic (getMaxUfosForLevel, maybeAddUfo, maybeSpawnPowerUp)', () => {

        describe('getMaxUfosForLevel', () => {
            test('should return 1 for level 1 (baseMax)', () => {
                expect(game.getMaxUfosForLevel(1)).toBe(1);
            });
            test('should return 1 for level 2', () => {
                expect(game.getMaxUfosForLevel(2)).toBe(1);
            });
            test('should return 2 for level 3', () => {
                expect(game.getMaxUfosForLevel(3)).toBe(2);
            });
            test('should return 6 for level 7', () => {
                expect(game.getMaxUfosForLevel(7)).toBe(6);
            });
            test('should return 8 for level 8', () => {
                expect(game.getMaxUfosForLevel(8)).toBe(8);
            });
            test('should return 12 for level 10', () => {
                expect(game.getMaxUfosForLevel(10)).toBe(12);
            });
        });

        describe('maybeAddUfo', () => {
            let isSpawningAllowedSpy, getMaxUfosSpy, addSpy, randomPosSpy;

            beforeEach(() => {
                // Spy on dependencies
                isSpawningAllowedSpy = jest.spyOn(game, 'isSpawningAllowed');
                getMaxUfosSpy = jest.spyOn(game, 'getMaxUfosForLevel');
                addSpy = jest.spyOn(game, 'add');
                randomPosSpy = jest.spyOn(game, 'randomPosition').mockReturnValue([100, 100]);
                game.ufos = []; // Ensure UFO list is clear
            });

            test('should not add UFO if spawning is not allowed', () => {
                isSpawningAllowedSpy.mockReturnValue(false);
                game.maybeAddUfo();
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should decrement timer but not add UFO if timer > 0', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                game.ufoSpawnTimer = 10;
                game.maybeAddUfo();
                expect(game.ufoSpawnTimer).toBe(9);
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should add UFO if conditions met (spawning allowed, timer <= 0, count < max)', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                getMaxUfosSpy.mockReturnValue(1); // Allow 1 UFO
                game.ufoSpawnTimer = 0;
                game.ufos = []; // No UFOs currently

                game.maybeAddUfo();

                expect(addSpy).toHaveBeenCalledTimes(1);
                expect(addSpy).toHaveBeenCalledWith(expect.any(MockUfo)); // Correct assertion is checking the spy call
            });

            test('should not add UFO if max UFOs reached', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                getMaxUfosSpy.mockReturnValue(1); // Allow 1 UFO
                game.ufoSpawnTimer = 0;
                game.ufos = [new MockUfo({})]; // Already have 1 UFO
                const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

                game.maybeAddUfo();

                expect(addSpy).not.toHaveBeenCalled();
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Max UFOs reached'));
                consoleLogSpy.mockRestore();
            });
        });

        describe('maybeSpawnPowerUp', () => {
            let isSpawningAllowedSpy, addSpy, randomPosSpy;

            beforeEach(() => {
                isSpawningAllowedSpy = jest.spyOn(game, 'isSpawningAllowed');
                addSpy = jest.spyOn(game, 'add');
                randomPosSpy = jest.spyOn(game, 'randomPosition').mockReturnValue([200, 200]);

                // **Ensure game.ship is a mock object before accessing its properties**
                game.ship = new MockShip({ game: game }); // Use the mock ship constructor

                game.powerUp = null; // Ensure no powerup exists
                game.ship.isPoweredUp = false; // Ensure ship is not powered up
            });

            test('should not spawn if spawning is not allowed', () => {
                isSpawningAllowedSpy.mockReturnValue(false);
                game.maybeSpawnPowerUp();
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should not spawn if a powerup already exists', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                game.powerUp = new MockPowerUp({}); // Simulate existing powerup
                game.maybeSpawnPowerUp();
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should not spawn if ship is already powered up', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                game.ship.isPoweredUp = true; // Simulate ship powered up
                game.maybeSpawnPowerUp();
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should decrement timer but not spawn if timer > 0', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                game.powerUpSpawnTimer = 50;
                game.maybeSpawnPowerUp();
                expect(game.powerUpSpawnTimer).toBe(49);
                expect(addSpy).not.toHaveBeenCalled();
            });

            test('should spawn powerup if conditions are met', () => {
                isSpawningAllowedSpy.mockReturnValue(true);
                game.powerUpSpawnTimer = 0;

                game.maybeSpawnPowerUp();

                expect(addSpy).toHaveBeenCalledTimes(1);
                expect(addSpy).toHaveBeenCalledWith(expect.any(MockPowerUp));
                // Verify the added powerup has the correct properties (using the game state)
                expect(game.powerUp).toBeInstanceOf(MockPowerUp);
                expect(game.powerUp.pos).toEqual([200, 200]);
            });

            test('should log error if Asteroids.PowerUp is not a function', () => {
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
                const originalPowerUp = window.Asteroids.PowerUp;
                window.Asteroids.PowerUp = undefined; // Simulate PowerUp not being defined

                isSpawningAllowedSpy.mockReturnValue(true);
                game.powerUpSpawnTimer = 0;

                game.maybeSpawnPowerUp();

                expect(addSpy).not.toHaveBeenCalled();
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL: Asteroids.PowerUp is NOT a function'));

                window.Asteroids.PowerUp = originalPowerUp; // Restore
                consoleErrorSpy.mockRestore();
            });
        });
    });

    // Test suite for Utility & Helper Methods
    describe('Utility & Helper Methods', () => {

        describe('wrap', () => {
            const objRadius = 10;
            test('should not wrap positions within bounds', () => {
                expect(game.wrap([100, 100], objRadius)).toEqual([100, 100]);
            });
            test('should wrap positions exceeding right edge', () => {
                // x = 850 % 820 = 30. x!=startX -> x = 30-10=20.
                expect(game.wrap([DIM_X + 50, 100], objRadius)).toEqual([20, 100]); // Corrected expectation
            });
             test('should wrap positions exceeding left edge', () => {
                // x = -11 % 820 = -11. x< -rad -> x = 800 + (20 + -11) = 809
                expect(game.wrap([-objRadius - 1, 100], objRadius)).toEqual([809, 100]); // Corrected expectation
             });
             test('should wrap positions exceeding bottom edge', () => {
                 // y = 650 % 620 = 30. y!=startY -> y = 30-10=20.
                 expect(game.wrap([100, DIM_Y + 50], objRadius)).toEqual([100, 20]); // Corrected expectation
             });
             test('should wrap positions exceeding top edge', () => {
                 // y = -11 % 620 = -11. y < -rad -> y = 600 + (20 + -11) = 609
                 expect(game.wrap([100, -objRadius - 1], objRadius)).toEqual([100, 609]); // Corrected expectation
             });
             test('should wrap corner case (bottom-right)', () => {
                 // x=820%820=0. x!=startX -> x=-10.
                 // y=630%620=10. y!=startY -> y=0.
                 expect(game.wrap([DIM_X + 20, DIM_Y + 30], objRadius)).toEqual([-10, 0]); // Corrected expectation
             });
        });

        describe('isOutOfBounds', () => {
            const objRadius = 5;
            test('should return false for positions within bounds', () => {
                expect(game.isOutOfBounds([100, 100], objRadius)).toBe(false);
                expect(game.isOutOfBounds([0, 0], objRadius)).toBe(false); // Edge is ok
                expect(game.isOutOfBounds([DIM_X, DIM_Y], objRadius)).toBe(false); // Edge is ok
            });
            test('should return true for positions outside bounds', () => {
                expect(game.isOutOfBounds([-objRadius - 1, 100], objRadius)).toBe(true); // Left
                expect(game.isOutOfBounds([DIM_X + objRadius + 1, 100], objRadius)).toBe(true); // Right
                expect(game.isOutOfBounds([100, -objRadius - 1], objRadius)).toBe(true); // Top
                expect(game.isOutOfBounds([100, DIM_Y + objRadius + 1], objRadius)).toBe(true); // Bottom
            });
        });

        describe('randomPosition', () => {
            test('should return coordinates within game bounds', () => {
                for (let i = 0; i < 50; i++) { // Check multiple times
                    const pos = game.randomPosition();
                    expect(pos[0]).toBeGreaterThanOrEqual(0);
                    expect(pos[0]).toBeLessThanOrEqual(DIM_X);
                    expect(pos[1]).toBeGreaterThanOrEqual(0);
                    expect(pos[1]).toBeLessThanOrEqual(DIM_Y);
                }
            });
        });

        describe('isSpawningAllowed', () => {
            // Keep using fake timers
            beforeEach(() => { jest.useFakeTimers('modern'); });
            afterEach(() => { jest.useRealTimers(); });

            test('should return false for level 1', () => {
                const START_DELAY_MS = GameRef.START_DELAY_SECONDS * 1000;
                game.level = 1;
                const currentTime = Date.now();
                jest.setSystemTime(currentTime);
                game.levelStartTime = currentTime;
                jest.advanceTimersByTime(START_DELAY_MS + 1000);
                expect(game.isSpawningAllowed()).toBe(false);
            });

            test('should return false if level >= 2 but time < START_DELAY', () => {
                const START_DELAY_MS = GameRef.START_DELAY_SECONDS * 1000;
                game.level = 2;
                const currentTime = Date.now();
                jest.setSystemTime(currentTime); // Set system time
                game.levelStartTime = currentTime;
                jest.advanceTimersByTime(START_DELAY_MS - 500); // Advance timers
                // Call isSpawningAllowed AFTER advancing time
                expect(game.isSpawningAllowed()).toBe(false);
            });

            test('should return true if level >= 2 and time >= START_DELAY', () => {
                const START_DELAY_MS = GameRef.START_DELAY_SECONDS * 1000;
                game.level = 2; // Level must be >= 2
                game.levelStartTime = Date.now(); // Set start time using real clock initially

                // Set the system time directly to ensure Date.now() returns the desired value
                const futureTime = game.levelStartTime + START_DELAY_MS + 500; // Time after delay
                jest.setSystemTime(futureTime);

                // Call isSpawningAllowed AFTER setting time
                expect(game.isSpawningAllowed()).toBe(true);

                // Restore system time if necessary (though Jest usually handles cleanup)
                // jest.useRealTimers(); // REMOVED - Let Jest handle cleanup
                // jest.useFakeTimers(); // REMOVED
            });

             test('should return true if levelStartTime is null (attract mode or similar)', () => {
                 // This test should now pass after the fix in game.js
                 game.level = 1; // Test with level 1 now, as the null check comes first
                 game.levelStartTime = null;
                 expect(game.isSpawningAllowed()).toBe(true);
             });
        });

        describe('secondsToFrames', () => {
            // Use GameRef.FRAME_RATE for consistency
            test('should convert seconds to frames correctly', () => {
                // Calculate expected values *inside* the test
                const expectedFrames1Sec = 1 * GameRef.FRAME_RATE;
                const expectedFramesHalfSec = 0.5 * GameRef.FRAME_RATE;
                const expectedFrames5Sec = 5 * GameRef.FRAME_RATE;

                expect(game.secondsToFrames(1)).toBeCloseTo(expectedFrames1Sec);
                expect(game.secondsToFrames(0.5)).toBeCloseTo(expectedFramesHalfSec);
                expect(game.secondsToFrames(5)).toBeCloseTo(expectedFrames5Sec);
            });

            test('should return 0 for 0 seconds', () => {
                expect(game.secondsToFrames(0)).toBe(0);
            });
        });

        describe('resetPowerupSpawnTimer', () => {
            test('should return a timer value within the defined min/max frames', () => {
                const MIN_FRAMES = GameRef.POWERUP_MIN_SPAWN_DELAY * (1000 / FRAME_RATE); // Calculate inside test
                const MAX_FRAMES = GameRef.POWERUP_MAX_SPAWN_DELAY * (1000 / FRAME_RATE); // Calculate inside test
                for (let i = 0; i < 100; i++) {
                    const timer = game.resetPowerupSpawnTimer();
                    expect(timer).toBeGreaterThanOrEqual(MIN_FRAMES);
                    expect(timer).toBeLessThanOrEqual(MAX_FRAMES);
                }
            });
        });

    });

}); // End of main describe('Asteroids.Game') 