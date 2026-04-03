const TimeStampRegex = /(\d{1,2}):(\d{1,2}):(\d{1,2})[.,]?(\d{1,3})?/;
const TimecodeRegex = /(\d{1,2})[:;](\d{1,2})[:;](\d{1,2})[:;](\d{1,2})/;
const SecondsInOneMinute = 60;
const MinutesInOneHour = 60;
const HoursInOneDay = 24;
const formatFieldString = (x, length = 2) => x.toString(10).padStart(length, '0');
export default class Timecode {
    hours;
    minutes;
    seconds;
    frames;
    frameRate;
    pullup;
    speedup;
    constructor(timecode = 0, frameRate = 29.97) {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.frames = 0;
        this.frameRate = frameRate;
        if (timecode instanceof Date) {
            this.setFieldsFromDate(timecode);
        }
        else if (typeof timecode === 'number') {
            this.setFieldsFromFrameCount(timecode);
        }
        else if (typeof timecode === 'string') {
            this.setFieldsFromString(timecode);
        }
        else if (typeof timecode === 'object') {
            this.setFieldsFromObject(timecode);
            if (timecode.frameRate) {
                this.frameRate = timecode.frameRate;
            }
        }
        this.pullup = this.pulldown;
        this.speedup = this.slowdown;
    }
    static convertToTimecode(input, frameRate) {
        if (input instanceof Timecode)
            return input;
        return new Timecode(input, frameRate);
    }
    setFieldsFromFrameCount(frames) {
        let remainingFrames = frames;
        this.setHours(Math.trunc(frames / this.framesPerHour()));
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
        let matches = TimecodeRegex.exec(input);
        if (matches?.length === 5) {
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
    setFieldsFromObject(input) {
        if (input.hours)
            this.hours = input.hours;
        if (input.minutes)
            this.minutes = input.minutes;
        if (input.seconds)
            this.seconds = input.seconds;
        if (input.frames)
            this.frames = input.frames;
        if (input.hours)
            this.setHours(input.hours);
        if (input.minutes)
            this.setMinutes(input.minutes);
        if (input.seconds)
            this.setSeconds(input.seconds);
        if (input.frames)
            this.setFrames(input.frames);
        return this;
    }
    setFieldsFromDate(date) {
        return this.setFieldsFromObject({
            hours: date.getHours(),
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            frames: this.getFramesFromMilliseconds(date.getMilliseconds()),
        });
    }
    getFramesFromMilliseconds(milliseconds) {
        let fractionalSeconds = milliseconds;
        while (fractionalSeconds > 1 || fractionalSeconds < -1) {
            fractionalSeconds /= 10;
        }
        return Math.trunc(fractionalSeconds * this.nominalFrameRate());
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
    ticks() {
        return this.milliseconds() / 4;
    }
    framesToDrop() {
        return this.isDropFrame() ? this.nominalFrameRate() / 15 : 0;
    }
    incrementIfDropFrame() {
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
        return ((Math.trunc(this.minutes / 10) * this.framesPer10Minute())
            + ((this.minutes % 10) * this.framesPerMinute()));
    }
    framesInSecondsField() {
        return this.seconds * this.nominalFrameRate();
    }
    static isValidTimecodeString(str) {
        return TimecodeRegex.test(str);
    }
    static compare(a, b) {
        const x = Timecode.convertToTimecode(a);
        const y = Timecode.convertToTimecode(b);
        if (x.hours > y.hours)
            return 1;
        if (x.hours < y.hours)
            return -1;
        if (x.minutes > y.minutes)
            return 1;
        if (x.minutes < y.minutes)
            return -1;
        if (x.seconds > y.seconds)
            return 1;
        if (x.seconds < y.seconds)
            return -1;
        if (x.frames > y.frames)
            return 1;
        if (x.frames < y.frames)
            return -1;
        return 0;
    }
    static exactFrameRate(frameRate) {
        if (frameRate > 59 && frameRate < 60) {
            return 60000 / 1001;
        }
        if (frameRate > 29 && frameRate < 30) {
            return 30000 / 1001;
        }
        if (frameRate > 23 && frameRate < 24) {
            return 24000 / 1001;
        }
        return frameRate;
    }
    nominalFrameRate() {
        return Math.round(this.frameRate);
    }
    valueOf() {
        return this.frameCount();
    }
    toString() {
        const c = this.separator();
        const h = formatFieldString(this.hours);
        const m = formatFieldString(this.minutes);
        const s = formatFieldString(this.seconds);
        const f = formatFieldString(this.frames);
        return `${h}:${m}:${s}${c}${f}`;
    }
    toSRTString() {
        const h = formatFieldString(this.hours);
        const m = formatFieldString(this.minutes);
        const s = formatFieldString(this.seconds);
        const milliseconds = this.milliseconds().toString(10).substring(2, 5);
        const mm = milliseconds.padEnd(3, '0');
        return `${h}:${m}:${s},${mm}`;
    }
    toDCDMString() {
        const h = formatFieldString(this.hours);
        const m = formatFieldString(this.minutes);
        const s = formatFieldString(this.seconds);
        const t = this.ticks().toString(10).substring(2, 5).padEnd(3, '0');
        return `${h}:${m}:${s}:${t}`;
    }
    toObject() {
        return {
            hours: this.hours,
            minutes: this.minutes,
            seconds: this.seconds,
            frames: this.frames,
            frameRate: this.frameRate,
        };
    }
    setHours(hours) {
        this.hours = Math.trunc(hours) % HoursInOneDay;
        while (this.hours < 0)
            this.hours += HoursInOneDay;
        this.incrementIfDropFrame();
        return this;
    }
    setMinutes(minutes) {
        this.minutes = Math.trunc(minutes) % MinutesInOneHour;
        this.setHours(this.hours + Math.trunc(minutes / MinutesInOneHour));
        if (this.minutes < 0) {
            this.minutes += MinutesInOneHour;
            this.setHours(this.hours - 1);
        }
        this.incrementIfDropFrame();
        return this;
    }
    setSeconds(seconds) {
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
    setFrames(frames) {
        if (frames === undefined)
            return this;
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
    frameCount() {
        return this.framesInHoursField()
            + this.framesInMinutesField()
            + this.framesInSecondsField()
            + this.frames;
    }
    fractionalSeconds() {
        return this.seconds + this.milliseconds();
    }
    isDropFrame() {
        if (this.frameRate > 29 && this.frameRate < 30)
            return true;
        if (this.frameRate > 59 && this.frameRate < 60)
            return true;
        return false;
    }
    add(addend) {
        const tc = new Timecode(this);
        const convertedAddend = Timecode.convertToTimecode(addend);
        tc.setHours(this.hours + convertedAddend.hours);
        tc.setMinutes(this.minutes + convertedAddend.minutes);
        tc.setSeconds(this.seconds + convertedAddend.seconds);
        tc.setFrames(this.frames + convertedAddend.frames);
        return tc;
    }
    subtract(subtrahend) {
        const tc = new Timecode(this);
        const x = Timecode.convertToTimecode(subtrahend);
        tc.setHours(this.hours - x.hours);
        tc.setMinutes(this.minutes - x.minutes);
        tc.setSeconds(this.seconds - x.seconds);
        tc.setFrames(this.frames - x.frames);
        return tc;
    }
    pulldown(frameRate, offset = new Timecode(0)) {
        const start = Timecode.convertToTimecode(offset);
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
    slowdown(newFrameRate, offset = new Timecode(0, this.frameRate)) {
        const start = new Timecode(offset, newFrameRate);
        const difference = this.subtract(start);
        difference.frameRate = newFrameRate;
        return start.add(difference);
    }
    isBefore(timecode) {
        return Timecode.compare(this, timecode) === -1;
    }
    isSame(timecode) {
        return Timecode.compare(this, timecode) === 0;
    }
    isAfter(timecode) {
        return Timecode.compare(this, timecode) === 1;
    }
    isBetween(earlier, later) {
        return this.isAfter(earlier) && this.isBefore(later);
    }
}
//# sourceMappingURL=timecode.js.map