/**
 * latlng utility function for shortening code
 *   since it is frequently used below
 * @params {num, num}
 * @returns google.maps.LatLng() object
 */
function latlng(lat,lng) {
  return new google.maps.LatLng(lat,lng);
}

/**
 * InfoWindow Object
 *  Defined in the global scope to be accessible by various functions easily
 */
var infoWindow = new google.maps.InfoWindow();


var ViewModel = function() {

 /**
  * self is used by child methods
  *   to refer to the root object easily
  */
  var self = this;

 /**
  * A dynamic message shown to the user in the UI
  *   depending on what the app is currently doing
  */
  this.msgToUser = ko.observable('Where are we eating?');

 /**
  * A placeholder for the user text field input
  *   showing the geocoded version of the
  *   current location being queried.
  */
  this.currentAddress = ko.observable("Upper Manhattan, NY");

 /**
  * An array of 'place' JSON objects returned by the
  *   Foursquare API, given a location query.
  *   Used for generating list of nearby places in UI.
  */
  this.nearByPlaces = ko.observableArray([]);

 /**
  * An array of google.maps.Marker() objects
  *   used by self.setNearByMarkers() to set
  *   markers on the map.
  */
  this.nearByMarkers = ko.observableArray([]);

 /**
  * The number of nearby places returned by Foursquare
  */
  this.numOfNearByPlaces = ko.computed(function() {
    return this.nearByPlaces().length;
  }, this);

  this.currentPlaceImages = ko.observableArray([]);

  // this.currentGoogleStreetImageUrl  = ko.observable();


 /**
  * Google's Geocoding API
  *   geocodes user's address query
  * @param {string, callback}
  * @returns {object} returns object given an address string
  */
  // TODO: fail gracefully

  this.geocode = function(location, callback) {
    var requestURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4';
    $.getJSON(requestURL, function(data) {
      // shouldn't something go here?
    }).success(function(data) {

      // Create a custom place object using returned data
      var place = {};
      place.lat = data['results'][0]['geometry']['location']['lat'];
      place.lng = data['results'][0]['geometry']['location']['lng'];
      place.formattedAddress = data['results'][0]['formatted_address'];

    /**
      * Callback function runs callback function only after 'place' object is processed
      *   This callback function is self.goTo()
      */
      callback(place);
    });
  };

 /**
  * Foursquare Venues API
  * Looks for nearby places ('venues') using Foursquare.
  * @param {lat, lng, callback}
  * @returns {}
  */
  this.findNearByWithFoursquare = function(lat, lng, callback) {
    var clientSecret = 'YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ',
        clientId = 'RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP',
        query = 'pizza',
        requestURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientId + '&client_secret=' + clientSecret + '&v=20130815&ll=' + lat + ',' + lng + '&query=' + query,
        markerOption,
        foursquareNearByPlaces;

    // Tells user we are about to use Foursquare to find nearby places
    self.msgToUser('Looking for pizza nearby...');

    $.getJSON(requestURL, function(data) {

      // list of places objects returned
      foursquareNearByPlaces = data.response.venues;


      /**
       * push places objects to both observable arrays:
       *   self.nearByMarkers() and self.nearByPlaces()
       */
      foursquareNearByPlaces.forEach(function(p) {

        // push marker objects to self.nearByMarkers()
        self.nearByMarkers.push(new google.maps.Marker({
          map: self.map,
          position: latlng(p.location.lat, p.location.lng),
          title: p.name,
          address: p.location.address,
          city: p.location.city,
          contact: p.contact.formattedPhone,
          // menu: p.menu.url || null,
          url: p.url,
          id: p.id
        }));

        // push place objects to self.nearByPlaces()
        self.nearByPlaces.push(p);
    });

    }).success(function(data) {
      if (foursquareNearByPlaces.length > 0) {
        self.msgToUser('We found ' + self.numOfNearByPlaces() + ' pizza places nearby!');
        self.setNearByMarkers();

        // used for setting 'active' class to clicked <li> dom element
        if (callback) {
          callback();
        }

      } else {
        // handle no results
        self.msgToUser('No pizza here. Try another location');
      }

    });
  };

  // this.testing = function(data) {
  //   console.log(data);
  // };

  this.getPlacePhotos = function(placeData) {
    self.currentPlaceImages([]);
    var placeId = placeData.id;
    var clientSecret = 'YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ',
    clientId = 'RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP',
    requestURL = 'https://api.foursquare.com/v2/venues/' + placeId + '/photos?client_id=' + clientId + '&client_secret=' + clientSecret + '&limit=5&v=20130815';

    $.getJSON(requestURL, function(data) {
      var photos = data.response.photos.items,
          prefix, suffix, imageUrl,
          imgSize = '300x300';

      // console.log(photos);

      photos.forEach(function(photo) {
        console.log(photo);
        prefix = photo.prefix;
        suffix = photo.suffix;
        imageUrl = prefix + imgSize + suffix;
        self.currentPlaceImages.push(imageUrl);
      });

      console.log(self.currentPlaceImages());

    });
  };

 /**
  * Sets 'current location' marker on map,
  *   determined by user query.
  */
  this.setCurrentLocationMarker = function(lat, lng) {
    var marker = new google.maps.Marker({
      map: self.map,
      position: latlng(lat,lng),
      title: "You are here"
    });

    google.maps.event.addListener(marker, 'click', (function(marker) {
      return function() {
        infoWindow.setContent('You are here');
        infoWindow.open(self.map, marker);
      };
    })(marker));
  };

 /**
  * Sets markers on map using the self.nearByPlaces() observable array.
  *
  */
  this.setNearByMarkers = function() {
    var marker,
        markerOption,
        bounds = new google.maps.LatLngBounds(),
        nearByPlaces = self.nearByPlaces();

    nearByPlaces.forEach(function(place) {
      markerOption = {
        map: self.map,
        position: latlng(place.location.lat, place.location.lng),
        title: place.name,
        address: place.location.address,
        id: place.id
      };

      marker = new google.maps.Marker(markerOption);
      marker.setIcon('images/pizzaMarker.png');

      // console.log(marker);

      bounds.extend(marker.getPosition()); // set map zoom to just adequately contain pins


      // marker click event handler
      google.maps.event.addListener(marker, 'click', (function(marker) {
        return function() {
        var content = '<div class="place-wrapper"><h5 class="name">' + marker.title + '</h5><div class="address">' + marker.address + '</div></div>';
          infoWindow.setContent(content);
          infoWindow.open(self.map, marker);
        };
      })(marker));
      // fit bounds
      self.map.fitBounds(bounds);
    });
  };

 /**
  *
  *
  */
  // goes to marker position when a corresponding place is clicked
  this.goToMarker = function(marker) {
    console.log(marker);
    self.map.setCenter(latlng(marker.position.k, marker.position.D));
    var content = '<div class="place-wrapper"><h5 class="name">' + marker.title +
                  '</h5><div class="address">' + marker.address +
                  '</div></div>';
    infoWindow.setContent(content);
    infoWindow.open(self.map, marker);
  };

  this.markerZoomIn = function(data) {
    self.map.setZoom(16);
  };

  // this.markerZoomOut = function(data) {
  //   self.map.setZoom(self.map.zoom - 1);
  // };


  // this.getGoogleStreetImg = function(markerData) {
  //   console.log(markerData);
  //   var apiKey = 'AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4';
  //   var lat = markerData.position.k;
  //   var lng = markerData.position.D;
  //   var requestURL = 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + lat + ',' + lng + '&key=' + apiKey;
  //   console.log(requestURL);
  //   self.currentGoogleStreetImageUrl(requestURL);
  //   console.log(self.currentGoogleStreetImageUrl());
  //   // return requestURL;
  // };

 /**
  * Sets current marker, address, and map center to
  *   the current address being queried by the user.
  * @param {object} the 'place' object returned by self.geocode()'s callback
  *   object format: {formattedAddress, lat, lng}
  */
  self.goTo = function(data) {
    var lat = data.lat, lng = data.lng;

    // updates self.currentAddress value (user input field value)
    self.currentAddress(data.formattedAddress);

    // Puts marker on map of current address being queried and visited
    self.setCurrentLocationMarker(lat, lng);

    // // Tells user we are about to use Foursquare to find nearby places
    // self.msgToUser('Looking for pizza nearby...');

   /**
    *
    *
    *
    */
    self.findNearByWithFoursquare(lat, lng, function() {

      console.log('nearByPlaces');
      console.log(self.nearByPlaces());

      console.log('nearByMarkers');
      console.log(self.nearByMarkers());

      // only runs when findNearByWithFourSquare succeeds
      // adds 'active' class to clicked <li>
      $('.clickable').click(function() {
        $('.clickable').removeClass('active');
        $(this).addClass("active");
      });
    });

    // goes to (data.lat, data.lng)
    self.map.setCenter(latlng(lat, lng));
  };

 /**
  *
  *
  */
  self.handleLocationInput = function() {
    var addressQuery = self.currentAddress();

    // clear existing results before processing new query
    self.nearByMarkers([]);
    self.nearByPlaces([]);

    // Tells the user we are geocoding
    self.msgToUser('Geocoding your location query...');

    if (addressQuery) {
      self.geocode(addressQuery, self.goTo);
    } else {
      self.msgToUser('Enter an address, neighbourhood or city...');
    }
    // once the address is geocoded, the goTo() callback runs

  };

  // testing get photo request
  // self.getPlacePhotos('4af216e7f964a520d0e521e3');
  // https://api.foursquare.com/v2/venues/49781819/photos?client_id=RPH01ZJ1WAGI…&client_secret=YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ&v=20130815
  // https://api.foursquare.com/v2/venues/43695300f964a5208c291fe3/photos?client_id=RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP&client_secret=YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ&v=20150110

 /**
  *
  *
  */
  // init map
  var mapDiv, mapOptions;
  mapDiv = document.getElementById('map');
  mapOptions = {
    zoom: 9,
    center: latlng(37.7831, -122.4039),
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.LEFT_CENTER
    }
  };
  self.map = new google.maps.Map(mapDiv, mapOptions);
}; // ViewModel


ko.applyBindings( new ViewModel() );

// google api key: AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4

// todo
// change marker style to indicate select state
// additional data about the location

// readme file
// undefined address on marker is ugly

// rsources
// pizza icon: http://www.orderup.com.au/wp-content/uploads/2014/01/pizza_icon.png