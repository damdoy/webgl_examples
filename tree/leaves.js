class Leaves{
    setup(gl){
        this.gl = gl;

        const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertex_shader_code);
        const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragment_shader_code);

        //create shader
        this.shader_program = this.gl.createProgram();
        this.gl.attachShader(this.shader_program, vertexShader);
        this.gl.attachShader(this.shader_program, fragmentShader);
        this.gl.linkProgram(this.shader_program);

        if (!this.gl.getProgramParameter(this.shader_program, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.shader_program));
            return null;
        }

        this.vao = this.gl.createVertexArray();

        this.gl.bindVertexArray(this.vao);

        //buffer for the vertices pos of the cube
        this.pos_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        //buffer containings the normals
        this.normal_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

        //indices for the vertices
        this.idx_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW)

        // indices for the texture pos
        this.texcoord_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoord_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.tex_coord), this.gl.STATIC_DRAW)

        this.transforms_list = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transforms_list);

        //put all the model matrices in a buffer, need the mat4 in a flat structure, a list
        var lst_model_flat = this.mat_vector.map(a=>[...a]).flat();
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lst_model_flat), this.gl.STATIC_DRAW);

        this.rel_pos_list = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rel_pos_list);

        var pos_vec_flat = this.pos_vector.map(a=>[...a]).flat();
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pos_vec_flat), this.gl.STATIC_DRAW);

        this.nb_leaves = this.mat_vector.length;
        this.light_pos = [0, 0, 0];

        //generate the wind texture
        var wind_tex_size = 512;

        this.generate_wind_texture(wind_tex_size);

        this.texture_id = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, wind_tex_size, wind_tex_size, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(this.wind_array_texture));

        //mirrored repeat as we will pan over the texture multiple times
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //do not forget this for float textures

        this.wind_offset = [1,1];
    }

    generate(end_point_matrices){
        this.mat_vector = []
        this.pos_vector = []

        var leaves_scale = 1.0/32.0;

        for (let i = 0; i < end_point_matrices.length; i++) {
            var incr = 0.4;
            for (let x = -1.0; x < 1.0; x+=incr) {
                for (let y = -1.0; y < 1.0; y+=incr) {
                    for (let z = -1.0; z < 1.0; z+=incr) {
                        var dist_to_centre = Math.sqrt(x*x+y*y+z*z);
                        if(dist_to_centre < 1.0){
                            var t = mat4.create();
                            var random_rot = mat4.create();
                            //add a bit of randomness to not have a grid of leaves
                            mat4.rotate(random_rot, random_rot, Math.random(), [1.0, 0.0, 0.0] );
                            mat4.rotate(random_rot, random_rot, Math.random(), [0.0, 1.0, 0.0] );
                            mat4.rotate(random_rot, random_rot, Math.random(), [0.0, 0.0, 1.0] );

                            mat4.multiply(t, t, random_rot);
                            mat4.translate(t, t, [x*leaves_scale*4, y*leaves_scale*4, z*leaves_scale*4]);
                            mat4.multiply(t, t, random_rot);//rotates again the leaves so they don't have the same orientation
                            mat4.scale(t, t, [leaves_scale, leaves_scale, leaves_scale]);

                            var end_mat = mat4.create();
                            mat4.multiply(end_mat, end_point_matrices[i], t);
                            this.mat_vector.push(end_mat);

                            var val = vec4.create();
                            val[0] = x;
                            val[1] = y;
                            val[2] = z;
                            val[3] = 1;
                            var val_transf = vec4.create();
                            vec4.transformMat4(val_transf, val, random_rot);
                            var val_transf3 = [val_transf[0], val_transf[1], val_transf[2]];
                            this.pos_vector.push(val_transf3);
                        }
                    }
                }
            }

        }
    }

    //generate wind texture, which will impact the position of the grass
   //only R component of the texture will be used
    generate_wind_texture(size){
        this.wind_array_texture = [];

        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var val = Math.sin(i/size*16)*Math.cos(j/size*8);
                this.wind_array_texture.push( val*64+128 ); //R
                this.wind_array_texture.push( 0.0 ); //G useless
                this.wind_array_texture.push( 0.0 ); //B useless
            }
        }
    }

    set_mvp(model, view, proj){
        this.model = model;
        this.view = view;
        this.proj = proj;
    }

    set_time(t){
        var time_delta = t-this.time;
        this.wind_offset[0] = (t*16)%10
        this.wind_offset[1] = (t*8)%10
        this.time = t;
    }

    draw(){
        this.gl.bindVertexArray(this.vao);
        this.gl.useProgram(this.shader_program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
        this.gl.vertexAttribPointer(
            this.gl.getAttribLocation(this.shader_program, "vertex_pos"),
            3,
            this.gl.FLOAT,
            true,
            0,
            0);
        this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "vertex_pos"));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        this.gl.vertexAttribPointer(
            this.gl.getAttribLocation(this.shader_program, "normal"),
            3,
            this.gl.FLOAT,
            true,
            0,
            0);
        this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "normal"));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoord_buffer);
        this.gl.vertexAttribPointer(
            this.gl.getAttribLocation(this.shader_program, "uv"),
            2,
            this.gl.FLOAT,
            true,
            0,
            0);
        this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "uv"));

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

        //send the matrices to the shader via the uniformMatrix
        this.gl.uniformMatrix4fv(
        this.gl.getUniformLocation(this.shader_program, "proj"),
        false,
        this.proj);

        this.gl.uniformMatrix4fv(
        this.gl.getUniformLocation(this.shader_program, "view"),
        false,
        this.view);

        this.gl.uniformMatrix4fv(
        this.gl.getUniformLocation(this.shader_program, "model"),
        false,
        this.model);

        this.gl.uniform2fv(
            this.gl.getUniformLocation(this.shader_program, "wind_offset"),
            this.wind_offset);

        var uniform_loc = this.gl.getAttribLocation(this.shader_program, "model_mat");

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transforms_list);

        this.gl.enableVertexAttribArray(uniform_loc);
        this.gl.vertexAttribPointer(uniform_loc, 4, this.gl.FLOAT, this.gl.FALSE, 64, 0);

        this.gl.enableVertexAttribArray(uniform_loc+1);
        this.gl.vertexAttribPointer(uniform_loc+1, 4, this.gl.FLOAT, this.gl.FALSE, 64, 16);

        this.gl.enableVertexAttribArray(uniform_loc+2);
        this.gl.vertexAttribPointer(uniform_loc+2, 4, this.gl.FLOAT, this.gl.FALSE, 64, 32);

        this.gl.enableVertexAttribArray(uniform_loc+3);
        this.gl.vertexAttribPointer(uniform_loc+3, 4, this.gl.FLOAT, this.gl.FALSE, 64, 48);

        this.gl.vertexAttribDivisor(uniform_loc, 1);
        this.gl.vertexAttribDivisor(uniform_loc+1, 1);
        this.gl.vertexAttribDivisor(uniform_loc+2, 1);
        this.gl.vertexAttribDivisor(uniform_loc+3, 1);

        var uniform_loc = this.gl.getAttribLocation(this.shader_program, "raw_position");

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rel_pos_list);

        this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "raw_position"));
        this.gl.vertexAttribPointer(this.gl.getAttribLocation(this.shader_program, "raw_position"), 3, this.gl.FLOAT, this.gl.FALSE, 12, 0);

        this.gl.vertexAttribDivisor(this.gl.getAttribLocation(this.shader_program, "raw_position"), 1);


        this.gl.activeTexture(gl.TEXTURE0);

        this.gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

        this.gl.uniform1i(gl.getUniformLocation(this.shader_program, "tex_wind"), 0);

        this.gl.disable(this.gl.CULL_FACE);

        // this.gl.drawElements(this.gl.TRIANGLES, this.nb_indices, this.gl.UNSIGNED_SHORT, 0);

        //this.transf.length
        // this.gl.drawElements(this.gl.TRIANGLES, this.nb_indices, this.gl.UNSIGNED_SHORT, 0);
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_SHORT, 0, this.nb_leaves);

        this.gl.enable(this.gl.CULL_FACE);

        this.gl.vertexAttribDivisor(uniform_loc, 0);
    }

    vertex_shader_code = `
      precision mediump float;
      attribute vec4 vertex_pos;
      attribute vec3 normal;
      attribute vec2 uv;
      attribute mat4 model_mat;
      attribute vec3 raw_position;

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;
      varying vec2 frag_uv;
      varying float frag_relative_ground_pos;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;
      uniform vec2 wind_offset;

      uniform sampler2D tex_wind;

      void main() {
            mat4 global_model = model*model_mat;

            vec3 new_pos_tex = vec3(global_model*vertex_pos);

            //rotate a bit the leaves according to a wind texture map
            vec2 relative_tex_pos = vec2(new_pos_tex.x/40.0+0.5, new_pos_tex.z/40.0+0.5);

            float wind_x = texture2D(tex_wind, (relative_tex_pos+wind_offset) ).r;
            float wind_z = texture2D(tex_wind, (relative_tex_pos+vec2(0.5, 0.5)+wind_offset) ).r;

            //rotation around x axis
            mat4 rot_mat_x = mat4(1, 0, 0, 0,
                                    0, cos(wind_x), -sin(wind_x), 0,
                                    0, sin(wind_x), cos(wind_x), 0,
                                    0, 0, 0, 1);

            //rotation around z axis
            mat4 rot_mat_z = mat4(cos(wind_z), -sin(wind_z), 0, 0,
                                    sin(wind_z), cos(wind_x), 0, 0,
                                    0, 0, 0, 0,
                                    0, 0, 0, 1);

            vec4 new_pos = (global_model*rot_mat_x*rot_mat_z*vertex_pos);

            //normally the model matrix for normals should be different to keep orientation of normals
            //but it is a pain in webgl as we dont seem to have the inverse and transpose, so i don't do it
            // mat3 normal_mat = mat3(transpose(inverse(global_model)));
            mat3 normal_mat = mat3(global_model);

            pixel_pos = vec3(new_pos);

            //also transform the normals according to the model matrix
            pixel_normal = normalize(normal_mat*normal);
            gl_Position = proj*view*new_pos;

            frag_relative_ground_pos = raw_position.y;

            frag_uv = uv;
      }
    `;

   fragment_shader_code = `
      precision mediump float; //necessary in webgl glsl, medium precision for performance?

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;
      varying vec2 frag_uv;
      varying float frag_relative_ground_pos;

      uniform vec3 light_pos;
      uniform vec2 wind_offset;

      void main() {

        float distance_to_middle = distance(frag_uv, vec2(0.5, 0.5));

        //have some sort of leaf shape instead of a rough triangle
        if(distance_to_middle > 0.5 ){
            discard;
        }

        //have a repeatable random value according to relative position of the leaf to the centre of the batch
        float rand_val = sin(pixel_pos.x*pixel_pos.z/10.0)+cos( (0.13-pixel_pos.x*pixel_pos.y) / 10.0 );

        gl_FragColor.a = 1.0;

        //if the leaf is under the "centre" of the batch, draw it darker (to have a canopy effect)
        float light_intensity = (frag_relative_ground_pos+0.6)*1.5;
        light_intensity = clamp(light_intensity, 0.0, 1.0);
        float reverse_dist_to_middle = 1.0-distance_to_middle;

        gl_FragColor.rgb = vec3(0.1+rand_val/6.0, 0.4, 0.05)*light_intensity*reverse_dist_to_middle;
      }
   `;

    positions = [
        -1.0, -1.0, 0.0, // 0 bottom left
        1.0, -1.0, 0.0, // 1 bottom right
        0.0, 1.0, 0.0, // 2 top
    ];

    indices = [
        0, 1, 2,
    ];

    normals = [
        0, 1, 0,
        0, 1, 0,
    ];

    tex_coord = [
        0.0, 1.0,
        1.0, 1.0,
        0.5, 0.0,
     ];
}