var gpsUtil = require('gps-util');
var gpx = require('idris-gpx');
var fs = require('fs');

// 3 seconds between each track point
const POINT_TIME = 3;

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
  gpx.lines('data/' + file, 1000, collection => {
    collection.features.map((feature, i, features) => {
      console.log(feature.geometry);
      // calculate time since start
      feature.properties.time = i * POINT_TIME;
      // calcule total distance from beginning
      if (i === 0) {
        feature.properties.distance = 0;
        feature.properties.speed = 0;
      }
      else {
        let partialDistance = gpsUtil.getDistance(// distance from last point
              feature.geometry.coordinates[0][0], //lat
              feature.geometry.coordinates[0][1], //long
              feature.geometry.coordinates[1][0], //lat
              feature.geometry.coordinates[1][1] //long
              );
        feature.properties.distance =
          features[i - 1].properties.distance + //distance so far
          partialDistance;
        feature.properties.speed = partialDistance / POINT_TIME;
      }
    });
    // save to geojson file
    fs.writeFileSync('results/' + file + '-lines.json',
        JSON.stringify(collection, null, '\t'),
        { encoding: 'utf8' });
    // save stats like mean speed, total time, total distance
    var time = collection.features.length * POINT_TIME;
    // distance from start for last feature of collection
    var distance = collection.features[collection.features.length-1].properties.distance;
    var speedms = distance / time;
    var speedkmh = speedms * 3.6;
    fs.writeFileSync('results/' + file + '-stats.csv',
        time + ',' + distance + ',' + speedms + ',' + speedkmh,
        { encoding: 'utf8' });
  });
});
