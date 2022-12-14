var canvas;
// Initialize the GL context
var gl;

var proj_matrix = mat4.create();
var view_matrix = mat4.create();

var model_matrix_plane = mat4.create();
var model_matrix_grass_manager = mat4.create();

var cam_height = 25;
var position_cam = [-70.0, cam_height, 0];

var plane = new Plane_sine;
var grass_manager = new Grass_manager;

var last_time = 0;

var time_wind = 0;

function main() {
   canvas = document.querySelector("#glCanvas");
   gl = canvas.getContext("webgl2");
   // Only continue if WebGL is available and working
   if (gl === null) {
      alert("cannot init WebGL2");
      return;
   }

   plane.setup(gl);

   mat4.scale(model_matrix_plane, model_matrix_plane, [50, 3, 50]);
   mat4.scale(model_matrix_grass_manager, model_matrix_grass_manager, [1, 1, 1]);
   mat4.translate(model_matrix_grass_manager, model_matrix_grass_manager, [0, 0, 0]);

   plane.set_model_matrix(model_matrix_plane);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);

   grass_manager.setup(gl, plane);
}

function draw(){
   var cam_pos = document.getElementById("camera_position").value;

   position_cam[0] = -cam_pos;

   mat4.lookAt(view_matrix, position_cam, [70-cam_pos, 0, 0], [0, 1, 0]);

   gl.clearColor(0.5, 0.7, 0.9, 1.0);
   gl.clearDepth(1.0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   d = new Date();
   time = d.getTime()/100000.0;
   //make it framerate independent
   time_diff = time-last_time;

   var wind_speed = document.getElementById("slider_speed").value;
   // wind_speed = wind_speed/50.0;
   time_wind += wind_speed/70000.0;

   if(document.getElementById("16000").checked == true){
      grass_manager.set_max_grass(16000);
   }
   else if(document.getElementById("8000").checked == true){
      grass_manager.set_max_grass(8000);
   }
   else if(document.getElementById("4000").checked == true){
      grass_manager.set_max_grass(4000);
   }

   plane.set_mvp(model_matrix_plane, view_matrix, proj_matrix);
   plane.draw();

   grass_manager.set_time( time_wind);
   grass_manager.set_mvp(model_matrix_grass_manager, view_matrix, proj_matrix);
   grass_manager.draw();

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
