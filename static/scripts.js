// if (!localStorage.getItem('username')) {
//     localStorage.setItem('username', '');
// }
// if (!localStorage.getItem('channel')) {
//     localStorage.setItem('channel', '');
// }

document.addEventListener('DOMContentLoaded', () => {
    // Get the username from localStorage. If it is not there prompt
    // the user to enter it
    let username = localStorage.getItem('username');
    if (username === '') {
        while (username === '' || username === null || username.length > 10) {
            username = prompt('Please enter your name:');
        }
        localStorage.setItem('username', username);
    }
    document.querySelector('#user').innerHTML = username;

    // Get the last channel from localStorage. If it is not there render 'No active channel'
    let activeChannel = localStorage.getItem('channel');
    if (activeChannel === '') {
      document.querySelector('#active-channel').innerHTML = 'No active channel';
    }
    else {
      document.querySelector('#active-channel').innerHTML = activeChannel;
    }

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    if (activeChannel !== '') {
        document.querySelector('#active-channel').innerHTML = activeChannel;
        socket.emit('active channel', {'room':activeChannel, 'username':username, 'leftChannel':''});
    }
    let channelList = document.getElementsByClassName('channel-name');

    // To create channel user should enter the name of it
    document.querySelector('#create-channel').onclick = () => {
        createNewChannel('Please enter name of channel');
        return false;
    };

    // Add new channel to the list of channels
    socket.on('add channel', data => {
        let newLi = document.createElement('li');
        newLi.className = 'channel-name';
        newLi.innerHTML = '<a href=#>' + data.channel + '</a>';
        document.querySelector('#list').appendChild(newLi);
        Array.from(channelList).forEach(joinChannel);
    });

    // If the channel exists the user will be promt to enter a new name
    socket.on('dublicat', data => {
        createNewChannel('Channel exists. Choose another name');
    });

    // Join the choosen channel from the list of channels
    Array.from(channelList).forEach(joinChannel);

    socket.on('join_chat', data => {
        let msgList = document.querySelector('#message-list')
        while (msgList.hasChildNodes()) {
            msgList.removeChild(msgList.firstChild);
        }
        document.querySelector('#active-channel').innerHTML = data.room;
        localStorage.setItem('channel', data.room);
        activeChannel = data.room;
        for (let i = 0; i < data.msgs.length; i++) {
          let dispLocTimestamp = displayTimestamp(data.msgs[i].timestamp);
          displayMessage(data.msgs[i].user, data.msgs[i].message, dispLocTimestamp);
        }
    });

    // When user clicks send button his message is added to...
    document.querySelector('#send-msg').onclick = () => {
        let message = document.querySelector('#text-msg').value;
        let timestamp = new Date();
        timestamp = timestamp.getTime() - timestamp.getTimezoneOffset()*60000;
        socket.emit('new message', {'message':message, 'room':activeChannel, 'username':username, 'timestamp':timestamp});
        document.querySelector('#text-msg').value = '';
    }
    // ...channel and only users at this channel can see it
    socket.on('send message', data => {
        let dispLocTimestamp = displayTimestamp(data.timestamp);
        displayMessage(data.username, data.message, dispLocTimestamp);
        let list = document.querySelector('#message-list');
        if (list.childElementCount > 100) {
          list.removeChild(list.childNodes[0]);
        }
    })
    // ...last messages list and all users can see it
    socket.on('last message', data => {
        lastMessage(data.message, data.room);
        let list = document.querySelector('#last-msg');
        if (list.childElementCount > 5) {
          list.removeChild(list.childNodes[0]);
        }
    })

    // Create a new channel
    function createNewChannel(msg) {
        let channel = '';
        while (channel === '' || channel.length > 10) {
            if (channel.length > 10) {
                channel = prompt('Channel name is too long');
            }
            channel = prompt(msg);
        }
        if (channel === null) {
            return;
        }
        socket.emit('create channel',{'channel':channel});
    }

    // Choose the channel and join it
    function joinChannel(li) {
        li.onclick = () => {
            let leftChannel = document.querySelector('#active-channel').innerHTML
            socket.emit('active channel', {'room':li.innerText, 'username':username, 'leftChannel':leftChannel});
            let x = window.matchMedia("(min-width: 576px)");
            if (!x.matches) {
              closeLNav();
            }
            return false;
        };
    }

    // Display timestamp for user message
    function displayTimestamp(timestamp) {
      function zero(dig) {
        return ('0' + dig).slice(-2);
      }
      let locTimestamp = new Date(timestamp);
      locTimestamp = locTimestamp.getTime() + locTimestamp.getTimezoneOffset()*60000;
      locTimestamp = new Date(locTimestamp);
      let d = locTimestamp.getDate();
      let m = locTimestamp.getMonth() + 1;
      let y = locTimestamp.getFullYear();
      let h = locTimestamp.getHours();
      let min = locTimestamp.getMinutes();
      let dispTimestamp = zero(d) + '.' + zero(m) + '.' + y + '  ' + zero(h) + ':' + zero(min);
      return dispTimestamp;
    }
    // Display users messages in channel
    function displayMessage(user, msg, time) {
      let newDiv = document.createElement('div');
      if (user === username) {
        newDiv.className = 'msg-container-left';
      }
      else {
        newDiv.className = 'msg-container-right';
      }
      let newUser = document.createElement('div');
      newUser.className = 'msg-user';
      newUser.innerHTML = user;
      newDiv.appendChild(newUser);
      let newMsg = document.createElement('p');
      newMsg.className = 'msg-text';
      newMsg.innerHTML = msg;
      newDiv.appendChild(newMsg);
      let newTime = document.createElement('span');
      newTime.innerHTML = time;
      newMsg.appendChild(newTime);
      document.querySelector('#message-list').appendChild(newDiv);
      document.querySelector('.chat').scrollTop = 1000000;
    }

    // Display users messages in the last message section
    function lastMessage(msg, channel) {
      let newDiv = document.createElement('div');
      newDiv.className = 'last-msg-item';
      newDiv.innerHTML = '<b>' + channel + ': ' + '</b>' + msg;
      document.querySelector('#last-msg').appendChild(newDiv);
    }

});
