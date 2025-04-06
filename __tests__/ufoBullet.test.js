// __tests__/ufoBullet.test.js

describe('Asteroids.UfoBullet', () => {
    let UfoBullet;
    let MockMovingObject;
    let mockUtil;
    let mockGame;
    let MockShip;
    let MockImage;
    let mockCtx;

    beforeAll(() => {
        jest.resetModules();
        window.Asteroids = window.Asteroids || {};

        // Mock Util (with inherits)
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
            remove: jest.fn(),
        };

        // --- Require the script ---
        UfoBullet = require('../lib/javascripts/ufoBullet.js');
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    let ufoBullet;
    let ufoBulletOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockGame.handleDeath.mockClear();
        mockGame.remove.mockClear();
        MockShip.mockClear();
        MockImage.mockClear();

        // Mock context
        mockCtx = {
            drawImage: jest.fn(),
        };

        ufoBulletOptions = {
            pos: [100, 100],
            vel: [0, 1], // Example velocity
            game: mockGame,
        };
        ufoBullet = new UfoBullet(ufoBulletOptions);
    });

    describe('Constructor', () => {
        test('should initialize properties', () => {
            expect(ufoBullet.game).toBe(mockGame);
            expect(ufoBullet.type).toBe('UfoBullet');
            expect(ufoBullet.isWrappable).toBe(false);
            expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
                pos: ufoBulletOptions.pos,
                vel: ufoBulletOptions.vel,
                radius: UfoBullet.RADIUS,
                color: '#ffff00', // Check color
                game: mockGame
            }));
        });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalled();
            const imageInstance = ufoBullet.img;
            expect(imageInstance).toBeInstanceOf(MockImage);
            expect(imageInstance.src).toBe('lib/images/ufo_bullet.png');
        });
    });

    describe('draw', () => {
        test('should call context drawImage correctly', () => {
            mockCtx.drawImage.mockClear();
            ufoBullet.pos = [50, 60];
            ufoBullet.draw(mockCtx);
            expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
            expect(mockCtx.drawImage).toHaveBeenCalledWith(
                ufoBullet.img,
                50 - ufoBullet.radius,
                60 - ufoBullet.radius,
                ufoBullet.radius * 2,
                ufoBullet.radius * 2
            );
        });
    });

    describe('collideWith', () => {
        let mockShipInstance;

        beforeEach(() => {
            mockShipInstance = new MockShip();
            mockGame.handleDeath.mockClear();
            mockGame.remove.mockClear();
        });

        test('should call game.handleDeath and remove self if colliding with vulnerable, active Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = false;
            ufoBullet.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
        });

        test('should remove self but NOT call game.handleDeath if colliding with invincible Ship', () => {
            mockShipInstance.isInvincible = true;
            mockShipInstance.suspended = false;
            ufoBullet.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
        });

        test('should remove self but NOT call game.handleDeath if colliding with suspended Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = true;
            ufoBullet.collideWith(mockShipInstance);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
        });

        test('should do nothing if colliding with non-Ship object', () => {
            const otherObject = { type: 'Asteroid', pos:[0,0], radius: 10 }; 
            ufoBullet.collideWith(otherObject);
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
            expect(mockGame.remove).not.toHaveBeenCalled();
        });
    });
}); 