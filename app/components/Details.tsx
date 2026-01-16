import React from "react";
import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";

interface Tip {
  type: "good" | "improve";
  tip: string;
  explanation: string;
}

const ScoreBadge = ({ score }: { score: number }) => {
  let bgColor = "bg-red-100";
  let textColor = "text-red-700";
  let showCheck = false;

  if (score > 69) {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
    showCheck = true;
  } else if (score > 39) {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-700";
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
        bgColor,
        textColor
      )}
    >
      {showCheck && (
        <img src="/icons/check.svg" alt="check" className="w-4 h-4" />
      )}
      <span>{score}/100</span>
    </div>
  );
};

const CategoryHeader = ({
  title,
  categoryScore,
}: {
  title: string;
  categoryScore: number;
}) => {
  return (
    <div className="flex items-center gap-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <ScoreBadge score={categoryScore} />
    </div>
  );
};

const CategoryContent = ({ tips }: { tips: Tip[] }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
          >
            <img
              src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
              alt={tip.type}
              className="w-5 h-5 mt-0.5 shrink-0"
            />
            <span className="text-sm font-medium text-gray-700">{tip.tip}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-xl border-l-4",
              tip.type === "good"
                ? "bg-green-50/50 border-green-500 text-green-900"
                : "bg-red-50/50 border-red-500 text-red-900"
            )}
          >
            <p className="text-sm leading-relaxed">{tip.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DetailsProps {
  feedback: Feedback;
}

const Details = ({ feedback }: DetailsProps) => {
  const sections = [
    {
      id: "tone-style",
      title: "Tono y Estilo",
      data: feedback.toneAndStyle,
    },
    {
      id: "content",
      title: "Contenido",
      data: feedback.content,
    },
    {
      id: "structure",
      title: "Estructura",
      data: feedback.structure,
    },
    {
      id: "skills",
      title: "Habilidades",
      data: feedback.skills,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <Accordion allowMultiple className="space-y-4">
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            id={section.id}
            className="border border-gray-200 rounded-2xl bg-white shadow-sm"
          >
            <AccordionHeader itemId={section.id} className="hover:bg-gray-50/50 rounded-t-2xl">
              <CategoryHeader
                title={section.title}
                categoryScore={section.data.score}
              />
            </AccordionHeader>
            <AccordionContent itemId={section.id}>
              <CategoryContent tips={section.data.tips} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Details;
