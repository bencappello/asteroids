// __tests__/asteroid.test.js

describe('Asteroids.Asteroid', () => {
    let Asteroid;
    let MockMovingObject;
    let mockUtil;
    let mockGame;
    let MockShip;
    let MockImage;

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        // Mock dependencies in the Asteroids namespace
        window.Asteroids = window.Asteroids || {};

        // Mock Util functions
        mockUtil = {
            inherits: jest.fn(),
            generateVec: jest.fn().mockReturnValue([1, 1]), // Default mock velocity
            // Add other Util functions if needed by Asteroid
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject constructor AND make it copy properties
        MockMovingObject = jest.fn(function(args) {
            // Simulate the real constructor by copying properties
            this.pos = args.pos;
            this.vel = args.vel;
            this.radius = args.radius;
            this.game = args.game; // Crucially, assign the game object
            // Add any other properties MovingObject might assign
        });
        window.Asteroids.movingObject = MockMovingObject;

        // Mock Ship constructor/class for instanceof checks
        MockShip = jest.fn(function() {
            // Mock instance properties needed for tests
            this.suspended = false;
            this.isInvincible = false;
        });
        window.Asteroids.Ship = MockShip;

        // Mock the global Image constructor
        MockImage = jest.fn(function() {
            this.src = ''; // Mock the src property
        });
        global.Image = MockImage;

        // Mock the game object methods needed
        mockGame = {
            handleDeath: jest.fn(),
            // Add other game properties/methods if Asteroid uses them
        };

        // Now require the Asteroid script - it uses the mocks we just set up
        require('../lib/javascripts/asteroid.js');
        Asteroid = window.Asteroids.Asteroid;

        // Basic check that inherits was called correctly
        expect(mockUtil.inherits).toHaveBeenCalledWith(Asteroid, MockMovingObject);
    });

    // Reset mocks before each test
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockUtil.generateVec.mockClear();
        mockGame.handleDeath.mockClear();
        MockImage.mockClear();
         // Reset default mock velocity for generateVec if needed
         mockUtil.generateVec.mockReturnValue([1, 1]);
    });

    describe('Constructor', () => {
        test('should call MovingObject constructor with correct default parameters', () => {
            const options = { game: mockGame, min_speed: 0.5 }; // Provide minimum required options
             mockUtil.generateVec.mockReturnValueOnce([2, -1]); // Specific velocity for this test

            const asteroid = new Asteroid(options);

            // Check if MovingObject was called
            expect(MockMovingObject).toHaveBeenCalledTimes(1);

            // Check the arguments passed to MovingObject
            const movingObjectArgs = MockMovingObject.mock.calls[0][0];
            expect(movingObjectArgs.game).toBe(mockGame);
            expect(movingObjectArgs.pos).toEqual(options.pos); // pos is passed through
            expect(movingObjectArgs.vel).toEqual([2, -1]); // Should use generateVec result
            expect(movingObjectArgs.radius).toBeGreaterThanOrEqual(20);
            expect(movingObjectArgs.radius).toBeLessThanOrEqual(50); // Default random range
             // Check other properties were set on the instance
            expect(asteroid.magnitude).toBeGreaterThanOrEqual(0.5); // Check min_speed applied
            expect(asteroid.magnitude).toBeLessThan(1.3); // 0.8 + 0.5
            expect(asteroid.rotation).toBeGreaterThanOrEqual(0);
            expect(asteroid.rotation).toBeLessThan(0.04);
            expect(asteroid.angleInRadians).toBe(0);
        });

        test('should use provided velocity and radius if available', () => {
             const options = {
                game: mockGame,
                min_speed: 0.5,
                vel: [5, 5],
                radius: 15,
                pos: [100, 100] // Ensure pos is passed
            };
            const asteroid = new Asteroid(options);

            expect(MockMovingObject).toHaveBeenCalledTimes(1);
            const movingObjectArgs = MockMovingObject.mock.calls[0][0];
            expect(movingObjectArgs.vel).toEqual([5, 5]); // Should use provided vel
            expect(movingObjectArgs.radius).toBe(15); // Should use provided radius
            expect(movingObjectArgs.pos).toEqual([100, 100]);
            expect(mockUtil.generateVec).not.toHaveBeenCalled(); // Should not generate vec if provided
        });

         test('should create and set Image source', () => {
            const options = { game: mockGame, min_speed: 0.5 };
            const asteroid = new Asteroid(options);

            expect(MockImage).toHaveBeenCalledTimes(1);
            // Access the instance created by the mock constructor
            const imageInstance = MockImage.mock.instances[0];
            expect(imageInstance.src).toBe('lib/images/asteroid.png');
            expect(asteroid.img).toBe(imageInstance);
         });
    });

    describe('collideWith', () => {
        let asteroid;
        let mockShipInstance;

        beforeEach(() => {
            asteroid = new Asteroid({ game: mockGame, min_speed: 1, pos: [0,0], radius: 10});
             // Create a mock instance that passes instanceof Asteroids.Ship
             mockShipInstance = new MockShip();
             mockShipInstance.constructor = MockShip; // Ensure constructor matches for instanceof
        });

        test('should call game.handleDeath if colliding with a non-invincible, non-suspended Ship', () => {
             mockShipInstance.isInvincible = false;
             mockShipInstance.suspended = false;

             asteroid.collideWith(mockShipInstance);
             expect(mockGame.handleDeath).toHaveBeenCalledTimes(1);
        });

        test('should NOT call game.handleDeath if colliding with an invincible Ship', () => {
            mockShipInstance.isInvincible = true;
            mockShipInstance.suspended = false;

            asteroid.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        test('should NOT call game.handleDeath if colliding with a suspended Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = true;

            asteroid.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        test('should NOT call game.handleDeath if colliding with non-Ship object', () => {
            const otherObject = { someProperty: 'value' }; // Not an instance of Ship
            asteroid.collideWith(otherObject);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

         test('should NOT call game.handleDeath if colliding with another Asteroid', () => {
            const anotherAsteroid = new Asteroid({ game: mockGame, min_speed: 1, pos:[5,5], radius: 5 });
            asteroid.collideWith(anotherAsteroid);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });
    });

     describe('draw', () => {
        // Testing canvas draw methods requires more complex mocking of the context (ctx)
        test.todo('should call context methods (save, translate, rotate, drawImage, restore) correctly');
    });

}); 