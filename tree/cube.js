class Cube{

   setup(gl){
      this.gl = gl;

      this.model = mat4.create();
      mat4.translate(this.model, this.model, [0, 1, 0]);

      const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, this.vertex_shader_code);
      const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragment_shader_code);

      this.vao = this.gl.createVertexArray();

      this.gl.bindVertexArray(this.vao);

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

      this.light_pos = [0,0,0];
   }

   //sets model view projection matrix
   set_mvp(model, view, proj){
      this.model = model;
      this.view = view;
      this.proj = proj;
   }

   set_vp(view, proj){
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
      this.gl.useProgram(this.shader_program);
      this.gl.bindVertexArray(this.vao);

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

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

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

      //draw the cube
      this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
   }

   set_light_pos(light_pos){
      this.light_pos = light_pos;
   }

   vertex_shader_code = `
      attribute vec4 vertex_pos;
      attribute vec3 normal;

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      void main() {
         pixel_pos = vec3(model*vertex_pos);

         //normally the model matrix for normals should be different to keep orientation of normals
         //but it is a pain in webgl as we dont seem to have the inverse and transpose, so i don't do it
         // mat3 normal_mat = mat3(transpose(inverse(model)));
         mat3 normal_mat = mat3(model);

         //also transform the normals according to the model matrix
         pixel_normal = normalize(normal_mat*normal);
         gl_Position = proj*view*model*vertex_pos;
      }
    `;

   fragment_shader_code = `
      precision highp float;

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;

      uniform vec3 light_pos;

      void main() {

         vec3 light_dir = normalize(light_pos-pixel_pos);
         float angle_light = dot(light_dir, pixel_normal);

         float dist_light = distance(pixel_pos, light_pos);

         float light_amount = angle_light-dist_light/500.0;

         gl_FragColor = vec4(1.0*light_amount, 1.0*light_amount, 1.0*light_amount, 1.0);
      }
   `;

   positions = [
     // Front face
     -1.0, -1.0,  1.0,
      1.0, -1.0,  1.0,
      1.0,  1.0,  1.0,
     -1.0,  1.0,  1.0,

     // Back face
     -1.0, -1.0, -1.0,
     -1.0,  1.0, -1.0,
      1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,

     // Top face
     -1.0,  1.0, -1.0,
     -1.0,  1.0,  1.0,
      1.0,  1.0,  1.0,
      1.0,  1.0, -1.0,

     // Bottom face
     -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, -1.0,  1.0,
     -1.0, -1.0,  1.0,

     // Right face
      1.0, -1.0, -1.0,
      1.0,  1.0, -1.0,
      1.0,  1.0,  1.0,
      1.0, -1.0,  1.0,

     // Left face
     -1.0, -1.0, -1.0,
     -1.0, -1.0,  1.0,
     -1.0,  1.0,  1.0,
     -1.0,  1.0, -1.0,
   ];

   indices = [
       0,  1,  2,      0,  2,  3,    // front
       4,  5,  6,      4,  6,  7,    // back
       8,  9,  10,     8,  10, 11,   // top
       12, 13, 14,     12, 14, 15,   // bottom
       16, 17, 18,     16, 18, 19,   // right
       20, 21, 22,     20, 22, 23,   // left
     ];

   normals = [
      // Front face
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,

      // Back face
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,

      // Top face
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,

      // Bottom face
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,

      // Right face
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,

      // Left face
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
    ];
}
