class Layer {
    constructor() {

    }

    init() {

    }

    render(renderer) {

    }
}

class GeoJSONLayer extends Layer {
    constructor(geojson, lineWidth, lineColor) {
        super()
        this.geojson = geojson;
        this.lineWidth = lineWidth;
        this.lineColor = lineColor;
        this.paths = []
    }
    /**
     * 
     * @param {Renderer} renderer 
     */
    init(renderer) {
        const pathsRaw = this.chunkPath(this.geoJSONToPath(this.geojson), 10000)
        console.log(pathsRaw.length)
        pathsRaw.forEach(path => {
            this.paths.push(renderer.constructLine(path))
        })
        
    }

    /**
     * @param {Camera} cam
     * @param {Renderer} renderer 
     */
    render(cam, renderer) {
        this.paths.forEach(path => {
            renderer.drawBufferLines(cam, path.vao, path.count, this.lineWidth, this.lineColor)
        })
    }

    geoJSONToPath(sepFeatures) {
        //TODO: Implement seperate paths for use with warnings geojson
        var path = []
        this.geojson.features.forEach((feature) => {
            
            feature.geometry.coordinates.forEach(poly => {
                //context.lineStyle(2, 0xFFFFFF, 1);
                if (!poly[0][0][0]) {
                    
                    poly.forEach((latlng, index) => {
                        const latitude1 = latlng[1]
                        const longitude1 = latlng[0]
                        const pixelCoords1 =  CRS.geographicToPixel({lat: latitude1, lon: longitude1})
                        var pixelCoords2 = {}
                        
                        if((index+1) < poly.length) {
                            const latitude2 = poly[index+1][1];
                            const longitude2 = poly[index+1][0]
    
                            pixelCoords2 =  CRS.geographicToPixel({lat: latitude2, lon: longitude2})
                        } else {
                            pixelCoords2 =  CRS.geographicToPixel({lat: poly[0][1], lon: poly[0][0]})
                        }
                        path.push([pixelCoords1.x, pixelCoords1.y])
                        path.push([pixelCoords2.x, pixelCoords2.y])
                        
                        path.push([pixelCoords2.x, pixelCoords2.y])
                        path.push([pixelCoords1.x, pixelCoords1.y])
                    })
                } else {
                    //console.log("Testing") 

                    poly.forEach((inPoly) => {
                        inPoly.forEach((latlng, index) => {
                            const latitude1 = latlng[1]
                            const longitude1 = latlng[0]
                            const pixelCoords1 =  CRS.geographicToPixel({lat: latitude1, lon: longitude1})
                            var pixelCoords2 = {}
                            if((index+1) < inPoly.length) {
                                const latitude2 = inPoly[index+1][1];
                                const longitude2 = inPoly[index+1][0]
        
                                pixelCoords2 =  CRS.geographicToPixel({lat: latitude2, lon: longitude2})
                            } else {
                                pixelCoords2 =  CRS.geographicToPixel({lat: inPoly[0][1], lon: inPoly[0][0]})
                            }
                            path.push([pixelCoords1.x, pixelCoords1.y])
                            path.push([pixelCoords2.x, pixelCoords2.y])
                            
                            path.push([pixelCoords2.x, pixelCoords2.y])
                            path.push([pixelCoords1.x, pixelCoords1.y])
                        })
                    })
                    
                }
                
            })
        })
        return path;
    }

    chunkPath(path, chunkSize) {
        var index = 0;
        var arrayLength = path.length;
        var tempArray = [];
        
        for (index = 0; index < arrayLength; index += chunkSize) {
            var myChunk = path.slice(index, index+chunkSize);
            tempArray.push(myChunk);
        }

        return tempArray;
    }
}
