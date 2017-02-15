var app = angular.module('graphexplorer');



app.service('graphVizService', function ($window) {
	
		console.log(" graphViz Service starting : ");
		var vm=this;
      var width = 800,
         height = 600;
		var svgRelationships,svgNodes,simulation,relationshipText,relationshipLine;
      var nodes=[];
      var links=[];
		var node,relationship;
      var options= {
               nodeRadius: 20,
               arrowSize: 4
            };

		vm.link=null;
		vm.text=null;
		vm.d3 = $window.d3;
		var graphconf={node:{}, link:{}};
		
		vm.test= function(msg){
			console.log(" Message : "+msg);
		}
		var setup = function() {


         // create a copy of the graph 
         // need as D3 will change nodes and links with a lot of information.
         
    /*
var graph ={nodes:[], links:[]};
   vm.graph.nodes.forEach(function(n) {
   	  var nn={};
   	    for (var attr in n) {
            if (n.hasOwnProperty(attr)) nn[attr] = n[attr];
        }
      graph.nodes.push(nn);
   });
   vm.graph.links.forEach(function(l) {
   	   	  var nl={}; // new link
   	    for (var attr in l) {
            if (l.hasOwnProperty(attr)) nl[attr] = l[attr];
        }
      graph.links.push(nl);
   });
   */

   vm.link = vm.svg.append("g")
   .attr("class", "links")
   .selectAll(".line")
   .data(graph.links)
   .enter().append("line")
   .attr("class","line")
   .attr("stroke-dasharray",function(d){
   	if (d["relType"] != undefined) {

   		return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
   	} else {
   		return (graphconf.default.linkstrokedash)
   	}


   } )
   .attr("stroke-width",function(d){
   	if (d["relType"] != undefined) {

   		return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
   	} else {
   		return (graphconf.default.strokewidth)
   	}


   } )
   ;

   node = vm.svg.append("g")
   .attr("class", "nodes")
   .selectAll("circle")
   .data(graph.nodes)
   .enter().append("circle")
   .attr("r", function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
   	} else {
   		return (graphconf.default.r)
   	}

   } )
   .attr("fill",function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].fill || graphconf.default.fill : graphconf.default.fill)
   	} else {
   		return (graphconf.default.fill)
   	}

   } )
   .attr("stroke",function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].stroke || graphconf.default.stroke : graphconf.default.stroke)
   	} else {
   		return (graphconf.default.stroke)
   	}

   } )
   .call(d3.drag()
   	.on("start", dragstarted)
   	.on("drag", dragged)
   	.on("end", dragended));
   vm.node.on("dblclick",function(d){
   	var type=d["@name"];
   	console.log("more on ", d[graphconf.node[type].keyname]);
   	getNode(type,d[graphconf.node[type].keyname]);
   });
   vm.text = vm.svg.append("g")
   .attr("class", "labels")
   .selectAll("g")
   .data(graph.nodes)
   .enter().append("g").append("text")
   .attr("dx", 12)
   .attr("dy", "1em")
	.text(function(d) { // return the value of the property name specified by label or "?"
		if (d["@name"] != undefined) {
			if (graphconf.node[d["@name"]]!=undefined) {
				return (graphconf.node[d["@name"]].label ?  d[graphconf.node[d["@name"]].label] || "?" : "?")
			} else {
				return ("?")
			}
			
		} else {
			return ("?")
		} })
	.style("text-anchor", "end");




/*
   node.append("text")
      .attr("dx", 12)
      .attr("dy", "1em")
      .text(function(d) { return d.memberName }).style("text-anchor", "end")
      .style("font-size", 12);

      */
      vm.node.append("title")
      .text(function(d) { return ""+d.yearBorn+" ... "+d.yearDied; });
 // Now we create a force layout object and define its properties.
// Those include the dimensions of the visualization and the arrays
// of nodes and links.


}
   function merge(target, source) {
        Object.keys(source).forEach(function(property) {
            target[property] = source[property];
        });
    }
   function initSimulation() {
        var simulation = d3.forceSimulation()
//                           .velocityDecay(0.8)
//                           .force('x', d3.force().strength(0.002))
//                           .force('y', d3.force().strength(0.002))
                           .force('collide', d3.forceCollide().radius(function(d) {
                               return 40;
                           }).iterations(2))
                           .force('charge', d3.forceManyBody())
                           .force('link', d3.forceLink().id(function(d) {
                               return d.id;
                           }))
                           .force('center', d3.forceCenter(width / 2, height / 2))
                           .on('tick', function() {
                               ticked();
                           })
                           .on('end', function() {
                              // if (options.zoomFit && !justLoaded) {
                              //     justLoaded = true;
                              //     zoomFit(2);
                              // }
                           });

        return simulation;
    }
    // init the selector and copy conf
    // init svgRelationships and svgNodes
