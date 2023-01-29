class CRS {
    static antennaToCartesian(az, rng) {
        let px = rng * Math.cos( this.degToRad(az-630));
        let py = rng * Math.sin( this.degToRad(az-630));
    
        return { x: px, y: py }
    }
    
    static radToDeg(radians)
    {
      var pi = Math.PI;
      return radians * (180/pi);
    }
    
    static degToRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    static toImageCoords(xy, zoom) {
        const radarRangeM = (zoom * 250) + 2125;
        const metersPerPixel = (radarRangeM * 2) /  imageSize;
        return {
            x: (xy.x + radarRangeM) / metersPerPixel,
            y: (xy.y + radarRangeM) / metersPerPixel
        }
    }
    
    static cartesianToGeographic(xy,latlon) {
        const R = 6370997;
        const rho = Math.sqrt(xy.x*xy.x+xy.y*xy.y);
        const stationLatRad =  this.degToRad(latlon.lat);
        const stationLonRad =  this.degToRad(latlon.lon);
        const c = rho / R;
        
        var result = {lat: null, lon: null}
    
        if(rho == 0) {
            result = {lat: stationLat, lon: null};
        }
    
        var x1 = xy.x * Math.sin(c);
        var x2 = rho*Math.cos(stationLatRad)*Math.cos(c) - xy.y*Math.sin(stationLatRad)*Math.sin(c);
        result.lon =  this.radToDeg(stationLonRad + Math.atan2(x1, x2));
        if(result.lat == null) {
            result.lat =  this.radToDeg(Math.asin(Math.cos(c) * Math.sin(stationLatRad) + xy.y * Math.sin(c) * Math.cos(stationLatRad) / rho))
        }
    
        if(result.lon > 180)
            result.lon -= 360;
        if(result.lon < -180)
            result.lon += 360;
        
        return result;
    }
    
    static geographicToPixel(latlong) {
        let pixelsPerLonDegree_ = (700*250) / 360;
        let pixelsPerLonRadian_ = (700*250) / (2 * Math.PI);
        
        var x = 0;
        var y = 0;
        
        x = latlong.lon * pixelsPerLonDegree_;
        
        // Truncating to 0.9999 effectively limits latitude to 89.189. This is
        // about a third of a tile past the edge of the world tile.
        var siny = this.clamp(Math.sin( this.degToRad(latlong.lat)), -0.99999, 0.99999);
        y = 0.5 * Math.log((1 + siny) / (1 - siny)) * -pixelsPerLonRadian_;
        /*if ( stationX &&  stationY) {
            //console.log(x)
            //console.log(y)
            return { x: (x- stationX)+ ( imageSize/2), y: (y- stationY) + ( imageSize/2) }
        }*/
        return {x: x, y: y, z: 0};
    }

    static clamp(val, min, max) {
        return (val <= min) ? min : (val >= max) ? max : val;
    }
}