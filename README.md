# timecode-boss

This is a ES6 module fthat provies a class **Timecode** with properties and methods to work with SMPTE timecode.

Many thanks to the BBC's [Ingex](http://ingex.sourceforge.net), which was written in C++ and was influental on how the math in this module should work.

In theory it supports any frame rate, but tests are only written to check for correctness using frame rates of 60, 59.94, 50, 30, 29.97, 25, 24, and 23.98.

### Drop-Frame Timecode
* Any framerate greater than 29 and less than 30 (eg. 29.97) will be assumed to be in 29.97 drop-frame. To use 29.97 non-drop-frame timecodes, use a frame rate of 30.
* Any frame rate between 59 and 60 (eg. 59.94) will be assumed to be drop-frame. To use 59.54 non-drop-frame timecodes, use a frame rate of 60.
* All other frame rates will be assumed to be non-drop-frame.

## Usage

### Properties

Property | Type | Description
---------|------|------------
frameCount | Number | A number representing the total number of frames in the Timecode represents. Timecode methods will coerce this into an integer, but will not check for integer-ness if this property is manually changed, which is not advised.
frameRate | Number | A floating-point number representing the playback speed of the Timecode. Though any frame rate should work here, only common broadcast frame rates are tested (see Tests for a list).

Method | Arguments | Returns 
--------|------------|---------
new Timecode() | (timecode, frameRate) | Timecode
Constructs a Timecode object. Accepts a Number representing the frame count, another Timecode instance, a Date instance, a string in the format "00:00:00:00", or a JavaScript Object with one or more of the properties *hours*, *minutes*,  *seconds*, or *frames*. frameRate defaults to *29.97* if not passed, and timecode defaults to *0* if not passed. ||

Method | Argument Type | Returns 
--------|------------|---------
getHours() | *n/a* | Number
getMinutes() | *n/a* | Number
getSeconds() | *n/a* | Number
getFrames() | *n/a* | Number
Returns an integer representing the relevant field||

Method | Argument Type | Returns 
--------|------------|---------
setHours(*hours*) | Number | Timecode
setMinutes(*minutes*) | Number | Timecode
setSeconds(*seconds*) | Number | Timecode
setFrames(*frames*) | Number | Timecode
Sets the relevant field. The Timecode object is returned, allowing these methods to be chained. Calling these methods with no argument, or with a type that cannont be coerced to an integer, will throw a TypeError. ||

Method | Argument Type | Returns 
--------|------------|---------
isDropFrame() | *n/a* | Boolean
Returns *true* if the Timecode object is being calculated in drop-frame mode (29.97 or 59.94 frame rates). ||

### Example Usage

	const Timecode = require("timecode");

    const tc = new Timecode("01:00:00:00", 29.97);
	tc.add(4);
	tc.add("00:02:03:00");
	tc.toString(); // '01;02;03;04'

## Testing

Tests are written using Node.js's built-in assert library, and run using mocha.

Test values were written using [Avid Media Composer](http://www.avid.com/media-composer)'s built-in timecode calculator to verify correct values.

    $ npm install
    $ npm test

Test coverage is checked using [Istanbul](https://istanbul.js.org). Version 1.0.0 has 100% coverage.

    $ npm install
    $ npm run test-coverage

This will generate an HTML test coverage report in ./coverage/.

###Contributing

I'm trying to keep the API basic, but ease-of-use feature requests and bug reports are welcome. If you'd like to submit a pull request, please include tests for your changes.

This module was written using the [Airbnb Javascript Style Guide](https://github.com/airbnb/javascript) . [eslint](https://eslint.org) and the airbnb plugin are include in the development dependencies, and an .eslintrc.json file has been included in source control.