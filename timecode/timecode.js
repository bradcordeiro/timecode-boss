const TimecodeRegex = /(\d{1,2})\D(\d{1,2})\D(\d{1,2})\D(\d{1,2})/;
const secondsInOneMinute = 60;
const minutesInOneHour = 60;
const hoursInOneDay = 24;

function parseIntOrError(input, errorMessage) {
  const int = parseInt(input, 10);

  if (Number.isNaN(int)) throw new TypeError(errorMessage);

  return int;
}

function parseFloatOrError(input, errorMessage) {
  const float = parseFloat(input);

  if (Number.isNaN(float)) throw new TypeError(errorMessage);

  return float;
}

class Timecode {
  constructor(timecode, frameRate) {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.frames = 0;

    if (frameRate) {
      this.frameRate = frameRate;
    } else if (timecode && timecode.frameRate) {
      this.frameRate = timecode.frameRate;
    } else {
      this.frameRate = 29.97;
    }

    if (timecode) this.set(timecode);
  }

  // select a setting method based on input type
  set(input) {
    if (input instanceof Date) {
      this.setFieldsFromDate(input);
    } else if (typeof input === 'object') {
      this.setFieldsFromObject(input);
    } else if (TimecodeRegex.test(input)) {
      this.setFieldsFromString(input);
    } else if (typeof input === 'number') {
      this.setFieldsFromFrameCount(input);
    } else {
      throw new TypeError(`Invalid timecode parameter "${input}"`);
    }

    return this;
  }

  setFieldsFromFrameCount(input) {
    let remainingFrames = input;

    this.setHours(Math.trunc(remainingFrames / this.framesPerHour()));
    remainingFrames -= this.framesInHoursField();

    const tenMinutes = Math.trunc(remainingFrames / this.framesPer10Minute());
    remainingFrames -= this.framesPer10Minute() * tenMinutes;
    const singleMinutes = Math.trunc(remainingFrames / this.framesPerMinute());
    this.setMinutes((tenMinutes * 10) + singleMinutes);
    remainingFrames -= singleMinutes * this.framesPerMinute();

    this.setSeconds(Math.trunc(remainingFrames / this.nominalFrameRate()));
    remainingFrames -= this.framesInSecondsField();

    this.setFrames(remainingFrames);
  }

  // Parses timecode fields from a string in the format 00:00:00:00
  setFieldsFromString(input) {
    const [, hh, mm, ss, ff] = TimecodeRegex.exec(input);

    this.setHours(hh);
    this.setMinutes(mm);
    this.setSeconds(ss);
    this.setFrames(ff);

    return this;
  }

  // Sets timecode fields from an object with the same property names
  setFieldsFromObject(input) {
    if (Object.prototype.hasOwnProperty.call(input, 'hours')) this.setHours(input.hours);
    if (Object.prototype.hasOwnProperty.call(input, 'minutes')) this.setMinutes(input.minutes);
    if (Object.prototype.hasOwnProperty.call(input, 'seconds')) this.setSeconds(input.seconds);
    if (Object.prototype.hasOwnProperty.call(input, 'frames')) this.setFrames(input.frames);

    return this;
  }

  // Converts a date object to timecode
  setFieldsFromDate(date) {
    this.setHours(date.getHours());
    this.setMinutes(date.getMinutes());
    this.setSeconds(date.getSeconds());
    this.setFrames(Math.trunc(date.getMilliseconds() / this.nominalFrameRate()));
    return this;
  }

  // Returns a string in the format HH:MM:SS:FF
  toString() {
    const c = this.separator();
    const h = this.hours.toString(10).padStart(2, '0');
    const m = this.minutes.toString(10).padStart(2, '0');
    const s = this.seconds.toString(10).padStart(2, '0');
    const f = this.frames.toString(10).padStart(2, '0');
    return `${h}:${m}:${s}${c}${f}`;
  }

  // Returns a string in the format HH:MM:SS,mmm, with mmm being fractional seconds
  toSRTString(realTime = false) {
    let tc = this;

    if (realTime === true) {
      tc = this.pulldown(29.97);
    }

    const h = tc.hours.toString(10).padStart(2, '0');
    const m = tc.minutes.toString(10).padStart(2, '0');
    const s = tc.seconds.toString(10).padStart(2, '0');

    const milliseconds = tc.milliseconds().toString(10).substr(2, 3);
    const mm = milliseconds.padEnd(3, '0');

    return `${h}:${m}:${s},${mm}`;
  }

  // Returns new plain javascript object with field and framerate properties
  toObject() {
    return {
      hours: this.hours,
      minutes: this.minutes,
      seconds: this.seconds,
      frames: this.frames,
      frameRate: this.frameRate,
    };
  }

  // Set hours, with some validation
  setHours(hours) {
    if (hours === undefined) return this;

    const hh = parseIntOrError(hours, `Cannot set hours to ${hours}`);

    // Hours should not be higher than 23, and should restart counting up from 0 after 23
    this.hours = hh % hoursInOneDay;

    // Hours should not be less than 0, and should count down from 24 if negative
    while (this.hours < 0) this.hours += hoursInOneDay;

    this.incrementIfDropFrame();

    return this;
  }

  // Set Minutes, with some validation
  setMinutes(minutes) {
    if (minutes === undefined) return this;

    const mm = parseIntOrError(minutes, `Cannot set minutes to ${minutes}`);

    this.minutes = mm % minutesInOneHour;
    this.setHours(this.hours + Math.trunc(mm / minutesInOneHour));

    // minutes should not be negative, and should borrow from the hours instead
    if (this.minutes < 0) {
      this.minutes += minutesInOneHour;
      this.setHours(this.hours - 1);
    }

    this.incrementIfDropFrame();

    return this;
  }

