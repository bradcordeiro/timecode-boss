/* eslint-env mocha */
const assert = require('assert');
const Timecode = require('../src/smpte-timecode');

describe('Timecode', () => {
  describe('Constructor', () => {
    it('Should default to a frameCount of 0 and frameRate of 29.97', () => {
      const tc = new Timecode();

      assert.strictEqual(0, tc.frameCount);
      assert.strictEqual(29.97, tc.frameRate);
    });

    it('Should accept timecode of "01:00:00:00" and frameRate of 29.97', () => {
      const tc = new Timecode('01:00:00:00', 29.97);

      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
      assert.strictEqual(tc.toString(), '01;00;00;00');
    });

    it('Should accept a frameCount and frameRate of 29.97', () => {
      const tc = new Timecode(1633998, 29.97);

      assert.strictEqual(tc.frameCount, 1633998, 'frameCount');
      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
    });

    it('Should accept a timecode of "01:00:00:00" and a frameRate of 30', () => {
      const tc = new Timecode('01:00:00:00', 30);
      assert.strictEqual(tc.frameRate, 30, 'frameRate');
      assert.strictEqual(tc.toString(), '01:00:00:00');
    });

    it('Should accept {hours, minutes, seconds, frames} and framerate of 29.97', () => {
      const tc = new Timecode({
        hours: 1,
        minutes: 0,
        seconds: 0,
        frames: 0,
      }, 29.97);

      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
      assert.strictEqual(tc.getHours(), 1, 'Hours field');
      assert.strictEqual(tc.getMinutes(), 0, 'Minutes field');
      assert.strictEqual(tc.getSeconds(), 0, 'Seconds field');
      assert.strictEqual(tc.getFrames(), 0, 'Frames field');
    });

    it('Should accept {"hours", "minutes", "seconds", "frames" } and framerate of 29.97', () => {
      const tc = new Timecode({
        hours: '1',
        minutes: '0',
        seconds: '0',
        frames: '0',
      }, 29.97);

      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
      assert.strictEqual(tc.getHours(), 1, 'Hours field');
      assert.strictEqual(tc.getMinutes(), 0, 'Minutes field');
      assert.strictEqual(tc.getSeconds(), 0, 'Seconds field');
      assert.strictEqual(tc.getFrames(), 0, 'Frames field');
    });

    it('Should accept a Date object', () => {
      const date = new Date(0, 0, 0, 0, 8, 30, 200);
      const tc = new Timecode(date, 29.97);

      assert.strictEqual(tc.toString(), '00;08;30;06');
    });
  });

  describe('Drop Frame Detection', () => {
    it('23.98 is considered Non-Drop Frame', () => {
      const tc = new Timecode(0, 23.98);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('24.00 is considered Non-Drop Frame', () => {
      const tc = new Timecode(0, 24.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('25.00 is considered Non-Drop Frame', () => {
      const tc = new Timecode(0, 25.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('29.97 is considered Drop Frame', () => {
      const tc = new Timecode(0, 29.97);
      assert.strictEqual(tc.isDropFrame(), true);
    });

    it('30.00 is considered Non-Drop Frame', () => {
      const tc = new Timecode(0, 30.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('59.94 is considered Drop Frame', () => {
      const tc = new Timecode(0, 59.94);
      assert.strictEqual(tc.isDropFrame(), true);
    });

    it('60.00 is considered Non-Drop Frame', () => {
      const tc = new Timecode(0, 60.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('Should skip first 2 frames for even minute, not tenth minute', () => {
      const tc = new Timecode('01:00:59:29', 29.97);
      tc.add(2);
      assert.strictEqual(tc.toString(), '01;01;00;03');
    });

    it('Should convert an invalid drop-frame timecode passed as input', () => {
      const tc = new Timecode('01:01:00:00', 29.97);
      assert.strictEqual(tc.toString(), '01;01;00;02');
      const tc2 = new Timecode('01:01:00:01', 29.97);
      assert.strictEqual(tc2.toString(), '01;01;00;03');
    });
  });

  describe('Field Getters', () => {
    it('Empty constructed Timecode returns 0 for all fields', () => {
      const tc = new Timecode();
      assert.strictEqual(tc.getHours(), 0, 'Hours field should be 0');
      assert.strictEqual(tc.getMinutes(), 0, 'Minutes field should be 0');
      assert.strictEqual(tc.getSeconds(), 0, 'Seconds field should be 0');
      assert.strictEqual(tc.getFrames(), 0, 'Frames field should be 0');
    });

    it('Timecode constructed with ("01:00:00:00", 29.97) returns accurate fields', () => {
      const tc = new Timecode('01:00:00:00', 29.97);
      assert.strictEqual(tc.getHours(), 1, 'Hours field should be 1');
      assert.strictEqual(tc.getMinutes(), 0, 'Minutes field should be 0');
      assert.strictEqual(tc.getSeconds(), 0, 'Seconds field should be 0');
      assert.strictEqual(tc.getFrames(), 0, 'Frames field should be 0');
    });
  });

  describe('Addition', () => {
    it('Should increment by 1 hour when adding another Timecode of "01:00:00:00 at 30', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add(new Timecode('01:00:00:00', 30));
      assert.strictEqual('02:00:00:00', tc.toString());
    });

    it('Should add one frame', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add(1);
      assert.strictEqual('01:00:00:01', tc.toString());
    });

    it('Should increment by one second when adding 30 frames to 30NDF timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add(30);
      assert.strictEqual('01:00:01:00', tc.toString());
    });

    it('Should increment by one minute when adding 1800 frames to 30NDF timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add(30 * 60);
      assert.strictEqual('01:01:00:00', tc.toString());
    });

    it('Should increment by one hour when adding 108000 frames to 30NDF timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add(30 * 3600);
      assert.strictEqual('02:00:00:00', tc.toString());
    });

    it('Should add passed string as Timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.add('00:33:22:11');
      assert.strictEqual('01:33:22:11', tc.toString());
    });
  });

  describe('Subtraction', () => {

  });

  describe('Fuzz Testing', () => {
    it('Should return the same fields as are passed in for 1000 Non-Drop Timecodes', () => {
      const frameRates = [23.98, 24, 25, 30, 50, 60];

      function generateRandomTimecodeFields(frameRate) {
        return {
          hours: Math.floor(Math.random() * 100) % 24,
          minutes: Math.floor(Math.random() * 100) % 60,
          seconds: Math.floor(Math.random() * 100) % 60,
          frames: Math.floor(Math.random() * 100) % Math.round(frameRate),
        };
      }

      function getRandomFrameRate() {
        return frameRates[Math.round(Math.random() * 10) % frameRates.length];
      }

      for (let i = 0; i < 1000; i += 1) {
        const frameRate = getRandomFrameRate();
        const timecodeFields = generateRandomTimecodeFields(frameRate);

        const tc = new Timecode(timecodeFields, frameRate);

        assert.strictEqual(tc.getHours(), timecodeFields.hours);
        assert.strictEqual(tc.getMinutes(), timecodeFields.minutes);
        assert.strictEqual(tc.getSeconds(), timecodeFields.seconds);
        assert.strictEqual(tc.getFrames(), timecodeFields.frames);
      }
    });
  });
});
