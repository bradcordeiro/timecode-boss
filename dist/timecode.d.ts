export type TimecodeAttributes = {
    hours?: number;
    minutes?: number;
    seconds?: number;
    frames?: number;
    frameRate?: number;
};
interface Timecode extends Required<TimecodeAttributes> {
}
declare class Timecode {
    constructor(timecode: number | string | TimecodeAttributes | Date, frameRate?: number);
    static isValidTimecodeString(str: string): boolean;
    private setFieldsFromFrameCount;
    private setFieldsFromString;
    private setFieldsFromObject;
    private setFieldsFromDate;
    private getFramesFromMilliseconds;
    valueOf(): number;
    toString(): string;
    toSRTString(realTime?: boolean): string;
    toObject(): Required<TimecodeAttributes>;
    setHours(hours: number): this;
    setMinutes(minutes: number): this;
    setSeconds(seconds: number): this;
    setFrames(frames: number): this;
    nominalFrameRate(): number;
    static exactFrameRate(frameRate: number): number;
    frameCount(): number;
    fractionalSeconds(): number;
    private framesPerHour;
    private framesPer10Minute;
    private framesPerMinute;
    private milliseconds;
    private framesToDrop;
    isDropFrame(): boolean;
    private incrementIfDropFrame;
    private separator;
    private framesInHoursField;
    private framesInMinutesField;
    private framesInSecondsField;
    add(addend: number | string | TimecodeAttributes | Date): Timecode;
    subtract(subtrahend: number | string | TimecodeAttributes | Date): Timecode;
    pulldown(frameRate: number, start?: number): Timecode;
    pullup(frameRate: number, start?: number): Timecode;
}
export default Timecode;