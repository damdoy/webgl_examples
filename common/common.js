function loadShader(gl, type, source) {
  shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("error while compiling shader: "+gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function vec2_length(v1, v2){
   return vec2_length([v2[0]-v1[0], v2[1]-v1[1]]);
}

function vec2_length(v){
   return Math.sqrt(Math.pow(v[0], 2)+Math.pow(v[1], 2) );
}

function vec2_normalize(v){
   var length = vec2_length(v);
   return [v[0]/length, v[1]/length];
}
