--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.8 (Debian 16.8-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: exports; Type: TABLE DATA; Schema: public; Owner: pg-user
--



--
-- Data for Name: export_entries; Type: TABLE DATA; Schema: public; Owner: pg-user
--



--
-- Data for Name: imports; Type: TABLE DATA; Schema: public; Owner: pg-user
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: pg-user
--

INSERT INTO public.migrations (id, name, batch, migration_time) VALUES (1, '20250402091721_init-meta-manager.js', 1, '2026-03-19 13:37:55.821+00');
INSERT INTO public.migrations (id, name, batch, migration_time) VALUES (2, '20250627114407_add-export-entries-table.js', 1, '2026-03-19 13:37:55.922+00');
INSERT INTO public.migrations (id, name, batch, migration_time) VALUES (3, '20250702122152_remove-export-data-column.js', 1, '2026-03-19 13:37:55.992+00');
INSERT INTO public.migrations (id, name, batch, migration_time) VALUES (4, '20250711081545_add-tenant-id-column.js', 1, '2026-03-19 13:37:56.018+00');
INSERT INTO public.migrations (id, name, batch, migration_time) VALUES (5, '20250714144135_make-tenant-id-non-null.js', 1, '2026-03-19 13:37:56.021+00');


--
-- Data for Name: migrations_lock; Type: TABLE DATA; Schema: public; Owner: pg-user
--

INSERT INTO public.migrations_lock (index, is_locked) VALUES (1, 0);


--
-- Name: counter_seq; Type: SEQUENCE SET; Schema: public; Owner: pg-user
--

SELECT pg_catalog.setval('public.counter_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pg-user
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- Name: migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: pg-user
--

SELECT pg_catalog.setval('public.migrations_lock_index_seq', 1, true);


--
-- PostgreSQL database dump complete
--

