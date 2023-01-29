class Camera {
    constructor(viewPortDims, pos, zoom) {
        this.viewPortDims = viewPortDims;
        this.pos = pos;
        this.zoom = zoom;

        this.aspectRatio = this.calcAspectRatio();

        this.projection = this.createProjMatrix();
        this.transform = this.createTransformMatrix();
    }

    createProjMatrix() {
        var matrix = mat4.create()
        mat4.ortho(matrix, ((-this.viewPortDims.x / 2) / this.zoom) / this.aspectRatio,((this.viewPortDims.x / 2) / this.zoom) / this.aspectRatio, ((this.viewPortDims.y / 2) / this.zoom) / this.aspectRatio, ((-this.viewPortDims.y / 2) / this.zoom) /    this.aspectRatio, -1, 1);
        return matrix;
    }

    createTransformMatrix() {
        var matrix = mat4.create()
        mat4.fromTranslation(matrix, [this.pos.x, this.pos.y, this.pos.z]);
        return matrix;
    }

    onResize(newDims) {
        this.viewPortDims = newDims;
        this.aspectRatio = this.calcAspectRatio();
        this.projection = this.createProjMatrix();
        this.transform = this.createTransformMatrix();
    }

    zoomBy(amount) {
        this.zoom *= (1+amount);
        this.projection = this.createProjMatrix();
        this.transform = this.createTransformMatrix();
    }

    translate(amount) {
        this.pos = {
            x: this.pos.x + amount.x,
            y: this.pos.y + amount.y,
            z: this.pos.z + amount.z
        }

        this.transform = this.createTransformMatrix();
    }

    setPosition(pos) {
        this.pos = pos;
        this.transform = this.createTransformMatrix();
    }

    setZoom(zoom) {
        this.zoom = zoom;
        this.projection = this.createProjMatrix();
    }

    calcAspectRatio() {
        return this.viewPortDims.x / this.viewPortDims.y;
    }
}