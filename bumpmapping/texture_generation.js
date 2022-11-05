class Texture_generation{

    normalize3(vec){
        var length = Math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2])
        return [vec[0]/length, vec[1]/length, vec[2]/length]
    }

    cross(vec_a, vec_b){
        return [vec_a[1]*vec_b[2]-vec_a[2]*vec_b[1], vec_a[2]*vec_b[0]-vec_a[0]*vec_b[2], vec_a[0]*vec_b[1]-vec_a[1]*vec_b[0]];
    }

    //default flat normal map
    generate_value(x, y, size){
        return 0;
    }

    //generate a normal map from the texture values
    generate_normal_map(size){
        this.array_texture = [];

        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var EPSILON = 0.001;

                //find derivatives in both direction
                var ddi = this.generate_value(i+EPSILON, j, size)-this.generate_value(i, j, size);
                var ddj = this.generate_value(i, j+EPSILON, size)-this.generate_value(i, j, size);

                //make vectors from derivatives
                var der_x = [EPSILON, ddi, 0];
                var der_y = [0, ddj, EPSILON];

                der_x = this.normalize3(der_x)
                der_y = this.normalize3(der_y)

                //cross should be the normal
                var normal = this.cross(der_y, der_x);

                normal = this.normalize3(normal);

                this.array_texture.push( normal[2] ); //X
                this.array_texture.push( normal[1] ); //Y
                this.array_texture.push( normal[0] ); //Z
            }
        }
    }
}

//returns pixel for a "bumpy" normal map
class Texture_generation_bumps extends Texture_generation{

    generate_value(x, y, size){
        //have a flat surface with only shallow holes in it
        var sine_frequency = 8*3.1415/size;
        var val = Math.sin(sine_frequency*x)*Math.sin(sine_frequency*y);
        if (val < 0.5){
            return 0;
        }

        return -(val-0.5)*8;
    }
}

class Texture_generation_triangles extends Texture_generation{

    generate_value_sub(x, y, center_x, center_y, size){
        var relative_x = Math.abs(x-center_x);
        var relative_y = Math.abs(y-center_y);

        var depth = size/4;

        var x_min = center_x-size;
        var x_max = center_x+size;
        var y_min = center_y-size;
        var y_max = center_y+size;

        if(x > x_min && x < x_max){
            if(y > y_min && y < y_max){
                if(y <= center_y && relative_y >= relative_x){
                    return (y-y_min)/depth;
                }
                if(y > center_y && relative_y > relative_x){
                    return (y_max-y)/depth;
                }
                if(x < center_x){
                    return (x-x_min)/depth;
                }
                if(x > center_x){
                    return (x_max-x)/depth;
                }

            }
        }

        return 0;
    }

    generate_value(x, y, size){
        var sub_div = 64;
        var square_size = 32;

        for (var i = 0; i < size; i+=sub_div) {
            for (var j = 0; j < size; j+=sub_div) {
                if(x > i && x < (i+sub_div)){
                    if(y > j && y < (j+sub_div)){
                        return this.generate_value_sub(x ,y , i+square_size, j+square_size, square_size/2);
                    }
                }
            }
        }
        return 0;
    }
}