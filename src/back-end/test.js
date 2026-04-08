let map;
let marker;
let watchId;

let previousPosition = null;
let totalDistance = 0;

function startTracking(){

watchId = navigator.geolocation.watchPosition(updatePosition,
error,
{
enableHighAccuracy:true,
maximumAge:0,
timeout:5000
});

}

function stopTracking(){

navigator.geolocation.clearWatch(watchId);

}

function updatePosition(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

document.getElementById("lat").textContent = lat;
document.getElementById("lon").textContent = lon;

if(!map){

map = L.map('map').setView([lat, lon], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

marker = L.marker([lat,lon]).addTo(map);

}else{

marker.setLatLng([lat,lon]);
map.setView([lat,lon]);

}

if(previousPosition){

let distance = getDistance(
previousPosition.lat,
previousPosition.lon,
lat,
lon
);

totalDistance += distance;

document.getElementById("distance").textContent =
Math.round(totalDistance);

}

previousPosition = {
lat:lat,
lon:lon
};

}

function error(){

alert("Unable to get location");

}

function shareLocation(){

let lat = document.getElementById("lat").textContent;
let lon = document.getElementById("lon").textContent;

let link =
`https://www.google.com/maps?q=${lat},${lon}`;

navigator.clipboard.writeText(link);

alert("Location link copied!");

}

function getDistance(lat1, lon1, lat2, lon2){

let R = 6371;

let dLat = (lat2-lat1) * Math.PI/180;
let dLon = (lon2-lon1) * Math.PI/180;

let a =
Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1*Math.PI/180) *
Math.cos(lat2*Math.PI/180) *
Math.sin(dLon/2) *
Math.sin(dLon/2);

let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

let distance = R * c;

return distance * 1000;

}