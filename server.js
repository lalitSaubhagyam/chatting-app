const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const User = require('./models/user');
const Message = require('./models/message');
const Group = require('./models/group'); // Add Group model

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/', checkAuth, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.session.user._id } });
        const groups = await Group.find({ members: req.session.user._id }).populate('members', 'username');
        res.render('chat', {
            username: req.session.user.username,
            users,
            groups,
            userId: req.session.user._id
        });
    } catch (err) {
        res.status(500).send('Error loading chat page');
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Invalid username or password' });
        }

        const isMatch = password === user.password;

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        req.session.user = user;
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

// Group chat routes
app.post('/create-group', async (req, res) => {
    try {
        const { name, members } = req.body;

        if (!name && members.length < 2) {
            return res.status(400).json({ message: 'Group name and members are required' });
        }

        const group = new Group({ name, members });
        await group.save();

        res.status(201).json({ message: 'Group created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error creating group', error: err.message });
    }
});

app.get('/group-messages/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ group: groupId })
            .populate('sender', 'username')
            .populate('group')
            .exec();

        res.json(messages);
    } catch (err) {
        res.status(500).send('Error fetching group messages');
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined`);
    });

    socket.on('join group', (groupId) => {
        socket.join(groupId);
        console.log(`Group ${groupId} joined`);
    });

    socket.on('chat message', async (data) => {
        const { content, receiverId, senderId, groupId } = data;

        // Determine whether it's a group message or direct message
        const messageData = {
            content,
            sender: senderId,
            receiver: receiverId || null,
            group: groupId || null,
        };

        const message = new Message(messageData);
        await message.save();

        // Get sender's username
        const sender = await User.findById(senderId);

        if (groupId) {
            // Emit to all members of the group
            io.to(groupId).emit('chat message', { senderId, content, senderName: sender.username, timestamp: message.timestamp });
        } else if (receiverId) {
            // Emit to the receiver and sender
            io.to(receiverId).emit('chat message', { content, senderName: sender.username, timestamp: message.timestamp });
            io.to(senderId).emit('chat message', { senderId, content, senderName: sender.username, timestamp: message.timestamp });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.get('/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.session.user._id, receiver: userId },
                { sender: userId, receiver: req.session.user._id }
            ]
        }).populate('sender', 'username').populate('receiver', 'username').exec();

        res.json(messages);
    } catch (err) {
        res.status(500).send('Error fetching messages');
    }
});

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
