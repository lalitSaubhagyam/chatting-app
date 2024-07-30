const socket = io();
const userList = document.getElementById('userList');
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const createGroupBtn = document.getElementById('createGroupBtn');
const createGroupModal = document.getElementById('createGroupModal');
const createGroupForm = document.getElementById('createGroupForm');
const cancelGroupBtn = document.getElementById('cancelGroupBtn');

let currentReceiverId = null;
let currentGroupId = null;
const userId = '<%= userId %>';  // Replace with the actual userId

createGroupBtn.addEventListener('click', () => {
    createGroupModal.style.display = 'block';
});

cancelGroupBtn.addEventListener('click', () => {
    createGroupModal.style.display = 'none';
});

createGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = document.getElementById('groupName').value;
    const groupMembers = Array.from(document.getElementById('groupMembers').selectedOptions).map(option => option.value);

    if (groupName && groupMembers.length > 0) {
        try {
            const response = await fetch('/create-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName, members: groupMembers })
            });

            const result = await response.json();
            if (response.ok) {
                window.location.reload(); // Reload to update group list
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
});

userList.addEventListener('click', (e) => {
    if (e.target.classList.contains('start-chat')) {
        e.preventDefault();
        currentReceiverId = e.target.getAttribute('data-user-id');
        currentGroupId = null;
        fetch(`/messages/${currentReceiverId}`)
            .then(response => response.json())
            .then(data => {
                messages.innerHTML = '';
                data.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'message';
                    item.innerHTML = `<span>${msg.sender.username}: ${msg.content}</span><span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
                    messages.appendChild(item);
                });
                messages.scrollTop = messages.scrollHeight;
            });
    } else if (e.target.classList.contains('start-group-chat')) {
        e.preventDefault();
        currentGroupId = e.target.getAttribute('data-group-id');
        currentReceiverId = null;
        fetch(`/group-messages/${currentGroupId}`)
            .then(response => response.json())
            .then(data => {
                messages.innerHTML = '';
                data.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'message';
                    item.innerHTML = `<span>${msg.sender.username}: ${msg.content}</span><span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
                    messages.appendChild(item);
                });
                messages.scrollTop = messages.scrollHeight;
            });
        socket.emit('join group', currentGroupId);
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageContent = input.value;
    if (messageContent) {
        socket.emit('chat message', {
            content: messageContent,
            receiverId: currentReceiverId,
            senderId: userId,
            groupId: currentGroupId
        });
        input.value = '';
    }
});

socket.on('chat message', (data) => {
    const item = document.createElement('div');
    item.className = 'message';
    item.innerHTML = `<span>${data.senderName}: ${data.content}</span><span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});
