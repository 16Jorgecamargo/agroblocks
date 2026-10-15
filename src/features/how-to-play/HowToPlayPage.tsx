import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import './HowToPlayPage.css'

const LOOP = [
  'Receba uma missão agrícola e leia o objetivo.',
  'Observe o mapa e os recursos disponíveis.',
  'Monte um algoritmo encaixando blocos dentro de "quando executar".',
  'Clique em Executar e observe o robô seguir cada bloco.',
  'Leia o console: ele explica o que aconteceu e por quê.',
  'Corrija o algoritmo e tente de novo até cumprir a missão.',
]

export function HowToPlayPage() {
  return (
    <div className="chrome-page">
      <PageHeader title="Como jogar" subtitle="Você não controla o robô diretamente: você escreve o programa que ele segue." backTo="/" />
      <main className="how-to-play">
        <section className="card">
          <h2>O ciclo do jogo</h2>
          <ol className="how-to-play__loop">
            {LOOP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <Link className="button button--primary" to="/jogar/m0-training">
            Fazer o treinamento interativo
          </Link>
        </section>
        <section className="card">
          <h2>Blocos</h2>
          <ul>
            <li><strong>Movimento</strong>: andar e virar. Mover gasta energia; virar não.</li>
            <li><strong>Agricultura</strong>: preparar solo, plantar, regar, colher e coletar recursos.</li>
            <li><strong>Sensores</strong>: perguntas de sim ou não sobre o canteiro e o caminho.</li>
            <li><strong>Controle</strong>: repetir, enquanto, se / senão e operadores lógicos.</li>
            <li><strong>Variáveis</strong> e <strong>Procedimentos</strong>: liberados nas fases finais.</li>
          </ul>
          <p>Para remover um bloco, arraste-o para a biblioteca ou para a lixeira. Passe o mouse sobre um bloco para ler a explicação.</p>
        </section>
        <section className="card">
          <h2>Executando</h2>
          <ul>
            <li><Icon name="play" size={16} /> <strong>Executar</strong>: roda o programa no ritmo escolhido.</li>
            <li><Icon name="step" size={16} /> <strong>Passo a passo</strong>: cada clique executa uma instrução, inclusive as perguntas dos sensores.</li>
            <li><Icon name="stop" size={16} /> <strong>Parar</strong>: interrompe a execução e a fazenda volta ao estado inicial.</li>
          </ul>
          <p>Atalhos: Ctrl + Enter executa, Espaço pausa ou continua, ponto executa um passo e Esc para.</p>
        </section>
        <section className="card">
          <h2>Dicas e resultados</h2>
          <p>As dicas vão da ideia geral até um exemplo parcial. O objetivo é aprender a construir e compreender algoritmos, e não apenas completar fases rapidamente.</p>
          <p>Uma solução correta sempre conclui a fase. A eficiência (comandos, blocos e recursos) é mostrada à parte, para você comparar e melhorar.</p>
        </section>
        <section className="card">
          <h2>Telas pequenas</h2>
          <p>A programação com blocos funciona melhor em computadores e tablets (a partir de 768 px). No celular é possível navegar, ver o mapa e executar programas já montados.</p>
        </section>
      </main>
    </div>
  )
}
