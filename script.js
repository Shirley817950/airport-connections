Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data=>{
    let visType = "force";
	let airports = data[0];
	let worldMap = data[1];
    const width = 500, height = 300;
    const svg = d3.select(".container")
                  .append("svg")
                  .attr("viewBox", [-width / 2, -height / 2, width, height]);
    const size = d3.scaleLinear()
                   .domain(d3.extent(airports.nodes, d=>d.passengers))
                   .range([3, 10]);
    const force = d3.forceSimulation(airports.nodes)
                    .force("charge", d3.forceManyBody())
                    .force("link", d3.forceLink(airports.links))
                    .force("x", d3.forceX())
                    .force("y", d3.forceY());
    const geometry = topojson.feature(worldMap, worldMap.objects.countries);
    const projection = d3.geoMercator()
                            .fitExtent([[-width / 2, -height / 2], [width / 3, height]], geometry);
    const path = d3.geoPath()
                    .projection(projection);
    const map = svg.selectAll("path")
                    .data(geometry.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("opacity", 0);
    const boundaries = svg.append("path")
                          .datum(topojson.mesh(worldMap, worldMap.objects.countries))
                          .attr("d", path)
                          .attr('fill', 'none')
                          .attr('stroke', 'white')
                          .attr("class", "subunit-boundary")
                          .attr("opacity", 0);
    const lines = svg.selectAll("line")
                     .data(airports.links)
                     .join("line");
    const nodes = svg.selectAll("circle")
                     .data(airports.nodes)
                     .join("circle")
                     .attr("r", d => size(d.passengers))
                     .attr("fill", "blue");
    const drag = d3.drag()
                   .on("start", event => {force.alphaTarget(0.3).restart();
                                          event.subject.fx = event.x;
                                          event.subject.fy = event.y;})
                   .on("drag", event => {event.subject.fx = event.x;
                                         event.subject.fy = event.y;})
                   .on("end", event => {force.alphaTarget(0.0);
                                        event.subject.fx = null;
                                        event.subject.fy = null;});
    nodes.call(drag);
    nodes.append("title")
         .text(d=>d.name);
    force.on("tick", function() {nodes.attr("cx", d => d.x)
                                      .attr("cy", d => d.y);
                                 lines.attr("x1", d => d.source.x)
                                      .attr("y1", d => d.source.y)
                                      .attr("x2", d => d.target.x)
                                      .attr("y2", d => d.target.y);})
    drag.filter(event => visType === "force");
    function switchLayout() {
        if (visType === "map") {
            // stop the simulation
            force.stop();
            // set the positions of links and nodes based on geo-coordinates
            nodes.transition()
                 .duration(1000)
                 .attr("cx", d => d.x = projection([d.longitude, d.latitude])[0])
                 .attr("cy", d => d.y = projection([d.longitude, d.latitude])[1]);
            lines.transition()
                 .duration(1000)
                 .attr("x1", d => d.source.x)
                 .attr("y1", d => d.source.y)
                 .attr("x2", d => d.target.x)
                 .attr("y2", d => d.target.y);
            // set the map opacity to 1
            map.transition()
               .duration(500)
               .attr("opacity", 1);
            boundaries.transition()
                      .duration(500)
                      .attr("opacity", 1);
        } else { 
            // force layout
            // restart the simulation
            force.alpha(0.5)
                 .restart();
            // set the map opacity to 0
            map.transition()
               .duration(500)
               .attr("opacity", 0);
            boundaries.transition()
                      .duration(500)
                      .attr("opacity", 0);
        }
      }
    d3.selectAll("input")
      .on("change", event => {visType = event.target.value;// selected button
                              switchLayout();});
});
