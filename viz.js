var N = 80,
	Narr = d3.range(N),
	inc = 1.0,
	bw = 5,
	eeRatio = .95,
	searchDepth = 5;

var A = Narr.reduce(function(map, d) { map[d] = {}; return map; }, {}),
	T = Array.from(Array(N), () => 0);

// Simulate d-key from touch event
document.addEventListener("touchstart", function(e) {
	document.onkeydown({ keyCode: 68 });
});
document.addEventListener("touchend", function(e) {
	document.onkeyup({ keyCode: 68 });
});

// d-key event
document.addEventListener("keydown", timeTick, false);
function timeTick(e) {
	if (e.keyCode == 68 | ) {
		var reps = 1;
		if (oneDown) {
			reps = 10;
		}

		for (var _ in d3.range(reps)){
			[i, j, d] = process();
			if (j != d) { update(i, j, d); }
		};

		restart();  // Restart must be in here, because findLink looks for e.source/target.id, which does not exist on an edge before update.
	};
};

// f-key event
var oneDown = false;
document.addEventListener("keydown", function(e) { 
	switch (e.keyCode) {
		case 70:
			oneDown = !oneDown;
			break
	}
}, false);

document.addEventListener("keydown", function(e) {
	if (e.keyCode == 82) { reset(); }
});


// ------- //
// Control //
// ------- //

function reset() {
	A = Narr.reduce(function(map, d) { map[d] = {}; return map; }, {}),
	T = Array.from(Array(N), () => 0);
	links.slice().forEach(function() { links.splice(0, 1); })
	restart();
}


// ------------- //
// Visualization //
// ------------- //

// Create svg object
var svg = d3.select("svg")
    .call(d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", zoomed));

var w = d3.select("svg").attr("width"),
	h = d3.select("svg").attr("height");

var g = svg.append("g");

// Weight scale
var linkWeightScale = d3.scaleLinear().domain([1, 3]).range([1, 2])

// Nodes and links
var nodes = polygonCoords(N, 200, [w/2, h/2]); //d3.range(N).map(function(i){return {'id': i}})
var links = [];

// Force simulation
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
    //.strength(function(d){ return linkStrengthScale(+d.value); }))
    .force("charge", d3.forceManyBody().strength(-20))
    .force("center", d3.forceCenter(w / 2, h / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", ticked);

// Draw links
var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links).enter()
    .append("line");

// Draw nodes
node = g.append("g")
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
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

restart();


// Visualization: Utility functions //
// -------------------------------- //

// Initial positions
function polygonCoords(N, scale, center) {
  return d3.range(N)
    .map(function(index) { return index / N * 2 * 3.141592654 })
    .map(function(theta, i) { 
      return {
        'id': i,
        //'x': Math.cos(theta) * scale + center[0],  // Uncomment x and y to
        //'y': Math.sin(theta) * scale + center[1]   // place in init. circle
      }
    }) 
}

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
    text
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
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
		e['value'] += inc;
	} else {
		e = {'source': a, 'target': b, 'value': inc};
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
	if (e['value'] > inc) {
		e['value'] -= inc;
		links.push(e);
	}
}

// Restart simulation
function restart() {

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
	console.log("Node:", i)

 	// If bandwidth is exceeded, delete a random local link
	if (strength(i, A) + inc > bw) {
		d = +chooseRandom(neighbors(i, A));
		console.log("Bandwidth exceeded. Removing link to", d)
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
		console.log("Exploit. Link to", j)
		if (j == undefined) {
			j = explore(i, A, T);
			console.log("Explore. Link to", j)
		};
	} else {
		j = explore(i, A, T);
		console.log("Explore. Link to", j)
	};

	// In case there were no possible attachment for node i, continue
	if (j == undefined) {
		console.log("Linking failed.")
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

function unwrap(arr) {
	return [].concat.apply([], arr);
};














