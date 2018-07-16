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

    it('Should roll over to 0 at 24 hours', () => {
      const tc = new Timecode('24:00:00:00', 29.97);
      assert.strictEqual(tc.toString(), '00;00;00;00');
    });
  });

  describe('Nominal Frame Rates', () => {
    const tc = new Timecode();

    it('Should use 24 for 23.98', () => {
      tc.frameRate = 23.98;
      assert.strictEqual(tc.nominalFrameRate(), 24);
    });

    it('Should use 24 for 24', () => {
      tc.frameRate = 24;
      assert.strictEqual(tc.nominalFrameRate(), 24);
    });

    it('Should use 25 for 25', () => {
      tc.frameRate = 25;
      assert.strictEqual(tc.nominalFrameRate(), 25);
    });

    it('Should use 30 for 29.97', () => {
      tc.frameRate = 29.97;
      assert.equal(tc.nominalFrameRate(), 30);
    });

    it('Should use 30 for 30', () => {
      tc.frameRate = 30;
      assert.strictEqual(tc.nominalFrameRate(), 30);
    });

    it('Should use 25 for 50', () => {
      tc.frameRate = 50;
      assert.strictEqual(tc.nominalFrameRate(), 25);
    });

    it('Should use 30 for 59.94', () => {
      tc.frameRate = 59.94;
      assert.strictEqual(tc.nominalFrameRate(), 30);
    });

    it('Should use 30 for 60', () => {
      tc.frameRate = 60;
      assert.strictEqual(tc.nominalFrameRate(), 30);
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

  describe('Conversion', () => {
    const tc = new Timecode(1289434, 30);

    it('Should convert to 23.98 FPS', () => {
      const converted = tc.convert(23.98);

      assert.strictEqual(converted.toString(), '14:55:26:10');
    });

    it('Should convert to 24 FPS', () => {
      const converted = tc.convert(24);

      assert.strictEqual(converted.toString(), '14:55:26:10');
    });

    it('Should convert to 25 FPS', () => {
      const converted = tc.convert(25);

      assert.strictEqual(converted.toString(), '14:19:37:09');
    });

    it('Should convert to 29.97 FPS', () => {
      const converted = tc.convert(29.97);

      assert.strictEqual(converted.toString(), '11;57;04;06');
    });

    it('Should convert to 30 FPS', () => {
      const converted = tc.convert(30);

      assert.strictEqual(converted.toString(), '11:56:21:04');
    });

    it('Should convert to 50 FPS using 25 FPS base', () => {
      const converted = tc.convert(50);

      assert.strictEqual(converted.toString(), '14:19:37:09');
    });

    it('Should convert to 59.94 FPS using 29.97 FPS base', () => {
      const converted = tc.convert(59.94);

      assert.strictEqual(converted.toString(), '11;57;04;06');
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

    it('Should roll over the 24-hour mark', () => {
      const tc = new Timecode('23:59:59:29', 29.97);
      tc.add(1);
      assert.strictEqual(tc.toString(), '00;00;00;00');
    });
  });

  describe('Subtraction', () => {
    it('Should decrement by 1 hour subtracting adding another Timecode of "01:00:00:00 at 30', () => {
      const tc = new Timecode('04:00:00:00', 30);
      tc.subtract(new Timecode('01:00:00:00', 30));
      assert.strictEqual('03:00:00:00', tc.toString());
    });

    it('Should subtract one frame', () => {
      const tc = new Timecode('02:00:00:00', 30);
      tc.subtract(1);
      assert.strictEqual('01:59:59:29', tc.toString());
    });

    it('Should decrement by one second when subtracting 30 frames from 30NDF timecode', () => {
      const tc = new Timecode('04:00:01:00', 30);
      tc.subtract(30);
      assert.strictEqual('04:00:00:00', tc.toString());
    });

    it('Should decrement by one minute when subtracting 1800 frames from 30NDF timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.subtract(30 * 60);
      assert.strictEqual('00:59:00:00', tc.toString());
    });

    it('Should decrement by one hour when subtracting 108000 frames from 30NDF timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.subtract(30 * 3600);
      assert.strictEqual('00:00:00:00', tc.toString());
    });

    it('Should subract passed string as Timecode', () => {
      const tc = new Timecode('01:00:00:00', 30);
      tc.subtract('00:33:21:04');
      assert.strictEqual('00:26:38:26', tc.toString());
    });

    it('Should roll over the 24-hour mark', () => {
      const tc = new Timecode('00:00:00:00', 29.97);
      tc.subtract(1);
      assert.strictEqual(tc.toString(), '23;59;59;29');
    });
  });

  describe('Fuzz Testing', () => {
    it('Should return the same fields as are passed in for 1000 Non-Drop Timecodes', () => {
      const frameRates = [23.98, 24, 25, 30];

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
