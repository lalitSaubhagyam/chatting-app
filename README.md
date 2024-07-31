# Chat Application

## Overview

This chat application enables users to register, log in, and engage in real-time one-to-one and group chats. Messages are stored with timestamps and can be viewed in the chat history.

## Application Flow

### Registration

- Users access the registration page to create an account.
- On successful registration, users are redirected to the login page.

### Login

- Users log in with their registered credentials.
- On successful login, users are redirected to the chat page.

### Chat Page

- The chat page lists all registered users.
- Users can select a user to start a one-to-one chat or create/join group chats.

### One-to-One Chat

- Users can click on any listed user to open a chat window.
- Messages exchanged are displayed in real-time and saved with timestamps.
- Previous chat history is loaded when the chat window is opened.

### Group Chat

- Users can create a new group by selecting multiple users.
- An interface allows users to add participants to the group.
- Group chat messages are displayed in real-time and saved with timestamps.
- Previous group messages are loaded when the group chat window is opened.

### Real-time Communication

- The application uses Socket.io to enable real-time messaging without page refreshes.
- Both one-to-one and group messages are updated live for all participants.

### Message Storage

- All messages are saved in the database with timestamps.
- Chat history is retrieved from the database and displayed when a chat window is opened.
