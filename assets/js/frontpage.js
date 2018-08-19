var systems = {
  'plant': {
    'order': 5,
    'angle': 25,
    'axiom': "---X",
    'rule': "X -> F[-X][X]F[-X]+FX\nF -> FF"
  },
  'penrose': {
    'order': 4,
    'angle': 36,
    'axiom': "[N]++[N]++[N]++[N]++[N]",
    'rule': "M -> OF++PF----NF[-OF----MF]++\nN -> +OF--PF[---MF--NF]+\nO -> -MF++NF[+++OF++PF]-\nP -> --OF++++MF[+PF++++NF]--NF\nF ->"
  },
  'koch': {
    'order': 3,
    'angle': 90,
    'axiom': "F+F+F+F",
    'rule': "F -> F+F-F-FF+F+F-F"
  },
  'sierpinski': {
    'order': 7,
    'angle': 60,
    'axiom': "AF",
    'rule': "A -> BF-AF-B\nB -> AF+BF+A"
  },
  'dragoncurve': {
    'order': 10,
    'angle': 90,
    'axiom': "FX",
    'rule': "X -> X+YF+\nY -> -FX-Y"
  },
  'hexg': {
    'order': 4,
    'angle': 60,
    'axiom': "XF",
    'rule': "X -> X+YF++YF-FX--FXFX-YF+\nY -> -FX+YFYF++YF+FX--FX-Y"
  },
  'cubes': {
    'order': 10,
    'angle': 120,
    'axiom': "Y",
    'rule': "X -> F+gF\nY -> XY-XY"
  },
  'sierpinski_sq': {
    'order': 10,
    'angle': 45,
    'axiom': "X--F--X--F",
    'rule': "X -> +Y-F-Y+\nY -> -X+F+X-"
  },
  'koch_snowflake': {
    'order': 4,
    'angle': 60,
    'axiom': "F++F++F",
    'rule': "F -> F-F++F-F"
  },
  'hilbert_curve': {
    'order': 6,
    'angle': 90,
    'axiom': "X",
    'rule': "X -> -YF+XFX+FY-\nY -> +XF-YFY-FX+"
  },
  // 'box': {
  //   'order': 4,
  //   'angle': 90,
  //   'axiom': "F+F+F+F",
  //   'rule': "F -> FF+F+F+F+FF"
  // },
  // 'leaf1': {
  //   'order': 7,
  //   'angle': 20,
  //   'axiom': "F[A][B]",
  //   'rule': "A -> [+A{.].C.}\nB -> [-B{.].C.}\nC -> FC"
  // },
  'leaf2': {
    'order': 13,
    'angle': 10,
    'axiom': "----+FF+FF+FF+FF[A][B]",
    'rule': "A -> [+A{.].C.}\nB -> [-B{.].C.}\nC -> C@1.2F"
  },
}

var system = d3.keys(systems)[Math.floor(Math.random() * d3.keys(systems).length)]
var order = systems[system]['order']
var angle = systems[system]['angle']
var axiom = systems[system]['axiom']
var rule = systems[system]['rule']

var S = _.min([window.innerWidth, window.innerHeight - 160 - 65])
document.getElementById('animation').setAttribute("width", S);
document.getElementById('animation').setAttribute("height", S);

var centerX = window.innerWidth / 2;
var centerY = window.innerHeight / 2;

var offsetX_ = 0;
var offsetY_ = 0;

document.addEventListener("mousemove", function(e){
  var offsetX = Math.abs(e.pageX - centerX);
  var offsetY = (window.innerHeight - e.pageY) - centerY;

  if (Math.sqrt((offsetX - offsetX_)**2 + (offsetY - offsetY_)**2) > 100) {
    
    if (offsetX > 0 & offsetY > 0) {
      angle = Math.atan(offsetY / offsetX) * 180  / Math.PI
    }
    if (offsetX <= 0 & offsetY > 0) {
      angle = 180 + Math.atan(offsetY / offsetX) * 180  / Math.PI
    }
    if (offsetX <= 0 & offsetY <= 0) {
      angle = 180 + Math.atan(offsetY / offsetX) * 180  / Math.PI
    }
    if (offsetX > 0 & offsetY <= 0) {
      angle = 360 + Math.atan(offsetY / offsetX) * 180  / Math.PI
    }

    draw(
      L(
        parse(
          "order: " + order + "\naxiom: " + axiom +  "\nangle: " + angle + "\n" + rule
        )
      ),
      d3.select("#animation")
    )

    offsetX_ = offsetX
    offsetY_ = offsetY

  }
})

