// Copyright (c) 2015, Trent Oswald <trentoswald@therebelrobot.com
//
// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT,
// OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
// DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
// ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var Promise = require('bluebird');
var request = require('unirest');
var auth = require('adwords-auth');
var _ = require('lodash');
var parseString = require("xml2js").parseString;
var parseStringAsync = Promise.promisify(require("xml2js").parseString);

/**
 * Google Adwords Report API driver for NodeJS
 * Proceeds the call to the API and give
 * back the response in JSON format
 *
 * @param spec { agent, host, port }
 */
var GoogleAdwords = function(spec, my) {
  my = my || {};
  spec = spec || {};

  my.limit = null;
  my.remaining = null;
  my.awqlOptions = {};
  my.auth = {};
  my.agent = spec.agent;
  my.host = spec.host || 'https://adwords.google.com/api/adwords/reportdownload/v201409';
  my.port = spec.port || 443;

  /*******************************/
  /*       Private helpers       */
  /*******************************/

  /**
   * Make a call on googleAdwords API with the given params, path & method
   * @param method string the request method
   * @param path string the path
   * @param params object the params
   */
  call = function(method, path, params) {
    return new Promise(function(resolve, reject) {

    });
  };
  /**
   * Handle API errors
   * @param body object the response from googleAdwords API
   */
  handle_error = function(body) {
    return new Promise(function(resolve, reject) {

    });
  };

  /*****************************/
  /*      Public functions     */
  /*****************************/

  /**
   * Use the specified options to sign requests: can be an accessToken/refreshToken keys pair
   * or a clientID/clientSecret keys pair
   * @param options object { accessToken, refreshToken} ||
   *                       { clientID, clientSecret }
   * @throws Error if options is wrong
   */
  this.use = function(options) {
    if (typeof options === 'object') {
      if (options.refreshToken && options.clientCustomerID) {
        my.limit = null;
        my.remaining = null;
        my.auth.accessToken = options.accessToken || null;
        my.auth.tokenExpires = options.tokenExpires || null;
        my.auth.refreshToken = options.refreshToken;
        my.auth.clientCustomerID = options.clientCustomerID;
      } else if (options.clientID && options.clientSecret && options.developerToken) {
        my.limit = null;
        my.remaining = null;
        my.auth.accessToken = null;
        my.auth.tokenExpires = null;
        my.auth.clientID = options.clientID;
        my.auth.clientSecret = options.clientSecret;
        my.auth.developerToken = options.developerToken;
      } else {
        throw new Error('Wrong param "options"');
      }
    } else {
      throw new Error('Wrong param "options"');
    }
  };

  this.awql = function(options) {
    if (options) {
      my.awqlOptions = _.cloneDeep(options);
      return {
        send: _refreshAuth
      };
    }
    return {
      select: _selectStatement
    };
  }
  _selectStatement = function(rows) {
    if(_.isArray(rows)){
      rows = rows.join(',');
    }
    my.awqlOptions.select = rows;
    return {
      from: _fromStatement
    };
  }
  _fromStatement = function(report) {
    my.awqlOptions.from = report;
    return {
      where: _whereStatement,
      during: _duringStatement,
      send: _refreshAuth
    }
  }
  _whereStatement = function(statement) {
    my.awqlOptions.where = statement;
    return {
      and: _andStatement,
      during: _duringStatement
    }
  }
  _andStatement = function(statement) {
    if (!my.awqlOptions.and) {
      my.awqlOptions.and = [];
    }
    my.awqlOptions.and.push(statement);
    return {
      and: _andStatement,
      during: _duringStatement
    }
  }
  _duringStatement = function(timeframe) {
    if(_.isArray(timeframe)){
      timeframe = timeframe.join(',');
    }
    my.awqlOptions.during = timeframe;
    return {
      send: _refreshAuth
    }
  }
  _refreshAuth = function() {
    return new Promise(function(resolve, reject) {
      if (!my.auth.accessToken || my.auth.tokenExpires < parseInt(moment().format('X'))) {
        auth.refresh(my.auth.clientID, my.auth.clientSecret, my.auth.refreshToken, function(err, token) {;
          if (err) {
            reject(err);
            return
          };
          my.auth.accessToken = token.access_token;
          my.auth.tokenExpires = token.expires;
          return resolve(_sendAWQL());
        });
      } else {
        return resolve(_sendAWQL());
      }
    });
  }
  _sendAWQL = function() {
    return new Promise(function(resolve, reject) {
      var finalAWQL =
        'SELECT+' +
        my.awqlOptions.select +
        '+FROM+' +
        my.awqlOptions.from;
      if (my.awqlOptions.where) {
        finalAWQL += '+WHERE+' + my.awqlOptions.where;
      }
      if (my.awqlOptions.and) {
        finalAWQL += '+AND+' + my.awqlOptions.and.join('+AND+');
      }
      if (my.awqlOptions.during) {
        finalAWQL += '+DURING+' + my.awqlOptions.during;
      }
      my.awqlOptions = {};
      var builtAWQL = '__rdquery=' + finalAWQL + '&__fmt=TSV';
      var header = _buildHeader(builtAWQL.length);
      request.post(my.host)
        .header(header)
        .send(builtAWQL)
        .end(function(results) {
          if (results.error) {
            reject(results.error);
            return;
          }
          var body = results.body;
          if (body.reportDownloadError) {
            reject(body.reportDownloadError.ApiError[0].type[0]);
            return;
          }
          parseString(body, function(err, results) {
            if (_.isUndefined(results)) {
              resolve(_parseResults(body));
            } else {
              var msg;
              var _ApiError = result.reportDownloadError.ApiError;
              var _type = _ApiError[0].type[0];
              if (_type !== '') {
                switch (_type) {
                  case 'ReportDefinitionError.CUSTOMER_SERVING_TYPE_REPORT_MISMATCH':
                    msg = "Error: Please use your Google Adwords credentials other than MCC Account.";
                    break;
                  case 'AuthorizationError.USER_PERMISSION_DENIED':
                    msg = _type;
                    break;
                  case 'AuthenticationError.OAUTH_TOKEN_INVALID':
                    msg = "Authentication Error. OAUTH_TOKEN_INVALID";
                    break;
                  default:
                    msg = result.reportDownloadError;
                }
                reject(msg)
              } else {
                reject(result.reportDownloadError);
              }
            }
          });
        });
    });
  };
  _buildHeader = function(bodyLength) {
    return {
      Authorization: 'Bearer ' + my.auth.accessToken,
      'Content-Type': 'application/x-www-form-urlencoded',
      developerToken: my.auth.developerToken,
      clientCustomerId: my.auth.clientCustomerID,
      includeZeroImpressions: true,
      'Content-Length': bodyLength
    };
  };
  _parseResults = function(body) {
    var _finalObj = {};
    var bodyArray = body.split('\n');
    bodyArray.pop();
    var title = bodyArray[0].split('"').join('');
    var date = title.split('(')[1].split(')')[0];
    _finalObj.report = title.split(' ')[0];
    bodyArray.shift();
    _finalObj.total = bodyArray[bodyArray.length - 1].split('\t')[1];
    bodyArray.pop();
    var columnNames = bodyArray[0].split('\t');
    bodyArray.shift();
    _finalObj.data = _.map(bodyArray, function(row) {
      row = row.split('\t');
      var rowObj = {};
      _.forEach(columnNames, function(columnName, index) {
        rowObj[columnName.toLowerCase()] = row[index];
      })
      return rowObj;
    });
    _finalObj.auth = {
      accessToken:my.auth.accessToken,
      tokenExpires:my.auth.tokenExpires
    }
    return _finalObj;
  };
  this.accountPerformance = function(options) {
    return new Promise(function(resolve, reject) {
      var reportName = 'ACCOUNT_PERFORMANCE_REPORT';
      var availableFields = [
        'AccountCurrencyCode',
        'AccountDescriptiveName',
        'AccountId',
        'AccountTimeZoneId',
        'AdNetworkType1',
        'AdNetworkType2',
        'AverageCpc',
        'AverageCpm',
        'AveragePosition',
        'ClickType',
        'Clicks',
        'ContentBudgetLostImpressionShare',
        'ContentImpressionShare',
        'ContentRankLostImpressionShare',
        'ConversionCategoryName',
        'ConversionRate',
        'ConversionRateManyPerClick',
        'ConversionTrackerId',
        'ConversionTypeName',
        'ConversionValue',
        'Conversions',
        'ConversionsManyPerClick',
        'Cost',
        'CostPerConversion',
        'CostPerConversionManyPerClick',
        'CostPerEstimatedTotalConversion',
        'Ctr',
        'CustomerDescriptiveName',
        'Date',
        'DayOfWeek',
        'Device',
        'EstimatedCrossDeviceConversions',
        'EstimatedTotalConversionRate',
        'EstimatedTotalConversionValue',
        'EstimatedTotalConversionValuePerClick',
        'EstimatedTotalConversionValuePerCost',
        'EstimatedTotalConversions',
        'ExternalCustomerId',
        'HourOfDay',
        'Impressions',
        'InvalidClickRate',
        'InvalidClicks',
        'Month',
        'MonthOfYear',
        'PrimaryCompanyName',
        'PrimaryUserLogin',
        'Quarter',
        'SearchBudgetLostImpressionShare',
        'SearchExactMatchImpressionShare',
        'SearchImpressionShare',
        'SearchRankLostImpressionShare',
        'Slot',
        'TotalConvValue',
        'ValuePerConv',
        'ValuePerConvManyPerClick',
        'ValuePerConversion',
        'ValuePerConversionManyPerClick',
        'ValuePerEstimatedTotalConversion',
        'ViewThroughConversions',
        'Week',
        'Year'
      ]
      var optionsToSend = {
        select: options.fields || availableFields,
        from: reportName
      };


    });
  };
  this.accountReachFrequency = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'ACCOUNT_REACH_FREQUENCY_REPORT';
    });
  };
  this.adPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AD_PERFORMANCE_REPORT';
    });
  };
  this.adCustomizersFeedItem = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AD_CUSTOMIZERS_FEED_ITEM_REPORT';
    });
  };
  this.adExtensionsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AD_EXTENSIONS_PERFORMANCE_REPORT';
    });
  };
  this.adGroupPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'ADGROUP_PERFORMANCE_REPORT';
    });
  };
  this.adGroupReachFrequency = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'ADGROUP_REACH_FREQUENCY_REPORT';
    });
  };
  this.ageRangePerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AGE_RANGE_PERFORMANCE_REPORT';
    });
  };
  this.audiencePerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AUDIENCE_PERFORMANCE_REPORT';
    });
  };
  this.automaticPlacementsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'AUTOMATIC_PLACEMENTS_PERFORMANCE_REPORT';
    });
  };
  this.bidGoalPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'BID_GOAL_PERFORMANCE_REPORT';
    });
  };
  this.budgetPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'BUDGET_PERFORMANCE_REPORT';
    });
  };
  this.callMetricsCallDetails = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CALL_METRICS_CALL_DETAILS_REPORT';
    });
  };
  this.campaignPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_PERFORMANCE_REPORT';
    });
  };
  this.campaignAdScheduleTarget = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_AD_SCHEDULE_TARGET_REPORT';
    });
  };
  this.campaignLocationTarget = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_LOCATION_TARGET_REPORT';
    });
  };
  this.campaignNegativeKeywordsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_NEGATIVE_KEYWORDS_PERFORMANCE_REPORT';
    });
  };
  this.campaignNegativeLocations = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_NEGATIVE_LOCATIONS_REPORT';
    });
  };
  this.campaignNegativePlacementsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_NEGATIVE_PLACEMENTS_PERFORMANCE_REPORT';
    });
  };
  this.campaignPlatformTarget = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_PLATFORM_TARGET_REPORT';
    });
  };
  this.campaignReachFrequency = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_REACH_FREQUENCY_REPORT';
    });
  };
  this.campaignSharedSet = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CAMPAIGN_SHARED_SET_REPORT';
    });
  };
  this.clickPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CLICK_PERFORMANCE_REPORT';
    });
  };
  this.creativeConversion = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CREATIVE_CONVERSION_REPORT';
    });
  };
  this.criteriaPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'CRITERIA_PERFORMANCE_REPORT';
    });
  };
  this.destinationURL = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'DESTINATION_URL_REPORT';
    });
  };
  this.displayKeywordPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'DISPLAY_KEYWORD_PERFORMANCE_REPORT';
    });
  };
  this.displayTopicsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'DISPLAY_TOPICS_PERFORMANCE_REPORT';
    });
  };
  this.genderPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'GENDER_PERFORMANCE_REPORT';
    });
  };
  this.geoPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'GEO_PERFORMANCE_REPORT';
    });
  };
  this.keywordlessCategory = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'KEYWORDLESS_CATEGORY_REPORT';
    });
  };
  this.keywordlessQuery = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'KEYWORDLESS_QUERY_REPORT';
    });
  };
  this.keywordsPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'KEYWORDS_PERFORMANCE_REPORT';
    });
  };
  this.paidAndOrganicQuery = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'PAID_ORGANIC_QUERY_REPORT';
    });
  };
  this.placeholder = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'PLACEHOLDER_REPORT';
    });
  };
  this.placeholderFeedItem = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'PLACEHOLDER_FEED_ITEM_REPORT';
    });
  };
  this.placementPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'PLACEMENT_PERFORMANCE_REPORT';
    });
  };
  this.productPartition = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'PRODUCT_PARTITION_REPORT';
    });
  };
  this.searchQueryPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'SEARCH_QUERY_PERFORMANCE_REPORT';
    });
  };
  this.sharedSetCriteria = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'SHARED_SET_CRITERIA_REPORT';
    });
  };
  this.sharedSet = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'SHARED_SET_REPORT';
    });
  };
  this.shoppingPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'SHOPPING_PERFORMANCE_REPORT';
    });
  };
  this.urlPerformance = function() {
    return new Promise(function(resolve, reject) {
      var reportName = 'URL_PERFORMANCE_REPORT';
    });
  };
  return this;
};

module.exports = new GoogleAdwords();
