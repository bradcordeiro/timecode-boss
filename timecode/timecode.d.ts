export = Timecode;

interface TimecodeLikeObject {
  hours?: number;
  minutes?: number;
  seconds?: number;
  frames?: number;
  frameRate?: number;
}

declare class Timecode {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
  frameRate: number;

  constructor(timecode: TimecodeLikeObject | number | string, frameRate?: number)

  private setFieldsFromFrameCount(input: number) : Timecode
  private setFieldsFromString(input: string) : Timecode
  private setFieldsFromObject(input: TimecodeLikeObject) : Timecode 
  private setFieldsFromDate(date: Date) : this 
  private separator() : string 
  private framesInHoursField() : number 
  private framesInMinutesField() : number
  private framesInSecondsField() : number
  
  set(input: TimecodeLikeObject | number | string) : this
  toString() : string
  toSRTString() : string
  toObject() : TimecodeLikeObject 
  setHours(hours: number) : this 
  setMinutes(minutes: number) : this 
  setSeconds(seconds: number) : this 
  setFrames(frames : number) : this 
  frameCount() : number
  milliseconds() : number
  fractionalSeconds() : number
  isDropFrame() : boolean 
  add(addend : TimecodeLikeObject | number | string) : Timecode 
  subtract(subtrahend : TimecodeLikeObject | number | string) : Timecode 
  pulldown(frameRate: number, start: TimecodeLikeObject | number | string) : Timecode 
  pullup(frameRate: number, start: TimecodeLikeObject | number | string) : Timecode 
}