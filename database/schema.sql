-- Rodar no Supabase: SQL Editor > New query > colar > Run

create table games (
    id             uuid primary key default gen_random_uuid(),
    title          text not null,
    genre          text,
    price          numeric(10, 2) not null,
    stock_quantity integer not null default 0,
    release_date   date,
    developer      text,
    created_at     timestamptz not null default now()
);

create table person (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    email      text not null unique,
    role       text not null,
    phone      text,
    address    text,
    created_at timestamptz not null default now()
);

-- Herança: o vendedor É uma pessoa.
-- person_id é a chave primária E aponta para person.id (relação 1:1).
-- ON DELETE CASCADE: apagar a pessoa apaga o vendedor junto.
create table sellers (
    person_id uuid primary key references person (id) on delete cascade,
    hire_date date not null
);
