class VertexArrayObject {
    /**
     * Constructor
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl) {
        this.gl = gl;
        this.vao = this.gl.createVertexArray();
    }

    bind() {
        this.gl.bindVertexArray(this.vao);
    }

    unbind() {
        this.gl.bindVertexArray(null);
    }

    draw(type, count) {
        this.gl.drawElements(type, count, this.gl.UNSIGNED_SHORT, 0)
    }
}