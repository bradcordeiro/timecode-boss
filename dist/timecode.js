(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["timecode-boss"] = factory());
})(this, (function () { 'use strict';

    const TimeStampRegex = /(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?/;
    const TimecodeRegex = /(\d{1,2})[:;](\d{1,2})[:;](\d{1,2})[:;](\d{1,2})/;
    const SecondsInOneMinute = 60;
    const MinutesInOneHour = 60;
    const HoursInOneDay = 24;
    class Timecode {
        constructor(timecode, frameRate = 29.97) {
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
            if (a.hours > b.hours)
                return 1;
            if (a.hours < b.hours)
                return -1;
            if (a.minutes > b.minutes)
                return 1;
            if (a.minutes < b.minutes)
                return -1;
            if (a.seconds > b.seconds)
                return 1;
            if (a.seconds < b.seconds)
                return -1;
            if (a.frames > b.frames)
                return 1;
            if (a.frames < b.frames)
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
        valueOf() {
            return this.frameCount();
        }
        toString() {
            const c = this.separator();
            const h = (this.hours < 10 ? '0' : '') + this.hours.toString(10);
            const m = (this.minutes < 10 ? '0' : '') + this.minutes.toString(10);
            const s = (this.seconds < 10 ? '0' : '') + this.seconds.toString(10);
            const f = (this.frames < 10 ? '0' : '') + this.frames.toString(10);
            return `${h}:${m}:${s}${c}${f}`;
        }
        toSRTString(realTime = false) {
            let tc = new Timecode(this);
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
        nominalFrameRate() {
            return Math.round(this.frameRate);
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
        pulldown(frameRate, start = 0) {
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
        pullup(frameRate, start = 0) {
            return this.pulldown(frameRate, start);
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
        isBetween(earlyTimecode, laterTimecode) {
            return this.isAfter(earlyTimecode) && this.isBefore(laterTimecode);
        }
    }

    return Timecode;

}));