draw(
  L(
    parse(
      "order: " + order + "\naxiom: " + axiom +  "\nangle: " + angle + "\n" + rule
    )
  ),
  d3.select("#animation")
)

function parse (text = '') {
  const def = {
    axiom: 'X',
    angle: 90,
    fill: '#f6f6f6',
    stroke: 'black',
    bg: '#ffffff',
  };
  
  const known = {
    angle: [/^[0-9\.]+$/, parseFloat],
    order: [/^[0-9]+$/, parseInt],
    axiom: String,
    animate: () => true,
    colorful: () => true,
    stroke: String,
    fill: String,
    bg: String,
  };

  // inherit defaults
  const system = Object.create(def);
  system.rules = {};
  system._text = text;
  
  var m, f;

  text.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    if (line.match(/^\/\//)) return;

    if (m = line.match(/^([a-z]+)(?:[ ]*:[ ]*(.*))?$/)) {
      if (f = known[m[1]]) {
        var test = /.*/;
        var coerce = f;
        if (f.splice) {
          test = f[0];
          coerce = f[1];
        }
        if (!(m[2] || '').match(test)) {
          throw 'Parameter invalid: ' + m[1];
        }
        system[m[1]] = coerce(m[2] || '');
      } else {
        throw 'Err: key not known: ' + m[1];
      }
    } else if (m = line.match(/^([A-Z])[ ]*(?:->|=)[ ]*(.*)$/)) {
      system.rules[m[1]] = m[2];
    } else {
      throw 'Err: line not parseable: ' + line;
    }
  });
  
  const constants = {};
  Object.values(system.rules).forEach(v => {
    v.split('').forEach(c => {
      if (system.rules[c] === undefined) {
        constants[c] = c;
      }
    });
  });
  system.rules = Object.assign(Object.create(constants), system.rules);
  
  if (!system.order) {
    system.order = 2;
  }
  
  if (system.colorful) {
    const colorset = colorsets[Math.floor(Math.random() * colorsets.length)];
    Object.assign(system, colorset);
  }

  return system;
}

function L (system = {}) {
  var gen;

  function reset () {
    gen = [system.axiom];
  }
  
  function g (n = 0) {
    return new Promise(resolve => {
      function go () {
        if (gen[n]) return resolve(gen[n]);
        gen.push(gen[gen.length-1].replace(/./g, c => system.rules[c]));
        setTimeout(go, 1);
      }
      go();
    });
  }

  reset();

  g.reset = reset;
  g.system = system;
  return g;
}

