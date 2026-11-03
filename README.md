# Catálogos interativos — Jackeline Costa

- `jackeline/`: versão independente para Vercel, com catálogo público, painel, APIs e configuração do Supabase.
- `original-sites/`: código original preservado, destinado ao ambiente anterior. Não selecionar essa pasta na Vercel.

## Publicação

Importe este repositório na Vercel e escolha **Root Directory: jackeline**. O arquivo `vercel.json` configura os arquivos públicos e as APIs. A branch de produção é `main`; mudanças em outras branches permitem revisar prévias antes da aprovação e integração.

## Ativação do painel

O catálogo público funciona com o snapshot migrado enquanto o backend não está configurado. O painel permanece bloqueado para gravação até a ativação. Esse modo não representa uma migração concluída do painel.

1. Crie um projeto Supabase dedicado à loja.
2. Execute `jackeline/supabase/setup.sql` no SQL Editor. Ele cria as tabelas protegidas por RLS, o bucket de fotos e importa o snapshot. Não sobrescreve dados existentes.
3. Em Vercel → projeto → Settings → Environment Variables, configure as chaves de `.env.example`. Guarde `SUPABASE_SERVICE_ROLE_KEY` como segredo somente no servidor; nunca no GitHub ou em variáveis `NEXT_PUBLIC_*`.
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

Os testes cobrem validação de catálogo, rejeição de URLs inseguras, bloqueio de gravação entre origens e modo sem backend. A verificação completa de login, persistência, fotos e permissões depende do Supabase ativo.
