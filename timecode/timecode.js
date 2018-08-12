const TimecodeRegex = /(\d{1,2})\D(\d{1,2})\D(\d{1,2})\D(\d{1,2})/;
const secondCeiling = 60;
const minuteCeiling = 60;
const hourCeiling = 24;

class Timecode {
  constructor(timecode, frameRate) {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.frames = 0;

    if (frameRate) {
      this.frameRate = frameRate;
    } else if (timecode instanceof Timecode) {
      this.frameRate = timecode.frameRate;
    } else {
      this.frameRate = 29.97;
    }

    if (timecode) this.set(timecode);

    return this;
  }

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

  setFieldsFromString(input) {
    const [, hh, mm, ss, ff] = TimecodeRegex.exec(input);

    this.setHours(hh);
    this.setMinutes(mm);
    this.setSeconds(ss);

    // TODO: Make this less clumsy
    if (this.isDropFrame() && ff < 2 && ss === '00' && mm % 10 !== 0) {
      this.setFrames(parseInt(ff, 10) + 2);
    } else {
      this.setFrames(ff);
    }

    return this;
  }

  setFieldsFromObject(input) {
    if (Object.prototype.hasOwnProperty.call(input, 'hours')) this.setHours(input.hours);
    if (Object.prototype.hasOwnProperty.call(input, 'minutes')) this.setMinutes(input.minutes);
    if (Object.prototype.hasOwnProperty.call(input, 'seconds')) this.setSeconds(input.seconds);
    if (Object.prototype.hasOwnProperty.call(input, 'frames')) this.setFrames(input.frames);

    return this;
  }

  setFieldsFromDate(date) {
    this.setHours(date.getHours());
    this.setMinutes(date.getMinutes());
    this.setSeconds(date.getSeconds());
    this.setFrames(Math.trunc(date.getMilliseconds() / this.nominalFrameRate()));
    return this;
  }

  toString() {
    const c = this.separator();
    const h = this.hours.toString(10).padStart(2, '0');
    const m = this.minutes.toString(10).padStart(2, '0');
    const s = this.seconds.toString(10).padStart(2, '0');
    const f = this.frames.toString(10).padStart(2, '0');
    return `${h}${c}${m}${c}${s}${c}${f}`;
  }

  toObject() {
    return Object.assign({}, this);
  }

  setHours(hours) {
    const hh = (parseInt(hours, 10) % 24);

    if (Number.isNaN(hh)) throw new TypeError(`Cannot set hours to ${hours}`);

    this.hours = hh % hourCeiling;

    if (this.hours < 0) this.hours += hourCeiling;

    return this;
  }

  setMinutes(minutes) {
    const mm = parseInt(minutes, 10);

    if (Number.isNaN(mm)) throw new TypeError(`Cannot set minutes to ${minutes}`);

    this.minutes = mm % minuteCeiling;
    this.setHours(this.hours + Math.trunc(mm / minuteCeiling));

    if (this.minutes < 0) {
      this.minutes += minuteCeiling;
      this.setHours(this.hours - 1);
    }

    if (this.isDropFrame()
          && this.minutes % 10 !== 0
          && this.seconds === 0
          && this.frames === 0) {
      this.frames = 2;
    }

    return this;
  }

  setSeconds(seconds) {
    const ss = parseInt(seconds, 10);

    if (Number.isNaN(ss)) throw new TypeError(`Cannot set minutes to ${seconds}`);

    this.seconds = ss % secondCeiling;

    this.setMinutes(this.minutes + Math.trunc(ss / secondCeiling));

    if (this.seconds < 0) {
      this.seconds += secondCeiling;
      this.setMinutes(this.minutes - 1);
    }

    return this;
  }

  setFrames(frames) {
    const ff = parseInt(frames, 10);

    if (Number.isNaN(ff)) throw new TypeError(`Cannot set frames to ${frames}`);

    const nominalFrameRate = this.nominalFrameRate();
    this.frames = ff % nominalFrameRate;

    this.setSeconds(this.seconds + Math.trunc(ff / nominalFrameRate));

    if (this.frames < 0) {
      this.frames += this.nominalFrameRate();
      this.setSeconds(this.seconds - 1);
    }

    return this;
  }

  nominalFrameRate() {
    /* 23.98 -> 24
     * 25    -> 25
     * 29.97 -> 30
     * 30    -> 30
     */
    return Math.round(this.frameRate);
  }

  frameCount() {
    return this.framesInHoursField()
      + this.framesInMinutesField()
      + this.framesInSecondsField()
      + this.frames;
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

  framesToDrop() {
    // Dropcount for 29.97 is 2, for 59.94 is 4
    return this.isDropFrame() ? this.nominalFrameRate() / 15 : 0;
  }

  isDropFrame() {
    // 29.97 frames per second
    if (this.frameRate > 29 && this.frameRate < 30) return true;

    return false;
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

    tc.setHours(this.hours - subtrahend.hours);
    tc.setMinutes(this.minutes - subtrahend.minutes);
    tc.setSeconds(this.seconds - subtrahend.seconds);
    tc.setFrames(this.frames - subtrahend.frames);

    return tc;
  }
}

module.exports = Timecode;