vm.init = function (selector,_graphconf) {
    graphconf=_graphconf;
    container = d3.select(selector);

    container.attr('class', 'neo4jd3')
                 .html('');
    svg = container.append('svg')
                       .attr('width', width)
                       .attr('height', height)
                       .attr('class', 'neo4jd3-graph')
                       .append('g')
                       .attr('width', '100%')
                       .attr('height', '100%');
    
    

         if (vm.node!=null) {vm.node.remove();}
         if (vm.link!=null) {vm.link.remove();}
         if (vm.text!=null) {vm.text.remove();}
         //vm.svg.selectAll("*").remove();
   svgRelationships = svg.append('g')
                              .attr('class', 'relationships');

   svgNodes = svg.append('g')
                      .attr('class', 'nodes');
   
    simulation = initSimulation();
   }
   function toString(d) {
      return ""+d.yearBorn+" ... "+d.yearDied; 
   }
   function updateNodes(n) {
        Array.prototype.push.apply(nodes, n);

        var svgNodeData = svgNodes.selectAll('.node')
                       .data(nodes, function(d) { return d.id; });

       node = svgNodeData.enter()
                   .append('g')
                   .attr('class', 'node')
                    .on("dblclick",function(d){
                        var type=d["@name"];
                        console.log("more on ", d[graphconf.node[type].keyname]);
                        getNode(type,d[graphconf.node[type].keyname],false);
                     })
                   .on('click', function(d) {})
                   .on('mouseenter', function(d) {})
                   .on('mouseleave', function(d) {})
                   .call(d3.drag()
                     .on("start", dragstarted)
                     .on("drag", dragged)
                     .on("end", dragended));


       node.append('circle')
                   .attr('class', 'ring')
                   .attr('r', function(d){
                     var cr=0;
                     if (d["@name"] != undefined) {

                        cr= (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        cr= (graphconf.default.r)
                     }
                        return 1.16*cr;
                     })
                   .append('title').text(function(d) {
                       return toString(d);
                   });
      node.append('circle')
                   .attr('class', 'outline')
                   .attr('r', function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        return (graphconf.default.r)
                     }

                     })
                  .style("fill",function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].fill || graphconf.default.fill : graphconf.default.fill)
                     } else {
                        return (graphconf.default.fill)
                     }

                  } )
                  .style("stroke",function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].stroke || graphconf.default.stroke : graphconf.default.stroke)
                     } else {
                        return (graphconf.default.stroke)
                     }

                  } )
                   .append('title').text(function(d) {
                       return toString(d);
                   });
        node.append("text")
        .attr('class', 'text') 
        .attr("dx", 0)
        .attr("dy", function(d){
                     var cr=0;
                     if (d["@name"] != undefined) {

                        cr= (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        cr= (graphconf.default.r)
                     }
                        return cr+10;  // add size of font to radius to position text
                     }
               )
         .text(function(d) { // return the value of the property name specified by label or "?"
            if (d["@name"] != undefined) {
               if (graphconf.node[d["@name"]]!=undefined) {
                  return (graphconf.node[d["@name"]].label ?  d[graphconf.node[d["@name"]].label] || "?" : "?")
               } else {
                  return ("?")
               }
               
            } else {
               return ("?")
            } })
         .style("text-anchor", "middle")
         .style("font-size", "10px")
              

         node = node.merge(svgNodeData);
         }

            
    function updateRelationships(r) {

      Array.prototype.push.apply(links, r);

      svgRelationshipsData = svgRelationships.selectAll('.relationship')
                                       .data(links, function(d) { return d.id; });
      relationship = svgRelationshipsData.enter()
                           .append('g')
                           .attr('class', 'relationship');

     // add patch 
    var text=relationship.append('text')
                .attr('class', 'text')
                .attr('fill', '#000000')
                .attr('font-size', '8px')
                .attr('pointer-events', 'none')
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return d.type;
                })
   var line=relationship.append('line')
                .attr('class', 'line')
                .attr("stroke-dasharray",function(d){
                     if (d["relType"] != undefined) {

                        return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
                     } else {
                        return (graphconf.default.linkstrokedash)
                     }


                  } )
               .attr("stroke-width",function(d){
                  if (d["relType"] != undefined) {

                     return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
                  } else {
                     return (graphconf.default.strokewidth)
                  }
               });

   var outline=relationship.append('path')
                .attr('class', 'outline')
                .attr('fill', '#a5abb6')
                .attr('stroke', 'none');
   var overlay=relationship.append('path')
                .attr('class', 'overlay');

   relationship = relationship.merge(svgRelationshipsData);
        relationshipLine = svg.selectAll('.relationship .line');
        relationshipLine = line.merge(relationshipLine);
        
        relationshipOutline = svg.selectAll('.relationship .outline');
        relationshipOutline = outline.merge(relationshipOutline);

        relationshipOverlay = svg.selectAll('.relationship .overlay');
        relationshipOverlay = overlay.merge(relationshipOverlay);

        relationshipText = svg.selectAll('.relationship .text');
        relationshipText = text.merge(relationshipText);
   }
   /*
   .attr("stroke-dasharray",function(d){
      if (d["relType"] != undefined) {

         return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
      } else {
         return (graphconf.default.linkstrokedash)
      }


   } )
   .attr("stroke-width",function(d){
      if (d["relType"] != undefined) {

         return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
      } else {
         return (graphconf.default.strokewidth)
      }


   } )
   */
   

