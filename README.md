# smpte-timecode

This is a ES6 module for manipulating SMPTE timecodes.

The math is based upon the BBC's [Ingex](http://ingex.sourceforge.net), which was written in C++.

In theory it supports any frame rate, but all tests are written to check for correctness using frame rates of 60, 59.94, 50, 30, 29.97, 25, 24, and 23.98.

Timecodes can be created from: 

* an integer representing a frame count (floats will be truncated)
* a string in the format "hh:mm:ss:ff"
* a Date object
* a Javascript Object with one or more of the the properties "hours", "minutes", "seconds", or "frames"

### Drop-Frame Timecode
* Any framerate greater than 29 and less than 30 (eg. 29.97) will be assumed to be in 29.97 drop-frame. To use 29.97 non-drop-frame timecodes, use a frame rate of 30.
* Any frame rate between 59 and 60 (eg. 59.94) will be assumed to be drop-frame. To use 59.54 non-drop-frame timecodes, use a frame rate of 60.
* All other frame rates will be assumed to be non-drop-frame.

## Usage

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
