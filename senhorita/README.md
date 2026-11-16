# Toda Bella Moda Festa

Projeto independente da Jackeline, com catálogo público e painel privado.

- Vercel: equipe GBorg, projeto `senhorita-moda-festa`.
- Catálogo: `/`. Painel: `/editar.html`.
- Origem: pasta `senhorita/` deste repositório. Não alterar `jackeline/` ao publicar este catálogo.
- Supabase: tabelas `senhorita_catalog`, `senhorita_editors`, RPC `senhorita_access` e bucket `senhorita-dresses`. O projeto Supabase e o cadastro Auth são compartilhados, mas as permissões e o conteúdo de cada loja são separados por RLS.
- Responsável inicial: e-mail definido em OWNER_EMAIL, correspondente à política no SQL. Usa o cadastro Auth existente e a mesma senha que já criou para o painel Jackeline.
- Cadastre novas pessoas em Supabase Authentication → Users. Libere o mesmo e-mail em “Acesso da equipe Toda Bella”. Funcionárias editam vestidos e textos; responsáveis gerenciam permissões. Cadastro sem autorização não permite editar.
- Para vender: libere a dona como responsável e as funcionárias como editoras, com contas individuais. Transferir a propriedade das contas Vercel/Supabase é um procedimento separado.
- Identidade Toda Bella em preto e dourado, logo e quatro vestidos fornecidos pela loja. WhatsApp: +55 62 99235-7960. Tamanhos ainda não informados; localização oculta até ser cadastrada.
- A pasta e os identificadores internos `senhorita` foram preservados para manter a conexão existente e suas permissões.
- As alterações chegam ao catálogo aberto em até 15 segundos. Há proteção contra sobrescrita simultânea.
- Sessão em cookie HttpOnly/Secure, validação no servidor e no banco. A página de login é pública; dados e ações de edição exigem autorização.

Execute `npm test` nesta pasta. O SQL de implantação está em `supabase/setup.sql`; não o execute novamente sem revisar políticas existentes. Nenhuma chave administrativa é usada pela aplicação.

