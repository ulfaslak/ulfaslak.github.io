// Simulation variables
var N = 80,
	Narr = d3.range(N),
	inc = 1.0,
	bw = 5,
	eeRatio = .95,
	searchDepth = 5;

// System state variables
var A = Narr.reduce(function(map, d) { map[d] = {}; return map; }, {}),
	T = Array.from(Array(N), () => 0);
var partition = {};
d3.range(N).map(function(d){partition[d] = d})

// ------------------ //
// Interface controls //
// ------------------ //

// Variables
fastMode = false;
auto = true;
complete = false;

// Simulation control functions
function addLink() {
	var reps = 1;
	if (fastMode) {
		reps = 10;
	}

	for (var _ in d3.range(reps)){
		[i, j, d] = process();
		if (j != d) {
			update(i, j, d);
		}
	};

	restart();
}

function addLinkUserControl() {
	if (complete){
		complete = false;
		restartSimulation();
	};
	addLink();
}

function toggleFastMode(e) {
	fastMode = !fastMode;
}

function restartSimulation() {
	A = Narr.reduce(function(map, d) { map[d] = {}; return map; }, {}),
	T = Array.from(Array(N), () => 0);
	links.slice().forEach(function() { links.splice(0, 1); })
	d3.range(N).map(function(d){partition[d] = d})
	complete = false;
	restart();
}

async function autoStart() {
	for (var _ in d3.range(200)){
		for (var _ in d3.range(5)){
			[i, j, d] = process();
			if (j != d) { update(i, j, d); }
		}
		restart();
		await timer(10);

		if (!auto) {
			break;
		};

		if (d3.mean(d3.values(A).map(function(d) { return d3.keys(d).length; })) >= bw) {
			break;
		};
	};
	complete = true;
}

// Event listener
document.addEventListener("keydown", function(e) {
	switch (e.keyCode) {
		case 68:
			addLinkUserControl(); break
		case 70:
			toggleFastMode(); break
		case 82:
			auto = false;
			restartSimulation(); break
	}
}, false);


// ------------- //
// Visualization //
// ------------- //

// Create svg object
var svg = d3.select("svg")

var w = d3.select("svg").attr("width"),
	h = d3.select("svg").attr("height");

// Cheap hack: set background click to trigger step
svg.selectAll("background")
    .data(["dummy"])
    .enter()
    .append("rect")
    .attr("class", "background")
    .attr('width', w)
    .attr('height', h)
    .attr('fill', 'white')
    .attr('fill-opacity', 0.0)
    .on("click", addLinkUserControl);

var g = svg.append("g");

// Weight scale
var linkWeightScale = d3.scaleLinear().domain([1, 3]).range([1, 2])

// Node color
var color = d3.scaleOrdinal(d3.schemeCategory10);

// Nodes and links
var nodes = d3.range(N).map(function(i){return {'id': i}})
var links = [];

// Force simulation
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
    .force("charge", d3.forceManyBody().strength(-25))
    .force("center", d3.forceCenter(w / 2, h / 2))
    .force("x", d3.forceX(w / 2, h / 2))
    .force("y", d3.forceY(w / 2, h / 2))
    .on("tick", ticked);

// Draw links
var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links).enter()
    .append("line");

// Draw nodes
var node = g.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes).enter()
    .append("circle")

node
    .attr("id", function(d) {
        return "n" + d.id;
    })
    .attr("r", 4)
    .attr("stroke-width", 1)
    .attr("fill", function(d) {
    	return color(partition[d.id]);
    })
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

autoStart();


// Visualization: Utility functions //
// -------------------------------- //

// Zooming
function zoomed() {
	g.attr("transform", d3.event.transform);
}

// Ticks
function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

// Dragging
function dragstarted(d) {
  mode_pos = false
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Finding, incrementing and decrementing links
function update(i, j, d) {
	incLink(i, j)
	if (d != undefined) { decLink(i, d); };
}

function findLink(a, b) {
	return links.filter(function(e) {
		return (e.source.id == a) && (e.target.id == b) || (e.source.id == b) && (e.target.id == a)
	})[0]
}

function findLinkPreRestart(a, b) {
	return links.filter(function(e) {
		return (e.source == a) && (e.target == b) || (e.source == b) && (e.target == a)
	})[0]
}

function incLink(a, b) {
	var e = findLink(a, b)
	if (e != undefined) {
		links.splice(links.indexOf(e), 1);
		e['weight'] += inc;
	} else {
		e = {'source': a, 'target': b, 'weight': inc};
	}
	links.push(e);
}

function decLink(a, b) {
	var e = findLink(a, b)
	if (e == undefined) {
		e = findLinkPreRestart(a, b);
	}
	if (e == undefined) {
		console.log("Warning!")
	}
	links.splice(links.indexOf(e), 1);
	if (e['weight'] > inc) {
		e['weight'] -= inc;
		links.push(e);
	}
}

// Restart simulation
function restart() {

	// Recolor nodes
	partition = getCommunityLabels()
	node.attr("fill", function(d) {
    	return color(partition[d.id]);
    });

	// Apply the general update pattern to the links.
	link = link.data(links);
	link.exit().remove();
	link = link.enter().append("line").attr("stroke-width", 1).merge(link);

	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1.0);
	simulation.restart();
}



// ------- //
// Process // 
// ------- //

