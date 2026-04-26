"use client";

import { Star } from "lucide-react";

const SECTORS = [
  "Programming",
  "Web Tech",
  "Data & AI",
  "Cloud & DevOps",
  "Design & Product",
  "Soft Skills",
  "Specialized"
];

const DOMAIN_SVG_COLORS = {
  "Programming": "#2563EB",
  "Web Tech": "#0891B2",
  "Data & AI": "#9333EA",
  "Cloud & DevOps": "#EA580C",
  "Design & Product": "#DB2777",
  "Soft Skills": "#059669",
  "Specialized": "#D97706",
};

export default function RadarChart({ skills, size = 200, showLabels = true }) {
  const center = size / 2;
  const radius = center * 0.65;
  const labelRadius = center * 0.88;

  const parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;
  const validSkills = (parsedSkills || []).filter(s => s.skill && s.rating > 0);

  const findDomain = (skillObj) => {
    if (skillObj.domain) return skillObj.domain;
    // Default mapping could be here but for shared component we might need a better way
    return "Specialized"; 
  };

  const getCoords = (value, angle) => {
    const r = (value / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const getLabelCoords = (index) => {
    const angle = (Math.PI * 2 * index) / SECTORS.length - Math.PI / 2;
    return { x: center + labelRadius * Math.cos(angle), y: center + labelRadius * Math.sin(angle) };
  };

  const webLines = [1, 2, 3, 4, 5].map(level =>
    SECTORS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
      const p = getCoords(level, angle);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  const fontSize = Math.max(7, size * 0.035);
  const sweep = (Math.PI * 2) / SECTORS.length;

  return (
    <svg width={size} height={size} className="overflow-visible">
      {webLines.map((points, i) => (
        <polygon key={i} points={points} fill={i === 4 ? "rgba(241,245,249,0.3)" : "none"} stroke="#E2E8F0" strokeWidth={i === 4 ? "1.5" : "0.5"} />
      ))}
      
      {SECTORS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
        const p = getCoords(5, angle);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />;
      })}

      {SECTORS.map((sector, i) => {
        const domainSkills = validSkills.filter(s => findDomain(s) === sector);
        if (domainSkills.length === 0) return null;

        const theta_i = (Math.PI * 2 * i) / SECTORS.length - Math.PI / 2;
        const M = domainSkills.length;
        const spread = sweep * 0.65;
        const color = DOMAIN_SVG_COLORS[sector] || "#2563EB";

        return domainSkills.map((s, j) => {
          let angle = theta_i;
          if (M > 1) {
            const offset = -spread / 2 + (j * spread) / (M - 1);
            angle = theta_i + offset;
          }
          const pVal = getCoords(s.rating, angle);
          return (
            <g key={`${sector}-${j}`}>
              <line x1={center} y1={center} x2={pVal.x} y2={pVal.y} stroke={color} strokeWidth={Math.max(2, size * 0.012)} strokeLinecap="round" opacity={0.85} />
              <circle cx={pVal.x} cy={pVal.y} r={Math.max(2.5, size * 0.015)} fill={color} stroke="#fff" strokeWidth="1.5" />
              {size > 300 && (
                <text 
                  x={pVal.x + (Math.cos(angle) * 8)} y={pVal.y + (Math.sin(angle) * 8)} 
                  fontSize="9" fontWeight="800" fill={color}
                  textAnchor={Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle"}
                  dominantBaseline={Math.sin(angle) > 0.1 ? "hanging" : Math.sin(angle) < -0.1 ? "baseline" : "middle"}
                  opacity={0.9}
                >
                  {s.skill}
                </text>
              )}
            </g>
          );
        });
      })}

      {showLabels && SECTORS.map((label, i) => {
        const pLabel = getLabelCoords(i);
        const hasSkills = validSkills.some(s => findDomain(s) === label);
        const color = DOMAIN_SVG_COLORS[label] || "#CBD5E1";
        return (
          <text 
            key={i} x={pLabel.x} y={pLabel.y} fontSize={fontSize} fontWeight="900" 
            fill={hasSkills ? color : "#CBD5E1"} textAnchor="middle" dominantBaseline="middle" className="uppercase tracking-wider"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
