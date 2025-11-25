import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, onSnapshot, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLmWrBaRcZZdG2e7bOD7MoqoCRirkVZqI",
  authDomain: "is-bingo.firebaseapp.com",
  projectId: "is-bingo",
  storageBucket: "is-bingo.appspot.com",
  messagingSenderId: "760850828545",
  appId: "1:760850828545:web:fd731405f3891823cd1f00"
};

const range = 50;
const params = new URLSearchParams(location.search);
const branch = params.get('branch');
const key = params.get('key');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const game = doc(db, 'game', branch);

let playername;
let start = 0;
let bingoNumbers = [];
let clickNumbers = [];
let bingoGenerate = [];
let bingoCheck = [];

function generateNumbers(order) {
  while (true) {
    let numrandom = Math.floor((Math.random() * range) + 1);
    if (bingoGenerate.indexOf(numrandom) < 0) {
      bingoGenerate.push(numrandom);
      if (bingoGenerate.length == 25) {
        bingoGenerate.sort(function (a, b) {
          return a - b;
        });
        break;
      }
    }
  }

  for (let i = 0; i < bingoGenerate.length; i+=5) {
    bingoCheck.push(bingoGenerate.slice(i, i+5));
  }
  playername = `${order}~${playername}`;
  return `${playername}|${bingoGenerate}`;
}

function checkClientBingo() {
  let status = false;
  let countCheck = 0;

  for (let i = 0; i < 5; i++) {
    countCheck = 0;
    for (let j = 0; j < 5; j++) {
      if (i == 2 && j == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
          if (clickNumbers[bingo_check] == bingoCheck[i][j]) {
            countCheck++;
          }
        }
      }
      if (countCheck == 5) {
        status = true;
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    countCheck = 0;
    for (let j = 0; j < 5; j++) {
      if (i == 2 && j == 2) countCheck++;
      else {
        for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
          if (clickNumbers[bingo_check] == bingoCheck[j][i]) {
            countCheck++;
          }
          if (countCheck == 5) {
            status = true;
          }
        }
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    if (i == 2) countCheck++;
    else {
      for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
        if (clickNumbers[bingo_check] == bingoCheck[i][i]) {
          countCheck++;
        }
        if (countCheck == 5) {
          status = true;
        }
      }
    }
  }

  countCheck = 0;
  for (let i = 0; i < 5; i++) {
    if (i == 2) countCheck++;
    else {
      for (let bingo_check = 0; bingo_check < clickNumbers.length; bingo_check++) {
        if (clickNumbers[bingo_check] == bingoCheck[i][4 - i]) {
          countCheck++;
        }
        if (countCheck == 5) {
          status = true;
        }
      }
    }
  }
  return status;
}

async function checkBingo(numberBingo) {
  numberBingo = +numberBingo;
  if (clickNumbers.indexOf(numberBingo) == -1 &&
    bingoNumbers.indexOf(numberBingo) != -1 && start != 2) {
    clickNumbers.push(numberBingo);
    document.getElementById(numberBingo).style.backgroundColor = 'red';
    if (checkClientBingo()) {
      await updateDoc(game, {
        'check': `${playername}|${clickNumbers}`
      });
    }
  }
}

const docSnap = await getDoc(game);
const data = docSnap.data();

if (key != data.secret) {
  document.getElementById('bingo_card').style.display = 'none';
  document.getElementById('checkNumber').style.display = 'none';
  window.alert('เกมรอบนี้สิ้นสุดแล้ว กรุณาสแกน QR เพื่อเข้าเล่นใหม่');
  history.back();
}

if(!playername) {
  if(start == 0) {
    do {
      playername = prompt('Please enter your name', '');
    } while(!playername);
    document.getElementById('status_connect')
      .innerHTML = '<span id="online">Online</span>';
    document.getElementById('player_name').innerHTML = playername;
  }
  else {
    window.alert('ขออภัย เกมเริ่มแล้ว กรุณารอรอบถัดไป');
    history.back();
  }
}
if(bingoGenerate.length == 0) {

  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(game);
      const newClients = sfDoc.data().clients;
      newClients.push(generateNumbers(newClients.length));
      transaction.update(game, { clients: newClients });
    });
    // console.log("Transaction successfully committed!");
  } catch (e) {
    console.log("Transaction failed: ", e);
    alert("มีบางอย่างผิดพลาด กรุณาลองใหม่");
    history.back();
  }

  // data.clients.push(generateNumbers(data.clients.length));
  // await updateDoc(game, {
  //   'clients': data.clients
  // });
  let htmlText = '';
  for (let i = 0; i < bingoGenerate.length; i++) {
    if (i % 5 == 0) {
      htmlText += '<tr>';
    }
    if (i == 12) {
      htmlText += `<td id="${bingoGenerate[i]}"><img src="img/logo.png" style="text-align:center;vertical-align:middle;"></td>`;
    }
    else {
      htmlText += `<td id="${bingoGenerate[i]}" class="clickable">${bingoGenerate[i]}</td>`;
    }
    if ((i + 1) % 5 == 0) {
      htmlText += '</tr>';
    }
  }
  document.getElementById('bingo_card').innerHTML = htmlText;
  for(let num of document.querySelectorAll('.clickable')) {
    num.addEventListener('click', ()=>{checkBingo(num.id);});
  }
}

onSnapshot(game, async doc => {
  const data = doc.data();
  if (data.start) {
    start = 1;
    document.getElementById('bingo_card').style.display = 'table';
    document.getElementById('checkNumber').innerHTML = '';
  }
  else {
    document.getElementById('checkNumber').innerHTML = `Wait ${data.time} sec.`;
  }
  if (start == 1) {
    bingoNumbers = data.pop;
    let showNumberCheck = '';
    for (let i = 0; i < bingoNumbers.length; i++) {
      if (i == 0) {
        showNumberCheck += '<br>';
      }
      else if(i % 10 == 0) {
        showNumberCheck += ' ,<br>';
      }
      else {
        showNumberCheck += ' , ';
      }
      if (i == (bingoNumbers.length - 1)) {
        showNumberCheck += `<span id="numberSize">${bingoNumbers[i]}</span>`;
      }
      else {
        showNumberCheck += bingoNumbers[i];
      }
    }
    document.getElementById('checkNumber').innerHTML = showNumberCheck;
    const msg = data.BINGO;
    if(msg != '') {
      if (playername == msg) {
        document.getElementById('win').innerHTML = '<span style="color:green;">You BINGO!!!</span>';
      }
      else {
        const winner = msg.split('~')[1];
        document.getElementById('win').innerHTML = `<span style="color:red;">You LOST!!!, ${winner} is the winner.</span>`;
      }
      start = 2;
    }
  }
});