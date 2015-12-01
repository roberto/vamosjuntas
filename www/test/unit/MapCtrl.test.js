//
describe('MapCtrl', function () {
  var controller, stateMock, geolocationMock, currentPositionMock;

  // load module app
  beforeEach(module('starter'));

  // disable template caching
	beforeEach(module(function($provide, $urlRouterProvider) {
    $provide.value('$ionicTemplateCache', function(){} );
    $urlRouterProvider.deferIntercept();
	}));

  beforeEach(
    inject(function($controller, _$rootScope_) {
      $rootScope = _$rootScope_;

      currentPositionMock = jasmine.createSpyObj('getCurrentPosition spy', ['then']);

      //mocking cordova geolocation
      geolocationMock = {
        getCurrentPosition: function () {
          return currentPositionMock;
        }
      };
      spyOn(geolocationMock, 'getCurrentPosition').and.callThrough();

      // instantiate MapCtrl
      controller = $controller('MapCtrl', { 
        '$scope': $rootScope,
        '$state': null, 
        '$cordovaGeolocation': geolocationMock }
       );
    })
  );

  // simple example to start (don't calling then)
  it('gets current position', function () {
    expect(geolocationMock.getCurrentPosition).toHaveBeenCalledWith({
      timeout: 10000,
      enableHighAccuracy: true
    });
  });

  describe('failure getting position', function () {
    var failureCallback;

    beforeEach(function () {
      spyOn(console, 'log');
      failureCallback = currentPositionMock.then.calls.mostRecent().args[1];
      failureCallback();
    });

    it('logs "Could not get location"', function () {
      expect(console.log).toHaveBeenCalledWith('Could not get location');
    });
  });

  describe('success getting position', function () {
    var successCallback, position, originalGoogle;

    beforeEach(function () {
      successCallback = currentPositionMock.then.calls.mostRecent().args[0];

      // google maps API
      // (alternative: https://github.com/sttts/google-maps-mock/blob/master/google-maps-mock.js)
      // we can move this to other file for sharing among tests (and don't care about the original one)
      originalGoogle = window.google;
      window.google = {
        maps: {
          Map: function () { return {fake: 'map'} },
          Marker: function () { },
          LatLng: function (latitude, longitude) {
            return [latitude, longitude]; 
          },
          event: {
            addListenerOnce: function () {}
          }
        }
      };

      position = {
        coords: {
          latitude: 100,
          longitude: 200
        }
      };
    });

    afterEach(function () {
      window.google = originalGoogle;
    });

    it('creates a map with zoom 15 and centered on current position', function () {
      // I don't know why this is not working...
      //var mapDiv = document.createElement('div');
      //mapDiv.setAttribute('id', 'map');
      //fallback:
      spyOn(document, 'getElementById').and.callFake(function (id) {
        if (id === 'map') return 'fake-div-map';
      });
      spyOn(google.maps, 'Map');

      successCallback(position);
      expect(google.maps.Map).toHaveBeenCalledWith('fake-div-map', {center: [100, 200], zoom: 15});
    });

    it('creates a marker when the map is ready', function () {
      var callback;
      spyOn(google.maps.event, 'addListenerOnce');
      spyOn(google.maps, 'Marker');

      successCallback(position);
      
      callback = google.maps.event.addListenerOnce.calls.mostRecent().args[2];
      callback();

      expect(google.maps.Marker).toHaveBeenCalledWith({map: {fake: 'map'}, position: [100, 200]});
    });
  });
});
