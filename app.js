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
  this.lat = data.lat;
  this.lng = data.lng;
};


// VIEWMODEL
var ViewModel = function() {
  var self = this;
  this.currentPlace = ko.observable("2465 Latham Street, Mountain View, California");
  this.currentPlaceData = ko.observable();
  this.currentNearByPlacesMarkerOptions = ko.observableArray([]);
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
      bounds.extend(marker.getPosition());
      
      // marker click event handler
      google.maps.event.addListener(marker, 'click', (function(marker, mo) {
        return function() {
          infoWindow.setContent(marker.title);
          infoWindow.open(self.map, marker);
        };
      })(marker, mo));

      // fit bounds
      self.map.fitBounds(bounds);
    });

    console.log(bounds);
  };

  this.findNearBy = function(lat, lng, map) {
    var request = {
      location: latlng(lat, lng),
      radius: '500',
      query: 'pizza'
    };
    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(response, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // console.log(response);
        console.log('findNearBy successful');
        var i, name, address, rating, lat, lng, marker, markerOptions;
        for (i = 0; i < response.length; i++) {
          // console.log(response[i]);
          name = response[i]['name'];
          address = response[i]['formatted_address'];
          rating = response[i]['rating'];
          lat = response[i]['geometry']['location']['k'];
          lng = response[i]['geometry']['location']['D'];

          // define marker options object
          markerOptions = {};
          markerOptions.map = self.map;
          markerOptions.position = latlng(lat,lng);
          markerOptions.title = name + " " + address;

          // push marker to array
          self.currentNearByPlacesMarkerOptions.push(markerOptions);
          
          // places markers on map
          self.setNearByMarkers();

          // map.setZoom(12);
        } //for
        console.log(self.currentNearByPlacesMarkerOptions());
      } else {
        // TODO: graceful error handling
        console.log('error returning nearby places');
      }
    });
  }; //findNearBy

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

    // find nearby pizza places
    self.findNearBy(lat, lng, self.map);
  };

  // takes user input
  self.handleLocationInput = function() {
    var place = self.currentPlace();
    self.currentNearByPlacesMarkerOptions([]);
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
