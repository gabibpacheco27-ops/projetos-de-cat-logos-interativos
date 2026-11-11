# Senhorita Moda Festa

Projeto independente da Jackeline, com catálogo público e painel privado.

- Vercel: equipe GBorg, projeto `senhorita-moda-festa`.
- Catálogo: `/`. Painel: `/editar.html`.
- Origem: pasta `senhorita/` deste repositório. Não alterar `jackeline/` ao publicar este catálogo.
- Supabase: tabelas `senhorita_catalog`, `senhorita_editors`, RPC `senhorita_access` e bucket `senhorita-dresses`. O projeto Supabase e o cadastro Auth são compartilhados, mas as permissões e o conteúdo de cada loja são separados por RLS.
- Responsável inicial: e-mail definido em OWNER_EMAIL, correspondente à política no SQL. Usa o cadastro Auth existente e a mesma senha que já criou para o painel Jackeline.
- Cadastre novas pessoas em Supabase Authentication → Users. Libere o mesmo e-mail em “Acesso da equipe Senhorita”. Funcionárias editam vestidos e textos; responsáveis gerenciam permissões. Cadastro sem autorização não permite editar.
- Para vender: libere a dona como responsável e as funcionárias como editoras, com contas individuais. Transferir a propriedade das contas Vercel/Supabase é um procedimento separado.
- Fotos iniciais são ilustrativas. Substitua o acervo e remova o aviso em Textos do catálogo quando estiver pronto.
- As alterações chegam ao catálogo aberto em até 15 segundos. Há proteção contra sobrescrita simultânea.
- Sessão em cookie HttpOnly/Secure, validação no servidor e no banco. A página de login é pública; dados e ações de edição exigem autorização.

Execute `npm test` nesta pasta. O SQL de implantação está em `supabase/setup.sql`; não o execute novamente sem revisar políticas existentes. Nenhuma chave administrativa é usada pela aplicação.
