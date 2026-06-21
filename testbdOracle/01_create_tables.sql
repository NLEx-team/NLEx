-- ============================================================
-- HOSPITAL DATABASE - CREATE TABLES
-- ============================================================

-- Удаление таблиц если существуют
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE PRESCRIPTIONS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE APPOINTMENTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE DOCTORS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE PATIENTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- Удаление последовательностей
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_PATIENTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_DOCTORS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_APPOINTMENTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_PRESCRIPTIONS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE SEQ_PATIENTS     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_DOCTORS      START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_APPOINTMENTS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PRESCRIPTIONS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================
-- ТАБЛИЦА: DOCTORS (Врачи)
-- ============================================================

CREATE TABLE DOCTORS (
    DOCTOR_ID        NUMBER          PRIMARY KEY,
    LAST_NAME        VARCHAR2(50)    NOT NULL,
    FIRST_NAME       VARCHAR2(50)    NOT NULL,
    MIDDLE_NAME      VARCHAR2(50),
    SPECIALIZATION   VARCHAR2(100)   NOT NULL,
    DEPARTMENT       VARCHAR2(100)   NOT NULL,
    EXPERIENCE_YEARS NUMBER(2)       NOT NULL,
    HIRE_DATE        DATE            NOT NULL,
    SALARY           NUMBER(10,2)    NOT NULL,
    PHONE            VARCHAR2(20),
    EMAIL            VARCHAR2(100),
    CATEGORY         VARCHAR2(30)    CHECK (CATEGORY IN ('Первая', 'Вторая', 'Высшая', 'Без категории')),
    IS_ACTIVE        CHAR(1)         DEFAULT 'Y' CHECK (IS_ACTIVE IN ('Y', 'N'))
);

COMMENT ON TABLE  DOCTORS IS 'Врачи больницы';
COMMENT ON COLUMN DOCTORS.DOCTOR_ID IS 'Уникальный идентификатор врача';
COMMENT ON COLUMN DOCTORS.SPECIALIZATION IS 'Медицинская специализация';
COMMENT ON COLUMN DOCTORS.CATEGORY IS 'Квалификационная категория';

-- ============================================================
-- ТАБЛИЦА: PATIENTS (Пациенты) — ГЛАВНАЯ ТАБЛИЦА
-- ============================================================

CREATE TABLE PATIENTS (
    PATIENT_ID       NUMBER          PRIMARY KEY,
    LAST_NAME        VARCHAR2(50)    NOT NULL,
    FIRST_NAME       VARCHAR2(50)    NOT NULL,
    MIDDLE_NAME      VARCHAR2(50),
    BIRTH_DATE       DATE            NOT NULL,
    GENDER           VARCHAR2(2 CHAR) NOT NULL CHECK (GENDER IN ('М', 'Ж')),
    PASSPORT         VARCHAR2(20)    UNIQUE,
    POLICY_NUMBER    VARCHAR2(20)    UNIQUE NOT NULL,
    BLOOD_TYPE       VARCHAR2(5)     CHECK (BLOOD_TYPE IN ('I+','I-','II+','II-','III+','III-','IV+','IV-')),
    PHONE            VARCHAR2(20),
    ADDRESS          VARCHAR2(200),
    CITY             VARCHAR2(50),
    REGISTRATION_DATE DATE           DEFAULT SYSDATE NOT NULL,
    PRIMARY_DOCTOR_ID NUMBER,
    DIAGNOSIS        VARCHAR2(200),
    ALLERGIES        VARCHAR2(200),
    IS_ACTIVE        CHAR(1)         DEFAULT 'Y' CHECK (IS_ACTIVE IN ('Y', 'N')),
    CONSTRAINT FK_PATIENT_DOCTOR FOREIGN KEY (PRIMARY_DOCTOR_ID) REFERENCES DOCTORS(DOCTOR_ID)
);

COMMENT ON TABLE  PATIENTS IS 'Пациенты больницы — главная таблица';
COMMENT ON COLUMN PATIENTS.POLICY_NUMBER IS 'Номер медицинского полиса ОМС';
COMMENT ON COLUMN PATIENTS.BLOOD_TYPE IS 'Группа крови с резус-фактором';
COMMENT ON COLUMN PATIENTS.PRIMARY_DOCTOR_ID IS 'Лечащий врач';

