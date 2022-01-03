# timecode-boss &middot; [![npm version](https://badge.fury.io/js/timecode-boss.svg)](https://www.npmjs.com/package/timecode-boss) [![Build Status](https://travis-ci.org/bradcordeiro/timecode-boss.svg?branch=master)](https://travis-ci.org/bradcordeiro/timecode-boss) [![Coverage Status](https://coveralls.io/repos/github/bradcordeiro/timecode-boss/badge.svg?branch=switch-to-coveralls)](https://coveralls.io/github/bradcordeiro/timecode-boss?branch=switch-to-coveralls) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/bradcordeiro/timecode-boss/blob/master/LICENSE)

This is a JavaScript module that provides a **Timecode** class with properties and methods to work with SMPTE timecode.

## Installing / Getting started

```shell
npm install --save timecode-boss
```

```javascript
const Timecode = require('timecode-boss');

let tc = new Timecode('01:10:25:13', 29.97);
tc.toString(); // '01:10:25;13'
tc.hours;   // 1
tc.minutes; // 10
tc.seconds; // 25
tc.frames ; // 13

let laterTc = tc.add('00:04:59:28');
laterTc.toString(); // '01:15:25;13'
```

This constructs a Timecode instance named *tc* from a string representation (*'01:10:25:13'*), with a framerate of *29.97*. On creation, each field of the timecode string is stored in the properties *hours*, *minutes*, *seconds*, and *frames*. Calling toString() joins those fields with a separator.

tc.add() returns a new timecode, starting from the original *tc* instance and adding a timecode of *'00:04:59:28'*. The result is assigned to *laterTC* and the original *tc* object is not mutated.

## Developing

