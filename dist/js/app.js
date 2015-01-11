function latlng(e,o){return new google.maps.LatLng(e,o)}var infoWindow=new google.maps.InfoWindow,ViewModel=function(){var e=this;this.msgToUser=ko.observable("Where are we eating?"),this.currentAddress=ko.observable("Upper Manhattan, NY"),this.nearByPlaces=ko.observableArray([]),this.nearByMarkers=ko.observableArray([]),this.numOfNearByPlaces=ko.computed(function(){return this.nearByPlaces().length},this),this.currentPlaceImages=ko.observableArray([]),this.geocode=function(e,o){var n="https://maps.googleapis.com/maps/api/geocode/json?address="+e+"&key=AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4";$.getJSON(n,function(){}).success(function(e){var n={};n.lat=e.results[0].geometry.location.lat,n.lng=e.results[0].geometry.location.lng,n.formattedAddress=e.results[0].formatted_address,o(n)})},this.findNearByWithFoursquare=function(o,n,a){var t,s="YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ",r="RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP",i="pizza",l="https://api.foursquare.com/v2/venues/search?client_id="+r+"&client_secret="+s+"&v=20130815&ll="+o+","+n+"&query="+i;e.msgToUser("Looking for pizza nearby..."),$.getJSON(l,function(o){t=o.response.venues,t.forEach(function(o){e.nearByMarkers.push(new google.maps.Marker({map:e.map,position:latlng(o.location.lat,o.location.lng),title:o.name,address:o.location.address,city:o.location.city,contact:o.contact.formattedPhone,url:o.url,id:o.id})),e.nearByPlaces.push(o)})}).success(function(){t.length>0?(e.msgToUser("We found "+e.numOfNearByPlaces()+" pizza places nearby!"),e.setNearByMarkers(),a&&a()):e.msgToUser("No pizza here. Try another location")})},this.getPlacePhotos=function(o){e.currentPlaceImages([]);var n=o.id,a="YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ",t="RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP",s="https://api.foursquare.com/v2/venues/"+n+"/photos?client_id="+t+"&client_secret="+a+"&limit=5&v=20130815";$.getJSON(s,function(o){var n,a,t,s=o.response.photos.items,r="300x300";s.forEach(function(o){console.log(o),n=o.prefix,a=o.suffix,t=n+r+a,e.currentPlaceImages.push(t)}),console.log(e.currentPlaceImages())})},this.setCurrentLocationMarker=function(o,n){var a=new google.maps.Marker({map:e.map,position:latlng(o,n),title:"You are here"});google.maps.event.addListener(a,"click",function(o){return function(){infoWindow.setContent("You are here"),infoWindow.open(e.map,o)}}(a))},this.setNearByMarkers=function(){var o,n,a=new google.maps.LatLngBounds,t=e.nearByPlaces();t.forEach(function(t){n={map:e.map,position:latlng(t.location.lat,t.location.lng),title:t.name,address:t.location.address,id:t.id},o=new google.maps.Marker(n),o.setIcon("images/pizzaMarker.png"),a.extend(o.getPosition()),google.maps.event.addListener(o,"click",function(o){return function(){var n='<div class="place-wrapper"><h5 class="name">'+o.title+'</h5><div class="address">'+o.address+"</div></div>";infoWindow.setContent(n),infoWindow.open(e.map,o)}}(o)),e.map.fitBounds(a)})},this.goToMarker=function(o){console.log(o),e.map.setCenter(latlng(o.position.k,o.position.D));var n='<div class="place-wrapper"><h5 class="name">'+o.title+'</h5><div class="address">'+o.address+"</div></div>";infoWindow.setContent(n),infoWindow.open(e.map,o)},this.markerZoomIn=function(){e.map.setZoom(16)},e.goTo=function(o){var n=o.lat,a=o.lng;e.currentAddress(o.formattedAddress),e.setCurrentLocationMarker(n,a),e.findNearByWithFoursquare(n,a,function(){console.log("nearByPlaces"),console.log(e.nearByPlaces()),console.log("nearByMarkers"),console.log(e.nearByMarkers()),$(".clickable").click(function(){$(".clickable").removeClass("active"),$(this).addClass("active")})}),e.map.setCenter(latlng(n,a))},e.handleLocationInput=function(){var o=e.currentAddress();e.nearByMarkers([]),e.nearByPlaces([]),e.msgToUser("Geocoding your location query..."),o?e.geocode(o,e.goTo):e.msgToUser("Enter an address, neighbourhood or city...")};var o,n;o=document.getElementById("map"),n={zoom:9,center:latlng(37.7831,-122.4039),disableDefaultUI:!0,zoomControl:!0,zoomControlOptions:{style:google.maps.ZoomControlStyle.LARGE,position:google.maps.ControlPosition.LEFT_CENTER}},e.map=new google.maps.Map(o,n)};ko.applyBindings(new ViewModel);