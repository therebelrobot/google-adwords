// Copyright (c) 2015, Trent Oswald <trentoswald@therebelrobot.com
//
// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED 'AS IS' AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT,
// OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
// DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
// ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var BBPromise = require('bluebird')
var request = require('unirest')
var auth = require('adwords-auth')
var _ = require('lodash')
var moment = require('moment')

/**
 * Google Adwords Report API driver for NodeJS
 * Proceeds the call to the API and give
 * back the response in JSON format
 *
 * @param spec { agent, host, port }
 */
var GoogleAdwords = function (spec, my) {
  my = my || {}
  spec = spec || {}

  var self = this

  my.limit = null
  my.remaining = null
  my.awqlOptions = {}
  my.auth = {}
  my.agent = spec.agent
  my.host = spec.host || 'https://adwords.google.com/api/adwords/reportdownload/v201409'
  my.port = spec.port || 443

  /*******************************/
  /*       Private helpers       */
  /*******************************/

  var _selectStatement = function (rows) {
    if (_.isArray(rows)) {
      rows = rows.join(',')
    }
    my.awqlOptions.select = rows
    return {
      from: _fromStatement
    }
  }
  var _fromStatement = function (report) {
    my.awqlOptions.from = report
    return {
      where: _whereStatement,
      during: _duringStatement,
      send: _refreshAuth
    }
  }
  var _whereStatement = function (statement) {
    my.awqlOptions.where = statement
    return {
      and: _andStatement,
      during: _duringStatement
    }
  }
  var _andStatement = function (statement) {
    if (!my.awqlOptions.and) {
      my.awqlOptions.and = []
    }
    if (_.isArray(statement)) {
      my.awqlOptions.and = _.union(my.awqlOptions.and, statement)
    } else {
      my.awqlOptions.and.push(statement)
    }
    return {
      and: _andStatement,
      during: _duringStatement
    }
  }
  var _duringStatement = function (timeframe) {
    if (_.isArray(timeframe)) {
      timeframe = timeframe.join(',')
    }
    my.awqlOptions.during = timeframe
    return {
      send: _refreshAuth
    }
  }
  var _refreshAuth = function () {
    return new BBPromise(function (resolve, reject) {
      if (!my.auth.accessToken || my.auth.tokenExpires < parseInt(moment().format('X'), 10)) {
        auth.refresh(my.auth.clientID, my.auth.clientSecret, my.auth.refreshToken, function (err, token) {
          if (err || token.error) {
            reject(err + token.error + token.error_description)
            return
          }
          my.auth.accessToken = token.access_token
          my.auth.tokenExpires = token.expires
          return resolve(_sendAWQL())
        })
      } else {
        return resolve(_sendAWQL())
      }
    })
  }
  var _sendAWQL = function () {
    return new BBPromise(function (resolve, reject) {
      var finalAWQL = _.cloneDeep(my.awqlOptions)
      if (_.isObject(finalAWQL)) {
        finalAWQL =
          'SELECT+' +
          my.awqlOptions.select +
          '+FROM+' +
          my.awqlOptions.from
        if (my.awqlOptions.where) {
          finalAWQL += '+WHERE+' + my.awqlOptions.where
        }
        if (my.awqlOptions.and) {
          finalAWQL += '+AND+' + my.awqlOptions.and.join('+AND+')
        }
        if (my.awqlOptions.during) {
          finalAWQL += '+DURING+' + my.awqlOptions.during
        }
      } else if (_.isString(finalAWQL)) {
        finalAWQL = finalAWQL.split(', ').join(',').split(' ').join('+')
      }
      my.awqlOptions = {}
      var builtAWQL = '__rdquery=' + finalAWQL + '&__fmt=TSV'
      var header = _buildHeader(builtAWQL.length)
      request.post(my.host)
        .header(header)
        .send(builtAWQL)
        .end(function (results) {
          if (results.error) {
            var msg
            if (results.body.indexOf('ReportDefinitionError.INVALID_FIELD_NAME_FOR_REPORT') > -1) {
              msg = 'Error: Invalid field selected. Please review your query and try again.'
            }
            if (results.body.indexOf('ReportDefinitionError.CUSTOMER_SERVING_TYPE_REPORT_MISMATCH') > -1) {
              msg = 'Error: Please use your Google Adwords credentials other than MCC Account.'
            }
            if (results.body.indexOf('AuthorizationError.USER_PERMISSION_DENIED') > -1) {
              msg = 'AuthorizationError.USER_PERMISSION_DENIED'
            }
            if (results.body.indexOf('AuthenticationError.OAUTH_TOKEN_INVALID') > -1) {
              msg = 'Authentication Error. OAUTH_TOKEN_INVALID'
            }
            msg = msg || results.error
            return reject(msg)
          }
          var body = results.body
          resolve(_parseResults(body))
        })
    })
  }
  var _buildHeader = function (bodyLength) {
    return {
      Authorization: 'Bearer ' + my.auth.accessToken,
      'Content-Type': 'application/x-www-form-urlencoded',
      developerToken: my.auth.developerToken,
      clientCustomerId: my.auth.clientCustomerID,
      includeZeroImpressions: true,
      'Content-Length': bodyLength
    }
  }
  var _parseResults = function (body) {
    var _finalObj = {}
    var bodyArray = body.split('\n')
    bodyArray.pop()
    var title = bodyArray[0].split('"').join('')
    var date = title.split('(')[1].split(')')[0]
    _finalObj.report = title.split(' ')[0]
    _finalObj.timeframe = date
    bodyArray.shift()
    _finalObj.total = bodyArray[bodyArray.length - 1].split('\t')[1]
    bodyArray.pop()
    var columnNames = bodyArray[0].split('\t')
    _finalObj.fieldLength = columnNames.length
    bodyArray.shift()
    _finalObj.data = _.map(bodyArray, function (row) {
      row = row.split('\t')
      var rowObj = {}
      _.forEach(columnNames, function (columnName, index) {
        rowObj[columnName.toLowerCase()] = row[index]
      })
      return rowObj
    })
    _finalObj.auth = {
      accessToken: my.auth.accessToken,
      tokenExpires: my.auth.tokenExpires
    }
    return _finalObj
  }

  /*****************************/
  /*      Public functions     */
  /*****************************/

  /**
   * Use the specified options to sign requests: can be an accessToken/refreshToken keys pair
   * or a clientID/clientSecret keys pair
   * @param options object { refreshToken } ||
   *                       { accessToken, tokenExpires, refreshToken } ||
   *                       { clientID, clientSecret }
   * @throws Error if options is wrong
   */
  self.use = function (options) {
      if (typeof options === 'object') {
        if (options.refreshToken && options.clientCustomerID) {
          my.limit = null
          my.remaining = null
          my.auth.accessToken = options.accessToken || null
          my.auth.tokenExpires = options.tokenExpires || null
          my.auth.refreshToken = options.refreshToken
          my.auth.clientCustomerID = options.clientCustomerID
        } else if (options.clientID && options.clientSecret && options.developerToken) {
          my.limit = null
          my.remaining = null
          my.auth.accessToken = null
          my.auth.tokenExpires = null
          my.auth.clientID = options.clientID
          my.auth.clientSecret = options.clientSecret
          my.auth.developerToken = options.developerToken
        } else {
          throw new Error('Wrong param "options"')
        }
      } else {
        throw new Error('Wrong param "options"')
      }
    }
    // https://developers.google.com/adwords/api/docs/guides/awql
  self.awql = function (options) {
    if (options) {
      my.awqlOptions = _.cloneDeep(options)
      if (_.isArray(my.awqlOptions.select)) {
        my.awqlOptions.select = my.awqlOptions.select.join(',')
      }
      if (_.isArray(my.awqlOptions.during)) {
        my.awqlOptions.during = my.awqlOptions.during.join(',')
      }
      return {
        send: _refreshAuth
      }
    }
    return {
      select: _selectStatement
    }
  }
  return self
}

module.exports = new GoogleAdwords()
