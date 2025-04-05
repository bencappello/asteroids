// __tests__/powerup.test.js

describe('Asteroids.PowerUp', () => {
    let PowerUp;
    let MockMovingObject;
    let mockMovingObjectMove;
    let mockUtil;
    let mockGame;
    let MockShip;
    let MockImage;

    const FRAME_RATE = 30; // Match frame rate used in Ship tests

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = {
            inherits: jest.fn(),
            randomVec: jest.fn().mockReturnValue([0.1, 0.1]), // Default random velocity
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject prototype.move FIRST
        mockMovingObjectMove = jest.fn();
        window.Asteroids.movingObject = window.Asteroids.movingObject || {};
        window.Asteroids.movingObject.prototype = window.Asteroids.movingObject.prototype || {};
        window.Asteroids.movingObject.prototype.move = mockMovingObjectMove;

        // Mock MovingObject constructor
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos; this.vel = args.vel; this.radius = args.radius; this.game = args.game;
        });
        window.Asteroids.movingObject = MockMovingObject;
        // Re-attach the mocked prototype
        window.Asteroids.movingObject.prototype = { move: mockMovingObjectMove };


        // Mock Ship constructor and relevant instance method
        MockShip = jest.fn(function() {
            this.activatePowerUp = jest.fn();
        });
        window.Asteroids.Ship = MockShip;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock Game
        mockGame = {
            remove: jest.fn(),
        };

         // Mock global Frame_Rate
         global.window = global.window || global; // Ensure window exists
         global.window.Frame_Rate = FRAME_RATE;

        // --- Require the script ---
        require('../lib/javascripts/powerup.js');
        PowerUp = window.Asteroids.PowerUp;

        // Check inherits call
        expect(mockUtil.inherits).toHaveBeenCalledWith(PowerUp, MockMovingObject);
    });

    afterAll(() => {
        // Clean up global Frame_Rate if necessary
        delete global.window.Frame_Rate;
    });


    // Reset mocks
    let powerUp;
    let powerUpOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockMovingObjectMove.mockClear();
        mockUtil.randomVec.mockClear();
        mockGame.remove.mockClear();
        MockShip.mockClear();
        // Reset activatePowerUp on prototype or instances if needed
        // (Jest clears calls on mock function instances automatically)
        MockImage.mockClear();

        powerUpOptions = {
            pos: [70, 80],
            game: mockGame
        };
        powerUp = new PowerUp(powerUpOptions);
    });

    describe('Constructor', () => {
        test('should initialize default properties', () => {
            expect(powerUp.radius).toBe(PowerUp.RADIUS);
            expect(powerUp.isWrappable).toBe(true);
            expect(powerUp.game).toBe(mockGame);
            const expectedLifespanFrames = PowerUp.LIFESPAN * (1000 / FRAME_RATE);
            expect(powerUp.lifespan).toBeCloseTo(expectedLifespanFrames);
        });

        test('should call MovingObject with random velocity', () => {
             mockUtil.randomVec.mockReturnValueOnce([-0.2, 0.3]);
             const powerUpInstance = new PowerUp({ pos: [1,1], game: mockGame });

             expect(mockUtil.randomVec).toHaveBeenCalledWith(PowerUp.SPEED);
             expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
                 vel: [-0.2, 0.3],
                 radius: PowerUp.RADIUS,
                 pos: [1,1],
                 game: mockGame
             }));
         });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalledTimes(1);
            const imageInstance = MockImage.mock.instances[0];
            expect(imageInstance.src).toBe('lib/images/powerup.png');
            expect(powerUp.img).toBe(imageInstance);
        });
    });

    describe('move', () => {
        test('should call MovingObject.prototype.move', () => {
            powerUp.move();
            expect(mockMovingObjectMove).toHaveBeenCalledTimes(1);
        });

        test('should decrement lifespan', () => {
            const initialLifespan = powerUp.lifespan;
            powerUp.move();
            expect(powerUp.lifespan).toBe(initialLifespan - 1);
        });

        test('should call game.remove when lifespan reaches zero or less', () => {
            powerUp.lifespan = 1;
            powerUp.move(); // Lifespan becomes 0
            expect(mockGame.remove).toHaveBeenCalledWith(powerUp);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);

             // Test <= 0 case
             mockGame.remove.mockClear();
             powerUp.lifespan = 0;
             powerUp.move(); // Lifespan becomes -1
             expect(mockGame.remove).toHaveBeenCalledWith(powerUp);
             expect(mockGame.remove).toHaveBeenCalledTimes(1);
        });

        test('should NOT call game.remove if lifespan > 0', () => {
            powerUp.lifespan = 100;
            powerUp.move();
            expect(mockGame.remove).not.toHaveBeenCalled();
        });
    });

    describe('collideWith', () => {
        let mockShipInstance;
        beforeEach(() => {
            mockShipInstance = new MockShip();
            mockShipInstance.constructor = MockShip; // For instanceof
        });

        test('should call ship.activatePowerUp when colliding with Ship', () => {
            powerUp.collideWith(mockShipInstance);
            expect(mockShipInstance.activatePowerUp).toHaveBeenCalledTimes(1);
            expect(mockShipInstance.activatePowerUp).toHaveBeenCalledWith(PowerUp.DURATION);
        });

         test('should call game.remove (self) when colliding with Ship', () => {
            powerUp.collideWith(mockShipInstance);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(powerUp);
        });

        test('should do nothing if colliding with non-Ship object', () => {
             const otherObject = { some: 'data' };
             powerUp.collideWith(otherObject);
             expect(mockGame.remove).not.toHaveBeenCalled();
             // ship.activatePowerUp shouldn't be called as it's not a ship
        });
    });

    describe('draw', () => {
        test.todo('should call context drawImage correctly');
    });
}); 