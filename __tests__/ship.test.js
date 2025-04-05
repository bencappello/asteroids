// __tests__/ship.test.js

describe('Asteroids.Ship', () => {
    let Ship;
    let MockMovingObject;
    let mockMovingObjectMove; // Mock for the prototype method
    let mockUtil;
    let mockGame;
    let MockBullet;
    let MockImage;
    let mockAddEventListener;
    let mockRemoveEventListener;
    let mockGameView;

    const FRAME_RATE = 30; // Define a frame rate for testing timers

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util functions
        mockUtil = {
            inherits: jest.fn(),
            cos: jest.fn((angle) => Math.cos(angle * (Math.PI / 180))), // Use real math for calcs
            sin: jest.fn((angle) => Math.sin(angle * (Math.PI / 180))), // Use real math for calcs
            toRadians: jest.fn((deg) => deg * (Math.PI / 180)), // Use real math
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject prototype.move FIRST
        mockMovingObjectMove = jest.fn();
        window.Asteroids.movingObject = window.Asteroids.movingObject || {}; // Ensure namespace exists
        // Define prototype if it doesn't exist (it likely won't in this mock setup yet)
        window.Asteroids.movingObject.prototype = window.Asteroids.movingObject.prototype || {};
        window.Asteroids.movingObject.prototype.move = mockMovingObjectMove;

        // Mock MovingObject constructor
        MockMovingObject = jest.fn(function(args) {
            // Simulate the real constructor by copying properties
            this.pos = args.pos;
            this.vel = args.vel;
            this.radius = args.radius;
            this.game = args.game;
        });
        // Assign the constructor mock back to the namespace
        window.Asteroids.movingObject = MockMovingObject;
        // Re-attach the mocked prototype to the mocked constructor
        window.Asteroids.movingObject.prototype = { move: mockMovingObjectMove };

        // Mock Bullet constructor
        MockBullet = jest.fn();
        window.Asteroids.Bullet = MockBullet;

        // Mock Image constructor
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock game object
        mockGame = {
            add: jest.fn(),
            // Add other game properties/methods if Ship uses them
        };

        // Mock global Frame_Rate
        global.Frame_Rate = FRAME_RATE;

        // Mock window event listeners
        mockAddEventListener = jest.fn();
        mockRemoveEventListener = jest.fn();
        // Ensure global.window exists (JSDOM provides it, but be explicit)
        global.window = global.window || global;
        global.window.addEventListener = mockAddEventListener;
        global.window.removeEventListener = mockRemoveEventListener;

        // Mock gameView
        mockGameView = {
            keyState: {},
            downKeyState: jest.fn(),
            upKeyState: jest.fn(),
        };
        global.gameView = mockGameView;

        // Now require the Ship script
        require('../lib/javascripts/ship.js');
        Ship = window.Asteroids.Ship;

        // Basic check that inherits was called correctly
        // Note: inherits copies prototype, so Ship.prototype should have MovingObject methods
        expect(mockUtil.inherits).toHaveBeenCalledWith(Ship, MockMovingObject);

    });

    // Reset mocks before each test
    let ship;
    let shipOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockMovingObjectMove.mockClear();
        mockUtil.cos.mockClear();
        mockUtil.sin.mockClear();
        mockUtil.toRadians.mockClear();
        MockBullet.mockClear();
        MockImage.mockClear();
        mockGame.add.mockClear();
        mockAddEventListener.mockClear();
        mockRemoveEventListener.mockClear();
        if (mockGameView) { // Ensure mockGameView is defined before accessing properties
            mockGameView.downKeyState.mockClear();
            mockGameView.upKeyState.mockClear();
            mockGameView.keyState = {}; // Reset keyState
        }

        shipOptions = {
            pos: [100, 100],
            game: mockGame
        };
        ship = new Ship(shipOptions);
    });

    describe('Constructor', () => {
        test('should initialize default properties correctly', () => {
            expect(ship.radius).toBe(Ship.RADIUS); // Static property
            expect(ship.vel).toEqual([0, 0]);
            expect(ship.angle).toBe(90);
            expect(ship.suspended).toBe(true);
            expect(ship.isPoweredUp).toBe(false);
            expect(ship.powerUpTimer).toBe(0);
            expect(ship.isInvincible).toBe(false);
            expect(ship.invincibleTimer).toBe(0);
            expect(ship.game).toBe(mockGame);
        });

        test('should call MovingObject constructor with correct arguments', () => {
            expect(MockMovingObject).toHaveBeenCalledTimes(1);
            const constructorArgs = MockMovingObject.mock.calls[0][0];
            expect(constructorArgs.pos).toEqual(shipOptions.pos);
            expect(constructorArgs.radius).toBe(Ship.RADIUS);
            expect(constructorArgs.vel).toEqual([0, 0]);
            expect(constructorArgs.game).toBe(mockGame);
        });

        test('should create Image and set src', () => {
            // Constructor runs in beforeEach, so check call count persistence
            expect(MockImage).toHaveBeenCalled();
            const imageInstance = MockImage.mock.instances[MockImage.mock.instances.length - 1]; // Get last created instance
            expect(imageInstance.src).toBe('lib/images/directional_ship.png');
            expect(ship.img).toBe(imageInstance);
        });
    });

    describe('rotate', () => {
        test('should increase angle for positive direction', () => {
            const initialAngle = ship.angle;
            ship.rotate(1); // Rotate right
            expect(ship.angle).toBe(initialAngle + 2);
        });

        test('should decrease angle for negative direction', () => {
            const initialAngle = ship.angle;
            ship.rotate(-1); // Rotate left
            expect(ship.angle).toBe(initialAngle - 2);
        });
    });

    describe('power', () => {
        test('should increase velocity based on angle for positive direction', () => {
             ship.angle = 0; // Pointing up (along positive Y in this coord system)
             // Util.cos(0) = 1, Util.sin(0) = 0
             ship.power(1);
             // Use mocks to verify calculation if preferred, or check result
             expect(mockUtil.cos).toHaveBeenCalledWith(0);
             expect(mockUtil.sin).toHaveBeenCalledWith(0);
             expect(ship.vel[0]).toBeCloseTo(0.01); // xVector = cos(0) * 0.01
             expect(ship.vel[1]).toBeCloseTo(0);    // yVector = sin(0) * 0.01

             mockUtil.cos.mockClear();
             mockUtil.sin.mockClear();
             ship.angle = 90; // Pointing right (along positive X)
             // Util.cos(90) = 0, Util.sin(90) = 1
             ship.vel = [0, 0]; // Reset vel
             ship.power(1);
             expect(mockUtil.cos).toHaveBeenCalledWith(90);
             expect(mockUtil.sin).toHaveBeenCalledWith(90);
             expect(ship.vel[0]).toBeCloseTo(0);    // xVector = cos(90) * 0.01
             expect(ship.vel[1]).toBeCloseTo(0.01); // yVector = sin(90) * 0.01
        });

        test('should decrease velocity based on angle for negative direction', () => {
             ship.angle = 0; // Pointing up
             ship.power(-1); // Apply reverse thrust
             expect(ship.vel[0]).toBeCloseTo(-0.01);
             expect(ship.vel[1]).toBeCloseTo(0);
        });

        test('should accumulate velocity changes', () => {
             ship.angle = 45;
             ship.power(1);
             const vel1_x = ship.vel[0];
             const vel1_y = ship.vel[1];
             ship.power(1);
             // Check accumulation - velocity approximately doubles
             expect(ship.vel[0]).toBeCloseTo(vel1_x * 2);
             expect(ship.vel[1]).toBeCloseTo(vel1_y * 2);
        });
    });

     describe('fireBullet', () => {
        beforeEach(() => {
            ship.suspended = false; // Allow firing
            ship.pos = [50, 60]; // Set position
            ship.angle = 0; // Pointing up (cos=1, sin=0)
        });

        test('should not fire if suspended', () => {
            ship.suspended = true;
            ship.fireBullet();
            expect(mockGame.add).not.toHaveBeenCalled();
        });

        test('should add one bullet to game if not powered up', () => {
            ship.isPoweredUp = false;
            ship.fireBullet();
            expect(mockGame.add).toHaveBeenCalledTimes(1);
            expect(MockBullet).toHaveBeenCalledTimes(1);
        });

         test('should create central bullet with correct properties', () => {
             ship.isPoweredUp = false;
             ship.angle = 90; // Pointing right (cos=0, sin=1)
             const speed = Ship.BULLET_SPEED * -1; // -3
             const expectedVelX = mockUtil.cos(90) * speed; // 0
             const expectedVelY = mockUtil.sin(90) * speed; // -3
             ship.fireBullet();

             expect(MockBullet).toHaveBeenCalledWith({
                 pos: [50, 60],
                 vel: [expectedVelX, expectedVelY],
                 game: mockGame
             });
             // Check that the *instance* created by the mock was added
             expect(mockGame.add).toHaveBeenCalledWith(MockBullet.mock.instances[0]);
        });

        test('should add three bullets to game if powered up', () => {
            ship.isPoweredUp = true;
            ship.fireBullet();
            expect(mockGame.add).toHaveBeenCalledTimes(3);
            expect(MockBullet).toHaveBeenCalledTimes(3);
        });

         test('should create side bullets with offset angles if powered up', () => {
             ship.isPoweredUp = true;
             ship.angle = 45;
             ship.fireBullet();

             const centerAngle = 45;
             const leftAngle = 45 - Ship.POWERUP_ANGLE_OFFSET; // 30
             const rightAngle = 45 + Ship.POWERUP_ANGLE_OFFSET; // 60
             const speed = Ship.BULLET_SPEED * -1;

             const getExpectedVel = (angle) => [
                 mockUtil.cos(angle) * speed,
                 mockUtil.sin(angle) * speed
             ];

             // Check constructor calls for each bullet
             expect(MockBullet).toHaveBeenCalledWith(expect.objectContaining({ vel: getExpectedVel(centerAngle) }));
             expect(MockBullet).toHaveBeenCalledWith(expect.objectContaining({ vel: getExpectedVel(leftAngle) }));
             expect(MockBullet).toHaveBeenCalledWith(expect.objectContaining({ vel: getExpectedVel(rightAngle) }));

             // Check game.add calls for each instance
             expect(mockGame.add).toHaveBeenCalledWith(MockBullet.mock.instances[0]);
             expect(mockGame.add).toHaveBeenCalledWith(MockBullet.mock.instances[1]);
             expect(mockGame.add).toHaveBeenCalledWith(MockBullet.mock.instances[2]);
        });
     });

    describe('activatePowerUp', () => {
        test('should set isPoweredUp to true', () => {
            ship.activatePowerUp(5);
            expect(ship.isPoweredUp).toBe(true);
        });

        test('should set powerUpTimer based on duration and FRAME_RATE', () => {
            const durationSeconds = 10;
            const expectedFramesCalculation = durationSeconds * (1000 / FRAME_RATE);
            ship.activatePowerUp(durationSeconds);
            expect(ship.powerUpTimer).toBeCloseTo(expectedFramesCalculation);
        });
    });

     describe('move (Ship Override)', () => {
        beforeEach(() => {
            // Reset timers and flags
            ship.isPoweredUp = false;
            ship.powerUpTimer = 0;
            ship.isInvincible = false;
            ship.invincibleTimer = 0;
        });

        test('should call MovingObject.prototype.move', () => {
            ship.move();
            expect(mockMovingObjectMove).toHaveBeenCalledTimes(1);
            // Check if it was called with the ship instance as context
            // We mocked the prototype method, so 'this' context should be correct
            expect(mockMovingObjectMove).toHaveBeenCalledWith(); // Called with no args
        });

         test('should decrement powerUpTimer if active', () => {
            ship.isPoweredUp = true;
            ship.powerUpTimer = 100;
            ship.move();
            expect(ship.powerUpTimer).toBe(99);
            expect(ship.isPoweredUp).toBe(true);
        });

        test('should deactivate powerUp when timer reaches zero or less', () => {
            ship.isPoweredUp = true;
            ship.powerUpTimer = 1;
            ship.move(); // Timer becomes 0
            expect(ship.powerUpTimer).toBe(0);
            expect(ship.isPoweredUp).toBe(false);
            ship.move(); // Check next frame, timer stays 0
            expect(ship.powerUpTimer).toBe(0);
             expect(ship.isPoweredUp).toBe(false);

             // Test <= 0 case
             ship.isPoweredUp = true;
             ship.powerUpTimer = 0;
             ship.move(); // Timer becomes -1, check deactivates, timer reset to 0
             // Timer gets reset to 0 after deactivation
             expect(ship.powerUpTimer).toBe(0);
             expect(ship.isPoweredUp).toBe(false);
        });

         test('should decrement invincibleTimer if active', () => {
            ship.isInvincible = true;
            ship.invincibleTimer = 50;
            ship.move();
            expect(ship.invincibleTimer).toBe(49);
            expect(ship.isInvincible).toBe(true);
        });

        test('should deactivate invincibility when timer reaches zero or less', () => {
            ship.isInvincible = true;
            ship.invincibleTimer = 1;
            ship.move(); // Timer becomes 0
            expect(ship.invincibleTimer).toBe(0);
            expect(ship.isInvincible).toBe(false);
             ship.move(); // Check next frame
            expect(ship.invincibleTimer).toBe(0);
            expect(ship.isInvincible).toBe(false);

            // Test <= 0 case
             ship.isInvincible = true;
             ship.invincibleTimer = 0;
             ship.move(); // Timer becomes -1, check deactivates, timer reset to 0
             // Timer gets reset to 0 after deactivation
             expect(ship.invincibleTimer).toBe(0);
             expect(ship.isInvincible).toBe(false);
        });

         test('should not decrement timers if inactive', () => {
            ship.isPoweredUp = false;
            ship.powerUpTimer = 100; // Set timer but keep flag false
             ship.isInvincible = false;
            ship.invincibleTimer = 50;
            ship.move();
            expect(ship.powerUpTimer).toBe(100);
            expect(ship.invincibleTimer).toBe(50);
        });
     });

     describe('suspendSelf', () => {
        test('should set suspended to true', () => {
            ship.suspendSelf();
            expect(ship.suspended).toBe(true);
        });

        test('should remove keydown and keyup listeners', () => {
            ship.suspendSelf();
            expect(mockRemoveEventListener).toHaveBeenCalledWith("keydown", mockGameView.downKeyState, true);
            expect(mockRemoveEventListener).toHaveBeenCalledWith("keyup", mockGameView.upKeyState, true);
        });

        test('should clear gameView.keyState', () => {
            mockGameView.keyState = { 'a': true }; // Set some state
            ship.suspendSelf();
            expect(mockGameView.keyState).toEqual({});
        });
     });

     describe('reanimateSelf', () => {
         test('should set suspended to false', () => {
            ship.suspended = true; // Ensure it starts suspended
            ship.reanimateSelf();
            expect(ship.suspended).toBe(false);
        });

        test('should add keydown and keyup listeners', () => {
            ship.reanimateSelf();
            expect(mockAddEventListener).toHaveBeenCalledWith('keydown', mockGameView.downKeyState, true);
            expect(mockAddEventListener).toHaveBeenCalledWith('keyup', mockGameView.upKeyState, true);
        });
     });

     describe('draw', () => {
        test.todo('should handle drawing logic and invincibility flash');
    });
}); 