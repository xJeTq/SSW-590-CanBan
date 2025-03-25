document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("taskModal");
    const plusBtn = document.querySelector(".plusminus button:first-child");
    const closeBtn = document.querySelector(".close");
    const taskForm = document.getElementById("taskForm");
    const dueDateInput = document.getElementById("taskDueDate");
    const noDueDateCheckbox = document.getElementById("noDueDate");
    const formHeading = document.querySelector(".modal-content h2");
    const submitButton = taskForm.querySelector("button[type='submit']");

    let editingTaskId = null;

    if (dueDateInput) {
        dueDateInput.addEventListener("keydown", function (e) {
            e.preventDefault();
        });
    }

    plusBtn.addEventListener("click", function () {
        resetForm();
        formHeading.textContent = "Add Task";
        submitButton.textContent = "Add Task";
        modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    if (noDueDateCheckbox) {
        noDueDateCheckbox.addEventListener("change", function () {
            if (this.checked) {
                dueDateInput.style.display = "none";
                dueDateInput.value = "";
            } else {
                dueDateInput.style.display = "block";
            }
        });
    }

    const taskData = {};

    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("taskTitle").value;
        const category = document.getElementById("taskCategory").value;
        const description = document.getElementById("taskDescription").value;
        const course = document.getElementById("taskCourse").value;
        const color = document.getElementById("taskColor").value;

        let dueDate;
        let dueDateTimestamp = Infinity;

        if (noDueDateCheckbox && noDueDateCheckbox.checked) {
            dueDate = "No Due Date";
        } else {
            const dateString = dueDateInput.value;
            if (dateString) {
                const [year, month, day] = dateString.split('-').map(Number);
                const dateObject = new Date(year, month - 1, day);
                dueDateTimestamp = dateObject.getTime();
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                dueDate = dateObject.toLocaleDateString('en-US', options);
            } else {
                dueDate = "Not specified";
            }
        }

        if (editingTaskId) {
            updateTask(editingTaskId, title, category, description, course, color, dueDate, dueDateTimestamp);
            editingTaskId = null;
        } else {
            addTask(title, category, description, course, color, dueDate, dueDateTimestamp);
        }

        modal.style.display = "none";
        resetForm();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Task";
    deleteButton.classList.add("delete-btn");
    deleteButton.style.backgroundColor = "#dc3545";
    deleteButton.style.marginTop = "10px";
    deleteButton.style.display = "none";
    taskForm.appendChild(deleteButton);

    deleteButton.addEventListener("click", function () {
        if (editingTaskId) {
            document.getElementById(editingTaskId).remove();
            delete taskData[editingTaskId];
            modal.style.display = "none";
            resetForm();
        }
    });

    function resetForm() {
        taskForm.reset();
        if (dueDateInput) dueDateInput.style.display = "block";
        editingTaskId = null;
        formHeading.textContent = "Add Task";
        submitButton.textContent = "Add Task";
        deleteButton.style.display = "none";
    }

    function generateUniqueId() {
        return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function addTask(title, category, description, course, color, dueDate, dueDateTimestamp) {
        const column = document.querySelector(`.column.${category}`);

        if (!column) {
            console.error("Invalid category:", category);
            return;
        }

        const taskId = generateUniqueId();

        const taskItem = document.createElement("div");
        taskItem.classList.add("task");
        taskItem.id = taskId;
        taskItem.draggable = true;
        taskItem.style.borderLeftColor = color;

        taskItem.innerHTML = `
            <strong>${title}</strong>
            <p>${description}</p>
            <small>Course: ${course}</small><br>
            <small>Due: ${dueDate}</small>
        `;

        const editButton = document.createElement("button");
        editButton.classList.add("edit-btn");
        editButton.innerHTML = "✏️";
        editButton.title = "Edit Task";

        taskItem.appendChild(editButton);

        taskData[taskId] = {
            element: taskItem,
            title: title,
            category: category,
            description: description,
            course: course,
            color: color,
            dueDate: dueDate,
            dueDateTimestamp: dueDateTimestamp
        };

        column.appendChild(taskItem);

        editButton.addEventListener("click", function (e) {
            e.stopPropagation();
            openEditModal(taskId);
        });

        sortTasksByDueDate(column);
    }

    function updateTask(taskId, title, category, description, course, color, dueDate, dueDateTimestamp) {
        const task = document.getElementById(taskId);
        const oldCategory = task.parentElement.classList[1];
        const newColumn = document.querySelector(`.column.${category}`);

        if (!task || !newColumn) {
            console.error("Task or column not found");
            return;
        }

        taskData[taskId].title = title;
        taskData[taskId].category = category;
        taskData[taskId].description = description;
        taskData[taskId].course = course;
        taskData[taskId].color = color;
        taskData[taskId].dueDate = dueDate;
        taskData[taskId].dueDateTimestamp = dueDateTimestamp;

        task.style.borderLeftColor = color;
        task.querySelector("strong").textContent = title;
        task.querySelector("p").textContent = description;
        task.querySelectorAll("small")[0].textContent = `Course: ${course}`;
        task.querySelectorAll("small")[1].textContent = `Due: ${dueDate}`;

        if (oldCategory !== category) {
            newColumn.appendChild(task);
            sortTasksByDueDate(newColumn);
        } else {
            sortTasksByDueDate(task.parentElement);
        }
    }

    function openEditModal(taskId) {
        const taskInfo = taskData[taskId];
        if (!taskInfo) return;

        editingTaskId = taskId;

        document.getElementById("taskTitle").value = taskInfo.title;
        document.getElementById("taskCategory").value = taskInfo.category;
        document.getElementById("taskDescription").value = taskInfo.description;
        document.getElementById("taskCourse").value = taskInfo.course;
        document.getElementById("taskColor").value = taskInfo.color;

        if (taskInfo.dueDate === "No Due Date" && noDueDateCheckbox) {
            noDueDateCheckbox.checked = true;
            dueDateInput.style.display = "none";
        } else if (taskInfo.dueDateTimestamp !== Infinity) {
            const date = new Date(taskInfo.dueDateTimestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dueDateInput.value = `${year}-${month}-${day}`;
        }

        formHeading.textContent = "Edit Task";
        submitButton.textContent = "Update Task";
        deleteButton.style.display = "block";

        modal.style.display = "flex";
    }

    function sortTasksByDueDate(column) {
        const tasks = Array.from(column.querySelectorAll('.task'));

        tasks.sort((a, b) => {
            const dateA = taskData[a.id]?.dueDateTimestamp || Infinity;
            const dateB = taskData[b.id]?.dueDateTimestamp || Infinity;
            return dateA - dateB;
        });

        tasks.forEach(task => task.remove());
        tasks.forEach(task => column.appendChild(task));
    }

    enableDragAndDrop();

    function enableDragAndDrop() {
        document.addEventListener('dragstart', function (event) {
            if (event.target.classList.contains('task')) {
                event.dataTransfer.setData('text/plain', event.target.id);
                event.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', function (event) {
            if (event.target.classList.contains('task')) {
                event.target.classList.remove('dragging');
            }
        });

        const columns = document.querySelectorAll('.column');
        columns.forEach(column => {
            column.addEventListener('dragover', function (event) {
                event.preventDefault();
                this.classList.add('dragover');
            });

            column.addEventListener('dragleave', function () {
                this.classList.remove('dragover');
            });

            column.addEventListener('drop', function (event) {
                event.preventDefault();
                this.classList.remove('dragover');
                const draggedTaskId = event.dataTransfer.getData('text/plain');
                const draggedTask = document.getElementById(draggedTaskId);

                if (draggedTask) {
                    if (taskData[draggedTaskId]) {
                        taskData[draggedTaskId].category = this.classList[1];
                    }

                    this.appendChild(draggedTask);
                    sortTasksByDueDate(this);
                }
            });
        });
    }
});