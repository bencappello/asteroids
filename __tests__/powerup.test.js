/**
 * @jest-environment jsdom
 */

// Define window object if not already defined (e.g., in Node.js environment)
if (typeof window === 'undefined') {
    global.window = {};
}

// Set a default Frame_Rate for tests if not set
window.Frame_Rate = window.Frame_Rate || 60;

describe('PowerUp', () => {
    let PowerUp;
    let MockMovingObject;
    let MockUtil;
    let MockShip;
    let MockGame;
    let MockImage;

    const defaultPos = [50, 50];
    const defaultVel = [1, 0]; // Mock velocity from Util
    const defaultGame = { remove: jest.fn() };

    beforeAll(() => {
        // Mock dependencies before requiring the module
        MockMovingObject = jest.fn(function(args) { // Assign properties like the real constructor
            Object.assign(this, args);
        });
        MockMovingObject.prototype.move = jest.fn(); // Mock the parent move method
        window.Asteroids = {
            Util: {
                randomVec: jest.fn().mockReturnValue(defaultVel),
                inherits: jest.fn(), // Mock inherits if needed, though not strictly required for testing logic
            },
            movingObject: MockMovingObject,
            Ship: jest.fn().mockImplementation(() => ({ // Simple mock ship for instanceof/type check
                type: 'Ship',
                activatePowerUp: jest.fn(),
            })),
        };
        
        // Mock the global Image constructor
        MockImage = jest.fn(function() { // Use function to allow `this` assignment
            this.src = '';
        });
        global.Image = MockImage;
        
        // Now require PowerUp after mocks are set up
        PowerUp = require('../lib/javascripts/powerup');
    });

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        MockGame = { remove: jest.fn() }; // Fresh mock game for each test
    });

    test('constructor should initialize properties and call MovingObject', () => {
        const powerup = new PowerUp({ pos: defaultPos, game: MockGame });

        // Check MovingObject was called
        expect(MockMovingObject).toHaveBeenCalledTimes(1);
        const movingObjectArgs = MockMovingObject.mock.calls[0][0]; // Args passed to MovingObject constructor
        expect(movingObjectArgs.pos).toEqual(defaultPos);
        expect(movingObjectArgs.vel).toEqual(defaultVel);
        expect(movingObjectArgs.radius).toBe(PowerUp.RADIUS);
        expect(movingObjectArgs.game).toBe(MockGame);

        // Check instance properties
        expect(powerup.game).toBe(MockGame);
        expect(powerup.lifespan).toBeCloseTo(PowerUp.LIFESPAN * (1000 / window.Frame_Rate));
        expect(powerup.img).toBeInstanceOf(MockImage);
        expect(powerup.img.src).toContain('powerup.png');
        expect(Asteroids.Util.randomVec).toHaveBeenCalledWith(PowerUp.SPEED);
    });

    test('draw should call ctx.drawImage with correct parameters', () => {
        const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
        const mockCtx = {
            drawImage: jest.fn(),
        };

        powerup.draw(mockCtx);

        expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
        expect(mockCtx.drawImage).toHaveBeenCalledWith(
            powerup.img,          // Image object
            defaultPos[0] - PowerUp.RADIUS, // x position
            defaultPos[1] - PowerUp.RADIUS, // y position
            PowerUp.RADIUS * 2,   // width
            PowerUp.RADIUS * 2    // height
        );
    });

    describe('move', () => {
        test('should call parent move method', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            powerup.move();
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
        });

        test('should decrease lifespan', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            const initialLifespan = powerup.lifespan;
            powerup.move();
            expect(powerup.lifespan).toBe(initialLifespan - 1);
        });

        test('should call game.remove when lifespan reaches zero', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            powerup.lifespan = 1; // Set lifespan to 1
            powerup.move(); // This move makes it 0
            expect(powerup.lifespan).toBe(0);
            expect(MockGame.remove).toHaveBeenCalledTimes(1);
            expect(MockGame.remove).toHaveBeenCalledWith(powerup);
        });

        test('should not call game.remove when lifespan is positive', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            powerup.lifespan = 2;
            powerup.move();
            expect(powerup.lifespan).toBe(1);
            expect(MockGame.remove).not.toHaveBeenCalled();
        });
    });

    describe('collideWith', () => {
        test('should call ship.activatePowerUp and game.remove if otherObject is Ship', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            const mockShip = new Asteroids.Ship(); // Use the mock Ship constructor

            powerup.collideWith(mockShip);

            expect(mockShip.activatePowerUp).toHaveBeenCalledTimes(1);
            expect(mockShip.activatePowerUp).toHaveBeenCalledWith(PowerUp.DURATION);
            expect(MockGame.remove).toHaveBeenCalledTimes(1);
            expect(MockGame.remove).toHaveBeenCalledWith(powerup);
        });

        test('should not call ship.activatePowerUp or game.remove if otherObject is not Ship', () => {
            const powerup = new PowerUp({ pos: defaultPos, game: MockGame });
            const otherObject = { type: 'Asteroid' }; // Not a ship
            const mockShip = new Asteroids.Ship(); // Need instance for spy later
            const activateSpy = jest.spyOn(mockShip, 'activatePowerUp');

            powerup.collideWith(otherObject);

            expect(activateSpy).not.toHaveBeenCalled();
            expect(MockGame.remove).not.toHaveBeenCalled();
        });
    });
}); 