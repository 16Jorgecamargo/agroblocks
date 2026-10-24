import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { GameButton } from "@/components/game/GameButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { itemsFor } from "@/data/assessment/items";
import { MISSIONS } from "@/data/missions";
import { getWorld, missionsOfWorld, WORLDS } from "@/data/worlds";
import { MiniGrid } from "@/features/assessment/MiniGrid";
import { percent, scoreBySkill, scoreResponse } from "@/game/assessment/scoring";
import { ASSESSMENT_SKILLS, ITEMS_PER_FORM, SKILL_LABELS, type AssessmentItem } from "@/game/assessment/types";
import { isWorldOpen, worldStep } from "@/game/progress/progression";
import type { AssessmentForm, AssessmentResponse } from "@/game/progress/types";
import { MISSIONS_PER_WORLD, WORLD_IDS, type WorldId } from "@/game/worlds/worldTypes";
import { BADGE_POP, pageVariants } from "@/motion/presets";
import { useProgressStore } from "@/stores/progressStore";
import "./AssessmentPage.css";

const FORM_BY_SLUG: Record<string, AssessmentForm> = {
  pre: "pre",
  pos: "post",
};

const REFS = MISSIONS.map(({ id, order, world }) => ({ id, order, world }));

function isWorldId(value: string): value is WorldId {
  return (WORLD_IDS as readonly string[]).includes(value);
}

function Comparison({
  worldName,
  pre,
  post,
}: {
  worldName: string;
  pre: AssessmentResponse | null;
  post: AssessmentResponse;
}) {
  const preScores = pre ? scoreBySkill(pre) : null;
  const postScores = scoreBySkill(post);
  return (
    <table className="assessment__table">
      <caption>Acertos por habilidade · {worldName}</caption>
      <thead>
        <tr>
          <th scope="col">Habilidade</th>
          <th scope="col">Prova inicial</th>
          <th scope="col">Prova final</th>
        </tr>
      </thead>
      <tbody>
        {ASSESSMENT_SKILLS.map((skill) => (
          <tr key={skill}>
            <th scope="row">{SKILL_LABELS[skill]}</th>
            <td>{preScores ? `${percent(preScores[skill])}%` : "—"}</td>
            <td>{postScores ? `${percent(postScores[skill])}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Feedback({ items, response }: { items: AssessmentItem[]; response: AssessmentResponse }) {
  const score = scoreResponse(response);
  return (
    <section className="assessment__feedback" aria-labelledby="feedback-title">
      <h3 id="feedback-title" className="assessment__score">
        {score ? `Você acertou ${score.correct} de ${score.total}` : "Prova pulada"}
      </h3>
      <ol className="assessment__review">
        {items.map((item, itemIndex) => {
          const chosen = response.answers[item.id];
          const right = chosen === item.correctIndex;
          return (
            <li key={item.id} className={`assessment__review-item ${right ? "is-right" : "is-wrong"}`}>
              <p className="assessment__review-head">
                <span className="assessment__review-mark" aria-hidden="true">
                  {right ? "✓" : "✗"}
                </span>
                {`Questão ${itemIndex + 1} · ${right ? "Certa" : "Errada"}`}
              </p>
              <p className="assessment__review-prompt">{item.prompt}</p>
              {item.code && <pre className="assessment__code">{item.code}</pre>}
              {!right && <p className="assessment__review-answer">{`Sua resposta: ${chosen === undefined ? "sem resposta" : item.options[chosen]}`}</p>}
              <p className="assessment__review-answer">
                <strong>Resposta certa:</strong> {item.options[item.correctIndex]}
              </p>
              <p className="assessment__review-why">{item.explanation}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AssessmentPage() {
  const { world: worldSlug = "", form: slug = "" } = useParams();
  const form = FORM_BY_SLUG[slug];
  const save = useProgressStore((store) => store.save);
  const storeAssessment = useProgressStore((store) => store.storeAssessment);
  const [stage, setStage] = useState<"intro" | "questions" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState("");

  if (!form || !isWorldId(worldSlug)) return <Navigate to="/missoes" replace />;
  const worldId = worldSlug;
  if (!isWorldOpen(save, worldId, REFS)) return <Navigate to="/missoes" replace />;

  const world = getWorld(worldId);
  const items = itemsFor(worldId, form);
  const title = form === "pre" ? `Prova inicial · ${world.name}` : `Prova final · ${world.name}`;
  const tests = save.assessments[worldId];
  const existing = tests?.[form] ?? null;
  const missionsDone = tests?.pre != null && worldStep(save, worldId, REFS).kind !== "mission";
  const postLocked = form === "post" && !missionsDone;

  const finish = () => {
    const now = new Date().toISOString();
    storeAssessment({
      world: worldId,
      form,
      startedAt: startedAt || now,
      completedAt: now,
      skipped: false,
      answers,
    });
    setStage("done");
  };

  const nextLink = () => {
    if (form === "pre") {
      const first = missionsOfWorld(worldId, MISSIONS)[0];
      return { to: `/jogar/${first.id}`, label: `Começar ${world.name}` };
    }
    const next = WORLDS.find((candidate) => candidate.order === world.order + 1);
    return next ? { to: "/missoes", label: `Ir para ${next.name}` } : { to: "/missoes", label: "Ver missões" };
  };

  const body = () => {
    if (stage === "done" || (existing && stage === "intro")) {
      const next = nextLink();
      return (
        <section className="card assessment__card">
          <h2>Obrigado!</h2>
          <p>Suas respostas foram salvas e enviadas ao seu professor.</p>
          {existing && <Feedback items={items} response={existing} />}
          {form === "post" && existing && <Comparison worldName={world.name} pre={tests?.pre ?? null} post={existing} />}
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
          <p>{`Conclua as ${MISSIONS_PER_WORLD} missões de ${world.name} para fazer a prova final.`}</p>
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
          <p>{`São ${ITEMS_PER_FORM} questões curtas de programação sobre ${world.conceptLabel.toLowerCase()}: montar, prever e consertar algoritmos.`}</p>
          <ul>
            {form === "pre" ? (
              <li>É normal não saber várias respostas: marque a que achar mais certa.</li>
            ) : (
              <li>{`Você terminou as ${MISSIONS_PER_WORLD} missões deste mundo. Vamos ver o quanto aprendeu.`}</li>
            )}
            <li>Não vale nota e não há tempo limite.</li>
            <li>No fim você vê o que acertou e a explicação de cada questão.</li>
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
                animate={selected === optionIndex ? BADGE_POP.keyframes : { scale: 1 }}
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
            <GameButton tone="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Anterior
            </GameButton>
            <GameButton tone="primary" disabled={selected === undefined} onClick={() => (last ? finish() : setIndex(index + 1))}>
              {last ? "Concluir" : "Próxima"}
            </GameButton>
          </div>
        </motion.section>
      </AnimatePresence>
    );
  };

  return (
    <div className="chrome-page">
      <PageHeader title={title} subtitle={`${world.name} · ${world.conceptLabel}`} backTo="/missoes" />
      <main className="assessment">{body()}</main>
    </div>
  );
}
