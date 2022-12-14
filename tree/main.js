var canvas;
// Initialize the GL context
var gl;

var proj_matrix = mat4.create();
var view_matrix = mat4.create();

var cam_height = 15;
var position_cam = [-28.0, cam_height, 0];

var light_pos = [-10, 5.0, 20];

var cube = new Cube;
var cube_transf = mat4.create();

var tree = new Tree;
var tree_transf = mat4.create();

var last_time = 0;

function main() {
   canvas = document.querySelector("#glCanvas");
   gl = canvas.getContext("webgl2");
   // Only continue if WebGL is available and working
   if (gl === null) {
      alert("cannot init WebGL");
      return;
   }

   // plane.setup(gl);
   cube.setup(gl);

   tree.setup(gl);

   //base platform for the tree
   mat4.scale(cube_transf, cube_transf, [20, 0.5, 20]);

   mat4.scale(tree_transf, tree_transf, [5, 5, 5]);
   mat4.translate(tree_transf, tree_transf, [0, 0.5, 0]);

   //setup camera
   const fieldOfView = 45 * Math.PI / 180;   // in radians
   const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
   const zNear = 0.1;
   const zFar = 1000.0;

   mat4.perspective(proj_matrix, fieldOfView, aspect, zNear, zFar);
}

function draw(){

   mat4.lookAt(view_matrix, position_cam, [0, 10, 0], [0, 1, 0]);

   gl.clearColor(0.5, 0.7, 0.9, 1.0);
   gl.clearDepth(1.0);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   d = new Date();
   time = d.getTime()/100000.0;
   //make it framerate independant
   time_diff = time-last_time;

   var rotation_active = document.getElementById("rotation").checked;
   var draw_leaves_active = document.getElementById("leaves").checked;

   //rotate the model matrix of the plane by a little bit
   var model = mat4.create();
   if(rotation_active){
      model = mat4.rotate(model, model, -2*Math.PI*time_diff*10, [0,1,0]);
   }

   mat4.multiply(tree_transf, tree_transf, model);
   mat4.multiply(cube_transf, cube_transf, model);

   cube.set_light_pos(light_pos);
   cube.set_mvp(cube_transf, view_matrix, proj_matrix);
   cube.draw();

   //wind effect not that nice, leave it for now
   // tree.set_time(d.getTime()/10000.0);
   tree.set_light_pos(light_pos);
   tree.set_mvp(tree_transf, view_matrix, proj_matrix);
   tree.draw(draw_leaves_active);

   last_time = time;

   requestAnimationFrame(draw);
}

main();
requestAnimationFrame(draw);
