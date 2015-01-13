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
  this.msgToUser = ko.observable('Find Pizza Anywhere');

 /**
  * A placeholder for the user text field input
  *   showing the geocoded version of the
  *   current location being queried.
  */
  this.currentAddress = ko.observable("2465 Latham Street, Mountain View, CA");

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

  /**
   * An array of photo URLs of the the currently selected pizza place.
   *   Data is retrieved from Foursquare Venue API
   */
  this.currentPlacePhotos = ko.observableArray([]);

  /**
   * A text message shown to the user to indicate
   *   the progress of retrieving photos of selected venue
   */
  this.photosMessage = ko.observable();

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
    }).fail(function() {
      self.msgToUser('Oops. We could not geocode your location.');
    });
  };

 /**
  * Foursquare Venues API
  * Looks for nearby places ('venues') using Foursquare.
  * @param {lat, lng, callback}
  * @returns {}
  */
  // TODO: request timeout during poor internet
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

  // apply 'slick carousel' to the retrieved photos the selected place.
  this.slick = function() {
    $('.photos').slick({
      dots: false,
      infinite: false,
      speed: 300,
      slidesToShow: 4,
      slidesToScroll: 4,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 3,
            infinite: true,
            dots: true
          }
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });
  };

  // unslick() method is provided by slick.js to reset carousel
  this.unslick = function() {
    $('.photos').unslick();
  };

  // empty photos of currently selected place so that next photo request response
  //   will not be mixed with the previous ones.
  this.clearPhotos = function() {
    self.currentPlacePhotos([]);
  };

  // slick carousel must be reset before adding new elements to the dom
  this.resetSlick = function() {
    // it is important to unslick(), then clearPhotos()
    self.unslick();
    self.clearPhotos();

  };


  /**
   * $.getJSON() request for photo objects of selected venue
   *   using Foursquare's Venue API. Pushes the returned objects to
   *   self.currentPlacePhotos observableArray to be data-binded in the dom.
   * @param {object} parameter object is retrieved from
   *   data-bind in DOM element (the 'Photos' button)
   */
  this.getPlacePhotos = function(placeData) {

    // Shows user the progress of photo request
    self.photosMessage('Looking for photos...');

    // Since new photo elements may be added to the dom,
    //   we need to reset the slick carousel
    self.resetSlick();

    var placeId = placeData.id,
        placeName = placeData.title,
        limit = 15,
        clientSecret = 'YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ',
        clientId = 'RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP',
        requestURL = 'https://api.foursquare.com/v2/venues/' + placeId + '/photos?client_id=' + clientId + '&client_secret=' + clientSecret + '&limit=' + limit + '&v=20130815';

    // send request for photos
    $.getJSON(requestURL, function(data) {
      var photos = data.response.photos.items,
          prefix, suffix, imageUrl,
          imgSize = '200x200';

      // Shows user message dependent on length of returned photos
      if (photos.length === 0) {
        self.photosMessage('No photos found of ' + placeData.title);
      } else {
        self.photosMessage('Found ' + photos.length + ' photos of ' + placeData.title);
      }

      // push returned photo objects to an observable array
      //   to be used for data-bind
      photos.forEach(function(photo) {
        prefix = photo.prefix;
        suffix = photo.suffix;
        imageUrl = prefix + imgSize + suffix;
        self.currentPlacePhotos.push(imageUrl);
      }); // forEach end

      console.log(self.currentPlacePhotos());
      console.log('self.currentPlacePhotos().length: ' + self.currentPlacePhotos().length);

    }).success(function() {
      // apply 'slick carousel' to the currently retrieved photos
      //   upon the success of request
      self.slick();
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
      title: "You are here",
    });

    // Click event listener for the 'current location' marker
    google.maps.event.addListener(marker, 'click', (function(marker) {
      return function() {
        infoWindow.setContent('You are here');
        infoWindow.open(self.map, marker);
      };
    })(marker));
  };

 /**
  * Sets markers on map using the self.nearByPlaces() observable array
  *   as the source.
  */
  this.setNearByMarkers = function() {
    var marker,
        markerOption,
        bounds = new google.maps.LatLngBounds(),
        nearByPlaces = self.nearByPlaces();

    // Create a new marker object for each
    //   place item inside nearByPlaces() observable array
    // note: nearByPlaces() contain raw 'places' objects which are returned
    //   from the Foursquare Venue Search API
    nearByPlaces.forEach(function(place) {
      markerOption = {
        map: self.map,
        position: latlng(place.location.lat, place.location.lng),
        title: place.name,
        address: place.location.address,
        id: place.id,
        phone: place.contact.formattedPhone,
        icon: 'images/pizzaMarker.png'
      };
      // create new marker icon
      marker = new google.maps.Marker(markerOption);

      // add current marker position to the bounds
      bounds.extend(marker.getPosition());

      // For each marker, create a 'click' event handler
      //   which opens its own InfoWindow
      google.maps.event.addListener(marker, 'click', (function(marker) {
        return function() {
          var content = '<div class="place-wrapper"><h5 class="name">' + marker.title + '</h5><div class="address">' + marker.address + '</div><div class="phone">' + marker.contact + '</div></div>';
          infoWindow.setContent(content);
          infoWindow.open(self.map, marker);
        };
      })(marker));
      // set the map's bounds
      self.map.fitBounds(bounds);
    });
  };

 /**
  * Centers the map to a given marker object
  */
  this.goToMarker = function(marker) {
    console.log(marker);

    // reset slick when another marker is clicked
    self.resetSlick();

    // console.log(marker);
    self.map.setCenter(latlng(marker.position.k, marker.position.D));

    // handle situation where marker has no address or contact
    if (!marker.contact) {
      marker.contact = 'No contact available';
    }
    if (!marker.address) {
      marker.address = 'No address available';
    }

    var content = '<div class="place-wrapper"><h5 class="name">' + marker.title +
                  '</h5><div class="address">' + marker.address +
                  '</div><div class="phone">' + marker.contact + '</div></div>';
    infoWindow.setContent(content);
    infoWindow.open(self.map, marker);
  };

  // zoom into the map, centered around the 'currently selected marker'
  this.markerZoomIn = function(data) {
    self.map.setZoom(16);
  };

 /**
  * Sets current marker, address, and map center to
  *   the current address being queried by the user.
  * @param {object} the 'place' object returned by self.geocode()'s callback
  *   object format: {formattedAddress, lat, lng}
  */
  self.goTo = function(data) {
    var lat = data.lat, lng = data.lng;

    // reset slick
    // if slick carousel is opened previously,
    // this function resets it before another place is being visited
    self.resetSlick();

    // sets self.currentAddress to the geocoded value of user location query
    self.currentAddress(data.formattedAddress);

    // Puts marker on map of current address being queried and visited
    self.setCurrentLocationMarker(lat, lng);

    // // Tells user we are about to use Foursquare to find nearby places
    // self.msgToUser('Looking for pizza nearby...');

   /**
    * Uses the Foursquare Venue Search API to find places nearby
    *   given a (lat,lng) coordinate.
    * Uses a callback function which adds the 'active' class
    *   to the <li> item being clicked.
    */
    self.findNearByWithFoursquare(lat, lng, function() {
      // this callback only runs when Venue Search succeeds
      //   adds 'active' class to clicked <li>
      $('.clickable').click(function() {
        $('.clickable').removeClass('active');
        $(this).addClass("active");
      });
    });

    // centers the map around the given (lat,lng) coordinates
    self.map.setCenter(latlng(lat, lng));
  };

 /**
  * Runs on location query form submit in the UI.
  *
  */
  self.handleLocationInput = function() {

    // self.currentAddress() holds the user location query
    var addressQuery = self.currentAddress();

    // clear existing cached results before processing new query
    self.nearByMarkers([]);
    self.nearByPlaces([]);

    // Updates user on progress in real time
    self.msgToUser('Trying to understand what you\'re saying');

    // Prevents user from inputting blank value
    if (addressQuery) {
      self.geocode(addressQuery, self.goTo); // once the address is geocoded, the goTo() callback runs
    } else {
      self.msgToUser('Enter an address, neighbourhood or city...');
    }

  };

 /**
  * Instantiate Map
  */
  var mapDiv, mapOptions;
  mapDiv = document.getElementById('map');
  mapOptions = {
    zoom: 9,
    center: latlng(37.7831, -122.4039),
    disableDefaultUI: true,
    scrollwheel: false,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.LEFT_CENTER
    }
  };
  self.map = new google.maps.Map(mapDiv, mapOptions);
}; // ViewModel

ko.applyBindings( new ViewModel() );

// todo
// use setTimeout to handle long lost requests