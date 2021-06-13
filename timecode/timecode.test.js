/* eslint-env mocha */
const assert = require('assert');
const Timecode = require('./timecode');

describe('Timecode', () => {
  describe('Constructor', () => {
    it('new Timecode() accepts no arguments', () => {
      const tc = new Timecode();

      assert.strictEqual(0, tc.hours, 'Hours are incorrect');
      assert.strictEqual(0, tc.minutes, 'Minutes are incorrect');
      assert.strictEqual(0, tc.seconds, 'Seconds are incorrect');
      assert.strictEqual(0, tc.frames, 'Frames are incorrect');
      assert.strictEqual(29.97, tc.frameRate, 'Frame rate is incorrect');
    });

    it('new Timecode() accepts a string', () => {
      const tc = new Timecode('01:00:00:00');

      assert.strictEqual(1, tc.hours, 'Hours are incorrect');
      assert.strictEqual(0, tc.minutes, 'Minutes are incorrect');
      assert.strictEqual(0, tc.seconds, 'Seconds are incorrect');
      assert.strictEqual(0, tc.frames, 'Frames are incorrect');
    });

    it('new Timecode() accepts a Number', () => {
      const tc = new Timecode(1633998);

      assert.strictEqual(1633998, tc.frameCount(), 'this.frameCount() returns incorrect frame count');
    });

    it('new Timecode() accepts an object containing { hours, minutes, seconds, frames }', () => {
      const tc = new Timecode({
        hours: 1,
        minutes: 2,
        seconds: 3,
        frames: 4,
      });

      assert.strictEqual(tc.hours, 1, 'Hours field');
      assert.strictEqual(tc.minutes, 2, 'Minutes field');
      assert.strictEqual(tc.seconds, 3, 'Seconds field');
      assert.strictEqual(tc.frames, 4, 'Frames field');
    });

    it('new Timecode() accepts an object containing { "hours", "minutes", "seconds", "frames" }', () => {
      const tc = new Timecode({
        hours: '01',
        minutes: '02',
        seconds: '03',
        frames: '04',
      });

      assert.strictEqual(tc.hours, 1, 'Hours field');
      assert.strictEqual(tc.minutes, 2, 'Minutes field');
      assert.strictEqual(tc.seconds, 3, 'Seconds field');
      assert.strictEqual(tc.frames, 4, 'Frames field');
    });

    it('new Timecode() accepts an object containing { hours }', () => {
      const tc = new Timecode({
        hours: 1,
      });

      assert.strictEqual(1, tc.hours);
      assert.strictEqual(0, tc.minutes);
      assert.strictEqual(0, tc.seconds);
      assert.strictEqual(0, tc.frames);
    });

    it('new Timecode() accepts an object containing { minutes }', () => {
      const tc = new Timecode({
        minutes: 2,
      }, 30);

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(2, tc.minutes);
      assert.strictEqual(0, tc.seconds);
      assert.strictEqual(0, tc.frames);
    });

    it('new Timecode() accepts an object containing { seconds }', () => {
      const tc = new Timecode({
        seconds: 3,
      });

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(0, tc.minutes);
      assert.strictEqual(3, tc.seconds);
      assert.strictEqual(0, tc.frames);
    });

    it('new Timecode() accepts an object containing { frames }', () => {
      const tc = new Timecode({
        frames: 4,
      }, 29.97);

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(0, tc.minutes);
      assert.strictEqual(0, tc.seconds);
      assert.strictEqual(4, tc.frames);
    });

    it('new Timecode() accepts an object containing { frameRate }', () => {
      const tc = new Timecode({
        frames: 4,
      }, 24);

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(0, tc.minutes);
      assert.strictEqual(0, tc.seconds);
      assert.strictEqual(4, tc.frames);
      assert.strictEqual(24, tc.frameRate);
    });

    it('new Timecode() accepts a Date object', () => {
      const date = new Date(0, 0, 0, 0, 8, 30, 200);
      const tc = new Timecode(date, 29.97);

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(8, tc.minutes);
      assert.strictEqual(30, tc.seconds);
      assert.strictEqual(6, tc.frames);
    });

    it('new Timecode() deep copies another Timecode object', () => {
      const original = new Timecode(48579, 30); // 00:26:59:09
      const copy = new Timecode(original);

      original.hours = 0;
      original.minutes = 0;
      original.seconds = 0;
      original.frames = 0;
      original.frameRate = 30;

      assert.strictEqual(copy.frameCount(), 48579);
      assert.strictEqual(original.frameCount(), 0);
    });

    it('new Timecode() resets hours over 24 from 0', () => {
      const tc = new Timecode('24:00:00:00', 30);

      assert.strictEqual(0, tc.hours);
      assert.strictEqual(0, tc.minutes);
      assert.strictEqual(0, tc.seconds);
      assert.strictEqual(0, tc.frames);
    });

    it('new Timecode() adds 2 frames to a nonexistent drop-frame timecode argument', () => {
      const tc = new Timecode('01:01:00:00', 29.97);
      assert.strictEqual(tc.toString(), '01:01:00;02');
      const tc2 = new Timecode('01:01:00:01', 29.97);
      assert.strictEqual(tc2.toString(), '01:01:00;03');
    });

    it('new Timecode() throws a TypeError on an invalid input string', () => {
      assert.throws(() => new Timecode('safds'), TypeError);
    });
  });

  describe('Nominal Frame Rates', () => {
    const tc = new Timecode();

    it('nominalFrameRate() for 23.98 returns 24', () => {
      tc.frameRate = 23.98;
      assert.strictEqual(tc.nominalFrameRate(), 24);
    });

    it('nominalFrameRate() for 24 returns 24', () => {
      tc.frameRate = 24;
      assert.strictEqual(tc.nominalFrameRate(), 24);
    });

    it('nominalFrameRate() for 25 returns 25', () => {
      tc.frameRate = 25;
      assert.strictEqual(tc.nominalFrameRate(), 25);
    });

    it('nominalFrameRate() for 29.97 returns 30', () => {
      tc.frameRate = 29.97;
      assert.equal(tc.nominalFrameRate(), 30);
    });

    it('nominalFrameRate() for 30 returns 30', () => {
      tc.frameRate = 30;
      assert.strictEqual(tc.nominalFrameRate(), 30);
    });
  });

  describe('Drop Frame Detection', () => {
    it('isDropFrame() for 23.98 returns false', () => {
      const tc = new Timecode(0, 23.98);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('isDropFrame() for 24 returns false', () => {
      const tc = new Timecode(0, 24.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('isDropFrame() for 25 returns false', () => {
      const tc = new Timecode(0, 25.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });

    it('isDropFrame() for 29.97 returns true', () => {
      const tc = new Timecode(0, 29.97);
      assert.strictEqual(tc.isDropFrame(), true);
    });

    it('isDropFrame() for 30 returns false', () => {
      const tc = new Timecode(0, 30.00);
      assert.strictEqual(tc.isDropFrame(), false);
    });
  });

  describe('Getters', () => {
    it('separator() returns ":" for a Timecode at 23.98 frames per second', () => {
      const tc = new Timecode('02:05:34:15', 23.98);

      assert.strictEqual(tc.separator(), ':');
    });

    it('separator() returns ":" for a Timecode at 24 frames per second', () => {
      const tc = new Timecode('02:05:34:15', 24);

      assert.strictEqual(tc.separator(), ':');
    });

    it('separator() returns ":" for a Timecode at 25 frames per second', () => {
      const tc = new Timecode('02:05:34:15', 25);

      assert.strictEqual(tc.separator(), ':');
    });

    it('separator() returns ";" for a Timcode at 29.97 fps', () => {
      const tc = new Timecode('02:05:34:15', 29.97);

      assert.strictEqual(tc.separator(), ';');
    });

    it('separator() returns ":" for a Timecode at 30 frames per second', () => {
      const tc = new Timecode('02:05:34:15', 30);

      assert.strictEqual(tc.separator(), ':');
    });

    it('fractionalSeconds() returns 5.5 for 00:00:05:12 at 23.98', () => {
      const tc = new Timecode('00:00:05:12', 23.98);

      assert.strictEqual(tc.fractionalSeconds(), 5.5);
    });
  });

  describe('Setters', () => {
    it('setHours() accepts a number argument', () => {
      const tc = new Timecode();
      tc.setHours(15);

      assert.strictEqual(tc.hours, 15);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setHours() accepts a string argument', () => {
      const tc = new Timecode();
      tc.setHours('13');

      assert.strictEqual(tc.hours, 13);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setHours() rolls an argument over 24', () => {
      const tc = new Timecode(0, 30);
      tc.setHours(26);

      assert.strictEqual(tc.hours, 2, 'Hours were calculated incorrectly');
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setMinutes() accepts a number argument', () => {
      const tc = new Timecode(0, 30);
      tc.setMinutes(47);

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 47);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setMinutes() accepts a string argument', () => {
      const tc = new Timecode(0, 30);
      tc.setMinutes('47');

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 47);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setMinutes() rolls an argument over 59', () => {
      const tc = new Timecode(0, 30);
      tc.setMinutes(72);

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 12);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('setSeconds() accepts a number', () => {
      const tc = new Timecode();
      tc.setSeconds(15);

      assert.strictEqual(15, tc.seconds);
    });

    it('setSeconds() accepts a string', () => {
      const tc = new Timecode();
      tc.setSeconds('15');

      assert.strictEqual(15, tc.seconds);
    });

    it('setSeconds() rolls seconds over 59 into minutes', () => {
      const tc = new Timecode(0, 30);
      tc.setSeconds(64);

      assert.strictEqual(tc.seconds, 4, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.minutes, 1, 'Minutes were calculated incorrectly');
    });

    it('setHours() throws TypeError when passed NaN', () => {
      const tc = new Timecode();
      assert.throws(() => tc.setHours('hours'), TypeError);
    });

    it('setMinutes() throws TypeError when passed NaN', () => {
      const tc = new Timecode();
      assert.throws(() => tc.setMinutes('minutes'), TypeError);
    });

    it('setSeconds() throws TypeError when passed NaN', () => {
      const tc = new Timecode();
      assert.throws(() => tc.setSeconds('seconds'), TypeError);
    });

    it('setFrames() throws TypeError when passed NaN', () => {
      const tc = new Timecode();
      assert.throws(() => tc.setFrames('frames'), TypeError);
    });

    it('setHours() with no argument does not change Timecode', () => {
      const tc = new Timecode('01:34:15:16');
      tc.setHours();

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 34);
      assert.strictEqual(tc.seconds, 15);
      assert.strictEqual(tc.frames, 16);
    });

    it('setMinutes() with no argument does not change Timecode', () => {
      const tc = new Timecode('01:34:15:16');
      tc.setMinutes();

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 34);
      assert.strictEqual(tc.seconds, 15);
      assert.strictEqual(tc.frames, 16);
    });

    it('setSeconds() with no argument does not change Timecode', () => {
      const tc = new Timecode('01:34:15:16');
      tc.setSeconds();

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 34);
      assert.strictEqual(tc.seconds, 15);
      assert.strictEqual(tc.frames, 16);
    });

    it('setFrames() with no argument does not change Timecode', () => {
      const tc = new Timecode('01:34:15:16');
      tc.setFrames();

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 34);
      assert.strictEqual(tc.seconds, 15);
      assert.strictEqual(tc.frames, 16);
    });
  });

  describe('Object Conversion', () => {
    const tc = new Timecode('13:54:14:22', 25);
    const obj = tc.toObject();

    it('toObject() returns object with all fields as integers', () => {
      assert.strictEqual(tc.hours, 13);
      assert.strictEqual(tc.minutes, 54);
      assert.strictEqual(tc.seconds, 14);
      assert.strictEqual(tc.frames, 22);
    });

    it('toObject() returns object that includes frameRate', () => {
      assert.strictEqual(tc.frameRate, 25);
    });

    it('toObject() returns an object with only fields and frameRate properties', () => {
      assert.strictEqual(Object.keys(obj).length, 5);
    });
  });

  describe('Addition', () => {
    it('add() increments by 1 hour when adding new Timecode("01:00:00:00", 30)', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(new Timecode('01:00:00:00', 30));

      assert.strictEqual(tc2.hours, 2);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('add() can add a number to a Timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(1);

      assert.strictEqual(tc2.hours, 1);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 1);
    });

    it('add() adds 1 second when adding 30 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(30);

      assert.strictEqual(tc2.hours, 1);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 1);
      assert.strictEqual(tc2.frames, 0);
    });

    it('add() adds 1 minute when adding 1800 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(1800);

      assert.strictEqual(tc2.hours, 1);
      assert.strictEqual(tc2.minutes, 1);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('add() adds 1 hour when adding 108000 frames to 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add(108000);

      assert.strictEqual(tc2.hours, 2);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('add() adds a timecode-formatted string', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.add('00:33:22:11');

      assert.strictEqual(tc2.hours, 1);
      assert.strictEqual(tc2.minutes, 33);
      assert.strictEqual(tc2.seconds, 22);
      assert.strictEqual(tc2.frames, 11);
    });

    it('add() rolls hours over 24 from 0', () => {
      const tc1 = new Timecode('23:59:59:29', 30);
      const tc2 = tc1.add(1);

      assert.strictEqual(tc2.hours, 0);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('add() skips first 2 frames for even minute in a result', () => {
      const tc1 = new Timecode('01:00:59:29', 29.97);
      let tc2 = tc1.add(1);
      assert.strictEqual(tc2.toString(), '01:01:00;02');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01:01:00;03');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01:01:00;04');
    });

    it('add() does not skip first 2 frames in 10th minute', () => {
      const tc1 = new Timecode('01:09:59:29', 29.97);
      let tc2 = tc1.add(1);
      assert.strictEqual(tc2.toString(), '01:10:00;00');
      tc2 = tc2.add(1);
      assert.strictEqual(tc2.toString(), '01:10:00;01');
    });

    // Old test from when pulldown() was behaving incorrectly, need new test
    it.skip('add() performs pulldown on addend with different frameRate', () => {
      const tc1 = new Timecode('00:07:12:04', 29.97);
      const tc2 = new Timecode('00:04:16:05', 23.98);
      const tc3 = tc1.add(tc2);

      assert.strictEqual(tc3.hours, 0);
      assert.strictEqual(tc3.minutes, 11);
      assert.strictEqual(tc3.seconds, 28);
      assert.strictEqual(tc3.frames, 10);
      assert.strictEqual(tc3.frameRate, 29.97);
    });
  });

  describe('Subtraction', () => {
    it('subtract() subtracts 1 hour when passed new Timecode("01:00:00:00", 30)', () => {
      const tc1 = new Timecode('04:00:00:00', 30);
      const tc2 = tc1.subtract(new Timecode('01:00:00:00', 30));

      assert.strictEqual(tc2.hours, 3);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('subtract() subtracts 1 frame when passed 1', () => {
      const tc1 = new Timecode('02:00:00:00', 30);
      const tc2 = tc1.subtract(1);

      assert.strictEqual(tc2.hours, 1);
      assert.strictEqual(tc2.minutes, 59);
      assert.strictEqual(tc2.seconds, 59);
      assert.strictEqual(tc2.frames, 29);
    });

    it('subtract() subtracts 1 second from when passed 30 on a 30 NDF Timecode', () => {
      const tc1 = new Timecode('04:00:01:00', 30);
      const tc2 = tc1.subtract(30);

      assert.strictEqual(tc2.hours, 4);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('subtract() subtracts 1 minute when passed 1800 on a 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract(1800);

      assert.strictEqual(tc2.hours, 0);
      assert.strictEqual(tc2.minutes, 59);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('subtract() subtracts 1 hour when passed 108000 on a 30NDF timecode', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract(108000);

      assert.strictEqual(tc2.hours, 0);
      assert.strictEqual(tc2.minutes, 0);
      assert.strictEqual(tc2.seconds, 0);
      assert.strictEqual(tc2.frames, 0);
    });

    it('subtract() accurately parses a string argument and subtracts it', () => {
      const tc1 = new Timecode('01:00:00:00', 30);
      const tc2 = tc1.subtract('00:33:21:04');

      assert.strictEqual(tc2.hours, 0);
      assert.strictEqual(tc2.minutes, 26);
      assert.strictEqual(tc2.seconds, 38);
      assert.strictEqual(tc2.frames, 26);
    });

    it('subtract() restarts at hour 24 when falling below 0', () => {
      const tc1 = new Timecode('00:00:00:00', 29.97);
      const tc2 = tc1.subtract(1);

      assert.strictEqual(tc2.hours, 23);
      assert.strictEqual(tc2.minutes, 59);
      assert.strictEqual(tc2.seconds, 59);
      assert.strictEqual(tc2.frames, 29);
    });

    // Old test from when pulldown() was behaving incorrectly, need new test
    it.skip('subtract() performs pulldown on subtrahend with different frameRate', () => {
      const tc1 = new Timecode('00:07:16:04', 29.97);
      const tc2 = new Timecode('00:04:12:05', 23.98);
      const tc3 = tc1.subtract(tc2);

      assert.strictEqual(tc3.hours, 0);
      assert.strictEqual(tc3.minutes, 3);
      assert.strictEqual(tc3.seconds, 3);
      assert.strictEqual(tc3.frames, 28);
      assert.strictEqual(tc3.frameRate, 29.97);
    });
  });

  describe('Pulldown', () => {
    it('converts 01:07:10:16 at 23.98 to 01:07:11;04 at 29.97', () => {
      const tc1 = new Timecode('01:07:10:16', 23.98);
      const tc2 = tc1.pulldown(29.97, '01:00:00:00');

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(1, tc2.hours, 'Hours are incorrect');
      assert.strictEqual(7, tc2.minutes, 'Minutes are incorrect');
      assert.strictEqual(11, tc2.seconds, 'Seconds are incorrect');
      assert.strictEqual(4, tc2.frames, 'Frames are incorrect');
    });

    it('converts 00:42:27:11 at 23.98 to 00:42:30:00 at 29.97', () => {
      const tc1 = new Timecode('00:42:27:11', 23.98);
      const tc2 = tc1.pulldown(29.97);

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(0, tc2.hours, 'Hours are incorrect');
      assert.strictEqual(42, tc2.minutes, 'Minutes are incorrect');
      assert.strictEqual(30, tc2.seconds, 'Seconds are incorrect');
      assert.strictEqual(0, tc2.frames, 'Frames are incorrect');
    });

    it('returns the same timecode as the input if it also matches the base', () => {
      const tc1 = new Timecode('02:04:56:12', 23.98);
      const tc2 = tc1.pulldown(29.97, '02:04:56:12');

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(2, tc2.hours, 'Hours are incorrect');
      assert.strictEqual(4, tc2.minutes, 'Minutes are incorrect');
      assert.strictEqual(56, tc2.seconds, 'Seconds are incorrect');
      assert.strictEqual(12, tc2.frames, 'Frames are incorrect');
    });
  });
});