### Prerequisites
Tests are run using [Mocha](https://mochajs.org), and code coverage is tested with Istanbul's command-line interface, [nyc](https://github.com/istanbuljs/nyc).

Babel is used to transpile to ES5 and uglify-js is used to minify the source for use in the browser.

### Setting up Dev

```shell
git clone https://github.com/bradcordeiro/timecode-boss
cd timecode-boss
```

## Versioning

This package uses [SemVer](http://semver.org/) for versioning. Version 1.0.0 was kind of written in a vacuum, once I started using it to build an actual web application, I realized how many useless or poorly-thought out methods it had, and renamed, added, and deleted many from the public interface, leading to a rapid increase to versions 2, 3, and 4.

## Tests

Test files live alongside implementation files.

Tests are mostly written to ensure accurate arithmetic given different framerates. Expected values were written using [Avid Media Composer](http://www.avid.com/media-composer)'s built-in timecode calculator to verify correct values.

Tests are run with [Mocha](https://mochajs.org):

```shell
npm install -g mocha
npm test
```

To check test coverage:

```shell
npm install -g nyc
npm run test-coverage
```

If you encounter incorrect math being performed and would like to submit a pull request to add a test for it without including a patch to fix the problem, that would be very welcome and I'll do my best to work out the bug. Or just a bug report is great.

I try to maintain 100% test coverage, but don't require all pull requests to maintain that number. I'm happy to write some tests, but please try to include tests for major funcionality you change or add.

## Style guide

This module was written according to the [Airbnb Javascript Style Guide](https://github.com/airbnb/javascript) . [eslint](https://eslint.org) was used to stay consistent. An *.eslintrc.json* file is included in source control. The Airbnb guide wasn't chosen for any grand reason, I just like it.

## Timecode Class API Reference

#### Properties

Property | Type | Description
---------|------|------------
hours     | Number | A number representing the hours field
minutes   | Number | A number representing the minutes field
seconds   | Number | A number representing the seconds field
frames    | Number | A number representing the frames field
frameRate | Number | A Number representing the playback speed of the Timecode. Though any frame rate should work here, only common broadcast frame rates are tested (23.98, 24, 25, 29.97, 30, 50, 59.94, and 60).

#### Constructor

| Method | Arguments
|--------|----------
| new Timecode() | (timecode, frameRate)

Constructs a Timecode object. All fields default to 0 if the constructor is called with no arguments, and `frameRate` defaults to *29.97* if that argument is not passed.

The first parameter of the Constructor accepts:

* Another Timecode instance
* A string in the format "00:00:00:00"
* A JavaScript Object with one or more of the properties *hours*, *minutes*,  *seconds*, or *frames*.
* A Number representing the frame count
* A Date instance

The second parameter is a frame rate.

#### Setters

| Method | Argument Type | Return Type
|--------|-------------- | -----------
| set(*input*)          | timecode | Timecode (*this*)
| setHours(*hours*)     | Number | Timecode (*this*)
| setMinutes(*minutes*) | Number | Timecode (*this*)
| setSeconds(*seconds*) | Number | Timecode (*this*)
| setFrames(*frames*)   | Number | Timecode (*this*)

set(*input*) sets the timecode objects fields according to its argument, and accepts any of the types the constructor accepts.

There are also setters for each individual field. The Timecode object is returned, allowing these methods to be chained. Calling these methods with a type that cannot be coerced to an integer will throw a TypeError.

If an argument overflows a field, the next larger field will be incremented accordingly. For example, calling *setMinutes(72)* will set the minutes to 12, and increment the hours field by 1. Setting the hours above 24 will overflow the hours and they will be recalculated starting from 0.

#### Arithmetic

| Method | Argument Type | Return Type
|--------|-------------- | -----------
| add(*addend*) | Timecode, String, Number, Object, or Date | Timecode
| subtract(*subtrahend*) | Timecode, String, Number, Object, or Date | Timecode

Adds the addend to or subtracts the subtrahend from the calling Timecode, and returns a new Timecode. Any of the types available to use in the Timecode constructor above are available to use as arguments to these methods. If an addend or subtrahend has a different framerate than the calling object, the addend will be converted to the calling object's frame rate (see **Frame Rate Conversion** below).

#### Frame Rate Conversion
| Method | Argument Type | Return Type
|--------|-------------- | -----------
| pulldown(*frameRate*, *\[start\]*) | Number, Any | Timecode
| pullup(*frameRate*, *\[start\]*) | Number, Any | Timecode 

Return a new Timecode object based on the calling object converted to the frame rate passed as an argument, where the conversion would result in frames being added for the new framerate. This is useful for, for example, a converting a 23.98 timecode to a 29.97 drop-frame timecode using a [3:2 pulldown](https://en.wikipedia.org/wiki/Three-two_pull_down). The first argument is the framerate to convert to, and the second argument is an optional start time of the sequence being pulled down, which affects the output. The second argument can be any type accepted by the Timecode object constructor.

pullup() is an alias of pulldown().

#### Other Helpers
| Method | Argument Type | Return Type | Description
|--------|-------- |-------- | -----------
| milliseconds() |  | Number | Returns floating-point milliseconds representing the frames field only.
| fractionalSeconds() |  | Number | Returns floating-point seconds, with frames converted to milliseconds and added to seconds. Useful for interacting programs that use fractions of a second rather than frames (e.g. ffmpeg).
| isDropFrame() |   | Boolean | Returns *true* if the Timecode object is being calculated in drop-frame mode (29.97 or 59.94).
| toString()    |   | String  | Returns a string in the format 'hh:mm:ss:ff'. Colons are used as a field separator, though the final separator will be a semi-colon for drop-frame.
| toSRTString(realTime) | Boolean | String  | Returns a string in the format 'hh:mm:ss,iii...' where 'iii...' are milliseconds rather than frames, the format used for SRT subtitles. SRT subtitles use real time, not timecode, and timecodes in some framerates do not match real time. If the optional argument is **true** the result will be in real time.
| toObject()    |    | Object  | Returns an plain JavaScript object with the Timecode's *hours*, *minutes*, *seconds*, *frames*, and *frameRate* properties, but no class methods attached.

## Licensing

Released under the [MIT License](https://en.wikipedia.org/wiki/MIT_License).
