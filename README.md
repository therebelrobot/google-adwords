# google-adwords

[![NPM](https://nodei.co/npm/google-adwords.png?downloads=true)](https://nodei.co/npm/google-adwords/)
[![NPM](https://nodei.co/npm-dl/google-adwords.png?months=3&height=2)](https://nodei.co/npm/google-adwords/)

[![Dependency Status](https://david-dm.org/Growmies/google-adwords.svg)](https://david-dm.org/Growmies/google-adwords)
[![Code Climate](https://codeclimate.com/github/Growmies/google-adwords/badges/gpa.svg)](https://codeclimate.com/github/Growmies/google-adwords)
[![Test Coverage](https://codeclimate.com/github/Growmies/google-adwords/badges/coverage.svg)](https://codeclimate.com/github/Growmies/google-adwords)

A Node.js driver for Google Adwords Reporting API (v201409)

## Contents
- [Install](#install)
- [API](#api)
  - [`.use()`](#useoptions)
  - [`.awql()`](#awql)
    - [chaining](#chaining)
    - [options](#options)
    - [string](#string)
  - [Returns](#returns)
  - [error handling](#error-handling)
    - [.`catch()`](#catch)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License (ISC)](#license-isc)

## Install

To install google-adwords, run

```bash
npm install google-adwords
```

then include in your file the following:

```javascript
var ga = require('google-adwords');
```

## API

### `.use(options)`

This function is used to set client access information, specifically the `clientID`, the `clientSecret` and the `developerToken` fields. This is also used prior to each call to set the `clientCustomerID` and the `refreshToken`.

Any call to Google Adwords automatically refreshes the accessToken for the call. This may be overridden by including both the `accessToken` and the `tokenExpires` in the user setting along with the `clientCustomerID` and the `refreshToken`.

```javascript
  ga.use({
    clientID: 'clientIDString',
    clientSecret: 'clientSecretString',
    developerToken: 'developerTokenString'
  });
  // Sets Client options for usage in your app.
```

```javascript
  ga.use({
    refreshToken: 'refreshTokenString',
    clientCustomerID: 'clientCustomerIDString'
  });
  // Sets user options if you wish to refresh the token on every call.
```

```javascript
  ga.use({
    accessToken: 'accessTokenString',
    tokenExpires: 1424716834341, // Integer: Unix Timestamp of expiration time
    refreshToken: 'refreshTokenString',
    clientCustomerID: 'clientCustomerIDString'
  });
  // Sets user options if you do not wish to refresh every call. Will refresh if expiration is hit.
```

### `.awql()`

Once the appropriate access information has been set with `.use()`, you may use `.awql()` to make calls to your reports. You may do this in a number of ways: chaining, options object, or AWQL string. All options return a Bluebird promise, with `.then()` and `.catch` for successful and failing use cases, respectively.

#### chaining

To use `.awql()` chaining, simply chain additional keywords onto your query like this:

```javascript
ga.awql()
  .select('Date,Clicks')
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .during('20120101,20150125')
  .send().then(function(results) {
    // your code here
  })
```

Alternatively, you can pass arrays into `.select()` and `.during()`:

```javascript
ga.awql()
  .select(['Date','Clicks'])
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .during(['20120101','20150125'])
  .send().then(function(results) {
    // your code here
  })
```

You may also add a `.where()` and a `.and()` into the chain after `.from()`, allowing for drilling of information:

```javascript
ga.awql()
  .select(['Date', 'Clicks'])
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .where('Clicks>100')
  .during(['20120101', '20150125'])
  .send().then(function(results) {
    // your code here
  })
```
```javascript
ga.awql()
  .select(['Date', 'Clicks'])
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .where('Clicks>100')
  .and('Clicks<200')
  .during(['20120101', '20150125'])
  .send().then(function(results) {
    // your code here
  })
```

You can chain additional `.and() functions after the first:

```javascript
ga.awql()
  .select(['Date', 'Clicks'])
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .where('Clicks>100')
  .and('Clicks<200')
  .and('Clicks!=110')
  .during(['20120101', '20150125'])
  .send().then(function(results) {
    // your code here
  })
```

Alternatively, you can pass an array of `.and()` statements into the first:

```javascript
ga.awql()
  .select(['Date', 'Clicks'])
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .where('Clicks>100')
  .and(['Clicks<200','Clicks!=110'])
  .during(['20120101', '20150125'])
  .send().then(function(results) {
    // your code here
  })
```

#### options

You can also access the reports by passing an object into `.awql()` as such:

```javascript
var options = {
  select: ['Date', 'Clicks'],
  from: 'ACCOUNT_PERFORMANCE_REPORT',
  during: ['20120101', '20150125']
}
ga.awql(options).send().then(function(results) {
  expect(results).to.be.an('object');
  expect(results.report).to.be.a('string');
  expect(results.total).to.be.a('string');
  expect(results.data).to.be.an('array');
  done();
})
```

As with the promises above, you may pass both strings or arrays to `select`, `and`, and `during`.

#### string

Finally, you can pass your own AWQL string into `.awql`. Make sure there are no spaces in your `where` statements, as this string will replace all spaces (besides `, `) with `+` for proper API sending.

```javascript
var awqlStatement = 'SELECT Date, Clicks FROM ACCOUNT_PERFORMANCE_REPORT DURING 20120101, 20150125'
ga.awql(awqlStatement).send().then(function(results) {
  // your code here
});
```

### Returns

All request return information in the following format:

```javascript
{
  report:'Title of the Report',
  timeframe: 'Timeframe of the report',
  total: 'Overall total of the report',
  fieldLength: 7, // Integer: The number of fields (columns) that are being returned
  data:[] // contains objects of individual report rows returned
  auth:{ // This is the updated auth from the request. You may pipe this back in using ga.use()
    accessToken:'accessTokenString',
    tokenExpires: 1424716834341, // Integer: Unix Timestamp of expiration time
  }
}
```

### Error Handling

All `.awql()` calls return two promise chains, `.then()` and `.catch()` as outlined in the [Bluebird documentation](https://github.com/petkaantonov/bluebird). You may use `.catch()` to catch any issues that may have arisen in the call.

#### `.catch()`

```javascript
ga.awql()
  .select(['DateRUBBISH', 'ClicksFAKE']) // selecting invalid fields
  .from('ACCOUNT_PERFORMANCE_REPORT')
  .during(['20120101', '20150125'])
  .send().then(function(results) {
    // this will not run
  })
  .catch(function(error) {
    // error handling code here
  })
```

## Contributing

To contribute code to this module, please follow this workflow: 

1. fork the repo
2. make sure to install dev dependencies using

  ```bash
  npm install --dev
  ```

3. Make the changes you desire
4. Ensure all changes have a new test in the `test/` folder, and run:

  ```bash
  npm test
  ```

  This will check do the following:
  * Check your code against [feross/standard style](https://github.com/feross/standard) and notify of any issues.
  * Run all mocha tests listed in `test/`
  * Run all code through [istanbul's code coverage runner](https://github.com/gotwarlost/istanbul). You can check the coverage afterwards the coverage report page: `coverage/lcov-report/index.html`

5. After making changes in your fork, open a pull request.

Please note that if your code updates do not pass JS Standard style, mocha tests and code coverage, your PR may be rejected and you'll need to fix any issues listed in it.

## Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/) and [Keep A Changelog](http://keepachangelog.com/).

### Unreleased

### v1.1.1 - 2015-03-13
#### Added

- Added `.jshintrc` to make codeclimate happy with JS Standard Style

### v1.1.0 - 2015-03-13
#### Added

- Converted to [feross/standard style](https://github.com/feross/standard)
- Updated tests and scripts in package.json
- Updated contributing docs

### v1.0.0 - 2015-02-23
#### Added

- `.use()`
- `.awql()`
- Tests

## License (ISC)

Copyright (c) 2015, Trent Oswald (therebelrobot)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