vm.drawGraph = function (graph) {
   //vm.graph=graph;
   
   //var rawSvg = $element.find("svg")[0];
   
	console.log("Draw graph") 
	//setup(); 
        updateRelationships(graph.links);
        updateNodes(graph.nodes);

        simulation.nodes(nodes);
        simulation.force('link').links(links); 
	
}
    function rotate(cx, cy, x, y, angle) {
        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

        return { x: nx, y: ny };
    }
    function rotation(source, target) {
        return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
    }
   function rotatePoint(c, p, angle) {
        return rotate(c.x, c.y, p.x, p.y, angle);
    }
    function unitaryNormalVector(source, target, newLength) {
        var center = { x: 0, y: 0 },
            vector = unitaryVector(source, target, newLength);

        return rotatePoint(center, vector, 90);
    }

    function unitaryVector(source, target, newLength) {
        var length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) / Math.sqrt(newLength || 1);

        return {
            x: (target.x - source.x) / length,
            y: (target.y - source.y) / length,
        };
    }
function zoomed() {
	svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
}
function ticked() {
	console.log("Ticked ")
	        if (node) {
            node.attr('transform', function(d) {
                return 'translate(' + d.x + ', ' + d.y + ')';
            });
        }
	        if (relationship) {
          //  relationship.attr('transform', function(d) {
          //      var angle = rotation(d.source, d.target);
          //      return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
          //  });
         }
         relationshipLine.attr("x1", function(d) { 
                              console.log("d "+d.source.x); 
                              return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });
   
         relationshipText.attr('transform', function(d) {
                var angle = rotation(d.source, d.target);
                return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
            })
          .attr('transform', function(d) {
            var angle = (rotation(d.source, d.target) + 360) % 360,
                mirror = angle > 90 && angle < 270,
                center = { x: 0, y: 0 },
                n = unitaryNormalVector(d.source, d.target),
                nWeight = mirror ? 2 : -3,
                point = { x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight, y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight },
                rotatedPoint = rotatePoint(center, point, angle);

            return 'translate(' + rotatedPoint.x + ', ' + rotatedPoint.y + ') rotate(' + (mirror ? 180 : 0) + ')';
        });

	   // tickRelationshipsOutlines();
//	vm.text.attr("transform", function(d) { 
//		return "translate(" + d.x + "," + d.y + ")"; })
}
function tickRelationshipsOutlines() {
        relationship.each(function(relationship) {
            var rel = d3.select(this),
                outline = rel.select('.outline'),
                text = rel.select('.text'),
                bbox = text.node().getBBox(),
                padding = 3;

            outline.attr('d', function(d) {
                var center = { x: 0, y: 0 },
                    angle = rotation(d.source, d.target),
                    textBoundingBox = text.node().getBBox(),
                    textPadding = 5,
                    u = unitaryVector(d.source, d.target),
                    textMargin = { x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5, y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5 },
                    n = unitaryNormalVector(d.source, d.target),
                    rotatedPointA1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x - n.x, y: 0 + (options.nodeRadius + 1) * u.y - n.y }, angle),
                    rotatedPointB1 = rotatePoint(center, { x: textMargin.x - n.x, y: textMargin.y - n.y }, angle),
                    rotatedPointC1 = rotatePoint(center, { x: textMargin.x, y: textMargin.y }, angle),
                    rotatedPointD1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x, y: 0 + (options.nodeRadius + 1) * u.y }, angle),
                    rotatedPointA2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x - n.x, y: d.target.y - d.source.y - textMargin.y - n.y }, angle),
                    rotatedPointB2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y - u.y * options.arrowSize }, angle),
                    rotatedPointC2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x + (n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y + (n.y - u.y) * options.arrowSize }, angle),
                    rotatedPointD2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y }, angle),
                    rotatedPointE2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x + (- n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y + (- n.y - u.y) * options.arrowSize }, angle),
                    rotatedPointF2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize }, angle),
                    rotatedPointG2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x, y: d.target.y - d.source.y - textMargin.y }, angle);

                return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                       ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                       ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                       ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                       ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                       ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                       ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +
                       ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +
                       ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +
                       ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                       ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                       ' Z';
            });
        });
    }

function nodeClicked(a,b) {
	console.log(" Node clicked "+b);
}
function dragstarted(d) {
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
		// keep d.fx and d.fy to stick the node else set back to null 
		//
		//d.fx = null;
		//d.fy = null;
	} 
		/*
		*/
		//setup();

}
   
     );