import React from 'react';

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  let badgeStyles = "";
  let textStyles = "";
  let label = "";

  if (score > 70) {
    badgeStyles = "bg-badge-green";
    textStyles = "text-badge-green-text";
    label = "Fuerte";
  } else if (score > 49) {
    badgeStyles = "bg-badge-yellow";
    textStyles = "text-badge-yellow-text";
    label = "Buen Inicio";
  } else {
    badgeStyles = "bg-badge-red";
    textStyles = "text-badge-red-text";
    label = "Necesita trabajo";
  }

  return (
    <div className={`score-badge ${badgeStyles}`}>
      <p className={`text-sm font-medium ${textStyles}`}>{label}</p>
    </div>
  );
}