-- ============================================================
-- ТАБЛИЦА: APPOINTMENTS (Приёмы/Визиты)
-- ============================================================

CREATE TABLE APPOINTMENTS (
    APPOINTMENT_ID   NUMBER          PRIMARY KEY,
    PATIENT_ID       NUMBER          NOT NULL,
    DOCTOR_ID        NUMBER          NOT NULL,
    APPOINTMENT_DATE DATE            NOT NULL,
    APPOINTMENT_TIME VARCHAR2(5)     NOT NULL,
    DURATION_MIN     NUMBER(3)       DEFAULT 30,
    STATUS           VARCHAR2(20)    DEFAULT 'Запланирован'
                     CHECK (STATUS IN ('Запланирован','Завершён','Отменён','Не явился')),
    VISIT_TYPE       VARCHAR2(30)    CHECK (VISIT_TYPE IN ('Первичный','Повторный','Плановый','Экстренный')),
    COMPLAINTS       VARCHAR2(500),
    DIAGNOSIS        VARCHAR2(300),
    RECOMMENDATIONS  VARCHAR2(500),
    CREATED_DATE     DATE            DEFAULT SYSDATE,
    CONSTRAINT FK_APPT_PATIENT FOREIGN KEY (PATIENT_ID) REFERENCES PATIENTS(PATIENT_ID),
    CONSTRAINT FK_APPT_DOCTOR  FOREIGN KEY (DOCTOR_ID)  REFERENCES DOCTORS(DOCTOR_ID)
);

COMMENT ON TABLE  APPOINTMENTS IS 'Записи на приём / визиты пациентов';
COMMENT ON COLUMN APPOINTMENTS.DURATION_MIN IS 'Длительность приёма в минутах';

-- ============================================================
-- ТАБЛИЦА: PRESCRIPTIONS (Рецепты / Назначения)
-- ============================================================

CREATE TABLE PRESCRIPTIONS (
    PRESCRIPTION_ID  NUMBER          PRIMARY KEY,
    APPOINTMENT_ID   NUMBER          NOT NULL,
    PATIENT_ID       NUMBER          NOT NULL,
    DOCTOR_ID        NUMBER          NOT NULL,
    MEDICINE_NAME    VARCHAR2(150)   NOT NULL,
    DOSAGE           VARCHAR2(100)   NOT NULL,
    FREQUENCY        VARCHAR2(100)   NOT NULL,
    DURATION_DAYS    NUMBER(3)       NOT NULL,
    ISSUE_DATE       DATE            DEFAULT SYSDATE NOT NULL,
    EXPIRY_DATE      DATE            NOT NULL,
    MEDICINE_TYPE    VARCHAR2(50)    CHECK (MEDICINE_TYPE IN ('Таблетки','Капсулы','Сироп','Инъекция','Мазь','Капли','Спрей','Свечи')),
    NOTES            VARCHAR2(300),
    IS_DISPENSED     CHAR(1)         DEFAULT 'N' CHECK (IS_DISPENSED IN ('Y', 'N')),
    CONSTRAINT FK_PRESC_APPOINTMENT FOREIGN KEY (APPOINTMENT_ID) REFERENCES APPOINTMENTS(APPOINTMENT_ID),
    CONSTRAINT FK_PRESC_PATIENT     FOREIGN KEY (PATIENT_ID)     REFERENCES PATIENTS(PATIENT_ID),
    CONSTRAINT FK_PRESC_DOCTOR      FOREIGN KEY (DOCTOR_ID)      REFERENCES DOCTORS(DOCTOR_ID),
    CONSTRAINT CHK_EXPIRY CHECK (EXPIRY_DATE > ISSUE_DATE)
);

COMMENT ON TABLE  PRESCRIPTIONS IS 'Рецепты и медицинские назначения';
COMMENT ON COLUMN PRESCRIPTIONS.IS_DISPENSED IS 'Выдан ли препарат в аптеке';

COMMIT;

PROMPT Таблицы успешно созданы!
