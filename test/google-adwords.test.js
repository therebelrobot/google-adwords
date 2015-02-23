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
    it('should get data from AWQL using promises', function(done) {
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
    it('should get data from AWQL using options', function(done) {
      var options = {
        select: ['Date', 'Clicks'],
        from: 'ACCOUNT_PERFORMANCE_REPORT',
        during: 'LAST_7_DAYS'
      }
      ga.awql(options).send().then(function(results) {
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

  // it('should catch an error', function(done) {

  // });

  // it('should catch an an OAuthError', function(done) {

  // });

  // it('should throw an error because of <insert issue>', function(done) {

  // });

});
