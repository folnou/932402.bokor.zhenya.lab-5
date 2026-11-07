"use strict";

/**
 * Лабораторная работа №5. DOM и взаимодействие с элементами страницы
 * Вариант 6. Тема: «Любитель кино и сериалов» (список фильмов к просмотру)
 */

// ---------- Константы ----------
const STORAGE_FILMS = "cinema_films";
const STORAGE_THEME = "cinema_theme";
const STORAGE_TABLE_HIDDEN = "cinema_tableHidden";

const STATUS_PLANNED = "к просмотру";
const STATUS_WATCHED = "просмотрено";

const MIN_YEAR = 1888;
const MAX_YEAR = 2100;

// Фильмы по умолчанию (показываются при первом запуске, пока в localStorage ничего нет)
const DEFAULT_FILMS = [
    { id: "d1", title: "Зелёный фонарь", year: 2011, status: STATUS_PLANNED },
    { id: "d2", title: "Всеведущий читатель", year: 2025, status: STATUS_WATCHED },
    { id: "d3", title: "Живая сталь", year: 2011, status: STATUS_WATCHED },
    { id: "d4", title: "Колобок", year: 2026, status: STATUS_PLANNED }
];

// Текущее состояние списка (синхронизируется с localStorage)
let films = [];

// ---------- Вспомогательные функции ----------

/** Поиск элемента по id с проверкой существования. Возвращает элемент или null. */
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.error("Элемент #" + id + " не найден на странице");
    }
    return el;
}

/** Поиск первого элемента по CSS-селектору с проверкой существования. */
function qs(selector, parent) {
    const el = (parent || document).querySelector(selector);
    if (!el) {
        console.error("Элемент по селектору «" + selector + "» не найден");
    }
    return el;
}

/** Безопасное чтение из localStorage (может быть недоступен или содержать мусор). */
function loadFromStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) {
            return fallback;
        }
        return JSON.parse(raw);
    } catch (error) {
        console.error("Ошибка чтения localStorage (" + key + "):", error);
        return fallback;
    }
}

/** Безопасная запись в localStorage. */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Ошибка записи в localStorage (" + key + "):", error);
    }
}

/** Показывает сообщение пользователю (тип: "error" или "success"). */
function showMessage(text, type) {
    const box = getEl("formMessage");
    if (!box) {
        return;
    }
    box.textContent = text;
    box.classList.remove("error", "success");
    if (type) {
        box.classList.add(type);
    }
}

/** Проверяет, что загруженные из localStorage данные — корректный массив фильмов. */
function isValidFilmList(data) {
    return Array.isArray(data) && data.every(function (f) {
        return f && typeof f.title === "string" && typeof f.year === "number" &&
            (f.status === STATUS_PLANNED || f.status === STATUS_WATCHED);
    });
}

// ---------- Таблица ----------

/** Создаёт строку <tr> для фильма с ячейками <td>. */
function createRow(film) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", film.id);

    const tdTitle = document.createElement("td");
    tdTitle.textContent = film.title;

    const tdYear = document.createElement("td");
    tdYear.textContent = film.year;

    const tdStatus = document.createElement("td");
    const statusBtn = document.createElement("button");
    statusBtn.type = "button";
    statusBtn.className = "status-btn";
    statusBtn.setAttribute("title", "Нажмите, чтобы сменить статус");
    tdStatus.appendChild(statusBtn);

    const tdAction = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Удалить";
    deleteBtn.setAttribute("aria-label", "Удалить фильм " + film.title);
    tdAction.appendChild(deleteBtn);

    tr.append(tdTitle, tdYear, tdStatus, tdAction);
    applyStatus(tr, film.status);
    return tr;
}

/** Меняет текст, класс и атрибут строки в зависимости от статуса. */
function applyStatus(tr, status) {
    const btn = tr.querySelector(".status-btn");
    if (!btn) {
        console.error("В строке нет кнопки статуса");
        return;
    }
    const watched = status === STATUS_WATCHED;
    btn.textContent = status;
    btn.classList.toggle("status-watched", watched);
    btn.classList.toggle("status-planned", !watched);
    btn.setAttribute("aria-pressed", String(watched));
    tr.classList.toggle("watched", watched);
}

/** Обновляет счётчик и сообщение «Список пуст». */
function updateStats() {
    const stats = getEl("filmStats");
    const note = getEl("emptyNote");
    const rows = document.querySelectorAll("#filmsBody tr");
    const watchedCount = document.querySelectorAll("#filmsBody tr.watched").length;

    if (stats) {
        stats.textContent = "Всего фильмов: " + rows.length + ", просмотрено: " + watchedCount;
    }
    if (note) {
        note.hidden = rows.length > 0;
    }
}

/** Добавляет фильм: в массив, в DOM и в localStorage. */
function addFilm(title, year, status) {
    const body = getEl("filmsBody");
    if (!body) {
        return;
    }
    const film = {
        id: Date.now() + "-" + Math.floor(Math.random() * 1000),
        title: title,
        year: year,
        status: status
    };
    films.push(film);
    body.appendChild(createRow(film));
    saveToStorage(STORAGE_FILMS, films);
    updateStats();
}

/** Удаляет один фильм по id. */
function removeFilm(id) {
    const row = document.querySelector('#filmsBody tr[data-id="' + id + '"]');
    if (row) {
        row.remove();
    } else {
        console.error("Строка с id " + id + " не найдена");
    }
    films = films.filter(function (f) {
        return f.id !== id;
    });
    saveToStorage(STORAGE_FILMS, films);
    updateStats();
}

