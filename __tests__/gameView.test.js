const GameView = require('../lib/javascripts/gameView');
const _ = require('lodash'); // Import lodash to mock

// Mock lodash throttle
jest.mock('lodash', () => ({
  throttle: jest.fn(fn => fn) // Simple mock: return the function passed to it
}));

describe('GameView', () => {
  let gameView;
  let mockGameInstance; // Renamed for clarity, represents global.currentGame
  let mockCtx;

  beforeEach(() => {
    // Clear mocks
    _.throttle.mockClear();

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
     test('clears the interval if intervalID exists', () => {
       const clearIntervalSpy = jest.spyOn(window, 'clearInterval'); // Spy on window.clearInterval
       gameView.intervalID = 999;
       gameView.stopLoop();
       expect(clearIntervalSpy).toHaveBeenCalledWith(999);
       expect(gameView.intervalID).toBeNull();
       clearIntervalSpy.mockRestore();
     });

     test('does nothing if intervalID is null', () => {
       const clearIntervalSpy = jest.spyOn(window, 'clearInterval'); // Spy on window.clearInterval
       gameView.intervalID = null;
       gameView.stopLoop();
       expect(clearIntervalSpy).not.toHaveBeenCalled();
       clearIntervalSpy.mockRestore();
     });
  });

  describe('bindKeyHandlers', () => {
    test('initializes keyState to an empty object', () => {
      gameView.keyState = undefined; // Ensure it's not set before the call
      gameView.bindKeyHandlers();
      expect(gameView.keyState).toEqual({});
    });

    test('creates shipFire function using _.throttle with ship.fireBullet', () => {
      gameView.bindKeyHandlers();
      // Check the throttle function on the GLOBAL mock
      expect(global._.throttle).toHaveBeenCalledTimes(1);
      // Check that throttle was called with *a function* and the correct options
      expect(global._.throttle).toHaveBeenCalledWith(expect.any(Function), 150, {trailing: false});
      expect(gameView.shipFire).toBeDefined();
      expect(typeof gameView.shipFire).toBe('function');
    });

    // Note: Testing the actual event listener binding (this.downKeyState, this.upKeyState)
    // is harder without a full DOM environment or more complex mocking.
    // We primarily test the *effect* of these handlers in the assessKeys tests.
  });

  describe('assessKeys', () => {
    let shipFireSpy;

    beforeEach(() => {
      // Need to call bindKeyHandlers to set up keyState and shipFire
      gameView.bindKeyHandlers();
      // Spy on the (mocked throttle wrapper) function
      shipFireSpy = jest.spyOn(gameView, 'shipFire');
      // Reset ship mocks for each assessKeys test
      mockGameInstance.ship.power.mockClear();
      mockGameInstance.ship.rotate.mockClear();
      mockGameInstance.ship.fireBullet.mockClear(); // Also clear the original func mock
    });

    afterEach(() => {
      shipFireSpy.mockRestore();
    });

    test('does nothing if currentGame.preLevelState is set', () => {
      currentGame.preLevelState = { countdown: 3 }; // Simulate pre-level state
      gameView.keyState = { 38: true, 37: true, 32: true }; // Set some keys
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });

    test('calls ship.power(-1) for up arrow (38)', () => {
      gameView.keyState[38] = true;
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });

    test('calls ship.power(1) for down arrow (40)', () => {
      gameView.keyState[40] = true;
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });

    test('calls ship.rotate(-1) for left arrow (37)', () => {
      gameView.keyState[37] = true;
      gameView.assessKeys();
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });

    test('calls ship.rotate(1) for right arrow (39)', () => {
      gameView.keyState[39] = true;
      gameView.assessKeys();
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });

    test('calls shipFire for space bar (32)', () => {
      gameView.keyState[32] = true;
      gameView.assessKeys();
      expect(gameView.shipFire).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
    });

    test('handles multiple keys pressed simultaneously', () => {
      gameView.keyState[38] = true; // up
      gameView.keyState[37] = true; // left
      gameView.keyState[32] = true; // space
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.power).toHaveBeenCalledTimes(1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledWith(-1);
      expect(mockGameInstance.ship.rotate).toHaveBeenCalledTimes(1);
      expect(gameView.shipFire).toHaveBeenCalledTimes(1);
    });

    test('does nothing if no relevant keys are pressed', () => {
      gameView.keyState = { 65: true, 90: true }; // A, Z
      gameView.assessKeys();
      expect(mockGameInstance.ship.power).not.toHaveBeenCalled();
      expect(mockGameInstance.ship.rotate).not.toHaveBeenCalled();
      expect(gameView.shipFire).not.toHaveBeenCalled();
    });
  });

}); 