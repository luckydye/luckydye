export function createWebgl2Canvas(canvas, options = {
    alpha: false,
}) {

    let lastIamge = null;

    const vertexShaderSource = `#version 300 es
        in vec4 a_position;
        in vec2 a_uv;
        out vec2 v_uv;

        void main() {
            gl_Position = a_position;
            v_uv = a_uv;
        }
    `;

    const fragmentShaderSource = `#version 300 es
        precision highp float;

        uniform sampler2D u_texture;
        uniform vec2 resolution;
        uniform float time;

        in vec2 v_uv;
        out vec4 outColor;

        const int samples = 32, LOD = 1, sLOD = 1 << LOD;
        const float sigma = float(samples) * .25;

        float gaussian(vec2 i) {
            return exp( -.5* dot(i/=sigma,i) ) / ( 6.28 * sigma*sigma );
        }

        vec4 blur(sampler2D sp, vec2 U, vec2 scale) {
            vec4 O = vec4(0);  
            int s = samples / sLOD;
            
            for ( int i = 0; i < s * s; i++ ) {
                vec2 d = vec2(i % s, i / s) * float(sLOD) - float(samples) / 2.0;
                O += gaussian(d) * textureLod(sp, U + scale * d , float(LOD));
            }
            
            return O / O.a;
        }
        
        void main() {
            float ca_scale = 0.5;
            float bloom_scale = 1.0;

            float r = texture(u_texture, vec2(v_uv.x - (ca_scale / resolution.x), v_uv.y)).r;
            float g = texture(u_texture, vec2(v_uv.x, v_uv.y - ((ca_scale / resolution.x) * 1.5))).g;
            float b = texture(u_texture, vec2(v_uv.x, v_uv.y + ((ca_scale / resolution.x) * 2.0) )).b;

            vec4 rgba = vec4(r, g, b, 1.0);

            vec4 rgbaBlured = blur(u_texture, v_uv, bloom_scale / resolution.xy);

            outColor = rgba * 0.9;
            outColor += rgbaBlured * 0.5;

            if(mod(v_uv.y * resolution.y, 2.0) >= 1.5) {
                outColor *= 0.69;
            }

            float v = mod(time * 5.0 - v_uv.y, -1.0);
            if(v < -0.5 && v > -0.9) {
                outColor += outColor * 0.05;
            }
        }
    `;

    const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        desynchronized: true,
        preserveDrawingBuffer: true,
    });

    function createShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    var program = createProgram(gl, vertexShader, fragmentShader);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // positions
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1, -1,
        -1, 1,
        1, 1,

        1, 1,
        1, -1,
        -1, -1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);


    // uvs
    const uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

    const uvs = [
        0, 0,
        0, -1,
        1, -1,

        1, -1,
        1, 0,
        0, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Create a texture.
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const U_resolution = gl.getUniformLocation(program, "resolution");
    const U_time = gl.getUniformLocation(program, "time");

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    let width = 0;

    return {
        draw(image) {
            lastIamge = image;

            gl.uniform1fv(U_time, [ performance.now() / 1000 ]);

            gl.viewport(0, 0, canvas.width, canvas.height);
            if(width === image.width) {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
                width = image.width;

                gl.uniform2fv(U_resolution, [ image.width, image.height ]);
            }
            gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);

            width = image.width;
        },
        reformat(width, height) {
            canvas.width = width;
            canvas.height = height;

            if(lastIamge) {
                this.draw(lastIamge);
            }
        },
        get canvas() {
            return canvas;
        }
    };
}
