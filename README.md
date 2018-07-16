# smpte-timecode

This is a ES6 module for manipulating SMPTE timecodes.

The math is based upon the BBC's [Ingex](http://ingex.sourceforge.net), which was written in C++.

In theory it supports any frame rate, but all tests are written to check for correctness using frame rates of 60, 59.94, 50, 30, 29.97, 25, 24, and 23.98.

Timecodes can be created from: 

* an integer representing a frame count (floats will be truncated)
* a string in the format "hh:mm:ss:ff"
* a Javascript Object with one or more of the the properties "hours", "minutes", "seconds", or "frames"
* a Date Object (only hours, minutes, seconds, and milliseconds will be used)
* Another Timecode Object

### Drop-Frame Timecode
* Any framerate greater than 29 and less than 30 (eg. 29.97) will be assumed to be in 29.97 drop-frame. To use 29.97 non-drop-frame timecodes, use a frame rate of 30.
* Any frame rate between 59 and 60 (eg. 59.94) will be assumed to be drop-frame. To use 59.54 non-drop-frame timecodes, use a frame rate of 60.
* All other frame rates will be assumed to be non-drop-frame.

## API Documentation

Property | Type | Description
---------|------|------------
frameCount | Number | A number representing the total number of frames in the Timecode represents. Timecode methods will coerce this into an integer, but will not check for integer-ness if this propery is manually changed, which is not advised.
frameRate | Number | A floating-point number representing the playback speed of the Timecode. Though any frame rate should work here, only common broadcast frame rates are tested (see Tests for a list);

Method | Arguments | Returns 
--------|------------|---------
new Timecode() | (timecode, frameRate) | Timecode
Constructs a Timecode object. Accepts a Number representing the frame count, another Timecode instance, a Date instance, a string in the format "00:00:00:00", or a JavaScript Object with one or more of the properties *hours*, *minutes*,  *seconds*, or *frames*. frameRate defaults to *29.97* if not passed, and timecode defaults to *0* if not passed. ||

Method | Arguments | Returns 
--------|------------|---------
getHours() | *none* | Number
getMinutes() | *none* | Number
getSeconds() | *none* | Number
getFrames() | *none* | Number
getFrameCount() | none | Number
Returns an integer representing the relevant field. getFrameCount||

Method | Arguments | Returns 
--------|------------|---------
setHours() | hours : Number | Timecode
setMinutes() | minutes : Number | Timecode
setSeconds() | seconds : Number | Timecode
setFrames() | frames: Number | Timecode
Sets the relevant field. The Timecode object affected is returned, allowing these methods to be chained.||






### Construction

	const Timecode = require("timecode");

    const tc = new Timecode("01:00:00:00", 29.97);
	tc.add(4);
	tc.add("00:02:03:00");
	tc.toString(); // '01:02:03:04'

    > const d = new Date();
    > const tc2 = new Timecode(d, 29.97);
    > tc2.add( new Date(0,0,0,0,1,30) );
    > tc2.toString();
    '17:31:57;22'

## Testing

Tests are written using Node.js's built-in assert library, and run using mocha.

Test values were written using [Avid Media Composer](http://www.avid.com/media-composer)'s built-in timecode calculator to verify correct values.

    $ npm install
    $ npm test
