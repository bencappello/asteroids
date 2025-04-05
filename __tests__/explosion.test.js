// __tests__/explosion.test.js

describe('Explosion Classes', () => {
    let ShipExplosion, AsteroidExplosion;
    let mockUtil;
    let MockImage;
    let mockCurrentGame;

    // Mocks BEFORE require
    beforeAll(() => {
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = { inherits: jest.fn(), repeat: jest.fn() }; // Mock repeat
        window.Asteroids.Util = mockUtil;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock currentGame
        mockCurrentGame = {
            ship: { radius: 20 }, // Mock ship radius needed by ShipExplosion
            remove: jest.fn()
        };
        global.currentGame = mockCurrentGame;

        // --- Require the script ---
        require('../lib/javascripts/explosion.js');
        ShipExplosion = window.Asteroids.ShipExplosion;
        AsteroidExplosion = window.Asteroids.AsteroidExplosion;
    });

    // Reset mocks
    beforeEach(() => {
        mockUtil.repeat.mockClear();
        MockImage.mockClear();
        mockCurrentGame.remove.mockClear();
    });

    // --- ShipExplosion Tests ---
    describe('Asteroids.ShipExplosion', () => {
        let shipExplosion;

        beforeEach(() => {
            shipExplosion = new ShipExplosion();
        });

        describe('Constructor', () => {
            test('should initialize properties correctly', () => {
                expect(shipExplosion.pos).toEqual([0, 0]);
                expect(shipExplosion.radius).toBe(30);
                expect(shipExplosion.img_obj.total_frames).toBe(25);
                expect(shipExplosion.frame).toBeGreaterThan(shipExplosion.img_obj.total_frames); // Starts inactive
                expect(MockImage).toHaveBeenCalledTimes(1);
                expect(MockImage.mock.instances[0].src).toBe('lib/images/ship_exp_sprite.png');
                expect(shipExplosion.img).toBe(MockImage.mock.instances[0]);
            });
        });

        describe('explode', () => {
            let mockCallback;
            const startPos = [100, 150];

            beforeEach(() => {
                 mockCallback = jest.fn();
                 // Mock ship radius for position calculation
                 mockCurrentGame.ship.radius = 10;
                 shipExplosion.explode(mockCallback, [...startPos]); // Pass copy of pos
            });

            test('should set frame to 1', () => {
                expect(shipExplosion.frame).toBe(1);
            });

            test('should adjust position based on ship radius', () => {
                 const expectedX = startPos[0] - (mockCurrentGame.ship.radius * 1.5); // 100 - 15 = 85
                 const expectedY = startPos[1] - (mockCurrentGame.ship.radius * 1.5); // 150 - 15 = 135
                 expect(shipExplosion.pos[0]).toBe(expectedX);
                 expect(shipExplosion.pos[1]).toBe(expectedY);
            });

            test('should call Util.repeat with correct parameters', () => {
                expect(mockUtil.repeat).toHaveBeenCalledTimes(1);
                const repeatArgs = mockUtil.repeat.mock.calls[0];
                const increaseFrameFn = repeatArgs[0];
                const interval = repeatArgs[1];
                const repetitions = repeatArgs[2];
                const finalCallback = repeatArgs[3];

                expect(typeof increaseFrameFn).toBe('function');
                expect(interval).toBe(60);
                expect(repetitions).toBe(shipExplosion.img_obj.total_frames);
                expect(finalCallback).toBe(mockCallback);

                 // Test the bound increase_frame function
                 expect(shipExplosion.frame).toBe(1); // Before call
                 increaseFrameFn(); // Call the bound function
                 expect(shipExplosion.frame).toBe(2); // Frame should increment
            });
        });

        describe('draw', () => {
            // Basic checks, full draw testing requires canvas mock
             test('should return early if frame > total_frames', () => {
                 const mockCtx = { drawImage: jest.fn() };
                 shipExplosion.frame = shipExplosion.img_obj.total_frames + 1; // Inactive frame
                 shipExplosion.draw(mockCtx);
                 expect(mockCtx.drawImage).not.toHaveBeenCalled();
             });

             // Test sprite calculation logic for a specific frame
             test('should calculate sprite coordinates correctly for a given frame', () => {
                 const mockCtx = { drawImage: jest.fn() };
                 shipExplosion.frame = 5; // Example frame
                 shipExplosion.pos = [85, 135];
                 shipExplosion.radius = 30;

                 shipExplosion.draw(mockCtx);

                 expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
                 const args = mockCtx.drawImage.mock.calls[0];
                 const [img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args;

                 const expectedSpriteWidth = shipExplosion.img_obj.width / shipExplosion.img_obj.total_frames; // 4800 / 25 = 192
                 const expectedSpriteX = expectedSpriteWidth * (shipExplosion.frame - 1); // 192 * 4 = 768
                 const expectedSpriteY = 0;
                 const expectedSpriteHeight = shipExplosion.img_obj.height; // 195

                 const expectedDrawX = Math.floor(shipExplosion.pos[0]); // 85
                 const expectedDrawY = Math.floor(shipExplosion.pos[1]); // 135
                 const expectedDrawWidth = shipExplosion.radius * 2; // 60
                 const expectedDrawHeight = shipExplosion.radius * 2; // 60

                 expect(img).toBe(shipExplosion.img);
                 expect(sx).toBe(expectedSpriteX);
                 expect(sy).toBe(expectedSpriteY);
                 expect(sWidth).toBe(expectedSpriteWidth);
                 expect(sHeight).toBe(expectedSpriteHeight);
                 expect(dx).toBe(expectedDrawX);
                 expect(dy).toBe(expectedDrawY);
                 expect(dWidth).toBe(expectedDrawWidth);
                 expect(dHeight).toBe(expectedDrawHeight);
             });
             test.todo('Full draw tests with canvas context mock');
        });
    });

     // --- AsteroidExplosion Tests ---
     describe('Asteroids.AsteroidExplosion', () => {
        let asteroidExplosion;
        let explosionOptions;

        beforeEach(() => {
            explosionOptions = {
                pos: [200, 250],
                radius: 40
            };
            asteroidExplosion = new AsteroidExplosion(explosionOptions);
        });

        describe('Constructor', () => {
            test('should initialize properties correctly', () => {
                expect(asteroidExplosion.pos).toEqual(explosionOptions.pos);
                expect(asteroidExplosion.radius).toBe(explosionOptions.radius);
                expect(asteroidExplosion.img_obj.total_frames).toBe(40);
                expect(asteroidExplosion.frame).toBeGreaterThan(asteroidExplosion.img_obj.total_frames); // Starts inactive
                expect(MockImage).toHaveBeenCalledTimes(1); // Assumes ShipExplosion test ran first
                const imageInstance = MockImage.mock.instances[MockImage.mock.instances.length -1]; // Get latest
                expect(imageInstance.src).toBe('lib/images/ast_exp_sprite.png');
                expect(asteroidExplosion.img).toBe(imageInstance);
            });

             test('should use default radius if not provided', () => {
                const explosionNoRadius = new AsteroidExplosion({ pos: [1,1] });
                expect(explosionNoRadius.radius).toBe(30); // Default value
            });
        });

        describe('explode', () => {
             beforeEach(() => {
                 // Ensure position is reset before explode adjusts it
                 asteroidExplosion.pos = [...explosionOptions.pos]; // [200, 250]
                 asteroidExplosion.explode();
             });

            test('should set frame to 1', () => {
                expect(asteroidExplosion.frame).toBe(1);
            });

            test('should adjust position based on radius', () => {
                 const expectedX = explosionOptions.pos[0] - explosionOptions.radius; // 200 - 40 = 160
                 const expectedY = explosionOptions.pos[1] - explosionOptions.radius; // 250 - 40 = 210
                 expect(asteroidExplosion.pos[0]).toBe(expectedX);
                 expect(asteroidExplosion.pos[1]).toBe(expectedY);
            });

            test('should call Util.repeat with correct parameters (including remove callback)', () => {
                expect(mockUtil.repeat).toHaveBeenCalledTimes(1);
                const repeatArgs = mockUtil.repeat.mock.calls[0];
                const increaseFrameFn = repeatArgs[0];
                const interval = repeatArgs[1];
                const repetitions = repeatArgs[2];
                const finalCallback = repeatArgs[3]; // Should be removeThis.bind(this)

                expect(typeof increaseFrameFn).toBe('function');
                expect(interval).toBe(40);
                expect(repetitions).toBe(asteroidExplosion.img_obj.total_frames);
                expect(typeof finalCallback).toBe('function');

                 // Test the bound increase_frame function
                 expect(asteroidExplosion.frame).toBe(1); // Before call
                 increaseFrameFn();
                 expect(asteroidExplosion.frame).toBe(2); // Frame increments

                 // Test the bound removeThis function
                 finalCallback(); // Call the remove function
                 expect(mockCurrentGame.remove).toHaveBeenCalledTimes(1);
                 expect(mockCurrentGame.remove).toHaveBeenCalledWith(asteroidExplosion);
            });
        });

        describe('draw', () => {
            test('should return early if frame > total_frames', () => {
                 const mockCtx = { drawImage: jest.fn() };
                 asteroidExplosion.frame = asteroidExplosion.img_obj.total_frames + 1; // Inactive
                 asteroidExplosion.draw(mockCtx);
                 expect(mockCtx.drawImage).not.toHaveBeenCalled();
             });

             test('should calculate sprite coords correctly for multi-row sheet', () => {
                 const mockCtx = { drawImage: jest.fn() };
                 asteroidExplosion.frame = 15; // Example frame (should be row 2, column 5)
                 asteroidExplosion.pos = [160, 210];
                 asteroidExplosion.radius = 40;

                 asteroidExplosion.draw(mockCtx);

                 expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
                 const args = mockCtx.drawImage.mock.calls[0];
                 const [img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args;

                 const imgObj = asteroidExplosion.img_obj;
                 const expectedSpriteWidth = imgObj.width / imgObj.frames_per_row; // 930 / 10 = 93
                 const expectedSpriteHeight = imgObj.height / imgObj.rows; // 400 / 4 = 100

                 const expectedColIndex = (asteroidExplosion.frame - 1) % imgObj.frames_per_row; // 14 % 10 = 4
                 const expectedRowIndex = Math.floor((asteroidExplosion.frame - 1) / imgObj.frames_per_row); // floor(14 / 10) = 1

                 const expectedSpriteX = expectedSpriteWidth * expectedColIndex; // 93 * 4 = 372
                 const expectedSpriteY = expectedSpriteHeight * expectedRowIndex; // 100 * 1 = 100

                 const expectedDrawX = Math.floor(asteroidExplosion.pos[0]); // 160
                 const expectedDrawY = Math.floor(asteroidExplosion.pos[1]); // 210
                 const expectedDrawWidth = asteroidExplosion.radius * 2; // 80
                 const expectedDrawHeight = asteroidExplosion.radius * 2; // 80

                 expect(img).toBe(asteroidExplosion.img);
                 expect(sx).toBe(expectedSpriteX);
                 expect(sy).toBe(expectedSpriteY);
                 expect(sWidth).toBe(expectedSpriteWidth);
                 expect(sHeight).toBe(expectedSpriteHeight);
                 expect(dx).toBe(expectedDrawX);
                 expect(dy).toBe(expectedDrawY);
                 expect(dWidth).toBe(expectedDrawWidth);
                 expect(dHeight).toBe(expectedDrawHeight);
             });
             test.todo('Full draw tests with canvas context mock');
        });
     });
}); 