  // Set seconds, with some validation
  setSeconds(seconds) {
    if (seconds === undefined) return this;

    const ss = parseIntOrError(seconds, `Cannot set minutes to ${seconds}`);

    this.seconds = ss % secondsInOneMinute;

    this.setMinutes(this.minutes + Math.trunc(ss / secondsInOneMinute));

    if (this.seconds < 0) {
      this.seconds += secondsInOneMinute;
      this.setMinutes(this.minutes - 1);
    }

    this.incrementIfDropFrame();

    return this;
  }

  // Set frames, withj some validation
  setFrames(frames) {
    if (frames === undefined) return this;

    const ff = parseIntOrError(frames, `Cannot set frames to ${frames}`);

    const nominalFrameRate = this.nominalFrameRate();
    this.frames = ff % nominalFrameRate;

    this.setSeconds(this.seconds + Math.trunc(ff / nominalFrameRate));

    if (this.frames < 0) {
      this.frames += this.nominalFrameRate();
      this.setSeconds(this.seconds - 1);
    }

    this.incrementIfDropFrame();

    return this;
  }

  // Many timecode calculations require the framerate to be rounded up, this returns that
  nominalFrameRate() {
    /* 23.98 -> 24
     * 25    -> 25
     * 29.97 -> 30
     * 30    -> 30
     */
    return Math.round(this.frameRate);
  }

  // Returns the exact framerate for framerates which are not integers
  exactFrameRate() {
    if (this.frameRate > 59 && this.frameRate < 60) {
      return 60000 / 1001;
    }

    if (this.frameRate > 29 && this.frameRate < 30) {
      return 30000 / 1001;
    }

    if (this.frameRate > 23 && this.frameRate < 24) {
      return 24000 / 1001;
    }

    return this.frameRate;
  }

  // Returns the total number of frames that this Timecode represents
  frameCount() {
    return this.framesInHoursField()
      + this.framesInMinutesField()
      + this.framesInSecondsField()
      + this.frames;
  }

  fractionalSeconds() {
    return this.seconds + this.milliseconds();
  }

  framesPerHour() {
    return this.framesPer10Minute() * 6;
  }

  framesPer10Minute() {
    return (this.framesPerMinute() * 10) + this.framesToDrop();
  }

  framesPerMinute() {
    return (60 * this.nominalFrameRate()) - this.framesToDrop();
  }

  milliseconds() {
    return this.frames / this.nominalFrameRate();
  }

  framesToDrop() {
    // Dropcount for 29.97 is 2, for 59.94 is 4
    return this.isDropFrame() ? this.nominalFrameRate() / 15 : 0;
  }

  isDropFrame() {
    // 29.97 or 59.94  per second
    if (this.frameRate > 29 && this.frameRate < 30) return true;
    if (this.frameRate > 59 && this.frameRate < 60) return true;

    return false;
  }

  incrementIfDropFrame() {
    // Drop frame skips frame 00 and frame 01 on every even minute but not every tenth minute
    if (this.isDropFrame() && this.frames < 2 && this.seconds === 0 && this.minutes % 10 !== 0) {
      this.frames += 2;
    }
  }

  separator() {
    return this.isDropFrame() ? ';' : ':';
  }

  framesInHoursField() {
    return this.hours * this.framesPerHour();
  }

  framesInMinutesField() {
    return (
      (Math.trunc(this.minutes / 10) * this.framesPer10Minute())
        + ((this.minutes % 10) * this.framesPerMinute())
    );
  }

  framesInSecondsField() {
    return this.seconds * this.nominalFrameRate();
  }

  add(addend) {
    const tc = new Timecode(this);

    if (!(addend instanceof Timecode)) {
      return tc.add(new Timecode(addend, this.frameRate));
    }

    if (this.frameRate !== addend.frameRate) {
      return tc.add(addend.pulldown(this.frameRate));
    }

    tc.setHours(this.hours + addend.hours);
    tc.setMinutes(this.minutes + addend.minutes);
    tc.setSeconds(this.seconds + addend.seconds);
    tc.setFrames(this.frames + addend.frames);

    return tc;
  }

  subtract(subtrahend) {
    const tc = new Timecode(this);

    if (!(subtrahend instanceof Timecode)) {
      return tc.subtract(new Timecode(subtrahend, this.frameRate));
    }

    if (this.frameRate !== subtrahend.frameRate) {
      return tc.subtract(subtrahend.pulldown(this.frameRate));
    }

    tc.setHours(this.hours - subtrahend.hours);
    tc.setMinutes(this.minutes - subtrahend.minutes);
    tc.setSeconds(this.seconds - subtrahend.seconds);
    tc.setFrames(this.frames - subtrahend.frames);

    return tc;
  }

  pulldown(frameRate, start = 0) {
    const fps = parseFloatOrError(frameRate, `Cannot pulldown to framerate of ${frameRate}`);

    const oldBase = new Timecode(start, this.frameRate);
    const newBase = new Timecode(start, fps);
    const output = new Timecode(0, fps);

    let outputFrames = this.subtract(oldBase).frameCount();
    outputFrames *= output.nominalFrameRate();
    outputFrames /= this.nominalFrameRate();
    outputFrames = Math.ceil(outputFrames);

    output.setFieldsFromFrameCount(outputFrames);

    return output.add(newBase);
  }

  pullup(frameRate, base) {
    return this.pulldown(frameRate, base);
  }
}

module.exports = Timecode;
