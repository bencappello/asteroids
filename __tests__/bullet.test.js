// __tests__/bullet.test.js

describe('Asteroids.Bullet', () => {
    let Bullet;
    let MockMovingObject;
    let mockUtil;
    let mockGame;
    let MockAsteroid;
    let MockUfo;
    let MockAsteroidExplosion;
    let mockAsteroidExplosionInstance;
    let MockImage;
    let mockJQuery;

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = {
            inherits: jest.fn(),
            generateVec: jest.fn().mockReturnValue([1, 1]),
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos;
            this.vel = args.vel;
            this.radius = args.radius;
            this.game = args.game;
        });
        window.Asteroids.movingObject = MockMovingObject;

        // Mock Asteroid
        MockAsteroid = jest.fn(function(args) {
             // Simulate instance properties needed for collision logic
             this.pos = args.pos;
             this.radius = args.radius;
             this.magnitude = args.mag || 1;
             this.direction = args.direction || 0;
             this.rotation = args.rotation || 0.01;
             this.game = args.game;
        });
        window.Asteroids.Asteroid = MockAsteroid;

        // Mock Ufo
        MockUfo = jest.fn(function(args) {
            this.pos = args.pos || [0, 0];
            this.radius = args.radius || 15;
            this.game = args.game;
        });
        window.Asteroids.Ufo = MockUfo;

        // Mock AsteroidExplosion
        mockAsteroidExplosionInstance = { explode: jest.fn() };
        MockAsteroidExplosion = jest.fn(() => mockAsteroidExplosionInstance);
        window.Asteroids.AsteroidExplosion = MockAsteroidExplosion;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock Game
        mockGame = {
            remove: jest.fn(),
            add: jest.fn(),
            score: 0,
             // Mock Game constants if needed (e.g., LARGE_ASTEROID_RADIUS_REDUCTION)
             // Might be better to define them globally if they are accessed directly
             LARGE_ASTEROID_RADIUS_REDUCTION: 0.5, // Example value
        };
         // Assign Game class globally if needed by Bullet code directly
         global.Game = { LARGE_ASTEROID_RADIUS_REDUCTION: 0.5 };

        // Mock jQuery
        mockJQuery = jest.fn(() => ({
            html: jest.fn() // Mock the .html() method
        }));
        global.$ = mockJQuery;

        // --- Require the script ---
        require('../lib/javascripts/bullet.js');
        Bullet = window.Asteroids.Bullet;

        // Check inherits call
        expect(mockUtil.inherits).toHaveBeenCalledWith(Bullet, MockMovingObject);
    });

    // Reset mocks
    let bullet;
    let bulletOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockUtil.generateVec.mockClear();
        mockGame.remove.mockClear();
        mockGame.add.mockClear();
        MockAsteroid.mockClear();
        MockUfo.mockClear();
        MockAsteroidExplosion.mockClear();
        mockAsteroidExplosionInstance.explode.mockClear();
        MockImage.mockClear();
        mockJQuery.mockClear();
        if (mockJQuery.mock.results[0] && mockJQuery.mock.results[0].value) {
             mockJQuery.mock.results[0].value.html.mockClear(); // Clear calls to the .html() mock
        }
        mockGame.score = 0; // Reset score

        bulletOptions = {
            pos: [10, 20],
            vel: [1, 1],
            game: mockGame
        };
        bullet = new Bullet(bulletOptions);
    });

    describe('Constructor', () => {
        test('should initialize default properties and call MovingObject', () => {
            expect(bullet.radius).toBe(Bullet.RADIUS);
            expect(bullet.isWrappable).toBe(false); // Check prototype override

            expect(MockMovingObject).toHaveBeenCalledTimes(1);
            const movingObjectArgs = MockMovingObject.mock.calls[0][0];
            expect(movingObjectArgs.pos).toEqual(bulletOptions.pos);
            expect(movingObjectArgs.vel).toEqual(bulletOptions.vel);
            expect(movingObjectArgs.radius).toBe(Bullet.RADIUS);
            expect(movingObjectArgs.game).toBe(mockGame);
        });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalledTimes(1);
            const imageInstance = MockImage.mock.instances[0];
            expect(imageInstance.src).toBe('lib/images/fireball.png');
            expect(bullet.img).toBe(imageInstance);
        });
    });

    describe('collideWith (Asteroid)', () => {
        let mockAsteroidInstance;
        beforeEach(() => {
             // This creates one instance, clear mock calls after this
             mockAsteroidInstance = new MockAsteroid({
                 pos: [12, 22], // Close enough for collision
                 radius: 25, // Large enough to split
                 mag: 2,
                 direction: 45,
                 game: mockGame
             });
             // Ensure instanceof works
             mockAsteroidInstance.constructor = MockAsteroid;
             // Clear calls from this setup so tests only count calls within collideWith
             MockAsteroid.mockClear();
        });

        test('should add AsteroidExplosion', () => {
             bullet.collideWith(mockAsteroidInstance);
             expect(MockAsteroidExplosion).toHaveBeenCalledTimes(1);
             expect(MockAsteroidExplosion).toHaveBeenCalledWith({
                 pos: mockAsteroidInstance.pos,
                 radius: mockAsteroidInstance.radius
             });
             expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance);
             expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
        });

        test('should remove asteroid and bullet', () => {
            bullet.collideWith(mockAsteroidInstance);
            expect(mockGame.remove).toHaveBeenCalledWith(mockAsteroidInstance);
            expect(mockGame.remove).toHaveBeenCalledWith(bullet);
            expect(mockGame.remove).toHaveBeenCalledTimes(2);
        });

        test('should increase score by 100', () => {
             bullet.collideWith(mockAsteroidInstance);
             expect(mockGame.score).toBe(100);
             expect(mockJQuery).toHaveBeenCalledWith('#score');
             expect(mockJQuery.mock.results[0].value.html).toHaveBeenCalledWith(100);
        });

        test('should add two new smaller asteroids if original radius >= 20', () => {
            mockAsteroidInstance.radius = 30; // Ensure it splits
            bullet.collideWith(mockAsteroidInstance);

            expect(mockGame.add).toHaveBeenCalledTimes(3); // Explosion + 2 new asteroids
            expect(MockAsteroid).toHaveBeenCalledTimes(2); // Constructor called twice for new ones

            // Check properties of the new asteroids
             const call1Args = MockAsteroid.mock.calls[0][0];
             const call2Args = MockAsteroid.mock.calls[1][0];

             // Radius reduction depends on original radius
             const expectedRadiusReduction = 0.7; // Because 30 <= 30
             const expectedNewRadius = mockAsteroidInstance.radius * expectedRadiusReduction; // 21

             expect(call1Args.radius).toBeCloseTo(expectedNewRadius);
             expect(call1Args.pos).toEqual(mockAsteroidInstance.pos); // Start at same position
             expect(call1Args.game).toBe(mockGame);
             expect(call1Args.mag).toBe(mockAsteroidInstance.magnitude); // Uses original magnitude
             expect(call1Args.rotation).toBe(mockAsteroidInstance.rotation); // Uses original rotation

             expect(call2Args.radius).toBeCloseTo(expectedNewRadius);
             expect(call2Args.pos).toEqual(mockAsteroidInstance.pos);
             expect(call2Args.game).toBe(mockGame);
             expect(call2Args.mag).toBe(mockAsteroidInstance.magnitude);
             expect(call2Args.rotation).toBe(mockAsteroidInstance.rotation);

             // Check velocity generation was called twice with offset directions
             expect(mockUtil.generateVec).toHaveBeenCalledTimes(2);
             expect(mockUtil.generateVec).toHaveBeenCalledWith(expect.any(Number), mockAsteroidInstance.direction + 30);
             expect(mockUtil.generateVec).toHaveBeenCalledWith(expect.any(Number), mockAsteroidInstance.direction - 30);
        });

         test('should use Game.LARGE_ASTEROID_RADIUS_REDUCTION if original radius > 30', () => {
             mockAsteroidInstance.radius = 40; // > 30
             // Mock Game constant access if needed, assume mockGame has it for now
             mockGame.LARGE_ASTEROID_RADIUS_REDUCTION = 0.5;
             bullet.collideWith(mockAsteroidInstance);

             expect(mockGame.add).toHaveBeenCalledTimes(3);
             expect(MockAsteroid).toHaveBeenCalledTimes(2);

             const call1Args = MockAsteroid.mock.calls[0][0];
             const expectedNewRadius = mockAsteroidInstance.radius * mockGame.LARGE_ASTEROID_RADIUS_REDUCTION; // 40 * 0.5 = 20
             expect(call1Args.radius).toBeCloseTo(expectedNewRadius);
        });

        test('should NOT add new asteroids if original radius < 20', () => {
            mockAsteroidInstance.radius = 15; // Too small to split
            bullet.collideWith(mockAsteroidInstance);

            expect(mockGame.add).toHaveBeenCalledTimes(1); // Only the explosion
            expect(MockAsteroid).not.toHaveBeenCalled(); // No new asteroids created
            expect(mockGame.remove).toHaveBeenCalledTimes(2); // Asteroid + Bullet removed
            expect(mockGame.score).toBe(100);
        });
    });

     describe('collideWith (Ufo)', () => {
         let mockUfoInstance;
         beforeEach(() => {
             mockUfoInstance = new MockUfo({
                 pos: [11, 21],
                 radius: 15,
                 game: mockGame
             });
             mockUfoInstance.constructor = MockUfo; // For instanceof
         });

         test('should add AsteroidExplosion (using UFO properties)', () => {
             bullet.collideWith(mockUfoInstance);
             expect(MockAsteroidExplosion).toHaveBeenCalledTimes(1);
             expect(MockAsteroidExplosion).toHaveBeenCalledWith({
                 pos: mockUfoInstance.pos,
                 radius: mockUfoInstance.radius // Uses UFO radius
             });
             expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance);
             expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
         });

         test('should remove UFO and bullet', () => {
            bullet.collideWith(mockUfoInstance);
            expect(mockGame.remove).toHaveBeenCalledWith(mockUfoInstance);
            expect(mockGame.remove).toHaveBeenCalledWith(bullet);
            expect(mockGame.remove).toHaveBeenCalledTimes(2);
        });

        test('should increase score by 500', () => {
             bullet.collideWith(mockUfoInstance);
             expect(mockGame.score).toBe(500);
             expect(mockJQuery).toHaveBeenCalledWith('#score');
             expect(mockJQuery.mock.results[0].value.html).toHaveBeenCalledWith(500);
        });

         test('should not split UFO', () => {
             bullet.collideWith(mockUfoInstance);
             expect(mockGame.add).toHaveBeenCalledTimes(1); // Only explosion added
             expect(MockAsteroid).not.toHaveBeenCalled(); // No asteroids created
         });
     });

     describe('collideWith (Other)', () => {
         test('should do nothing if colliding with non-Asteroid, non-Ufo', () => {
             const otherObject = { constructor: function NotAsteroidOrUfo(){} }; // Fails instanceof
             const initialScore = mockGame.score;
             bullet.collideWith(otherObject);

             expect(mockGame.add).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();
             expect(mockGame.score).toBe(initialScore);
             expect(mockJQuery).not.toHaveBeenCalled();
         });

         test('should do nothing if colliding with Ship', () => {
             const MockShip = jest.fn(); // Simple mock for instanceof
             const mockShipInstance = new MockShip();
             mockShipInstance.constructor = MockShip;
             window.Asteroids.Ship = MockShip; // Temporarily replace global for instanceof

             bullet.collideWith(mockShipInstance);
             expect(mockGame.add).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();

             // Restore original or undefined
             // This assumes the original test setup might have defined Asteroids.Ship
             // A better approach might be to snapshot/restore the entire Asteroids object
             // if other tests rely on the actual Ship constructor mock.
             // For now, just undefine it if it wasn't there before.
             if (global.__PREV_ASTEROIDS_SHIP__ === undefined) delete window.Asteroids.Ship;
             else window.Asteroids.Ship = global.__PREV_ASTEROIDS_SHIP__;
         });
     });

    describe('draw', () => {
        test.todo('should call context drawImage correctly');
    });

}); 