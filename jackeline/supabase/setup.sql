-- Snapshot e permissões do catálogo Jackeline. Execute uma vez no projeto dedicado.
create table if not exists public.catalog (id text primary key, data jsonb not null, version bigint not null default 1);
create table if not exists public.editors (email text primary key, role text not null check (role in ('admin','editor')));
alter table public.catalog enable row level security;
alter table public.editors enable row level security;
revoke all on public.catalog, public.editors from anon, authenticated;
grant select on public.catalog to anon, authenticated;
grant update(data,version) on public.catalog to authenticated;
grant select,insert,update,delete on public.editors to authenticated;
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;
-- Definer is limited to a verified-user permission lookup, avoiding recursive RLS.
create or replace function app_private.catalog_role() returns text
language sql stable security definer set search_path = '' as $$
 select case when u.email = 'gabibpacheco27@gmail.com' then 'admin'
 else (select e.role from public.editors e where e.email = lower(u.email)) end
 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
$$;
revoke all on function app_private.catalog_role() from public, anon;
grant execute on function app_private.catalog_role() to authenticated;
create policy catalog_public_read on public.catalog for select to anon,authenticated using (true);
create policy catalog_editor_update on public.catalog for update to authenticated
 using ((select app_private.catalog_role()) in ('admin','editor'))
 with check ((select app_private.catalog_role()) in ('admin','editor'));
create policy editors_read on public.editors for select to authenticated
 using (email = lower((select auth.jwt())->>'email') or (select app_private.catalog_role()) = 'admin');
create policy editors_add on public.editors for insert to authenticated
 with check ((select app_private.catalog_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy editors_change on public.editors for update to authenticated
 using ((select app_private.catalog_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com')
 with check ((select app_private.catalog_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy editors_remove on public.editors for delete to authenticated
 using ((select app_private.catalog_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy dress_upload on storage.objects for insert to authenticated
 with check (bucket_id = 'dresses' and (select app_private.catalog_role()) in ('admin','editor'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('dresses','dresses',true,4000000,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
insert into public.catalog(id,data) values ('main','[
  {
    "id": "4",
    "name": "Modelo 04",
    "colors": [
      {
        "name": "Amarelo",
        "hex": "#eddd34"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido4.jpeg"
    ]
  },
  {
    "id": "7",
    "name": "Modelo 07",
    "colors": [
      {
        "name": "Amarelo",
        "hex": "#e9d48b"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido7.jpeg"
    ]
  },
  {
    "id": "6",
    "name": "Modelo 06",
    "colors": [
      {
        "name": "Amarelo",
        "hex": "#d5c47f"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido6.jpeg"
    ]
  },
  {
    "id": "8",
    "name": "Modelo 08",
    "colors": [
      {
        "name": "Laranja",
        "hex": "#e56c25"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido8.jpeg"
    ]
  },
  {
    "id": "5",
    "name": "Modelo 05",
    "colors": [
      {
        "name": "Verde",
        "hex": "#78813f"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido5.jpeg"
    ]
  },
  {
    "id": "1",
    "name": "Modelo 01",
    "colors": [
      {
        "name": "Azul",
        "hex": "#bbcee5"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido1.jpeg"
    ]
  },
  {
    "id": "2",
    "name": "Modelo 02",
    "colors": [
      {
        "name": "Azul",
        "hex": "#7ea3d5"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido2.jpeg"
    ]
  },
  {
    "id": "3",
    "name": "Modelo 03",
    "colors": [
      {
        "name": "Azul",
        "hex": "#17358a"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido3.jpeg"
    ]
  },
  {
    "id": "9",
    "name": "Modelo 09",
    "colors": [
      {
        "name": "Preto",
        "hex": "#242322"
      }
    ],
    "sizes": [],
    "description": "",
    "photos": [
      "/dresses/vestido9.jpeg"
    ]
  }
]'::jsonb) on conflict(id) do nothing;
insert into public.catalog(id,data) values ('texts','{
  "brand": "Jackeline Costa",
  "brandSubtitle": "MODA FESTA",
  "contact": "Fale conosco",
  "heroKicker": "A arte de celebrar",
  "heroLine1": "Seu momento,",
  "heroLine2": "seu vestido.",
  "heroDescription": "Para momentos que merecem ser inesquecíveis. Explore nossa seleção de vestidos de festa para locação.",
  "heroButton": "Explore a coleção!",
  "collectionKicker": "Encontre o seu favorito",
  "collectionTitle": "Vestidos de Festa",
  "collectionDescription": "Uma seleção para acompanhar você em cada ocasião especial.",
  "filterLabel": "Explore por",
  "allColors": "Todas as cores",
  "allSizes": "Todos os tamanhos",
  "empty": "Nenhum vestido encontrado.",
  "footerLine1": "Vestidos para tornar seus momentos ainda mais especiais.",
  "footerLine2": "Disponibilidade e informações pelo WhatsApp.",
  "footerButton": "Converse com a gente",
  "detailTag": "Coleção · Moda festa",
  "detailButton": "Consultar este vestido",
  "detailDescription": "Disponibilidade e detalhes da locação: consulte nossa equipe."
}
'::jsonb) on conflict(id) do nothing;
