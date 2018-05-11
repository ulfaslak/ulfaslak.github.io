// Based on simple canvas network visualization by Mike Bostock
// source: https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

// State variables
dataset = "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/4cab5036464800e51ce59fc088688e9821795efb/miserables.json"

// Canvas
var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    width = canvas.width
    height = canvas.height

// Retina canvas rendering    
var devicePixelRatio = window.devicePixelRatio || 1
d3.select(canvas)
    .attr("width", width * devicePixelRatio)
    .attr("height", height * devicePixelRatio)
    .style("width", width + "px")
    .style("height", height + "px").node()
context.scale(devicePixelRatio, devicePixelRatio)


// Simulation
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) { return computeLinkDistance(d); }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(0))
    .force("x", d3.forceX(width / 2)).force("y", d3.forceY(height / 2));

// Control variables
var controls = {
  'Dataset': "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/4cab5036464800e51ce59fc088688e9821795efb/miserables.json",
  'Charge strength': -30,
  'Center gravity': 0.1,
  'Link strength': 0.5,
  'Link distance': 30,
  'Link width': 1,
  'Link alpha': 0.5,
  'Node size': 5, 
  'Node stroke size': 1,
  'Node size log scaling': false,
  'Link distance log scaling': false,
  'Collision': false,
  'Node fill': '#16a085',
  'Node stroke': '#000000',
  'Link stroke': '#7c7c7c',
  'Download figure': 'filename'
};

// Control panel
var gui = new dat.GUI(); gui.width = 400; gui.remember(controls);

var f1 = gui.addFolder('Input/output'); f1.open();
f1.add(controls, 'Dataset', controls['Dataset']).onChange(function(v) { inputtedDataset(v) });
f1.add(controls, 'Download figure').onFinishChange(function(v){ download(v) })

var f2 = gui.addFolder('Physics'); f2.open();
f2.add(controls, 'Charge strength', -100, 0).onChange(function(v) { inputtedCharge(v) });
f2.add(controls, 'Center gravity', 0, 1).onChange(function(v) { inputtedGravity(v) });
f2.add(controls, 'Link strength', 0, 2).onChange(function(v) { inputtedStrength(v) });
f2.add(controls, 'Link distance', 0.1, 100).onChange(function(v) { inputtedDistance(v) });
f2.add(controls, 'Collision', false).onChange(function(v) { inputtedCollision(v) });

var f3 = gui.addFolder('Styling'); f3.open();
f3.addColor(controls, 'Node fill', controls['Node fill']).onChange(function(v) { inputtedNodeFill(v) });
f3.addColor(controls, 'Node stroke', controls['Node stroke']).onChange(function(v) { inputtedNodeStroke(v) });
f3.addColor(controls, 'Link stroke', controls['Link stroke']).onChange(function(v) { inputtedLinkStroke(v) });
f3.add(controls, 'Link width', 0.1, 4).onChange(function(v) { inputtedLinkWidth(v) });
f3.add(controls, 'Link alpha', 0, 1).onChange(function(v) { inputtedLinkAlpha(v) });
f3.add(controls, 'Node size', 0, 10).onChange(function(v) { inputtedNodeSize(v) });
f3.add(controls, 'Node stroke size', 0, 10).onChange(function(v) { inputtedNodeStrokeSize(v) });
f3.add(controls, 'Node size log scaling', false).onChange(function(v) { inputtedNodeSizeLogScaling(v) });
f3.add(controls, 'Link distance log scaling', false).onChange(function(v) { inputtedLinkWeightLogScaling(v) });



// Run simulation
restart();

// Restart simulation. Only used when reloading data
function restart() {
  d3.json(dataset, function(error, graph) {
    if (error) throw error;

    max_node_size = d3.max(graph.nodes.map(n => { if (n.size) { return n.size } else return 1; }));
    node_scale = 2 / max_node_size

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    d3.select(canvas)
        .call(d3.drag()
            .container(canvas)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    function ticked() {
      context.clearRect(0, 0, width, height);

      context.beginPath();
      graph.links.forEach(drawLink);
      context.strokeStyle = controls['Link stroke'];
      context.lineWidth = controls['Link width'];
      context.globalAlpha = controls['Link alpha'];
      context.stroke();

      context.beginPath();
      graph.nodes.forEach(drawNode);
      context.globalAlpha = 1.0
      context.strokeStyle = controls['Node stroke'];
      context.lineWidth = controls['Node stroke size'];
      context.stroke();
      context.fillStyle = controls['Node fill'];
      context.fill();

    }

    function dragsubject() {
      return simulation.find(d3.event.x, d3.event.y);
    }
  }); 
}


// Network functions
// -----------------

function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

function drawLink(d) {
  context.moveTo(d.source.x, d.source.y);
  context.lineTo(d.target.x, d.target.y);
}

function drawNode(d) {
  if (d.size) { 
    thisnodesize = d.size * controls['Node size'] * node_scale;
  } else {
    thisnodesize = controls['Node size'] * node_scale;
  };
  if (controls['Node size log scaling']) {
    thisnodesize = logscaler(thisnodesize+1) * controls['Node size'] * node_scale
  }
  context.moveTo(d.x + thisnodesize, d.y);
  context.arc(d.x, d.y, thisnodesize, 0, 2 * Math.PI);
}


// Utility functions
// -----------------

logscaler = d3.scaleLog()

function computeNodeRadii(d) {
  if (d.size) {
    thisnodesize = d.size * controls['Node size'] * node_scale;
  } else {
    thisnodesize = controls['Node size'] * node_scale;
  };
  if (controls['Node size log scaling']) {
    thisnodesize = logscaler(thisnodesize + 1) * controls['Node size'] * node_scale;
  }
  return thisnodesize + controls['Node stroke size'];
}

function computeLinkDistance(d) {
  if (d.weight) {
    thislinkweight = 1 / d.weight * controls['Link distance'];
  } else {
    thislinkweight = controls['Link distance'];
  }
  if (controls['Link distance log scaling']) {
    thislinkweight = logscaler(thislinkweight + 1) * controls['Link distance']
  }
  return thislinkweight
}

function download(filename){
    var link = document.createElement('a');
    link.download = filename + '.png';
    link.href = document.getElementById('canvas').toDataURL()
    link.click();
  }

// Input handling functions
// ------------------------

function inputtedDataset(v) {
  restart();
  simulation.alpha(1).restart();
}

function inputtedCharge(v) {
  simulation.force("charge").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedGravity(v) {
  simulation.force("x").strength(+v);
  simulation.force("y").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedStrength(v) {
  simulation.force("link").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedDistance(v) {
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedLinkWidth(v) {
  simulation.restart();
}

function inputtedLinkAlpha(v) {
  simulation.restart();
}

function inputtedNodeSize(v) {
  if (controls['Collision']) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedNodeStrokeSize(v) {
  simulation.restart();
}

function inputtedNodeSizeLogScaling(v) {
  if (controls['Node size log scaling']) {
    node_scale = 1;
  } else {
    node_scale = 2 / max_node_size;
  }
  if (controls['Collision']) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedLinkWeightLogScaling(v) {
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedCollision(v) {
  simulation.force("collide").radius(function(d) { return controls['Collision'] * computeNodeRadii(d) });
  simulation.alpha(1).restart();
}

function inputtedNodeFill(v) {
  simulation.restart();
}

function inputtedNodeStroke(v) {
  simulation.restart();
}

function inputtedLinkStroke(v) {
  simulation.restart();
}