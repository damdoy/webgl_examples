var canvas;
var gl;

var shader_program;
var indexBuffer;
var pos_buffer;
var col_buffer;

function main() {
   canvas = document.querySelector("#glCanvas")
   gl = canvas.getContext("webgl");
   // Only continue if WebGL is available and working
   if (gl === null) {
      alert("Cannot init WebGL");
      return;
   }

   init_triangle();
}

//init the shaders and the buffers
function init_triangle(){
   vertex_shader_glsl = `
      attribute vec4 vertex_pos;
      attribute vec3 colour;

      varying vec3 frag_colour;
      void main() {
         frag_colour = colour;
         gl_Position = vertex_pos;
      }
    `;

   fragment_shader_glsl = `
      precision mediump float; //this is necessary in webgl glsl
      varying vec3 frag_colour;

      void main() {
        gl_FragColor = vec4(frag_colour, 1.0);
      }
   `;

   const vertex_shader = loadShader(gl, gl.VERTEX_SHADER, vertex_shader_glsl);
   const fragment_shader = loadShader(gl, gl.FRAGMENT_SHADER, fragment_shader_glsl);

   shader_program = gl.createProgram();
   gl.attachShader(shader_program, vertex_shader);
   gl.attachShader(shader_program, fragment_shader);
   gl.linkProgram(shader_program);

   if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shader_program));
      return null;
   }

   //create buffers and populate them for the triangle

   pos_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
   //position for each vertex of the triangle
   var triangle_points = new Float32Array([
                        -1.0, -1.0, 0.0,
                        1.0, -1.0, 0.0,
                        0.0, 1.0, 0.0]);
   gl.bufferData(gl.ARRAY_BUFFER, triangle_points, gl.STATIC_DRAW);

   col_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, col_buffer);
   //the colours for each points in RGB
   var triangle_colours = new Float32Array([
                           1.0, 0.0, 0.0,
                           0.0, 1.0, 0.0,
                           0.0, 0.0, 1.0]);
   gl.bufferData(gl.ARRAY_BUFFER, triangle_colours, gl.STATIC_DRAW);
}

function draw(){

   gl.clearColor(0.0, 0.0, 0.2, 1.0);
   gl.clearDepth(1.0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   gl.useProgram(shader_program);

   gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
   gl.vertexAttribPointer(
         gl.getAttribLocation(shader_program, "vertex_pos"), //the name of the attribute
         3, //how many data per vertex point
         gl.FLOAT, //type
         true, //normalize, no effect for float
         0, //stride
         0); //offset

   gl.enableVertexAttribArray(gl.getAttribLocation(shader_program, "vertex_pos"));

   gl.bindBuffer(gl.ARRAY_BUFFER, col_buffer);
   gl.vertexAttribPointer(
         gl.getAttribLocation(shader_program, "colour"),
         3,
         gl.FLOAT,
         true,
         0,
         0);

   gl.enableVertexAttribArray(gl.getAttribLocation(shader_program, "colour"));

   //will draw 3 points
   gl.drawArrays(gl.TRIANGLES, 0, 3);

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
