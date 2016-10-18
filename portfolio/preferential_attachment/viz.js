w = 560;
h = 510;
r = 10;

sorted = false

D = [0, 1]
N = {0: [1], 1: [0]}

w1 = document.getElementById("w1");
w2 = document.getElementById("w2");

var vis = d3.select("#w1").append("svg")
        .attr("width", w)
        .attr("height", h)

var hist = d3.select("#w2")
        .append("svg")
        .attr("width", w+50)
        .attr("height", h);

// Controls
function drawControls() {
    vis.selectAll("controlslabel")
        .data([0]).enter().append("svg:text")
        .text("Controls")
        .attr("x", 40 )
        .attr("y", h - 20 + 6)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("fill", "#2c3e50");

    vis.selectAll("controls")
        .data([["+1", 0.7], ["+10", 5],["r", 10.8], ["s", 15.5]])
        .enter()
        .append("svg:text")
        .text(function(d) { return d[0]; })
        .attr("x", function(d) { return 12.5*d[1] + 170; })
        .attr("y", h - 20 + 6)
        .attr("font-family", "sans-serif")
        .attr("font-size", function(d) {
            if (d[0] == "+1") { return "20px"; }
            if (d[0] == "+10") {return "20px"; }
            else { return "25px"; }
        })
        .attr("font-weight", "bold")
        .attr("fill", "black");

    vis.selectAll("addnodecircle")
        .data([1, 4, 7, 10])
        .enter()
        .append("svg:circle")
        .attr("cx", function(d) { return 20*d + 170; })
        .attr("cy", h - 26 + 6)
        .attr("r", 20)
        .attr("fill", "#95a5a6")
        .attr("opacity", 0.5)
        .on("click", function(d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style({'opacity': 0.8})
                .transition()
                .duration(100)
                .style({'opacity': 0.5})
            if (d == 1) {  
                addRandomNode()
            }
            if (d == 4) {
                playProcess()
            }
            if (d == 7) {
                restart()
            }
            if (d == 10) {
                sorted = !sorted;
                clear_bars();
                update_histogram();
            }
        
        })
        .on("mouseover", function(d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style({'opacity': 0.8})
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style({'opacity': 0.5})
        })
}

// Histogram
function drawHist() {

    window.clear_bars = function() {
        hist.selectAll("rect")
            .remove()
    }

    hist.selectAll("distlabel")
        .data([0]).enter().append("svg:text")
        .text("Degree distribution")
        .attr("x", 190 )
        .attr("y", 20)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("fill", "#2c3e50");

    window.update_histogram = function() {
        N_hist = d3.keys(N)
            .map(function(e, i) { return [e, N[i].length]; })
            .sort(function(a, b) {
                var x=a[1];
                var y=b[1];
                return y-x;
            });

        N_hist_max = Math.max(...N_hist.map(function(e) { return e[1]; }))

        xscale = d3.scale.linear()
            .domain([0, N_hist.length])
            .range([0, w]);
        yscale = d3.scale.linear()
            .domain([0, N_hist_max])
            .range([30, h])

        clear_bars()

        hist.selectAll("bar")
            .data(N_hist)
            .enter()
            .append("rect")
            .attr("x", function(d, i) { if (sorted) { return xscale(i); } else { return xscale(d[0]); }; })
            .attr("y", function(d) { return h-yscale(d[1]) + 40 })
            .attr("width", function(d) { return w/N_hist.length; })
            .attr("height", function(d) { return yscale(d[1]) - 40; })
            .attr("stroke-width", function(d) { return 10/Math.sqrt(d3.keys(N_hist).length)})       
    }

    update_histogram()
}


