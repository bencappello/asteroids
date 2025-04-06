// __tests__/asteroid.test.js

describe('Asteroids.Asteroid', () => {
    let Asteroid;
    let MockMovingObject;
    let mockUtil;
    let mockGame;
    let MockShip;
    let MockImage;
    let originalMathRandom;
    let mockCtx;

    beforeAll(() => {
        jest.resetModules();
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = {
            inherits: jest.fn((ChildClass, BaseClass) => {
                function Surrogate() {} 
                if (BaseClass && BaseClass.prototype) {
                    Surrogate.prototype = BaseClass.prototype;
                    const newProto = new Surrogate();
                    Object.assign(newProto, ChildClass.prototype);
                    ChildClass.prototype = newProto;
                    ChildClass.prototype.constructor = ChildClass;
                } else { console.error("Mock inherits invalid BaseClass"); }
            }),
            generateVec: jest.fn().mockReturnValue([1, 0]), // Default vector
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos; this.vel = args.vel; this.radius = args.radius; this.game = args.game; this.type = 'MovingObject';
        });
        MockMovingObject.prototype = {}; // Define prototype for inherits
        window.Asteroids.movingObject = MockMovingObject;

        // Mock Ship
        MockShip = jest.fn(function(args={}) {
            this.type = 'Ship';
            this.suspended = args.suspended !== undefined ? args.suspended : false;
            this.isInvincible = args.isInvincible !== undefined ? args.isInvincible : false;
        });
        window.Asteroids.Ship = MockShip;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock Game
        mockGame = {
            handleDeath: jest.fn(),
        };

        // Mock Math.random
        originalMathRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.5);

        // --- Require the script ---
        Asteroid = require('../lib/javascripts/asteroid.js');
    });

    afterAll(() => {
        Math.random = originalMathRandom;
        jest.restoreAllMocks();
    });

    let asteroid;
    let asteroidOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockUtil.generateVec.mockClear();
        mockGame.handleDeath.mockClear();
        MockShip.mockClear();
        MockImage.mockClear();
        Math.random.mockClear().mockReturnValue(0.5);

        // Mock context
        mockCtx = {
            save: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            drawImage: jest.fn(),
            restore: jest.fn(),
        };

        asteroidOptions = {
            pos: [100, 100],
            game: mockGame,
            min_speed: 0 // Ensure min_speed is defined for constructor
        };
        // Create instance here for convenience, but some tests might need specific args
        asteroid = new Asteroid(asteroidOptions);
    });

    describe('Constructor', () => {
        test('should set default and calculated properties', () => {
            const asteroidInstance = new Asteroid({ pos: [1,1], game: mockGame, min_speed: 0.1 });
            expect(asteroidInstance.game).toBe(mockGame);
            expect(asteroidInstance.type).toBe('Asteroid');
            expect(asteroidInstance.pos).toEqual([1,1]);
            expect(asteroidInstance.angleInRadians).toBe(0);
            // Check random/calculated properties
            expect(asteroidInstance.direction).toBeLessThanOrEqual(360);
            expect(asteroidInstance.direction).toBeGreaterThanOrEqual(0);
            expect(asteroidInstance.magnitude).toBeGreaterThanOrEqual(0.1);
            expect(asteroidInstance.radius).toBeGreaterThanOrEqual(20); 
            expect(asteroidInstance.radius).toBeLessThanOrEqual(50); 
            expect(asteroidInstance.rotation).toBeLessThanOrEqual(0.04);
            expect(asteroidInstance.rotation).toBeGreaterThanOrEqual(0);
            expect(mockUtil.generateVec).toHaveBeenCalled(); // Should be called if vel not provided
        });

        test('should use provided velocity and radius', () => {
             mockUtil.generateVec.mockClear();
             const options = { pos: [1,1], game: mockGame, vel: [5,5], radius: 15 };
             const asteroidInstance = new Asteroid(options);
             expect(mockUtil.generateVec).not.toHaveBeenCalled();
             expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
                 vel: [5,5],
                 radius: 15,
                 pos: [1,1],
                 game: mockGame,
                 color: '#808080'
             }));
             expect(asteroidInstance.radius).toBe(15);
        });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalled(); // Called at least once
            const imageInstance = asteroid.img; // Get from instance created in beforeEach
            expect(imageInstance).toBeInstanceOf(MockImage);
            expect(imageInstance.src).toBe('lib/images/asteroid.png');
        });
    });

    describe('collideWith', () => {
        let mockShipInstance;

        beforeEach(() => {
            // Create mocks with type
            mockShipInstance = new MockShip();
            mockGame.handleDeath.mockClear(); // Clear specifically for these tests
        });

        test('should call game.handleDeath if colliding with vulnerable, active Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = false;
            asteroid.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).toHaveBeenCalledTimes(1);
        });

        test('should NOT call game.handleDeath if colliding with invincible Ship', () => {
            mockShipInstance.isInvincible = true;
            mockShipInstance.suspended = false;
            asteroid.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        test('should NOT call game.handleDeath if colliding with suspended Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = true;
            asteroid.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        test('should do nothing if colliding with non-Ship object', () => {
            // Create a generic object or mock with a different type
            const otherObject = { type: 'Bullet', pos:[0,0], radius: 5 }; 
            asteroid.collideWith(otherObject);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        test('should do nothing if colliding with another Asteroid', () => {
            const anotherAsteroid = new Asteroid({ pos: [0,0], game: mockGame, min_speed: 0 });
            asteroid.collideWith(anotherAsteroid);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });
    });

    // Implement draw test
    test('draw should call context methods correctly', () => {
        // Reset mock calls specifically for this test
        mockCtx.save.mockClear();
        mockCtx.translate.mockClear();
        mockCtx.rotate.mockClear();
        mockCtx.drawImage.mockClear();
        mockCtx.restore.mockClear();

        const initialAngle = asteroid.angleInRadians;
        asteroid.pos = [50, 60]; // Set position
        asteroid.draw(mockCtx);

        expect(mockCtx.save).toHaveBeenCalledTimes(1);
        expect(mockCtx.translate).toHaveBeenCalledWith(50, 60);
        expect(mockCtx.rotate).toHaveBeenCalledTimes(1);
        // Check angle calculation
        expect(asteroid.angleInRadians).toBe(initialAngle + asteroid.rotation);
        expect(mockCtx.rotate).toHaveBeenCalledWith(asteroid.angleInRadians); 
        expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
        expect(mockCtx.drawImage).toHaveBeenCalledWith(
            asteroid.img, // Image object
            0 - asteroid.radius, // x relative to translated origin
            0 - asteroid.radius, // y relative to translated origin
            asteroid.radius * 2, // width
            asteroid.radius * 2 // height
        );
        expect(mockCtx.restore).toHaveBeenCalledTimes(1);
    });
}); 