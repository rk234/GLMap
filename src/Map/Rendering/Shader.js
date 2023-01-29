class Shader {
    /**
     * Constructor
     * @param {WebGL2RenderingContext} gl 
     * @param {string} source 
     */
    constructor(gl, source, type) {
        this.gl = gl;
        this.source = source;
        this.shader = this.createShader(type)
    }

    /**
     * 
     * @returns {WebGLShader} 
     */
    createShader(type) {
        return this.gl.createShader(type);
    }

    loadShader() {
        this.gl.shaderSource(this.shader, this.source)
        this.gl.compileShader(this.shader)
        this.checkStatus();
    }

    checkStatus() {
        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(this.shader));
            this.delete()
        }
    }

    delete() {
        this.gl.deleteShader(this.shader);
    }
}