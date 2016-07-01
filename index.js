var gpsUtil = require('gps-util');
var gpx = require('idris-gpx');
var fs = require('fs');

// 5 seconds between each track point
const POINT_TIME = 5;

// prepare results folder
try {
  fs.mkdirSync('results/');
} catch (e) {
  // continue if folder exists already
  if (e.code !== 'EEXIST') {
    console.log(e);
    process.exit(1);
  }
}

// process all files in the data/ folder
var files = fs.readdirSync('data/');
files.map(file => {
  gpx.points('data/' + file, collection => {
    collection.features.map((feature, i, features) => {
      // calculate time since start
      feature.properties.time = i * POINT_TIME;
      // calcule total distance from beginning
      if (i === 0) {
        feature.properties.distance = 0;
      }
      else {
        feature.properties.distance =
          features[i - 1].properties.distance + //distance so far
          gpsUtil.getDistance(                  // distance from last point
              features[i - 1].geometry.coordinates[0], //lat
              features[i - 1].geometry.coordinates[1], //long
              features[i].geometry.coordinates[0], //lat
              features[i].geometry.coordinates[1] //long
              );
      }
    });
    // save to geojson file
    fs.writeFileSync('results/' + file + '.json',
        JSON.stringify(collection),
        { encoding: 'utf8' });
  });
});
