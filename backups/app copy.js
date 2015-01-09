function latlng(lat,lng) {
  return new google.maps.LatLng(lat,lng);
}

  // geocoding
  // takes placename and returns {lat,lng} object
function geocode(location, cb) {
  var requestURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4';
  $.getJSON(requestURL, function(data) {
    // the code is placed here inside the .success() function instead
    //   because it calls the cb after retriving the data.
    // if the code had been placed inside here, there would be no way to 
    //   know if the data had been returned before the cb runs.
  }).success(function(data) {
    var place = {};
    place.lat = data['results'][0]['geometry']['location']['lat'];
    place.lng = data['results'][0]['geometry']['location']['lng'];
    place.formattedAddress = data['results'][0]['formatted_address'];
    cb(place);
    console.log('geocode success');
  });
}

var Marker = function(data) {
  this.placeName = data.placeName;
  this.address = data.address;
  this.contact = data.contact;
  this.lat = data.lat;
  this.lng = data.lng;
};


// VIEWMODEL
var ViewModel = function() {
  var self = this;
  this.currentPlace = ko.observable("2465 Latham Street, Mountain View, California");
  this.currentPlaces = ko.observableArray([]);
  this.currentPlacesHtmlList = ko.observableArray([]);
  this.currentPlaceData = ko.observable(); // what is this for?
  this.currentNearByPlacesMarkerOptions = ko.observableArray([]); // should derive from currentPlaces array?
  this.numberOfNearByPlaces = ko.computed(function() {
    return this.currentNearByPlacesMarkerOptions().length;
  }, this);

  // takes an array of markerOptions inside self.currentNearByPlacesMarkerOptions()
  //  creates marker objects with each
  //  and places them on the map
  // items inside the currentNearByPlacesMarkerOptions() is generated inside this.findNearBy()
  this.setNearByMarkers = function() {
    var marker,
        bounds = new google.maps.LatLngBounds(),
        markerOptions = self.currentNearByPlacesMarkerOptions(),
        infoWindow = new google.maps.InfoWindow();
    
    markerOptions.forEach(function(mo) {
      marker = new google.maps.Marker(mo);
      bounds.extend(marker.getPosition()); // set map zoom to just adequately contain pins
      
      // marker click event handler
      google.maps.event.addListener(marker, 'click', (function(marker, mo) {
        return function() {
          infoWindow.setContent('<div class="place-wrapper"><h6 class="name">' + marker.title + '</h6><div class="address">' + marker.address + '</div></div>');
          infoWindow.open(self.map, marker);
        };
      })(marker, mo));

      // fit bounds
      self.map.fitBounds(bounds);
    });
  };

  self.createCurrentPlacesList = function() {
    var i, currentPlaces = self.currentPlaces();
    for (i = 0; i < currentPlaces.length; i++) {
      self.currentPlacesHtmlList.push(currentPlaces[i]);
    }
    console.log(self.currentPlacesHtmlList());
  };

  // Find Nearby Places with Foursquare
  this.findNearByWithFoursquare = function(lat, lng) {
    var clientSecret = 'YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ',
        clientId = 'RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP',
        query = 'pizza',
        requestURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientId + '&client_secret=' + clientSecret + '&v=20130815&ll=' + lat + ',' + lng + '&query=' + query;
        $.getJSON(requestURL, function(data) {

    // console.log(data);

    var places = data.response.venues;
    var marker = new google.maps.Marker();
    var markerOption;

    places.forEach(function(p) {
      markerOptions = {};
      markerOptions.map = self.map;
      markerOptions.position = latlng(p.location.lat, p.location.lng);
      markerOptions.title = p.name + " " + p.location.address;
      self.currentNearByPlacesMarkerOptions.push(markerOptions); // add to array of current nearby places
    });

    places.forEach(function(p) {
      place = {};
      place.name = p.name;
      place.address = p.location.address;
      p.position = latlng(p.location.lat, p.location.lng);
      self.currentPlaces.push(place); // add to array of current nearby places
    });

    self.createCurrentPlacesList();

    // set nearby markers
    self.setNearByMarkers();
    }).success(function(data) {
      console.log('success: find with foursquare :D');
      // console.log(self.currentPlaces());
    });
  };

  this.goToMarker = function() {
    console.log('goToMarker');
  };

  // the 'data' param comes from geocode()'s cb()
  // contains place {formattedAddress, lat, lng}
  self.goTo = function(data) {
    // console.log(data);
    var lat = data.lat,
        lng = data.lng;
    
    // set current place object to observable
    self.currentPlaceData(data);

    // set current address to observable
    self.currentPlace(data.formattedAddress);

    // change center of map according to data
    // todo: since we are getting multiple data, 
    // we should fit the map to bound
    self.map.setCenter( latlng(data.lat, data.lng) );

    // find nearby pizza places with Google
    // self.findNearBy(lat, lng, self.map);

    // find nearby with Foursquare
    self.findNearByWithFoursquare(lat, lng);
  };

  // takes user input
  // TODO: clear list of current places in dom before requesting new ones
  self.handleLocationInput = function() {
    var place = self.currentPlace();
    self.currentNearByPlacesMarkerOptions([]); // clear previous list
    self.currentPlaces([]);
    geocode(place, self.goTo); // geocode place and cb using goTo()
  };

  // init map
  var mapDiv, mapOptions;
  mapDiv = document.getElementById('map');
  mapOptions = {
    zoom: 9,
    center: new google.maps.LatLng(37.7831, -122.4039)
  };
  self.map = new google.maps.Map(mapDiv, mapOptions);
}; // ViewModel


