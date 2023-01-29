class Buffer {
    /**
     * Constructor
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl, type) {
        this.gl = gl;
        this.type = type;
        this.uint = false;
        this.buf = gl.createBuffer();
    }

    bind() {
        this.gl.bindBuffer(this.type, this.buf)
    }

    uploadData(data) {
        if(!this.uint) {
            this.gl.bufferData(this.type, new Float32Array(data), this.gl.STATIC_DRAW)
        } else {
            this.gl.bufferData(this.type, new Uint16Array(data), this.gl.STATIC_DRAW)
        }
    }

    uploadSubData(offset, subData) {
        if(!this.uint) {
            this.gl.bufferSubData(this.type, offset, new Float32Array(subData))
        } else {
            this.gl.bufferSubData(this.type, offset, new Uint16Array(subData))
        }
    }

    delete() {
        this.gl.deleteBuffer(this.buf)
    }

    setUIntBuffer() {
        this.uint = true;
    }
}