// ******************************************************************************* //
// ! CHANGE LINES 7, 9 and 21 !
// ! CHANGE THE CONDITIONS FROM LINE 155 !


// ! CHANGE THIS LINE: 'VH' or 'VV'
var polarization = 'VV';
// ! CHANGE THIS LINE: 'ASC' or 'DESC'
var data = 'ASC';

// Set folder where to look for data (asc and desc data are in separate folders)
var folder;
if(data === 'ASC') {
  folder = 'sentinel1_wind_corr_asc';
} else {
  folder = 'sentinel1_wind_corr_desc';
}

var imageId;
// Default is true.
var withWindFiltering = true;

if (withWindFiltering === true) {
  // !! SET THE appropriate year and month at the end: '_YYYYMM', e.g. '_201812'
  imageId = 'users/gulandras90/' + folder + '/Sentinel_1_lee_' + data + '_201510';
} else if (withWindFiltering === false) {
  // !! SET THE appropriate year and month at the end: '_YYYYMM', e.g. '_201812'
  imageId = 'users/gulandras90/Sentinel_1_lee_' + data + '_201510' + '_no_wind_corr';
}



// Add the study area
var region = require('users/gulandras90/inlandExcessWater:utils/studyArea');
region = region.addRegion();
print(region);

// Create a Feature object using the rectangle
var studyArea = ee.Feature(region, { name: 'Fels�-Kiskuns�g lakes'});

// Import exportData module
var save = require('users/gulandras90/inlandExcessWater:process/exportData');

// Import Classifier module
var classifier = require('users/gulandras90/inlandExcessWater:process/classifier');

// Import Chart creation module
var chartClusters = require('users/gulandras90/inlandExcessWater:utils/chartClusters');


// Load the image to classify
var image = ee.Image(imageId);
print(image);


var imageBand;

if (polarization === 'VV') {
  imageBand = image.select('sum_1');
} else {
  imageBand = image.select('sum');
}

// Reduce the region. The region parameter is the Feature geometry.
var meanDictionary = imageBand.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea.geometry(),
  scale: 10,
  maxPixels: 1e10
});

// The result is a Dictionary.  Print it.
print('Monthly ' + polarization + ' sigma average: ');
print(meanDictionary);

// Reduce the region. The region parameter is the Feature geometry.
var stdDevDictionary = imageBand.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: studyArea.geometry(),
  scale: 10,
  maxPixels: 1e10
});

// The result is a Dictionary.  Print it.
print('Monthly ' + polarization + ' sigma standard deviation: ');
print(stdDevDictionary);


// Reduce the region. The region parameter is the Feature geometry.
var minDictionary = imageBand.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: studyArea.geometry(),
  scale: 10,
  maxPixels: 1e10
});

// The result is a Dictionary.  Print it.
print('Monthly ' + polarization + ' sigma minimum: ');
print(minDictionary);


// Reduce the region. The region parameter is the Feature geometry.
var maxDictionary = imageBand.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: studyArea.geometry(),
  scale: 10,
  maxPixels: 1e10
});

// The result is a Dictionary.  Print it.
print('Monthly ' + polarization + ' sigma maximum: ');
print(maxDictionary);


// Extract path from filename
var splitted = [];
splitted = imageId.split('_');

print(splitted);

// store image path and year plus month
var path;
var yearMonth;
if (withWindFiltering === true) {
  path = splitted[6];
} else if (withWindFiltering === false) {
  path = splitted[3];
  yearMonth = splitted[4];
}
print(path);
print(yearMonth);


Map.centerObject(image);
Map.addLayer(image);

// Classify the image
var classifiedData = classifier.radarClassifier(image, region, 10, 'clusters', 15);

// Plot clusters by backscatter mean values to inspect water classes.
chartClusters.plotClustersByBackscatter(
  image,
  classifiedData,
  studyArea
);


// Outline for the study area
Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'Study Area');


// You need to change this part according to the water classes you identified
// So change the conditions here
var reclassified = ee.Image(0).where(
  classifiedData.eq(7)
    .or(classifiedData.eq(13))
    // .or(classifiedData.eq(10))
    , 1)
    .rename('water')
    .clip(studyArea);

Map.addLayer(reclassified, { min: 0, max: 1}, 'Water cover');

print(reclassified);


// Calculate area of clusters
// Units are in square m
// Chart
// 0 (blue): non-water covered area
// 1 (red): water covered area
var areaChart = ui.Chart.image.byClass({
  image: ee.Image.pixelArea().addBands(reclassified.select('water')),
  classBand: 'water', 
  region: studyArea,
  scale: 10,
  reducer: ee.Reducer.sum()
});

print(areaChart);



if (withWindFiltering === true) {
  save.saveCompositeBand(
    reclassified,
    10,
    'Sentinel_1_water_' + path + '_',
    yearMonth,
    studyArea
  );


  save.saveCompositeBand(
    image,
    10,
    'Sentinel_1_composite_' + path + '_',
    yearMonth,
    studyArea
  );
} else if (withWindFiltering === false) {
   save.saveCompositeBand(
    reclassified,
    10,
    'Sentinel_1_water_' + path + '_',
    yearMonth + '_no_wind_corr',
    studyArea
  );

  save.saveCompositeBand(
    image,
    10,
    'Sentinel_1_composite_' + path + '_',
    yearMonth + '_no_wind_corr',
    studyArea
  );
}


