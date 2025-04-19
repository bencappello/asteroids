const GameView = require('../lib/javascripts/gameView');
const _ = require('lodash'); // Import lodash to mock

// Keep track of the mocked throttled functions
let mockThrottledFuncs = {};

jest.mock('lodash', () => ({
  throttle: jest.fn((fn, delay, options) => {
    // Create a NEW mock function for the throttled result
    const throttledFn = jest.fn((...args) => {
      // Optionally, call the original function if needed for side effects
      // fn.apply(null, args); 
      // For testing calls, we often don't need to execute the original fn
    });
    throttledFn.cancel = jest.fn(); // Mock cancel if needed
    // Store it for potential later access/clearing if needed by key (e.g., function name)
    const key = fn.name || 'anonymousThrottle';
    mockThrottledFuncs[key] = throttledFn;
    return throttledFn; // Return the NEW mock
  })
}));

describe('GameView', () => {
  let gameView;
  let mockGameInstance; // Renamed for clarity, represents global.currentGame
  let mockCtx;

  beforeEach(() => {
    // Clear mocks
    // _.throttle.mockClear(); // Moved clearing to afterEach/test level if needed
    // Clear the stored throttled function mocks
    Object.values(mockThrottledFuncs).forEach(mockFn => mockFn.mockClear());

    // Define global mocks *before* creating GameView
    global.Frame_Rate = 30;
    // Mock the global underscore object expected by gameView.js
    global._ = {
      throttle: jest.fn(fn => fn) // Simple throttle mock for the global_
    };
    mockGameInstance = {
      step: jest.fn(),
      draw: jest.fn(),
      ship: {
        power: jest.fn(),
        rotate: jest.fn(),
        fireBullet: jest.fn(), // Mock the original function passed to throttle
      },
      preLevelState: null, // Default to null for assessKeys tests
      // Add any other necessary mock methods/properties for currentGame
    };
    global.currentGame = mockGameInstance;

    // Create a mock canvas context
    mockCtx = {
      clearRect: jest.fn(),
      fillStyle: 'black',
      fillRect: jest.fn(),
    };

    // Create GameView instance (only takes ctx)
    gameView = new GameView(mockCtx);
  });

  afterEach(() => {
    // Clean up globals to avoid test pollution
    delete global.currentGame;
    delete global.Frame_Rate;
    delete global._; // Clean up the underscore mock
    jest.useRealTimers(); // Ensure real timers are restored
  });

  test('constructor initializes ctx', () => {
    expect(gameView.ctx).toBe(mockCtx);
    expect(gameView.intervalID).toBeNull();
  });

  describe('start', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(gameView, 'bindKeyHandlers'); // Spy on method called by start
      jest.spyOn(gameView, 'assessKeys');
      jest.spyOn(global, 'setInterval');
    });

    test('sets up an interval timer using global Frame_Rate', () => {
      gameView.start();
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), global.Frame_Rate);
    });

    test('calls bindKeyHandlers', () => {
      gameView.start();
      expect(gameView.bindKeyHandlers).toHaveBeenCalledTimes(1);
    });

    test('interval calls assessKeys, currentGame.draw, and currentGame.step', () => {
      gameView.start();
      expect(gameView.assessKeys).not.toHaveBeenCalled();
      expect(mockGameInstance.draw).not.toHaveBeenCalled();
      expect(mockGameInstance.step).not.toHaveBeenCalled();

      // Advance timers by one interval tick
      jest.advanceTimersByTime(global.Frame_Rate);

      expect(gameView.assessKeys).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.draw).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.draw).toHaveBeenCalledWith(mockCtx);
      expect(mockGameInstance.step).toHaveBeenCalledTimes(1);

      // Advance timers by another interval tick
      jest.advanceTimersByTime(global.Frame_Rate);
      expect(gameView.assessKeys).toHaveBeenCalledTimes(2);
      expect(mockGameInstance.draw).toHaveBeenCalledTimes(2);
      expect(mockGameInstance.step).toHaveBeenCalledTimes(2);
    });

    test('clears existing interval before starting a new one', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      gameView.intervalID = 12345; // Simulate existing interval
      gameView.start();
      expect(clearIntervalSpy).toHaveBeenCalledWith(12345);
      expect(setInterval).toHaveBeenCalledTimes(1); // Ensure new interval was set
      clearIntervalSpy.mockRestore();
    });
  });

  describe('startAttractModeLoop', () => {
     beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(global, 'setInterval');
    });

    test('sets up an interval timer using global Frame_Rate', () => {
      gameView.startAttractModeLoop();
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), global.Frame_Rate);
    });

     test('interval calls currentGame.draw and currentGame.step (but not assessKeys)', () => {
      gameView.startAttractModeLoop();
      const assessKeysSpy = jest.spyOn(gameView, 'assessKeys');

      expect(mockGameInstance.draw).not.toHaveBeenCalled();
      expect(mockGameInstance.step).not.toHaveBeenCalled();

      // Advance timers by one interval tick
      jest.advanceTimersByTime(global.Frame_Rate);

      expect(assessKeysSpy).not.toHaveBeenCalled(); // Should not assess keys in attract mode
      expect(mockGameInstance.draw).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.draw).toHaveBeenCalledWith(mockCtx);
      expect(mockGameInstance.step).toHaveBeenCalledTimes(1);

       assessKeysSpy.mockRestore();
    });

     test('clears existing interval before starting a new one', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      gameView.intervalID = 54321; // Simulate existing interval
      gameView.startAttractModeLoop();
      expect(clearIntervalSpy).toHaveBeenCalledWith(54321);
      expect(setInterval).toHaveBeenCalledTimes(1); // Ensure new interval was set
       clearIntervalSpy.mockRestore();
    });
  });

  describe('stopLoop', () => {
     let clearIntervalSpy; // Declare spy at suite level

     beforeEach(() => {
         // Spy on clearInterval globally
         clearIntervalSpy = jest.spyOn(global, 'clearInterval');
         // Reset intervalID before each stopLoop test
         gameView.intervalID = null; 
     });

     afterEach(() => {
        // Restore the spy and ensure ID is nullified after each test
        clearIntervalSpy.mockRestore();
        gameView.intervalID = null;
     });

     test('should clear the interval timer if intervalID is set', () => {
         // Simulate an active interval
         gameView.intervalID = 9876;
         gameView.stopLoop();

         // Verify clearInterval was called with the correct ID
         expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
         expect(clearIntervalSpy).toHaveBeenCalledWith(9876);
         // Verify intervalID was reset
         expect(gameView.intervalID).toBeNull();
     });

     test('should do nothing if intervalID is already null', () => {
         // Ensure intervalID is null (done in beforeEach)
         // gameView.intervalID = null; 
         gameView.stopLoop();

         // Verify clearInterval was not called
         expect(clearIntervalSpy).not.toHaveBeenCalled(); // Use the suite-level spy variable
         // Verify intervalID remains null
         expect(gameView.intervalID).toBeNull();
     });
  });

  describe('bindKeyHandlers', () => {
    test('should initialize keyState to an empty object', () => {
      gameView.keyState = undefined;
      gameView.bindKeyHandlers();
      expect(gameView.keyState).toEqual({});
    });

    test('should create shipFire function using _.throttle', () => {
      gameView.bindKeyHandlers();
      // Check that _.throttle was called
      expect(global._.throttle).toHaveBeenCalledTimes(1);
      expect(global._.throttle).toHaveBeenCalledWith(
        expect.any(Function), // The original ship.fireBullet (or wrapper)
        150, 
        { trailing: false }
      );
      // Check that gameView.shipFire is defined as a function
      expect(gameView.shipFire).toBeDefined();
      expect(typeof gameView.shipFire).toBe('function');
    });

    // Note: Testing the actual document event listener binding is complex
    // and less critical than testing the resulting state changes in assessKeys.
  });

  describe('assessKeys', () => {
    beforeEach(() => {
      // Ensure key handlers are bound and shipFire exists before each test
      gameView.bindKeyHandlers();

      // Reset keyState and ship mock calls
      gameView.keyState = {}; // Initialize as empty object, matching bindKeyHandlers
      mockGameInstance.ship.power.mockClear();
      mockGameInstance.ship.rotate.mockClear();
      // Also clear the underlying fireBullet mock
      mockGameInstance.ship.fireBullet.mockClear(); 

      // Ensure preLevelState is null by default
      mockGameInstance.preLevelState = null;
    });

    test('should do nothing if currentGame.preLevelState is active', () => {
      mockGameInstance.preLevelState = { countdown: 3 }; // Simulate pre-level active
      // Set keys using key codes
      gameView.keyState[38] = true; // Up
      gameView.keyState[37] = true; // Left
      gameView.keyState[32] = true; // Space
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });

    test('should call ship.power(-1) for key code 38 (up)', () => {
      gameView.keyState[38] = true; // Set key using key code
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });

    test('should call ship.power(1) for key code 40 (down)', () => {
      gameView.keyState[40] = true; // Set key using key code
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });

    test('should call ship.rotate(-1) for key code 37 (left)', () => {
      gameView.keyState[37] = true; // Set key using key code
      gameView.assessKeys();
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });

    test('should call ship.rotate(1) for key code 39 (right)', () => {
      gameView.keyState[39] = true; // Set key using key code
      gameView.assessKeys();
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });

    test('should call ship.fireBullet for key code 32 (space)', () => { // Updated description
      gameView.keyState[32] = true; // Set key using key code
      gameView.assessKeys();
      // Check the underlying ship.fireBullet mock directly
      expect(mockGameInstance.ship.fireBullet).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
    });

    test('should handle multiple keys simultaneously (using key codes)', () => {
      gameView.keyState[38] = true; // up
      gameView.keyState[37] = true; // left
      gameView.keyState[32] = true; // space
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.fireBullet).toHaveBeenCalledTimes(1); // Check underlying mock
    });

    test('should do nothing if no relevant keys are active', () => {
      gameView.keyState = {}; // Empty state
      gameView.keyState[65] = true; // Add irrelevant key (A)
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.fireBullet).not.toHaveBeenCalled(); // Check underlying mock
    });
  });

}); 