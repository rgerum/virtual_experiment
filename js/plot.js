class Plot {
    constructor(selection, {width = 640, height = 250, innerwidth=undefined, innerheight=undefined, top = 20, right = 50, bottom = 55, left = 50, xlabel="", ylabel= "", colors=undefined}={}) {
        this.width = width;
        this.height = height;
        this.xlabel = xlabel;
        this.ylabel = ylabel;
        var svg, draw_line = undefined;
        this.selection = selection;
        var margin = {top: top, right: right, bottom: bottom, left: left};
        if(innerwidth == undefined)
            innerwidth = this.width - margin.left - margin.right;
        if(innerheight == undefined)
            innerheight = this.height - margin.top - margin.bottom;
        this.margin = margin;
        this.innerwidth = innerwidth;

        if(width != undefined) {
            this.selection = selection.attr("width", this.width)
                .attr("height", this.height)
        }
        this.svg = this.selection;
        this.selection = this.selection.append("g")
            .attr("class", "plot")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.x_scale = d3.scaleLinear()
            .range([0, innerwidth])
            .domain([0, 1])

        this.y_scale = d3.scaleLinear()
            .range([innerheight, 0])
            .domain([0, 1])

        this.x_axis = d3.axisBottom()
            .scale(this.x_scale)
        //     .orient("bottom") ;

        this.y_axis = d3.axisLeft()
            .scale(this.y_scale)

        if(colors != undefined)
            this.color = (d,i) => colors[i];
        else
            this.color = (d,i) => d3.schemeCategory10[i];

        this.draw_line = d3.line()
            //   .interpolate("basis")
            .x(d => this.x_scale(d[0]))
            .y(d => this.y_scale(d[1]))

        this.x_axis_svg = this.selection.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + innerheight + ")")
        this.x_axis_svg.call(this.x_axis)
            .append("text")
            .attr("dy", "4em")
            .attr("x", innerwidth/2)
            .style("text-anchor", "center")
            .attr("class", "x label")
            .text(this.xlabel) ;

        this.y_axis_svg = this.selection.append("g")
            .attr("class", "y axis")
            .call(this.y_axis)

        this.y_axis_svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerheight/2)
            .attr("dy", "-3em")
            .style("text-anchor", "center")
            .attr("class", "y label")
            .text(this.ylabel);
        this.y_axis_svg.selectAll(".tick").selectAll("text").attr("x", -18);

        this.line_group = this.selection.append("g")
        this.cursor = undefined;
        this.legend_group = undefined;
    }

    setTitle(name) {
        this.svg.append("text").text(name).attr("text-anchor", "middle").attr("font-size", "12px")
            .attr("x", this.margin.left+this.innerwidth/2).attr("y", 10)
    }

    legend(x, y) {
        this.legend_group = this.selection.append("g")
            .attr("transform", `translate(${x}, ${y})`)
            .attr("class", "legend")
    }

    setXlim(min, max) {
        this.x_scale.domain([min, max]);
        this.x_axis_svg.call(this.x_axis).selectAll("path");
        this.x_axis_svg.selectAll(".tick").selectAll("text").attr("dy", 18);
    }
    setYlim(min, max) {
        this.y_scale.domain([min, max]);
        if(1) {
            this.ymin = min;
            this.ymax = max;
            this.y_axis_svg.call(this.y_axis).selectAll("path");
            this.y_axis_svg.selectAll(".tick").selectAll("text").attr("dx", -10);
            var line = d => d3.line().x(d => this.x_scale(d[0])).y(d => this.y_scale(d[1]))(d3.zip(d.x, d.y));
            this.line_group.selectAll("path").attr("d", line)

            if(this.cursor)
            this.cursor.selectAll("circle")
                .attr("cx", d => this.x_scale(d[0]))
                .attr("cy", d => this.y_scale(d[1]))
            return;
        }

        // Update axis and circle position
        console.log(this.y_axis)
        this.y_axis_svg.transition().duration(1000).call(this.y_axis)

        var line = d => d3.line().x(d => this.x_scale(d[0])).y(d => this.y_scale(d[1]))(d3.zip(d.x, d.y));
        this.line_group.selectAll("path").transition().duration(1000).attr("d", line)
        /*
        scatter
            .selectAll("circle")
            .transition().duration(1000)
            .attr("cx", function (d) { return x(d.Sepal_Length); } )
            .attr("cy", function (d) { return y(d.Petal_Length); } )*/

    }

    setYLimAnimated(min, max) {
        function ease_in_out(n) {
            var q = .48 - n / 1.04,
                Q = Math.sqrt(.1734 + q * q),
                x = Q - q,
                X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                y = -Q - q,
                Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        }
        let plot = this;
        function changeLimits() {
            plot.animator.percentage += 0.02;
            if(plot.animator.percentage > 1)
                plot.animator.percentage = 1;
            let f = ease_in_out(plot.animator.percentage)
            let a = plot.animator.lim1*(1-f) + plot.animator.lim1new*f;
            let b = plot.animator.lim2*(1-f) + plot.animator.lim2new*f;
            plot.setYlim(a, b);
            if(plot.animator.percentage < 1) {
                setTimeout(changeLimits, 10);
            }
            else {
                plot.animator.running = false;
            }
        }
        if(!this.animator) {
            this.animator = {running: false};
        }
        console.log(this.animator, this.ymin, this.ymax);
        this.animator.lim1 = this.ymin;
        this.animator.lim2 = this.ymax;
        this.animator.lim1new = min;
        this.animator.lim2new = max;
        this.animator.percentage = 0;
        if(!this.animator.running) {
            this.animator.running = true;
            setTimeout(changeLimits, 10);
        }
    }
    setXLabel(label) {
        this.x_axis_svg.selectAll(".label").text(label)
    }
    setYLabel(label) {
        this.y_axis_svg.selectAll(".label").text(label)
    }

    setData(datasets, labels) {
        /*
        this.setXlim(d3.min(datasets, function(d) { return d3.min(d.x); }),
            d3.max(datasets, function(d) { return d3.max(d.x); }));
        this.setYlim(d3.min(datasets, function(d) { return d3.min(d.y); }),
            d3.max(datasets, function(d) { return d3.max(d.y); }));
        */
        var line = d => d3.line().x(d => this.x_scale(d[0])).y(d => this.y_scale(d[1]))(d3.zip(d.x, d.y));

        var paths = this.line_group.selectAll("path")
            .data(datasets)

        paths.enter().append("path")
            .attr("class", "plot_line")
            .merge(paths)
            .attr("d", line).attr("fill", "none").attr("stroke", this.color)

        if(this.legend_group)
            this.update_legend(labels);
    }
    update_legend(labels) {
        let w = 20, dw = 5, dy = 18;
        let colors = this.color;
        let self = this;
        this.legend_group.selectAll("g").data(labels).each(function(d,i) {
            d3.select(this).select("text").text(d)
        }).enter().append("g").each(function(d,i) {
                d3.select(this).append("line")
                    .attr("x1", 0).attr("x2", w)
                    .attr("y1", i * dy)
                    .attr("y2", i * dy)
                    .attr("fill", "none")
                    .style("stroke", colors(d, i))
                    .attr("stroke-width", 3)

                var mousemover = () => {
                    self.line_group.selectAll("path")
                        .attr("filter", (d, ii) => ii == i ? "saturate(1)" : "saturate(0)")
                        .attr("opacity", (d, ii) => ii == i ? "1" : "0.4")
                }
                var mouseout = () => {
                    self.line_group.selectAll("path")
                        .attr("filter", "none")
                        .attr("opacity", "1")
                }
                d3.select(this).append("text")
                    .attr("x", w + dw).attr("y", i * dy + 4)
                    .style("text-anchor", "start")
                    .attr("class", "annotation")
                    .attr("cursor", "pointer")
                    .text(d)
                    .on("mouseover", mousemover)
                    .on("mouseout", mouseout)
                    .on("click", () => {
                        let obj = d3.select(self.line_group.selectAll("path").nodes()[i]);
                        let new_vis = obj.attr("visibility") == "hidden"
                        obj.attr("visibility", new_vis ? "visible" : "hidden");

                        mouseout();
                        d3.select(self.legend_group.selectAll("g").nodes()[i]).select("line").attr("filter", new_vis ? "saturate(1)" : "saturate(0) brightness(1.2)")
                        //(new_vis ? mousemover : mouseout)();
                    })
            }
        )
    }
    mouseover(i) {
        this.line_group.selectAll("path")
            .attr("filter", (d, ii) => ii == i ? "saturate(1)" : "saturate(0)")
            .attr("opacity", (d, ii) => ii == i ? "1" : "0.4")
    }
    mouseout(i) {
        this.line_group.selectAll("path")
            .attr("filter", "none")
            .attr("opacity", "1")
    }
    setYData(datasets, labels) {
        /*
        this.setXlim(0,
            d3.max(datasets, function(d) { return d.length-1; }));
        this.setYlim(d3.min(datasets, function(d) { return d3.min(d); }),
            d3.max(datasets, function(d) { return d3.max(d); }));
*/
        var line = d3.line().x((_, i) => this.x_scale(i)).y(d => this.y_scale(d));
        this.data = datasets;
        this.line = line;

        var paths = this.line_group.selectAll("path")
            .data(datasets).attr("d", line).attr("fill", "none").attr("stroke", this.color)
            .attr("class", (d,i) => "plot_line "+labels[i]);

        paths.enter().append("path")
            .attr("class", "plot_line")
            .attr("d", line).attr("fill", "none").attr("stroke", this.color)
            .attr("class", (d,i) => "plot_line "+labels[i]);

        if(this.legend_group)
            this.update_legend(labels);
    }
    setCursor(data) {
        if(this.cursor === undefined) {
            this.cursor = this.selection.append("g");
            //append("circle");
            //this.cursor.attr("fill", this.color).attr("r", "5px");
        }
        let circle = this.cursor.selectAll("circle").data(data);
        circle.enter().append("circle")
            .attr("fill", this.color).attr("r", "5px")
            .merge(circle)
            .attr("cx", d => this.x_scale(d[0]))
            .attr("cy", d => this.y_scale(d[1]))
    }
}

