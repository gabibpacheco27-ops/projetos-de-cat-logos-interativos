-- Snapshot e permissões do catálogo Senhorita. Execute uma vez no projeto dedicado.
create table if not exists public.senhorita_catalog (id text primary key, data jsonb not null, version bigint not null default 1);
create table if not exists public.senhorita_editors (email text primary key, role text not null check (role in ('admin','editor')));
alter table public.senhorita_catalog enable row level security;
alter table public.senhorita_editors enable row level security;
revoke all on public.senhorita_catalog, public.senhorita_editors from anon, authenticated;
grant select on public.senhorita_catalog to anon, authenticated;
grant update(data,version) on public.senhorita_catalog to authenticated;
grant select,insert,update,delete on public.senhorita_editors to authenticated;
create schema if not exists app_private;
grant usage on schema app_private to authenticated;
-- Definer is limited to a verified-user permission lookup, avoiding recursive RLS.
create or replace function app_private.senhorita_role() returns text
language sql stable security definer set search_path = '' as $$
 select case when lower(u.email) = 'gabibpacheco27@gmail.com' then 'admin'
 else (select e.role from public.senhorita_editors e where e.email = lower(u.email)) end
 from auth.users u
 where u.id = auth.uid() and u.email_confirmed_at is not null
 and exists (
  select 1 from auth.sessions s where s.user_id=u.id
  and s.id::text=(auth.jwt()->>'session_id')
  and (s.not_after is null or s.not_after>now())
 )
$$;
revoke all on function app_private.senhorita_role() from public, anon;
grant execute on function app_private.senhorita_role() to authenticated;
create or replace function public.senhorita_access() returns text
language sql stable security invoker set search_path = '' as $$
 select app_private.senhorita_role()
$$;
revoke all on function public.senhorita_access() from public, anon;
grant execute on function public.senhorita_access() to authenticated;
create policy senhorita_catalog_public_read on public.senhorita_catalog for select to anon,authenticated using (true);
create policy senhorita_catalog_editor_update on public.senhorita_catalog for update to authenticated
 using ((select app_private.senhorita_role()) in ('admin','editor'))
 with check ((select app_private.senhorita_role()) in ('admin','editor'));
create policy senhorita_editors_read on public.senhorita_editors for select to authenticated
 using (email = lower((select auth.jwt())->>'email') or (select app_private.senhorita_role()) = 'admin');
create policy senhorita_editors_add on public.senhorita_editors for insert to authenticated
 with check ((select app_private.senhorita_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy senhorita_editors_change on public.senhorita_editors for update to authenticated
 using ((select app_private.senhorita_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com')
 with check ((select app_private.senhorita_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy senhorita_editors_remove on public.senhorita_editors for delete to authenticated
 using ((select app_private.senhorita_role()) = 'admin' and email <> 'gabibpacheco27@gmail.com');
create policy senhorita_dress_upload on storage.objects for insert to authenticated
 with check (bucket_id = 'senhorita-dresses' and (select app_private.senhorita_role()) in ('admin','editor'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('senhorita-dresses','senhorita-dresses',true,4000000,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;

insert into public.senhorita_catalog(id,data) values ('main','[
  {
    "id": "1",
    "name": "Aurora",
    "colors": [
      {
        "name": "Rosa",
        "hex": "#d8a7ac"
      }
    ],
    "sizes": [
      "P",
      "M"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-1.jpg"
    ]
  },
  {
    "id": "2",
    "name": "Essência",
    "colors": [
      {
        "name": "Preto",
        "hex": "#363335"
      }
    ],
    "sizes": [
      "PP",
      "P"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-2.jpg"
    ]
  },
  {
    "id": "3",
    "name": "Serena",
    "colors": [
      {
        "name": "Areia",
        "hex": "#d4bfa4"
      }
    ],
    "sizes": [
      "P",
      "M",
      "G"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-3.jpg"
    ]
  },
  {
    "id": "4",
    "name": "Encanto",
    "colors": [
      {
        "name": "Rosa",
        "hex": "#c78b94"
      }
    ],
    "sizes": [
      "M",
      "G"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-4.jpg"
    ]
  },
  {
    "id": "5",
    "name": "Sublime",
    "colors": [
      {
        "name": "Areia",
        "hex": "#dccab8"
      }
    ],
    "sizes": [
      "PP",
      "P",
      "M"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-5.jpg"
    ]
  },
  {
    "id": "6",
    "name": "Brisa",
    "colors": [
      {
        "name": "Rosa",
        "hex": "#e4babc"
      }
    ],
    "sizes": [
      "P",
      "M"
    ],
    "description": "Modelo ilustrativo para apresentar o catálogo. Substitua pelas fotos e informações do acervo da loja.",
    "photos": [
      "/dresses/modelo-6.jpg"
    ]
  }
]'::jsonb) on conflict(id) do nothing;

insert into public.senhorita_catalog(id,data) values ('texts','{
  "brand": "Senhorita",
  "brandSubtitle": "Moda Festa",
  "heroKicker": "Senhorita · Moda Festa",
  "heroLine1": "Para viver",
  "heroLine2": "momentos",
  "heroLine3": "extraordinários.",
  "heroDescription": "O vestido que acompanha a sua essência e torna cada ocasião ainda mais especial.",
  "heroButton": "Explore o catálogo",
  "heroImage": "/dresses/modelo-1.jpg",
  "heroCaption": "Elegância em cada detalhe",
  "strip": "Aluguel de vestidos ✧ Leveza para celebrar ✧ Seu momento, sua essência",
  "collectionKicker": "Encontre o seu favorito",
  "collectionTitle": "Um vestido. Muitas emoções.",
  "collectionDescription": "Entre cores, texturas e detalhes, descubra o seu próximo grande momento.",
  "essenceKicker": "A essência Senhorita",
  "essenceTitle": "Delicadeza que se veste. Presença que fica.",
  "essenceDescription": "Uma seleção para celebrar quem você é. Explore os modelos e imagine o seu próximo momento especial.",
  "contactKicker": "Vamos conversar",
  "contactTitle": "Seu momento começa aqui.",
  "contactDescription": "Tire suas dúvidas sobre os vestidos e consulte a disponibilidade com a equipe da loja.",
  "locationKicker": "Encontre a Senhorita",
  "locationTitle": "Uma visita especial.",
  "address": "Rua S, nº 051 · Quadra 52, lotes 11 e 12 · Anápolis City · Anápolis – GO · CEP 75096-140",
  "mapUrl": "https://www.google.com/maps/place/Senhorita+Moda+Festa+-+R.+S,+051+-+quadra+52,+lote+11+e+12+-+An%C3%A1polis+City,+An%C3%A1polis+-+GO,+75096-140/@-16.326941,-48.9272426,16z/data=!4m6!3m5!1s0x935ea460fd34289b:0x8fef26d481ca60eb!8m2!3d-16.326941!4d-48.9272426!16s%2Fg%2F11bwf6h83k",
  "whatsapp": "5562991551001",
  "footerLine": "Senhorita Moda Festa · Feito para celebrar momentos.",
  "detailTag": "Senhorita · Moda Festa",
  "detailButton": "Consultar este modelo",
  "detailDescription": "Disponibilidade e detalhes da locação: consulte nossa equipe.",
  "demoNotice": "Prévia visual · Fotos e modelos ilustrativos"
}'::jsonb) on conflict(id) do nothing;
