# Catálogos interativos — Jackeline Costa

Catálogo: https://jackeline-costa.vercel.app/

Painel: https://jackeline-costa.vercel.app/editar.html

Hospedagem: Vercel, equipe GBorg, projeto jackeline-costa. Backend: Supabase. A senha da responsável é criada em Authentication → Users no Supabase; a conta do dashboard não cria automaticamente uma conta para o painel.

- `jackeline/`: versão independente para Vercel, com catálogo público, painel, APIs e configuração do Supabase.
- `original-sites/`: código original preservado, destinado ao ambiente anterior. Não selecionar essa pasta na Vercel.

## Publicação

Importe este repositório na Vercel e escolha **Root Directory: jackeline**. O arquivo `vercel.json` configura os arquivos públicos e as APIs. A branch de produção é `main`; mudanças em outras branches permitem revisar prévias antes da aprovação e integração.

## Ativação do painel

O catálogo está publicado, o banco foi inicializado e as variáveis da Vercel foram configuradas. Falta criar a conta de autenticação da responsável e validar o fluxo completo de edição com esse login. Os passos 1 a 3 abaixo documentam a configuração inicial já concluída. Não execute novamente o SQL de inicialização em um banco existente sem revisar as políticas.

1. Crie um projeto Supabase dedicado à loja.
2. Execute `jackeline/supabase/setup.sql` no SQL Editor. Ele cria as tabelas protegidas por RLS, o bucket de fotos e importa o snapshot. Não sobrescreve dados existentes.
3. Em Vercel → projeto → Settings → Environment Variables, configure as chaves de `.env.example`. A aplicação usa apenas a chave publicável (ou anon legada), com RLS no banco. Não usa chave service_role.
4. Em Supabase → Authentication → Users, crie/confirme a conta responsável com o e-mail definido em `OWNER_EMAIL`. Defina a senha diretamente no Supabase. Desative cadastros públicos se não forem necessários.
5. Faça um novo deployment após configurar as variáveis.
6. Acesse `/editar.html`, entre e teste edição de textos, vestido, upload e remoção. Em outra janela, confira a atualização no catálogo.
7. Para funcionárias, crie/confirme as contas no Supabase e libere os respectivos e-mails no painel. O cadastro sozinho não permite editar. Responsáveis podem administrar permissões; funcionárias podem editar o catálogo.

As sessões do painel duram até uma hora. Senhas e tokens não ficam no código. Alterações simultâneas são detectadas por versão: o painel pede atualização se outra pessoa já tiver salvo.

## Dados migrados

Nove modelos e respectivas fotos originais. Textos lidos do banco do catálogo anterior em 03/11/2026. A tabela de vestidos do banco anterior não tinha registro customizado: eram usados os nove modelos definidos no código. Permissões de funcionárias precisam ser configuradas no novo sistema e não são expostas neste repositório público.

## Verificação

```sh
cd jackeline
npm test
```

Os testes cobrem validação de catálogo, rejeição de URLs inseguras, bloqueio de gravação entre origens e modo sem backend. APIs públicas, páginas e foto verificados com HTTP 200 na produção. Testes de RLS no banco confirmaram leitura pública, bloqueio de usuário não autorizado, edição da responsável e da funcionária e bloqueio de elevação de privilégios. Contas e alterações de teste foram revertidas. A verificação completa de login e upload pelo navegador aguarda a conta da responsável.

## Revisão de segurança e sincronização — 04/11/2026

- 16 testes automatizados: validação, sessão, upload, conflitos de versão e atualização da vitrine.
- Testes transacionais no banco: leitura pública, bloqueio de escrita anônima, privacidade da equipe, edição autorizada, bloqueio de elevação de privilégios e rejeição de sessão revogada; dados de teste revertidos.
- O logout revoga a sessão corrente no Supabase; políticas validam a sessão no banco.
- Atualização da vitrine: a cada 15 segundos enquanto visível e ao retornar à aba. Não é streaming instantâneo.
- Funcionárias precisam de conta confirmada em Supabase Authentication e autorização com papel editor no painel. A retirada do e-mail da equipe bloqueia as próximas operações.
- Aviso externo ainda pendente: proteção contra senhas vazadas desativada no Supabase. A opção exige Pro ou superior; nenhuma contratação foi feita. Use senhas individuais fortes.
- Testes de HTTP/upload usam serviço simulado; o navegador foi usado para verificar a vitrine pública. Não houve login com senha de funcionária durante a revisão.