class Display {
    constructor(selection, {width = 640, height = 250, xlim= [-1, 5], innerwidth=undefined, innerheight=undefined, top = 0, right = 0, bottom = 0, left = 0, xlabel="", ylabel= "", colors=undefined, interactive=true}={}) {
        this.width = width;
        this.height = height;
        this.xlabel = xlabel;
        this.ylabel = ylabel;
        this.interactive = interactive;
        var svg, draw_line = undefined;
        this.selection = selection;
        var margin = {top: top, right: right, bottom: bottom, left: left};
        if(innerwidth == undefined)
            innerwidth = this.width - margin.left - margin.right;
        if(innerheight == undefined)
            innerheight = this.height - margin.top - margin.bottom;

        if(width != undefined) {
            this.selection = selection.attr("width", this.width)
                .attr("height", this.height)
        }
        this.selection = this.selection.append("g")
            .attr("class", "plot")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        this.scale = d3.scaleLinear()
            .range([0, innerwidth])
            .domain(xlim)

        this.line_group = this.selection.append("g").attr("class", "elements")
        this.point_group = this.selection.append("g").attr("class", "points")
        this.new_point = this.selection.append("circle").attr("r", "0px")
            .attr("fill", "blue").attr("opacity", 0.5)

        this.legend_group = undefined;
        this.sim = undefined;
    }

