--
-- PostgreSQL database dump
--

\restrict ObgpOi5ZiysFge2MpFNT6NziA9SvRDqjzfVFoOKQreiSVNViLg365KSUYVevuVk

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    status text NOT NULL,
    date_start date NOT NULL,
    date_end date,
    budget numeric(14,2) NOT NULL,
    CONSTRAINT chk_projects_budget CHECK ((budget > (0)::numeric)),
    CONSTRAINT chk_projects_dates CHECK (((date_end IS NULL) OR (date_end > date_start))),
    CONSTRAINT chk_projects_status CHECK ((status = ANY (ARRAY['Активный'::text, 'Завершён'::text, 'Заморожен'::text])))
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: salary_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    change_date date NOT NULL,
    old_stavka numeric(10,2) NOT NULL,
    new_stavka numeric(10,2) NOT NULL,
    reason text NOT NULL,
    CONSTRAINT chk_salary_rost CHECK ((new_stavka >= old_stavka)),
    CONSTRAINT chk_salary_stavki CHECK (((old_stavka > (0)::numeric) AND (new_stavka > (0)::numeric)))
);


--
-- Name: salary_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_history_id_seq OWNED BY public.salary_history.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    dolzhnost text NOT NULL,
    stavka numeric(10,2) NOT NULL,
    otdel text NOT NULL,
    sem_poloj text NOT NULL,
    data_rojd date NOT NULL,
    uroven text NOT NULL,
    tip_zanyatosti text NOT NULL,
    obrazovanie text NOT NULL,
    gorod text NOT NULL,
    data_najma date NOT NULL,
    premiya numeric(10,2) NOT NULL,
    CONSTRAINT chk_users_daty CHECK ((data_najma > data_rojd)),
    CONSTRAINT chk_users_obrazovanie CHECK ((obrazovanie = ANY (ARRAY['Среднее'::text, 'Среднее специальное'::text, 'Бакалавр'::text, 'Магистр'::text, 'MBA'::text]))),
    CONSTRAINT chk_users_premiya CHECK ((premiya >= (0)::numeric)),
    CONSTRAINT chk_users_sem_poloj CHECK ((sem_poloj = ANY (ARRAY['Холост/Не замужем'::text, 'Женат/Замужем'::text, 'Разведён/Разведена'::text, 'Вдовец/Вдова'::text]))),
    CONSTRAINT chk_users_stavka CHECK ((stavka > (0)::numeric)),
    CONSTRAINT chk_users_tip CHECK ((tip_zanyatosti = ANY (ARRAY['Полная ставка'::text, 'Гибрид'::text, 'Удалённо'::text, 'Полставки'::text])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_active_projects; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_active_projects AS
 SELECT p.id,
    u.name AS sotrudnik,
    u.dolzhnost,
    u.otdel,
    p.name AS project,
    p.role AS rol_v_proekte,
    p.date_start,
    p.budget,
    (date_part('day'::text, (now() - ((p.date_start)::timestamp without time zone)::timestamp with time zone)))::integer AS dney_v_rabote
   FROM (public.projects p
     JOIN public.users u ON ((u.id = p.user_id)))
  WHERE (p.status = 'Активный'::text)
  ORDER BY p.date_start;


--
-- Name: v_employees; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_employees AS
 SELECT u.id,
    u.name,
    u.email,
    u.dolzhnost,
    u.uroven,
    u.otdel,
    u.gorod,
    u.tip_zanyatosti,
    u.obrazovanie,
    u.sem_poloj,
    u.data_rojd,
    (date_part('year'::text, age((u.data_rojd)::timestamp with time zone)))::integer AS vozrast,
    u.data_najma,
    (date_part('year'::text, age((u.data_najma)::timestamp with time zone)))::integer AS staj_let,
    u.stavka,
    u.premiya,
    (u.stavka + u.premiya) AS polnoe_voznagrazdenie,
    sh.new_stavka AS nachalnaya_stavka,
    round((((u.stavka - sh.new_stavka) / sh.new_stavka) * (100)::numeric), 1) AS rost_stavki_percent
   FROM (public.users u
     LEFT JOIN public.salary_history sh ON (((sh.user_id = u.id) AND (sh.reason = 'Приём на работу'::text))));


--
-- Name: v_otdely; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_otdely AS
 SELECT otdel,
    count(*) AS sotrudnikov,
    round(avg(stavka), 0) AS avg_stavka,
    round(min(stavka), 0) AS min_stavka,
    round(max(stavka), 0) AS max_stavka,
    round(avg(premiya), 0) AS avg_premiya,
    count(*) FILTER (WHERE (tip_zanyatosti = 'Удалённо'::text)) AS udalenno,
    count(*) FILTER (WHERE (tip_zanyatosti = 'Гибрид'::text)) AS gibrid,
    count(*) FILTER (WHERE (tip_zanyatosti = 'Полная ставка'::text)) AS ofis
   FROM public.users
  GROUP BY otdel
  ORDER BY (round(avg(stavka), 0)) DESC;


--
-- Name: v_salary_history; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_salary_history AS
 SELECT u.name,
    u.dolzhnost,
    u.otdel,
    sh.change_date,
    sh.old_stavka,
    sh.new_stavka,
    round((sh.new_stavka - sh.old_stavka), 2) AS pribavka,
    round((((sh.new_stavka - sh.old_stavka) / sh.old_stavka) * (100)::numeric), 1) AS pribavka_percent,
    sh.reason
   FROM (public.salary_history sh
     JOIN public.users u ON ((u.id = sh.user_id)))
  ORDER BY u.name, sh.change_date;


--
-- Name: vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    date_start date NOT NULL,
    date_end date NOT NULL,
    days integer NOT NULL,
    status text NOT NULL,
    CONSTRAINT chk_vacations_dates CHECK ((date_end >= date_start)),
    CONSTRAINT chk_vacations_days CHECK ((days > 0)),
    CONSTRAINT chk_vacations_status CHECK ((status = ANY (ARRAY['Одобрен'::text, 'Отклонён'::text, 'На рассмотрении'::text]))),
    CONSTRAINT chk_vacations_type CHECK ((type = ANY (ARRAY['Ежегодный отпуск'::text, 'Больничный'::text, 'Отгул'::text])))
);


--
-- Name: v_vacations; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_vacations AS
 SELECT u.name,
    u.otdel,
    v.type,
    v.date_start,
    v.date_end,
    v.days,
    v.status
   FROM (public.vacations v
     JOIN public.users u ON ((u.id = v.user_id)))
  ORDER BY v.date_start DESC;


--
-- Name: vacations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vacations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vacations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vacations_id_seq OWNED BY public.vacations.id;


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: salary_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_history ALTER COLUMN id SET DEFAULT nextval('public.salary_history_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vacations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations ALTER COLUMN id SET DEFAULT nextval('public.vacations_id_seq'::regclass);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: salary_history salary_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT salary_history_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vacations vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_pkey PRIMARY KEY (id);


--
-- Name: idx_projects_date_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_date_start ON public.projects USING btree (date_start);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);


--
-- Name: idx_salary_change_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_change_date ON public.salary_history USING btree (change_date);


--
-- Name: idx_salary_reason; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_reason ON public.salary_history USING btree (reason);


--
-- Name: idx_salary_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_salary_user_id ON public.salary_history USING btree (user_id);


--
-- Name: idx_users_data_najma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_data_najma ON public.users USING btree (data_najma);


--
-- Name: idx_users_dolzhnost; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_dolzhnost ON public.users USING btree (dolzhnost);


--
-- Name: idx_users_gorod; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_gorod ON public.users USING btree (gorod);


--
-- Name: idx_users_otdel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_otdel ON public.users USING btree (otdel);


--
-- Name: idx_users_tip_zanyatosti; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tip_zanyatosti ON public.users USING btree (tip_zanyatosti);


--
-- Name: idx_users_uroven; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_uroven ON public.users USING btree (uroven);


--
-- Name: idx_vacations_date_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_date_start ON public.vacations USING btree (date_start);


--
-- Name: idx_vacations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_status ON public.vacations USING btree (status);


--
-- Name: idx_vacations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_type ON public.vacations USING btree (type);


--
-- Name: idx_vacations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_user_id ON public.vacations USING btree (user_id);


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: salary_history salary_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT salary_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vacations vacations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ObgpOi5ZiysFge2MpFNT6NziA9SvRDqjzfVFoOKQreiSVNViLg365KSUYVevuVk

