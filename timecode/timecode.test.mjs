/* eslint-env mocha */
import assert from 'assert';
import Timecode from '../dist/timecode.js'; /* eslint-disable-line import/extensions */

describe('Timecode', () => {
  describe('Constructor', () => {
    it('new Timecode() accepts no arguments', () => {
      const tc = new Timecode();

      assert.strictEqual(tc.hours, 0, 'Hours are incorrect');
      assert.strictEqual(tc.minutes, 0, 'Minutes are incorrect');
      assert.strictEqual(tc.seconds, 0, 'Seconds are incorrect');
      assert.strictEqual(tc.frames, 0, 'Frames are incorrect');
      assert.strictEqual(29.97, tc.frameRate, 'Frame rate is incorrect');
    });

    it('new Timecode() accepts a string in the format 00:00:00:00', () => {
      const tc = new Timecode('01:00:00:00');

      assert.strictEqual(tc.hours, 1, 'Hours are incorrect');
      assert.strictEqual(tc.minutes, 0, 'Minutes are incorrect');
      assert.strictEqual(tc.seconds, 0, 'Seconds are incorrect');
      assert.strictEqual(tc.frames, 0, 'Frames are incorrect');
    });

    it('new Timecode() accepts a string in the format 00:00:00.000', () => {
      const tc = new Timecode('00:00:21.24');

      assert.strictEqual(tc.hours, 0, 'Hours are incorrect');
      assert.strictEqual(tc.minutes, 0, 'Minutes are incorrect');
      assert.strictEqual(tc.seconds, 21, 'Seconds are incorrect');
      assert.strictEqual(tc.frames, 7, 'Frames are incorrect');
    });

    it('new Timecode() accepts a string in the format 00:00:00', () => {
      const tc = new Timecode('00:00:28');

      assert.strictEqual(tc.hours, 0, 'Hours are incorrect');
      assert.strictEqual(tc.minutes, 0, 'Minutes are incorrect');
      assert.strictEqual(tc.seconds, 28, 'Seconds are incorrect');
      assert.strictEqual(tc.frames, 0, 'Frames are incorrect');
    });

    it('new Timecode() accepts a Number', () => {
      const tc = new Timecode(1633998);

      assert.strictEqual(tc.frameCount(), 1633998, 'this.frameCount() returns incorrect frame count');
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

    it('new Timecode() accepts an object containing { hours: 0, minutes: 0, seconds: 0, frames: 0 }', () => {
      const tc = new Timecode({
        hours: 0,
        minutes: 0,
        seconds: 0,
        frames: 0,
        frameRate: 29.97,
      }, 29.97);

      assert.strictEqual(tc.hours, 0, 'Hours field');
      assert.strictEqual(tc.minutes, 0, 'Minutes field');
      assert.strictEqual(tc.seconds, 0, 'Seconds field');
      assert.strictEqual(tc.frames, 0, 'Frames field');
    });

    it('new Timecode() accepts an object containing { hours }', () => {
      const tc = new Timecode({
        hours: 1,
      });

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('new Timecode() accepts an object containing { minutes }', () => {
      const tc = new Timecode({
        minutes: 2,
      }, 30);

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 2);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
    });

    it('new Timecode() accepts an object containing { seconds }', () => {
      const tc = new Timecode({
        seconds: 3,
      });

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 3);
      assert.strictEqual(tc.frames, 0);
    });

    it('new Timecode() accepts an object containing { frames }', () => {
      const tc = new Timecode({
        frames: 4,
      }, 29.97);

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 4);
    });

    it('new Timecode() accepts an object containing { frameRate }', () => {
      const tc = new Timecode({
        frames: 4,
      }, 24);

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 4);
      assert.strictEqual(tc.frameRate, 24);
    });

    it('new Timecode() accepts a Date object', () => {
      const date = new Date(0, 0, 0, 0, 8, 30, 200);
      const tc = new Timecode(date, 29.97);

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 8);
      assert.strictEqual(tc.seconds, 30);
      assert.strictEqual(tc.frames, 6);
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

      assert.strictEqual(tc.hours, 0);
      assert.strictEqual(tc.minutes, 0);
      assert.strictEqual(tc.seconds, 0);
      assert.strictEqual(tc.frames, 0);
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

    it('new Timcode() doesn\'t increment for drop-frame before all fields are set', () => {
      const tc = new Timecode('01:01:57:00');

      assert.strictEqual(tc.hours, 1);
      assert.strictEqual(tc.minutes, 1);
      assert.strictEqual(tc.seconds, 57);
      assert.strictEqual(tc.frames, 0);
    });
  });

  describe('Static Methods', () => {
    describe('isValidTimecodeString()', () => {
      it('returns true for 4 sets of 2 digits separated by colons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('12:23:45:67'), true);
      });

      it('returns true for 4 sets of 2 digits separated by semicolons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('00;11;22;33'), true);
      });

      it('returns true for 4 sets of 1-2 digits separated by colons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('1:23:4:56'), true);
      });

      it('returns true for 4 sets of 1 digit separated by semicolons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('1:2:3:4'), true);
      });

      it('returns false for 3 sets of 2 digits separated by semicolons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('01:23:45'), false);
      });

      it('returns false for 2 sets of 2 digits separated by semicolons', () => {
        assert.strictEqual(Timecode.isValidTimecodeString('56:43'), false);
      });
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

      assert.strictEqual(tc.seconds, 15);
    });

    it('setSeconds() accepts a string', () => {
      const tc = new Timecode();
      tc.setSeconds('15');

      assert.strictEqual(tc.seconds, 15);
    });

    it('setSeconds() rolls seconds over 59 into minutes', () => {
      const tc = new Timecode(0, 30);
      tc.setSeconds(64);

      assert.strictEqual(tc.seconds, 4, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.minutes, 1, 'Minutes were calculated incorrectly');
    });

    it('setHours() truncates a fractional hour', () => {
      const tc = new Timecode('01:20:30:25', 30);
      tc.setHours(5.7);

      assert.strictEqual(tc.hours, 5, 'Hours were calculated incorrectly');
      assert.strictEqual(tc.minutes, 20, 'Minutes were calculated incorrectly');
      assert.strictEqual(tc.seconds, 30, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.frames, 25, 'Frames were calculated incorrectly');
    });

    it('setMinutes() truncates a fractional minute', () => {
      const tc = new Timecode('01:20:30:25', 30);
      tc.setMinutes(10.2);

      assert.strictEqual(tc.hours, 1, 'Hours were calculated incorrectly');
      assert.strictEqual(tc.minutes, 10, 'Minutes were calculated incorrectly');
      assert.strictEqual(tc.seconds, 30, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.frames, 25, 'Frames were calculated incorrectly');
    });

    it('setSeconds() truncates a fractional second', () => {
      const tc = new Timecode('01:20:30:25', 30);
      tc.setMinutes(40.2);

      assert.strictEqual(tc.hours, 1, 'Hours were calculated incorrectly');
      assert.strictEqual(tc.minutes, 40, 'Minutes were calculated incorrectly');
      assert.strictEqual(tc.seconds, 30, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.frames, 25, 'Frames were calculated incorrectly');
    });

    it('setFrames truncates a fractional frame', () => {
      const tc = new Timecode('01:20:30:25', 30);
      tc.setFrames(28.7);

      assert.strictEqual(tc.hours, 1, 'Hours were calculated incorrectly');
      assert.strictEqual(tc.minutes, 20, 'Minutes were calculated incorrectly');
      assert.strictEqual(tc.seconds, 30, 'Seconds were calculated incorrectly');
      assert.strictEqual(tc.frames, 28, 'Frames were calculated incorrectly');
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
      assert.strictEqual(tc3.frames, 21);
      assert.strictEqual(tc3.frameRate, 29.97);
    });
  });

  describe('Pulldown', () => {
    it('Returns a new object', () => {
      const tc1 = new Timecode('01:07:10:16', 23.98);
      const tc2 = tc1.pulldown(29.97, '01:00:00:00');

      assert.strictEqual(tc1 === tc2, false);

      assert.strictEqual(tc1.frameRate, 23.98);
      assert.strictEqual(tc1.hours, 1, 'Source hours were mutated');
      assert.strictEqual(tc1.minutes, 7, 'Source Minutes were mutated');
      assert.strictEqual(tc1.seconds, 10, 'Source Seconds were mutated');
      assert.strictEqual(tc1.frames, 16, 'Source Frames were mutated');
    });

    it('converts 01:07:10:16 at 23.98 to 01:07:11;04 at 29.97', () => {
      const tc1 = new Timecode('01:07:10:16', 23.98);
      const tc2 = tc1.pulldown(29.97, '01:00:00:00');

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(tc2.hours, 1, 'Hours are incorrect');
      assert.strictEqual(tc2.minutes, 7, 'Minutes are incorrect');
      assert.strictEqual(tc2.seconds, 11, 'Seconds are incorrect');
      assert.strictEqual(tc2.frames, 4, 'Frames are incorrect');
    });

    it('converts 00:42:27:11 at 23.98 to 00:42:30:00 at 29.97', () => {
      const tc1 = new Timecode('00:42:27:11', 23.98);
      const tc2 = tc1.pulldown(29.97);

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(tc2.hours, 0, 'Hours are incorrect');
      assert.strictEqual(tc2.minutes, 42, 'Minutes are incorrect');
      assert.strictEqual(tc2.seconds, 30, 'Seconds are incorrect');
      assert.strictEqual(tc2.frames, 0, 'Frames are incorrect');
    });

    it('returns the same timecode as the input if it also matches the base', () => {
      const tc1 = new Timecode('02:04:56:12', 23.98);
      const tc2 = tc1.pulldown(29.97, '02:04:56:12');

      assert.strictEqual(tc2.frameRate, 29.97);
      assert.strictEqual(tc2.hours, 2, 'Hours are incorrect');
      assert.strictEqual(tc2.minutes, 4, 'Minutes are incorrect');
      assert.strictEqual(tc2.seconds, 56, 'Seconds are incorrect');
      assert.strictEqual(tc2.frames, 12, 'Frames are incorrect');
    });
  });

  describe('Comparisons', () => {
    describe('isBefore()', () => {
      /* This test will iterate through every timecode for every supported framerate
          so it's best skipped most of the time
      */
      it.skip('works for every possible timecode', () => {
        const frameRates = [23.98, 24, 25, 29.97, 30, 50, 59.94, 60];

        for (let r = 0; r < frameRates.length; r += 1) {
          const nominalFrameRate = parseInt(frameRates[r], 10);

          for (let h = 0; h < 24; h += 1) {
            for (let m = 0; m < 60; m += 1) {
              for (let s = 0; s < 60; s += 1) {
                for (let f = 0; f < nominalFrameRate; f += 1) {
                  for (let i = 0; i < 24; i += 1) {
                    for (let n = 0; n < 60; n += 1) {
                      for (let t = 0; t < 60; t += 1) {
                        for (let g = 0; g < nominalFrameRate; g += 1) {
                          const tc1 = new Timecode({
                            hours: h,
                            minutes: m,
                            seconds: s,
                            frames: f,
                          }, frameRates[r]);

                          const tc2 = new Timecode({
                            hours: i,
                            minutes: n,
                            seconds: t,
                            frames: g,
                          }, frameRates[r]);

                          /* eslint-disable max-len */
                          if (h < i) {
                            assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed on hours`);
                          } else if (h > i) {
                            assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} >= ${tc2.toString()} failed on hours`);
                          } else if (m < n) {
                            assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed on minutes`);
                          } else if (m > n) {
                            assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} >= ${tc2.toString()} failed on minutes`);
                          } else if (s < t) {
                            assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed on seconds`);
                          } else if (s > t) {
                            assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} >= ${tc2.toString()} failed on seconds`);
                          } else if (f < g) {
                            assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed on frames`);
                          } else if (f > g) {
                            assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} >= ${tc2.toString()} failed on frames`);
                          } else {
                            assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} == ${tc2.toString()} failed on frames`);
                          }
                          /* eslint-enable max-len */
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      it('Accurate for a timecodes with an hours difference', () => {
        const attributes = { minutes: 0, seconds: 0, frames: 0 };

        for (let h = 0; h < 24; h += 1) {
          for (let i = 0; i < 24; i += 1) {
            const tc1 = new Timecode({ ...attributes, hours: h }, 29.97);
            const tc2 = new Timecode({ ...attributes, hours: i }, 29.97);

            if (h < i) {
              assert.strictEqual(tc1.isBefore(tc2), true);
            } else {
              assert.strictEqual(tc1.isBefore(tc2), false);
            }
          }
        }
      });

      it('Accurate for a timecodes with a minute difference', () => {
        const attributes = { hours: 0, seconds: 0, frames: 0 };

        for (let m = 0; m < 60; m += 1) {
          for (let n = 0; n < 60; n += 1) {
            const tc1 = new Timecode({ ...attributes, minutes: m }, 29.97);
            const tc2 = new Timecode({ ...attributes, minutes: n }, 29.97);

            if (m < n) {
              assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a seconds difference', () => {
        const attributes = { hours: 0, minutes: 0, frames: 0 };

        for (let s = 0; s < 60; s += 1) {
          for (let t = 0; t < 60; t += 1) {
            const tc1 = new Timecode({ ...attributes, seconds: s }, 29.97);
            const tc2 = new Timecode({ ...attributes, seconds: t }, 29.97);

            if (s < t) {
              assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a frame difference', () => {
        const attributes = { hours: 0, minutes: 0, seconds: 0 };

        for (let f = 0; f < 30; f += 1) {
          for (let g = 0; g < 30; g += 1) {
            const tc1 = new Timecode({ ...attributes, frames: f }, 29.97);
            const tc2 = new Timecode({ ...attributes, frames: g }, 29.97);

            if (f < g) {
              assert.strictEqual(tc1.isBefore(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isBefore(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });
    });

    describe('isSame()', () => {
      it('Accurate for a timecodes with an hours difference', () => {
        const attributes = { minutes: 0, seconds: 0, frames: 0 };

        for (let h = 0; h < 24; h += 1) {
          for (let i = 0; i < 24; i += 1) {
            const tc1 = new Timecode({ ...attributes, hours: h }, 29.97);
            const tc2 = new Timecode({ ...attributes, hours: i }, 29.97);

            if (h === i) {
              assert.strictEqual(tc1.isSame(tc2), true);
            } else {
              assert.strictEqual(tc1.isSame(tc2), false);
            }
          }
        }
      });

      it('Accurate for a timecodes with a minute difference', () => {
        const attributes = { hours: 0, seconds: 0, frames: 0 };

        for (let m = 0; m < 60; m += 1) {
          for (let n = 0; n < 60; n += 1) {
            const tc1 = new Timecode({ ...attributes, minutes: m }, 29.97);
            const tc2 = new Timecode({ ...attributes, minutes: n }, 29.97);

            if (m === n) {
              assert.strictEqual(tc1.isSame(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isSame(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a seconds difference', () => {
        const attributes = { hours: 0, minutes: 0, frames: 0 };

        for (let s = 0; s < 60; s += 1) {
          for (let t = 0; t < 60; t += 1) {
            const tc1 = new Timecode({ ...attributes, seconds: s }, 29.97);
            const tc2 = new Timecode({ ...attributes, seconds: t }, 29.97);

            if (s === t) {
              assert.strictEqual(tc1.isSame(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isSame(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a frame difference', () => {
        const attributes = { hours: 0, minutes: 0, seconds: 0 };

        for (let f = 0; f < 30; f += 1) {
          for (let g = 0; g < 30; g += 1) {
            const tc1 = new Timecode({ ...attributes, frames: f }, 29.97);
            const tc2 = new Timecode({ ...attributes, frames: g }, 29.97);

            if (f === g) {
              assert.strictEqual(tc1.isSame(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isSame(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });
    });

    describe('isAfter', () => {
      it('Accurate for a timecodes with an hours difference', () => {
        const attributes = { minutes: 0, seconds: 0, frames: 0 };

        for (let h = 0; h < 24; h += 1) {
          for (let i = 0; i < 24; i += 1) {
            const tc1 = new Timecode({ ...attributes, hours: h }, 29.97);
            const tc2 = new Timecode({ ...attributes, hours: i }, 29.97);

            if (h > i) {
              assert.strictEqual(tc1.isAfter(tc2), true);
            } else {
              assert.strictEqual(tc1.isAfter(tc2), false);
            }
          }
        }
      });

      it('Accurate for a timecodes with a minute difference', () => {
        const attributes = { hours: 0, seconds: 0, frames: 0 };

        for (let m = 0; m < 60; m += 1) {
          for (let n = 0; n < 60; n += 1) {
            const tc1 = new Timecode({ ...attributes, minutes: m }, 29.97);
            const tc2 = new Timecode({ ...attributes, minutes: n }, 29.97);

            if (m > n) {
              assert.strictEqual(tc1.isAfter(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isAfter(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a seconds difference', () => {
        const attributes = { hours: 0, minutes: 0, frames: 0 };

        for (let s = 0; s < 60; s += 1) {
          for (let t = 0; t < 60; t += 1) {
            const tc1 = new Timecode({ ...attributes, seconds: s }, 29.97);
            const tc2 = new Timecode({ ...attributes, seconds: t }, 29.97);

            if (s > t) {
              assert.strictEqual(tc1.isAfter(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isAfter(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });

      it('Accurate for a timecodes with a frame difference', () => {
        const attributes = { hours: 0, minutes: 0, seconds: 0 };

        for (let f = 0; f < 30; f += 1) {
          for (let g = 0; g < 30; g += 1) {
            const tc1 = new Timecode({ ...attributes, frames: f }, 29.97);
            const tc2 = new Timecode({ ...attributes, frames: g }, 29.97);

            if (f > g) {
              assert.strictEqual(tc1.isAfter(tc2), true, `${tc1.toString()} < ${tc2.toString()} failed`);
            } else {
              assert.strictEqual(tc1.isAfter(tc2), false, `${tc1.toString()} !< ${tc2.toString()} failed`);
            }
          }
        }
      });
    });

    describe('isBetween()', () => {
      it('Accurate for a timecodes with an hours difference', () => {
        const attributes = { minutes: 0, seconds: 0, frames: 0 };

        for (let h = 0; h < 24; h += 1) {
          for (let i = 0; i < 24; i += 1) {
            for (let j = 0; j < 24; j += 1) {
              const tc1 = new Timecode({ ...attributes, hours: h }, 29.97);
              const tc2 = new Timecode({ ...attributes, hours: i }, 29.97);
              const tc3 = new Timecode({ ...attributes, hours: j }, 29.97);

              if (h > i && h < j) {
                assert.strictEqual(tc1.isBetween(tc2, tc3), true, `${tc1.toString()} not between ${tc2.toString()} and ${tc3.toString()}`);
              } else {
                assert.strictEqual(tc1.isBetween(tc2, tc3), false, `${tc1.toString()} between ${tc2.toString()} and ${tc3.toString()}`);
              }
            }
          }
        }
      });
    });
  });
});
