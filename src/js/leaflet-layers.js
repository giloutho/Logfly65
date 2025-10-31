export const osmlayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

export const OpenTopoMap = L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    //nativeZooms: [3,6,7,9,11,14],
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
})
export const ignlayer = L.tileLayer('https://data.geopf.fr/wmts?'+
            '&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM'+
            '&LAYER={ignLayer}&STYLE={style}&FORMAT={format}'+
            '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
            {
	            ignLayer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
	            style: 'normal',
	            format: 'image/png',
	            service: 'WMTS',
              opacity: 1,
              attribution: 'Carte © IGN/Geoplateforme'
})
// Ok but limited to France
// const ignSat = leaf.tileLayer("https://data.geopf.fr/wmts?" +
//             "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
//             "&STYLE=normal" +
//             "&TILEMATRIXSET=PM" +
//             "&FORMAT=image/jpeg"+
//             "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
//             "&TILEMATRIX={z}" +
//             "&TILEROW={y}" +
//             "&TILECOL={x}",
//             {
//             minZoom : 0,
//             maxZoom : 18,
//             attribution : "IGN-F/Geoportail",
//             tileSize : 256 // les tuiles du Géooportail font 256x256px
// })

export const sat = L.tileLayer(
	          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		        { maxZoom: 18, 
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
)

export const mtklayer = L.tileLayer('http://tile2.maptoolkit.net/terrain/{z}/{x}/{y}.png')

export const Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
})
export const outdoorlayer = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=6f5667c1f2d24e5f84ec732c1dbd032e', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  })

export const oaciFrLayer = L.tileLayer('https://data.geopf.fr/private/wmts?apikey=ign_scan_ws'+
    '&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM'+
    '&LAYER={ignLayer}&STYLE={style}&FORMAT={format}'+
    '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
    {
        ignLayer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-OACI',
        style: 'normal',
        format: 'image/jpeg',
        service: 'WMTS',
        attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>',
        tileSize : 256,
        minZoom : 7,
        maxZoom : 11
    }
)

export const baseMaps = {
  "OSM": osmlayer,
  "OpenTopo" : OpenTopoMap,
  "IGN" : ignlayer,
  "Satellite" : sat,
  "MTK" : mtklayer,
  "EsriTopo" : Esri_WorldTopoMap,
  "Outdoor" : outdoorlayer,
  "OACI_FR" : oaciFrLayer
}