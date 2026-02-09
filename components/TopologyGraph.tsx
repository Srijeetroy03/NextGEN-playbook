import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../types';
import { Maximize2, Minimize2, Server, Shield, Router, Network, Monitor, Activity, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TopologyGraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width: number;
  height: number;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

const TopologyGraph: React.FC<TopologyGraphProps> = ({ nodes, links, width, height, isMaximized, onToggleMaximize }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{ x: number, y: number, data: NetworkNode } | null>(null);
  
  // Persist zoom state across renders so simulation updates don't reset view
  const zoomTransform = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // 1. Setup Zoom Wrapper
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            zoomTransform.current = event.transform;
        });

    zoomBehavior.current = zoom;
    svg.call(zoom);
    // Apply saved transform to maintain view state
    svg.call(zoom.transform, zoomTransform.current);

    // 2. Define Filters and Animations
    const defs = svg.append("defs");
    
    // Glow Filter
    const filter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // CSS Styles for Animation
    svg.append("style").text(`
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; stroke-width: 2px; }
            100% { transform: scale(2.5); opacity: 0; stroke-width: 0px; }
        }
        .pulse-circle {
            transform-origin: center;
            transform-box: fill-box;
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
    `);

    // 3. Simulation Setup
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // 4. Draw Links (append to g)
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);

    // 5. Draw Nodes Wrapper (append to g)
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("mouseenter", (event, d) => {
        // Pointer relative to SVG container for tooltip positioning
        const [x, y] = d3.pointer(event, svgRef.current);
        setHoveredNode({ x, y, data: d });
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
      });

    // Critical Status: Animated Pulse Ring
    node.filter((d: NetworkNode) => d.status === 'critical')
      .append("circle")
      .attr("class", "pulse-circle")
      .attr("r", (d: NetworkNode) => d.type === 'router' || d.type === 'server' ? 12 : 8)
      .attr("fill", "none")
      .attr("stroke", "#ef4444");

    // Warning Status: Static Dashed Ring
    node.filter((d: NetworkNode) => d.status === 'warning')
      .append("circle")
      .attr("r", (d: NetworkNode) => (d.type === 'router' || d.type === 'server' ? 12 : 8) + 6)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3, 2")
      .attr("opacity", 0.8);

    // Main Node Circle
    node.append("circle")
      .attr("r", (d: NetworkNode) => d.type === 'router' || d.type === 'server' ? 12 : 8)
      .attr("fill", (d: NetworkNode) => {
        if (d.status === 'critical') return '#ef4444';
        if (d.status === 'warning') return '#f59e0b';
        return '#22c55e'; // Green for Healthy (was #06b6d4 cyan)
      })
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .style("filter", (d: NetworkNode) => d.status !== 'healthy' ? "url(#glow)" : null);

    // Node Labels
    node.append("text")
      .text((d: NetworkNode) => d.name)
      .attr("x", 18)
      .attr("y", 4)
      .attr("font-family", "monospace")
      .attr("font-size", "10px")
      .attr("fill", (d: NetworkNode) => {
        if (d.status === 'critical') return '#fca5a5';
        if (d.status === 'warning') return '#fcd34d';
        return '#94a3b8';
      })
      .style("text-shadow", "0px 1px 2px #000");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height]);

  const handleZoomIn = () => {
      if (svgRef.current && zoomBehavior.current) {
          d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 1.2);
      }
  };

  const handleZoomOut = () => {
      if (svgRef.current && zoomBehavior.current) {
          d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 0.8);
      }
  };

  const handleResetZoom = () => {
      if (svgRef.current && zoomBehavior.current) {
          d3.select(svgRef.current).transition().duration(750).call(zoomBehavior.current.transform, d3.zoomIdentity);
      }
  };

  const getNodeIcon = (type: string) => {
     switch(type) {
         case 'server': return <Server size={14} className="text-blue-400" />;
         case 'firewall': return <Shield size={14} className="text-red-400" />;
         case 'router': return <Router size={14} className="text-purple-400" />;
         case 'switch': return <Network size={14} className="text-green-400" />; 
         case 'endpoint': return <Monitor size={14} className="text-cyan-400" />;
         default: return <Activity size={14} className="text-gray-400" />;
     }
  };

  return (
    <div className="bg-cyber-900 border border-cyber-700 rounded-lg overflow-hidden relative shadow-2xl h-full w-full group">
        <div className="absolute top-4 left-4 z-10 bg-cyber-900/80 p-2 rounded border border-cyber-700 backdrop-blur-sm flex items-center gap-3">
            <div>
                <h3 className="text-xs font-bold text-cyber-cyan uppercase tracking-wider">Live Topology</h3>
                <p className="text-[10px] text-gray-400">Force-Directed Graph</p>
            </div>
            <div className="w-px h-6 bg-cyber-700 mx-1"></div>
            <button 
                onClick={onToggleMaximize}
                className="p-1 hover:bg-cyber-700 rounded text-gray-400 hover:text-white transition-colors"
                title={isMaximized ? "Minimize View" : "Maximize View"}
            >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-cyber-900/80 p-1.5 rounded border border-cyber-700 backdrop-blur-sm">
             <button onClick={handleZoomIn} className="p-1.5 hover:bg-cyber-700 rounded text-gray-400 hover:text-white transition-colors" title="Zoom In">
                 <ZoomIn size={16} />
             </button>
             <button onClick={handleZoomOut} className="p-1.5 hover:bg-cyber-700 rounded text-gray-400 hover:text-white transition-colors" title="Zoom Out">
                 <ZoomOut size={16} />
             </button>
             <button onClick={handleResetZoom} className="p-1.5 hover:bg-cyber-700 rounded text-gray-400 hover:text-white transition-colors" title="Reset View">
                 <RotateCcw size={16} />
             </button>
        </div>
        
        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-cyber-900/80 p-2 rounded border border-cyber-700 backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Healthy</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500 border border-amber-500"></div>
                    <span>Warning</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span>Critical</span>
                </div>
            </div>
        </div>
        
        {/* Helper Hint */}
         <div className="absolute bottom-4 right-4 z-0 text-[10px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            SCROLL TO ZOOM • DRAG TO PAN
        </div>

      <svg ref={svgRef} width={width} height={height} className="block w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Tooltip */}
      {hoveredNode && (
          <div 
            className="absolute z-50 bg-cyber-900/95 border border-cyber-700 p-3 rounded-lg shadow-[0_0_15px_-3px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[200px] pointer-events-none transform transition-opacity duration-200 fade-in"
            style={{ 
                left: Math.min(hoveredNode.x + 15, width - 220), 
                top: Math.min(hoveredNode.y + 15, height - 150)
            }}
          >
             <div className="flex items-center gap-2 mb-2 border-b border-cyber-700 pb-2">
                {getNodeIcon(hoveredNode.data.type)}
                <span className="font-bold text-sm text-white">{hoveredNode.data.name}</span>
             </div>
             <div className="space-y-1.5 text-xs font-mono">
                 <div className="flex justify-between">
                     <span className="text-gray-500">TYPE:</span>
                     <span className="text-gray-300 uppercase">{hoveredNode.data.type}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">IP ADDR:</span>
                     <span className="text-cyan-400">{hoveredNode.data.ip}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-gray-500">STATUS:</span>
                     <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                         hoveredNode.data.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                         hoveredNode.data.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                         'bg-red-500/20 text-red-400'
                     }`}>
                         {hoveredNode.data.status}
                     </span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">GROUP ID:</span>
                     <span className="text-gray-300">#{hoveredNode.data.group}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">NODE ID:</span>
                     <span className="text-gray-600 truncate max-w-[80px]">{hoveredNode.data.id.split('-')[0]}...</span>
                 </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default TopologyGraph;