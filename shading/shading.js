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
var model_matrix_cubes = [mat4.create(), mat4.create()];

var cam_height = 5;
var position_cam = [-20.0, cam_height, -20.0];

var rotating_cube = new Cube;

var cubes = [new Cube, new Cube];
var plane = new Plane;

var light_pos_radius = 10;
var light_pos = [-light_pos_radius, 5.0, 0];


var last_time = 0;

function main() {
   canvas = document.querySelector("#glCanvas");
   gl = canvas.getContext("webgl");
   // Only continue if WebGL is available and working
   if (gl === null) {
      alert("cannot init WebGL");
      return;
   }

   rotating_cube.setup(gl);
   cubes[0].setup(gl);
   cubes[1].setup(gl);

   plane.setup(gl);

   //model matrix for the plane
   mat4.scale(model_matrix_plane, model_matrix_plane, [10, 1, 10]);

   mat4.translate(model_matrix_cubes[0], model_matrix_cubes[0], [0, 1, 5]);
   mat4.translate(model_matrix_cubes[1], model_matrix_cubes[1], [5, 1, -5]);

   cubes[0].set_model_matrix(model_matrix_cubes[0]);
   cubes[1].set_model_matrix(model_matrix_cubes[1]);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);
}

function draw(){

   mat4.lookAt(view_matrix, position_cam, [0, 0, 0], [0, 1, 0]);

   gl.clearColor(0.5, 0.7, 0.9, 1.0);
   gl.clearDepth(1.0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


   d = new Date();
   time = d.getTime()/100000.0;
   //make it framerate independant
   time_diff = time-last_time;

   var light_speed = document.getElementById("slider_speed").value;
   var light_height = document.getElementById("slider_height").value;

   //apply a rotation matrix on the light pos to make it rotate around the origin
   light_pos[0] = light_pos[0]*Math.cos(time_diff*light_speed)-light_pos[2]*Math.sin(time_diff*light_speed);
   light_pos[1] = light_height;
   light_pos[2] = light_pos[0]*Math.sin(time_diff*light_speed)+light_pos[2]*Math.cos(time_diff*light_speed);

   plane.set_light_pos(light_pos);
   rotating_cube.set_light_pos(light_pos);
   cubes[0].set_light_pos(light_pos);
   cubes[1].set_light_pos(light_pos);

   //rotate the model matrix of the cube by a little bit
   var model = rotating_cube.get_model_matrix();
   model = mat4.rotate(model, model, 2*Math.PI*time_diff*10, [0,1,0]);
   rotating_cube.set_model_matrix(model);

   rotating_cube.set_vp(view_matrix, proj_matrix);
   rotating_cube.draw();

   plane.set_mvp(model_matrix_plane, view_matrix, proj_matrix);
   plane.draw();

   cubes[0].set_mvp(model_matrix_cubes[0], view_matrix, proj_matrix);
   cubes[0].draw();

   cubes[1].set_mvp(model_matrix_cubes[1], view_matrix, proj_matrix);
   cubes[1].draw();

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
