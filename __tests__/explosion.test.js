// __tests__/explosion.test.js

describe('Explosions', () => {
    let ShipExplosion, AsteroidExplosion;
    let mockUtil;
    let MockImage;
    let mockCurrentGame; // Mock for global currentGame
    let mockCtx;

    beforeAll(() => {
        jest.resetModules();
        window.Asteroids = window.Asteroids || {};

        // Mock Util
        mockUtil = {
            repeat: jest.fn((func, interval, times, callback) => {
                // Simulate calling func immediately for testing state changes
                // In a real scenario, this would involve timers
                for (let i = 0; i < times; i++) {
                    func();
                }
                // Call the final callback if provided
                if (callback) {
                    callback();
                }
            })
        };
        window.Asteroids.Util = mockUtil;

        // Mock Image
        MockImage = jest.fn(function() { this.src = ''; });
        global.Image = MockImage;

        // Mock currentGame (used by explode methods)
        // Define Ship mock minimally for radius access
        const MockShip = { radius: 15 }; 
        mockCurrentGame = {
            ship: MockShip, 
            remove: jest.fn()
        };
        global.currentGame = mockCurrentGame;

        // --- Require the script ---
        const explosions = require('../lib/javascripts/explosion.js');
        ShipExplosion = explosions.ShipExplosion;
        AsteroidExplosion = explosions.AsteroidExplosion;
    });

    afterAll(() => {
        jest.restoreAllMocks();
        delete global.currentGame; // Clean up global
    });

    beforeEach(() => {
        mockUtil.repeat.mockClear();
        MockImage.mockClear();
        mockCurrentGame.remove.mockClear();

        // Mock context
        mockCtx = {
            drawImage: jest.fn(),
        };
    });

    // == ShipExplosion Tests ==
    describe('ShipExplosion', () => {
        let shipExplosion;
        beforeEach(() => {
            shipExplosion = new ShipExplosion();
        });

        test('constructor initializes properties', () => {
            expect(shipExplosion.pos).toEqual([0, 0]);
            expect(shipExplosion.radius).toBe(30);
            expect(shipExplosion.img).toBeInstanceOf(MockImage);
            expect(shipExplosion.img.src).toBe('lib/images/ship_exp_sprite.png');
            expect(shipExplosion.frame).toBeGreaterThan(shipExplosion.img_obj.total_frames);
        });

        describe('explode', () => {
            test('should reset frame, calculate position, and call Util.repeat', () => {
                const mockCallback = jest.fn();
                const shipPos = [100, 150];
                const initialFrame = shipExplosion.frame;
                expect(initialFrame).toBeGreaterThan(shipExplosion.img_obj.total_frames);

                shipExplosion.explode(mockCallback, shipPos);

                // Check position calculation
                const expectedPosX = shipPos[0] - (mockCurrentGame.ship.radius * 1.5);
                const expectedPosY = shipPos[1] - (mockCurrentGame.ship.radius * 1.5);
                expect(shipExplosion.pos[0]).toBe(expectedPosX);
                expect(shipExplosion.pos[1]).toBe(expectedPosY);

                // Check Util.repeat was called
                expect(mockUtil.repeat).toHaveBeenCalledTimes(1);
                const repeatArgs = mockUtil.repeat.mock.calls[0];
                expect(repeatArgs[1]).toBe(60); 
                expect(repeatArgs[2]).toBe(shipExplosion.img_obj.total_frames); 
                expect(repeatArgs[3]).toBe(mockCallback); 
                
                // Check frame AFTER mock repeat finished its synchronous loop
                expect(shipExplosion.frame).toBe(1 + shipExplosion.img_obj.total_frames); 

                // Check callback was called by mock repeat
                expect(mockCallback).toHaveBeenCalledTimes(1);
            });
        });

        describe('draw', () => {
            test('should not draw if frame > total_frames', () => {
                shipExplosion.frame = shipExplosion.img_obj.total_frames + 1;
                shipExplosion.draw(mockCtx);
                expect(mockCtx.drawImage).not.toHaveBeenCalled();
            });

            test('should call drawImage with correct sprite clipping if frame is valid', () => {
                shipExplosion.frame = 5; // Example frame
                shipExplosion.pos = [50, 60];
                shipExplosion.radius = 30;
                const imgObj = shipExplosion.img_obj;
                const expectedSpriteWidth = imgObj.width / imgObj.total_frames;
                const expectedSpriteHeight = imgObj.height;
                const expectedSpriteX = expectedSpriteWidth * (shipExplosion.frame - 1);
                const expectedSpriteY = 0;

                shipExplosion.draw(mockCtx);

                expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
                expect(mockCtx.drawImage).toHaveBeenCalledWith(
                    shipExplosion.img,
                    expectedSpriteX, expectedSpriteY, expectedSpriteWidth, expectedSpriteHeight,
                    Math.floor(shipExplosion.pos[0]), Math.floor(shipExplosion.pos[1]),
                    shipExplosion.radius * 2, shipExplosion.radius * 2
                );
            });
        });
    });

    // == AsteroidExplosion Tests ==
    describe('AsteroidExplosion', () => {
        let asteroidExplosion;
        let explosionOptions;
        beforeEach(() => {
            explosionOptions = {
                pos: [200, 250],
                radius: 25 // Specify radius
            };
            asteroidExplosion = new AsteroidExplosion(explosionOptions);
        });

        test('constructor initializes properties', () => {
            expect(asteroidExplosion.pos).toEqual(explosionOptions.pos);
            expect(asteroidExplosion.radius).toBe(explosionOptions.radius);
            expect(asteroidExplosion.img).toBeInstanceOf(MockImage);
            expect(asteroidExplosion.img.src).toBe('lib/images/ast_exp_sprite.png');
            expect(asteroidExplosion.frame).toBeGreaterThan(asteroidExplosion.img_obj.total_frames);
        });

         describe('explode', () => {
            test('should reset frame, adjust position, and call Util.repeat with remove callback', () => {
                const initialPos = [...asteroidExplosion.pos];
                const initialFrame = asteroidExplosion.frame;
                expect(initialFrame).toBeGreaterThan(asteroidExplosion.img_obj.total_frames);

                asteroidExplosion.explode();

                // Check position adjustment
                const expectedPosX = initialPos[0] - asteroidExplosion.radius;
                const expectedPosY = initialPos[1] - asteroidExplosion.radius;
                expect(asteroidExplosion.pos[0]).toBe(expectedPosX);
                expect(asteroidExplosion.pos[1]).toBe(expectedPosY);

                // Check Util.repeat call
                expect(mockUtil.repeat).toHaveBeenCalledTimes(1);
                const repeatArgs = mockUtil.repeat.mock.calls[0];
                expect(repeatArgs[1]).toBe(40); 
                expect(repeatArgs[2]).toBe(asteroidExplosion.img_obj.total_frames); 
                expect(repeatArgs[3]).toBeInstanceOf(Function);
                
                // Check frame AFTER mock repeat loop
                expect(asteroidExplosion.frame).toBe(1 + asteroidExplosion.img_obj.total_frames); 

                // Check remove callback was called by mock repeat
                expect(mockCurrentGame.remove).toHaveBeenCalledTimes(1);
                expect(mockCurrentGame.remove).toHaveBeenCalledWith(asteroidExplosion);
            });
        });

        describe('draw', () => {
             test('should not draw if frame > total_frames', () => {
                asteroidExplosion.frame = asteroidExplosion.img_obj.total_frames + 1;
                asteroidExplosion.draw(mockCtx);
                expect(mockCtx.drawImage).not.toHaveBeenCalled();
            });

            test('should call drawImage with correct sprite clipping if frame is valid', () => {
                asteroidExplosion.frame = 15; // Example frame
                asteroidExplosion.pos = [50, 60];
                asteroidExplosion.radius = 25;
                const imgObj = asteroidExplosion.img_obj;
                const spriteWidth = imgObj.width / imgObj.frames_per_row;
                const spriteHeight = imgObj.height / imgObj.rows;
                const expectedSpriteX = spriteWidth * ((asteroidExplosion.frame - 1) % imgObj.frames_per_row);
                const expectedSpriteY = spriteHeight * Math.floor((asteroidExplosion.frame - 1) / imgObj.frames_per_row);

                asteroidExplosion.draw(mockCtx);

                expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
                expect(mockCtx.drawImage).toHaveBeenCalledWith(
                    asteroidExplosion.img,
                    expectedSpriteX, expectedSpriteY, spriteWidth, spriteHeight,
                    Math.floor(asteroidExplosion.pos[0]), Math.floor(asteroidExplosion.pos[1]),
                    asteroidExplosion.radius * 2, asteroidExplosion.radius * 2
                );
            });
        });
    });
}); 