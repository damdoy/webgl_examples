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

      //generate texture
      this.size_texture = 8;
      this.generate_texture(this.size_texture)

      //prepare buffer for texture
      this.texture_id = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.size_texture, this.size_texture, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(this.array_texture));

      // gl.generateMipmap(gl.TEXTURE_2D);
      //or
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

   }

   generate_texture(size){
      this.array_texture = [];

      //for normalization
      var max_size = size*size;

      for (var i = 0; i < size; i++) {
         for (var j = 0; j < size; j++) {
          this.array_texture.push( (i*j)/max_size*255 ); //R
          this.array_texture.push( (size-i)*j/max_size*255 ); //G
          this.array_texture.push( i*(size-j)/max_size*255 ); //B
         }
      }
   }

   set_mvp(model, view, proj){
      this.model = model;
      this.view = view;
      this.proj = proj;
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

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, this.texture_id);

      gl.uniform1i(gl.getUniformLocation(this.shader_program, "texture"), 0);

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
   }

   vertex_shader_code = `
      attribute vec4 vertex_pos;
      attribute vec2 uv;

      varying vec2 frag_uv;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      void main() {
         gl_Position = proj*view*model*vertex_pos;
         frag_uv = uv;
      }
    `;

   fragment_shader_code = `
      precision mediump float; //necessary in webgl glsl, medium precision for performance?
      varying vec2 frag_uv;

      uniform sampler2D texture;

      void main() {
         gl_FragColor = texture2D(texture, frag_uv);
         // gl_FragColor = vec4(frag_uv, 0.0, 1.0);
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
