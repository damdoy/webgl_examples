class Grass_manager{

   setup(gl, plane){
      this.gl = gl;

      this.base = plane;

      this.max_grass = 16000;

      const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertex_shader_code);
      const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragment_shader_code);

      this.shader_program = this.gl.createProgram();
      this.gl.attachShader(this.shader_program, vertexShader);
      this.gl.attachShader(this.shader_program, fragmentShader);
      this.gl.linkProgram(this.shader_program);

      if (!this.gl.getProgramParameter(this.shader_program, this.gl.LINK_STATUS)) {
         alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.shader_program));
         return null;
      }

      this.pos_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

      this.idx_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

      this.tex_coord_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coord_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tex_coord), gl.STATIC_DRAW);

      //generate a model matrix for each grass blade, that will be put in a buffer, to be drawn with instanced rendering
      this.lst_transforms = []

      for (let i = 0; i < this.max_grass; i++) {
         var pos_x = 100*(Math.random()-0.5)
         var pos_y = 100*(Math.random()-0.5)
         this.lst_transforms[i] = this.get_grass_matrix(pos_x, pos_y);
      }

      this.transforms_list = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transforms_list);

      //put all the model matrices in a buffer, need the mat4 in a flat structure, a list
      var lst_model_flat = this.lst_transforms.map(a=>[...a]).flat();
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(lst_model_flat), this.gl.STATIC_DRAW);

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

      this.time = 0;
   }

   set_max_grass(mg){
      this.max_grass = mg;
   }

   //do a bit of matrix rotations (with randomness) to get a blade of grass standing up
   get_grass_matrix(pos_x, pos_y){
      var model_matrix_grass = mat4.create();

      mat4.translate(model_matrix_grass, model_matrix_grass, [0, this.base.get_height(pos_x,pos_y), 0]);
      mat4.translate(model_matrix_grass, model_matrix_grass, [pos_x, 0, pos_y]);
      mat4.scale(model_matrix_grass, model_matrix_grass, [0.3, 1.7, 0.3]);
      mat4.scale(model_matrix_grass, model_matrix_grass, [1, 1+Math.random(), 1]);
      mat4.translate(model_matrix_grass, model_matrix_grass, [0, 2, 0]);
      mat4.rotate(model_matrix_grass, model_matrix_grass, 3.1415/4.0*pos_x*pos_y*5.244 ,[0, 1, 0]);
      mat4.rotate(model_matrix_grass, model_matrix_grass, 3.1415/2.0 ,[1, 0, 0]);

      return model_matrix_grass;
   }

   //generate wind texture, which will impact the position of the grass
   //only R component of the texture will be used
   generate_wind_texture(size){
      this.wind_array_texture = [];

      for (var i = 0; i < size; i++) {
         for (var j = 0; j < size; j++) {
            var val = Math.sin(i/size*16)*Math.cos(j/size*8);
            val += 0.25*Math.sin(i/size*32)*Math.cos(j/size*64);
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

   set_light_pos(light_pos){
      this.light_pos = light_pos;
   }

   set_model_matrix(model){
      this.model = model;
   }

   get_model_matrix(){
      return this.model;
   }

   set_time(t){
      this.time = t;
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

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_coord_buffer);
      this.gl.vertexAttribPointer(
          this.gl.getAttribLocation(this.shader_program, "uv"),
          2,
          this.gl.FLOAT,
          true,
          0,
          0);
      this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.shader_program, "uv"));

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transforms_list);

      //setup the buffer to tell webgl to use a single mat4 matrix per instanced rendering, a bit wordy$
      //webgl2 was needed for the instanced rendering
      var uniform_loc = this.gl.getAttribLocation(this.shader_program, "mat_model");

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

      this.gl.useProgram(this.shader_program);

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
         this.lst_transforms[0] );

      this.gl.uniform1f( this.gl.getUniformLocation(this.shader_program, "time"), this.time );

      this.gl.activeTexture(gl.TEXTURE0);

      this.gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

      this.gl.uniform1i(gl.getUniformLocation(this.shader_program, "tex_wind"), 0);


      this.gl.disable(this.gl.CULL_FACE);

      //tell webgl we will draw max_grass blades that each contains 15 vertices
      this.gl.drawElementsInstanced(this.gl.TRIANGLES, 15, this.gl.UNSIGNED_SHORT, 0, this.max_grass);

      this.gl.enable(this.gl.CULL_FACE);

      this.gl.vertexAttribDivisor(uniform_loc, 0);
   }

   //needed glsl 3 for gl_VertexID
   vertex_shader_code = `#version 300 es
      precision mediump float;
      in vec4 vertex_pos;

      in mat4 mat_model;
      in vec2 uv;

      out vec3 pixel_pos;
      out vec2 global_uv;
      out vec2 frag_uv;
      out vec2 rel_tex_pos;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      uniform float time;

      uniform sampler2D tex_wind;

      void main() {
         pixel_pos = vec3(mat_model*vertex_pos);

         vec2 relative_tex_pos = vec2(pixel_pos.x/100.0+0.5, pixel_pos.z/100.0+0.5);
         global_uv = relative_tex_pos;

         frag_uv = uv;

         vec2 wind_dir = vec2(time, time);
         float wind_x = texture(tex_wind, relative_tex_pos+wind_dir ).r-0.5;
         float wind_z = texture(tex_wind, relative_tex_pos+vec2(0.5, 0.5)+wind_dir ).r-0.5;

         //make wind a bit more dramatic
         wind_x *= 2.0;
         wind_z *= 2.0;

         rel_tex_pos = relative_tex_pos;

         vec3 new_pos = vec3(mat_model*vertex_pos);

         //move the top vertex of the grass move more than the lower ones
         if(gl_VertexID == 0){
            wind_x *= 3.0;
            wind_z *= 3.0;
            new_pos.x += wind_x;
            new_pos.y -= (abs(wind_x)+abs(wind_z))*0.5;
            new_pos.z += wind_z;
         }
         if(gl_VertexID == 1 || gl_VertexID == 2 ){
            wind_x *= 1.5;
            wind_z *= 1.5;
            new_pos.x += wind_x;
            new_pos.y -= (abs(wind_x)+abs(wind_z))*0.5;
            new_pos.z += wind_z;
         }
         if(gl_VertexID == 3 || gl_VertexID == 4 ){
            wind_x *= 0.5;
            wind_z *= 0.5;
            new_pos.x += wind_x;
            new_pos.y -= (abs(wind_x)+abs(wind_z))*0.5;
            new_pos.z += wind_z;
         }

         gl_Position = proj*view*vec4(new_pos, 1.0);
      }
    `;

   fragment_shader_code = `#version 300 es
      precision mediump float;

      in vec3 pixel_pos;
      in vec2 global_uv;
      in vec2 frag_uv;
      in vec2 rel_tex_pos;

      out vec4 color;

      uniform vec3 light_pos;
      uniform sampler2D tex_wind;

      uniform float time;

      void main() {
         //get a random value for this blade from its position, will be used to vary the colour a bit from grass to grass
         float rand_val = mod((global_uv.x*global_uv.x)+(0.13-global_uv.x*global_uv.y), 0.01)/0.01;

         //make the edges of the blade lighter
         float dist_to_centre = pow(distance(frag_uv, vec2(0.5, 0.5)), 2.0);

         //make the base a bit darker
         float dist_to_ground = clamp((1.0-frag_uv.y)*1.0, 0.0, 1.0);

         color = vec4( (0.1+rand_val/6.0+dist_to_centre)*dist_to_ground, (0.3+dist_to_centre)*dist_to_ground, (0.0+dist_to_centre)*dist_to_ground, 1.0);
      }
   `;

   positions = [
      0.0, 0.0, -2.0, // 0
      -1.0, 0.0, 0.0, // 1
      1.0, 0.0, 0.0, // 2
      -1.0,  0.0, 1.0, // 3
      1.0, 0.0, 1.0, // 4
      -1.0, 0.0, 2.0, // 5
      1.0, 0.0, 2.0, // 6
   ];

   indices = [
      0, 1, 2,
      2, 1, 3,
      2, 3, 4,
      4, 3, 5,
      4, 5, 6,
   ];

   tex_coord = [
      0.5, 0.0,
      0.0, 0.5,
      1.0, 0.5,
      0.0, 0.75,
      1.0, 0.75,
      0.0, 1.0,
      1.0, 1.0,
   ];
}

