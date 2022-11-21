var canvas;
// Initialize the GL context
var gl;

var shaderProgram;
var indexBuffer;
var pos_buffer;
var col_buffer;

var proj_matrix = mat4.create();
var view_matrix = mat4.create();
var view_matrix_reflection = mat4.create();

var cam_height = 20;
var position_cam = [40.0, cam_height, -40.0];

var water = new Water;
var water_transf = mat4.create();

var cubes_base = [new Cube, new Cube, new Cube, new Cube, new Cube];
var model_matrix_cubes_base = [mat4.create(), mat4.create(), mat4.create(), mat4.create(), mat4.create()];

var cubes_decoration = [new Cube, new Cube];
var model_matrix_cubes_decoration = [mat4.create(), mat4.create()]

var light_pos_radius = 10;
var light_pos = [-1, 5.0, 0];

var framebuffer_reflection = new Framebuffer;

var canvas_width = 1600;
var canvas_height = 900;

var last_time = 0;

//needed for reflection matrix calculation
var water_height = 2;

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


   framebuffer_reflection.setup(gl, canvas_width, canvas_height);

   water.setup(gl);

   water.set_reflection_texture(framebuffer_reflection.get_texture());;

   mat4.translate(model_matrix_cubes_base[0], model_matrix_cubes_base[0], [15, 0, 0]);
   mat4.scale(model_matrix_cubes_base[0], model_matrix_cubes_base[0], [5, 2.5, 20]);

   mat4.translate(model_matrix_cubes_base[1], model_matrix_cubes_base[1], [-5, 0, -15]);
   mat4.scale(model_matrix_cubes_base[1], model_matrix_cubes_base[1], [15, 2.5, 5]);

   mat4.translate(model_matrix_cubes_base[2], model_matrix_cubes_base[2], [-5, 0, 15]);
   mat4.scale(model_matrix_cubes_base[2], model_matrix_cubes_base[2], [15, 2.5, 5]);

   mat4.translate(model_matrix_cubes_base[3], model_matrix_cubes_base[3], [-15, 0, 0]);
   mat4.scale(model_matrix_cubes_base[3], model_matrix_cubes_base[3], [5, 2.5, 10]);

   mat4.translate(model_matrix_cubes_base[4], model_matrix_cubes_base[4], [0, -2.5, 0]);
   mat4.scale(model_matrix_cubes_base[4], model_matrix_cubes_base[4], [20, 0.5, 20]);

   for (let i = 0; i < cubes_base.length; i++) {
      cubes_base[i].setup(gl);
      cubes_base[i].set_model_matrix(model_matrix_cubes_base[i]);
   }

   mat4.translate(model_matrix_cubes_decoration[0], model_matrix_cubes_decoration[0], [0, 0, -4]);
   mat4.scale(model_matrix_cubes_decoration[0], model_matrix_cubes_decoration[0], [2.5, 2.5, 2.5]);

   mat4.translate(model_matrix_cubes_decoration[1], model_matrix_cubes_decoration[1], [-15, 5, 4]);
   mat4.scale(model_matrix_cubes_decoration[1], model_matrix_cubes_decoration[1], [2.5, 2.5, 2.5]);

   for (let i = 0; i < cubes_decoration.length; i++) {
      cubes_decoration[i].setup(gl);
      cubes_decoration[i].set_model_matrix(model_matrix_cubes_decoration[i]);
   }


   mat4.translate(water_transf, water_transf, [0, water_height, 0]);
   mat4.scale(water_transf, water_transf, [20, 20, 20]);

   water.set_model_matrix(water_transf);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);
}

function draw(){

   mat4.lookAt(view_matrix, position_cam, [0, 0, 0], [0, 1, 0]);

   var pos_cam_from_underneath = [...position_cam]; //clone array
   pos_cam_from_underneath[1] = -position_cam[1]+water_height*2;
   mat4.lookAt(view_matrix_reflection, pos_cam_from_underneath, [0, water_height*2, 0], [0, 1, 0]);

   this.gl.viewport(0, 0, canvas_width, canvas_height);

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

   //make it framerate independant
   time_diff = time-last_time;

   var light_speed = document.getElementById("slider_speed").value;
   var light_height = document.getElementById("slider_height").value;

   //apply a rotation matrix on the light pos to make it rotate around the origin
   light_pos[0] = light_pos[0]*Math.cos(time_diff*light_speed)-light_pos[2]*Math.sin(time_diff*light_speed);
   light_pos[1] = 11.0-light_height;
   light_pos[2] = light_pos[0]*Math.sin(time_diff*light_speed)+light_pos[2]*Math.cos(time_diff*light_speed);

   //renormalize the rotating bit of the light position, to not lose precision
   var vec_rot_length = light_pos[0]*light_pos[0]+light_pos[2]*light_pos[2];
   light_pos[0] = light_pos[0]/vec_rot_length;
   light_pos[2] = light_pos[2]/vec_rot_length;

   var light_pos_scaled = [light_pos[0]*light_pos_radius, light_pos[1], light_pos[2]*light_pos_radius];

   for (let i = 0; i < cubes_base.length; i++) {
      cubes_base[i].set_light_pos(light_pos_scaled);
      cubes_base[i].set_vp(view_matrix, proj_matrix);
      cubes_base[i].draw();
   }

   for (let i = 0; i < cubes_decoration.length; i++) {
      cubes_decoration[i].set_light_pos(light_pos_scaled);
      cubes_decoration[i].set_vp(view_matrix, proj_matrix);
      cubes_decoration[i].draw();
   }

   water.set_time( (d.getTime()/500.0)%1000);
   water.set_vp(view_matrix, proj_matrix);
   water.draw();

   framebuffer_reflection.bind();

   gl.clearColor(0.7, 0.8, 0.9, 1.0);
   gl.clearDepth(1.0);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


   //we need to clip everything underwater when rendering the reflection framebuffer
   for (let i = 0; i < cubes_base.length; i++) {
      cubes_base[i].set_clip(1, water_height);
      cubes_base[i].set_vp(view_matrix_reflection, proj_matrix);
      cubes_base[i].draw();
      cubes_base[i].set_clip(0, 0);
   }

   for (let i = 0; i < cubes_decoration.length; i++) {
      cubes_decoration[i].set_clip(1, water_height);
      cubes_decoration[i].set_vp(view_matrix_reflection, proj_matrix);
      cubes_decoration[i].draw();
      cubes_decoration[i].set_clip(0, 0);
   }

   framebuffer_reflection.unbind();

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
