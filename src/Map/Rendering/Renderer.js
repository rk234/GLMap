class Renderer {
    /**
     * Constructor
     * @param {WebGL2RenderingContext} gl 
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(gl, ctx) {
        this.gl = gl;
        this.ctx = ctx;
        this.vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying lowp vec4 vColor;
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }
        `
        this.fsSource = `
            varying lowp vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        `

        this.vsLinesSource = `
            attribute vec3 position;
            attribute float direction; 
            attribute vec3 next;
            attribute vec3 previous;
            uniform mat4 projection;
            uniform mat4 model;
            uniform float aspect; //The aspect ratio of the viewport. Can be obtained from the camera object.
            uniform vec2 resolution;

            uniform float thickness;
            uniform int miter; // 1 for mitter, 0 for no mitter
            
            void main() {
                
                vec2 aspectVec = vec2(aspect, 1.0);
                mat4 projViewModel = projection * model;
                vec4 previousProjected = projViewModel * vec4(previous, 1.0);
                vec4 currentProjected = projViewModel * vec4(position, 1.0);
                vec4 nextProjected = projViewModel * vec4(next, 1.0);

                //vec4 finalPosition = projViewModel * vec4(position, 1.0);
                
                //get 2D screen space with W divide and aspect correction
                vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
                vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
                vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;
                
                float len = thickness;
                float orientation = direction;
                
                //starting point uses (next - current)
                vec2 dir = vec2(0.0);
                if (currentScreen == previousScreen) {
                    dir = normalize(nextScreen - currentScreen);
                } 
                //ending point uses (current - previous)
                else if (currentScreen == nextScreen) {
                    dir = normalize(currentScreen - previousScreen);
                }
                //somewhere in middle, needs a join
                else {
                    //get directions from (C - B) and (B - A)
                    vec2 dirA = normalize((currentScreen - previousScreen));
                    if (miter == 1) {
                        vec2 dirB = normalize((nextScreen - currentScreen));
                        //now compute the miter join normal and length
                        vec2 tangent = normalize(dirA + dirB);
                        vec2 perp = vec2(-dirA.y, dirA.x);
                        vec2 miter = vec2(-tangent.y, tangent.x);
                        dir = tangent;
                        len = thickness / dot(miter, perp);
                    } else {
                    dir = dirA;
                    }
                }
                vec2 normal = vec2(-dir.y, dir.x);
                normal *= len/2.0;
                normal.x /= aspect;
                
                vec4 normal4 = vec4(normal, 0.0, 1.0);
                
                //SIZE ATTENUATION HERE
                normal4 *= projection;
                normal4.xy *= currentProjected.w;
                normal4.xy /= (vec4(resolution, 0.0, 1.0) * projection).xy;

                normal = normal4.xy;
                vec4 offset = vec4(normal * orientation * aspectVec, 0.0, 0.0);
                gl_Position = currentProjected + offset;
                gl_PointSize = 1.0;
            }
        `

        this.fsLinesSource = `
            precision mediump float;

            uniform vec3 color;

            void main() {
                gl_FragColor = vec4(color, 1.0);
            }
        `
    }

    init() {
        const vs = new Shader(this.gl, this.vsSource, this.gl.VERTEX_SHADER);
        vs.loadShader()
        const fs = new Shader(this.gl, this.fsSource, this.gl.FRAGMENT_SHADER);
        fs.loadShader()

        this.shaderProgram = new ShaderProgram(this.gl, vs, fs);
        this.shaderProgram.init()

        const vsLines = new Shader(this.gl, this.vsLinesSource, this.gl.VERTEX_SHADER);
        vsLines.loadShader()        
        const fsLines = new Shader(this.gl, this.fsLinesSource, this.gl.FRAGMENT_SHADER);
        fsLines.loadShader()

        this.shaderProgramLines = new ShaderProgram(this.gl, vsLines, fsLines);
        this.shaderProgramLines.init()
    }

    drawBuffer(cam, buffer, vertCount) {
        const programInfo = {
            program: this.shaderProgram.program,
            attribLocations: {
                //TODO: Implement in ShaderProgram.js
              vertexPosition: this.gl.getAttribLocation(this.shaderProgram.program, 'aVertexPosition'),
              vertexColor: this.gl.getAttribLocation(this.shaderProgram.program, 'aVertexColor')
            },
            uniformLocations: {
              projectionMatrix: this.gl.getUniformLocation(this.shaderProgram.program, 'uProjectionMatrix'),
              modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram.program, 'uModelViewMatrix'),
            },
        };

        //const numComponents = 6;  // pull out 2 values per iteration
        const type = this.gl.FLOAT; 
        const typeSize = 4;   // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 6*typeSize;         // how many bytes to get from one set of values to the next
                                    // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        buffer.bind()

        this.gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            2,
            type,
            normalize,
            stride,
            offset);

        this.gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            4,
            type,
            normalize,
            stride,
            2*4
        )
        this.gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
        this.gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor
        )
        
        this.shaderProgram.use()

        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            cam.projection);
        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            cam.transform);
      
        {
          const offset = 0;
          const vertexCount = vertCount;
          this.gl.drawArrays(this.gl.TRIANGLES, offset, vertexCount);
        }
        
        //this.shaderProgram.program
    }

    drawBufferLines(cam, vao, count, lineWidth, lineColor) {
        const programInfo = {
            program: this.shaderProgramLines.program,
            attribLocations: {
                //TODO: Implement in ShaderProgram.js
              position: this.gl.getAttribLocation(this.shaderProgramLines.program, 'position'),
              direction: this.gl.getAttribLocation(this.shaderProgramLines.program, 'direction'),
              next: this.gl.getAttribLocation(this.shaderProgramLines.program, 'next'),
              previous: this.gl.getAttribLocation(this.shaderProgramLines.program, 'previous'),
            },
            uniformLocations: {
              projectionMatrix: this.gl.getUniformLocation(this.shaderProgramLines.program, 'projection'),
              modelMatrix: this.gl.getUniformLocation(this.shaderProgramLines.program, 'model'),
              aspect: this.gl.getUniformLocation(this.shaderProgramLines.program, 'aspect'),
              thickness: this.gl.getUniformLocation(this.shaderProgramLines.program, 'thickness'),
              miter: this.gl.getUniformLocation(this.shaderProgramLines.program, 'miter'),
              color: this.gl.getUniformLocation(this.shaderProgramLines.program, 'color'),
              resolution: this.gl.getUniformLocation(this.shaderProgramLines.program, 'resolution'),
            },
        };

        
        let thickness = lineWidth;
        let aspect = cam.aspectRatio
        let miter = 0
        let color = lineColor
        this.shaderProgramLines.use();
        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            cam.projection);
        this.gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelMatrix,
            false,
            cam.transform);
        this.gl.uniform1f(
            programInfo.uniformLocations.aspect,
            aspect
        )
        this.gl.uniform1f(
            programInfo.uniformLocations.thickness,
            thickness
        )
        this.gl.uniform1i(
            programInfo.uniformLocations.miter,
            miter
        )
        this.gl.uniform3f(
            programInfo.uniformLocations.color,
            color[0],
            color[1],
            color[2]
        )

        this.gl.uniform2f(
            programInfo.uniformLocations.resolution,
            this.gl.canvas.width,
            this.gl.canvas.height
        )

        vao.bind()
        vao.draw(this.gl.TRIANGLES, count)
        vao.unbind()
    }

    constructLine(path) {
        const programInfo = {
            program: this.shaderProgramLines.program,
            attribLocations: {
                //TODO: Implement in ShaderProgram.js
              position: this.gl.getAttribLocation(this.shaderProgramLines.program, 'position'),
              direction: this.gl.getAttribLocation(this.shaderProgramLines.program, 'direction'),
              next: this.gl.getAttribLocation(this.shaderProgramLines.program, 'next'),
              previous: this.gl.getAttribLocation(this.shaderProgramLines.program, 'previous'),
            },
            uniformLocations: {
              projectionMatrix: this.gl.getUniformLocation(this.shaderProgramLines.program, 'projection'),
              modelMatrix: this.gl.getUniformLocation(this.shaderProgramLines.program, 'model'),
              aspect: this.gl.getUniformLocation(this.shaderProgramLines.program, 'aspect'),
              thickness: this.gl.getUniformLocation(this.shaderProgramLines.program, 'thickness'),
              miter: this.gl.getUniformLocation(this.shaderProgramLines.program, 'miter'),
              color: this.gl.getUniformLocation(this.shaderProgramLines.program, 'color'),
            },
        };

        const indexBuffer = new Buffer(this.gl, this.gl.ELEMENT_ARRAY_BUFFER)
        indexBuffer.setUIntBuffer()
        const positionBuffer = new Buffer(this.gl, this.gl.ARRAY_BUFFER)
        const previousBuffer = new Buffer(this.gl, this.gl.ARRAY_BUFFER)
        const nextBuffer = new Buffer(this.gl, this.gl.ARRAY_BUFFER)
        const directionBuffer = new Buffer(this.gl, this.gl.ARRAY_BUFFER)
        let count = 0;
        let vao = new VertexArrayObject(this.gl);

        if (path.length > 0 && path[0].length !== 3) {
            path = path.map(point => {
              let [x, y, z] = point
              return [x || 0, y || 0, z || 0]
            })
        }

        count = (path.length-1)*6
        //console.log(count)
        let direction = this.duplicate(path.map(x => 1), true)
        let positions = this.duplicate(path);
        //console.log(this.pack())
        
        let previous = this.duplicate(path.map(this.relative(-1)))
        let next = this.duplicate(path.map(this.relative(+1)))
        let indexUint16 = this.createIndices(path.length)

        positionBuffer.bind()
        //console.log(programInfo.attribLocations.position)
        positionBuffer.uploadData(this.pack(positions))
        previousBuffer.bind()
        previousBuffer.uploadData(this.pack(previous))
        nextBuffer.bind()
        nextBuffer.uploadData(this.pack(next))
        directionBuffer.bind()
        directionBuffer.uploadData(this.pack(direction))
        indexBuffer.bind()
        indexBuffer.uploadData(indexUint16)
        

        this.shaderProgramLines.use()
        vao.bind()
        positionBuffer.bind()
        this.gl.vertexAttribPointer(programInfo.attribLocations.position, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.position);
        previousBuffer.bind()
        this.gl.vertexAttribPointer(programInfo.attribLocations.previous, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.previous);
        nextBuffer.bind()
        this.gl.vertexAttribPointer(programInfo.attribLocations.next, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.next);
        directionBuffer.bind()
        this.gl.vertexAttribPointer(programInfo.attribLocations.direction, 1, this.gl.FLOAT, false, 1*4, 0);
        this.gl.enableVertexAttribArray(programInfo.attribLocations.direction);
        indexBuffer.bind()
        //this.gl.vertexAttribPointer(, 1, this.gl.FLOAT, false, 1*4, 0);
        //this.enableVertexAttribArray(programInfo.attribLocations.direction);
        vao.unbind()

        return {
            vao: vao,
            count: count
        }
    }

    
    drawText(cam, text, size, pos) {
        const screenPos = this.get2dPoint(pos,cam.transform, cam.projection, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.font = `${size}px Arial`
        this.ctx.fillStyle = "#FFFFFF"
        this.ctx.fillText(text, screenPos.x, screenPos.y);
        
        this.ctx.beginPath()
        this.ctx.arc(screenPos.x,screenPos.y+10, 2.5, 0, 2 * Math.PI);
        this.ctx.fill()
        this.ctx.stroke()
    }

    duplicate(nestedArray, mirror) {
        var out = []
        nestedArray.forEach(x => {
            let x1 = mirror ? -x : x
            out.push(x1, x)
        })
        return out
    }

    createIndices(length) {
        let indices = new Uint16Array(length * 6)
        let c = 0, index = 0
        for (let j=0; j<length/2; j++) {
            let i = index
            indices[c++] = i + 0 
            indices[c++] = i + 1 
            indices[c++] = i + 2 
            indices[c++] = i + 2 
            indices[c++] = i + 1 
            indices[c++] = i + 3 
            index += 4
        }
        return indices
    }
    
    relative(offset) {
        return (point, index, list) => {
            index = this.clamp(index + offset, 0, list.length-1)
            return list[index]
        }
    }

    clamp(val, min, max) {
        return (val <= min) ? min : (val >= max) ? max : val;
    }

    dtype(dtype) {
        switch (dtype) {
          case 'int8':
            return Int8Array
          case 'int16':
            return Int16Array
          case 'int32':
            return Int32Array
          case 'uint8':
            return Uint8Array
          case 'uint16':
            return Uint16Array
          case 'uint32':
            return Uint32Array
          case 'float32':
            return Float32Array
          case 'float64':
            return Float64Array
          case 'array':
            return Array
          case 'uint8_clamped':
            return Uint8ClampedArray
        }
    }

    pack(arr, type) {
        type = type || 'float32'
      
        if (!arr[0] || !arr[0].length) {
          return arr
        }
      
        var Arr = typeof type === 'string'
          ? this.dtype(type)
          : type
      
        var dim = arr[0].length
        var out = new Arr(arr.length * dim)
        var k = 0
      
        for (var i = 0; i < arr.length; i++)
        for (var j = 0; j < dim; j++) {
          out[k++] = arr[i][j]
        }
      
        return out
    }

    get2dPoint(point3D, viewMatrix, projectionMatrix, width, height) {
        var viewProjectionMatrix = mat4.create()
        //viewProjectionMatrix = projectionMatrix * viewMatrix;
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)
        //console.log(viewProjectionMatrix)
        var point4 = vec4.fromValues(point3D.x, point3D.y, point3D.z, 1)
        //point3D = viewProjectionMatrix.multiply(point4);

        vec4.transformMat4(point4, point4, viewProjectionMatrix);
        var winX = Math.round((( point4[0] + 1 ) / 2.0) *
                                width );
        //we calculate -point3D.getY() because the screen Y axis is
        //oriented top->down 
        var winY = Math.round((( 1 - point4[1] ) / 2.0) *
                                height );
        return {x: winX, y: winY, z: 0};
    }
}