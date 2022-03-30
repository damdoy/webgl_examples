class Plane{

   setup(gl){
      this.gl = gl;

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

      this.normal_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

      this.idx_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);


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

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

      this.gl.useProgram(this.shader_program);

      this.gl.uniform3fv(
         this.gl.getUniformLocation(this.shader_program, "light_pos"),
         this.light_pos);

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

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
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
         pixel_normal = normalize(vec3(model*vec4(normal, 0.0)));
         gl_Position = proj*view*model*vertex_pos;
      }
    `;

   fragment_shader_code = `
      precision mediump float; //necessary in webgl glsl, medium precision for performance?

      varying vec3 pixel_pos;
      varying vec3 pixel_normal;

      uniform vec3 light_pos;

      void main() {

         vec3 light_dir = normalize(light_pos-pixel_pos);
         float angle_light = dot(light_dir, pixel_normal);
         float dist_light = distance(pixel_pos, light_pos);

         float light_amount = angle_light-dist_light/50.0;

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

   normals = [
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
   ];
}
