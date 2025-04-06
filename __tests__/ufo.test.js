// __tests__/ufo.test.js

describe('Asteroids.Ufo', () => {
    let Ufo;
    let MockMovingObject;
    let mockMovingObjectMove;
    let mockUtil;
    let mockGame;
    let MockUfoBullet;
    let MockShip;
    let MockAsteroid;
    let MockBullet; // Player bullet
    let MockAsteroidExplosion;
    let mockAsteroidExplosionInstance;
    let MockImage;
    let originalMathRandom;
    let mockCtx; // For draw test

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        jest.resetModules(); // Reset modules like in bullet test
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
                } else { /* ... */ }
            }),
            randomVec: jest.fn().mockReturnValue([0.5, 0]), 
        };
        window.Asteroids.Util = mockUtil;

        // Mock MovingObject constructor (properties only)
        MockMovingObject = jest.fn(function(args) {
            this.pos = args.pos; this.vel = args.vel; this.radius = args.radius; this.game = args.game; this.type = 'MovingObject';
        });
        // Define the prototype and add a mock for the base move method
        MockMovingObject.prototype = {
            move: jest.fn()
        };
        window.Asteroids.movingObject = MockMovingObject;

        // Mock UfoBullet constructor with type
        MockUfoBullet = jest.fn(function(args) { this.type = 'UfoBullet'; });
        window.Asteroids.UfoBullet = MockUfoBullet;

        // Mock Ship constructor with type
        MockShip = jest.fn(function(args={}) {
            this.type = 'Ship';
            this.suspended = args.suspended || false;
            this.isInvincible = args.isInvincible || false;
            this.radius = args.radius || 20;
            this.pos = args.pos || [0,0];
        });
        window.Asteroids.Ship = MockShip;

        // Mock Asteroid constructor with type
        MockAsteroid = jest.fn(function(args={}){
            this.type = 'Asteroid';
            this.pos = args.pos;
            this.radius = args.radius;
        });
        window.Asteroids.Asteroid = MockAsteroid;

        // Mock Bullet constructor (player bullet) with type
        MockBullet = jest.fn(function(args={}){
             this.type = 'Bullet';
             this.pos = args.pos;
             this.radius = args.radius;
        });
        window.Asteroids.Bullet = MockBullet;

        // Mock AsteroidExplosion with type and explode method
        mockAsteroidExplosionInstance = { type: 'Explosion', explode: jest.fn() };
        MockAsteroidExplosion = jest.fn((args) => {
            mockAsteroidExplosionInstance.pos = args.pos;
            mockAsteroidExplosionInstance.radius = args.radius;
            mockAsteroidExplosionInstance.game = args.game;
            return mockAsteroidExplosionInstance;
        });
        window.Asteroids.AsteroidExplosion = MockAsteroidExplosion;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock Game methods needed by UFO
        mockGame = {
            remove: jest.fn(),
            add: jest.fn(),
            handleDeath: jest.fn(),
        };

        // Mock Math.random
        originalMathRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.5); // Default: doesn't fire

        // --- Require the script ---
        Ufo = require('../lib/javascripts/ufo.js');
    });

    afterAll(() => {
        // Restore original Math.random
        Math.random = originalMathRandom;
        // Restore other mocks/globals if necessary
        jest.restoreAllMocks(); 
    });

    // Reset mocks
    let ufo;
    let ufoOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        // Don't clear inherits mock
        mockUtil.randomVec.mockClear();
        mockGame.remove.mockClear();
        mockGame.add.mockClear();
        mockGame.handleDeath.mockClear();
        MockUfoBullet.mockClear();
        MockShip.mockClear();
        MockAsteroid.mockClear();
        MockBullet.mockClear();
        MockAsteroidExplosion.mockClear();
        mockAsteroidExplosionInstance.explode.mockClear();
        MockImage.mockClear();
        Math.random.mockClear();
        Math.random.mockReturnValue(0.5);

        // Mock context for draw tests
        mockCtx = {
            drawImage: jest.fn(),
            // Add other context methods if UFO.draw uses them
        };

        ufoOptions = {
            pos: [50, 50],
            game: mockGame
        };
        ufo = new Ufo(ufoOptions);

        // Also clear the mock base move method
        if(MockMovingObject.prototype.move.mockClear) {
            MockMovingObject.prototype.move.mockClear();
        }
    });

    describe('Constructor', () => {
        test('should initialize default properties', () => {
            expect(ufo.radius).toBe(Ufo.RADIUS);
            expect(ufo.isWrappable).toBe(true); // Check prototype property
            expect(ufo.game).toBe(mockGame);
        });

         test('should call MovingObject with random velocity if not provided', () => {
             mockUtil.randomVec.mockReturnValueOnce([0.1, 0.2]);
             const ufoInstance = new Ufo({ pos: [1,1], game: mockGame }); // Re-instantiate for this test

             expect(mockUtil.randomVec).toHaveBeenCalledWith(Ufo.SPEED);
             expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
                 vel: [0.1, 0.2],
                 radius: Ufo.RADIUS,
                 pos: [1,1],
                 game: mockGame
             }));
         });

         test('should call MovingObject with provided velocity', () => {
             const optionsWithVel = { pos: [1,1], game: mockGame, vel: [9, 9] };
             // Clear mock specifically for this test instantiation
             mockUtil.randomVec.mockClear();
             const ufoInstance = new Ufo(optionsWithVel); // Re-instantiate

             expect(mockUtil.randomVec).not.toHaveBeenCalled();
             expect(MockMovingObject).toHaveBeenCalledWith(expect.objectContaining({
                 vel: [9, 9],
                 radius: Ufo.RADIUS,
                 pos: [1,1],
                 game: mockGame
             }));
         });

        test('should create Image and set src', () => {
            expect(MockImage).toHaveBeenCalledTimes(1); // From initial beforeEach creation
            const imageInstance = MockImage.mock.instances[0];
            expect(imageInstance.src).toBe('lib/images/ufo.png');
            expect(ufo.img).toBe(imageInstance);
        });
    });

    describe('move', () => {
        test('should call MovingObject.prototype.move', () => {
            ufo.move();
            // Expect the mock function defined on the prototype to have been called
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
            // Ensure it was called with the UFO instance as `this` context
            expect(MockMovingObject.prototype.move).toHaveBeenCalledWith(); // Called with no args
            // Cannot easily check `this` context directly without altering the mock further
        });

        test('should fire bullet if Math.random < FIRE_RATE', () => {
            const fireRate = Ufo.FIRE_RATE;
            Math.random.mockReturnValueOnce(fireRate * 0.5);
            const fireBulletSpy = jest.spyOn(ufo, 'fireBullet').mockImplementation(()=>{}); // Spy and stub

            ufo.move();
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
            expect(fireBulletSpy).toHaveBeenCalledTimes(1);

            fireBulletSpy.mockRestore();
        });

        test('should NOT fire bullet if Math.random >= FIRE_RATE', () => {
            const fireRate = Ufo.FIRE_RATE;
            Math.random.mockReturnValueOnce(fireRate);
             const fireBulletSpy = jest.spyOn(ufo, 'fireBullet');

            ufo.move();
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
            expect(fireBulletSpy).not.toHaveBeenCalled();

            // Clear first call to move mock for second check
            MockMovingObject.prototype.move.mockClear();

            Math.random.mockReturnValueOnce(fireRate * 1.5);
            ufo.move();
            expect(MockMovingObject.prototype.move).toHaveBeenCalledTimes(1);
            expect(fireBulletSpy).not.toHaveBeenCalled();

            fireBulletSpy.mockRestore();
        });
    });

    describe('fireBullet', () => {
        test('should create UfoBullet with correct properties', () => {
            ufo.pos = [100, 200];
            ufo.fireBullet();

            const expectedVel = [0, Ufo.BULLET_SPEED]; // Shoots down
            const expectedPos = [100, 200];

            expect(MockUfoBullet).toHaveBeenCalledTimes(1);
            expect(MockUfoBullet).toHaveBeenCalledWith({
                pos: expectedPos,
                vel: expectedVel,
                game: mockGame
            });
        });

        test('should add the new bullet to the game', () => {
            ufo.fireBullet();
            expect(mockGame.add).toHaveBeenCalledTimes(1);
            // Check that the instance created by the mock constructor was added
            expect(mockGame.add).toHaveBeenCalledWith(MockUfoBullet.mock.instances[0]);
        });
    });

     describe('collideWith', () => {
        let mockShipInstance;
        let mockAsteroidInstance;
        let mockBulletInstance;
        let mockUfoBulletInstance;
        let anotherUfo;

         beforeEach(() => {
             // Setup mock instances for collision checks, ensuring they have type
             mockShipInstance = new MockShip({ pos: [51, 51], radius: 20, suspended: false, isInvincible: false });
             mockAsteroidInstance = new MockAsteroid({ pos: [52, 52], radius: 30 });
             mockBulletInstance = new MockBullet({ pos: [49, 49], radius: 5 });
             mockUfoBulletInstance = new MockUfoBullet({ pos: [50, 49], radius: 8 }); // Add type via mock
             mockUfoBulletInstance.type = 'UfoBullet'; // Explicitly add type if constructor mock doesn't
             anotherUfo = new Ufo({ pos: [50, 51], game: mockGame }); // Real Ufo instances have type
         });

        // Ship Collisions (using type checks now)
         test('should call game.handleDeath if colliding with vulnerable Ship', () => {
             mockShipInstance.isInvincible = false;
             mockShipInstance.suspended = false;
             ufo.collideWith(mockShipInstance);
             expect(mockGame.handleDeath).toHaveBeenCalledTimes(1);
         });

         test('should NOT call game.handleDeath if colliding with invincible Ship', () => {
             mockShipInstance.isInvincible = true;
             mockShipInstance.suspended = false;
             ufo.collideWith(mockShipInstance);
             expect(mockGame.handleDeath).not.toHaveBeenCalled();
         });

          test('should NOT call game.handleDeath if colliding with suspended Ship', () => {
             mockShipInstance.isInvincible = false;
             mockShipInstance.suspended = true;
             ufo.collideWith(mockShipInstance);
             expect(mockGame.handleDeath).not.toHaveBeenCalled();
         });

        // Asteroid Collision
        test('should remove self and asteroid, add explosion on Asteroid collision', () => {
            ufo.collideWith(mockAsteroidInstance);
            expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance); // Check the instance
            expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufo);
            expect(mockGame.remove).toHaveBeenCalledWith(mockAsteroidInstance);
        });

        // Player Bullet Collision
        test('should remove self and bullet, add explosion on Bullet collision', () => {
            ufo.collideWith(mockBulletInstance);
            expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance); // Check the instance
            expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufo);
            expect(mockGame.remove).toHaveBeenCalledWith(mockBulletInstance);
        });

        // UFO Bullet Collision
        test('should do nothing on UfoBullet collision', () => {
            ufo.collideWith(mockUfoBulletInstance);
            expect(mockGame.add).not.toHaveBeenCalled();
            expect(mockGame.remove).not.toHaveBeenCalled();
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });

        // UFO Collision
        test('should do nothing on collision with another Ufo', () => {
            ufo.collideWith(anotherUfo);
            expect(mockGame.add).not.toHaveBeenCalled();
            expect(mockGame.remove).not.toHaveBeenCalled();
            expect(mockGame.handleDeath).not.toHaveBeenCalled();
        });
    });

    // Implement the draw test
    test('draw should call context drawImage correctly', () => {
        mockCtx.drawImage.mockClear(); // Clear before draw call
        ufo.pos = [100, 150]; // Set specific position
        ufo.draw(mockCtx);

        expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
        expect(mockCtx.drawImage).toHaveBeenCalledWith(
            ufo.img, // The Image instance
            100 - ufo.radius, // Expected x
            150 - ufo.radius, // Expected y
            ufo.radius * 2, // Expected width
            ufo.radius * 2 // Expected height
        );
    });
}); 