w = 510;
h = 510;
s = 50;
r = 15;

di = [
    [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0],
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10]
]
dg = ['zero','one','two','three','four','five','six','seven','eight','nine']

w1 = document.getElementById("w1");
w2 = document.getElementById("w2");

n_nodes = 10;
n_edges = n_nodes * (n_nodes - 1) / 2;

var get_label = function(i, j) {
    return [dg[i], dg[j]].sort().join("")
}

active = {}
for (i=0; i<n_nodes; i++) {
    for (j=0; j<n_nodes; j++) {
        if (j <= i) { continue; }
        active[get_label(i, j)] = false
    }
}

// ---------------- //
// Adjacency matrix //
// ---------------- //

var svg_w1 = d3.select("#w1")
    .append("svg")
    .attr("width", w+50)
    .attr("height", h+50);

svg_w1.selectAll("circle")
    .data(di)
    .enter()
    .append("svg:circle")
    .attr("cx", function(d) {
        return d[0] * 51 + 29;
    })
    .attr("cy", function(d) {
        return d[1] * 51 + 25;
    })
    .attr("r", r)
    .attr("fill", "#95a5a6")

svg_w1.selectAll("text")
    .data(di)
    .enter()
    .append("text")
    .text(function(d) { return Math.max(d[0], d[1])-1; })
    .attr("x", function(d) {
        return d[0] * 51 + 24.5;
    })
    .attr("y", function(d) {
        return d[1] * 51 + 30;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "white");

svg_w1.selectAll(".background")
    .data([0])
    .enter()
    .append("rect")
    .attr("x", 49)
    .attr("y", 49)
    .attr("width", w+1)
    .attr("height", h+1);

for (i=0; i<n_nodes; i++) {
    for (j=0; j<n_nodes; j++) {
        if (j > i) { 
            data = [[i, j], [j, i]];
        } else if (j == i) {
            data = [[i, j]];
        } else {
            continue;
        }
        label = get_label(i, j)

        var edgebox = svg_w1.selectAll(label)
            .data(data)
            .enter()

        edgebox.append("rect")
            .attr("class", label)
            .attr("x", function(d) {
              return d[0] * s + d[0] + 50;
            })
            .attr("y", function(d) {
              return d[1] * s + d[1] + 50;
            })
            .attr("width", s)
            .attr("height", s)
            .attr("fill", "#ecf0f1")
            .on("click", function(d) {
                if (d[0] != d[1]) {
                    label = get_label(d[0], d[1])
                    if (active[label]) { 
                        opacity = 1;
                        active[label] = false
                        graph.removeLink(d[0], d[1]);
                        graph.removeLink(d[1], d[0]);
                        keepNodesOnTop();
                    }
                    else if (!active[label]) {
                        opacity = 0.7;
                        active[label] = true
                        graph.addLink(d[0], d[1], '20');
                        keepNodesOnTop();
                    }
                    d3.selectAll("." + label)
                        .transition()
                        .duration(200)
                        .style({'opacity': opacity});
                } else {
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .style({'opacity': 0.7})
                        .transition()
                        .duration(100)
                        .style({'opacity': 1.0})
                        
                }
            })
    }
}


// ----- //
// Graph //
// ----- //

var graph;
function myGraph() {

    // Add and remove elements on the graph object
    this.addNode = function (id) {
        nodes.push({"id": id});
        update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        update();
    };

    this.addLink = function (source, target, value) {
        links.push({"source": findNode(source), "target": findNode(target), "value": value});
        update();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] === id) return nodes[i];
        }
        ;
    };


    var vis = d3.select("#w2").append("svg")
        .attr("width", w)
        .attr("height", h)

    var force = d3.layout.force()
        .gravity(.05)
        .charge(-240*2)
        .linkDistance(100)
        .size([w, h]);

    var nodes = force.nodes();
    var links = force.links();

    var update = function () {
        var link = vis.selectAll("line")
                .data(links, function (d) {
                    return d.source.id + "-" + d.target.id;
                });

        link.enter().append("line")
                .attr("id", function (d) {
                    return d.source.id + "-" + d.target.id;
                })
                .attr("stroke-width", function (d) {
                    return d.value / 10;
                })
                .attr("class", "link");
        link.append("title")
                .text(function (d) {
                    return d.value;
                });
        link.exit().remove();

        var node = vis.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                });

        var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .call(force.drag);

        nodeEnter.append("svg:circle")
                .attr("r", r)
                .attr("id", function (d) {
                    return "Node;" + d.id;
                })
                .attr("class", "nodeStrokeClass")
                .attr("fill",  "#95a5a6")
                .on('mouseover', function() {
                    d3.select("body").style("cursor", "default")
                });

        nodeEnter.append("svg:text")
                .attr("class", "textClass")
                .attr("x", -4.5)
                .attr("y", 5)
                .text(function (d) {
                    return d.id;
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "16px")
                .attr("font-weight", "bold")
                .attr("fill", "white");

        node.exit().remove();

        force.on("tick", function () {
            node.attr("transform", function (d) {
                return "translate(" + Math.max(r, Math.min(w - r, d.x)) + "," + Math.max(r, Math.min(h - r, d.y)) + ")";
            });
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });
        })
            .start()

    };


    // Make it all go
    update();
}

function drawGraph() {

    graph = new myGraph("#svgdiv");

    for (node=0; node<n_nodes; node++) {
        graph.addNode(node);
    }

    keepNodesOnTop();

}

drawGraph();

// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    $(".nodeStrokeClass").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}
function addNodes() {
    d3.select("svg")
            .remove();
     drawGraph();
}