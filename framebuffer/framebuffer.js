class Framebuffer{

    setup(gl, image_width, image_height) {
        this.gl = gl;

        this.image_width = image_width;
        this.image_height = image_height;

        this.fb_tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.fb_tex);

        //allocate space for the texture, but feed nothing to it (null)
        //will be filled later by rendering in the framebuffer
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.image_width, this.image_height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

        //key part, we associate the texture with the framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fb_tex, 0);

        //create a depth buffer for the framebuffer, otherwise 3d rendering will be weird
        this.depth_buffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_buffer);

        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.image_width, this.image_height);

        //associate the render buffer with the framebuffer
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_buffer);

        //unbind everything to avoid pollution
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    bind(){
        this.gl.viewport(0, 0, this.image_width, this.image_height);
        this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    }

    unbind(){
        this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    get_texture(){
        return this.fb_tex;
    }

}