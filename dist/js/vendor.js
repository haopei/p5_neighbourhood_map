function latlng(e,o){return new google.maps.LatLng(e,o)}var infoWindow=new google.maps.InfoWindow,ViewModel=function(){var e=this;this.msgToUser=ko.observable("Find Pizza Anywhere"),this.currentAddress=ko.observable("2465 Latham Street, Mountain View, CA"),this.nearByPlaces=ko.observableArray([]),this.nearByMarkers=ko.observableArray([]),this.numOfNearByPlaces=ko.computed(function(){return this.nearByPlaces().length},this),this.currentPlacePhotos=ko.observableArray([]),this.photosMessage=ko.observable(),this.geocode=function(o,t){var s="https://maps.googleapis.com/maps/api/geocode/json?address="+o+"&key=AIzaSyB6tnYAqdRsoSx6iA5m7OV0cdtsGktBtD4";$.getJSON(s,function(){}).success(function(e){var o={};o.lat=e.results[0].geometry.location.lat,o.lng=e.results[0].geometry.location.lng,o.formattedAddress=e.results[0].formatted_address,t(o)}).fail(function(){e.msgToUser("Oops. We could not geocode your location.")})},this.findNearByWithFoursquare=function(o,t,s){var n,a="YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ",i="RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP",r="pizza",l="https://api.foursquare.com/v2/venues/search?client_id="+i+"&client_secret="+a+"&v=20130815&ll="+o+","+t+"&query="+r;e.msgToUser("Looking for pizza nearby..."),$.getJSON(l,function(o){n=o.response.venues,n.forEach(function(o){e.nearByMarkers.push(new google.maps.Marker({map:e.map,position:latlng(o.location.lat,o.location.lng),title:o.name,address:o.location.address,city:o.location.city,contact:o.contact.formattedPhone,icon:"images/pizzaMarker.png",url:o.url,id:o.id})),e.nearByPlaces.push(o)})}).success(function(){n.length>0?(e.msgToUser("We found "+e.numOfNearByPlaces()+" pizza places nearby!"),e.setNearByMarkers(),s&&s()):e.msgToUser("No pizza here. Try another location")})},this.slick=function(){$(".photos").slick({dots:!1,infinite:!1,speed:300,slidesToShow:4,slidesToScroll:4,responsive:[{breakpoint:1024,settings:{slidesToShow:3,slidesToScroll:3,infinite:!0,dots:!0}},{breakpoint:600,settings:{slidesToShow:2,slidesToScroll:2}},{breakpoint:480,settings:{slidesToShow:1,slidesToScroll:1}}]})},this.unslick=function(){$(".photos").unslick()},this.clearPhotos=function(){e.currentPlacePhotos([])},this.resetSlick=function(){e.unslick(),e.clearPhotos()},this.getPlacePhotos=function(o){e.photosMessage("Looking for photos..."),e.resetSlick();var t=o.id,s=(o.title,15),n="YW0AAODCCRPPNDUKKQ1KPTDUEERZV3CUSPUMD3FLEUUJP1XQ",a="RPH01ZJ1WAGIPXB3CDAA12ES4CKL10X24XH4FN0TKX21EJFP",i="https://api.foursquare.com/v2/venues/"+t+"/photos?client_id="+a+"&client_secret="+n+"&limit="+s+"&v=20130815";$.getJSON(i,function(t){var s,n,a,i=t.response.photos.items,r="200x200";e.photosMessage(0===i.length?"No photos found of "+o.title:"Found "+i.length+" photos of "+o.title),i.forEach(function(o){s=o.prefix,n=o.suffix,a=s+r+n,e.currentPlacePhotos.push(a)})}).success(function(){e.slick()})},this.setCurrentLocationMarker=function(o,t){var s=new google.maps.Marker({map:e.map,position:latlng(o,t),title:"You are here"});google.maps.event.addListener(s,"click",function(o){return function(){infoWindow.setContent("You are here"),infoWindow.open(e.map,o)}}(s))},this.setNearByMarkers=function(){var o,t,s=new google.maps.LatLngBounds,n=e.nearByPlaces();n.forEach(function(n){t={map:e.map,position:latlng(n.location.lat,n.location.lng),title:n.name,address:n.location.address,id:n.id,phone:n.contact.formattedPhone,icon:"images/pizzaMarker.png"},o=new google.maps.Marker(t),s.extend(o.getPosition()),google.maps.event.addListener(o,"click",function(o){return o.contact||(o.contact="No contact available"),o.address||(o.address="No address available"),function(){var t='<div class="place-wrapper"><h5 class="name">'+o.title+'</h5><div class="address">'+o.address+'</div><div class="phone">'+o.contact+"</div></div>";infoWindow.setContent(t),infoWindow.open(e.map,o)}}(o)),e.map.fitBounds(s)})},this.goToMarker=function(o){e.resetSlick(),e.map.setCenter(latlng(o.position.lat(),o.position.lng())),o.contact||(o.contact="No contact available"),o.address||(o.address="No address available");var t='<div class="place-wrapper"><h5 class="name">'+o.title+'</h5><div class="address">'+o.address+'</div><div class="phone">'+o.contact+"</div></div>";infoWindow.setContent(t),infoWindow.open(e.map,o)},this.markerZoomIn=function(){e.map.setZoom(16)},e.goTo=function(o){var t=o.lat,s=o.lng;e.resetSlick(),e.currentAddress(o.formattedAddress),e.setCurrentLocationMarker(t,s),e.findNearByWithFoursquare(t,s,function(){$(".clickable").click(function(){$(".clickable").removeClass("active"),$(this).addClass("active")})}),e.map.setCenter(latlng(t,s))},e.handleLocationInput=function(){var o=e.currentAddress();e.nearByMarkers([]),e.nearByPlaces([]),e.msgToUser("Trying to understand what you're saying"),o?e.geocode(o,e.goTo):e.msgToUser("Enter an address, neighbourhood or city...")};var o,t;o=document.getElementById("map"),t={zoom:9,center:latlng(37.7831,-122.4039),disableDefaultUI:!0,scrollwheel:!1,zoomControl:!0,zoomControlOptions:{style:google.maps.ZoomControlStyle.LARGE,position:google.maps.ControlPosition.LEFT_CENTER}},e.map=new google.maps.Map(o,t)};ko.applyBindings(new ViewModel);