// __tests__/movingObject.test.js

describe('Asteroids.movingObject', () => {
    let MovingObject;
    let mockGame;

    // Setup environment, mock dependencies, and load the script
    beforeAll(() => {
        // Ensure Asteroids namespace exists
        window.Asteroids = {};

        // Mock the global currentGame object and its methods
        mockGame = {
            isOutOfBounds: jest.fn(),
            wrap: jest.fn((pos) => pos), // Default wrap returns position unchanged
            remove: jest.fn(),
            // Add dimensions if needed by any methods (not directly used by MovingObject itself)
            // DIM_X: 800,
            // DIM_Y: 600
        };
        // Assign the mock to the global scope where the script expects it
        global.currentGame = mockGame;

        // Require the script to define Asteroids.movingObject
        require('../lib/javascripts/movingObject.js');
        MovingObject = window.Asteroids.movingObject; // Assign the constructor
    });

    // Reset mocks before each test
    beforeEach(() => {
        mockGame.isOutOfBounds.mockClear();
        mockGame.wrap.mockClear();
        mockGame.remove.mockClear();
        // Reset mock return values if necessary
        mockGame.isOutOfBounds.mockReturnValue(false);
        mockGame.wrap.mockImplementation(pos => pos); // Reset wrap to default pass-through
    });

    describe('Constructor', () => {
        test('should initialize properties correctly', () => {
            const options = {
                pos: [10, 20],
                vel: [1, -1],
                radius: 5,
                game: mockGame // Pass the mock game explicitly
            };
            const obj = new MovingObject(options);

            expect(obj.pos).toEqual(options.pos);
            expect(obj.vel).toEqual(options.vel);
            expect(obj.radius).toBe(options.radius);
            expect(obj.game).toBe(options.game); // Check if it stores the game reference
            expect(obj.isWrappable).toBe(true); // Check default value
        });
    });

    describe('move', () => {
        let obj;
        const initialPos = [50, 50];
        const initialVel = [5, -5];

        beforeEach(() => {
            obj = new MovingObject({
                pos: [...initialPos], // Clone initial pos
                vel: initialVel,
                radius: 10,
                game: mockGame
            });
        });

        test('should update position based on velocity', () => {
            obj.move();
            expect(obj.pos[0]).toBe(initialPos[0] + initialVel[0]);
            expect(obj.pos[1]).toBe(initialPos[1] + initialVel[1]);
        });

        test('should call game.wrap if object is wrappable and in bounds', () => {
            mockGame.isOutOfBounds.mockReturnValue(false); // Ensure it's considered in bounds
            obj.isWrappable = true;
            obj.move();
            expect(mockGame.wrap).toHaveBeenCalledWith(obj.pos, obj.radius);
            expect(mockGame.remove).not.toHaveBeenCalled();
        });

         test('should call game.wrap if object is wrappable and out of bounds', () => {
            mockGame.isOutOfBounds.mockReturnValue(true); // Simulate out of bounds
             mockGame.wrap.mockImplementation(pos => [0,0]); // Mock wrap returning a new position
            obj.isWrappable = true;
            obj.move();
            // isOutOfBounds check happens *after* position update, before wrap is applied
            expect(mockGame.isOutOfBounds).toHaveBeenCalledWith([initialPos[0] + initialVel[0], initialPos[1] + initialVel[1]], obj.radius);
            expect(mockGame.wrap).toHaveBeenCalledWith([initialPos[0] + initialVel[0], initialPos[1] + initialVel[1]], obj.radius);
            expect(obj.pos).toEqual([0,0]); // Check that pos was updated by mocked wrap
            expect(mockGame.remove).not.toHaveBeenCalled();
        });

        test('should NOT call game.remove if object is wrappable and out of bounds', () => {
             mockGame.isOutOfBounds.mockReturnValue(true);
            obj.isWrappable = true;
            obj.move();
            expect(mockGame.remove).not.toHaveBeenCalled();
             expect(mockGame.wrap).toHaveBeenCalled(); // Should still wrap
        });

         test('should call game.wrap but not game.remove if object is NOT wrappable and IN bounds', () => {
            mockGame.isOutOfBounds.mockReturnValue(false); // Simulate in bounds
            obj.isWrappable = false;
            const expectedPosAfterMove = [initialPos[0] + initialVel[0], initialPos[1] + initialVel[1]];
            obj.move();
            expect(mockGame.isOutOfBounds).toHaveBeenCalledWith(expectedPosAfterMove, obj.radius);
            expect(mockGame.remove).not.toHaveBeenCalled();
            // Wrap IS called even if not wrappable, as long as it's not removed
            expect(mockGame.wrap).toHaveBeenCalledWith(expectedPosAfterMove, obj.radius);
        });
    });

    describe('isCollidedWith', () => {
        let obj1;
        beforeEach(() => {
            obj1 = new MovingObject({ pos: [10, 10], radius: 5, vel: [0,0], game: mockGame });
        });

        test('should return true if distance is less than sum of radii', () => {
            // obj1 at [10, 10], radius 5
            const obj2 = new MovingObject({ pos: [16, 10], radius: 2, vel: [0,0], game: mockGame }); // Distance = 6, Radii Sum = 7
            expect(obj1.isCollidedWith(obj2)).toBe(true);
        });

        test('should return true if objects are at the same position', () => {
             const obj2 = new MovingObject({ pos: [10, 10], radius: 1, vel: [0,0], game: mockGame }); // Distance = 0, Radii Sum = 6
            expect(obj1.isCollidedWith(obj2)).toBe(true);
        });

        test('should return false if distance is greater than sum of radii', () => {
            // obj1 at [10, 10], radius 5
            const obj2 = new MovingObject({ pos: [20, 10], radius: 4, vel: [0,0], game: mockGame }); // Distance = 10, Radii Sum = 9
            expect(obj1.isCollidedWith(obj2)).toBe(false);
        });

        test('should return false if distance is exactly equal to sum of radii', () => {
             // obj1 at [10, 10], radius 5
            const obj2 = new MovingObject({ pos: [18, 10], radius: 3, vel: [0,0], game: mockGame }); // Distance = 8, Radii Sum = 8
            expect(obj1.isCollidedWith(obj2)).toBe(false); // Based on implementation using '<'
        });
    });

    // collideWith is empty, no tests needed unless subclasses override it.
}); 