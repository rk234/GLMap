class LabelsLayer extends Layer {
    constructor(labels) {
        super()
        this.labels = labels
    }

    init() {

    }

    /**
     * @param {Camera} cam
     * @param {Renderer} renderer 
     */
    render(cam, renderer) {
        this.labels.forEach(label => {
            if(cam.zoom > .5) {
                renderer.drawText(cam, label.name, label.size, {
                    x: label.x,
                    y: label.y,
                    z: 0
                })
            } else if(cam.zoom > .4) {
                
                if(label.size >= 13) {
                    renderer.drawText(cam, label.name, label.size, {
                        x: label.x,
                        y: label.y,
                        z: 0
                    })
                }
            } else if(cam.zoom > .3) {
                
                if(label.size >= 18) {
                    renderer.drawText(cam, label.name, label.size, {
                        x: label.x,
                        y: label.y,
                        z: 0
                    })
                }
            } else if(cam.zoom > 0) {
                if(label.size >= 20) {
                    renderer.drawText(cam, label.name, label.size, {
                        x: label.x,
                        y: label.y,
                        z: 0
                    })
                }
            }
            
        });
    }
}