    legend(x, y) {
        this.legend_group = this.selection.append("g")
            .attr("transform", `translate(${x}, ${y})`)
            .attr("class", "legend")

        let labels = ["fixed point", "free point", "plotted fixed point", "plotted free point"];
        let w = 8, dw = 5, dy = 18;
        let colors = this.color;
        let self = this;
        this.legend_group.selectAll("g").data(labels).each(function(d,i) {
            d3.select(this).select("text").text(d)
        }).enter().append("g").each(function(d,i) {
            let circle = d3.select(this).append("circle")
                .attr("cx", 0)
                .attr("cy", i * dy)
                .attr("r", "5px")
            if(i === 0)
                circle.attr("fill", "red")
            if(i === 1)
                circle.attr("fill", "blue")
            if(i === 2)
                circle.attr("fill", "none")
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
            if(i === 3)
                circle.attr("fill", "none")
                      .attr("stroke", "blue")
                      .attr("stroke-width", 2)

            d3.select(this).append("text")
                .attr("x", w + dw).attr("y", i * dy + 4)
                .style("text-anchor", "start")
                .attr("class", "annotation")
                .attr("cursor", "pointer")
                .text(d)
        });
    }

    setXlim(min, max) {
        this.x_scale.domain([min, max]);
        this.x_axis_svg.call(this.x_axis).selectAll("path");
        this.x_axis_svg.selectAll(".tick").selectAll("text").attr("dy", 18);
    }
    setYlim(min, max) {
        this.y_scale.domain([min, max]);
        this.y_axis_svg.call(this.y_axis).selectAll("path");
        this.y_axis_svg.selectAll(".tick").selectAll("text").attr("dx", -10);
    }
    setXLabel(label) {
        this.x_axis_svg.selectAll(".label").text(label)
    }
    setYLabel(label) {
        this.y_axis_svg.selectAll(".label").text(label)
    }

