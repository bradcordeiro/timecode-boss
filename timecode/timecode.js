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
      this.frameRate = input.frameRate;
    } else if (input instanceof Date) {
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
    this.setFrames(Math.floor(date.getMilliseconds() / this.nominalFrameRate()));
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

  toObject(returnType, padded) {
    if (returnType && returnType.toLowerCase() === 'string') {
      if (padded === true) {
        return {
          hours: this.getHours().toString(10).padStart(2, '0'),
          minutes: this.getMinutes().toString(10).padStart(2, '0'),
          seconds: this.getSeconds().toString(10).padStart(2, '0'),
          frames: this.getFrames().toString(10).padStart(2, '0'),
        };
      }

      return {
        hours: this.getHours().toString(10),
        minutes: this.getMinutes().toString(10),
        seconds: this.getSeconds().toString(10),
        frames: this.getFrames().toString(10),
      };
    }

    return {
      hours: this.getHours(),
      minutes: this.getMinutes(),
      seconds: this.getSeconds(),
      frames: this.getFrames(),
    };
  }

  getHours() {
    // Control rolling over the 24 hour mark or under 0
    const maxFrames = this.framesPerHour() * 24;
    if (this.frameCount >= maxFrames) this.frameCount %= maxFrames;
    if (this.frameCount < 0) this.frameCount += maxFrames;

    return Math.floor(this.frameCount / this.framesPerHour());
  }

  setHours(hours) {
    const hh = (parseInt(hours, 10) % 24);

    if (Number.isNaN(hh)) throw new TypeError(`Cannot set hours to ${hours}`);

    this.frameCount -= this.framesInHoursField();
    this.frameCount += hh * this.framesPerHour();
    return this;
  }

  getMinutes() {
    const framesInHoursField = this.framesInHoursField();
    const framesPer10Minute = this.framesPer10Minute();
    const framesPerMinute = this.framesPerMinute();
    let remainingFrames = this.frameCount - framesInHoursField;
    const tenMinutes = Math.floor(remainingFrames / framesPer10Minute);
    remainingFrames -= tenMinutes * framesPer10Minute;
    // min() is required to handle rollling over 24 hours or under 0
    const singleMinutes = Math.min(Math.floor(remainingFrames / framesPerMinute), 9);

    return (tenMinutes * 10) + singleMinutes;
  }

  setMinutes(minutes) {
    const mm = parseInt(minutes, 10);

    if (Number.isNaN(mm)) throw new TypeError(`Cannot set minutes to ${minutes}`);

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
    const ss = parseInt(seconds, 10);

    if (Number.isNaN(ss)) throw new TypeError(`Cannot set minutes to ${seconds}`);

    this.frameCount -= this.framesInSecondsField();
    this.frameCount += ss * this.nominalFrameRate();
    return this;
  }

  getFrames() {
    let remainingFrames = this.frameCount - this.framesInHoursField();
    remainingFrames -= this.framesToDrop();
    remainingFrames -= this.framesInMinutesField();
    remainingFrames += this.framesToDrop();
    remainingFrames -= this.framesInSecondsField();

    return remainingFrames % this.nominalFrameRate();
  }

  setFrames(frames) {
    const ff = parseInt(frames, 10);

    if (Number.isNaN(ff)) throw new TypeError(`Cannot set minutes to ${frames}`);

    this.frameCount -= this.getFrames();
    this.frameCount += ff;
    return this;
  }

  convert(frameRate) {
    return new Timecode(this.frameCount, frameRate);
  }

  nominalFrameRate() {
    /* 23.98 -> 24
     * 25    -> 25
     * 29.97 -> 30
     * 30    -> 30
     * 50    -> 25
     * 59.94 -> 30
     * 60    -> 30
     */

    const fps = this.frameRate > 30 ? this.frameRate / 2 : this.frameRate;

    return Math.round(fps);
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
    const tc = new Timecode(this);

    if (!(addend instanceof Timecode)) {
      tc.frameCount += new Timecode(addend, this.frameRate).frameCount;
    } else {
      tc.frameCount += addend.frameCount;
    }

    return tc;
  }

  subtract(subtrahend) {
    const tc = new Timecode(this);

    if (!(subtrahend instanceof Timecode)) {
      tc.frameCount -= new Timecode(subtrahend, this.frameRate).frameCount;
    } else {
      tc.frameCount -= subtrahend.frameCount;
    }

    return tc;
  }
}

module.exports = Timecode;
