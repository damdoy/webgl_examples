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
var position_cam = [-5.0, cam_height, 0];

var light_pos_radius = 5;
var light_pos = [-1, 5.0, 0];

var plane = new Plane;

var last_time = 0;

function main() {
   canvas = document.querySelector("#glCanvas");
   gl = canvas.getContext("webgl");
   // Only continue if WebGL is available and working
   if(gl === null) {
      alert("cannot init WebGL");
      return;
   }

   //needed to be able to have floating point textures in webgl1
   if(gl.getExtension('OES_texture_float') == null){
      alert("cannot have floating point textures");
      return;
   }

   if(gl.getExtension('OES_texture_float_linear') == null){
      alert("cannot have linear floating point textures");
      return;
   }

   plane.setup(gl);

   //model matrix for the plane
   mat4.scale(model_matrix_plane, model_matrix_plane, [2, 0, 2]);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);

   model_matrix_plane = mat4.rotate(model_matrix_plane, model_matrix_plane, 0.1*Math.PI, [0,1,0]);
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

   //so that first time we do the loop, time_diff does not contain crazy value
   if(last_time == 0){
      last_time = time;
   }

   //make it framerate independent
   time_diff = time-last_time;

   var camera_height = document.getElementById("slider_height").value;

   var light_speed = 80;

   //apply a rotation matrix on the light pos to make it rotate around the origin
   light_pos[0] = light_pos[0]*Math.cos(time_diff*light_speed)-light_pos[2]*Math.sin(time_diff*light_speed);
   light_pos[1] = 5;
   light_pos[2] = light_pos[0]*Math.sin(time_diff*light_speed)+light_pos[2]*Math.cos(time_diff*light_speed);

   //renormalize the rotating bit of the light position, to not lose precision
   var vec_rot_length = light_pos[0]*light_pos[0]+light_pos[2]*light_pos[2];
   light_pos[0] = light_pos[0]/vec_rot_length;
   light_pos[2] = light_pos[2]/vec_rot_length;

   var light_pos_scaled = [light_pos[0]*light_pos_radius, light_pos[1], light_pos[2]*light_pos_radius];
   plane.set_light_pos(light_pos_scaled)

   position_cam[1] = camera_height/10;

   plane.set_mvp(model_matrix_plane, view_matrix, proj_matrix);
   plane.draw();

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
