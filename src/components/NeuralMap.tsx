"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { useLanguage } from '@/context/LanguageContext';

interface Node {
    id: string;
    name: string;
    type: 'file' | 'directory';
    isVulnerable?: boolean;
    val: number;
}

interface Link {
    source: string;
    target: string;
}

interface NeuralMapProps {
    files: string[];
    vulnerableFiles: string[];
    width?: number;
    height?: number;
}

export const NeuralMap: React.FC<NeuralMapProps> = ({ files, vulnerableFiles, width = 800, height = 600 }) => {
    const { t } = useLanguage();
    const fgRef = useRef<ForceGraphMethods>(null);

    const graphData = useMemo(() => {
        const nodes: Node[] = [{ id: 'root', name: '/', type: 'directory', val: 10 }];
        const links: Link[] = [];
        const nodeSet = new Set(['root']);

        // Build folder structure
        files.forEach(path => {
            const parts = path.split('/');
            let currentPath = 'root';

            parts.forEach((part, index) => {
                const isLast = index === parts.length - 1;
                const nodePath = index === 0 ? part : parts.slice(0, index + 1).join('/');
                const parentPath = index === 0 ? 'root' : parts.slice(0, index).join('/');

                if (!nodeSet.has(nodePath)) {
                    const isVulnerable = vulnerableFiles.some(vf => vf.includes(nodePath) || nodePath.includes(vf));
                    nodes.push({
                        id: nodePath,
                        name: part,
                        type: isLast ? 'file' : 'directory',
                        isVulnerable: isLast && isVulnerable,
                        val: isLast ? 3 : 5
                    });
                    nodeSet.add(nodePath);
                }

                const linkId = `${parentPath}-${nodePath}`;
                if (!links.some(l => `${l.source}-${l.target}` === linkId)) {
                    links.push({ source: parentPath, target: nodePath });
                }
            });
        });

        return { nodes, links };
    }, [files, vulnerableFiles]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge')?.strength(-100);
            fgRef.current.d3Force('link')?.distance(30);
        }
    }, []);

    return (
        <div className="relative bg-black/40 border border-gray-800 rounded-lg overflow-hidden h-[600px] w-full">
            <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#00f3ff]"></span>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{t("neural_map.node_count")}: {graphData.nodes.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#ff003c]"></span>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{t("neural_map.vulnerable_nodes")}: {graphData.nodes.filter(n => n.isVulnerable).length}</span>
                </div>
            </div>

            <ForceGraph2D
                ref={fgRef as any}
                width={width}
                height={height}
                graphData={graphData}
                backgroundColor="rgba(0,0,0,0)"
                nodeLabel="id"
                nodeColor={(node: any) => node.isVulnerable ? '#ff003c' : (node.type === 'directory' ? '#00f3ff' : '#4ade80')}
                linkColor={() => 'rgba(0, 243, 255, 0.2)'}
                linkWidth={1}
                nodeRelSize={4}
                autoPauseRedraw={false}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px JetBrains Mono, monospace`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    // Node Shape
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.isVulnerable ? '#ff003c' : (node.type === 'directory' ? '#00f3ff' : '#4ade80');
                    ctx.fill();

                    // Glow Effect
                    if (node.isVulnerable) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = `rgba(255, 0, 60, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
                        ctx.lineWidth = 2 / globalScale;
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.val + 1, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = node.type === 'directory' ? 'rgba(0, 243, 255, 0.1)' : 'rgba(74, 222, 128, 0.1)';
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();
                    }

                    // Label
                    if (globalScale > 3) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.fillText(label, node.x, node.y + node.val + 5);
                    }
                }}
            />

            <div className="absolute bottom-4 right-4 z-10 font-mono text-[8px] text-gray-700 pointer-events-none uppercase tracking-[0.4em]">
                Neural Topology Engine v1.0
            </div>
        </div>
    );
};
