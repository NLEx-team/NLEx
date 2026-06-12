# testbd — База данных сотрудников

## Требования
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/)

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone <url-репозитория>
cd testbd-docker

# 2. Создать файл с паролями из примера
cp .env.example .env
# Отредактировать .env — задать свои пароли

# 3. Запустить контейнеры
docker-compose up -d

# 4. Подождать 10-15 секунд пока БД инициализируется
```

## Подключение

### pgAdmin (браузер)
- Открыть: http://localhost:5050
- Email и пароль — из вашего `.env` (`PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`)
- Добавить сервер: хост `db`, порт `5432`, пользователь и пароль — из `.env`

### Прямое подключение
| Параметр | Значение |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `testbd` |
| User | из `.env` → `POSTGRES_USER` |
| Password | из `.env` → `POSTGRES_PASSWORD` |

## Структура БД

### Таблицы
| Таблица | Записей | Описание |
|---|---|---|
| `users` | 1000 | Сотрудники |
| `projects` | ~700 | Проекты |
| `salary_history` | ~2700 | История изменений зарплат |
| `vacations` | ~1700 | Отпуска и больничные |

### Представления (Views)
- `v_employees` — полная сводка по сотруднику (возраст, стаж, итоговое вознаграждение)
- `v_active_projects` — активные проекты с количеством дней в работе
- `v_otdely` — статистика по отделам
- `v_salary_history` — история зарплат с процентом роста
- `v_vacations` — все отпуска и больничные

### Роли
| Роль | Права |
|---|---|
| `readonly_user` | Только чтение всех таблиц и представлений |
| `hr_user` | Чтение + редактирование `users` и `vacations` |
| `dev_user` | Полный доступ (SELECT / INSERT / UPDATE / DELETE) |

> Пароли ролей задаются в `schema.sql`. Для продакшена замените их перед деплоем.

## Команды

```bash
# Запустить
docker-compose up -d

# Остановить
docker-compose down

# Остановить и удалить данные (полный сброс)
docker-compose down -v

# Посмотреть логи
docker-compose logs db

# Подключиться к БД через терминал
docker exec -it testbd_postgres psql -U postgres -d testbd
```

## Сброс БД

Если нужно пересоздать БД с нуля:

```bash
docker-compose down -v
docker-compose up -d
```
