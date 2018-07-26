/* eslint-env mocha */
const assert = require('assert');
const Timecode = require('./timecode');

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

    it('Should accept { hours, minutes, seconds, frames } and framerate of 29.97', () => {
      const tc = new Timecode({
        hours: 1,
        minutes: 2,
        seconds: 3,
        frames: 4,
      }, 29.97);

      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
      assert.strictEqual(tc.getHours(), 1, 'Hours field');
      assert.strictEqual(tc.getMinutes(), 2, 'Minutes field');
      assert.strictEqual(tc.getSeconds(), 3, 'Seconds field');
      assert.strictEqual(tc.getFrames(), 4, 'Frames field');
    });

    it('Should accept { "hours", "minutes", "seconds", "frames" } and framerate of 29.97', () => {
      const tc = new Timecode({
        hours: '01',
        minutes: '02',
        seconds: '03',
        frames: '04',
      }, 29.97);

      assert.strictEqual(tc.frameRate, 29.97, 'frameRate');
      assert.strictEqual(tc.getHours(), 1, 'Hours field');
      assert.strictEqual(tc.getMinutes(), 2, 'Minutes field');
      assert.strictEqual(tc.getSeconds(), 3, 'Seconds field');
      assert.strictEqual(tc.getFrames(), 4, 'Frames field');
    });

    it('Should accept { hours }', () => {
      const tc = new Timecode({
        hours: 1,
      }, 29.97);

      assert.strictEqual(tc.getHours(), 1);
    });

    it('Should accept { minutes }', () => {
      const tc = new Timecode({
        minutes: 2,
      }, 29.97);

      assert.strictEqual(tc.getMinutes(), 2);
    });

    it('Should accept { seconds }', () => {
      const tc = new Timecode({
        seconds: 3,
      }, 29.97);

      assert.strictEqual(tc.getSeconds(), 3, 'Seconds field');
    });

    it('Should accept { frames }', () => {
      const tc = new Timecode({
        frames: 4,
      }, 29.97);

      assert.strictEqual(tc.getFrames(), 4, 'Frames field');
    });

    it('Should accept a Date object', () => {
      const date = new Date(0, 0, 0, 0, 8, 30, 200);
      const tc = new Timecode(date, 29.97);

      assert.strictEqual(tc.toString(), '00;08;30;06');
    });

    it('Should deep copy another Timecode object', () => {
      const original = new Timecode(48579, 59.94);
      const copy = new Timecode(original);

      assert.strictEqual(copy.frameCount, 48579);
      assert.strictEqual(copy.frameRate, 59.94);

      original.add(1);

      assert.strictEqual(copy.frameCount, 48579);
      assert.strictEqual(copy.frameRate, 59.94);
    });

    it('Should roll over to 0 at 24 hours', () => {
      const tc = new Timecode('24:00:00:00', 29.97);
      assert.strictEqual(tc.toString(), '00;00;00;00');
    });

    it('Should throw a TypeError on an invalid input string', () => {
      assert.throws(() => new Timecode('safds'), TypeError);
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

    it('Should skip first 2 frames for even minute', () => {
      const tc1 = new Timecode('01:00:59:29', 29.97);
      let tc2 = tc1.add(1);
      assert.strictEqual(tc2.toString(), '01;01;00;02');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01;01;00;03');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01;01;00;04');
    });

    it('Should not skip the first 2 frames of each 10th minute', () => {
      const tc1 = new Timecode('01:09:59:29', 29.97);
      let tc2 = tc1.add(1);
      assert.strictEqual(tc2.toString(), '01;10;00;00');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01;10;00;01');
    });

    it('Should convert an invalid drop-frame timecode passed as input', () => {
      const tc = new Timecode('01:01:00:00', 29.97);
      assert.strictEqual(tc.toString(), '01;01;00;02');
      const tc2 = new Timecode('01:01:00:01', 29.97);
      assert.strictEqual(tc2.toString(), '01;01;00;03');
    });
  });

  describe('Setters', () => {
    const tc = new Timecode();

    it('Should throw when setHours() is called with no argument', () => {
      assert.throws(() => tc.setHours(), TypeError);
    });

    it('Should throw when setMinutes() is called with no argument', () => {
      assert.throws(() => tc.setMinutes(), TypeError);
    });

    it('Should throw when setSeconds() is called with no argument', () => {
      assert.throws(() => tc.setSeconds(), TypeError);
    });
    it('Should throw when setFrames() is called with no argument', () => {
      assert.throws(() => tc.setFrames(), TypeError);
    });

    it('Should throw when NaN is passed to setHours()', () => {
      assert.throws(() => tc.setHours('hh'), TypeError);
    });

    it('Should throw when NaN is passed to setMinutes()', () => {
      assert.throws(() => tc.setMinutes('mm'), TypeError);
    });

    it('Should throw when NaN is passed to setSeconds()', () => {
      assert.throws(() => tc.setSeconds('ss'), TypeError);
    });

    it('Should throw when NaN is passed to setFrames()', () => {
      assert.throws(() => tc.setFrames('ff'), TypeError);
    });
  });

  describe('Getters', () => {
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

  describe('Object Converstion', () => {
    it('Should return an Object of integers when called with no arguments', () => {
      const tc = new Timecode();

      assert.deepStrictEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        frames: 0,
      }, tc.getFields());
    });

    it('Should return an Object of padded strings when called with ("string", true)', () => {
      const tc = new Timecode('01:12:33:15', 30);

      assert.deepStrictEqual({
        hours: '01',
        minutes: '12',
        seconds: '33',
        frames: '15',
      }, tc.getFields(true));
    });

    it('Should return an Object without padding values that don\'t need itwhen called with (true)', () => {
      const tc = new Timecode('11:22:33:16', 30);

      assert.deepStrictEqual({
        hours: '11',
        minutes: '22',
        seconds: '33',
        frames: '16',
      }, tc.getFields(true));
    });

    it('toObject() should return an object with only frameCount and frameRate properties', () => {
      const tc = new Timecode('11:22:33:16', 30);
      const obj = tc.toObject();

      assert.strictEqual(Object.keys(obj).length, 2);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(obj, 'frameCount'), true);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(obj, 'frameRate'), true);
    });
  });

  describe('Frame Rate Conversion', () => {
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
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(new Timecode('01:00:00:00', 30));

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('02:00:00:00', tc2.toString());
    });

    it('Should add one frame', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(1);

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('01:00:00:01', tc2.toString());
    });

    it('Should increment by one second when adding 30 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(30);

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('01:00:01:00', tc2.toString());
    });

    it('Should increment by one minute when adding 1800 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(30 * 60);

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('01:01:00:00', tc2.toString());
    });

    it('Should increment by one hour when adding 108000 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(30 * 3600);

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('02:00:00:00', tc2.toString());
    });

    it('Should add passed string as Timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add('00:33:22:11');

      assert.strictEqual('01:00:00:00', tc1.toString()); // original is not modified
      assert.strictEqual('01:33:22:11', tc2.toString());
    });

    it('Should roll over the 24-hour mark', () => {
      const tc1 = new Timecode('23:59:59:29', 29.97);
      const tc2 = tc1.add(1);

      assert.strictEqual(tc1.toString(), '23;59;59;29'); // original is not modified
      assert.strictEqual(tc2.toString(), '00;00;00;00');
    });
  });

  describe('Subtraction', () => {
    it('Should decrement by 1 hour subtracting adding another Timecode of "01:00:00:00 at 30', () => {
      const tc1 = new Timecode('04:00:00:00', 30);
      const tc2 = tc1.subtract(new Timecode('01:00:00:00', 30));

      assert.strictEqual('04:00:00:00', tc1.toString());
      assert.strictEqual('03:00:00:00', tc2.toString());
    });

    it('Should subtract one frame', () => {
      const tc1 = new Timecode('02:00:00:00', 30);
      const tc2 = tc1.subtract(1);

      assert.strictEqual('02:00:00:00', tc1.toString());
      assert.strictEqual('01:59:59:29', tc2.toString());
    });

    it('Should decrement by one second when subtracting 30 frames from 30NDF timecode', () => {
      const tc1 = new Timecode('04:00:01:00', 30);
      const tc2 = tc1.subtract(30);

      assert.strictEqual('04:00:01:00', tc1.toString());
      assert.strictEqual('04:00:00:00', tc2.toString());
    });

    it('Should decrement by one minute when subtracting 1800 frames from 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract(30 * 60);

      assert.strictEqual('01:00:00:00', tc1.toString());
      assert.strictEqual('00:59:00:00', tc2.toString());
    });

    it('Should decrement by one hour when subtracting 108000 frames from 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract(30 * 3600);

      assert.strictEqual('01:00:00:00', tc1.toString());
      assert.strictEqual('00:00:00:00', tc2.toString());
    });

    it('Should subract passed string as Timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract('00:33:21:04');

      assert.strictEqual('01:00:00:00', tc1.toString());
      assert.strictEqual('00:26:38:26', tc2.toString());
    });

    it('Should roll over the 24-hour mark', () => {
      const tc1 = new Timecode('00:00:00:00', 29.97);
      const tc2 = tc1.subtract(1);

      assert.strictEqual(tc1.toString(), '00;00;00;00');
      assert.strictEqual(tc2.toString(), '23;59;59;29');
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
