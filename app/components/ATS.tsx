import React from 'react';

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  let bgColorClass = "";
  let iconPath = "";

  if (score > 69) {
    bgColorClass = "from-green-100";
    iconPath = "/icons/ats-good.svg";
  } else if (score > 49) {
    bgColorClass = "from-yellow-100";
    iconPath = "/icons/ats-warning.svg";
  } else {
    bgColorClass = "from-red-100";
    iconPath = "/icons/ats-bad.svg";
  }

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${bgColorClass} to-white shadow-sm border border-gray-100`}>
      <div className="flex items-center gap-4 mb-6">
        <img src={iconPath} alt="Estatus ATS (Applicant Tracking System / Sistema de Seguimiento del Solicitante)" className="w-12 h-12" />
        <h2 className="text-xl font-bold">
          Puntuación <span className="underline decoration-dotted cursor-help" title="Applicant Tracker System / Sistema de Seguimiento de Solicitantes">ATS</span> - {score}/100
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Análisis de <span className="underline decoration-dotted cursor-help" title="Applicant Tracker System / Sistema de Seguimiento de Solicitantes">ATS</span></h3>
          <p className="text-gray-500 text-sm">
            El <span className="underline decoration-dotted cursor-help" title="Applicant Tracker System / Sistema de Seguimiento de Solicitantes">ATS</span> es utilizado por las empresas para filtrar CV automáticamente. Optimizar tu CV para estos sistemas aumenta tus posibilidades de ser visto por un reclutador.
          </p>
        </div>

        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-3">
              <img
                src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt={suggestion.type}
                className="w-5 h-5 mt-0.5"
              />
              <span className="text-gray-700 text-sm">{suggestion.tip}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm font-medium pt-2 italic text-gray-600">
          Sigue estas recomendaciones para mejorar la compatibilidad de tu CV con los sistemas <span className="underline decoration-dotted cursor-help" title="Applicant Tracker System / Sistema de Seguimiento de Solicitantes">ATS</span>.
        </p>
      </div>
    </div>
  );
};

export default ATS;