ko.applyBindings( new ViewModel() );

// todo
// make currentmarkeroptions derive from current places
// click binding of current places list

// Foursquare API
// URL: https://api.foursquare.com/v2/venues/search?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&v=20130815&ll=40.7,-74&query=sushi
// Client ID
// RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP
// Client Secret
// YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ

// FINDING NEARBY PLACES
// Get the value of the user input and geocode its real address
// geocode runs and returns an object with lat/lng/formatted_address etc
// geocode takes a goTo(returnedObject) cb with the returned object as parameter
// goTo sets the lat/lng to the current place
//   and runs the findNearBy function
// findNearBy returns a list of places objects. We extract the 
//   info to make markerOption objects to be passed to
//   self.currentNearByPlacesMarkerObject

  // var initialMarkers = [
  //   {
  //     'placeName': 'Imperial',
  //     'lat': 38.7831,
  //     'lng': -122.4039
  //   },
  //   {
  //     'placeName': 'Pegasus',
  //     'lat': 38.7831,
  //     'lng': -123.4039
  //   }
  // ];

  /**
   * Sets markers to map
   * @param {array of object} Takes list of marker objects
   */
  // this.markersList = ko.observableArray([]);
  // initialMarkers.forEach(function(marker) {
  //   self.markersList.push( new Marker(marker) );
  // });


  // Find Nearby with Google Maps PlacesService
  // this.findNearBy = function(lat, lng, map) {
  //   var request = {
  //     location: latlng(lat, lng),
  //     radius: '500',
  //     query: 'pizza'
  //   };
  //   service = new google.maps.places.PlacesService(map);
  //   service.textSearch(request, function(response, status) {
  //     if (status === google.maps.places.PlacesServiceStatus.OK) {
  //       // console.log(response);
  //       console.log('findNearBy successful');
  //       var i, name, address, rating, lat, lng, marker, markerOptions;
  //       for (i = 0; i < response.length; i++) {
  //         // console.log(response[i]);
  //         name = response[i]['name'];
  //         address = response[i]['formatted_address'];
  //         rating = response[i]['rating'];
  //         lat = response[i]['geometry']['location']['k'];
  //         lng = response[i]['geometry']['location']['D'];

  //         // define marker options object
  //         markerOptions = {};
  //         markerOptions.map = self.map;
  //         markerOptions.position = latlng(lat,lng);
  //         markerOptions.title = name + " " + address;

  //         // push marker to array
  //         self.currentNearByPlacesMarkerOptions.push(markerOptions);
          
  //         // places markers on map
  //         self.setNearByMarkers();

  //       } //for
  //     } else {
  //       // TODO: graceful error handling
  //       console.log('error returning nearby places');
  //     }
  //   });
  // }; //findNearBy
