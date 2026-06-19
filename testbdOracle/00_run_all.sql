-- ============================================================
-- ЗАПУСК ВСЕХ СКРИПТОВ ПО ПОРЯДКУ
-- Выполнять из папки hospital_db:
--   sqlplus user/password@xe @00_run_all.sql
-- ============================================================

PROMPT === Шаг 1: Создание таблиц ===
@01_create_tables.sql

PROMPT === Шаг 2: Вставка врачей (800 строк) ===
@02_insert_doctors.sql

PROMPT === Шаг 3: Вставка пациентов (1500 строк) ===
@03_insert_patients.sql

PROMPT === Шаг 4: Вставка приёмов (1000 строк) ===
@04_insert_appointments.sql

PROMPT === Шаг 5: Вставка рецептов (900 строк) ===
@05_insert_prescriptions.sql

PROMPT === Шаг 6: Индексы и представления ===
@06_indexes_and_views.sql

PROMPT ============================================
PROMPT База данных успешно развёрнута!
PROMPT Таблицы: DOCTORS(800), PATIENTS(1500), APPOINTMENTS(1000), PRESCRIPTIONS(900)
PROMPT ============================================
