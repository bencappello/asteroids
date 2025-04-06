// __tests__/bullet.test.js

// No direct require for Util here

describe('Bullet', () => {
    let Bullet;
    let MockMovingObject, MockShip, MockAsteroid, MockUfo, MockAsteroidExplosion;
    let game, mockCtx;
    let mockHtmlFn; // Variable for the jQuery html mock function

    // Store original Image if it exists
    const OriginalImage = global.Image;

    beforeAll(() => {
        jest.resetModules(); // Reset modules first

        // --- Global Setup ---
        if (typeof window === 'undefined') { global.window = global; }
        if (typeof document === 'undefined') { global.document = { querySelector: jest.fn(() => ({ innerHTML: '' })) }; }
        window.Asteroids = window.Asteroids || {};

        // --- Mock Dependencies BEFORE requiring Bullet ---

        // Mock Image constructor globally
        global.Image = jest.fn(function() {
            // Mock properties/methods used by the code
            this.src = '';
            // Mock onload/onerror if necessary
            // this.onload = jest.fn();
            // this.onerror = jest.fn();
            // You might need to simulate loading by calling onload later if draw depends on it
            return this;
        });

        // Mock MovingObject: Only mock properties set by the actual constructor
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos;
            this.vel = args.vel;
            this.radius = args.radius;
            this.color = args.color;
            this.game = args.game;
            this.type = 'MovingObject';
            // DO NOT mock prototype methods like draw, move, collideWith here.
            // The inherits mock below handles the prototype chain.
        });
        window.Asteroids.movingObject = MockMovingObject;

        // Mock Util methods (INCLUDING inherits)
        window.Asteroids.Util = window.Asteroids.Util || {};
        // Use the inherits mock with Object.assign
        window.Asteroids.Util.inherits = jest.fn((ChildClass, BaseClass) => {
            function Surrogate() {} 
            if (BaseClass && BaseClass.prototype) {
                Surrogate.prototype = BaseClass.prototype;
                const newProto = new Surrogate();
                Object.assign(newProto, ChildClass.prototype);
                ChildClass.prototype = newProto;
                ChildClass.prototype.constructor = ChildClass;
            } else {
                console.error("Mock inherits: Attempted to inherit from invalid BaseClass:", BaseClass);
            }
        });
        window.Asteroids.Util.generateVec = jest.fn(() => [1, 1]);

        // Mock other constructors
        MockAsteroidExplosion = jest.fn(function(args) { 
            this.radius = args.radius;
            this.pos = args.pos; // Capture pos
            this.game = args.game; // Capture game
            this.type = 'Explosion'; // Add type
            this.explode = jest.fn(); // Mock the explode method
        });
        window.Asteroids.AsteroidExplosion = MockAsteroidExplosion;
        MockShip = jest.fn(function(args = {}) { 
            this.type = 'Ship';
            this.pos = args.pos || [0,0];
            this.radius = args.radius || 20; // Hardcode default Ship radius
        });
        window.Asteroids.Ship = MockShip;
        MockAsteroid = jest.fn(function(args = {}) {
            this.type = 'Asteroid';
            this.radius = args.radius; // Expect radius to be passed
             this.pos = args.pos;
            this.magnitude = args.magnitude === undefined ? 1 : args.magnitude; // Default mag if not passed
            this.direction = args.direction === undefined ? 0 : args.direction; // Default dir if not passed
        });
        window.Asteroids.Asteroid = MockAsteroid;
        MockUfo = jest.fn(function(args = {}) {
            this.type = 'Ufo';
            this.radius = args.radius || 25; // Hardcode default UFO radius
            this.pos = args.pos;
        });
        window.Asteroids.Ufo = MockUfo;

        // Mock Game constants
        window.Asteroids.Game = {
            DIM_X: 1000,
            DIM_Y: 600,
            LARGE_ASTEROID_RADIUS_REDUCTION: 0.5
        };

        // --- Require Bullet AFTER mocks are set up ---
        Bullet = require('../lib/javascripts/bullet.js');
    });

    afterAll(() => {
      // Restore original Image constructor
      global.Image = OriginalImage;
      // Clean up globals
      delete window.Asteroids;
      delete global.$;
      if (global.document === document) { delete global.document; }
    });

    beforeEach(() => {
        // Reset mocks before each test
        MockMovingObject.mockClear();
        if (window.Asteroids.Util.generateVec.mockClear) window.Asteroids.Util.generateVec.mockClear();
        MockAsteroidExplosion.mockClear();
        MockShip.mockClear();
        MockAsteroid.mockClear();
        MockUfo.mockClear();

        // Mock game object anew
        game = {
            add: jest.fn(),
            remove: jest.fn(),
            bullets: [], asteroids: [], ships: [], ufos: [], explosions: [],
            score: 0, lives: 3,
            updateScoreDisplay: jest.fn(), // Mock this if Bullet calls it directly
            isOutOfBounds: jest.fn().mockReturnValue(false)
        };

        // Mock jQuery anew
        mockHtmlFn = jest.fn();
        global.$ = jest.fn(() => ({ html: mockHtmlFn }));

        // Mock canvas context with all methods used by draw
        mockCtx = {
            save: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            drawImage: jest.fn(),
            restore: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            fillStyle: '',
            fill: jest.fn(),
            strokeStyle: '',
            lineWidth: 0,
            stroke: jest.fn()
        };

        // Clear mocks that might have been called during setup
        mockHtmlFn.mockClear();
        global.$.mockClear();

        // Clear Image mock instances/calls if necessary
        // It's usually better to clear this here if tests might create Images independently
        if (global.Image && jest.isMockFunction(global.Image)) {
             global.Image.mockClear();
        }
    });

    // --- Tests ---

    test('should inherit from MovingObject', () => {
        // Check inherits mock was called once during require() in beforeAll
        expect(window.Asteroids.Util.inherits).toHaveBeenCalledTimes(1);
        expect(window.Asteroids.Util.inherits).toHaveBeenCalledWith(Bullet, MockMovingObject);
        // Restore prototype check
        expect(Object.getPrototypeOf(Bullet.prototype)).toBe(MockMovingObject.prototype);

        // Create a NEW instance specifically for this test
        MockMovingObject.mockClear();
        const testBullet = new Bullet({ pos: [1,1], vel: [0,0], game: game });
            expect(MockMovingObject).toHaveBeenCalledTimes(1);
    });

    test('constructor should set properties correctly', () => {
        const args = { pos: [10, 20], vel: [1, -1], game: game };
        const testBullet = new Bullet(args); // Create instance

        // Check if MockMovingObject was called with combined args
        expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
            pos: args.pos,
            vel: args.vel,
            radius: 5, // Bullet specific radius
            color: '#ff0000', // Bullet specific color
            game: args.game
        }));
        // Check bullet-specific properties set AFTER constructor call
        expect(testBullet.isWrappable).toBe(false); // Overrides movingObject default
    });

    test('isWrappable should be false', () => {
      const testBullet = new Bullet({ pos: [0,0], vel: [0,0], game: game });
      expect(testBullet.isWrappable).toBe(false);
    });

    test('draw should call ctx.drawImage', () => {
        const testBullet = new Bullet({ pos: [100, 100], vel: [0, 0], game: game });
        mockCtx.drawImage.mockClear();
        // This should now call the REAL Bullet.prototype.draw
        testBullet.draw(mockCtx);
        expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
        expect(mockCtx.drawImage).toHaveBeenCalledWith(
            expect.any(global.Image),
            expect.any(Number),
            expect.any(Number),
            testBullet.radius * 2,
            testBullet.radius * 2
        );
    });

    describe('collideWith', () => {
        let testBullet;
        beforeEach(() => {
             // Top-level beforeEach for collideWith tests
             testBullet = new Bullet({ pos: [50, 50], vel: [1, 0], game: game });
             // Clear mocks relevant to collision outcomes
             game.add.mockClear();
             game.remove.mockClear();
             MockAsteroidExplosion.mockClear();
             MockAsteroid.mockClear();
             MockUfo.mockClear(); // Also clear Ufo mock here
             MockShip.mockClear(); // Also clear Ship mock here
             MockAsteroidExplosion.mock.instances.forEach(inst => inst.explode.mockClear());
             game.score = 0; 
             mockHtmlFn.mockClear();
             global.$.mockClear();
        });

        test('should do nothing if colliding with Ship', () => {
            const ship = new MockShip(); // Creates mock with type: 'Ship'
            testBullet.collideWith(ship);
            expect(game.remove).not.toHaveBeenCalled();
            expect(game.add).not.toHaveBeenCalled();
        });

        test('should do nothing if colliding with another Bullet', () => {
             const otherBullet = new Bullet({ pos: [51, 50], vel: [-1, 0], game: game });
             // Bullet constructor sets type: 'Bullet'
             testBullet.collideWith(otherBullet);
             expect(game.remove).not.toHaveBeenCalled();
             expect(game.add).not.toHaveBeenCalled();
        });

        describe('Asteroid', () => {
            test('should create/add explosion AND split asteroids if radius >= 20', () => {
                // Create asteroid within the test
                let asteroid = new MockAsteroid({ radius: 25, pos: [52, 50], magnitude: 1, direction: 0 });
                window.Asteroids.Util.generateVec.mockReturnValueOnce([1, 1]).mockReturnValueOnce([-1, -1]);
                testBullet.collideWith(asteroid);
                expect(game.add).toHaveBeenCalledTimes(3);
                expect(MockAsteroidExplosion).toHaveBeenCalledTimes(1);
                // Check the target asteroid was constructed + 2 splits
                expect(MockAsteroid).toHaveBeenCalledTimes(3); 
                // Optionally verify the constructor calls more specifically if needed
            });

            test('should remove both bullet and asteroid', () => {
                 // Create asteroid within the test (radius 25 WILL split)
                 let asteroid = new MockAsteroid({ radius: 25, pos: [52, 50] });
                 testBullet.collideWith(asteroid);
                 expect(game.remove).toHaveBeenCalledTimes(2);
                 expect(game.remove).toHaveBeenCalledWith(testBullet);
                 expect(game.remove).toHaveBeenCalledWith(asteroid);
                 // Check asteroid constructor: 1 for target + 2 for splits = 3
                 expect(MockAsteroid).toHaveBeenCalledTimes(3);
            });

             test('should increase game score by 100', () => {
                 // Create asteroid within the test (radius 25 WILL split)
                 let asteroid = new MockAsteroid({ radius: 25, pos: [52, 50] });
                 testBullet.collideWith(asteroid);
                 expect(game.score).toBe(100);
                 expect(global.$).toHaveBeenCalledWith('#score'); 
                 expect(mockHtmlFn).toHaveBeenCalledWith(100);
                 // Check asteroid constructor: 1 for target + 2 for splits = 3
                 expect(MockAsteroid).toHaveBeenCalledTimes(3);
            });

            test('should NOT split asteroid if radius < 20', () => {
                 // Create asteroid within the test
                 let asteroid = new MockAsteroid({ radius: 15, pos: [52, 50] });
                 testBullet.collideWith(asteroid);
                 expect(game.add).toHaveBeenCalledTimes(1); 
                 expect(MockAsteroidExplosion).toHaveBeenCalledTimes(1);
                 // Check the target asteroid was constructed, but NO splits
                 expect(MockAsteroid).toHaveBeenCalledTimes(1);
            });

             test('should split asteroid if radius >= 20 (using specific reduction for <= 30)', () => {
                 // Create asteroid within the test
                 let asteroid = new MockAsteroid({ radius: 25, pos: [52, 50], magnitude: 1, direction: 0 });
                 window.Asteroids.Util.generateVec.mockReturnValueOnce([1, 1]).mockReturnValueOnce([-1, -1]);
                 testBullet.collideWith(asteroid);
                 expect(game.add).toHaveBeenCalledTimes(3);
                 // Check the target asteroid was constructed + 2 splits
                 expect(MockAsteroid).toHaveBeenCalledTimes(3); 
                 const expectedRadius = 25 * 0.7;
                 expect(MockAsteroid).toHaveBeenCalledWith(expect.objectContaining({ radius: expectedRadius, pos: asteroid.pos }));
             });

              test('should split asteroid if radius > 30 (using default reduction)', () => {
                 // Create asteroid within the test
                 let asteroid = new MockAsteroid({ radius: 40, pos: [52, 50], magnitude: 1, direction: 0 });
                 window.Asteroids.Util.generateVec.mockReturnValueOnce([1, 1]).mockReturnValueOnce([-1, -1]);
                 testBullet.collideWith(asteroid);
                 expect(game.add).toHaveBeenCalledTimes(3);
                 // Check the target asteroid was constructed + 2 splits
                 expect(MockAsteroid).toHaveBeenCalledTimes(3);
                 const expectedRadius = 40 * window.Asteroids.Game.LARGE_ASTEROID_RADIUS_REDUCTION;
                 expect(MockAsteroid).toHaveBeenCalledWith(expect.objectContaining({ radius: expectedRadius, pos: asteroid.pos }));
             });
        });

        describe('Ufo', () => {
            test('should create and add an AsteroidExplosion (using UFO radius)', () => {
                // Create ufo within the test
                let ufo = new MockUfo({ radius: 20, pos: [55, 55] });
                testBullet.collideWith(ufo);
                expect(game.add).toHaveBeenCalledTimes(1); 
                expect(MockAsteroidExplosion).toHaveBeenCalledTimes(1);
                // Check ufo constructor called once
                expect(MockUfo).toHaveBeenCalledTimes(1);
            });

            test('should remove both bullet and UFO', () => {
                 // Create ufo within the test
                 let ufo = new MockUfo({ radius: 20, pos: [55, 55] });
                 testBullet.collideWith(ufo);
                 expect(game.remove).toHaveBeenCalledTimes(2);
                 // Check ufo constructor called once
                 expect(MockUfo).toHaveBeenCalledTimes(1);
            });

            test('should increase game score by 500', () => {
                 // Create ufo within the test
                 let ufo = new MockUfo({ radius: 20, pos: [55, 55] });
                 testBullet.collideWith(ufo);
                 expect(game.score).toBe(500);
                 // Check ufo constructor called once
                 expect(MockUfo).toHaveBeenCalledTimes(1);
         });
     });
    });
}); 