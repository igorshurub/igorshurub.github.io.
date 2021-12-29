function showAlert(msg, category = 'success') {
    let alerts = document.querySelector('.alerts');
    let newAlertElement = document.querySelector('.alert-template').cloneNode(true);
    newAlertElement.querySelector('.msg').innerHTML = msg;
    if (category == 'success') {
        newAlertElement.classList.add('alert-success')
    } else {
        newAlertElement.classList.add('alert-danger')
    }
    newAlertElement.classList.remove('d-none');
    alerts.append(newAlertElement);
}

function createTaskElement(form) {
    let newTaskElement = document.getElementById('task-template').cloneNode(true);
    newTaskElement.id = form.elements['task-id'].value;//получаем значения task-id
    newTaskElement.querySelector('.task-name').innerHTML = form.elements['name'].value;
    newTaskElement.querySelector('.task-description').innerHTML = form.elements['description'].value;
    newTaskElement.classList.remove('d-none');
    for (let btn of newTaskElement.querySelectorAll('.move-btn')) {
        btn.onclick = moveBtnHandler;
    }

    return newTaskElement;
}


function updateTask(form) {
    let taskElement = document.getElementById(form.elements['task-id'].value);
    taskElement.querySelector('.task-name').innerHTML = form.elements['name'].value;
    taskElement.querySelector('.task-description').innerHTML = form.elements['description'].value;

}

function actionTaskBtnHandler(event) {
    let action, form, listElement, tasksCounterElement, alertMsg;
    form = event.target.closest('.modal').querySelector('form');
    action = form.elements['action'].value;// действие которое мы выполняем

// если добавляем задачу, вызываем асинхронную функцию  postTask
    if (action == 'create') {
        postTask(form)
            .then(function (json) {
                listElement = document.getElementById(`${form.elements['column'].value}-list`);
                form.elements['task-id'].value = json.id;
                listElement.append(createTaskElement(form));

                tasksCounterElement = listElement.closest('.card').querySelector('.tasks-counter');
                tasksCounterElement.innerHTML = Number(tasksCounterElement.innerHTML) + 1;
            })

            .then(result => showAlert(`Задача ${form.elements['name'].value} была успешно создана!`))
            .catch(error => showAlert(error, 'danger'));// обработка ошибки
// если редактируем вызываем асинхронную функцию putTask
    } else if (action == 'edit') {
        putTask(new FormData(form), form.elements['task-id'].value)
            .then(result => updateTask(form))
            .then(result => showAlert(`Задача ${form.elements['name'].value} была успешно обновлена!`))
            .catch(error => showAlert(error, 'danger'));// обработка ошибки
    }

}

function setFormValues(form, taskId) {
    let taskElement = document.getElementById(taskId);
    form.elements['name'].value = taskElement.querySelector('.task-name').innerHTML;
    form.elements['description'].value = taskElement.querySelector('.task-description').innerHTML;
    form.elements['task-id'].value = taskId;
}
// функция обновления формы
function resetForm(form) {
    form.reset();
    form.querySelector('select').closest('.mb-3').classList.remove('d-none');
    form.elements['name'].classList.remove('form-control-plaintext');
    form.elements['description'].classList.remove('form-control-plaintext');
}

function prepareModalContent(event) {
    let form = event.target.querySelector('form');
    resetForm(form);

    let action = event.relatedTarget.dataset.action || 'create';

    form.elements['action'].value = action;
    event.target.querySelector('.modal-title').innerHTML = titles[action];
    event.target.querySelector('.action-task-btn').innerHTML = actionBtnText[action];

    if (action == 'edit' || action == 'show') {
        setFormValues(form, event.relatedTarget.closest('.task').id);
        event.target.querySelector('select').closest('.mb-3').classList.add('d-none');
    }

    if (action == 'show') {
        form.elements['name'].classList.add('form-control-plaintext');
        form.elements['description'].classList.add('form-control-plaintext');
    }
}

function deleteTaskBtnHandler(event) {
    let form = event.target.closest('.modal').querySelector('form');
    //вызываем асинхронную функцию удаления задачи
    deleteTask(form.elements['task-id'].value)
        .then(function () {
            let taskElement = document.getElementById(form.elements['task-id'].value);

            let tasksCounterElement = taskElement.closest('.card').querySelector('.tasks-counter');
            tasksCounterElement.innerHTML = Number(tasksCounterElement.innerHTML) - 1;

            taskElement.remove();
        })
        .catch(error => showAlert(error, 'danger'))// обработка ошибки
}

function moveBtnHandler(event) {


    let taskElement = event.target.closest('.task');
    let listElement = taskElement.closest('ul');
    let targetListElement = document.getElementById(listElement.id == 'to-do-list' ? 'done-list' : 'to-do-list');
    //определяем статус задачи, к какому списку будет отнесена с помощью тернарного оператора
    let status = listElement.id == 'to-do-list' ? 'done' : 'to-do';
    let formData = new FormData();
    formData.append('status', status);
    //вызываем асинхронную функцию изменения задачи putTask
    putTask(formData, taskElement.id)
        .then(function () {
            let tasksCounterElement = taskElement.closest('.card').querySelector('.tasks-counter');
            tasksCounterElement.innerHTML = Number(tasksCounterElement.innerHTML) - 1;

            targetListElement.append(taskElement);

            tasksCounterElement = targetListElement.closest('.card').querySelector('.tasks-counter');
            tasksCounterElement.innerHTML = Number(tasksCounterElement.innerHTML) + 1;
        })
        .catch(error => showAlert(error, 'danger'));// обработка ошибки

}
// счетчик задач
let taskCounter = 0;

let titles = {
    'create': 'Создание новой задачи',
    'show': 'Просмотр задачи',
    'edit': 'Редактирование задачи'
};