    selectElement(i) {
        var paths = this.line_group.selectAll(".element").each(
            function(d, ii) {
                d3.select(this).selectAll("path")
                    .attr("stroke", i == ii ? "orange" : "darkgreen")
            }
        )
    }

    selectElementCallback(i) {

    }

    setData(datasets, labels, simu) {
        let sim = simu;
        /*
        this.setXlim(d3.min(datasets, function(d) { return d3.min(d.x); }),
            d3.max(datasets, function(d) { return d3.max(d.x); }));
        this.setYlim(d3.min(datasets, function(d) { return d3.min(d.y); }),
            d3.max(datasets, function(d) { return d3.max(d.y); }));
        */
        var line = d3.line().x(d => this.scale(d[0])).y(d => this.scale(d[1]));

        var paths = this.line_group.selectAll(".element")
            .data(datasets)

        let display = this;

        let paths_enter = paths.enter()
            .append("g")
            .attr("class", "element");
        paths_enter.append("g").attr("class", "element_draw");
        paths_enter.append("g").attr("class", "element_select");

        paths_enter.merge(paths)
            .each(function(d, i) {
                let p = d3.select(this).select(".element_draw").selectAll("path").data(d.lines)
                p.enter().append("path")
                    .merge(p)
                    .attr("d", line).attr("fill", "none").attr("stroke", "darkgreen")
                p.exit().remove();
                if(display.interactive) {
                    let r = d3.select(this).select(".element_select").selectAll("rect").data([d.rect, d.rect_start, d.rect_end])
                    r.enter().append("rect")
                        .attr("fill", "transparent")
                        .style("opacity", 0.5)
                        .on("mouseover", function () {
                            d3.select(this.parentElement.parentElement).select(".element_draw")
                                .attr("stroke-width", 3);
                        })
                        .on("mouseout", function () {
                            d3.select(this.parentElement.parentElement).select(".element_draw")
                                .attr("stroke-width", 1);
                        })
                        .on("click", function (d) {
                            display.selectElementCallback(i);
                        })
                        .call(d3.drag()
                            .on("drag", function (d, ii) {
                                if(ii == 0)
                                    return
                                let x = display.scale.invert(d3.event.x), y = display.scale.invert(d3.event.y);
                                let data = undefined;
                                if(ii == 2) {
                                    x = x - d.x1 + display.sim.points[display.sim.elements[i].target_ids[1]][1];
                                    y = y - d.y1;
                                    data = display.sim.elements[i].draw([[display.sim.points[display.sim.elements[i].target_ids[0]][1], 0], [x, y]]);
                                }
                                if(ii == 1) {
                                    x = x - d.x1 + display.sim.points[display.sim.elements[i].target_ids[0]][1];
                                    y = y - d.y1;
                                    data = display.sim.elements[i].draw([[x, y], [display.sim.points[display.sim.elements[i].target_ids[1]][1], 0]]);
                                }
                                d3.select(this.parentElement.parentElement).select(".element_draw").selectAll("path").data(data.lines)
                                    .attr("d", line).attr("fill", "none").attr("stroke", "red")
                                if(Math.abs(Math.round(x*2)/2 - x) < 0.1) {
                                    this.target_point = Math.round(x * 2) / 2;
                                    let new_point = Math.round(x * 2) / 2;
                                    //console.log("new point", Math.round(x * 2) / 2);
                                    display.point_group.selectAll(".point")
                                        .attr("r", (d, i) => i === new_point ? "8px" : "5px");
                                    if(this.target_point % 1 === 0.5) {
                                        display.new_point
                                            .attr("cx", display.scale(this.target_point))
                                            .attr("cy", display.scale(0))
                                            .attr("r", "8px")
                                    }
                                    else
                                        display.new_point.attr("r", 0)
                                }
                            })
                            .on('start',function (d, ii) {
                                if(ii == 0)
                                    return
                                stopAndReset();
                                this.target_point = undefined;
                                let x = display.scale.invert(d3.event.x), y = display.scale.invert(d3.event.y);
                                d.x1 = x;
                                d.y1 = y;
                                console.log("->", d.x1, d.y1);
                            })
                            .on("end", function (d, ii) {
                                if(ii == 0)
                                    return

                                if(this.target_point !== undefined) {
                                    if (display.sim.points.length < this.target_point)
                                        this.target_point = sim.points.length - 0.5;
                                    if(this.target_point % 1 == 0.5) {
                                        this.target_point = Math.ceil(this.target_point);
                                        display.sim.insertPoint(this.target_point);
                                    }
                                    if(this.target_point % 1 == 0) {
                                        if (display.sim.points.length > this.target_point) {
                                            if (ii == 2) {
                                                display.sim.elements[i].target_ids[1] = this.target_point;
                                            } else if (ii == 1) {
                                                display.sim.elements[i].target_ids[0] = this.target_point;
                                            }
                                            if (display.sim.elements[i].target_ids[1] < display.sim.elements[i].target_ids[0]) {
                                                let [s, e] = display.sim.elements[i].target_ids;
                                                display.sim.elements[i].target_ids = [e, s];
                                            }
                                            console.log("new targets", display.sim.elements[i].target_ids);
                                        }
                                    }
                                }
                                display.new_point.attr("r", 0);
                                display.point_group.selectAll(".point").attr("r", "5px");
                                display.sim.removeUnusedPoints();
                                display.sim.updateDrawOffsets();
                                display.setData(display.sim.draw());
                                display.setPoints(display.sim.points, display.sim);
                                display.sim.edited = true;
                                updateSystem();
                            })
                        )
                        .merge(r)
                        .attr("x", d=>display.scale(d.x)).attr("width", d=>display.scale(d.x+d.width)-display.scale(d.x))
                        .attr("y", d=>display.scale(d.y)).attr("height", d=>display.scale(d.y+d.height)-display.scale(d.y))
                }
            })
        paths.exit().remove();
    }

