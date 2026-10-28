const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusElement = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");

let notes = [];

/**
 * Makes an HTTP request and handles unsuccessful responses.
 * The same function is reused by GET, POST, and DELETE.
 */
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`The server returned status ${response.status}.`);
    }

    // DELETE responses may have no body, so handle them separately.
    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        if (options.method !== "DELETE") {
            throw new Error("The server returned an invalid response.");
        }
    }

    return { data, status: response.status };
}

/**
 * Displays a status message using textContent.
 */
function showStatus(message, type = "") {
    statusElement.textContent = message;
    statusElement.className = "status";

    if (type) {
        statusElement.classList.add(type);
    }
}

/**
 * Displays the empty state when there are no notes.
 */
function renderEmptyState() {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "No notes to display. Load or create a note.";
    notesList.replaceChildren(emptyItem);
}

/**
 * Renders a note safely without inserting HTML from user input.
 */
function renderNote(note) {
    const item = document.createElement("li");
    item.className = "note-item";
    item.dataset.noteId = String(note.id);

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled note";

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
        "aria-label",
        `Delete note: ${note.title || "Untitled note"}`
    );

    deleteButton.addEventListener("click", () => {
        deleteNote(note.id, deleteButton);
    });

    item.append(title, body, deleteButton);

    return item;
}

/**
 * Renders the current notes array.
 */
function renderNotes() {
    if (notes.length === 0) {
        renderEmptyState();
        return;
    }

    const fragment = document.createDocumentFragment();

    notes.forEach((note) => {
        fragment.appendChild(renderNote(note));
    });

    notesList.replaceChildren(fragment);
}

/**
 * GET: Loads the first 10 notes from JSONPlaceholder.
 */
async function getNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...", "loading");

    try {
        const result = await request(`${API_URL}?_limit=10`);
        notes = Array.isArray(result.data) ? result.data : [];

        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found.", "success");
        } else {
            showStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        }
    } catch (error) {
        showStatus(
            `Unable to load notes. ${error.message} Please try again.`,
            "error"
        );
    } finally {
        loadButton.disabled = false;
    }
}

/**
 * POST: Creates a note through the practice API.
 */
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a title for your note.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must not exceed 100 characters.", "error");
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...", "loading");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        const createdNote = result.data;

        if (!createdNote || createdNote.id === undefined) {
            throw new Error("The server did not return a note ID.");
        }

        // JSONPlaceholder simulates POST requests and does not persist them.
        // Keep the returned note in local memory so it appears in this session.
        notes.unshift({
            id: createdNote.id,
            title: createdNote.title ?? title,
            body: createdNote.body ?? body,
            userId: createdNote.userId ?? 1
        });

        renderNotes();
        noteForm.reset();

        showStatus(
            `Note created (status ${result.status}, id ${createdNote.id}).`,
            "success"
        );
    } catch (error) {
        showStatus(
            `Unable to create the note. ${error.message} Please try again.`,
            "error"
        );
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * DELETE: Requests deletion and removes the note from the current view.
 */
async function deleteNote(noteId, deleteButton) {
    deleteButton.disabled = true;
    showStatus("Deleting note...", "loading");

    try {
        const result = await request(`${API_URL}/${encodeURIComponent(noteId)}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates deletion without changing its stored data.
        // Remove the note from our local view after a successful response.
        notes = notes.filter((note) => String(note.id) !== String(noteId));

        renderNotes();

        showStatus(
            `Note ${noteId} deleted from this view (status ${result.status}).`,
            "success"
        );
    } catch (error) {
        deleteButton.disabled = false;

        showStatus(
            `Unable to delete the note. ${error.message} Please try again.`,
            "error"
        );
    }
}

// Connect the page controls to their functions.
loadButton.addEventListener("click", getNotes);
noteForm.addEventListener("submit", createNote);

// Display a helpful empty state when the page first opens.
renderEmptyState();
