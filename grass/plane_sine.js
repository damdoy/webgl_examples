class Plane_sine{

   setup(gl){
      this.gl = gl;

      this.model = mat4.create();

      this.nb_vertices_side = 48;//default

      this.generate_geometry();

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
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

      this.idx_buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

   }

   //the shape of the plane
   get_height_priv(x, z){
      return Math.sin(x*5)+Math.sin(z*5);
   }

   generate_geometry()
   {
      var increment = 1.0/(this.nb_vertices_side-1);

      this.vertices = [];

      //the vertices
      for (let y = 0; y < this.nb_vertices_side; y++) {
         for (let x = 0; x < this.nb_vertices_side; x++) {
            this.vertices.push(-1.0+2*increment*x);
            this.vertices.push(this.get_height_priv(-1.0+2*increment*x, -1.0+2*increment*y));
            this.vertices.push(-1.0+2*increment*y);
         }
      }

      this.indices = [];

      //generate the indices
      for (let y = 0; y < this.nb_vertices_side-1; y++) {
         for (let x = 0; x < this.nb_vertices_side-1; x++) {
            var this_vertice = y*this.nb_vertices_side+x;
            //one of the triangle
            this.indices.push(this_vertice+1); //top right
            this.indices.push(this_vertice);
            this.indices.push(this_vertice+this.nb_vertices_side);

            this.indices.push(this_vertice+this.nb_vertices_side);
            this.indices.push(this_vertice+this.nb_vertices_side+1);
            this.indices.push(this_vertice+1);
         }
      }
   }

   //get the height of the plane from position, but taking into account a model matrix for the shape (ex scale)
   get_height(pos_x, pos_y){
      //just assume a simple scale matrix, to simplify the matrix manipulations

      var pos_x_transf = pos_x/this.model[0]; // [0][0];
      var pos_y_transf = pos_y/this.model[10]; // [2][2] as mat4 is a 1D array

      var height = this.get_height_priv(pos_x_transf, pos_y_transf);

      return height*this.model[5] //[1][1];
   }

   //old version with any type of model matrix, annoying
   // get_height_old(pos_x, pos_y){
   //    var vec = vec4.create();
   //    vec[0] = pos_x;
   //    vec[1] = 0;
   //    vec[2] = pos_y;
   //    vec[3] = 1.0;

   //    var vec_transf = vec4.create();
   //    vec4.transformMat4(vec_transf, vec, this.model);

   //    var height = this.get_height_priv(vec_transf[0], vec_transf[2]);

   //    var vec_height = vec4.create();
   //    vec[0] = 0;
   //    vec[1] = height;
   //    vec[2] = 0;
   //    vec[3] = 1.0;

   //    var model_height = vec4.create();
   //    vec4.transformMat4(model_height, vec_height, this.model);

   //    return model_height[1];
   // }

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

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx_buffer);

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

      var nb_squares = this.nb_vertices_side-1;
      var nb_vertices_to_draw = nb_squares*nb_squares*6;

      this.gl.drawElements(this.gl.TRIANGLES, nb_vertices_to_draw, this.gl.UNSIGNED_SHORT, 0);
   }

   vertex_shader_code = `
      attribute vec4 vertex_pos;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 proj;

      void main() {
         gl_Position = proj*view*model*vertex_pos;
      }
    `;

   fragment_shader_code = `
      precision mediump float;

      void main() {
         // just output some brown color
         gl_FragColor = vec4(0.3, 0.14, 0.07, 1.0);
      }
   `;
}
