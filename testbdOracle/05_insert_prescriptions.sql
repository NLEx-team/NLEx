-- ============================================================
-- HOSPITAL DATABASE - INSERT PRESCRIPTIONS (900 строк)
-- ============================================================

SET DEFINE OFF;

DECLARE
    TYPE t_medicine  IS TABLE OF VARCHAR2(150);
    TYPE t_dosage    IS TABLE OF VARCHAR2(100);
    TYPE t_frequency IS TABLE OF VARCHAR2(100);
    TYPE t_type      IS TABLE OF VARCHAR2(50);

    v_medicine t_medicine := t_medicine(
        'Амлодипин','Лизиноприл','Метопролол','Эналаприл','Бисопролол',
        'Омепразол','Пантопразол','Де-Нол','Алмагель','Ранитидин',
        'Ибупрофен','Диклофенак','Кеторол','Нимесулид','Мелоксикам',
        'Амоксициллин','Азитромицин','Цефтриаксон','Доксициклин','Кларитромицин',
        'Но-шпа','Папаверин','Дротаверин','Спазмалгон','Тримедат',
        'Цетиризин','Лоратадин','Супрастин','Эриус','Зиртек',
        'Аторвастатин','Розувастатин','Симвастатин','Ловастатин','Фенофибрат',
        'Метформин','Глибенкламид','Глюкофаж','Сиофор','Янувия',
        'Витамин D3','Кальций Д3 Никомед','Магне B6','Витамин С','Мультитабс',
        'Валерьяна','Новопассит','Персен','Глицин','Афобазол'
    );

    v_dosage t_dosage := t_dosage(
        '5 мг','10 мг','25 мг','50 мг','100 мг','200 мг','250 мг','500 мг',
        '1000 мг','5 мл','10 мл','1 таблетка','2 таблетки','0,5 мг','0,25 мг'
    );

    v_frequency t_frequency := t_frequency(
        '1 раз в день утром',
        '2 раза в день (утром и вечером)',
        '3 раза в день до еды',
        '3 раза в день после еды',
        '4 раза в день через равные промежутки',
        '1 раз в день на ночь',
        '2 раза в день во время еды',
        'При болях, не более 3 раз в день',
        '1 раз в неделю',
        'Однократно'
    );

    v_type t_type := t_type(
        'Таблетки','Капсулы','Сироп','Инъекция','Мазь','Капли','Спрей','Свечи'
    );

    v_appt_id   NUMBER;
    v_pat_id    NUMBER;
    v_doc_id    NUMBER;
    v_issue_dt  DATE;
    v_duration  NUMBER;

BEGIN
    FOR i IN 1..900 LOOP
        -- Выбираем случайный завершённый приём
        BEGIN
            SELECT APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE
            INTO v_appt_id, v_pat_id, v_doc_id, v_issue_dt
            FROM (
                SELECT APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE
                FROM APPOINTMENTS
                WHERE STATUS = 'Завершён'
                ORDER BY DBMS_RANDOM.VALUE
            )
            WHERE ROWNUM = 1;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                SELECT APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE
                INTO v_appt_id, v_pat_id, v_doc_id, v_issue_dt
                FROM (
                    SELECT APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE
                    FROM APPOINTMENTS
                    ORDER BY DBMS_RANDOM.VALUE
                )
                WHERE ROWNUM = 1;
        END;

        v_duration := MOD(i * 7, 28) + 3; -- 3-30 дней

        INSERT INTO PRESCRIPTIONS (
            PRESCRIPTION_ID, APPOINTMENT_ID, PATIENT_ID, DOCTOR_ID,
            MEDICINE_NAME, DOSAGE, FREQUENCY, DURATION_DAYS,
            ISSUE_DATE, EXPIRY_DATE, MEDICINE_TYPE, NOTES, IS_DISPENSED
        ) VALUES (
            SEQ_PRESCRIPTIONS.NEXTVAL,
            v_appt_id,
            v_pat_id,
            v_doc_id,
            v_medicine(MOD(i-1, v_medicine.COUNT) + 1),
            v_dosage(MOD(i-1, v_dosage.COUNT) + 1),
            v_frequency(MOD(i-1, v_frequency.COUNT) + 1),
            v_duration,
            v_issue_dt,
            v_issue_dt + v_duration + 30,
            v_type(MOD(i-1, v_type.COUNT) + 1),
            CASE MOD(i, 4)
                WHEN 0 THEN 'Принимать строго по схеме, не прерывать курс'
                WHEN 1 THEN 'Хранить в прохладном тёмном месте'
                WHEN 2 THEN 'Не сочетать с алкоголем'
                ELSE NULL
            END,
            CASE WHEN MOD(i, 3) = 0 THEN 'Y' ELSE 'N' END
        );

        IF MOD(i, 100) = 0 THEN
            COMMIT;
        END IF;
    END LOOP;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Рецепты вставлены: 900 строк');
END;
/

PROMPT Prescriptions: 900 строк вставлено!