    setPoints(dataset, simu) {
        let sim = simu;

        var paths = this.point_group.selectAll(".point")
            .data(dataset)

        var line = d3.line().x(d => this.scale(d[0])).y(d => this.scale(d[1]));

        let display = this;

        let paths_enter = paths.enter().append("circle")
            .attr("class", "point")
            .attr("r", "5px")
        if(this.interactive) {
            paths_enter
                .on("mouseover", function () {
                    d3.select(this).attr("r", "8px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", "5px");
                })
                /*
                .call(d3.drag()
                    .on("drag", function (d, i) {
                        console.log();
                        sim.points[i][1] = display.scale.invert(d3.event.x);
                        display.setData(sim.draw());
                        display.setPoints(sim.get_points(), sim);
                    })
                    .on("end", function (d, i) {
                        updateSystem();
                    })
                )*/
                .call(d3.drag()
                    .on("drag", function (d, iii) {
                        let ii = 2;
                        let i = d.i;
                        let self = display.line_group.selectAll(".element_select").nodes()[i];
                        console.log("self", self);
                        if(ii == 0)
                            return
                        let x = display.scale.invert(d3.event.x), y = display.scale.invert(d3.event.y);
                        let data = undefined;
                        if(ii == 2) {
                            x = x - d.x1 + sim.points[sim.elements[i].target_ids[1]][1];
                            y = y - d.y1;
                            data = sim.elements[i].draw([[sim.points[sim.elements[i].target_ids[0]][1], 0], [x, y]]);
                        }
                        if(ii == 1) {
                            x = x - d.x1 + sim.points[sim.elements[i].target_ids[0]][1];
                            y = y - d.y1;
                            data = sim.elements[i].draw([[x, y], [sim.points[sim.elements[i].target_ids[1]][1], 0]]);
                        }
                        d3.select(self.parentElement).select(".element_draw").selectAll("path").data(data.lines)
                            .attr("d", line).attr("fill", "none").attr("stroke", "red")
                        if(Math.abs(Math.round(x*2)/2 - x) < 0.1) {
                            this.target_point = Math.round(x * 2) / 2;
                            let new_point = Math.round(x * 2) / 2;
                            //console.log("new point", Math.round(x * 2) / 2);
                            display.point_group.selectAll(".point")
                                .attr("r", (d, i) => i === new_point ? "8px" : "5px");
                            if(this.target_point % 1 === 0.5) {
                                display.new_point
                                    .attr("cx", display.scale(this.target_point))
                                    .attr("cy", display.scale(0))
                                    .attr("r", "8px")
                            }
                            else
                                display.new_point.attr("r", 0)
                        }
                    })
                    .on('start',function (d, i) {
                        stopAndReset();
                        console.log("drag point", d, i, this);
                        sim.elements.push(new Spring(i, i, 1, 1));
                        display.setData(sim.draw());
                        this.target_point = undefined;
                        let x = display.scale.invert(d3.event.x), y = display.scale.invert(d3.event.y);
                        d.x1 = x;
                        d.y1 = y;
                        d.i = sim.elements.length - 1;
                        console.log("->", d.x1, d.y1, d.i);
                    })
                    .on("end", function (d, iii) {
                        let ii = 2;
                        let i = d.i;
                        if(ii == 0)
                            return

                        if(this.target_point !== undefined) {
                            if (sim.points.length < this.target_point)
                                this.target_point = sim.points.length - 0.5;
                            if(this.target_point % 1 == 0.5) {
                                this.target_point = Math.ceil(this.target_point);
                                sim.insertPoint(this.target_point);
                            }
                            if(this.target_point % 1 == 0) {
                                if (sim.points.length > this.target_point) {
                                    if (ii == 2) {
                                        sim.elements[i].target_ids[1] = this.target_point;
                                    } else if (ii == 1) {
                                        sim.elements[i].target_ids[0] = this.target_point;
                                    }
                                    if (sim.elements[i].target_ids[1] < sim.elements[i].target_ids[0]) {
                                        let [s, e] = sim.elements[i].target_ids;
                                        sim.elements[i].target_ids = [e, s];
                                    }
                                    console.log("new targets", sim.elements[i].target_ids);
                                }
                            }
                        }
                        display.new_point.attr("r", 0);
                        display.point_group.selectAll(".point").attr("r", "5px");
                        sim.removeUnusedPoints();
                        sim.updateDrawOffsets();
                        display.setData(sim.draw());
                        display.setPoints(sim.points, sim);
                        sim.edited = true;
                        updateSystem();
                    })
                )
        }
        paths_enter
            .merge(paths)
            .attr("cx", d => this.scale(d[1]))
            .attr("cy", d => this.scale(0))
            .attr("stroke-width", 0)
            .style("fill", d => d[0] ? "blue" : "red")
        paths.exit().remove();
        let nodes = paths_enter.merge(paths).nodes();
        d3.select(nodes[nodes.length-1]).attr("stroke", d => d[0] ? "blue" : "red").style("fill", "white").attr("stroke-width", 2);
    }

}