var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var expect = require('chai').expect;
var authFileName = __dirname + '/test-auth.json';
var ga = require('../lib/googleadwords');
var auth = null;

describe('google-adwords', function() {

  this.timeout(30000);

  beforeEach(function(done) {
    fs.readFile(authFileName, 'utf8', function(err, results) {
      auth = JSON.parse(results);
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken
      });
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId
      });
      done();
    });
  });

  // it('should validate auth', function(done) {
  // });

  describe('ga-awql', function() {
    it('should get data from AWQL', function(done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .during(['20120101', '20150125'])
        // .during('LAST_7_DAYS')
        .send().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        })
    });
  });
  describe('ga-functions', function() {
    it('should get data from accountPerformance', function(done) {
      ga.accountPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from accountReachFrequency', function(done) {
      ga.accountReachFrequency().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from adPerformance', function(done) {
      ga.adPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from adCustomizersFeedItem', function(done) {
      ga.adCustomizersFeedItem().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from adExtensionsPerformance', function(done) {
      ga.adExtensionsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from adGroupPerformance', function(done) {
      ga.adGroupPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from adGroupReachFrequency', function(done) {
      ga.adGroupReachFrequency().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from ageRangePerformance', function(done) {
      ga.ageRangePerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from audiencePerformance', function(done) {
      ga.audiencePerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from automaticPlacementsPerformance', function(done) {
      ga.automaticPlacementsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from bidGoalPerformance', function(done) {
      ga.bidGoalPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from budgetPerformance', function(done) {
      ga.budgetPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from callMetricsCallDetails', function(done) {
      ga.callMetricsCallDetails().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignPerformance', function(done) {
      ga.campaignPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignAdScheduleTarget', function(done) {
      ga.campaignAdScheduleTarget().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignLocationTarget', function(done) {
      ga.campaignLocationTarget().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignNegativeKeywordsPerformance', function(done) {
      ga.campaignNegativeKeywordsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignNegativeLocations', function(done) {
      ga.campaignNegativeLocations().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignNegativePlacementsPerformance', function(done) {
      ga.campaignNegativePlacementsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignPlatformTarget', function(done) {
      ga.campaignPlatformTarget().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignReachFrequency', function(done) {
      ga.campaignReachFrequency().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from campaignSharedSet', function(done) {
      ga.campaignSharedSet().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from clickPerformance', function(done) {
      ga.clickPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from creativeConversion', function(done) {
      ga.creativeConversion().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from criteriaPerformance', function(done) {
      ga.criteriaPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from destinationURL', function(done) {
      ga.destinationURL().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from displayKeywordPerformance', function(done) {
      ga.displayKeywordPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from displayTopicsPerformance', function(done) {
      ga.displayTopicsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from genderPerformance', function(done) {
      ga.genderPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from geoPerformance', function(done) {
      ga.geoPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from keywordlessCategory', function(done) {
      ga.keywordlessCategory().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from keywordlessQuery', function(done) {
      ga.keywordlessQuery().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from keywordsPerformance', function(done) {
      ga.keywordsPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from paidAndOrganicQuery', function(done) {
      ga.paidAndOrganicQuery().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from placeholder', function(done) {
      ga.placeholder().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from placeholderFeedItem', function(done) {
      ga.placeholderFeedItem().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from placementPerformance', function(done) {
      ga.placementPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from productPartition', function(done) {
      ga.productPartition().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from searchQueryPerformance', function(done) {
      ga.searchQueryPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from sharedSetCriteria', function(done) {
      ga.sharedSetCriteria().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from sharedSet', function(done) {
      ga.sharedSet().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from shoppingPerformance', function(done) {
      ga.shoppingPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
    it('should get data from urlPerformance', function(done) {
      ga.urlPerformance().then(function(results) {
          console.log(results);
          expect(results).to.be.an('object');
          expect(results.report).to.be.a('string');
          expect(results.total).to.be.a('string');
          expect(results.data).to.be.an('array');
          done();
        })
        .catch(function(error) {
          console.log('ERROR', error);
          expect(false).to.equal(true);
          done(error);
        });
    })
  });

  // it('should catch an error', function(done) {

  // });

  // it('should catch an an OAuthError', function(done) {

  // });

  // it('should throw an error because of <insert issue>', function(done) {

  // });

});
