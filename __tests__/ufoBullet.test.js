// __tests__/ufoBullet.test.js

describe('Asteroids.UfoBullet', () => {
    let UfoBullet;
    let MockMovingObject;
    let mockUtil;
    let mockGame;
    let MockShip;
    let MockImage;

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = { inherits: jest.fn() };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos; this.vel = args.vel; this.radius = args.radius; this.game = args.game;
        });
        window.Asteroids.movingObject = MockMovingObject;

        // Mock Ship constructor
        MockShip = jest.fn(function() {
            this.suspended = false; this.isInvincible = false;
        });
        window.Asteroids.Ship = MockShip;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock Game
        mockGame = {
            remove: jest.fn(),
            handleDeath: jest.fn(),
        };

        // --- Require the script ---
        require('../lib/javascripts/ufoBullet.js');
        UfoBullet = window.Asteroids.UfoBullet;

        // Check inherits call
        expect(mockUtil.inherits).toHaveBeenCalledWith(UfoBullet, MockMovingObject);
    });

    // Reset mocks
    let ufoBullet;
    let ufoBulletOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockGame.remove.mockClear();
        mockGame.handleDeath.mockClear();
        MockShip.mockClear();
        MockImage.mockClear();

        ufoBulletOptions = {
            pos: [30, 40],
            vel: [0, 2],
            game: mockGame
        };
        ufoBullet = new UfoBullet(ufoBulletOptions);
    });

    describe('Constructor', () => {
        test('should initialize default properties and call MovingObject', () => {
            expect(ufoBullet.radius).toBe(UfoBullet.RADIUS);
            expect(ufoBullet.isWrappable).toBe(false);
            expect(ufoBullet.game).toBe(mockGame);

            expect(MockMovingObject).toHaveBeenCalledTimes(1);
            const movingObjectArgs = MockMovingObject.mock.calls[0][0];
            expect(movingObjectArgs.pos).toEqual(ufoBulletOptions.pos);
            expect(movingObjectArgs.vel).toEqual(ufoBulletOptions.vel);
            expect(movingObjectArgs.radius).toBe(UfoBullet.RADIUS);
            expect(movingObjectArgs.game).toBe(mockGame);
        });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalledTimes(1);
            const imageInstance = MockImage.mock.instances[0];
            expect(imageInstance.src).toBe('lib/images/ufo_bullet.png');
            expect(ufoBullet.img).toBe(imageInstance);
        });
    });

    describe('collideWith', () => {
        let mockShipInstance;
        let originalAsteroidsShip; // To restore after mocking
        let originalAsteroidsBullet;

        beforeAll(() => {
            // Store original values if they exist
            originalAsteroidsShip = window.Asteroids.Ship;
            originalAsteroidsBullet = window.Asteroids.Bullet;
        });

        afterAll(() => {
            // Restore original values
            window.Asteroids.Ship = originalAsteroidsShip;
            window.Asteroids.Bullet = originalAsteroidsBullet;
            // Clean up potentially defined mocks if originals were undefined
            if (originalAsteroidsShip === undefined) delete window.Asteroids.Ship;
            if (originalAsteroidsBullet === undefined) delete window.Asteroids.Bullet;
        });

        beforeEach(() => {
            mockShipInstance = new MockShip();
            mockShipInstance.constructor = MockShip; // For instanceof
            mockShipInstance.pos = [31, 41]; // Close enough
            // Ensure Ship mock is available globally for instanceof checks inside collideWith
            window.Asteroids.Ship = MockShip;
        });

        test('should call game.handleDeath and remove self if hitting vulnerable Ship', () => {
            mockShipInstance.isInvincible = false;
            mockShipInstance.suspended = false;

            ufoBullet.collideWith(mockShipInstance);

            expect(mockGame.handleDeath).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
        });

        test('should remove self but NOT call game.handleDeath if hitting invincible Ship', () => {
            mockShipInstance.isInvincible = true;
            mockShipInstance.suspended = false;

            ufoBullet.collideWith(mockShipInstance);

            expect(mockGame.handleDeath).not.toHaveBeenCalled();
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
        });

        test('should remove self but NOT call game.handleDeath if hitting suspended Ship', () => {
             mockShipInstance.isInvincible = false;
             mockShipInstance.suspended = true;

            ufoBullet.collideWith(mockShipInstance);

            expect(mockGame.handleDeath).not.toHaveBeenCalled();
            expect(mockGame.remove).toHaveBeenCalledWith(ufoBullet);
            expect(mockGame.remove).toHaveBeenCalledTimes(1);
        });

         test('should do nothing if colliding with non-Ship object (e.g., Asteroid)', () => {
            const MockAsteroid = jest.fn(); // Minimal mock for instanceof check
             const mockAsteroidInstance = new MockAsteroid();
             mockAsteroidInstance.constructor = MockAsteroid;
             window.Asteroids.Asteroid = MockAsteroid; // Temporarily place mock

             ufoBullet.collideWith(mockAsteroidInstance);

             expect(mockGame.handleDeath).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();

             delete window.Asteroids.Asteroid; // Clean up global mock
         });

         test('should do nothing if colliding with player Bullet', () => {
             const MockBullet = jest.fn();
             const mockBulletInstance = new MockBullet();
             mockBulletInstance.constructor = MockBullet;
             window.Asteroids.Bullet = MockBullet;

             ufoBullet.collideWith(mockBulletInstance);

             expect(mockGame.handleDeath).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();

             delete window.Asteroids.Bullet;
         });
    });

    describe('draw', () => {
        test.todo('should call context drawImage correctly');
    });
}); 