function process() {

	var i, j, d;

	i = chooseRandom(Narr);
	//console.log("Node:", i)

 	// If bandwidth is exceeded, delete a random local link
	if (strength(i, A) + inc > bw) {
		d = +chooseRandom(neighbors(i, A));
		//console.log("Bandwidth exceeded. Removing link to", d)
		decrement(A, i, d);
		decrement(A, d, i);
		H = intersect(neighbors(i, A), neighbors(d, A));
		if (H.length > 0) {
			[i, d].concat(H).forEach(function(h){
				T[h] = localWeightedClustering(h, A);
			});
		};
	};

	// Choose attachment strategy
	if (Math.random() < eeRatio && degree(i, A) > 0) {
		j = exploit(i, A);
		//console.log("Exploit. Link to", j)
		if (j == undefined) {
			j = explore(i, A, T);
			//console.log("Explore. Link to", j)
		};
	} else {
		j = explore(i, A, T);
		//console.log("Explore. Link to", j)
	};

	// In case there were no possible attachment for node i, continue
	if (j == undefined) {
		//console.log("Linking failed.")
		return;
	};

	// Add check that no strength exceeds bw here
	// ---- code ----

	// Update A (successful attachment!) 
	increment(A, i, j);
	increment(A, j, i);

	// Update T
	H = intersect(neighbors(i, A), neighbors(j, A))
	if (H.length > 0) {
		[i, j].concat(H).forEach(function(h){
			T[h] = localWeightedClustering(h, A);
		});
	};

	return [+i, +j, d];
}


// Process: Attachment functions //
// ----------------------------- //

function explore(i, A, T){
	// List of possible neighbors
	var eligible = d3.keys(A).filter(function(j) { 
		if (j != i && !(neighbors(i, A).includes(j)) && strength(j, A) + inc <= bw){
			return true;
		};
	});

	// If no posible nodes to connect to, return undefined and handle in calling function
	if (eligible.length == 0) {
		return undefined;
	};

	// In cases where no nodes have transistivity, choose one at random
	if (T.filter(function(t){ if(t != 0) { return true; }}).length == 0) {
		return chooseRandom(eligible);
	};

	// Choose a neighbor based on the probabilities given by T
	var pDist = eligible.map(function(j){ return T[j] / d3.sum(T); });
	return chooseStochastic(eligible, pDist);
}

function nearestEligible(i, A, uneligible) {
	var neigh = neighbors(i, A)
	for (var _ in d3.range(searchDepth)) {
		neighNeigh = unwrap(neigh.map(function(j) { return neighbors(j, A); })).filter(function(j) {return j != i;});
		eligibleNn = neighNeigh.filter(function(j) { return !uneligible.includes(j); });
		if (eligibleNn.length > 0) {
			return eligibleNn;
		} else {
			if (neighNeigh.length == 0) {
				return undefined;
			};
			neigh = neighNeigh;
		}
	};
	return undefined;
}

function exploit(i, A) {
	// List of possible neighbors
	var uneligible = d3.keys(A).filter(function(j) { 
		if (j == i || neighbors(j, A).includes(i) || strength(j, A) + inc > bw){
			return d3.keys(A[j]).length;
		};
	}).map(function(v) { return +v; });

	var eligible = nearestEligible(i, A, uneligible)
	if (eligible != undefined) {
		return chooseRandom(eligible);
	} else {
		return undefined
	}
}


// Process: Utility functions //
// -------------------------- //

function strength(i, A){
	return d3.sum(d3.values(A[i]));
};

function degree(i, A){
	return d3.keys(A[i]).length;
};

function neighbors(i, A){
	return d3.keys(A[i]).map(function(v) { return +v; });
};

function localWeightedClustering(i, A){
	/*Compute weighted local clustering coefficient.
	Source: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC374315/*/
	var c_i = 0;

	var J = neighbors(i, A);
	J.forEach(function(j){
	
		var H = intersect(neighbors(j, A), J);
		H.forEach(function(h){
			c_i += (A[i][j] + A[i][h]) / 2.0;
		});
 	});

 	if (strength(i, A) == 0) {
 		return 0;
 	} else {
 		return c_i / (strength(i, A) * (degree(i, A) - 1));
 	};
};

function increment(A, a, b) {
	if (A[a][b] == undefined) {
		A[a][b] = inc;
	} else {
		A[a][b] += inc;
	};
}

function decrement(A, a, b) {
	if (A[a][b] == inc) {
		delete A[a][b];
	} else {
		A[a][b] -= inc;
	}
}

function intersect(a, b)
{
	var ai=0, bi=0;
	var result = [];

	while( ai < a.length && bi < b.length )
	{
		if (a[ai] < b[bi]){
			ai++;
		} else if (a[ai] > b[bi]){
			bi++;
		} else { /* they're equal */
			result.push(a[ai]);
			ai++;
			bi++;
		}
	}

  return result;
};

function chooseRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function chooseStochastic(values, p) {
    var rand = Math.random(),
        s = 0,
        lastIndex = values.length - 1;

    for (var i = 0; i < lastIndex; ++i) {
        s += p[i];
        if (rand < s) {
            return values[i];
        };
    };
    return values[lastIndex];
};

function getCommunityLabels(){
	if (links.length > 0){
		node_data = nodes.map(function(node){return node.id});
		edge_data = links.map(function(link){
			return {
				'source': link.source.id,
				'target': link.target.id,
				'weight': link.weight
			}
		})

		if (partition == 0) {console.log("lol!!")}
		partition = jLouvain().nodes(node_data).edges(edge_data).partition_init(partition)();
	}
	return partition
};



// ----------------- //
// Utility functions //
// ----------------- //
function unwrap(arr) {
	return [].concat.apply([], arr);
};

function timer(ms){
	return new Promise(r=>setTimeout(r,ms));
}