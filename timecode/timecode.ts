export type TimecodeAttributes = {
  hours?: number
  minutes?: number
  seconds?: number
  frames?: number
  frameRate?: number
};

export type ConvertibleToTimecode = number | string | TimecodeAttributes | Date;

const TimeStampRegex = /(\d{1,2}):(\d{1,2}):(\d{1,2})[.,]?(\d{1,3})?/;
const TimecodeRegex = /(\d{1,2})[:;](\d{1,2})[:;](\d{1,2})[:;](\d{1,2})/;
const SecondsInOneMinute = 60;
const MinutesInOneHour = 60;
const HoursInOneDay = 24;

/** Class representing a timecode. */
export default class Timecode implements Required<TimecodeAttributes> {
  hours: number;

  minutes: number;

  seconds: number;

  frames: number;

  frameRate: number;

  constructor(timecode: ConvertibleToTimecode, frameRate = 29.97) {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.frames = 0;
    this.frameRate = frameRate;

    if (timecode instanceof Date) {
      this.setFieldsFromDate(timecode);
    } else if (typeof timecode === 'number') {
      this.setFieldsFromFrameCount(timecode);
    } else if (typeof timecode === 'string') {
      this.setFieldsFromString(timecode);
    } else if (typeof timecode === 'object') {
      this.setFieldsFromObject(timecode);
      if (timecode.frameRate) {
        this.frameRate = timecode.frameRate;
      }
    }
  }

  private setFieldsFromFrameCount(input: number) : void {
    // We'll populate the hours, minutes, seconds, and frame fields by finding
    // how many frames will fill the hours, subtracting that from the total, and using
    // the remaining value for the minutes, etc., for each field
    let remainingFrames = input;

    this.setHours(Math.trunc(input / this.framesPerHour()));
    remainingFrames -= this.framesInHoursField();

    // For drop frame, two frames are not counted each minute but are for every tenth
    // minute, we can deal with this by getting the ten minute chunks first and then
    // dealing with what's left
    const tenMinutes = Math.trunc(remainingFrames / this.framesPer10Minute());
    remainingFrames -= this.framesPer10Minute() * tenMinutes;
    const singleMinutes = Math.trunc(remainingFrames / this.framesPerMinute());
    this.setMinutes((tenMinutes * 10) + singleMinutes);
    remainingFrames -= singleMinutes * this.framesPerMinute();

    this.setSeconds(Math.trunc(remainingFrames / this.nominalFrameRate()));
    remainingFrames -= this.framesInSecondsField();

    this.setFrames(remainingFrames);
  }

  /** Parses and sets timecode fields from a string in the format 00:00:00:00 */
  private setFieldsFromString(input: string) : this {
    let matches = TimecodeRegex.exec(input);

    if (matches && matches.length === 5) {
      const [, hh, mm, ss, ff] = matches;

      const hours = parseInt(hh, 10);
      const minutes = parseInt(mm, 10);
      const seconds = parseInt(ss, 10);
      const frames = parseInt(ff, 10);

      return this.setFieldsFromObject({
        hours,
        minutes,
        seconds,
        frames,
      });
    }

    matches = TimeStampRegex.exec(input);

    if (matches && matches.length >= 4) {
      const [, hh, mm, ss, ms] = matches;

      const msDefault = ms || 0;

      const hours = parseInt(hh, 10);
      const minutes = parseInt(mm, 10);
      const seconds = parseInt(ss, 10);
      const milliseconds = parseFloat(`0.${msDefault}`);

      return this.setFieldsFromObject({
        hours,
        minutes,
        seconds,
        frames: this.getFramesFromMilliseconds(milliseconds),
      });
    }

    throw new TypeError(`Invalid timecode string ${input}`);
  }

  /** Sets timecode fields from an object with any of the
   * properties 'hours', 'minutes', 'seconds', or 'frames'
   */
  private setFieldsFromObject(input: TimecodeAttributes) {
    // give all fields initial values so the drop-frame incrementing isn't thrown off
    if (input.hours) this.hours = input.hours;
    if (input.minutes) this.minutes = input.minutes;
    if (input.seconds) this.seconds = input.seconds;
    if (input.frames) this.frames = input.frames;

    if (input.hours) this.setHours(input.hours);
    if (input.minutes) this.setMinutes(input.minutes);
    if (input.seconds) this.setSeconds(input.seconds);
    if (input.frames) this.setFrames(input.frames);

    return this;
  }

  /** Sets the timecode fields from a JavaScript Date object */
  private setFieldsFromDate(date: Date) {
    return this.setFieldsFromObject({
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      frames: this.getFramesFromMilliseconds(date.getMilliseconds()),
    });
  }

  private getFramesFromMilliseconds(milliseconds: number) {
    let fractionalSeconds = milliseconds;

    while (fractionalSeconds > 1 || fractionalSeconds < -1) {
      fractionalSeconds /= 10;
    }

    return Math.trunc(fractionalSeconds * this.nominalFrameRate());
  }

