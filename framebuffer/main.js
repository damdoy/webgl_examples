var canvas;
// Initialize the GL context
var gl;

var shaderProgram;
var indexBuffer;
var pos_buffer;
var col_buffer;

var proj_matrix = mat4.create();
var view_matrix = mat4.create();

var model_matrix_plane = mat4.create();

var cam_height = 5;
var position_cam = [-6.0, cam_height, 0];

var cube = new Cube;
var plane = new Plane;

var quad_screen = new Quad_screen;

var framebuffer = new Framebuffer;

var last_time = 0;

var canvas_width = 1600;
var canvas_height = 900;

function main() {
   canvas = document.querySelector("#glCanvas");
   gl = canvas.getContext("webgl");
   // Only continue if WebGL is available and working
   if (gl === null) {
      alert("cannot init WebGL");
      return;
   }

   canvas_width = gl.canvas.width;
   canvas_height = gl.canvas.height;

   cube.setup(gl);

   plane.setup(gl);

   quad_screen.setup(gl, canvas_width, canvas_height);

   framebuffer.setup(gl, canvas_width, canvas_height);

   quad_screen.set_framebuffer_texture(framebuffer.get_texture());

   //model matrix for the plane
   mat4.scale(model_matrix_plane, model_matrix_plane, [2, 0, 2]);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);

   change_selection();
}

function change_selection(){

   if(document.getElementById("nothing").checked == true){
      quad_screen.set_effect_active(0);
   }
   if(document.getElementById("invert").checked == true){
      quad_screen.set_effect_active(1);
   }
   if(document.getElementById("gaussian").checked == true){
      quad_screen.set_effect_active(2);
   }
   if(document.getElementById("sobel").checked == true){
      quad_screen.set_effect_active(3);
   }
   if(document.getElementById("glass").checked == true){
      quad_screen.set_effect_active(4);
   }
}

function draw(){
   //will render in frambuffer
   framebuffer.bind();
   mat4.lookAt(view_matrix, position_cam, [0, 0, 0], [0, 1, 0]);

   gl.clearColor(0.5, 0.7, 0.9, 1.0);
   gl.clearDepth(1.0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   cube.set_vp(view_matrix, proj_matrix);
   cube.draw();

   d = new Date();
   time = d.getTime()/100000.0;
   //make it framerate independant
   time_diff = time-last_time;

   var rotation_speed = document.getElementById("slider_speed").value;

   //rotate the model matrix of the cube by a little bit
   var model = cube.get_model_matrix();
   model = mat4.rotate(model, model, -2*Math.PI*time_diff*rotation_speed, [0,1,0]);
   cube.set_model_matrix(model);

   plane.set_mvp(model_matrix_plane, view_matrix, proj_matrix);
   plane.draw();

   //everything after that will be rendered in the canvas
   framebuffer.unbind();

   quad_screen.draw();

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
