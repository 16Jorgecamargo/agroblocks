# 0011 — Cadastro do aluno, envio ao servidor e painel do professor

**Contexto:** os dados de cada aluno ficavam só no navegador; o professor não tinha visão da turma.

**Decisão:** nome e escola no início de cada fazenda; cada fazenda é uma jogada com id próprio; o navegador envia a jogada inteira (sem o programa em edição) 2 s depois de cada mudança para Vercel Functions, que validam com zod e gravam no Upstash Redis (`run:<id>` + índice `runs` ordenado por atualização). O painel lê todas as jogadas com um token HMAC de 12 h obtido com a senha guardada em `TEACHER_PASSWORD`. Handlers puros em `server/` servem tanto o Vercel quanto o Vite (dev/preview, banco em memória), o que permite E2E sem nuvem.

**Consequências:** o professor vê tudo em um lugar; nomes de alunos menores passam a sair do navegador — o cadastro mostra um aviso explícito; a senha única não identifica quem acessou; não há bloqueio por tentativas de senha nesta versão.