function draw (lgen, svg) {
  
  svg.select('rect').remove();
  svg.selectAll('path').interrupt().remove();

  svg.append('rect')
    .attr('x', 0).attr('width', S)
    .attr('y', 0).attr('height', S)
    .attr('fill', lgen.system.bg)
    .attr('stroke', 'none');
  
  return new Promise(resolve => {
    linedata(lgen).then(data => {
      const b = bounds(data.lines);

      var sx = S / (b[2]-b[0]);
      var sy = S / (b[3]-b[1]);
      var diff = (b[2]-b[0]) - (b[3]-b[1]);
      if (sx > sy) {
        b[2] -= diff/2;
        b[0] += diff/2;
      } else {
        b[3] += diff/2;
        b[1] -= diff/2;
      }

      const scaleX = d3.scaleLinear().domain([b[0], b[2]]).range([10, S-10]);
      const scaleY = d3.scaleLinear().domain([b[1], b[3]]).range([10, S-10]);

      const T = 1500; // total animation time

      const line = d3.line().x(d => scaleX(d.x)).y(d => scaleY(d.y));

      // draw polygons
      const polygons = data.polygons.reverse();
      var polypaths = svg.selectAll('path.poly').data(polygons)
          .enter()
        .append('path').attr('class', 'poly')
          .attr('d', line)
          .attr('fill', lgen.system.fill)
          .attr('stroke', lgen.system.stroke)
          .attr('stroke-width', '1')
          .attr("stroke-dasharray", '3 3');

      // draw lines
      const lines = data.lines.reverse();
      var paths = svg.selectAll('path.line').data(lines.filter(line => line.length > 1))
          .enter()
        .append('path').attr('class', 'line')
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', lgen.system.stroke)
          .attr('stroke-width', '1')
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round");

      function animate () {
        var total_len = 0;
        paths
            .interrupt()
            .attr("stroke-dashoffset", function (d) {
              d._prevt = total_len;
              total_len += (d._len = this.getTotalLength());
              return d._len;
            })
            .attr("stroke-dasharray", d => d._len + ' ' + d._len);

        var u = T / total_len / 5;
        paths
            .transition()
            .delay(line => line._prevt * u)
            .duration(line => line._len * u)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
      }
      animate()
      svg.on("click", null).on("click", animate);
      resolve(svg.node());
    });  
  });
}

function bounds (lines) {
  const b = [0, 0, 0, 0]; // minx, miny, maxx, maxy
  
  for (var line of lines) {
    for (var p of line) {
      if (p.x < b[0]) b[0] = p.x;
      if (p.y < b[1]) b[1] = p.y;
      if (p.x > b[2]) b[2] = p.x;
      if (p.y > b[3]) b[3] = p.y;
    }
  }
  
  return b;
}

function linedata (g, order = g.system.order) {
  const lines = [];
  const polygons = []; const editpolys = [];
  const mat = [new Matrix()];
  mat[0]._step = 1;
  
  const start_new_line = () => lines.unshift([ mat[0].applyToPoint(0, 0) ]);
  const draw_line      = () => lines[0].push(mat[0].applyToPoint(mat[0]._step, 0));
  const just_move      = () => mat[0].translate(mat[0]._step, 0);
  
  const add_poly_dot   = () => {
    if (!editpolys.length) throw 'No polygon [add_poly_dot]';
    editpolys[0].push(mat[0].applyToPoint(0, 0));
  }
  const start_polygon  = () => editpolys.unshift([]);
  const close_polygon  = () => {
    if (!editpolys.length) throw 'No polygon [close_polyong]';
    var polygon = editpolys.shift();
    polygon.push(polygon[0]);
    polygons.push(polygon);
  }
  
  const instructions = {
    'F': () => (draw_line(), just_move()), // draw & move forward
    'f': () => (draw_line(), start_new_line()), // draw but don't move
    'g': () => (just_move(), start_new_line()), // only move forward
    '+': () => mat[0].rotateDeg(g.system.angle), // rotate right
    '-': () => mat[0].rotateDeg(-g.system.angle), // rotate left
    '|': () => mat[0].rotateDeg(180),
    '[': () => { mat.unshift(mat[0].clone()); mat[0]._step = mat[1]._step; }, // push matrix
    ']': () => (mat.shift(), start_new_line()), // pop matrix
    
    '.': () => add_poly_dot(),
    '{': () => start_polygon(),
    '}': () => close_polygon(),
  };
  
  start_new_line();
  
  return new Promise(resolve => {
    g(order).then(str => {
      var m;

      while (m = str.match(/^([^@]|@[IQ]?[0-9\.]+\^?)/)) {
        str = str.slice(m[1].length);
        if (m[1][0] == '@') {
          m = m[1].match(/^@([IQ]?)([0-9\.]+)(\^?)/);
          var mod = m[1];
          var n = parseFloat(m[2]);
          if (m[3]) n = Math.pow(n, g.system.order);
          if (mod == 'I') n = 1/n;
          if (mod == 'Q') n = Math.sqrt(n);
          mat[0]._step *= n;
        } else {
          if (instructions[m[1]]) {
            instructions[m[1]]();
          }
        }
      }

      resolve({ lines, polygons });
    });
  });
}