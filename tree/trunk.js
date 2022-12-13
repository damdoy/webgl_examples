class Trunk{
    setup(gl){
        this.gl = gl;

        this.create_positions();

        this.transf = [];

        this.rand_vals = [];
        this.end_point_matrices = [];

        //have fixed random values for each iteration of the trunks
        for (let i = 0; i < 32; i++) {
            this.rand_vals.push( Math.random());
        }

        //first trunk (axiom or root of the lsystem)
        var trunk_initial_transf = mat4.create();
        mat4.translate(trunk_initial_transf, trunk_initial_transf, [0, 0.5, 0]);
        mat4.scale(trunk_initial_transf, trunk_initial_transf, [1.5/14, 1, 1.5/14]);

        this.add_sub_trunks_lsystem_random(trunk_initial_transf, 0, 5, true);

        this.model = mat4.create();

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

        //indices for the texture pos
        this.texcoord_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoord_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.tex_coord), this.gl.STATIC_DRAW)

        //this.transf
        this.transforms_list = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transforms_list);

        //put all the model matrices in a buffer, need the mat4 in a flat structure, a list
        var lst_model_flat = this.transf.map(a=>[...a]).flat();
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lst_model_flat), this.gl.STATIC_DRAW);

        this.nb_trunks = this.transf.length;
        this.light_pos = [0, 0, 0];
    }

    get_end_point_matrices(){
        return this.end_point_matrices;
    }

    set_mvp(model, view, proj){
        this.model = model;
        this.view = view;
        this.proj = proj;
    }

    set_light_pos(light_pos){
        this.light_pos = light_pos;
    }

    draw(){
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

        this.gl.useProgram(this.shader_program);

        this.gl.uniform3fv(
            this.gl.getUniformLocation(this.shader_program, "light_pos"),
            this.light_pos);

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

        this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.nb_indices, this.gl.UNSIGNED_SHORT, 0, this.nb_trunks);

        this.gl.vertexAttribDivisor(uniform_loc, 0);
    }

    vertex_shader_code = `
        attribute vec4 vertex_pos;
        attribute vec3 normal;
        attribute vec2 uv;
        attribute mat4 model_mat;

        varying vec3 pixel_pos;
        varying vec3 pixel_normal;
        varying vec2 frag_uv;

        uniform mat4 model;
        uniform mat4 view;
        uniform mat4 proj;

        void main() {
            mat4 model_global = model*model_mat;
            pixel_pos = vec3(model_global*vertex_pos);

            //normally the model matrix for normals should be different to keep orientation of normals
            //but it is a pain in webgl as we dont seem to have the inverse and transpose, so i don't do it
            // mat3 normal_mat = mat3(transpose(inverse(model)));
            mat3 normal_mat = mat3(model_global);

            frag_uv = uv;

            //also transform the normals according to the model matrix
            pixel_normal = normalize(normal_mat*normal);
            gl_Position = proj*view*model_global*vertex_pos;
        }
    `;

   fragment_shader_code = `
        precision mediump float; //necessary in webgl glsl, medium precision for performance?

        varying vec3 pixel_pos;
        varying vec3 pixel_normal;
        varying vec2 frag_uv;

        uniform vec3 light_pos;

        vec3 bark_high = vec3(0.6, 0.4, 0.2);
        vec3 bark_low = vec3(0.4, 0.25, 0.2);

        vec3 get_billin(vec2 pos, vec3 min, vec3 max);

        void main() {

            vec3 light_dir = normalize(light_pos-pixel_pos);
            float diffuse_light = dot(light_dir, pixel_normal);

            vec3 texture_col = get_billin(frag_uv*4.0, bark_low, bark_high);

            vec3 color_trunk = texture_col*diffuse_light;

            gl_FragColor = vec4( color_trunk , 1.0);;
        }

        float rand(vec2 pt)
        {
            float x = pt.x*3.13;
            float y = pt.y*7.17;
            return fract(x*y/17.0);
        }

        vec3 get_billin(vec2 pos, vec3 min, vec3 max)
        {

            float val00 = rand((pos));
            float val10 = rand((vec2(pos.x, pos.y+1.0)));
            float val01 = rand((vec2(pos.x+1.0, pos.y)));
            float val11 = rand((vec2(pos.x+1.0, pos.y+1.0)));

            vec2 pos_fract = fract(pos);

            //2d linear interpolation
            float val_x0 = mix(val00, val01, pos_fract.x);
            float val_x1 = mix(val10, val11, pos_fract.x);

            float final_val = mix(val_x0, val_x1, pos_fract.y);

            return mix(max, min, final_val);
        }
   `;

    lerp(val, min, max){
        return (1-val)*min+val*max;
    }

    //recursive function for generating a l-system tree structure
    add_sub_trunks_lsystem_random(t, level, max_level, is_end_point){

        //if this trunk section is the last one, generate the matrix and end point for this bit
        //and add them in a list
        if(level >= max_level){
            //model matrix for the trunk model
            this.transf.push(t);

            //model matrix for the leaves
            if(is_end_point){
                var point = vec4.create();
                point[0] = 0;
                point[1] = 0.5;
                point[2] = 0;
                point[3] = 1.0;
                vec4.transformMat4(point, point, t);
                var end_point_translation = mat4.create();
                mat4.translate(end_point_translation, end_point_translation, [point[0], point[1], point[2]]);

                this.end_point_matrices.push(end_point_translation);
            }
            return;
        }

        //base trunk
        var t0 = mat4.create();
        mat4.translate(t0, t0, [0, 0, 0]);
        mat4.scale(t0, t0, [1, 1, 1]);
        mat4.multiply(t0, t0, t);
        this.add_sub_trunks_lsystem_random(t0, level+1000, max_level, false);

        //top trunk
        var t1 = mat4.create();
        mat4.translate(t1, t1, [0, 0.98, 0]);
        mat4.rotate(t1, t1, this.lerp(this.rand_vals[2], 0, 2*3.1415), [0.0, 1.0, 0.0])
        mat4.rotate(t1, t1, this.lerp(this.rand_vals[0], 3.1415/14.0, 3.1415/10.0), [0.0, 0.0, 1.0])
        mat4.rotate(t1, t1, this.lerp(this.rand_vals[1], 3.1415/14.0, 3.1415/10.0), [1.0, 0.0, 0.0])
        mat4.scale(t1, t1, [0.8, 0.8, 0.8]);
        mat4.multiply(t1, t1, t);
        this.add_sub_trunks_lsystem_random(t1, level+1, max_level, true);

        //side trunks / twigs
        var b0 = mat4.create();
        mat4.translate(b0, b0, [0, this.lerp(this.rand_vals[16], 0.5, 0.9), 0] );
        mat4.rotate(b0, b0, this.lerp(this.rand_vals[8], 0, 2*3.1415), [0.0, 1.0, 0.0])
        mat4.rotate(b0, b0, this.lerp(this.rand_vals[6], 3.1415/4.0, 3.1415/10.0), [0.0, 0.0, 1.0])
        mat4.rotate(b0, b0, this.lerp(this.rand_vals[7], 3.1415/4.0, 3.1415/10.0), [1.0, 0.0, 0.0])
        mat4.scale(b0, b0, [0.6, 0.6, 0.6]);
        mat4.multiply(b0, b0, t);
        this.add_sub_trunks_lsystem_random(b0, level+1, max_level, true);

        var b1 = mat4.create();
        mat4.translate(b1, b1, [0, this.lerp(this.rand_vals[17], 0.5, 0.9), 0] );
        mat4.rotate(b1, b1, this.lerp(this.rand_vals[11], 0, 2*3.1415), [0.0, 1.0, 0.0])
        mat4.rotate(b1, b1, this.lerp(this.rand_vals[9], 3.1415/3.0, 3.1415/10.0), [0.0, 0.0, 1.0])
        mat4.rotate(b1, b1, this.lerp(this.rand_vals[10], 3.1415/3.0, 3.1415/10.0), [1.0, 0.0, 0.0])
        mat4.scale(b1, b1, [0.5, 0.5, 0.5]);
        mat4.multiply(b1, b1, t);
        this.add_sub_trunks_lsystem_random(b1, level+1, max_level, true);

        var b2 = mat4.create();
        mat4.translate(b2, b2, [0, this.lerp(this.rand_vals[18], 0.5, 0.9), 0] );
        mat4.rotate(b2, b2, this.lerp(this.rand_vals[14], 0, 2*3.1415), [0.0, 1.0, 0.0])
        mat4.rotate(b2, b2, this.lerp(this.rand_vals[12], 3.1415/2.0, 3.1415/10.0), [0.0, 0.0, 1.0])
        mat4.rotate(b2, b2, this.lerp(this.rand_vals[13], 3.1415/2.0, 3.1415/10.0), [1.0, 0.0, 0.0])
        mat4.scale(b2, b2, [0.4, 0.4, 0.4]);
        mat4.multiply(b2, b2, t);
        this.add_sub_trunks_lsystem_random(b2, level+1, max_level, true);
    }

    //create vertices, normals, indices for a cylinder that would represent a trunk section
    create_positions(){
        var nb_vertices = 6;

        this.positions = [];

        this.positions.push(0);
        this.positions.push(-1.0/2.0);
        this.positions.push(0);
        this.positions.push(0);
        this.positions.push(1.0/2.0);
        this.positions.push(0);

        //to make base of trunk slightly larger
        var bigger_base = 1.1;

        for (let i = 0; i < nb_vertices; i++) {
            var angle_val = 3.1415*2.0*(1.0/nb_vertices)*i;
            this.positions.push((Math.sin(angle_val)/2.0)*bigger_base);
            this.positions.push(-1.0/2.0);
            this.positions.push((Math.cos(angle_val)/2.0)*bigger_base);
            this.positions.push((Math.sin(angle_val)/2.0)*(1.0/bigger_base));
            this.positions.push(1.0/2.0);
            this.positions.push((Math.cos(angle_val)/2.0)*(1.0/bigger_base));
        }


        this.nb_indices = 3*nb_vertices*2+3*nb_vertices*2;
        this.indices = [];
        for (let i = 0; i < nb_vertices; i++) {
            var start_idx_face = 2+2*i; // 12 points per face
            var up_left = start_idx_face+1; //may be another one
            var up_right = start_idx_face+3;
            if(up_right >= 2+2*nb_vertices){
                up_right = 2+1;
            }
            var down_left = start_idx_face+0;
            var down_right = start_idx_face+2;
            if(down_right >= 2+2*nb_vertices){
                down_right = 2;
            }

            //top
            this.indices.push(1);
            this.indices.push(up_left);
            this.indices.push(up_right);
            //side
            this.indices.push( up_left);
            this.indices.push(down_left);
            this.indices.push(down_right);

            this.indices.push(up_right);
            this.indices.push( up_left);
            this.indices.push(down_right);

            //bottom
            this.indices.push( 0);
            this.indices.push(down_right);
            this.indices.push(down_left);
        }

        //per vertex textcoord
        this.tex_coord = [];

        this.tex_coord.push(1);
        this.tex_coord.push(1);
        this.tex_coord.push(0);
        this.tex_coord.push(0);

        for (let i = 0; i < nb_vertices; i++) {
            // i: 0 -> 0.5 == 0 -> 1
            // i: 0.5 -> 1.0 == 1 -> 0
            var relative_pos = i/nb_vertices;

            if ( relative_pos < 0.5){
                relative_pos = relative_pos*2;
            }
            else{ //relative_pos > 0.5f (0.5=1, 1.0=0)
                relative_pos = relative_pos*(-2)+2;
            }

            this.tex_coord.push(relative_pos); //bottom
            this.tex_coord.push(1.0);

            this.tex_coord.push(relative_pos); //top
            this.tex_coord.push(0.0);
        }

        //per vertex normal

        this.normals = []

        this.normals.push(0.0);
        this.normals.push(-1.0);
        this.normals.push(0.0);

        this.normals.push(0.0);
        this.normals.push(1.0);
        this.normals.push(0.0);

        for (let i = 0; i < nb_vertices; i++) {
            var angle_val = 3.1415*2.0*(1.0/nb_vertices)*i;
            this.normals.push(Math.sin(angle_val));
            this.normals.push(0.0);
            this.normals.push(Math.cos(angle_val));

            this.normals.push(Math.sin(angle_val));
            this.normals.push(0.0);
            this.normals.push(Math.cos(angle_val));
        }
    }
}