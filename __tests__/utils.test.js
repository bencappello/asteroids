// __tests__/utils.test.js

describe('Asteroids.Util', () => {
    let Util;
    let localStorageMock;

    // Setup the environment and load the script before tests run
    beforeAll(() => {
        // Ensure the global namespace exists before requiring the script
        // JSDOM provides the 'window' object globally in the test environment
        window.Asteroids = {};

        // Mock localStorage
        localStorageMock = (() => {
            let store = {};
            return {
                getItem: jest.fn((key) => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                clear: jest.fn(() => { store = {}; }),
                removeItem: jest.fn((key) => { delete store[key]; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true }); // writable:true allows reassignment if needed

        // Mock dependencies if needed by utils.js, e.g., localStorage or currentGame
        // For localStorage mocking (if high score tests are added later):
        /*
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => { store[key] = value.toString(); },
                clear: () => { store = {}; },
                removeItem: (key) => { delete store[key]; }
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        */
        // global.currentGame = { width: 800, height: 600 };

        // Now require the script. It will attach its methods to window.Asteroids.Util
        require('../lib/javascripts/utils.js');

        // Assign Util for use in tests
        Util = window.Asteroids.Util;
    });

    // Clear mocks/storage before each test in the high score suite
    // (Could also be inside the High Score describe block)
    beforeEach(() => {
         localStorageMock.clear();
         // Reset mocks if they were called in previous tests
         localStorageMock.getItem.mockClear();
         localStorageMock.setItem.mockClear();
         // Reset console spy if used
         if (jest.isMockFunction(console.error)) {
             console.error.mockClear();
         }
    });

    afterAll(() => {
        // Restore console.error if it was spied on
        if (jest.isMockFunction(console.error)) {
             console.error.mockRestore();
         }
    });

    describe('inherits', () => {
        let ParentClass;
        let ChildClass;

        beforeEach(() => {
            // Define simple parent and child classes for testing
            ParentClass = function() {
                this.parentProp = 'parent';
            };
            ParentClass.prototype.parentMethod = function() {
                return 'parent method called';
            };

            ChildClass = function() {
                this.childProp = 'child';
            };

            // Perform the inheritance
            Util.inherits(ChildClass, ParentClass);
        });

        test('should make child an instance of parent', () => {
            const child = new ChildClass();
            expect(child instanceof ParentClass).toBe(true);
        });

        test('should make child an instance of child', () => {
            const child = new ChildClass();
            expect(child instanceof ChildClass).toBe(true);
        });

        test('should set the constructor correctly', () => {
            const child = new ChildClass();
            expect(child.constructor).toBe(ChildClass);
        });

        test('should allow child to access parent prototype methods', () => {
            const child = new ChildClass();
            expect(child.parentMethod()).toBe('parent method called');
        });

        test('should allow child to have its own properties', () => {
            const child = new ChildClass();
            expect(child.childProp).toBe('child');
        });

        test('should not modify parent prototype directly', () => {
             // Check if adding a method to Child prototype affects Parent prototype
            ChildClass.prototype.childMethod = () => {};
            expect(ParentClass.prototype.childMethod).toBeUndefined();
        });
    });

    describe('Trigonometric Helpers', () => {
        const TOLERANCE = 0.0001; // Tolerance for floating point comparisons

        test('sin calculates sine of degrees correctly', () => {
            expect(Util.sin(0)).toBeCloseTo(Math.sin(0), TOLERANCE);
            expect(Util.sin(90)).toBeCloseTo(Math.sin(Math.PI / 2), TOLERANCE);
            expect(Util.sin(180)).toBeCloseTo(Math.sin(Math.PI), TOLERANCE);
            expect(Util.sin(270)).toBeCloseTo(Math.sin(3 * Math.PI / 2), TOLERANCE);
        });

        test('cos calculates cosine of degrees correctly', () => {
            expect(Util.cos(0)).toBeCloseTo(Math.cos(0), TOLERANCE);
            expect(Util.cos(90)).toBeCloseTo(Math.cos(Math.PI / 2), TOLERANCE);
            expect(Util.cos(180)).toBeCloseTo(Math.cos(Math.PI), TOLERANCE);
            expect(Util.cos(270)).toBeCloseTo(Math.cos(3 * Math.PI / 2), TOLERANCE);
        });

        test('toRadians converts degrees to radians correctly', () => {
            expect(Util.toRadians(0)).toBeCloseTo(0, TOLERANCE);
            expect(Util.toRadians(90)).toBeCloseTo(Math.PI / 2, TOLERANCE);
            expect(Util.toRadians(180)).toBeCloseTo(Math.PI, TOLERANCE);
            expect(Util.toRadians(360)).toBeCloseTo(2 * Math.PI, TOLERANCE);
        });
    });

    describe('Vector Helpers', () => {
        const TOLERANCE = 0.0001;

        test('randomVec creates a vector with the specified length', () => {
            const length = 10;
            const vec = Util.randomVec(length);
            const magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
            expect(magnitude).toBeCloseTo(length, TOLERANCE);
        });

        test('randomVec creates different vectors on subsequent calls', () => {
            // Mock Math.random to ensure distinct angles for this test
            const randomSpy = jest.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.1); // First call returns 0.1
            randomSpy.mockReturnValueOnce(0.7); // Second call returns 0.7

            const vec1 = Util.randomVec(5);
            const vec2 = Util.randomVec(5);
            
            expect(vec1[0]).not.toBeCloseTo(vec2[0], TOLERANCE);
            expect(vec1[1]).not.toBeCloseTo(vec2[1], TOLERANCE); // Check y-component too

            // Restore the original Math.random
            randomSpy.mockRestore();
        });

        test('scale multiplies vector components by a scalar', () => {
            const vec = [2, -3];
            const scalar = 5;
            const scaledVec = Util.scale(vec, scalar);
            expect(scaledVec).toEqual([10, -15]);
        });

         test('scale handles zero scalar', () => {
            const vec = [2, -3];
            const scaledVec = Util.scale(vec, 0);
            // Check elements individually to handle -0 === 0
            expect(scaledVec[0]).toBeCloseTo(0, TOLERANCE);
            expect(scaledVec[1]).toBeCloseTo(0, TOLERANCE);
        });

        test('generateVec creates a vector from magnitude and angle (degrees)', () => {
            const magnitude = 10;
            // Test cardinal directions
            let vec = Util.generateVec(magnitude, 0); // Up (cos=1, sin=0)
            expect(vec[0]).toBeCloseTo(0, TOLERANCE); // x = sin(0)*mag
            expect(vec[1]).toBeCloseTo(10, TOLERANCE); // y = cos(0)*mag

            vec = Util.generateVec(magnitude, 90); // Right (cos=0, sin=1)
            expect(vec[0]).toBeCloseTo(10, TOLERANCE); // x = sin(90)*mag
            expect(vec[1]).toBeCloseTo(0, TOLERANCE); // y = cos(90)*mag

            vec = Util.generateVec(magnitude, 180); // Down (cos=-1, sin=0)
            expect(vec[0]).toBeCloseTo(0, TOLERANCE); // x = sin(180)*mag
            expect(vec[1]).toBeCloseTo(-10, TOLERANCE); // y = cos(180)*mag
        });
    });

    describe('High Score Functions', () => {
        const HIGH_SCORE_KEY = 'asteroidsHighScores';
        const MAX_HIGH_SCORES = 20; // Assuming this constant is accessible or known

        test('loadHighScores returns default scores when localStorage is empty', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);
            const scores = Util.loadHighScores();
            expect(scores.length).toBe(MAX_HIGH_SCORES); // Should provide defaults
            expect(scores[0]).toEqual({ initials: "ACE", score: 20000 });
            // Check if it saved the defaults back
            expect(localStorageMock.setItem).toHaveBeenCalledWith(HIGH_SCORE_KEY, JSON.stringify(scores));
        });

        test('loadHighScores returns scores from localStorage if valid', () => {
            const storedScores = [{ initials: 'BEN', score: 500 }];
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedScores));
            const scores = Util.loadHighScores();
            expect(scores).toEqual(storedScores);
            expect(localStorageMock.setItem).not.toHaveBeenCalled(); // Shouldn't save back if loaded ok
        });

         test('loadHighScores handles invalid JSON gracefully', () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid json');
            // Spy on console.error to check for error logging
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const scores = Util.loadHighScores();
            // Should return default scores after error
            expect(scores.length).toBe(MAX_HIGH_SCORES);
            expect(scores[0]).toEqual({ initials: "ACE", score: 20000 });
            expect(consoleSpy).toHaveBeenCalled();
             expect(localStorageMock.setItem).toHaveBeenCalled(); // Saves defaults after error
            consoleSpy.mockRestore(); // Restore console.error after this test
        });

        test('saveHighScores saves sorted and trimmed scores', () => {
            const scoresToSave = [
                { initials: 'C', score: 100 },
                { initials: 'A', score: 300 },
                { initials: 'B', score: 200 }
            ];
            const expectedSorted = [
                { initials: 'A', score: 300 },
                { initials: 'B', score: 200 },
                { initials: 'C', score: 100 }
            ];
            Util.saveHighScores(scoresToSave);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(HIGH_SCORE_KEY, JSON.stringify(expectedSorted));
        });

         test('saveHighScores trims scores to MAX_HIGH_SCORES', () => {
            const scoresToSave = Array.from({ length: MAX_HIGH_SCORES + 5 }, (_, i) => ({
                initials: `T${i}`, score: (MAX_HIGH_SCORES + 5 - i) * 100
            }));
             Util.saveHighScores(scoresToSave);
             const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
             expect(savedData.length).toBe(MAX_HIGH_SCORES);
             expect(savedData[0].score).toBe((MAX_HIGH_SCORES + 5) * 100); // Highest score
             expect(savedData[MAX_HIGH_SCORES - 1].score).toBe(6 * 100); // 6th highest score original index 19
        });

         test('isHighScore identifies a qualifying score (list not full)', () => {
            const highScores = [{ initials: 'A', score: 100 }];
            expect(Util.isHighScore(200, highScores)).toBe(true);
         });

         test('isHighScore identifies a qualifying score (list full, score higher)', () => {
             const highScores = Array.from({ length: MAX_HIGH_SCORES }, (_, i) => ({
                initials: `T${i}`, score: (MAX_HIGH_SCORES - i) * 100
            })); // Lowest score is 100
            expect(Util.isHighScore(150, highScores)).toBe(true);
         });

        test('isHighScore identifies a non-qualifying score (list full, score lower)', () => {
             const highScores = Array.from({ length: MAX_HIGH_SCORES }, (_, i) => ({
                initials: `T${i}`, score: (MAX_HIGH_SCORES - i) * 100
            })); // Lowest score is 100
            expect(Util.isHighScore(50, highScores)).toBe(false);
         });

         test('isHighScore handles invalid input score', () => {
             const highScores = [{ initials: 'A', score: 100 }];
             expect(Util.isHighScore(0, highScores)).toBe(false);
             expect(Util.isHighScore(-10, highScores)).toBe(false);
             expect(Util.isHighScore(null, highScores)).toBe(false);
             expect(Util.isHighScore(undefined, highScores)).toBe(false);
             expect(Util.isHighScore('abc', highScores)).toBe(false);
         });

         test('addHighScore adds score to non-full list and saves', () => {
             let highScores = [{ initials: 'B', score: 100 }];
             const updatedScores = Util.addHighScore('NEW', 500, highScores);
             expect(updatedScores).toEqual([
                 { initials: 'NEW', score: 500 },
                 { initials: 'B', score: 100 }
             ]);
             // Check that save was called with the updated list
             expect(localStorageMock.setItem).toHaveBeenCalledWith(HIGH_SCORE_KEY, JSON.stringify(updatedScores));
         });

        test('addHighScore adds score to full list, trims, and saves', () => {
             let highScores = Array.from({ length: MAX_HIGH_SCORES }, (_, i) => ({
                initials: `T${i}`, score: (MAX_HIGH_SCORES - i) * 100
            })); // Lowest score 100 at index 19
            const newScore = 150;
             const updatedScores = Util.addHighScore('NEW', newScore, highScores);

             expect(updatedScores.length).toBe(MAX_HIGH_SCORES);
             expect(updatedScores.find(s => s.initials === 'NEW' && s.score === newScore)).toBeTruthy();
             expect(updatedScores.find(s => s.score === 100)).toBeFalsy(); // Lowest score should be gone
             expect(updatedScores[MAX_HIGH_SCORES - 1].score).toBeGreaterThan(100); // New lowest score
             expect(localStorageMock.setItem).toHaveBeenCalledWith(HIGH_SCORE_KEY, JSON.stringify(updatedScores));
        });

        test('addHighScore truncates initials longer than 3 chars', () => {
             let highScores = [];
             const updatedScores = Util.addHighScore('LONGER', 500, highScores);
             expect(updatedScores[0].initials).toBe('LON');
             expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('addHighScore handles invalid input gracefully', () => {
            let highScores = [{initials: 'A', score: 100}];
            const originalScoresString = JSON.stringify(highScores); // Keep a copy

            // Invalid score
            let result = Util.addHighScore('TST', 0, highScores);
            expect(result).toEqual(highScores); // Should return original list
            expect(localStorageMock.setItem).not.toHaveBeenCalled(); // Should not save

             // Invalid initials
             localStorageMock.setItem.mockClear(); // Clear previous calls if any
             result = Util.addHighScore('', 200, highScores);
             expect(result).toEqual(highScores);
             expect(localStorageMock.setItem).not.toHaveBeenCalled();

              // Invalid type
             localStorageMock.setItem.mockClear();
             result = Util.addHighScore('TST', 'abc', highScores);
             expect(result).toEqual(highScores);
             expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        // Note: Testing displayHighScores requires DOM manipulation mocking
        // It might be better suited for E2E tests or more complex DOM mocking setup.
        test.todo('displayHighScores updates DOM correctly');

    });

    // TODO: Add tests for randCorner and repeat if necessary
}); 