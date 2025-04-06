/**
 * @jest-environment jsdom
 */

// Define window object if not already defined
if (typeof window === 'undefined') {
    global.window = {};
}

// Set a default Frame_Rate for tests
window.Frame_Rate = window.Frame_Rate || 60;

// Mock global gameView before requiring Ship
global.gameView = {
    downKeyState: jest.fn(),
    upKeyState: jest.fn(),
    keyState: {},
};

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
window.addEventListener = mockAddEventListener;
window.removeEventListener = mockRemoveEventListener;

describe('Ship', () => {
    let Ship;
    let MockMovingObject;
    let MockUtil;
    let MockBullet;
    let MockGame;
    let MockImage;

    const defaultPos = [100, 100];
    const defaultGame = { add: jest.fn() };

    beforeAll(() => {
        // Mock dependencies before requiring Ship
        MockMovingObject = jest.fn(function(args) { Object.assign(this, args); });
        MockMovingObject.prototype.move = jest.fn();

        MockUtil = {
            inherits: jest.fn(),
            cos: jest.fn((angle) => Math.cos(angle * Math.PI / 180)), // Basic mock using real Math
            sin: jest.fn((angle) => Math.sin(angle * Math.PI / 180)),
            toRadians: jest.fn((degrees) => degrees * Math.PI / 180),
        };

        MockBullet = jest.fn();

        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        window.Asteroids = {
            Util: MockUtil,
            movingObject: MockMovingObject,
            Bullet: MockBullet,
        };

        // Require Ship after all mocks are set up
        Ship = require('../lib/javascripts/ship');
    });

    let ship;
    beforeEach(() => {
        // Reset mocks and create a new ship instance for each test
        jest.clearAllMocks();
        global.gameView.keyState = {}; // Reset keyState
        MockGame = { add: jest.fn() }; // Reset game mock
        ship = new Ship({ pos: [...defaultPos], game: MockGame });
    });

    test('constructor should initialize properties', () => {
        expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
            pos: defaultPos,
            vel: [0, 0],
            radius: Ship.RADIUS,
            color: '#ffffff',
            game: MockGame,
        }));
        expect(ship.type).toBe('Ship');
        expect(ship.img).toBeInstanceOf(MockImage);
        expect(ship.img.src).toContain('directional_ship.png');
        expect(ship.angle).toBe(90);
        expect(ship.suspended).toBe(true);
        expect(ship.isPoweredUp).toBe(false);
        expect(ship.powerUpTimer).toBe(0);
        expect(ship.isInvincible).toBe(false);
        expect(ship.invincibleTimer).toBe(0);
    });

    test('rotate should adjust angle', () => {
        const initialAngle = ship.angle;
        ship.rotate(1); // Clockwise
        expect(ship.angle).toBe(initialAngle + 2);
        ship.rotate(-1); // Counter-clockwise
        expect(ship.angle).toBe(initialAngle);
    });

    test('power should adjust velocity based on angle', () => {
        ship.angle = 0; // Pointing right
        const initialVel = [...ship.vel];
        ship.power(1); // Accelerate forward
        const expectedVelX = initialVel[0] + Math.cos(0) * 1 * 0.01; // cos(0) = 1
        const expectedVelY = initialVel[1] + Math.sin(0) * 1 * 0.01; // sin(0) = 0
        expect(ship.vel[0]).toBeCloseTo(expectedVelX);
        expect(ship.vel[1]).toBeCloseTo(expectedVelY);
        expect(MockUtil.cos).toHaveBeenCalledWith(0);
        expect(MockUtil.sin).toHaveBeenCalledWith(0);
    });

    describe('fireBullet', () => {
        beforeEach(() => {
            ship.suspended = false; // Ship needs to be active to fire
        });

        test('should not fire if suspended', () => {
            ship.suspended = true;
            ship.fireBullet();
            expect(MockGame.add).not.toHaveBeenCalled();
        });

        test('should fire one bullet if not powered up', () => {
            ship.angle = 90; // Pointing up
            ship.isPoweredUp = false;
            ship.fireBullet();

            expect(MockGame.add).toHaveBeenCalledTimes(1);
            expect(MockBullet).toHaveBeenCalledTimes(1);
            const bulletArgs = MockBullet.mock.calls[0][0];
            expect(bulletArgs.pos).toEqual(ship.pos);
            expect(bulletArgs.game).toBe(MockGame);
            // Vel check: cos(90)=0, sin(90)=1. vel = [0, -speed]
            expect(bulletArgs.vel[0]).toBeCloseTo(0);
            expect(bulletArgs.vel[1]).toBeCloseTo(Ship.BULLET_SPEED * -1);
        });

        test('should fire three bullets if powered up', () => {
            ship.angle = 0; // Pointing right
            ship.isPoweredUp = true;
            ship.fireBullet();

            expect(MockGame.add).toHaveBeenCalledTimes(3);
            expect(MockBullet).toHaveBeenCalledTimes(3);

            // Check center bullet (angle = 0)
            const centerArgs = MockBullet.mock.calls[0][0];
            expect(centerArgs.pos).toEqual(ship.pos);
            expect(centerArgs.vel[0]).toBeCloseTo(Ship.BULLET_SPEED * -1); // cos(0)=1
            expect(centerArgs.vel[1]).toBeCloseTo(0);                   // sin(0)=0

            // Check left bullet (angle = -offset)
            const leftAngle = 0 - Ship.POWERUP_ANGLE_OFFSET;
            const leftArgs = MockBullet.mock.calls[1][0];
            expect(leftArgs.pos).toEqual(ship.pos);
            expect(leftArgs.vel[0]).toBeCloseTo(Math.cos(leftAngle * Math.PI / 180) * Ship.BULLET_SPEED * -1);
            expect(leftArgs.vel[1]).toBeCloseTo(Math.sin(leftAngle * Math.PI / 180) * Ship.BULLET_SPEED * -1);

            // Check right bullet (angle = +offset)
            const rightAngle = 0 + Ship.POWERUP_ANGLE_OFFSET;
            const rightArgs = MockBullet.mock.calls[2][0];
            expect(rightArgs.pos).toEqual(ship.pos);
            expect(rightArgs.vel[0]).toBeCloseTo(Math.cos(rightAngle * Math.PI / 180) * Ship.BULLET_SPEED * -1);
            expect(rightArgs.vel[1]).toBeCloseTo(Math.sin(rightAngle * Math.PI / 180) * Ship.BULLET_SPEED * -1);
        });
    });

    test('activatePowerUp should set state and timer', () => {
        const durationSeconds = 5;
        ship.activatePowerUp(durationSeconds);
        expect(ship.isPoweredUp).toBe(true);
        const expectedFrames = durationSeconds * (1000 / window.Frame_Rate);
        expect(ship.powerUpTimer).toBeCloseTo(expectedFrames);
    });

    describe('move', () => {
        test('should call parent move', () => {
            ship.move();
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
        });

        test('should decrement powerUpTimer and reset state', () => {
            ship.isPoweredUp = true;
            ship.powerUpTimer = 10;
            ship.move();
            expect(ship.powerUpTimer).toBe(9);
            expect(ship.isPoweredUp).toBe(true);

            ship.powerUpTimer = 1;
            ship.move(); // Timer becomes 0
            expect(ship.powerUpTimer).toBe(0);
            expect(ship.isPoweredUp).toBe(false);
        });

        test('should decrement invincibleTimer and reset state', () => {
            ship.isInvincible = true;
            ship.invincibleTimer = 15;
            ship.move();
            expect(ship.invincibleTimer).toBe(14);
            expect(ship.isInvincible).toBe(true);

            ship.invincibleTimer = 1;
            ship.move(); // Timer becomes 0
            expect(ship.invincibleTimer).toBe(0);
            expect(ship.isInvincible).toBe(false);
        });
    });

    test('suspendSelf should remove listeners, clear keyState, and set suspended', () => {
        global.gameView.keyState = { 'a': true }; // Set some keys
        ship.suspended = false; // Start active

        ship.suspendSelf();

        expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', global.gameView.downKeyState, true);
        expect(mockRemoveEventListener).toHaveBeenCalledWith('keyup', global.gameView.upKeyState, true);
        expect(global.gameView.keyState).toEqual({});
        expect(ship.suspended).toBe(true);
    });

    test('reanimateSelf should add listeners and unset suspended', () => {
        ship.suspended = true; // Start suspended
        ship.reanimateSelf();

        expect(mockAddEventListener).toHaveBeenCalledWith('keydown', global.gameView.downKeyState, true);
        expect(mockAddEventListener).toHaveBeenCalledWith('keyup', global.gameView.upKeyState, true);
        expect(ship.suspended).toBe(false);
    });

    describe('draw', () => {
        let mockCtx;
        beforeEach(() => {
            ship.suspended = false; // Ship must be active to draw
            mockCtx = {
                save: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                drawImage: jest.fn(),
                restore: jest.fn(),
                globalAlpha: 1, // Default alpha
            };
        });

        test('should not draw if suspended', () => {
            ship.suspended = true;
            ship.draw(mockCtx);
            expect(mockCtx.save).not.toHaveBeenCalled();
            expect(mockCtx.drawImage).not.toHaveBeenCalled();
        });

        test('should call context methods correctly when not invincible', () => {
            ship.isInvincible = false;
            ship.angle = 45;
            ship.draw(mockCtx);

            expect(mockCtx.save).toHaveBeenCalledTimes(1);
            expect(mockCtx.translate).toHaveBeenCalledWith(ship.pos[0], ship.pos[1]);
            expect(MockUtil.toRadians).toHaveBeenCalledWith(ship.angle);
            expect(mockCtx.rotate).toHaveBeenCalledWith(expect.any(Number)); // Result of toRadians
            expect(mockCtx.drawImage).toHaveBeenCalledWith(ship.img, -Ship.RADIUS, -Ship.RADIUS, Ship.RADIUS * 2, Ship.RADIUS * 2);
            expect(mockCtx.restore).toHaveBeenCalledTimes(1);
            expect(mockCtx.globalAlpha).toBe(1); // Should not be changed
        });

        test('should set globalAlpha when invincible and flashing ON', () => {
            ship.isInvincible = true;
            ship.invincibleTimer = 90; // floor(90/40) = 2. 2 % 2 === 0 (Condition TRUE -> alpha = 0.5)

            ship.draw(mockCtx);
            expect(mockCtx.globalAlpha).toBe(0.5);
        });

        test('should NOT set globalAlpha when invincible and flashing OFF', () => {
            ship.isInvincible = true;
            ship.invincibleTimer = 50; // floor(50/40) = 1. 1 % 2 !== 0 (Condition FALSE -> alpha = 1)

            ship.draw(mockCtx);
            expect(mockCtx.globalAlpha).toBe(1); // Should remain at default
        });

    });
}); 