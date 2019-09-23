import os

from flask import Flask, render_template, request, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Variable to keep channels names
channels = []
# Limit for number of messages
LIMIT = 100
# Variable to keep info about channels and their messages

messages = {}
@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html", channels = channels)

# Function run when user creates a new channel
@socketio.on("create channel")
def new_channel(data):
    channel = data["channel"]
    if channels.count(channel) != 0:
        emit("dublicat", {"data": "hi"})
    else:
        channels.append(channel)
        messages.setdefault(channel, [])
        emit("add channel", data, broadcast=True)

# Function run when user navigates to choosen channel
@socketio.on("active channel")
def active_channel(data):
    username = data["username"]
    room = data["room"]
    join_room(room)
    if data["leftChannel"]:
        left_room = data["leftChannel"]
        leave_room(left_room)
    emit("join_chat", {"room":room, "username": username, "msgs":messages[room]}, room = room)

# Function run when user sends a new message
@socketio.on("new message")
def new_message(data):
    username = data["username"]
    room = data["room"]
    message = data["message"]
    timestamp = data["timestamp"]
    messages[room].append({"user":username, "message":message, "timestamp":timestamp})
    if len(messages[room]) > LIMIT:
        messages[room].pop(0)
    emit("send message", {"room":room, "username": username, "message": message, "timestamp": timestamp}, room = room)
    emit("last message", {"room":room, "message":message}, broadcast=True)

# This script lets run the app without 'flask run' and instead of it use 'python application.py'
# https://www.reddit.com/r/cs50/comments/bb8ivc/flasksocketio_websocket_not_available/
# if __name__ == '__main__':
#     app.run(debug=True, host="0.0.0.0")

# This script lets run the app without 'flask run' and use instead of it 'socketio.run'
# https://github.com/miguelgrinberg/Flask-SocketIO/issues/894
# if __name__ == '__main__':
#     socketio.run(app, debug=True)
