// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDR2OugzoVNnKN6OUKsPxC9ajldlhanteE",
    authDomain: "tournament-af6dd.firebaseapp.com",
    projectId: "tournament-af6dd",
    storageBucket: "tournament-af6dd.firebasestorage.app",
    messagingSenderId: "726964405659",
    appId: "1:726964405659:web:d03f72c2d6f8721bc98d3e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let wallet = 0;
let currentUser = null;
let isPlaying = false;
const cpuNamesList = ["ESHAL", "HIFZA", "DURRE S", "ZAINAB", "FATIMA", "AREeba", "MAIRA", "DUA"];

// Auth Listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        db.ref('users/' + user.uid).on('value', snap => {
            wallet = snap.val() ? snap.val().wallet_balance : 0;
            document.getElementById('balance').innerText = wallet;
        });
        toggleAuth(false);
    }
});

function handleAuth() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    if(!e || !p) return alert("Fill all fields");
    auth.signInWithEmailAndPassword(e, p).catch(() => {
        auth.createUserWithEmailAndPassword(e, p).then(res => {
            db.ref('users/' + res.user.uid).set({ wallet_balance: 500 });
        });
    });
}

function toggleAuth(show) {
    document.getElementById('auth-modal').classList.toggle('hidden', !show);
}

// Game Flow
function startGame() {
    if(!currentUser) return toggleAuth(true);
    if(wallet < 75) return alert("Low Balance!");

    // Shuffle CPU Names
    document.getElementById('cpu1-n').innerText = cpuNamesList[Math.floor(Math.random()*cpuNamesList.length)];
    document.getElementById('cpu2-n').innerText = cpuNamesList[Math.floor(Math.random()*cpuNamesList.length)];
    document.getElementById('cpu3-n').innerText = cpuNamesList[Math.floor(Math.random()*cpuNamesList.length)];

    // Deduct Bet
    db.ref('users/' + currentUser.uid).update({ wallet_balance: wallet - 75 });
    
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    isPlaying = true;
}

function userTap() {
    if(!isPlaying) return;
    isPlaying = false;
    
    const boxes = [document.getElementById('b0'), document.getElementById('b1'), document.getElementById('b2'), document.getElementById('b3')];
    boxes.forEach(b => b.classList.add('shake'));
    document.getElementById('status').innerText = "Checking corners...";

    // Fetch result from Admin Panel
    db.ref('game_settings/next_winner').once('value').then(snap => {
        const adminChoice = snap.val() || "lose"; 

        setTimeout(() => {
            boxes.forEach(b => b.classList.remove('shake'));
            
            let winIdx = 0; // Default User wins if choice is "user"
            if (adminChoice === "cpu1") winIdx = 1;
            else if (adminChoice === "cpu2") winIdx = 2;
            else if (adminChoice === "cpu3") winIdx = 3;
            else if (adminChoice === "lose") winIdx = Math.floor(Math.random() * 3) + 1; // Random CPU wins

            revealResult(winIdx);
        }, 2500);
    });
}

function revealResult(winIdx) {
    const boxes = [document.getElementById('b0'), document.getElementById('b1'), document.getElementById('b2'), document.getElementById('b3')];
    let winnerName = "";

    boxes.forEach((b, i) => {
        b.classList.add('open');
        const content = b.querySelector('.box-content');
        if(i === winIdx) {
            content.innerText = "💰";
            winnerName = b.parentElement.querySelector('.p-name').innerText;
        } else {
            content.innerText = "❌";
        }
    });

    // Show Popup after 1 second
    setTimeout(() => {
        const modal = document.getElementById('result-modal');
        const statusTxt = document.getElementById('win-status');
        const msgTxt = document.getElementById('win-msg');
        const iconTxt = document.getElementById('win-icon');

        modal.classList.remove('hidden');

        if(winIdx === 0) {
            statusTxt.innerText = "YOU WON!";
            statusTxt.style.color = "#4cd964";
            msgTxt.innerText = "Congrats! You found the 1000 PKR Treasure!";
            iconTxt.innerText = "💰";
            // Add Money
            db.ref('users/' + currentUser.uid).update({ wallet_balance: wallet + 1000 });
            db.ref('game_settings').update({ next_winner: "lose" }); // Auto reset
        } else {
            statusTxt.innerText = "GAME OVER";
            statusTxt.style.color = "#ff3b30";
            msgTxt.innerText = winnerName + " found the Treasure!";
            iconTxt.innerText = "💔";
        }
    }, 1000);
}
