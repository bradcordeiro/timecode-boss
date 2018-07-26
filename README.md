# timecode-boss &middot; [![npm version](https://badge.fury.io/js/timecode-boss.svg)](https://badge.fury.io/js/timecode-boss) [![Build Status](https://travis-ci.org/bradcordeiro/timecode-boss.svg?branch=master)](https://travis-ci.org/bradcordeiro/timecode-boss) [![Coverage Status](https://coveralls.io/repos/github/bradcordeiro/timecode-boss/badge.svg?branch=switch-to-coveralls)](https://coveralls.io/github/bradcordeiro/timecode-boss?branch=switch-to-coveralls) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/bradcordeiro/timecode-boss/blob/master/LICENSE)

This is a JavaScript (ES6) module that provies a class **Timecode** with properties and methods to work with SMPTE timecode.

## Installing / Getting started

```shell
npm install --save timecode-boss
```

```javascript
const Timecode = require('timecode-boss');

let tc = new Timecode('01:10:25:13', 29.97); // Timecode { frameRate: 29.97, frameCount: 126637 }
tc.toString(); // '01;10;25;13'
tc.minutes(); // 10

let laterTc = tc.add('00:04:59:28'); // { frameRate: 29.97, frameCount: 135629 }
laterTc.toString(); // '01;15;25;13'
```

This constructs a Timecode instance named *tc* from a string representation (*'01:10:25:13'*), with a framerate of *29.97*. On creation, each field of the timecode string is converted to a frame count and added to a total frame count. Calling toString() calculates each field and returns a new timecode string.

tc.add() returns a new timecode, starting from the original *tc* instance and adding a timecode of *'00:04:59:28'*. The value of the second Timecode instance is correct, when using drop-frame timecode.

## Developing

### Prerequisites
This module has no dependences. It was written using Eslint to conform to the Airbnb JavaScript Style Guide. Tests are run using Mocha, and code coverage is tested with Istanbul's command-line interface, nyc.

### Setting up Dev

```shell
git clone https://github.com/bradcordeiro/timecode-boss
cd timecode-boss
```

If you don't have mocha installed globally, you can install it locally:

```shell
npm install mocha
npm test
```

If you don't have nyc installed locally and want to check code coverage, you can install it locally as well:

```shell
npm install nyc
npm run test-coverage
```

## Versioning

This package uses [SemVer](http://semver.org/) for versioning. Version 1.0.0 was kind of written in a vacuum, once I started using it to build an actual web application, I realized how many useless or poorly-thought out methods it had, and renamed, added, and deleted many from the public interface, leading to a rapid increase to version 2.0.0.

## Tests

Test files live alongside implementation files.

Tests are mostly written to ensure accurate arithmetic given different framerates. Expected values were written using [Avid Media Composer](http://www.avid.com/media-composer)'s built-in timecode calculator to verify correct values.

Tests are run with mocha, which is not included in the devDependencies, but can be used by installing locally

```shell
npm install mocha
npm test
```

If you encounter incorrect math being performed and would like to submit a pull request to add a test for it without including a patch for the module itself, that would be very welcome and I'll do my best to work out the bug. Or just a bug report is great.

I try to maintain 100% test coverage, but don't require all pull requests to maintain that number. I'm happy to write some tests, but please try to include tests for major funcionality you change or add.

## Style guide

This module was written according to the [Airbnb Javascript Style Guide](https://github.com/airbnb/javascript) . [eslint](https://eslint.org) was used to stay consistent. An *.eslintrc.json* file is included in source control.

## Timecode Class API Reference

#### Properties

Property | Type | Description
---------|------|------------
frameCount | Number | A number representing the total number of frames in the Timecode represents. Timecode class setters will coerce this into an integer, but will not check for integer-ness if this property is manually changed.
frameRate | Number | A floating-point number representing the playback speed of the Timecode. Though any frame rate should work here, only common broadcast frame rates are tested (see [Testing](#testing) for a list).

#### Constructor

| Method | Arguments
|--------|----------
| new Timecode() | (timecode, frameRate)

Constructs a Timecode object. `frameRate` defaults to *29.97* if not passed, and `timecode` defaults to *0* if not passed. 

The Constructor accepts:

* A Number representing the frame count
* Another Timecode instance
* A Date instance
* A string in the format "00:00:00:00"
* A JavaScript Object with one or more of the properties *hours*, *minutes*,  *seconds*, or *frames*.

#### Getters

| Method | Returns 
|--------|--------
| getHours() | Number
| getMinutes() | Number
| getSeconds() | Number
| getFrames() | Number

Return an integer representing the relevant field.

#### Setters

| Method | Argument Type | Return Type
|--------|-------------- | -----------
| setHours(*hours*) | Number | Timecode
| setMinutes(*minutes*) | Number | Timecode
| setSeconds(*seconds*) | Number | Timecode
| setFrames(*frames*) | Number | Timecode

Sets the relevant field. The Timecode object is returned, allowing these methods to be chained. Calling these methods with no argument, or with a type that cannont be coerced to an integer, will throw a TypeError.

#### Arithmetic

| Method | Argument Type | Return Type
|--------|-------------- | -----------
| add(*addend*) | Timecode, String, Number, Object, or Date | Timecode
| subtract(*subtrahend*) | Timecode, String, Number, Object, or Date | Timecode

Adds the addend to or subtracts the subtrahend from the calling Timecode, and returns a new Timecode. Any of the types available to use in the Timecode constructor above are available to use as arguments to these methods.

#### Other Helpers
| Method | Returns | Description
|--------|-------- | -----------
| isDropFrame() | Boolean | Returns *true* if the Timecode object is being calculated in drop-frame mode (29.97 or 59.94 frame rates).
| toString() | String | Returns a formatted string in the format 'hh:mm:ss:ff'. Colons are used as a field separator for non-drop-frame timecodes, semi-colons for drop-frame
| toObject() | Object | Returns an object with the Timecode's *frameCount* and *frameRate* properties.
| getFields(boolean) | Object | Returns an object with the properties *hours*, *minutes*,  *seconds*, and *frames*. If the boolean argument is *true*, the property values are strings, padded to a width of 2.

## Licensing

Released under the [MIT License](https://en.wikipedia.org/wiki/MIT_License).
