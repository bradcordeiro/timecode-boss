const TimecodeRegex = /(\d{1,2})\D(\d{1,2})\D(\d{1,2})\D(\d{1,2})/;

class Timecode {
  constructor(timecode, frameRate) {
    this.frameRate = 29.97;
    this.frameCount = 0;

    if (frameRate) this.frameRate = frameRate;
    if (timecode) this.set(timecode);

    return this;
  }

  set(input) {
    if (input instanceof Timecode) {
      this.frameCount = input.frameCount;
      this.frameRate = input.frameCount;
    }
    if (input instanceof Date) {
      this.setFrameCountFromDate(input);
    } else if (TimecodeRegex.test(input)) {
      this.setFrameCountFromString(input);
    } else if (typeof input === 'number') {
      this.frameCount = Math.floor(input);
    } else if (typeof input === 'object') {
      this.setFrameCountFromObject(input);
    } else {
      throw new TypeError(`Invalid timecode parameter "${input}"`);
    }

    return this;
  }

  setFrameCountFromString(input) {
    const [, hh, mm, ss, ff] = TimecodeRegex.exec(input);

    this.setHours(hh);
    this.setMinutes(mm);
    this.setSeconds(ss);

    // TODO: Make this less clumsy
    if (this.isDropFrame() && ff < 2 && ss === '00' && mm % 10 !== 0) {
      this.setFrames(parseInt(ff, 10) + 2);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid drop frame timecode string was used (${input}). It has been adjusted to ${this.toString()}`);
      }
    } else {
      this.setFrames(ff);
    }

    return this;
  }

  setFrameCountFromObject(input) {
    if (Object.prototype.hasOwnProperty.call(input, 'hours')) this.setHours(input.hours);
    if (Object.prototype.hasOwnProperty.call(input, 'minutes')) this.setMinutes(input.minutes);
    if (Object.prototype.hasOwnProperty.call(input, 'seconds')) this.setSeconds(input.seconds);
    if (Object.prototype.hasOwnProperty.call(input, 'frames')) this.setFrames(input.frames);

    return this;
  }

  setFrameCountFromDate(date) {
    this.setHours(date.getHours());
    this.setMinutes(date.getMinutes());
    this.setSeconds(date.getSeconds());
    this.setFrames(Math.floor(date.getMilliseconds() / this.frameRate));
    return this;
  }

  toString() {
    const c = this.separator();
    const h = this.getHours().toString(10).padStart(2, '0');
    const m = this.getMinutes().toString(10).padStart(2, '0');
    const s = this.getSeconds().toString(10).padStart(2, '0');
    const f = this.getFrames().toString(10).padStart(2, '0');
    return `${h}${c}${m}${c}${s}${c}${f}`;
  }

  getHours() {
    return Math.floor(this.frameCount / this.framesPerHour()) % 24;
  }

  setHours(hours) {
    if (Number.isNaN(hours)) throw new TypeError(`Cannot set hours to ${hours}`);

    const hh = parseInt(hours, 10);
    this.frameCount -= this.framesInHoursField();
    this.frameCount += hh * this.framesPerHour();
    return this;
  }

  getMinutes() {
    let remainingFrames = this.frameCount - this.framesInHoursField();
    const tenMinutes = Math.floor(remainingFrames / this.framesPer10Minute());
    remainingFrames -= tenMinutes * this.framesPer10Minute();
    const singleMinutes = Math.floor(remainingFrames / this.framesPerMinute());

    return (tenMinutes * 10) + singleMinutes;
  }

  setMinutes(minutes) {
    if (Number.isNaN(minutes)) throw new TypeError(`Cannot set minutes to ${minutes}`);

    const mm = parseInt(minutes, 10);
    this.frameCount -= this.framesInMinutesField();
    this.frameCount += Math.floor(mm / 10) * this.framesPer10Minute();
    this.frameCount += (mm % 10) * this.framesPerMinute();
    return this;
  }

  getSeconds() {
    const remaining = this.frameCount - this.framesInHoursField() - this.framesInMinutesField();
    return Math.floor(remaining / this.nominalFrameRate());
  }

  setSeconds(seconds) {
    if (Number.isNaN(seconds)) throw new TypeError(`Cannot set minutes to ${seconds}`);

    const ss = parseInt(seconds, 10);
    this.frameCount -= this.framesInSecondsField();
    this.frameCount += ss * this.nominalFrameRate();
    return this;
  }

  getFrames() {
    let remainingFrames = this.frameCount - this.framesInHoursField();
    remainingFrames -= this.framesInMinutesField();
    remainingFrames -= this.framesInSecondsField();

    return remainingFrames % this.nominalFrameRate();
  }

  setFrames(frames) {
    if (Number.isNaN(frames)) throw new TypeError(`Cannot set minutes to ${frames}`);

    const ff = parseInt(frames, 10);
    this.frameCount -= this.getFrames();
    this.frameCount += ff;
    return this;
  }

  convert(frameRate) {
    return new Timecode(this.frameCount, frameRate);
  }

  nominalFrameRate() {
    return Math.round(this.frameRate);
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

    // 59.94 frames per second
    if (this.frameRate > 59 && this.frameRate < 60) return true;

    return false;
  }

  separator() {
    return this.isDropFrame() ? ';' : ':';
  }

  framesInHoursField() {
    return this.getHours() * this.framesPerHour();
  }

  framesInMinutesField() {
    return (
      (Math.floor(this.getMinutes() / 10) * this.framesPer10Minute())
        + ((this.getMinutes() % 10) * this.framesPerMinute())
    );
  }

  framesInSecondsField() {
    return this.getSeconds() * this.nominalFrameRate();
  }

  add(addend) {
    if (!(addend instanceof Timecode)) {
      this.frameCount += new Timecode(addend, this.frameRate).frameCount;
    } else {
      this.frameCount += addend.frameCount;
    }

    return this;
  }

  subtract(subtrahend) {
    if (!(subtrahend instanceof Timecode)) {
      this.frameCount -= new Timecode(subtrahend, this.frameRate).frameCount;
    } else {
      this.frameCount -= subtrahend.frameCount;
    }

    return this;
  }
}

module.exports = Timecode;
