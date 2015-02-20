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

  var self = this;

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
  this.methods = function() {
    return [
      'use',
      'awql',
      'accountPerformance',
      'accountReachFrequency',
      'adPerformance',
      'adCustomizersFeedItem',
      'adExtensionsPerformance',
      'adGroupPerformance',
      'adGroupReachFrequency',
      'ageRangePerformance',
      'audiencePerformance',
      'automaticPlacementsPerformance',
      'bidGoalPerformance',
      'budgetPerformance',
      'callMetricsCallDetails',
      'campaignPerformance',
      'campaignAdScheduleTarget',
      'campaignLocationTarget',
      'campaignNegativeKeywordsPerformance',
      'campaignNegativeLocations',
      'campaignNegativePlacementsPerformance',
      'campaignPlatformTarget',
      'campaignReachFrequency',
      'campaignSharedSet',
      'clickPerformance',
      'creativeConversion',
      'criteriaPerformance',
      'destinationURL',
      'displayKeywordPerformance',
      'displayTopicsPerformance',
      'genderPerformance',
      'geoPerformance',
      'keywordlessCategory',
      'keywordlessQuery',
      'keywordsPerformance',
      'paidAndOrganicQuery',
      'placeholder',
      'placeholderFeedItem',
      'placementPerformance',
      'productPartition',
      'searchQueryPerformance',
      'sharedSetCriteria',
      'sharedSet',
      'shoppingPerformance',
      'urlPerformance'
    ];
  };
  // https://developers.google.com/adwords/api/docs/guides/awql
  this.awql = function(options) {
    if (options) {
      my.awqlOptions = _.cloneDeep(options);
      if (_.isArray(my.awqlOptions.select)) {
        my.awqlOptions.select = my.awqlOptions.select.join(',');
      }
      if (_.isArray(my.awqlOptions.and)) {
        my.awqlOptions.and = my.awqlOptions.and.join(',');
      }
      if (_.isArray(my.awqlOptions.during)) {
        my.awqlOptions.during = my.awqlOptions.during.join(',');
      }
      return {
        send: _refreshAuth
      };
    }
    return {
      select: _selectStatement
    };
  }
  _selectStatement = function(rows) {
    if (_.isArray(rows)) {
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
    if (_.isArray(timeframe)) {
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
      var finalAWQL = my.awqlOptions;
      if (_.isObject(my.awqlOptions)) {
        finalAWQL =
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
      }
      my.awqlOptions = {};
      var builtAWQL = '__rdquery=' + finalAWQL + '&__fmt=TSV';
      var header = _buildHeader(builtAWQL.length);
      console.log(header, builtAWQL);

      console.log('SENDING REQUEST')
      request.post(my.host)
        .header(header)
        .send(builtAWQL)
        .end(function(results) {

          console.log('GOT REQUEST')
          if (results.error) {
            console.log('ERROR')
            if (body.indexOf('ReportDefinitionError.INVALID_FIELD_NAME_FOR_REPORT') > -1) {
              msg = 'Error: Invalid field selected. Please review your query and try again.'
            }
            if (body.indexOf('ReportDefinitionError.CUSTOMER_SERVING_TYPE_REPORT_MISMATCH') > -1) {
              msg = "Error: Please use your Google Adwords credentials other than MCC Account.";
            }
            if (body.indexOf('AuthorizationError.USER_PERMISSION_DENIED') > -1) {
              msg = _type;
            }
            if (body.indexOf('AuthenticationError.OAUTH_TOKEN_INVALID') > -1) {
              msg = "Authentication Error. OAUTH_TOKEN_INVALID";
            }
            return reject(msg)
          }
          var body = results.body;
          resolve(_parseResults(body));
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
    console.log('parsingResults');
    var _finalObj = {};
    var bodyArray = body.split('\n');
    bodyArray.pop();
    var title = bodyArray[0].split('"').join('');
    var date = title.split('(')[1].split(')')[0];
    _finalObj.report = title.split(' ')[0];
    _finalObj.timeframe = date;
    bodyArray.shift();
    _finalObj.total = bodyArray[bodyArray.length - 1].split('\t')[1];
    bodyArray.pop();
    var columnNames = bodyArray[0].split('\t');
    _finalObj.fieldLength = columnNames.length;
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
      accessToken: my.auth.accessToken,
      tokenExpires: my.auth.tokenExpires
    }
    return _finalObj;
  };
  // https://developers.google.com/adwords/api/docs/appendix/reports
  this.accountPerformance = function(options) {
    options = options || {};
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
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    console.log('OPTIONS', options);
    return self.awql(optionsToSend).send();
  };
  this.accountReachFrequency = function(options) {
    options = options || {};
    var reportName = 'ACCOUNT_REACH_FREQUENCY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'PrimaryCompanyName',
      'ReachFrequency',
      'ReachFrequencyClicks',
      'ReachFrequencyConv',
      'ReachFrequencyConvRate',
      'ReachFrequencyCtr',
      'ReachFrequencyDate',
      'UniqueUserCountAsLong'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.adPerformance = function(options) {
    options = options || {};
    var reportName = 'AD_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupAdDisapprovalReasons',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AdType',
      'AdvertiserExperimentSegmentationBin',
      'AssistClicks',
      'AssistImpressions',
      'AssistImpressionsOverLastClicks',
      'AverageCpc',
      'AverageCpm',
      'AveragePageviews',
      'AveragePosition',
      'AverageTimeOnSite',
      'BounceRate',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickAssistedConversionValue',
      'ClickAssistedConversions',
      'ClickAssistedConversionsOverLastClickConversions',
      'ClickSignificance',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionManyPerClickSignificance',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionRateManyPerClickSignificance',
      'ConversionRateSignificance',
      'ConversionSignificance',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CostPerConversionManyPerClickSignificance',
      'CostPerConversionSignificance',
      'CostSignificance',
      'CpcSignificance',
      'CpmSignificance',
      'CreativeApprovalStatus',
      'CreativeDestinationUrl',
      'CreativeFinalAppUrls',
      'CreativeFinalMobileUrls',
      'CreativeFinalUrls',
      'CreativeTrackingUrlTemplate',
      'CreativeUrlCustomParameters',
      'Ctr',
      'CtrSignificance',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Description1',
      'Description2',
      'Device',
      'DevicePreference',
      'DisplayUrl',
      'ExternalCustomerId',
      'Headline',
      'Id',
      'ImageAdUrl',
      'ImageCreativeName',
      'ImpressionAssistedConversionValue',
      'ImpressionAssistedConversions',
      'ImpressionAssistedConversionsOverLastClickConversions',
      'ImpressionSignificance',
      'Impressions',
      'IsNegative',
      'KeywordId',
      'LabelIds',
      'Labels',
      'Month',
      'MonthOfYear',
      'PercentNewVisitors',
      'PositionSignificance',
      'PrimaryCompanyName',
      'PromotionLine',
      'Quarter',
      'SharedSetName',
      'Slot',
      'Status',
      'Url',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'ViewThroughConversionsSignificance',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.adCustomizersFeedItem = function(options) {
    options = options || {};
    var reportName = 'AD_CUSTOMIZERS_FEED_ITEM_REPORT';
    var availableFields = [
      'AdGroupId',
      'AdGroupName',
      'AdId',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'Date',
      'DayOfWeek',
      'Device',
      'FeedId',
      'FeedItemAttributes',
      'FeedItemEndTime',
      'FeedItemId',
      'FeedItemStartTime',
      'FeedItemStatus',
      'Impressions',
      'Month',
      'MonthOfYear',
      'Quarter',
      'Slot',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.adExtensionsPerformance = function(options) {
    options = options || {};
    var reportName = 'AD_EXTENSIONS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdExtensionId',
      'AdExtensionType',
      'AdNetworkType1',
      'AdNetworkType2',
      'ApprovalStatus',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'AvgCostForOfflineInteraction',
      'CampaignId',
      'ClickType',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'ExternalCustomerId',
      'Impressions',
      'LocationExtensionSource',
      'Month',
      'MonthOfYear',
      'NumOfflineImpressions',
      'NumOfflineInteractions',
      'OfflineInteractionCost',
      'OfflineInteractionRate',
      'PrimaryCompanyName',
      'Quarter',
      'Slot',
      'Status',
      'ValuePerConversion',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.adGroupPerformance = function(options) {
    options = options || {};
    var reportName = 'ADGROUP_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AdvertiserExperimentSegmentationBin',
      'AssistClicks',
      'AssistImpressions',
      'AssistImpressionsOverLastClicks',
      'AverageCpc',
      'AverageCpm',
      'AveragePageviews',
      'AveragePosition',
      'AverageTimeOnSite',
      'AvgCostForOfflineInteraction',
      'BidType',
      'BiddingStrategyId',
      'BiddingStrategyName',
      'BiddingStrategyType',
      'BounceRate',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickAssistedConversionValue',
      'ClickAssistedConversions',
      'ClickAssistedConversionsOverLastClickConversions',
      'ClickSignificance',
      'ClickType',
      'Clicks',
      'ContentBidCriterionTypeGroup',
      'ContentImpressionShare',
      'ContentRankLostImpressionShare',
      'ConversionCategoryName',
      'ConversionManyPerClickSignificance',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionRateManyPerClickSignificance',
      'ConversionRateSignificance',
      'ConversionSignificance',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CostPerConversionManyPerClickSignificance',
      'CostPerConversionSignificance',
      'CostPerEstimatedTotalConversion',
      'CostSignificance',
      'CpcBid',
      'CpcSignificance',
      'CpmBid',
      'CpmSignificance',
      'Ctr',
      'CtrSignificance',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'EnhancedCpcEnabled',
      'EstimatedCrossDeviceConversions',
      'EstimatedTotalConversionRate',
      'EstimatedTotalConversionValue',
      'EstimatedTotalConversionValuePerClick',
      'EstimatedTotalConversionValuePerCost',
      'EstimatedTotalConversions',
      'ExternalCustomerId',
      'HourOfDay',
      'Id',
      'ImpressionAssistedConversionValue',
      'ImpressionAssistedConversions',
      'ImpressionAssistedConversionsOverLastClickConversions',
      'ImpressionSignificance',
      'Impressions',
      'LabelIds',
      'Labels',
      'Month',
      'MonthOfYear',
      'Name',
      'NumOfflineImpressions',
      'NumOfflineInteractions',
      'OfflineInteractionCost',
      'OfflineInteractionRate',
      'PercentNewVisitors',
      'PositionSignificance',
      'PrimaryCompanyName',
      'Quarter',
      'RelativeCtr',
      'SearchExactMatchImpressionShare',
      'SearchImpressionShare',
      'SearchRankLostImpressionShare',
      'Slot',
      'Status',
      'TargetCpa',
      'TotalCost',
      'TrackingUrlTemplate',
      'UrlCustomParameters',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ValuePerEstimatedTotalConversion',
      'ViewThroughConversions',
      'ViewThroughConversionsSignificance',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.adGroupReachFrequency = function(options) {
    options = options || {};
    var reportName = 'ADGROUP_REACH_FREQUENCY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'PrimaryCompanyName',
      'ReachFrequency',
      'ReachFrequencyClicks',
      'ReachFrequencyConv',
      'ReachFrequencyConvRate',
      'ReachFrequencyCtr',
      'ReachFrequencyDate',
      'UniqueUserCountAsLong'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.ageRangePerformance = function(options) {
    options = options || {};
    var reportName = 'AGE_RANGE_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'Criteria',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.audiencePerformance = function(options) {
    options = options || {};
    var reportName = 'AUDIENCE_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'Criteria',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Slot',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.automaticPlacementsPerformance = function(options) {
    options = options || {};
    var reportName = 'AUTOMATIC_PLACEMENTS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdFormat',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CriteriaParameters',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DisplayName',
      'Domain',
      'ExternalCustomerId',
      'Impressions',
      'IsAutoOptimized',
      'IsBidOnPath',
      'IsPathExcluded',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'

    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.bidGoalPerformance = function(options) {
    options = options || {};
    var reportName = 'BID_GOAL_PERFORMANCE_REPORT';
    var availableFields = [
      'AdGroupCount',
      'AdGroupCriteriaCount',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignCount',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'Date',
      'DayOfWeek',
      'Device',
      'HourOfDay',
      'Id',
      'Impressions',
      'Month',
      'MonthOfYear',
      'Name',
      'NonRemovedAdGroupCount',
      'NonRemovedAdGroupCriteriaCount',
      'NonRemovedCampaignCount',
      'PageOnePromotedBidCeiling',
      'PageOnePromotedBidChangesForRaisesOnly',
      'PageOnePromotedBidModifier',
      'PageOnePromotedRaiseBidWhenBudgetConstained',
      'PageOnePromotedRaiseBidWhenBudgetConstrained',
      'PageOnePromotedRaiseBidWhenLowQualityScore',
      'PageOnePromotedStrategyGoal',
      'Quarter',
      'Status',
      'TargetCpa',
      'TargetCpaMaxCpcBidCeiling',
      'TargetCpaMaxCpcBidFloor',
      'TargetRoas',
      'TargetRoasBidCeiling',
      'TargetRoasBidFloor',
      'TargetSpendBidCeiling',
      'TargetSpendSpendTarget',
      'Type',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.budgetPerformance = function(options) {
    options = options || {};
    var reportName = 'BUDGET_PERFORMANCE_REPORT';
    var availableFields = [
      'Amount',
      'AssociatedCampaignId',
      'AssociatedCampaignName',
      'AssociatedCampaignStatus',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BudgetCampaignAssociationStatus',
      'BudgetId',
      'BudgetName',
      'BudgetReferenceCount',
      'BudgetStatus',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'DeliveryMethod',
      'Impressions',
      'IsBudgetExplicitlyShared',
      'Period',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.callMetricsCallDetails = function(options) {
    options = options || {};
    var reportName = 'CALL_METRICS_CALL_DETAILS_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdvertiserPhoneNumber',
      'CallDuration',
      'CallEndTime',
      'CallStartTime',
      'CallStatus',
      'CallType',
      'CallerCountryCallingCode',
      'CallerNationalDesignatedCode',
      'CampaignId',
      'CampaignName',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'OfflineInteractionCost',
      'PrimaryCompanyName'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignPerformance = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdNetworkType1',
      'AdNetworkType2',
      'AdvertiserExperimentSegmentationBin',
      'AdvertisingChannelSubType',
      'AdvertisingChannelType',
      'Amount',
      'AssistClicks',
      'AssistImpressions',
      'AssistImpressionsOverLastClicks',
      'AverageCpc',
      'AverageCpm',
      'AveragePageviews',
      'AveragePosition',
      'AverageTimeOnSite',
      'AvgCostForOfflineInteraction',
      'BidType',
      'BiddingStrategyId',
      'BiddingStrategyName',
      'BiddingStrategyType',
      'BounceRate',
      'BudgetId',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickAssistedConversionValue',
      'ClickAssistedConversions',
      'ClickAssistedConversionsOverLastClickConversions',
      'ClickSignificance',
      'ClickType',
      'Clicks',
      'ContentBudgetLostImpressionShare',
      'ContentImpressionShare',
      'ContentRankLostImpressionShare',
      'ConversionCategoryName',
      'ConversionManyPerClickSignificance',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionRateManyPerClickSignificance',
      'ConversionRateSignificance',
      'ConversionSignificance',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CostPerConversionManyPerClickSignificance',
      'CostPerConversionSignificance',
      'CostPerEstimatedTotalConversion',
      'CostSignificance',
      'CpcSignificance',
      'CpmSignificance',
      'Ctr',
      'CtrSignificance',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'EnhancedCpcEnabled',
      'EstimatedCrossDeviceConversions',
      'EstimatedTotalConversionRate',
      'EstimatedTotalConversionValue',
      'EstimatedTotalConversionValuePerClick',
      'EstimatedTotalConversionValuePerCost',
      'EstimatedTotalConversions',
      'ExternalCustomerId',
      'HourOfDay',
      'Id',
      'ImpressionAssistedConversionValue',
      'ImpressionAssistedConversions',
      'ImpressionAssistedConversionsOverLastClickConversions',
      'ImpressionSignificance',
      'Impressions',
      'InvalidClickRate',
      'InvalidClicks',
      'IsBudgetExplicitlyShared',
      'LabelIds',
      'Labels',
      'Month',
      'MonthOfYear',
      'Name',
      'NumOfflineImpressions',
      'NumOfflineInteractions',
      'OfflineInteractionCost',
      'OfflineInteractionRate',
      'PercentNewVisitors',
      'Period',
      'PositionSignificance',
      'PrimaryCompanyName',
      'Quarter',
      'RelativeCtr',
      'SearchBudgetLostImpressionShare',
      'SearchExactMatchImpressionShare',
      'SearchImpressionShare',
      'SearchRankLostImpressionShare',
      'ServingStatus',
      'Slot',
      'Status',
      'TotalBudget',
      'TotalCost',
      'TrackingUrlTemplate',
      'UrlCustomParameters',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ValuePerEstimatedTotalConversion',
      'ViewThroughConversions',
      'ViewThroughConversionsSignificance',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignAdScheduleTarget = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_AD_SCHEDULE_TARGET_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BidModifier',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignLocationTarget = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_LOCATION_TARGET_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BidModifier',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignNegativeKeywordsPerformance = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_NEGATIVE_KEYWORDS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'CampaignId',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'Id',
      'IsNegative',
      'KeywordMatchType',
      'KeywordText',
      'PlacementUrl',
      'PrimaryCompanyName',
      'UserListId'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignNegativeLocations = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_NEGATIVE_LOCATIONS_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'CampaignId',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'Id',
      'IsNegative',
      'PrimaryCompanyName'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignNegativePlacementsPerformance = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_NEGATIVE_PLACEMENTS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'CampaignId',
      'CustomerDescriptiveName',
      'DisplayName',
      'ExternalCustomerId',
      'Id',
      'IsNegative',
      'KeywordMatchType',
      'KeywordText',
      'PlacementUrl',
      'PrimaryCompanyName',
      'UserListId'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignPlatformTarget = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_PLATFORM_TARGET_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BidModifier',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignReachFrequency = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_REACH_FREQUENCY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'CustomerDescriptiveName',
      'ExternalCustomerId',
      'PrimaryCompanyName',
      'ReachFrequency',
      'ReachFrequencyClicks',
      'ReachFrequencyConv',
      'ReachFrequencyConvRate',
      'ReachFrequencyCtr',
      'ReachFrequencyDate',
      'UniqueUserCountAsLong'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.campaignSharedSet = function(options) {
    options = options || {};
    var reportName = 'CAMPAIGN_SHARED_SET_REPORT';
    var availableFields = [
      'CampaignId',
      'CampaignName',
      'SharedSetName',
      'SharedSetType',
      'Status'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.clickPerformance = function(options) {
    options = options || {};
    var reportName = 'CLICK_PERFORMANCE_REPORT';
    var availableFields = [
      'AdFormat',
      'AdGroupId',
      'AdNetworkType1',
      'AdNetworkType2',
      'CampaignId',
      'CityCriteriaId',
      'ClickType',
      'CountryCriteriaId',
      'CreativeId',
      'CriteriaId',
      'CriteriaParameters',
      'Date',
      'Device',
      'GclId',
      'MetroCriteriaId',
      'MonthOfYear',
      'Page',
      'RegionCriteriaId',
      'Slot',
      'UserListId'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.creativeConversion = function(options) {
    options = options || {};
    var reportName = 'CREATIVE_CONVERSION_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdNetworkType1',
      'AdNetworkType2',
      'CampaignId',
      'CampaignName',
      'ConversionRate',
      'ConversionTrackerId',
      'Conversions',
      'CreativeId',
      'CriteriaParameters',
      'CriteriaTypeName',
      'CriterionId',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'ExternalCustomerId',
      'Impressions',
      'Month',
      'PrimaryCompanyName',
      'Quarter',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.criteriaPerformance = function(options) {
    options = options || {};
    var reportName = 'CRITERIA_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AdvertiserExperimentSegmentationBin',
      'ApprovalStatus',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickSignificance',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionManyPerClickSignificance',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionRateManyPerClickSignificance',
      'ConversionRateSignificance',
      'ConversionSignificance',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CostPerConversionManyPerClickSignificance',
      'CostPerConversionSignificance',
      'CostSignificance',
      'CpcBid',
      'CpcBidSource',
      'CpcSignificance',
      'CpmBid',
      'CpmSignificance',
      'Criteria',
      'CriteriaDestinationUrl',
      'CriteriaType',
      'Ctr',
      'CtrSignificance',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'DisplayName',
      'EnhancedCpcEnabled',
      'ExternalCustomerId',
      'FinalAppUrls',
      'FinalMobileUrls',
      'FinalUrls',
      'FirstPageCpc',
      'Id',
      'ImpressionSignificance',
      'Impressions',
      'IsNegative',
      'LabelIds',
      'Labels',
      'Month',
      'MonthOfYear',
      'Parameter',
      'PositionSignificance',
      'PrimaryCompanyName',
      'QualityScore',
      'Quarter',
      'Slot',
      'Status',
      'TopOfPageCpc',
      'TrackingUrlTemplate',
      'UrlCustomParameters',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'ViewThroughConversionsSignificance',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.destinationURL = function(options) {
    options = options || {};
    var reportName = 'DESTINATION_URL_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
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
      'CriteriaDestinationUrl',
      'CriteriaParameters',
      'CriteriaStatus',
      'CriteriaTypeName',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'EffectiveDestinationUrl',
      'ExternalCustomerId',
      'Impressions',
      'IsNegative',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Slot',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.displayKeywordPerformance = function(options) {
    options = options || {};
    var reportName = 'DISPLAY_KEYWORD_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'KeywordText',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.displayTopicsPerformance = function(options) {
    options = options || {};
    var reportName = 'DISPLAY_TOPICS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'Criteria',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.genderPerformance = function(options) {
    options = options || {};
    var reportName = 'GENDER_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'Criteria',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.geoPerformance = function(options) {
    options = options || {};
    var reportName = 'GEO_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdFormat',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'CityCriteriaId',
      'Clicks',
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
      'CountryCriteriaId',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'ExternalCustomerId',
      'Impressions',
      'IsTargetingLocation',
      'LocationType',
      'MetroCriteriaId',
      'Month',
      'MonthOfYear',
      'MostSpecificCriteriaId',
      'PrimaryCompanyName',
      'Quarter',
      'RegionCriteriaId',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.keywordlessCategory = function(options) {
    options = options || {};
    var reportName = 'KEYWORDLESS_CATEGORY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AverageCpc',
      'AverageCpm',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Category0',
      'Category1',
      'Category2',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CriterionId',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Domain',
      'ExternalCustomerId',
      'Impressions',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.keywordlessQuery = function(options) {
    options = options || {};
    var reportName = 'KEYWORDLESS_QUERY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AverageCpc',
      'AverageCpm',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'CategoryPaths',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CriterionId',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Domain',
      'ExternalCustomerId',
      'Impressions',
      'Line1',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Query',
      'Title',
      'Url',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.keywordsPerformance = function(options) {
    options = options || {};
    var reportName = 'KEYWORDS_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AdvertiserExperimentSegmentationBin',
      'ApprovalStatus',
      'AssistClicks',
      'AssistImpressions',
      'AssistImpressionsOverLastClicks',
      'AverageCpc',
      'AverageCpm',
      'AveragePageviews',
      'AveragePosition',
      'AverageTimeOnSite',
      'BidType',
      'BiddingStrategyId',
      'BiddingStrategyName',
      'BiddingStrategyType',
      'BounceRate',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickAssistedConversionValue',
      'ClickAssistedConversions',
      'ClickAssistedConversionsOverLastClickConversions',
      'ClickSignificance',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionManyPerClickSignificance',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionRateManyPerClickSignificance',
      'ConversionRateSignificance',
      'ConversionSignificance',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CostPerConversionManyPerClickSignificance',
      'CostPerConversionSignificance',
      'CostSignificance',
      'CpcBid',
      'CpcBidSource',
      'CpcSignificance',
      'CpmBid',
      'CpmSignificance',
      'CriteriaDestinationUrl',
      'Ctr',
      'CtrSignificance',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'EnhancedCpcEnabled',
      'ExternalCustomerId',
      'FinalAppUrls',
      'FinalMobileUrls',
      'FinalUrls',
      'FirstPageCpc',
      'Id',
      'ImpressionAssistedConversionValue',
      'ImpressionAssistedConversions',
      'ImpressionAssistedConversionsOverLastClickConversions',
      'ImpressionSignificance',
      'Impressions',
      'IsNegative',
      'KeywordMatchType',
      'KeywordText',
      'LabelIds',
      'Labels',
      'Month',
      'MonthOfYear',
      'PercentNewVisitors',
      'PlacementUrl',
      'PositionSignificance',
      'PrimaryCompanyName',
      'QualityScore',
      'Quarter',
      'SearchExactMatchImpressionShare',
      'SearchImpressionShare',
      'SearchRankLostImpressionShare',
      'Slot',
      'Status',
      'TopOfPageCpc',
      'TrackingUrlTemplate',
      'UrlCustomParameters',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'ViewThroughConversionsSignificance',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.paidAndOrganicQuery = function(options) {
    options = options || {};
    var reportName = 'PAID_ORGANIC_QUERY_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AverageCpc',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'Clicks',
      'CombinedAdsOrganicClicks',
      'CombinedAdsOrganicClicksPerQuery',
      'CombinedAdsOrganicQueries',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'ExternalCustomerId',
      'Impressions',
      'KeywordId',
      'KeywordTextMatchingQuery',
      'MatchType',
      'OrganicAveragePosition',
      'OrganicClicks',
      'OrganicClicksPerQuery',
      'OrganicImpressions',
      'OrganicImpressionsPerQuery',
      'OrganicQueries',
      'PrimaryCompanyName',
      'SearchQuery',
      'SerpType'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.placeholder = function(options) {
    options = options || {};
    var reportName = 'PLACEHOLDER_REPORT';
    var availableFields = [
      'AdGroupId',
      'AdGroupName',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'Date',
      'DayOfWeek',
      'Device',
      'ExtensionPlaceholderCreativeId',
      'ExtensionPlaceholderType',
      'Impressions',
      'Month',
      'MonthOfYear',
      'Quarter',
      'Slot',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.placeholderFeedItem = function(options) {
    options = options || {};
    var reportName = 'PLACEHOLDER_FEED_ITEM_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdId',
      'AdNetworkType1',
      'AdNetworkType2',
      'AttributeValues',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'Device',
      'DevicePreference',
      'EndTime',
      'ExternalCustomerId',
      'FeedId',
      'FeedItemId',
      'Impressions',
      'IsSelfAction',
      'KeywordMatchType',
      'KeywordText',
      'Month',
      'MonthOfYear',
      'PlaceholderType',
      'PrimaryCompanyName',
      'Quarter',
      'Scheduling',
      'Slot',
      'StartTime',
      'Status',
      'UrlCustomParameters',
      'ValidationDetails',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.placementPerformance = function(options) {
    options = options || {};
    var reportName = 'PLACEMENT_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'BidModifier',
      'BidType',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'ClickType',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CpcBidSource',
      'CpmBid',
      'CpmBidSource',
      'CriteriaDestinationUrl',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'DisplayName',
      'ExternalCustomerId',
      'Id',
      'Impressions',
      'IsNegative',
      'IsRestrict',
      'Month',
      'MonthOfYear',
      'PlacementUrl',
      'PrimaryCompanyName',
      'Quarter',
      'Status',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.productPartition = function(options) {
    options = options || {};
    var reportName = 'PRODUCT_PARTITION_REPORT';
    var availableFields = [
      'AdGroupId',
      'AdGroupName',
      'AverageCpc',
      'AverageCpm',
      'BenchmarkAverageMaxCpc',
      'BenchmarkCtr',
      'CampaignId',
      'CampaignName',
      'ClickType',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CpcBid',
      'CriteriaDestinationUrl',
      'Ctr',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'FinalAppUrls',
      'FinalMobileUrls',
      'FinalUrls',
      'Id',
      'Impressions',
      'IsNegative',
      'Month',
      'MonthOfYear',
      'ParentCriterionId',
      'PartitionType',
      'ProductGroup',
      'Quarter',
      'SearchImpressionShare',
      'TrackingUrlTemplate',
      'UrlCustomParameters',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'

    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.searchQueryPerformance = function(options) {
    options = options || {};
    var reportName = 'SEARCH_QUERY_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdFormat',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'AveragePosition',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CreativeId',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DestinationUrl',
      'Device',
      'ExternalCustomerId',
      'Impressions',
      'KeywordId',
      'KeywordTextMatchingQuery',
      'MatchType',
      'MatchTypeWithVariant',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Query',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.sharedSetCriteria = function(options) {
    options = options || {};
    var reportName = 'SHARED_SET_CRITERIA_REPORT';
    var availableFields = [
      'Id',
      'KeywordMatchType',
      'KeywordText',
      'SharedSetId'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.sharedSet = function(options) {
    options = options || {};
    var reportName = 'SHARED_SET_REPORT';
    var availableFields = [
      'MemberCount',
      'Name',
      'ReferenceCount',
      'SharedSetId',
      'Status',
      'Type'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.shoppingPerformance = function(options) {
    options = options || {};
    var reportName = 'SHOPPING_PERFORMANCE_REPORT';
    var availableFields = [
      'AdGroupId',
      'AdGroupName',
      'AggregatorId',
      'AverageCpc',
      'Brand',
      'CampaignId',
      'CampaignName',
      'CategoryL1',
      'CategoryL2',
      'CategoryL3',
      'CategoryL4',
      'CategoryL5',
      'ClickType',
      'Clicks',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CountryCriteriaId',
      'Ctr',
      'CustomAttribute0',
      'CustomAttribute1',
      'CustomAttribute2',
      'CustomAttribute3',
      'CustomAttribute4',
      'Date',
      'DayOfWeek',
      'Device',
      'Impressions',
      'LanguageCriteriaId',
      'MerchantId',
      'Month',
      'OfferId',
      'ProductCondition',
      'ProductTypeL1',
      'ProductTypeL2',
      'ProductTypeL3',
      'ProductTypeL4',
      'ProductTypeL5',
      'Quarter',
      'StoreId',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();
  };
  this.urlPerformance = function(options) {
    options = options || {};
    var reportName = 'URL_PERFORMANCE_REPORT';
    var availableFields = [
      'AccountCurrencyCode',
      'AccountDescriptiveName',
      'AccountTimeZoneId',
      'AdFormat',
      'AdGroupCriterionStatus',
      'AdGroupId',
      'AdGroupName',
      'AdGroupStatus',
      'AdNetworkType1',
      'AdNetworkType2',
      'AverageCpc',
      'AverageCpm',
      'CampaignId',
      'CampaignName',
      'CampaignStatus',
      'Clicks',
      'ConversionCategoryName',
      'ConversionRate',
      'ConversionRateManyPerClick',
      'ConversionTypeName',
      'ConversionValue',
      'Conversions',
      'ConversionsManyPerClick',
      'Cost',
      'CostPerConversion',
      'CostPerConversionManyPerClick',
      'CriteriaParameters',
      'Ctr',
      'CustomerDescriptiveName',
      'Date',
      'DayOfWeek',
      'DisplayName',
      'Domain',
      'ExternalCustomerId',
      'Impressions',
      'IsAutoOptimized',
      'IsBidOnPath',
      'IsPathExcluded',
      'Month',
      'MonthOfYear',
      'PrimaryCompanyName',
      'Quarter',
      'Url',
      'ValuePerConversion',
      'ValuePerConversionManyPerClick',
      'ViewThroughConversions',
      'Week',
      'Year'
    ]
    var optionsToSend = {
      select: options.fields || availableFields,
      from: reportName,
      during: options.dateRange || 'LAST_7_DAYS'
    };
    if (options.where) {
      optionsToSend.where = options.where;
    }
    if (options.and) {
      optionsToSend.and = options.and;
    }
    return self.awql(optionsToSend).send();

  };
  return this;
};

module.exports = new GoogleAdwords();
