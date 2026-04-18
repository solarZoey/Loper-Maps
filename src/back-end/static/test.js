let watchId;

watchId = navigator.geolocation.watchPosition(updatePosition, error, {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
});

function updatePosition(position){
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;

  console.log(lat, lon); // optional (browser console)

  fetch("/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      lat: lat,
      lon: lon
    })
  });
}

function error(){
  alert("Unable to get location");
}