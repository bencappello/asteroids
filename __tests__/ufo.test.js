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

    // Setup mocks BEFORE requiring the script
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = {
            inherits: jest.fn(),
            randomVec: jest.fn().mockReturnValue([0.5, 0]), // Default random velocity
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


        // Mock UfoBullet constructor
        MockUfoBullet = jest.fn();
        window.Asteroids.UfoBullet = MockUfoBullet;

        // Mock Ship constructor
        MockShip = jest.fn(function() {
            this.suspended = false; this.isInvincible = false;
        });
        window.Asteroids.Ship = MockShip;

        // Mock Asteroid constructor
        MockAsteroid = jest.fn(function(args){
            this.pos = args.pos; this.radius = args.radius;
        });
        window.Asteroids.Asteroid = MockAsteroid;

        // Mock Bullet constructor (player bullet)
        MockBullet = jest.fn(function(args){
             this.pos = args.pos; this.radius = args.radius;
        });
        window.Asteroids.Bullet = MockBullet;

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
            handleDeath: jest.fn(),
        };

        // Mock Math.random
        originalMathRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.5); // Default: doesn't fire

        // --- Require the script ---
        require('../lib/javascripts/ufo.js');
        Ufo = window.Asteroids.Ufo;

        // Check inherits call
        expect(mockUtil.inherits).toHaveBeenCalledWith(Ufo, MockMovingObject);
    });

    afterAll(() => {
        // Restore original Math.random
        Math.random = originalMathRandom;
    });

    // Reset mocks
    let ufo;
    let ufoOptions;
    beforeEach(() => {
        MockMovingObject.mockClear();
        mockMovingObjectMove.mockClear();
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
        // Reset Math.random implementation if specific tests changed it
        Math.random.mockReturnValue(0.5);

        ufoOptions = {
            pos: [50, 50],
            game: mockGame
        };
        ufo = new Ufo(ufoOptions);
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
            expect(mockMovingObjectMove).toHaveBeenCalledTimes(1);
        });

        test('should fire bullet if Math.random < FIRE_RATE', () => {
            const fireRate = Ufo.FIRE_RATE; // e.g., 0.002
            Math.random.mockReturnValueOnce(fireRate * 0.5); // Value less than fire rate
            const fireBulletSpy = jest.spyOn(ufo, 'fireBullet'); // Spy on method

            ufo.move();
            expect(fireBulletSpy).toHaveBeenCalledTimes(1);

            fireBulletSpy.mockRestore(); // Clean up spy
        });

        test('should NOT fire bullet if Math.random >= FIRE_RATE', () => {
            const fireRate = Ufo.FIRE_RATE;
            Math.random.mockReturnValueOnce(fireRate); // Value equal to fire rate
             const fireBulletSpy = jest.spyOn(ufo, 'fireBullet');

            ufo.move();
            expect(fireBulletSpy).not.toHaveBeenCalled();

            Math.random.mockReturnValueOnce(fireRate * 1.5); // Value greater than fire rate
            ufo.move();
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

         beforeEach(() => {
             // Setup mock instances for collision checks
             mockShipInstance = new MockShip();
             mockShipInstance.constructor = MockShip; // For instanceof
             mockShipInstance.pos = [51, 51]; // Example position
             mockShipInstance.radius = (window.Asteroids.Ship && window.Asteroids.Ship.RADIUS) || 20;

             mockAsteroidInstance = new MockAsteroid({ pos: [52, 52], radius: 30 });
             mockAsteroidInstance.constructor = MockAsteroid;

             mockBulletInstance = new MockBullet({ pos: [49, 49], radius: 5 });
             mockBulletInstance.constructor = MockBullet;
         });

        // Ship Collisions
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

        // Asteroid Collisions
        test('should create/add/explode explosion, remove self and asteroid on Asteroid collision', () => {
            ufo.collideWith(mockAsteroidInstance);
            expect(MockAsteroidExplosion).toHaveBeenCalledWith({ pos: ufo.pos, radius: ufo.radius });
            expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance);
            expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufo);
            expect(mockGame.remove).toHaveBeenCalledWith(mockAsteroidInstance);
            expect(mockGame.remove).toHaveBeenCalledTimes(2);
        });

        // Player Bullet Collisions
         test('should create/add/explode explosion, remove self and bullet on Bullet collision', () => {
            ufo.collideWith(mockBulletInstance);
            expect(MockAsteroidExplosion).toHaveBeenCalledWith({ pos: ufo.pos, radius: ufo.radius });
            expect(mockGame.add).toHaveBeenCalledWith(mockAsteroidExplosionInstance);
            expect(mockAsteroidExplosionInstance.explode).toHaveBeenCalledTimes(1);
            expect(mockGame.remove).toHaveBeenCalledWith(ufo);
            expect(mockGame.remove).toHaveBeenCalledWith(mockBulletInstance);
            expect(mockGame.remove).toHaveBeenCalledTimes(2);
        });

         // Other Collisions
         test('should ignore collision with UfoBullet', () => {
             const mockUfoBulletInstance = new MockUfoBullet();
             mockUfoBulletInstance.constructor = MockUfoBullet;
             ufo.collideWith(mockUfoBulletInstance);
             expect(mockGame.add).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();
             expect(mockGame.handleDeath).not.toHaveBeenCalled();
         });

         test('should ignore collision with another Ufo', () => {
             const anotherUfo = new Ufo({pos:[0,0], game:mockGame}); // Uses actual constructor
             anotherUfo.constructor = Ufo; // Ensure instanceof works as expected
             ufo.collideWith(anotherUfo);
             expect(mockGame.add).not.toHaveBeenCalled();
             expect(mockGame.remove).not.toHaveBeenCalled();
             expect(mockGame.handleDeath).not.toHaveBeenCalled();
         });
     });


    describe('draw', () => {
        test.todo('should call context drawImage correctly');
    });

}); 