/** Переключает статус фильма «к просмотру» ↔ «просмотрено». */
function toggleStatus(id) {
    const film = films.find(function (f) {
        return f.id === id;
    });
    const row = document.querySelector('#filmsBody tr[data-id="' + id + '"]');
    if (!film || !row) {
        console.error("Фильм с id " + id + " не найден");
        return;
    }
    film.status = film.status === STATUS_WATCHED ? STATUS_PLANNED : STATUS_WATCHED;
    applyStatus(row, film.status);
    saveToStorage(STORAGE_FILMS, films);
    updateStats();
}

/** Удаляет все строки из <tbody>. */
function clearFilms() {
    const body = getEl("filmsBody");
    if (!body) {
        return;
    }
    if (films.length === 0) {
        showMessage("Список уже пуст.", "error");
        return;
    }
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
    films = [];
    saveToStorage(STORAGE_FILMS, films);
    updateStats();
    showMessage("Список очищен.", "success");
}

/** Отрисовывает все фильмы из массива (при загрузке страницы). */
function renderFilms() {
    const body = getEl("filmsBody");
    if (!body) {
        return;
    }
    films.forEach(function (film) {
        body.appendChild(createRow(film));
    });
    updateStats();
}

// ---------- Обработчики формы ----------

function handleSubmit(event) {
    event.preventDefault();

    const titleInput = getEl("filmTitle");
    const yearInput = getEl("filmYear");
    const statusSelect = getEl("filmStatus");
    if (!titleInput || !yearInput || !statusSelect) {
        return;
    }

    const title = titleInput.value.trim();
    const year = Number(yearInput.value);

    if (title === "") {
        showMessage("Введите название фильма.", "error");
        titleInput.focus();
        return;
    }
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
        showMessage("Введите корректный год (" + MIN_YEAR + "–" + MAX_YEAR + ").", "error");
        yearInput.focus();
        return;
    }

    addFilm(title, year, statusSelect.value);
    showMessage("Фильм «" + title + "» добавлен.", "success");
    titleInput.value = "";
    yearInput.value = "";
    titleInput.focus();
}

function handleTableClick(event) {
    // Делегирование событий: слушаем клики на <tbody>, определяем нажатую кнопку
    const row = event.target.closest("tr");
    if (!row) {
        return;
    }
    const id = row.getAttribute("data-id");
    if (event.target.closest(".delete-btn")) {
        removeFilm(id);
    } else if (event.target.closest(".status-btn")) {
        toggleStatus(id);
    }
}

// ---------- Скрытие / показ блоков ----------

/** Скрывает или показывает таблицу; сохраняет состояние. */
function setTableHidden(hidden) {
    const wrap = getEl("tableWrap");
    const btn = getEl("toggleTableBtn");
    if (!wrap || !btn) {
        return;
    }
    wrap.classList.toggle("hidden", hidden);
    btn.textContent = hidden ? "Показать таблицу" : "Скрыть таблицу";
    saveToStorage(STORAGE_TABLE_HIDDEN, hidden);
}

function handleToggleTable() {
    const wrap = getEl("tableWrap");
    if (!wrap) {
        return;
    }
    setTableHidden(!wrap.classList.contains("hidden"));
}

/** Клик по заголовку «Любимые жанры» скрывает/показывает текст под ним. */
function initAsideToggle() {
    const title = qs("aside h3");
    const text = qs("aside p");
    if (!title || !text) {
        return;
    }
    title.setAttribute("title", "Нажмите, чтобы скрыть/показать");
    title.addEventListener("click", function () {
        text.classList.toggle("collapsed");
    });
}

// ---------- Тема ----------

/** Применяет тему: "light" или "dark". */
function applyTheme(theme) {
    const btn = getEl("themeToggle");
    document.body.classList.toggle("light-theme", theme === "light");
    document.body.setAttribute("data-theme", theme);
    if (btn) {
        btn.textContent = theme === "light" ? "Тёмная тема" : "Светлая тема";
    }
}

function handleThemeToggle() {
    const newTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    applyTheme(newTheme);
    saveToStorage(STORAGE_THEME, newTheme);
}

// ---------- Инициализация ----------

function init() {
    // Восстановление темы
    const savedTheme = loadFromStorage(STORAGE_THEME, "dark");
    applyTheme(savedTheme === "light" ? "light" : "dark");

    // Восстановление списка фильмов
    const savedFilms = loadFromStorage(STORAGE_FILMS, null);
    if (savedFilms === null) {
        films = DEFAULT_FILMS.map(function (f) { return Object.assign({}, f); });
        saveToStorage(STORAGE_FILMS, films);
    } else if (isValidFilmList(savedFilms)) {
        films = savedFilms;
    } else {
        console.error("Данные в localStorage повреждены, список сброшен");
        films = [];
        saveToStorage(STORAGE_FILMS, films);
    }
    renderFilms();

    // Восстановление состояния таблицы (скрыта/показана)
    setTableHidden(loadFromStorage(STORAGE_TABLE_HIDDEN, false) === true);

    // Подписка на события (с проверкой существования элементов)
    const form = getEl("filmForm");
    if (form) {
        form.addEventListener("submit", handleSubmit);
    }
    const clearBtn = getEl("clearBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearFilms);
    }
    const toggleBtn = getEl("toggleTableBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", handleToggleTable);
    }
    const themeBtn = getEl("themeToggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", handleThemeToggle);
    }
    const body = getEl("filmsBody");
    if (body) {
        body.addEventListener("click", handleTableClick);
    }
    initAsideToggle();

    // Пример querySelectorAll: подсветка пункта меню при наведении не нужна,
    // но выводим в консоль количество ссылок навигации
    const navLinks = document.querySelectorAll("nav a");
    console.log("Ссылок в меню: " + navLinks.length);
}

init();