// Graph
var graph;
function myGraph() {

    // Add and remove elements on the graph object
    this.addNode = function (id) {
        nodes.push({"id": id});
        update_network();
    };

    this.addLink = function (source, target, value) {
        links.push({"source": findNode(source), "target": findNode(target), "value": value});
        update_network();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] === id) return nodes[i];
        };
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        };
    };

    this.resetLinks = function () {
        links.splice(1, links.length);
        update_network();
    };

    this.resetNodes = function () {
        nodes.splice(2, nodes.length);
        update_network();
    };

    var force = d3.layout.force()

    var nodes = force.nodes();
    var links = force.links();

    var update_network = function () {
        var link = vis.selectAll("line")
                .data(links, function (d) {
                    return d.source.id + "-" + d.target.id;
                });

        link.enter().append("line")
                .attr("id", function (d) {
                    return d.source.id + "-" + d.target.id;
                })
                .attr("stroke-width", function (d) {
                    return 5/Math.pow(nodes.length, 1.0/10);
                })
                .attr("class", "link");

        link.append("title")
        link.exit().remove();

        var node = vis.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                });

        var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .call(force.drag);

        nodeEnter.append("svg:circle")
                .attr("r", function() {
                    if (nodes.length > 2) {
                        return r/Math.pow(nodes.length, 1.0/10)
                    } else {
                        return r
                    }
                })
                .attr("id", function (d) {
                    return "Node;" + d.id;
                })
                .attr("class", "nodeStrokeClass")
                .attr("fill",  "#16a085")
                .on('mouseover', function() {
                    d3.select("body").style("cursor", "default")
                });

        // nodeEnter.append("svg:text")
        //         .attr("class", "textClass")
        //         .attr("x", -4.5)
        //         .attr("y", 5)
        //         .text(function (d) {
        //             return d.id;
        //         })
        //         .attr("font-family", "sans-serif")
        //         .attr("font-size", "16px")
        //         .attr("font-weight", "bold")
        //         .attr("fill", "white");

        node.exit().remove();

        force
            .on("tick", function () {
                node.attr("transform", function (d) {
                    return "translate(" + Math.max(r, Math.min(w - r, d.x)) + "," + Math.max(r, Math.min(h-42 - r, d.y)) + ")";
                });
                link.attr("x1", function (d) { return Math.max(r, Math.min(w - r, d.source.x)); })
                    .attr("y1", function (d) { return Math.max(r, Math.min(h-42 - r, d.source.y)); })
                    .attr("x2", function (d) { return Math.max(r, Math.min(w - r, d.target.x)); })
                    .attr("y2", function (d) { return Math.max(r, Math.min(h-42 - r, d.target.y)); });
            })
            .gravity(.05*Math.pow(nodes.length, 1.0/4))
            .charge(-240/Math.pow(nodes.length, 1.0/4))
            .linkDistance(100/Math.pow(nodes.length, 1/1.1))
            .size([w, h])
            .start()

    };

    // Make it all go
    update_network();
}

function drawGraph() {
    graph = new myGraph("#w2");

    graph.addNode(0);
    graph.addNode(1);
    graph.addLink(0, 1, 1);

    keepNodesOnTop();
}


drawGraph();
drawHist();
drawControls();


// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    $(".nodeStrokeClass").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}

window.addRandomNode = function() {
    var new_id = d3.keys(N).length
    var conn_id = D.randomElement()
    graph.addNode(new_id);
    graph.addLink(new_id, conn_id);
    keepNodesOnTop();
    D.push(new_id, conn_id);
    N[new_id] = [conn_id]
    N[conn_id].push(new_id)
    update_histogram()
}

window.playProcess = function() {
    var step = -1;
    function nextval() {
        step++;
        return (100*step); // initial time, wait time
    }
    for (i=0; i<10; i++){
        setTimeout(function() {
            addRandomNode()
        }, nextval());
    }
}

window.restart = function(){
    graph.resetNodes()
    graph.resetLinks()
    D = [0, 1]
    N = {0: [1], 1: [0]}
    window.clear_bars()
    window.update_histogram()
}

Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)]
}

Array.prototype.getUnique = function(){
    var uniques = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(this.lastIndexOf(this[i]) == this.indexOf(this[i])) {
            uniques.push(this[i]);
        }
    }
    return uniques;
}

Array.prototype.shuffle = function() {
  let m = this.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [this[m], this[i]] = [this[i], this[m]]
  }
  return this;
}