
class Quad_screen{

   setup(gl, screen_width, screen_height){
      this.gl = gl;

      this.screen_width = screen_width;
      this.screen_height = screen_height;
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

      //texture coordinate buffer
      this.tex_coord_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coord_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.text_coord), gl.STATIC_DRAW);

      this.effect_active = 0;
   }

   set_framebuffer_texture(tex){
      this.fb_texture_id = tex;
   }

   set_effect_active(effect){
      this.effect_active = effect;
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

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, this.fb_texture_id);

      gl.uniform1i(gl.getUniformLocation(this.shader_program, "texture"), 0);
      gl.uniform1i(gl.getUniformLocation(this.shader_program, "effect_select"), this.effect_active);
      gl.uniform1f(gl.getUniformLocation(this.shader_program, "tex_width"), this.screen_width);
      gl.uniform1f(gl.getUniformLocation(this.shader_program, "tex_height"), this.screen_height);


      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
   }

   vertex_shader_code = `
      attribute vec4 vertex_pos;
      attribute vec2 uv;

      varying vec2 frag_uv;

      void main() {
         gl_Position = vertex_pos;
         frag_uv = uv;
      }
    `;

   fragment_shader_code = `
      precision mediump float; //necessary in webgl glsl, medium precision for performance?
      varying vec2 frag_uv;

      uniform sampler2D texture;

      uniform int effect_select;

      uniform float tex_width;
      uniform float tex_height;

      //grayscale
      float col_to_gs(vec3 vec){
         return 0.21*vec.x + 0.72*vec.y + 0.07*vec.z;
      }

      void main() {
         vec3 color_out = vec3(0.0, 0.0, 0.0);

         if(effect_select == 0){
            gl_FragColor = texture2D(texture, frag_uv);
         }
         else if(effect_select == 1){
            gl_FragColor = vec4(vec3(1.0)-texture2D(texture, frag_uv).rgb, 1.0);
         }
         else if(effect_select == 2){

            const int gauss_mat_size = 12;
            float variance = 10.0;
            float mean = float(gauss_mat_size)/2.0;
            float gauss_mat[gauss_mat_size];
            float gauss_mat_coef = 0.0;

            //init the blurring mat
            for(int i = 0; i < gauss_mat_size; i++){
               float val = 1.0/sqrt(2.0*3.1415*variance);
               val = val*pow(2.7182818, -pow((float(i)-mean), 2.0)/(2.0*variance));
               gauss_mat[i] = val;
               gauss_mat_coef += val;
            }

            gauss_mat_coef = 1.0/(gauss_mat_coef*gauss_mat_coef);

            for(int i = 0; i < gauss_mat_size; i++){
               float rel_i = float(i-(gauss_mat_size-1)/2);
               float sum = 0.0;
               for(int j = 0; j < gauss_mat_size; j++){
                  float rel_j = float(j-(gauss_mat_size-1)/2);
                  float matrix_val = gauss_mat[i]*gauss_mat[j];
                  color_out += matrix_val*texture2D(texture, frag_uv+vec2(rel_i/tex_width,rel_j/tex_height)).rgb;
               }
            }

            color_out = color_out*gauss_mat_coef;
            gl_FragColor = vec4(color_out, 1.0);
         }
         else if(effect_select == 3){

            const int sobel_x_size = 3;
            // float sobel_x[sobel_x_size*sobel_x_size] = float[](1, 0, -1, 2, 0, -2, 1, 0, -1); //only glsl3.0
            float sobel_x[sobel_x_size*sobel_x_size];
            sobel_x[0] = 1.0;
            sobel_x[1] = 0.0;
            sobel_x[2] = -1.0;
            sobel_x[3] = 2.0;
            sobel_x[4] = 0.0;
            sobel_x[5] = -2.0;
            sobel_x[6] = 1.0;
            sobel_x[7] = 0.0;
            sobel_x[8] = -1.0;

            const int sobel_y_size = 3;
            // float sobel_y[sobel_y_size*sobel_y_size] = float[](1, 2, 1, 0, 0, 0, -1, -2, -1); //only glsl3.0
            float sobel_y[sobel_y_size*sobel_y_size];
            sobel_y[0] = 1.0;
            sobel_y[1] = 2.0;
            sobel_y[2] = 1.0;
            sobel_y[3] = 0.0;
            sobel_y[4] = 0.0;
            sobel_y[5] = 0.0;
            sobel_y[6] = -1.0;
            sobel_y[7] = -2.0;
            sobel_y[8] = -1.0;

            float edge_x = 0.0;
            float edge_y = 0.0;

            for(int i = 0; i < sobel_x_size; i++){
               float rel_i = float(i)-(float(sobel_x_size)-1.0)/2.0;

               for(int j = 0; j < sobel_y_size; j++){
                  float rel_j = float(j)-(float(sobel_y_size)-1.0)/2.0;
                  float grayscale_pixel = col_to_gs(texture2D(texture, frag_uv+vec2(rel_i/tex_width,rel_j/tex_height)).rgb);
                  edge_x += sobel_x[j*3+i]*grayscale_pixel;
                  edge_y += sobel_y[j*3+i]*grayscale_pixel;
               }
            }

            color_out = vec3(sqrt(edge_x*edge_x+edge_y*edge_y));
            gl_FragColor = vec4(color_out, 1.0);
         }
         else if(effect_select == 4){
            float move_x = sin(frag_uv.x*500.0)*10.0;
            float move_y = sin(frag_uv.y*500.0)*10.0;

            color_out = texture2D(texture, frag_uv+vec2(move_x/tex_width,move_y/tex_height)).rgb;
            gl_FragColor = vec4(color_out, 1.0);
         }
         else{
            gl_FragColor = texture2D(texture, frag_uv);
         }
      }
   `;

   positions = [
     -1.0, -1.0, 0.0,
     +1.0, -1.0, 0.0,
     -1.0, +1.0, 0.0,
     +1.0, +1.0, 0.0,
   ];

   text_coord = [
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      1.0,  1.0,
   ];
}
