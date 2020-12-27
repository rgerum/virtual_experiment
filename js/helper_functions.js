function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

function rescale(num, min1, max1, min2, max2) {
    // rescale a number from previous min1/max1 to the new min2/max2
    return (num-min1)/(max1-min1) * (max2 - min2) + min2;
}

function interpolate_nearest(value, lookup) {
    if(value < lookup[0][0])
        return lookup[0][1];
    if(value > lookup[lookup.length-1][0])
        return lookup[lookup.length-1][1];
    for(let i in lookup) {
        if(value < lookup[i][0]) {
            return rescale(value, lookup[i-1][0], lookup[i][0], lookup[i-1][1], lookup[i][1])
        }
    }
}

function interpolate_nearest_grid(value, lookup, min, max) {
    if(value <= min)
        return lookup[0];
    if(value >= max)
        return lookup[lookup.length-1];
    value = clamp(value, min, max);
    value = rescale(value, min, max, 0, lookup.length-1);
    return rescale(value, parseInt(value), parseInt(value)+1, lookup[parseInt(value)], lookup[parseInt(value)+1]);
}

function line_intersection(line1, line2, factor) {
    // get points
    let [x1, y1] = line1[0];
    let [x2, y2] = line1[1];
    let [x3, y3] = line2[0];
    let [x4, y4] = line2[1];
    // calculate the intersection points relative to the first line
    let t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4))/
        ((x1-x2)*(y3-y4) - (y1-y2)*(x3-x4));
    // calculate the angle to the normal
    let a1 = Math.atan((y2-y1)/(x2-x1));
    let a2 = -Math.atan((y4-y3)/(x4-x3));
    let b = Math.PI/2-a1-a2;
    // the intersection point
    let P = [x1 + t*(x2-x1), y1 + t*(y2-y1)];
    // the new angle after refraction
    let b2 = Math.asin(Math.sin(b)/factor);
    let normal_angle = -Math.PI/2;

    // check if the new ray goes into the direction as the incoming ray
    // then we need to invert the angles
    let P2 = [P[0]+Math.cos(a1+normal_angle-b2)*100, P[1]+Math.sin(a1+normal_angle-b2)*100];
    if((P2[0]-P[0])*(x4-x3)+(P2[1]-P[1])*(y4-y3) < 0) {
        normal_angle = Math.PI / 2;
        b2 = -b2;
    }
    P2 = [P[0]+Math.cos(a1+normal_angle-b2)*100, P[1]+Math.sin(a1+normal_angle-b2)*100];

    // create the new refracted ray
    let new_ray = d3.select(d3.select("#prism").node().parentNode).append("line");
    new_ray.attr("x1", P[0]).attr("y1", P[1]).attr("x2", P2[0]).attr("y2", P2[1]);
    new_ray.attr("stroke", "black");

    // return the intersection point and the new ray
    return [P, new_ray];
}


function get_path_intersection(input1, i11, i12, input2, i21, i22, factor) {
    // calculate the intersection of the nodes i11 and i12 of input1 and the nodes i21 and i22 of input2
    // the factor gives the ratio of the refractory indices
    let path1 = input1.node().getPathData({normalize: true});
    let path2 = input2.node().getPathData({normalize: true});
    // get the intersection point and ray
    let [p, ray] = line_intersection([path1[i11].values, path1[i12].values], [path2[i21].values, path2[i22].values], factor);
    // adjust the second point of the input2 to terminate at the intersection
    input2.attr("x2", p[0]).attr("y2", p[1])
    // return the ray
    return ray;
}


function getValue(name) {
    return parseFloat(d3.select("#"+name+" input").node().value);
}

function lambda_to_color(Wavelength) {
    const Gamma = 0.80;
    const IntensityMax = 255;

    let factor;
    let Red, Green, Blue;

    if((Wavelength >= 380) && (Wavelength < 440)) {
        Red = -(Wavelength - 440) / (440 - 380);
        Green = 0.0;
        Blue = 1.0;
    } else if((Wavelength >= 440) && (Wavelength < 490)) {
        Red = 0.0;
        Green = (Wavelength - 440) / (490 - 440);
        Blue = 1.0;
    } else if((Wavelength >= 490) && (Wavelength < 510)) {
        Red = 0.0;
        Green = 1.0;
        Blue = -(Wavelength - 510) / (510 - 490);
    } else if((Wavelength >= 510) && (Wavelength < 580)) {
        Red = (Wavelength - 510) / (580 - 510);
        Green = 1.0;
        Blue = 0.0;
    } else if((Wavelength >= 580) && (Wavelength < 645)) {
        Red = 1.0;
        Green = -(Wavelength - 645) / (645 - 580);
        Blue = 0.0;
    } else if((Wavelength >= 645) && (Wavelength < 781)) {
        Red = 1.0;
        Green = 0.0;
        Blue = 0.0;
    } else {
        Red = 0.0;
        Green = 0.0;
        Blue = 0.0;
    }

    // Let the intensity fall off near the vision limits

    if((Wavelength >= 380) && (Wavelength < 420)) {
        factor = 0.3 + 0.7 * (Wavelength - 380) / (420 - 380);
    } else if((Wavelength >= 420) && (Wavelength < 701)) {
        factor = 1.0;
    } else if((Wavelength >= 701) && (Wavelength < 781)) {
        factor = 0.3 + 0.7 * (780 - Wavelength) / (780 - 700);
    } else {
        factor = 0.0;
    }


    let rgb = [0, 0, 0];

    // Don't want 0^x = 1 for x <> 0
    rgb[0] = Red == 0.0 ? 0 : parseInt(Math.round(IntensityMax * Math.pow(Red * factor, Gamma)));
    rgb[1] = Green == 0.0 ? 0 : parseInt(Math.round(IntensityMax * Math.pow(Green * factor, Gamma)));
    rgb[2] = Blue == 0.0 ? 0 : parseInt(Math.round(IntensityMax * Math.pow(Blue * factor, Gamma)));

    return `rgba(${parseInt(Red*255)}, ${parseInt(Green*255)}, ${parseInt(Blue*255)}, ${factor})`;
    if(lambda > 650)
        return `rgba(255, 0, 0, ${(700-lambda)/50})`;
    return `hsl(${ (650 - lambda) * 270 / 250}, 100%, 50%)`;
}
