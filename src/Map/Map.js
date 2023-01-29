class Map {
    constructor(canvas, latlng) {
        this.canvas = canvas;
        this.latlng = latlng;

        this.mouseDown = false;
        this.stats = new Stats()
        this.stats.showPanel(0)
        document.body.append(this.stats.dom);

        this.layers = []
        this.init();
    }

    init() {
        this.gl = this.getGLContext()
        this.ctx = this.get2DContext();
        this.ctx.canvas.width  = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
        this.ctx.lineWidth = 1
        this.ctx.strokeStyle="#000000"
        this.ctx.fillStyle = "#FFFFFF"
        this.ctx.textAlign="center";
        this.ctx.textBaseline="middle"

        // Only continue if WebGL is available and working
        if (this.gl === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        this.gl.canvas.width = window.innerWidth
        this.gl.canvas.height = window.innerHeight
        this.gl.viewport(0, 0, this.gl.canvas.width, this.canvas.height);
        // Set clear color to black, fully opaque
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
       
        this.renderer = new Renderer(this.gl, this.ctx);
        this.renderer.init()

        this.buffer = new Buffer(this.gl, this.gl.ARRAY_BUFFER);

        this.buffer.bind()
        this.buffer.uploadData([
            -20.0,  20.0, 1,0,0,1,
             20.0,  20.0, 1,0,0,1,
            -20.0, -20.0, 1,0,0,1
        ]);
        this.cam = new Camera({x: window.innerWidth, y: window.innerHeight}, {x: 0, y: 0, z: 0}, 1);
        this.cam.setZoom(0.1)
        this.cam.setPosition({
            x: -CRS.geographicToPixel({
                lat: 39.2673,
                lon: -76.7983
            }).x,
            y: -CRS.geographicToPixel({
                lat: 39.2673,
                lon: -76.7983
            }).y,
            z: 0
        })
        //renderer.drawBuffer(cam, buffer)

        window.onresize = () => {
            this.gl.canvas.width = window.innerWidth
            this.gl.canvas.height = window.innerHeight
            this.ctx.canvas.width  = window.innerWidth;
            this.ctx.canvas.height = window.innerHeight;

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.cam.onResize({x: this.gl.canvas.width, y: this.gl.canvas.height})
            //this.renderer.drawBuffer(this.cam, this.buffer, 3)
        }

        fetch("res/Counties.json").then(res => res.json()).then(json => {
            //console.log(json.features.length)
            this.addLayer(new GeoJSONLayer(json, 2, [1,1,1]))
        })

        fetch("res/States.json").then(res => res.json()).then(json => {
            //console.log(json.features.length)
            this.addLayer(new GeoJSONLayer(json, 5, [1,1,1]))
        })

        fetch("res/countries.json").then(res => res.json()).then(json => {
            //console.log(json.features.length)
            this.addLayer(new GeoJSONLayer(json, 5, [1,1,1]))
        })

        fetch("res/USCities.txt").then(res => res.text()).then(text => {
            const lines = text.split("\n");
            var labels = []
            for(var i = 0; i < 1000; i++) {
                const line = lines[i]
                const values = line.split(",");
                const worldCoords = CRS.geographicToPixel({
                    lat: values[1],
                    lon: values[2]
                })
                labels.push(
                    {
                        name: values[0],
                        lat: values[1],
                        lon: values[2],
                        size: this.popToSize(i),
                        x: worldCoords.x,
                        y: worldCoords.y
                    }
                )
            }

            this.addLayer(new LabelsLayer(labels))
        })

        //Comment line below to get it working and uncomment the second line.   
        this.line = this.renderer.constructLine( [
            [0, 0], [50, 0], [50,0], [0,0], [20,1], [20,100], [20,100], [20,1]
        ])
 
        requestAnimationFrame(this.renderMap.bind(this))   

        document.addEventListener('DOMContentLoaded', this.addPanZoom.bind(this), false)
    }

    popToSize(pop) {
        if(pop < 10) {
            return 20
        }

        if(pop < 50) {
            return 19
        }

        if(pop < 100) {
            return 18
        }
        
        return 13
    }

    /**
     * Gets the current WebGL context
     * @returns {WebGL2RenderingContext}
     */
    getGLContext() {
        return this.canvas.getContext("webgl2", {
            antialias: true
        });
    }

    /**
     * @returns {CanvasRenderingContext2D}
     */
    get2DContext() {
        return document.querySelector(".map-text").getContext("2d");
    }

    renderMap() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
        const pos = {x: CRS.geographicToPixel({
            lat: 39.2673,
            lon: -76.7983
        }).x, 
        y: CRS.geographicToPixel({
            lat: 39.2673,
            lon: -76.7983
        }).y, z:0}
   

        this.stats.begin()
        //this.renderer.drawBuffer(this.cam, this.buffer, 3)
        this.renderer.drawBufferLines(this.cam,this.line.vao, this.line.count, 20,[1,0,1])
        this.layers.forEach(layer => {
            //console.log(this.cam.pos)
            layer.render(this.cam, this.renderer)
        })

        this.stats.end()
        requestAnimationFrame(this.renderMap.bind(this))
    }

    addLayer(layer) {
        this.layers.push(layer)
        layer.init(this.renderer)
    }

    /**
     * 
     * @param {Camera} cam 
     * @param {Element} canvas 
     */
    addPanZoom() {
        console.log("Hello")
        document.querySelector('.map-text').addEventListener("wheel", (event) => {
            this.cam.zoomBy(Math.sign(event.deltaY) > 0 ? -.1 : .1)
        }, {passive: true})

        document.querySelector('.map-text').addEventListener('mousedown', (event) => {
            this.mouseDown = true;
        })

        document.querySelector('.map-text').addEventListener('touchstart', (event) => {
            console.log("Touch Start")
            this.mouseDown = true;
        })

        document.querySelector('.map-text').addEventListener('mouseup', (event) => {
            this.mouseDown = false;
        })

        document.querySelector('.map-text').addEventListener('touchend', (event) => {
            this.mouseDown = false;
        })

        document.querySelector('.map-text').addEventListener('mousemove', (event) => {
            if(this.mouseDown) {
                this.cam.translate({
                    x: event.movementX / (this.cam.zoom*2),
                    y: event.movementY / (this.cam.zoom*2),
                    z: 0
                })
            }
        })

        document.querySelector('.map-text').addEventListener('touchmove', (event) => {
            if(this.mouseDown) {
                this.cam.translate({
                    x: event.movementX / (this.cam.zoom*2),
                    y: event.movementY / (this.cam.zoom*2),
                    z: 0
                })
                console.log(event)
            }
        })
    }
}