  private framesPerHour() : number {
    return this.framesPer10Minute() * 6;
  }

  private framesPer10Minute() {
    return (this.framesPerMinute() * 10) + this.framesToDrop();
  }

  private framesPerMinute() {
    return (60 * this.nominalFrameRate()) - this.framesToDrop();
  }

  private milliseconds() {
    return this.frames / this.nominalFrameRate();
  }

  private framesToDrop() {
    // Dropcount for 29.97 is 2, for 59.94 is 4
    return this.isDropFrame() ? this.nominalFrameRate() / 15 : 0;
  }

  private incrementIfDropFrame() {
    // Drop frame skips frame 00 and frame 01 on every even minute but not every tenth minute
    if (this.isDropFrame() && this.frames < 2 && this.seconds === 0 && this.minutes % 10 !== 0) {
      this.frames += 2;
    }
  }

  private separator() {
    return this.isDropFrame() ? ';' : ':';
  }

  private framesInHoursField() {
    return this.hours * this.framesPerHour();
  }

  private framesInMinutesField() {
    return (
      (Math.trunc(this.minutes / 10) * this.framesPer10Minute())
        + ((this.minutes % 10) * this.framesPerMinute())
    );
  }

  private framesInSecondsField() {
    return this.seconds * this.nominalFrameRate();
  }

  /** Returns true if the string can be parsed into a timecode */
  static isValidTimecodeString(str: string) : boolean {
    return TimecodeRegex.test(str);
  }

  /* Compares two timecodes. Signature matches the signature of JavaScript's Array.sort() compare function */
  static compare(a: Timecode, b: Timecode) : number {
    if (a.hours > b.hours) return 1;
    if (a.hours < b.hours) return -1;

    if (a.minutes > b.minutes) return 1;
    if (a.minutes < b.minutes) return -1;

    if (a.seconds > b.seconds) return 1;
    if (a.seconds < b.seconds) return -1;

    if (a.frames > b.frames) return 1;
    if (a.frames < b.frames) return -1;

    return 0;
  }

  /* Returns an exact framerate for non-integer framerates */
  static exactFrameRate(frameRate: number) : number {
    if (frameRate > 59 && frameRate < 60) {
      return 60000 / 1001; // 59.94
    }

    if (frameRate > 29 && frameRate < 30) {
      return 30000 / 1001; // 29.97
    }

    if (frameRate > 23 && frameRate < 24) {
      return 24000 / 1001; // 23.98
    }

    return frameRate;
  }

  /** Overrides the valueOf() method inherited from Object that gets an object's primitive value */
  valueOf() : number {
    return this.frameCount();
  }

  /** This timecode as a string in the format 'HH:MM:SS:FF' */
  toString() : string {
    const c = this.separator();
    const h = this.hours.toString(10).padStart(2, '0');
    const m = this.minutes.toString(10).padStart(2, '0');
    const s = this.seconds.toString(10).padStart(2, '0');
    const f = this.frames.toString(10).padStart(2, '0');

    return `${h}:${m}:${s}${c}${f}`;
  }

  /** This timecode as a string in the format 'HH:MM:SS,mmm', with mmm being fractional seconds */
  toSRTString() : string {
    const h = this.hours.toString(10).padStart(2, '0');
    const m = this.minutes.toString(10).padStart(2, '0');
    const s = this.seconds.toString(10).padStart(2, '0');

    const milliseconds = this.milliseconds().toString(10).substring(2, 5);
    const mm = milliseconds.padEnd(3, '0');

    return `${h}:${m}:${s},${mm}`;
  }

  /** This timecode as a string in the format 'HH:MM:SS:TTT', with TTT being ticks (1 tick = 40 ms) */
  toDCDMString() : string {
    const h = this.hours.toString(10).padStart(2, '0');
    const m = this.minutes.toString(10).padStart(2, '0');
    const s = this.seconds.toString(10).padStart(2, '0');

    const ticks = this.milliseconds() / 4;
    const t = ticks.toString(10).substring(2, 5).padEnd(3, '0');

    return `${h}:${m}:${s}:${t}`;
  }

  /**
   * Returns new plain JavaScript object with field and framerate properties
  */
  toObject() : Required<TimecodeAttributes> {
    return {
      hours: this.hours,
      minutes: this.minutes,
      seconds: this.seconds,
      frames: this.frames,
      frameRate: this.frameRate,
    };
  }

  setHours(hours: number) : this {
    // Hours should not be higher than 23, and should restart counting up from 0 after 23
    this.hours = Math.trunc(hours) % HoursInOneDay;

    // Hours should not be less than 0, and should count down from 24 if negative
    while (this.hours < 0) this.hours += HoursInOneDay;

    this.incrementIfDropFrame();

    return this;
  }

