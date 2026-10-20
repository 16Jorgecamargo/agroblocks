import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { GameButton } from "@/components/game/GameButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { itemsForForm } from "@/data/assessment/items";
import { MISSIONS } from "@/data/missions";
import { MiniGrid } from "@/features/assessment/MiniGrid";
import { percent, scoreResponse } from "@/game/assessment/scoring";
import {
  ASSESSMENT_CONCEPT_LABELS,
  ASSESSMENT_CONCEPTS,
} from "@/game/assessment/types";
import { continueMissionId } from "@/game/progress/progression";
import type { AssessmentForm, AssessmentResponse } from "@/game/progress/types";
import { BADGE_POP, pageVariants } from "@/motion/presets";
import { useProgressStore } from "@/stores/progressStore";
import "./AssessmentPage.css";

const FORM_BY_SLUG: Record<string, AssessmentForm> = {
  pre: "pre",
  pos: "post",
};
const FINAL_MISSION = "m6-efficient-farm";

function Comparison({
  pre,
  post,
}: {
  pre: AssessmentResponse | null;
  post: AssessmentResponse;
}) {
  const preScores = pre ? scoreResponse(pre) : null;
  const postScores = scoreResponse(post);
  return (
    <table className="assessment__table">
      <caption>Acertos por conceito</caption>
      <thead>
        <tr>
          <th scope="col">Conceito</th>
          <th scope="col">Pré-teste</th>
          <th scope="col">Pós-teste</th>
        </tr>
      </thead>
      <tbody>
        {ASSESSMENT_CONCEPTS.map((concept) => (
          <tr key={concept}>
            <th scope="row">{ASSESSMENT_CONCEPT_LABELS[concept]}</th>
            <td>{preScores ? `${percent(preScores[concept])}%` : "—"}</td>
            <td>{postScores ? `${percent(postScores[concept])}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AssessmentPage() {
  const { form: slug = "" } = useParams();
  const form = FORM_BY_SLUG[slug];
  const save = useProgressStore((store) => store.save);
  const storeAssessment = useProgressStore((store) => store.storeAssessment);
  const [stage, setStage] = useState<"intro" | "questions" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState("");

  if (!form) return <Navigate to="/" replace />;

  const items = itemsForForm(form);
  const title = form === "pre" ? "Avaliação inicial" : "Avaliação final";
  const existing = save.assessments[form];
  const postLocked =
    form === "post" && save.missions[FINAL_MISSION]?.status !== "completed";

  const finish = (skipped: boolean) => {
    const now = new Date().toISOString();
    storeAssessment({
      form,
      startedAt: startedAt || now,
      completedAt: now,
      skipped,
      answers: skipped ? {} : answers,
    });
    setStage("done");
  };

  const body = () => {
    if (stage === "done" || (existing && stage === "intro")) {
      const response = save.assessments[form];
      const nextId = continueMissionId(save, MISSIONS) ?? "m0-training";
      const next =
        form === "pre"
          ? {
              to: `/jogar/${nextId}`,
              label: save.missions["m0-training"]?.status === "completed" ? "Continuar jogando" : "Começar o treinamento",
            }
          : { to: "/missoes", label: "Ir para as missões" };
      return (
        <section className="card assessment__card">
          <h2>Obrigado!</h2>
          {response?.skipped ? (
            <p>A avaliação inicial foi pulada. Você pode jogar normalmente.</p>
          ) : (
            <p>Suas respostas foram salvas e enviadas ao seu professor.</p>
          )}
          {form === "post" && response && (
            <Comparison pre={save.assessments.pre} post={response} />
          )}
          <Link to={next.to} className="button button--primary">
            {next.label}
          </Link>
        </section>
      );
    }
    if (postLocked) {
      return (
        <section className="card assessment__card">
          <h2>Ainda não disponível</h2>
          <p>
            Conclua a Fase 6 (Fazenda eficiente) para liberar a avaliação final.
          </p>
          <Link to="/missoes" className="button">
            Ver missões
          </Link>
        </section>
      );
    }
    if (stage === "intro") {
      return (
        <section className="card assessment__card">
          <h2>{title}</h2>
          <p>
            São 10 questões curtas sobre sequência, repetição, condições, erros
            e leitura de algoritmos.
          </p>
          <ul>
            {form === "pre" ? (
              <li>
                Você faz esta prova antes de jogar. É normal não saber várias
                respostas: marque a que achar mais certa.
              </li>
            ) : (
              <li>
                Você faz esta prova depois de concluir todas as fases, para ver
                o quanto aprendeu.
              </li>
            )}
            <li>Não vale nota e não há tempo limite.</li>
            <li>Você não verá se acertou durante a avaliação.</li>
            <li>Suas respostas vão para o seu professor, junto com o seu nome.</li>
          </ul>
          <div className="assessment__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setStartedAt(new Date().toISOString());
                setStage("questions");
              }}
            >
              Começar
            </button>
          </div>
        </section>
      );
    }
    const item = items[index];
    const selected = answers[item.id];
    const last = index === items.length - 1;
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={item.id}
          className="card assessment__card"
          aria-labelledby="question-prompt"
          variants={pageVariants.push}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <p className="assessment__counter">
            Questão {index + 1} de {items.length}
          </p>
          <progress max={items.length} value={index} aria-hidden="true" />
          <h2 id="question-prompt" className="assessment__prompt">
            {item.prompt}
          </h2>
          {item.grid && <MiniGrid grid={item.grid} />}
          {item.code && <pre className="assessment__code">{item.code}</pre>}
          <fieldset className="assessment__options">
            <legend className="visually-hidden">Alternativas</legend>
            {item.options.map((option, optionIndex) => (
              <motion.label
                key={option}
                className={`assessment__option${selected === optionIndex ? " is-selected" : ""}`}
                animate={
                  selected === optionIndex ? BADGE_POP.keyframes : { scale: 1 }
                }
                transition={BADGE_POP.options}
              >
                <input
                  type="radio"
                  name={item.id}
                  checked={selected === optionIndex}
                  onChange={() =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: optionIndex,
                    }))
                  }
                />
                {option}
              </motion.label>
            ))}
          </fieldset>
          <div className="assessment__actions">
            <GameButton
              tone="secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Anterior
            </GameButton>
            <GameButton
              tone="primary"
              disabled={selected === undefined}
              onClick={() => (last ? finish(false) : setIndex(index + 1))}
            >
              {last ? "Concluir" : "Próxima"}
            </GameButton>
          </div>
        </motion.section>
      </AnimatePresence>
    );
  };

  return (
    <div className="chrome-page">
      <PageHeader
        title={title}
        subtitle="Instrumento diagnóstico do projeto AgroBlocks."
        backTo="/"
      />
      <main className="assessment">{body()}</main>
    </div>
  );
}