let actionBtnText = {
    'create': 'Создать',
    'show': 'Ок',
    'edit': 'Сохранить'
};

//Тестовый ключ для доступа к API
let apiKey = '50d2199a-42dc-447d-81ed-d68a443b697e';
// Адрес API для взаимодействия с сервером
let apiUrl = 'http://tasks-api.std-900.ist.mospolytech.ru//api/tasks';


//асинхронная функция загрузки задачи
async function getTasks() {
    let url = new URL(apiUrl); //запишем в переменную наш api
    url.searchParams.set('api_key', apiKey); //задаем значение api_key связанное с значением устанавленного параметра apiKey
    let response = await fetch(url);//используем метод fetch, для получения содержимого по адресу url
    // браузер  начинает запрос и возвращает промис, который внешний код использует для получения результата

    let json = await response.json();// получаем тело ответа в формате JSON
    // если HTTP-статус в диапазоне 200-299 возвращаем Promise выполненный с переданным значением(ответом), 
    // если нет, выдаем ошибку
    if (!json.error) {
        return Promise.resolve(json);
    } else {
        return Promise.reject(json.error);
    }
}

//асинхронная функция создания новой задачи
async function postTask(form) {
    let url = new URL(apiUrl);
    url.searchParams.set('api_key', apiKey);

    let formData = new FormData(form);

    formData.set('status', formData.get('column'));
    formData.set('desc', formData.get('description'))

    formData.delete('task-id');
    formData.delete('action');
    formData.delete('description');
    formData.delete('column');

     //используем метод fetch с options для  метода POST
    let response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    
    let json = await response.json();// получаем тело ответа в формате JSON
    // если HTTP-статус в диапазоне 200-299 возвращаем Promise выполненный с переданным значением(ответом), 
    // если нет, выдаем ошибку
    if (!json.error) {
        return Promise.resolve(json);
    } else {
        return Promise.reject(json.error);
    }
}
//асинхронная функция изменения задачи
async function putTask(form, id) {
    let url = new URL(apiUrl + `/${id}`);//берем api и добавляем id, для того чтобы идентифицировать действие
    url.searchParams.set('api_key', apiKey);//задаем значение api_key связанное с значением устанавленного параметра apiKey

    let formData = form;

    
    if (formData.get('column')) {
        formData.set('desc', formData.get('description'));

        formData.delete('action');
        formData.delete('description');
        formData.delete('column');
    }

    //Удаление неизмененных параметров
    let taskElement = document.getElementById(id);
    let oldName = taskElement.querySelector('.task-name').innerHTML;
    let oldDescription = taskElement.querySelector('.task-description').innerHTML;

    if (oldName == formData.get('name')) formData.delete('name');
    if (oldDescription == formData.get('desc')) formData.delete('desc');

    //используем метод fetch, с options для  метода PUT
    let response = await fetch(url, {
        method: 'PUT',
        body: formData
    });

    let json = await response.json();// получаем тело ответа в формате JSON
    // если HTTP-статус в диапазоне 200-299 возвращаем Promise выполненный с переданным значением, 
    // если нет, выдаем ошибку
    if (!json.error) {
        return Promise.resolve(json);
    } else {
        return Promise.reject(json.error);
    }
}
//асинхронная функция удаления задачи
async function deleteTask(id) {
    let url = new URL(apiUrl + `/${id}`);//берем api и добавляем id, для того чтобы идентифицировать действие
    url.searchParams.set('api_key', apiKey); //задаем значение api_key связанное с значением устанавленного параметра apiKey
    //используем метод fetch, с options для  метода DELETE
    let response = await fetch(url, {
        method: 'DELETE'
    });

    let json = await response.json();// получаем тело ответа
    // если HTTP-статус в диапазоне 200-299 возвращаем Promise выполненный с переданным значением, 
    // если нет, выдаем ошибку
    if (!json.error) {
        return Promise.resolve(json);
    } else {
        return Promise.reject(json.error)
    }
}

//функция для отображения задач, которые приходят с сервера
function drawTasks(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        let listElement = document.getElementById(`${tasks[i].status}-list`);
        let newTaskElement = document.getElementById('task-template').cloneNode(true);
        newTaskElement.id = tasks[i].id;
        newTaskElement.querySelector('.task-name').innerHTML = tasks[i].name;
        newTaskElement.querySelector('.task-description').innerHTML = tasks[i].desc;
        newTaskElement.classList.remove('d-none');
        for (let btn of newTaskElement.querySelectorAll('.move-btn')) {
            btn.onclick = moveBtnHandler;
        }
        let tasksCounterElement = listElement.closest('.card').querySelector('.tasks-counter');
        tasksCounterElement.innerHTML = Number(tasksCounterElement.innerHTML) + 1;
        listElement.append(newTaskElement);

    }

}

window.onload = function () {
    //вызываем асинхронную функцию getTasks
    getTasks().then(
        result => drawTasks(result.tasks),
        error => showAlert(error, 'danger')
    );
    document.querySelector('.action-task-btn').onclick = actionTaskBtnHandler;
    document.getElementById('task-modal').addEventListener('show.bs.modal', prepareModalContent);
    document.getElementById('remove-task-modal').addEventListener('show.bs.modal', function (event) {
        let taskElement = event.relatedTarget.closest('.task');
        let form = event.target.querySelector('form');
        form.elements['task-id'].value = taskElement.id;
        event.target.querySelector('.task-name').innerHTML = taskElement.querySelector('.task-name').innerHTML;
    });
    document.querySelector('.delete-task-btn').onclick = deleteTaskBtnHandler;
    for (let btn of document.querySelectorAll('.move-btn')) {
        btn.onclick = moveBtnHandler;
    }

}