class ShaderProgram {
    /**
     * Constructor
     * @param {WebGL2RenderingContext} gl
     * @param {Shader} vs 
     * @param {Shader} fs 
     */
    constructor(gl, vs, fs) {
        this.gl = gl;
        this.vs = vs;
        this.fs = fs;

        this.program = gl.createProgram();
    }

    init() {
        this.attach(this.vs)
        this.attach(this.fs)

        this.link()

        this.checkStatus()
    }

    /**
     * 
     * @param {Shader} shader 
     */
    attach(shader) {
        this.gl.attachShader(this.program, shader.shader)
    }

    link() {
        this.gl.linkProgram(this.program)
    }

    checkStatus() {
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.program));
        }
    }

    use() {
        this.gl.useProgram(this.program)
    }
}