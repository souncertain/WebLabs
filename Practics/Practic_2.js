const express = require('express');
const fs = require('fs');
const app = express();
const path = 'Nails.txt';

app.use(express.urlencoded({ extended: true }));

const readAppointments = () => {
    if (!fs.existsSync(path)) return [];
    const data = fs.readFileSync(path, 'utf8').trim();
    return data ? data.split('\n').map(line => {
        const [name, date, time] = line.split(' - ');
        return { name, date, time };
    }) : [];
};

const writeAppointments = (appointments) => {
    const data = appointments.map(a => `${a.name} - ${a.date} - ${a.time}`).join('\n');
    fs.writeFileSync(path, data, 'utf8');
};

app.get('/', function (req, res) {
    res.send(`
        <form action='/thisNails' method='POST'>
            <label>Имя:</label><br>
            <input type='text' name='name' required/><br>
            <label>Дата (YYYY-MM-DD):</label><br>
            <input type='date' name='date' required/><br>
            <label>Время (HH:MM):</label><br>
            <input type='time' name='time' required/><br><br>

            <button type='submit' name='action' value='signUp'>Записаться</button><br><br>
                 </form>
        <form action='/all' method='GET'>
            <button type='submit'>Список записанных</button><br><br>
        </form>
    `);
});

const isOverlapping = (newDate, newTime, appointments) => {
    return appointments.some(({ date, time }) => date === newDate && time === newTime);
};

app.post('/thisNails', function (req, res) {
    const { name, date, time, action } = req.body;

    if (action === 'signUp') {
        const appointments = readAppointments();

        // Проверка на пересечение
        if (isOverlapping(date, time, appointments)) {
            return res.send(`<h2 style="color: red;">Ошибка: Данное время уже занято!</h2>
                <a href="/">Назад</a>`);
        }

        // Добавление новой записи
        appointments.push({ name, date, time });
        writeAppointments(appointments);

        res.send(`<h1>Записался: ${name}, Дата: ${date}, Время: ${time}</h1>
            <a href="/">Назад</a>`);
    } else if (action === 'nailsList') {
        res.redirect('/all');
    }
});

app.get('/all', function (req, res) {
    const appointments = readAppointments();
    const today = new Date().toISOString().split('T')[0];

    const futureAppointments = appointments.filter(({ date }) => date >= today);

    if (futureAppointments.length === 0) {
        return res.send(`<h2>Нет записей на будущее</h2>
            <a href="/">Назад</a>`);
    }

    let responseText = '<h1>Список записанных</h1>';
    responseText += futureAppointments
        .map(({ name, date, time }) =>
            `${date} ${time} - ${name} 
            <a href="/delete?date=${date}&time=${time}">Удалить</a>`)
        .join('<br>');

    responseText += `<br><br><a href="/">Назад</a>`;
    res.send(responseText);
});


app.get('/delete', (req, res) => {
    const { date, time } = req.query;
    let appointments = readAppointments();

    appointments = appointments.filter(a => !(a.date === date && a.time === time));
    writeAppointments(appointments);

    res.redirect('/all');
});

app.listen(3000, () => console.log('Server running on port 3000'));
