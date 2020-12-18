
class Slider {
    constructor(query, {play = false, range= [0,100], value= 0, add_to_existing_svg= false, x=0, y=0, left_text_offset=0, width= 500, step=1} = {}) {
        var svg = d3.select(query);
        var width, height, margin;
        if(!add_to_existing_svg) {
            if (svg.node() && svg.node().tagName != "svg") {
                let node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                node.setAttribute('width', width);
                node.setAttribute('height', 30);
                let parent = svg.node();
                svg = d3.select(parent.appendChild(node));
            }
            this.svg = svg;
            this.div = document.createElement("div");
            this.div.style.display = "block";
            this.svg.node().parentNode.insertBefore(this.div, this.svg.node());
            this.div.appendChild(this.svg.node());
            margin = {right: 40, left: 40, top:0};
            width = +svg.attr("width") - margin.left - margin.right;
            height = +svg.attr("height");
        }
        else
        {
            this.svg = svg;
            margin = {right: 0, left: x, top:y};
            height = 30;
        }

        this.left_text_offset = left_text_offset;
        this.step = step;


        this.current_value = value;
        var x2 = d3.scaleLinear()
            .domain(range)
            .range([0, width])
            .clamp(true);
        this.x = x2;

        var slider = svg.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + margin.left + "," + (margin.top+height / 2) + ")");
        var self = this;
        this.slider = slider;
        //svg.attr("width", slider.attr("width"))
        //svg.attr("height", slider.attr("height"))

        slider.append("line")
            .attr("class", "track")
            .attr("x1", self.x.range()[0])
            .attr("x2", self.x.range()[1])
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .attr("cursor", "crosshair")
            .call(d3.drag()
                .on("start.interrupt", function() { slider.interrupt(); })
                .on("start drag", function() { self.setValue(self.x.invert(d3.event.x)); }));

        /*
        this.ticks = slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
        this.ticks.selectAll("text")
            .data(x.ticks(10))
            .enter().append("text")
            .attr("x", x)
            .attr("text-anchor", "middle")
            .text(function(d) { return d; });
        */
        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("cx", 0)
            .attr("r", 9)
            .attr("cursor", "grab");
        this.handle = handle;
        this.speed = 100;

        if(play) {
            let r = 9;
            this.button_play = slider.append("path")
                .attr("class", "handle")
                .attr("transform", "translate(-35, 0)")
                .attr("d", d3.line()([[0, -9], [9 * Math.sqrt(2), 0], [0, 9], [0, -9]]))
                .on("click", () => this.play(100))
            this.button_pause = slider.append("g")
            this.button_pause.append("path")
                .attr("class", "handle")
                .attr("transform", "translate(-35, 0)")
                .attr("d", d3.line()([[0, -9], [5, -9], [5, 9], [0, 9], [0, -9]]))
            this.button_pause.append("path")
                .attr("class", "handle")
                .attr("transform", "translate(-27, 0)")
                .attr("d", d3.line()([[0, -9], [5, -9], [5, 9], [0, 9], [0, -9]]))
            this.button_pause.on("click", () => this.play()).attr("visibility", "hidden");
        }
        if(play) {
            this.button_left = slider.append("path")
                .attr("class", "handle")
                .attr("transform", "translate("+(width+ 20)+", 0)")
                .attr("d", d3.line()([[0, -9], [-0.6*9 * Math.sqrt(2), 0], [0, 9], [0, -9]]))
                .on("click", () => this.setValue(this.value()-this.step))
            this.button_right = slider.append("path")
                .attr("class", "handle")
                .attr("transform", "translate("+(width+ 20+5)+", 0)")
                .attr("d", d3.line()([[0, -9], [0.6*9 * Math.sqrt(2), 0], [0, 9], [0, -9]]))
                .on("click", () => this.setValue(this.value()+this.step))
        }
        this.setValue(value);
    }
    addValueAnnotation(value, text, anchor, dx, dy) {
        let x = this.x(value);
        let y = 0;
        let dy0 = 8;
        this.slider.append("line")
            .attr("x1", x).attr("x2", x).attr("y1", y).attr("y2", y+dy0)
            .style("stroke", "darkgray")
        this.slider.append("line")
            .attr("x1", x).attr("x2", x+dx).attr("y1", y+dy0).attr("y2", y+dy)
            .style("stroke", "darkgray")
        this.slider.append("text").attr("class", "annotation").style("text-anchor", anchor)
            .attr("x", x+dx).attr("y", y+dy+5).text(text).style("text-decoration", "underline")
            .on("click", () => this.setValue(value)).attr("cursor", "pointer")
    }
    setText(value) {
        if(this.text_field === undefined) {
            this.text_field = document.createElement("span");
            this.text_field.className = "slider-span";
            let node = this.svg.node();
            node.parentNode.insertBefore(this.text_field, node.nextElementSibling);
        }
        this.text_field.innerHTML = value;
    }
    setLeftText(value) {
        if(this.text_field2 === undefined) {
            this.text_field2 = document.createElement("span");
            this.text_field2.className = "slider-span";
            this.text_field2.style.marginLeft = this.left_text_offset;
            this.text_field2.style.textAlign = "right";
            let node = this.svg.node();
            node.parentNode.insertBefore(this.text_field2, node);
        }
        this.text_field2.innerHTML = value;
    }
    setValue(value) {
        this.current_value = value;

        if(this.current_value < this.x.domain()[0])
            this.current_value = this.x.domain()[0];
        if(this.current_value > this.x.domain()[1])
            this.current_value = this.x.domain()[1];

        this.handle.attr("cx", this.x(this.current_value));
        this.onValueChanged(this.current_value);
    }
    value() {
        return this.current_value;
    }
    onValueChanged(value) {

    }
    setRange(min, max) {
        this.x.domain([min, max]);
        if(this.current_value < min)
            this.current_value = min;
        if(this.current_value > max)
            this.current_value = max;
        if(this.ticks) {
            this.ticks.selectAll("text")
                .data(this.x.ticks(10))
                .attr("x", this.x)
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d;
                });
            this.ticks.selectAll("text")
                .enter().append("text")
                .attr("x", this.x)
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d;
                });
            this.ticks.selectAll("text").exit().remove();
        }
    }
    next() {
        this.setValue(this.current_value + this.step);
    }
    loop(millies) {
        this.play(millies);
        this.do_loop = true;
    }
    play(millies) {
        this.speed = millies || this.speed;
        this.do_loop = false;
        if(this.playing_timer) {
            clearTimeout(this.playing_timer);
            this.playing_timer = 0;
            this.button_play.attr("visibility", "show");
            this.button_pause.attr("visibility", "hidden");
        }
        else {
            this.button_play.attr("visibility", "hidden");
            this.button_pause.attr("visibility", "show");
            if(this.current_value >= this.x.domain()[1]) {
                this.current_value = this.x.domain()[0]
            }
            this.playing();
        }
    }
    playing() {
        this.next();
        if(this.current_value < this.x.domain()[1])
            this.playing_timer = setTimeout(this.playing.bind(this), this.speed);
        else if(this.do_loop) {
            this.setValue(0);
            this.playing_timer = setTimeout(this.playing.bind(this), this.speed);
        }
        else {
            this.button_play.attr("visibility", "show");
            this.button_pause.attr("visibility", "hidden");
            this.playing_timer = 0;
        }
    }
}