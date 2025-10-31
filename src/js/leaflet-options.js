  export const trackOptions = {
    color: 'red',
    weight: 2,
    opacity: 0.85
  }

  export const thermOptions = {
    color: 'yellow',
    weight: 6,
    opacity: 0.50
  }

  export const glideOptions = {
    color: '#848484',
    weight: 3, 
    dashArray: '10,5', 
    opacity: 1
  }

  export const StartIcon = new L.Icon({
    iconUrl: './static/images/windsock22.png',
    shadowUrl: './static/images/marker-shadow.png',
    iconSize: [18, 18],
    iconAnchor: [0, 18],
    popupAnchor: [1, -34],
    shadowSize: [25, 25]
  })

  export const EndIcon = new L.Icon({
    iconUrl: './static/images/Arrivee22.png',
    shadowUrl: './static/images/marker-shadow.png',
    iconSize: [18, 18],
    iconAnchor: [4, 18],
    popupAnchor: [1, -34],
    shadowSize: [25, 25]
  })