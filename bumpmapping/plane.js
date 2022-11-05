class Plane{

   setup(gl){
      this.gl = gl;

      this.model = mat4.create();

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

      //texture coordinate buffer
      this.tex_coord_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coord_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.text_coord), gl.STATIC_DRAW);

      //prepare buffer for texture
      this.texture_id = gl.createTexture();
   }

   set_normal_map(normal_map_float, size){
      gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size, size, 0, gl.RGB, gl.FLOAT, new Float32Array(normal_map_float));

      // gl.generateMipmap(gl.TEXTURE_2D);
      // or
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //do not forget this for float textures
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
         this.model);

      this.gl.uniform3fv(
         this.gl.getUniformLocation(this.shader_program, "light_pos"),
         this.light_pos);

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

      gl.uniform1i(gl.getUniformLocation(this.shader_program, "texture"), 0);

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
   }

   vertex_shader_code = `
      attribute vec4 vertex_pos;
      attribute vec2 uv;

      varying vec2 frag_uv;
      varying vec3 pixel_pos;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      void main() {
         gl_Position = proj*view*model*vertex_pos;
         frag_uv = uv;
         pixel_pos = vec3(model*vertex_pos);
      }
    `;

   fragment_shader_code = `
      precision mediump float; //necessary in webgl glsl, medium precision for performance?
      varying vec2 frag_uv;
      varying vec3 pixel_pos;

      uniform vec3 light_pos;

      uniform sampler2D texture;

      void main() {
         vec3 pixel_normal = texture2D(texture, frag_uv).xyz;

         //calculate phong according to the normal map
         vec3 light_dir = normalize(light_pos-pixel_pos);
         float angle_light = dot(light_dir, pixel_normal);
         float dist_light = distance(pixel_pos, light_pos);

         float light_amount = angle_light-dist_light/50.0;

         //have white plane affected by light
         gl_FragColor = vec4(1.0*light_amount, 1.0*light_amount, 1.0*light_amount, 1.0);
      }
   `;

   positions = [
     -1.0, 0.0, -1.0,
      1.0, 0.0, -1.0,
      1.0, 0.0,  1.0,
     -1.0, 0.0,  1.0,
   ];

   indices = [
       0,  2,  1,  0,  3,  2
     ];

   text_coord = [
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
   ];
}
