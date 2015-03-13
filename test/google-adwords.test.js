var _ = require('lodash')
var fs = require('fs')
var expect = require('chai').expect
var authFileName = __dirname + '/test-auth.json'
var ga = require('../lib/googleadwords')
var auth = null
var auth2 = null

/* JS Standard definitions */
/* globals describe, beforeEach, it */

describe('google-adwords', function () {
  this.timeout(5000)
  beforeEach(function (done) {
    fs.readFile(authFileName, 'utf8', function (err, results) {
      if (err) throw new Error(err)
      auth = JSON.parse(results)
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken
      })
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId
      })
      done()
    })
  })
  describe('ga-awql', function () {
    it('should get data from AWQL using promises (w/arrays)', function (done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using promises (w/strings)', function (done) {
      ga.awql()
        .select('Date,Clicks')
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .during('20120101,20150125')
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using options (w/arrays)', function (done) {
      var options = {
        select: ['Date', 'Clicks'],
        from: 'ACCOUNT_PERFORMANCE_REPORT',
        during: ['20120101', '20150125']
      }
      ga.awql(options).send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using options (w/strings)', function (done) {
      var options = {
        select: 'Date,Clicks',
        from: 'ACCOUNT_PERFORMANCE_REPORT',
        during: 'LAST_7_DAYS'
      }
      ga.awql(options).send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })

    it('should get data from AWQL using string', function (done) {
      ga.awql('SELECT Date, Clicks FROM ACCOUNT_PERFORMANCE_REPORT DURING 20120101, 20150125').send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using promises (w/WHERE clause)', function (done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using promises (w/WHERE and AND(string) clauses)', function (done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using promises (w/WHERE and AND(array) clauses)', function (done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and(['Clicks<150', 'Clicks!=110'])
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using options (w/WHERE and AND(promises) clauses)', function (done) {
      ga.awql({
          select: ['Date', 'Clicks'],
          from: 'ACCOUNT_PERFORMANCE_REPORT',
          where: 'Clicks>100',
          and: ['Clicks<150', 'Clicks!=110'],
          during: ['20120101', '20150125']
        }).send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          console.log(error)
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using promises (w/WHERE and AND(promises) clauses)', function (done) {
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          auth.user.accessToken = results.auth.accessToken
          auth.user.tokenExpires = results.auth.tokenExpires
          auth2 = _.cloneDeep(auth)
          done()
        })
        .catch(function (error) {
          expect(false).to.equal(true)
          done(error)
        })
    })
    it('should get data from AWQL using previous auth token', function (done) {
      ga.use({
        accessToken: auth2.user.accessToken,
        tokenExpires: auth2.user.tokenExpires,
        refreshToken: auth2.user.refreshToken,
        clientCustomerID: auth2.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(results).to.be.an('object')
          expect(results.report).to.be.a('string')
          expect(results.total).to.be.a('string')
          expect(results.data).to.be.an('array')
          done()
        })
        .catch(function (error) {
          console.log(error)
          expect(false).to.equal(true)
          done(error)
        })
    })

    it('should error out on bad clientID', function (done) {
      ga.use({
        clientID: auth.clientID + 'TRASH',
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken
      })
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on bad clientSecret', function (done) {
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret + 'RUBBISH',
        developerToken: auth.developerToken
      })
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on bad developerToken', function (done) {
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken + 'GARBAGE'
      })
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on bad refreshToken', function (done) {
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken
      })
      ga.use({
        refreshToken: auth.user.refreshToken + 'GARBAGE',
        clientCustomerID: auth.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on bad clientCustomerId', function (done) {
      ga.use({
        clientID: auth.clientID,
        clientSecret: auth.clientSecret,
        developerToken: auth.developerToken
      })
      ga.use({
        refreshToken: auth.user.refreshToken,
        clientCustomerID: auth.user.clientCustomerId + 'GARBAGE'
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on invalid access token', function (done) {
      ga.use({
        accessToken: auth2.user.accessToken + 'TRASH',
        tokenExpires: auth2.user.tokenExpires,
        refreshToken: auth2.user.refreshToken,
        clientCustomerID: auth2.user.clientCustomerId
      })
      ga.awql()
        .select(['Date', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on invalid field selected', function (done) {
      ga.use({
        accessToken: auth2.user.accessToken,
        tokenExpires: auth2.user.tokenExpires,
        refreshToken: auth2.user.refreshToken,
        clientCustomerID: auth2.user.clientCustomerId
      })
      ga.awql()
        .select(['DateRUBBISH', 'Clicks'])
        .from('ACCOUNT_PERFORMANCE_REPORT')
        .where('Clicks>100')
        .and('Clicks<150')
        .and('Clicks!=110')
        .during(['20120101', '20150125'])
        .send().then(function (results) {
          expect(false).to.equal(true)
          done()
        })
        .catch(function (error) {
          if (error) done()
        })
    })
    it('should error out on malformed client use options (wrong fields)', function (done) {
      try {
        ga.use({
          client: auth.clientID,
          clientS: auth.clientSecret,
          developerT: auth.developerToken
        })
        ga.use({
          refreshToken: auth.user.refreshToken,
          clientCustomerID: auth.user.clientCustomerId
        })
        ga.awql()
          .select(['Date', 'Clicks'])
          .from('ACCOUNT_PERFORMANCE_REPORT')
          .where('Clicks>100')
          .and('Clicks<150')
          .and('Clicks!=110')
          .during(['20120101', '20150125'])
          .send().then(function (results) {
            expect(false).to.equal(true)
            done()
          })
          .catch(function (error) {
            if (error) done()
          })
      } catch (e) {
        if (e) done()
      }
    })
    it('should error out on malformed user use options', function (done) {
      try {
        ga.use({
          clientID: auth.clientID,
          clientSecret: auth.clientSecret,
          developerToken: auth.developerToken
        })
        ga.use({
          refreshT: auth.user.refreshToken,
          clientC: auth.user.clientCustomerId
        })
        ga.awql()
          .select(['Date', 'Clicks'])
          .from('ACCOUNT_PERFORMANCE_REPORT')
          .where('Clicks>100')
          .and('Clicks<150')
          .and('Clicks!=110')
          .during(['20120101', '20150125'])
          .send().then(function (results) {
            expect(false).to.equal(true)
            done()
          })
          .catch(function (error) {
            if (error) done()
          })
      } catch (e) {
        if (e) done()
      }
    })
    it('should error out on malformed use options (no options)', function (done) {
      try {
        ga.use()
        ga.awql()
          .select(['Date', 'Clicks'])
          .from('ACCOUNT_PERFORMANCE_REPORT')
          .where('Clicks>100')
          .and('Clicks<150')
          .and('Clicks!=110')
          .during(['20120101', '20150125'])
          .send().then(function (results) {
            expect(false).to.equal(true)
            done()
          })
          .catch(function (error) {
            if (error) done()
          })
      } catch (e) {
        if (e) done()
      }
    })
    it('should error out on malformed use options (string input)', function (done) {
      try {
        ga.use('THIS WILL BREAK')
        ga.awql()
          .select(['Date', 'Clicks'])
          .from('ACCOUNT_PERFORMANCE_REPORT')
          .where('Clicks>100')
          .and('Clicks<150')
          .and('Clicks!=110')
          .during(['20120101', '20150125'])
          .send().then(function (results) {
            expect(false).to.equal(true)
            done()
          })
          .catch(function (error) {
            if (error) done()
          })
      } catch (e) {
        if (e) done()
      }
    })
  })
})