  /**
   * Sets the minutes field.
   * Minutes greater than 60 will roll over and increase the hours field.
   * Minutes less than 0 will borrow from the hours field.
   */
  setMinutes(minutes: number) : this {
    this.minutes = Math.trunc(minutes) % MinutesInOneHour;
    this.setHours(this.hours + Math.trunc(minutes / MinutesInOneHour));

    // minutes should not be negative, and should borrow from the hours instead
    if (this.minutes < 0) {
      this.minutes += MinutesInOneHour;
      this.setHours(this.hours - 1);
    }

    this.incrementIfDropFrame();

    return this;
  }

  /**
   * Sets the seconds field.
   * Seconds greater than 60 will roll over and increase the minutes field.
   * Seconds less than 0 will borrow from the minutes field.
   */
  setSeconds(seconds: number) : this {
    const secondsComponent = Math.trunc(seconds);
    const millisecondsComponent = seconds - secondsComponent;

    this.seconds = Math.trunc(secondsComponent) % SecondsInOneMinute;

    this.setMinutes(this.minutes + Math.trunc(seconds / SecondsInOneMinute));

    if (this.seconds < 0) {
      this.seconds += SecondsInOneMinute;
      this.setMinutes(this.minutes - 1);
    }

    if (millisecondsComponent !== 0) {
      this.setFrames(this.getFramesFromMilliseconds(millisecondsComponent));
    }

    this.incrementIfDropFrame();

    return this;
  }

  // Set frames, withj some validation
  setFrames(frames: number) : this {
    if (frames === undefined) return this;

    const nominalFrameRate = this.nominalFrameRate();
    this.frames = Math.trunc(frames) % nominalFrameRate;

    this.setSeconds(this.seconds + Math.trunc(frames / nominalFrameRate));

    if (this.frames < 0) {
      this.frames += this.nominalFrameRate();
      this.setSeconds(this.seconds - 1);
    }

    this.incrementIfDropFrame();

    return this;
  }

  /**
   * Returns the rounded framerate needed to do Timecode math
  */
  nominalFrameRate() : number {
    /* 23.98 -> 24
     * 25    -> 25
     * 29.97 -> 30
     * 30    -> 30
     */
    return Math.round(this.frameRate);
  }

  /**
   * the total number of frames that this Timecode represents
   */
  frameCount() : number {
    return this.framesInHoursField()
      + this.framesInMinutesField()
      + this.framesInSecondsField()
      + this.frames;
  }

  fractionalSeconds() : number {
    return this.seconds + this.milliseconds();
  }

  /** Returns true if using drop-frame time */
  isDropFrame() {
    // 29.97 or 59.94 per second
    if (this.frameRate > 29 && this.frameRate < 30) return true;
    if (this.frameRate > 59 && this.frameRate < 60) return true;

    return false;
  }

  add(addend: ConvertibleToTimecode) : Timecode {
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

  subtract(subtrahend: ConvertibleToTimecode) : Timecode {
    const tc = new Timecode(this);

    if (!(subtrahend instanceof Timecode)) {
      const newSubtrahend = new Timecode(subtrahend, this.frameRate);
      return tc.subtract(newSubtrahend);
    }

    if (this.frameRate !== subtrahend.frameRate) {
      const newSubtrahend = subtrahend.pulldown(this.frameRate);
      return tc.subtract(newSubtrahend);
    }

    tc.setHours(this.hours - subtrahend.hours);
    tc.setMinutes(this.minutes - subtrahend.minutes);
    tc.setSeconds(this.seconds - subtrahend.seconds);
    tc.setFrames(this.frames - subtrahend.frames);

    return tc;
  }

  pulldown(frameRate: number, start = 0) {
    const oldBase = new Timecode(start, this.frameRate);
    const newBase = new Timecode(start, frameRate);
    const output = new Timecode(0, frameRate);

    let outputFrames = this.subtract(oldBase).frameCount();
    outputFrames *= output.nominalFrameRate();
    outputFrames /= this.nominalFrameRate();
    outputFrames = Math.ceil(outputFrames);

    output.setFieldsFromFrameCount(outputFrames);

    return output.add(newBase);
  }

  pullup(frameRate: number, start = 0) {
    return this.pulldown(frameRate, start);
  }

  isBefore(timecode: Timecode) : boolean {
    return Timecode.compare(this, timecode) === -1;
  }

  isSame(timecode: Timecode) : boolean {
    return Timecode.compare(this, timecode) === 0;
  }

  isAfter(timecode: Timecode) : boolean {
    return Timecode.compare(this, timecode) === 1;
  }

  isBetween(earlyTimecode: Timecode, laterTimecode: Timecode) {
    return this.isAfter(earlyTimecode) && this.isBefore(laterTimecode);
  }
}
