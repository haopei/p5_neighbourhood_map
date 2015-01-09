function latlng(lat,lng) {
  return new google.maps.LatLng(lat,lng);
}

// global infowindow
var infoWindow = new google.maps.InfoWindow();

// VIEWMODEL
var ViewModel = function() {
  var self = this;
  this.msgToUser = ko.observable("Pizza Anywhere!");
  this.currentAddress = ko.observable("Georgetown Guyana");
  
  // a list of 'place' objects
  this.nearByPlaces = ko.observableArray([]);

  // used by goToMarker()
  this.nearByMarkers = ko.observableArray([]);
  
  this.numOfNearByPlaces = ko.computed(function() {
    return this.nearByMarkers().length;
  }, this);


  // geocoding
  // TODO: fail gracefully
  // takes placename and returns {lat,lng} object
  this.geocode = function(location, cb) {
    var requestURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4';
    $.getJSON(requestURL, function(data) {
      self.msgToUser('Geocoding your location query...');
    }).success(function(data) {
      var place = {};
      place.lat = data['results'][0]['geometry']['location']['lat'];
      place.lng = data['results'][0]['geometry']['location']['lng'];
      place.formattedAddress = data['results'][0]['formatted_address'];
      cb(place);
      console.log('geocode success');
    });
  };

  // Find NearbyPlaces with Foursquare
  this.findNearByWithFoursquare = function(lat, lng) {
    var clientSecret = 'YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ',
        clientId = 'RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP',
        query = 'pizza',
        requestURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientId + '&client_secret=' + clientSecret + '&limit=20&v=20130815&ll=' + lat + ',' + lng + '&query=' + query,
        markerOption,
        foursquareNearByPlaces;
    
    $.getJSON(requestURL, function(data) {
      foursquareNearByPlaces = data.response.venues;
      foursquareNearByPlaces.forEach(function(p) {
      console.log(p);
      // push marker objects to self.nearByMarkers
      self.nearByMarkers.push(new google.maps.Marker({
        map: self.map,
        position: latlng(p.location.lat, p.location.lng),
        title: p.name,
        address: p.location.address,
        url: p.url
      }));

      // push place objects to self.nearByPlaces
      self.nearByPlaces.push(p);
    });

    }).success(function(data) {
      if (foursquareNearByPlaces.length > 0) {
        self.msgToUser('We found ' + self.numOfNearByPlaces() + ' pizza places nearby!');
        console.log('success: find with foursquare :D');
        self.setNearByMarkers();
      } else {
        self.msgToUser('No pizza here. Try another location');
      }

    });
  };

  this.setMarker = function(lat, lng) {
    var marker = new google.maps.Marker({
      map: self.map,
      position: latlng(lat,lng),
      title: "You are here"
      // icon: {url: 'images/greenMarker.png'}
    });

    google.maps.event.addListener(marker, 'click', (function(marker) {
      return function() {
        infoWindow.setContent('You are here');
        infoWindow.open(self.map, marker);
      };
    })(marker));
  };

  this.setNearByMarkers = function() {
    var marker,
        markerOption,
        bounds = new google.maps.LatLngBounds(),
        // infoWindow = new google.maps.InfoWindow(),
        nearByPlaces = self.nearByPlaces();

    // console.log(self.nearByPlaces());
    
    nearByPlaces.forEach(function(place) {
      markerOption = {
        map: self.map,
        position: latlng(place.location.lat, place.location.lng),
        title: place.name,
        address: place.location.address,
        icon: 'images/pizzaMarker.png'
      };
      marker = new google.maps.Marker(markerOption);
      
      // console.log(marker);

      bounds.extend(marker.getPosition()); // set map zoom to just adequately contain pins
      
      // marker click event handler
      google.maps.event.addListener(marker, 'click', (function(marker) {
        return function() {
          console.log(marker);
          infoWindow.setContent('<div class="place-wrapper"><h5 class="name">' + marker.title + '</h5><div class="address">' + marker.address + '</div></div>');
          infoWindow.open(self.map, marker);
        };
      })(marker));

      // fit bounds
      self.map.fitBounds(bounds);
    });
  };

  // goes to marker position when a corresponding place is clicked
  this.goToMarker = function(marker) {
    self.map.setCenter(latlng(marker.position.k, marker.position.D));
    infoWindow.setContent('<div class="place-wrapper"><h5 class="name">' + marker.title + '</h5><div class="address">' + marker.address + '</div></div>');
    infoWindow.open(self.map, marker);
  };

  // the 'data' param comes from geocode()'s cb()
  // contains place {formattedAddress, lat, lng}
  self.goTo = function(data) {
    var lat = data.lat, lng = data.lng;

    // set currentAddress to be used by geocode()
    self.currentAddress(data.formattedAddress);

    // set current location being visited
    self.setMarker(lat, lng);

    // find nearby with Foursquare
    self.msgToUser('Looking for nearby places...');
    self.findNearByWithFoursquare(lat, lng);

    // goes to (data.lat, data.lng)
    self.map.setCenter(latlng(lat, lng));

  };

  self.handleLocationInput = function() {
    var addressQuery = self.currentAddress();

    // clear existing results before processing new query
    self.nearByMarkers([]);
    self.nearByPlaces([]);
    
    // once the address is geocoded, the goTo() callback runs
    self.geocode(addressQuery, self.goTo);
  };

  // init map
  var mapDiv, mapOptions;
  mapDiv = document.getElementById('map');
  mapOptions = {
    zoom: 9,
    center: latlng(37.7831, -122.4039),
    disableDefaultUI: true
  };
  self.map = new google.maps.Map(mapDiv, mapOptions);
}; // ViewModel


ko.applyBindings( new ViewModel() );

// todo
// undefined address on marker is ugly
// make currentmarkeroptions derive from current places
// click binding of current places list

// rsources
// pizza icon: http://www.orderup.com.au/wp-content/uploads/2014/01/pizza_icon.png