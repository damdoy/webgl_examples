class Tree{
    setup(gl){
        this.gl = gl;

        this.trunk = new Trunk
        this.trunk.setup(gl);

        this.leaves = new Leaves;


        this.leaves.generate(this.trunk.get_end_point_matrices());

        this.leaves.setup(gl);
    }

    load(){

    }

    set_time(t){
        this.leaves.set_time(t);
    }

    draw_trunks(){
        this.trunk.draw();
    }

    set_mvp(model, view, proj){
        this.trunk.set_mvp(model, view, proj);
        this.leaves.set_mvp(model, view, proj);
        this.model = model;
        this.view = view;
        this.proj = proj;
    }

    set_light_pos(light_pos){
        this.trunk.set_light_pos(light_pos);
        this.light_pos = light_pos;
    }

    draw(){
        this.trunk.draw();
        this.leaves.draw();
    }
}