import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUGJsFu0mGo0njCogC_zMdwRiD2eIyUL0",
  authDomain: "bingo-gm.firebaseapp.com",
  projectId: "bingo-gm",
  storageBucket: "bingo-gm.firebasestorage.app",
  messagingSenderId: "1082479779938",
  appId: "1:1082479779938:web:f75e9409333ead5a32313b"
};

const app = initializeApp(firebaseConfig);
const branch = new URLSearchParams(location.search).get('branch');
const game = doc(getFirestore(app), 'game', branch);

const wait = 30;
const playerMax = 100;
const timespeed = 5000;
const range = 50;
const secretKey = Math.round(Math.random() * 1e15);

let time = wait;
let start = 0;
let client = [];
let bingoClients = [];
let bingoNumbers = [];
let serverStartCountdown;
let serverStartBingo;

function stopFunction() {
  start = 2;
  clearInterval(serverStartBingo);
}

async function startFunction() {
  if (start == 1 && time == 0 && bingoNumbers.length < range) {
    let numrandom;
    while (true) {
      numrandom = Math.floor((Math.random() * range) + 1);
      if (bingoNumbers.indexOf(numrandom) < 0) {
        responsiveVoice.speak(`${numrandom}`, 'Thai Female');
        bingoNumbers.push(numrandom);
        break;
      }
    }
    await updateDoc(game, {
      'pop': bingoNumbers
    });

    let numberRandom = '';
    for (let i = 0; i < bingoNumbers.length; i++) {
      if (i == (bingoNumbers.length - 1)) {
        document.getElementById('nlast').innerHTML = bingoNumbers[i];
      }
      // numberRandom += (bingoNumbers[i] + ((i + 1) % 10 == 0 ? '<br>' : '&nbsp;'));
      if (i == 0) {
        numberRandom += '<br>';
      }
      else if(i % 10 == 0) {
        numberRandom += ' ,<br>';
      }
      else {
        numberRandom += ' , ';
      }
      numberRandom += bingoNumbers[i];
    }
    document.getElementById('checkNumber').innerHTML = numberRandom;
  }
  if (bingoNumbers.length == range) {
    stopFunction();
  }
}

async function serverStartFunction() {
  if (time > 0) {
    if (client.length > 0) {
      document.getElementById('countdown').innerHTML = `( wait ${time} sec. )`;
      await updateDoc(game, {
        'time': time--
      });
    }
  }
  else {
    start = 1;
    clearInterval(serverStartCountdown);
    serverStartBingo = setInterval(startFunction, timespeed);
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('countdown').innerHTML = '';
    await updateDoc(game, {
      'start': true
    });
  }
}

function checkClient(id, msgStr) {
  let index_client = client.indexOf(id);
  if (index_client != -1) {
    let msgs = msgStr.split(',');
    let arrCheck = bingoClients[index_client];
    let countCheck = 0;

    for (let i = 0; i < 5; i++) {
      countCheck = 0;
      for (let j = 0; j < 5; j++) {
        if (i == 2 && j == 2) countCheck++;
        else {
          for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
            if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][j])) {
              countCheck++;
            }
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      countCheck = 0;
      for (let j = 0; j < 5; j++) {
        if (i == 2 && j == 2) countCheck++;
        else {
          for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
            if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[j][i])) {
              countCheck++;
            }
            if (countCheck == 5) {
              return true;
            }
          }
        }
      }
    }

    countCheck = 0;
    for (let i = 0; i < 5; i++) {
      if (i == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
          if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][i])) {
            countCheck++;
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }

    countCheck = 0;
    for (let i = 0; i < 5; i++) {
      if (i == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < msgs.length; bingo_check++) {
          if (parseInt(msgs[bingo_check]) == parseInt(arrCheck[i][4 - i])) {
            countCheck++;
          }
          if (countCheck == 5) {
            return true;
          }
        }
      }
    }
  }
}

await setDoc(game, {
  'secret': secretKey,
  'clients': [],
  'check': '|',
  'start': false,
  'BINGO': '',
  'pop': [],
  'time': time
});
new QRious({
  element: document.getElementById('qrcode-img'),
  value: `https://ajkaew.github.io/bingo/client.html?branch=${branch}&key=${secretKey}`,
  size: 400
});
console.log(`https://iamkaew.github.io/bingo/client.html?branch=${branch}&key=${secretKey}`);
document.getElementById('status_connect')
  .innerHTML = '<span id="online">Online</span>';
if (start == 0) {
  document.getElementById('qrcode').style.display = 'block';
}

onSnapshot(game, async doc => {
  const data = doc.data();
  if (start == 0) {
    if(data.clients.length > client.length) {
      clearInterval(serverStartCountdown);
      time = wait;
      serverStartFunction();
      serverStartCountdown = setInterval(serverStartFunction, 1000);
      for(let i = client.length; i < data.clients.length; i++) {
        const msg = data.clients[i].split('|');
        const arr = msg[1].split(',');
        const bingoClient = [];
        client.push(msg[0]);
        for (let i = 0; i < arr.length; i+=5) {
          bingoClient.push(arr.slice(i, i+5));
        }
        bingoClients.push(bingoClient);
      }
      if (client.length >= playerMax) {
        time = 0;
        await serverStartFunction();
      }
      document.getElementById('displays').style.display = 'block';
      document.getElementById('nplayer')
        .innerHTML = `${client.length} Player` + (client.length > 1 ? 's' : '');
    }
  }
  const msg = data.check.split('|');
  if (start == 1) {
    if (checkClient(msg[0], msg[1])) {
      responsiveVoice.speak('bing goal', 'UK English Female');
      await updateDoc(game, {
        'BINGO': msg[0]
      });
      document.getElementById('nlast').innerHTML = msg[0].split('~')[1];
      stopFunction();
    }
  }
});
