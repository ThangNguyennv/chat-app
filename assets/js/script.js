import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, set, ref, onValue, push, onChildAdded, child, get, remove, onChildRemoved, onChildChanged, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'

const firebaseConfig = {
  apiKey: "AIzaSyA9YPsMTecw403PopU6seDvw1XYezCtWWE",
  authDomain: "chat-app-f1e6d.firebaseapp.com",
  projectId: "chat-app-f1e6d",
  storageBucket: "chat-app-f1e6d.firebasestorage.app",
  messagingSenderId: "259040972502",
  appId: "1:259040972502:web:c63849a87bbe82fdf10377",
  databaseURL: "https://chat-app-f1e6d-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const dbRef = ref(getDatabase());

// Tính năng đăng ký 
const formRegister = document.querySelector("#form-register");
if (formRegister) {
    formRegister.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const fullName = event.target.fullName.value;
        const email = event.target.email.value;
        const password = event.target.password.value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                if (user) {
                    set(ref(db, "users/" + user.uid), {
                        fullName: fullName
                    }).then(() => {
                        window.location.href = "index.html";
                    }); 
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert("Email đã tồn tại trong hệ thống!!!")
            });
        })
}
// Hết tính năng đăng ký 

// Tính năng đăng nhập 
const formLogin = document.querySelector("#form-login");
if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const email = event.target.email.value;
        const password = event.target.password.value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                if (user) {
                    window.location.href = "index.html"
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert("Sai thông tin đăng nhập!!!")
            });
        })
}
// Hết tính năng đăng nhập 

// Tính năng đăng xuất
const buttonLogout = document.querySelector("[button-logout]");
if (buttonLogout) {
    buttonLogout.addEventListener("click", () => {
        signOut(auth).then(() => {
            // Sign-out successful.
            window.location.href = "login.html";
          }).catch((error) => {
            // An error happened.
          });
    })
}
// Hết tính năng đăng xuất

// Kiểm tra trạng thái đăng nhập
const buttonRegister = document.querySelector("[button-register]");
const buttonLogin = document.querySelector("[button-login]");
const chat = document.querySelector(".chat");

onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid;
      buttonLogout.style.display = "inline-block";
      chat.style.display = "block";
    //   onValue(ref(db, `users/${uid}`), (item) => {
    //     const key = item.key;
    //     const value = item.val();
    //     console.log(key);
    //     console.log(value);
    // });
    } else {
      // User is signed out
      // ...
      buttonRegister.style.display = "inline-block";
      buttonLogin.style.display = "inline-block";
      
      if (chat) {
        chat.innerHTML = "";
      }
    }
  });
// Hết kiểm tra trạng thái đăng nhập

// Chat cơ bản (Gửi tin nhắn văn bản)
const formChat = document.querySelector(".chat .inner-form");
if (formChat) {
    const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-images', {
        multiple: true,
        maxFileCount: 6
    });

    formChat.addEventListener("submit", async (event) => {
        event.preventDefault();

        const content = event.target.content.value;
        const userId = auth.currentUser.uid;

        const images = upload.cachedFileArray;
        
        const imagesClound = [];

        if (images.length > 0) {
            const url = "https://api.cloudinary.com/v1_1/dq26lhcth/auto/upload";
            const formData = new FormData();
            for (let i = 0; i < images.length; i++) {
                let file = images[i];
                formData.append('file', file);
                formData.append('upload_preset', 'UploadProject4');

                const response = await fetch(url, {
                    method: "POST",
                    body: formData
                })
                const data = await response.json();
                imagesClound.push(data.url);
            }
        }
        
        if ((content || imagesClound.length > 0) && userId) {
            set(push(ref(db, "chats")), {
                userId: userId,
                content: content,
                images: imagesClound
            })
            event.target.content.value = "";
            upload.resetPreviewPanel();
        }
    })
}
// Hết chat cơ bản (Gửi tin nhắn văn bản)

// Lấy ra danh sách tin nhắn
const chatBody = document.querySelector(".chat .inner-body");
if (chatBody) {

    const chatsRef = ref(db, 'chats');

    onChildAdded(chatsRef, (dataChat) => {
        const key = dataChat.key;
        const userId = dataChat.val().userId;
        const content = dataChat.val().content;
        const images = dataChat.val().images;
        
        get(child(dbRef, `users/${userId}`)).then((snapshot) => {
            if (snapshot.exists()) {
                const fullName = snapshot.val().fullName;

                const elementChat = document.createElement("div");
                elementChat.setAttribute("chat-key", key);
                let htmlFullName = "";
                let htmlButtonDelete = ""

                if (userId == auth.currentUser.uid) {
                    elementChat.classList.add("inner-outgoing");
                    htmlButtonDelete = `
                        <button class="button-delete">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    `;
                } else {
                    elementChat.classList.add("inner-incoming");
                    htmlFullName = `
                        <div class="inner-name">
                            ${fullName}
                        </div>
                    `;
                }

                let htmlContent = "";
                if (content) {
                    htmlContent = `
                    <div class="inner-content">
                        ${content}
                    </div>
                    `;
                }

                let htmlImages = "";
                if (images) {
                    htmlImages += `<div class="inner-images">`;

                    for (const image of images) {
                        htmlImages += `
                            <img src="${image}"/>
                        `;
                    }
                    htmlImages += `</div>`;
                }

                elementChat.innerHTML = `
                    ${htmlFullName}
                    ${htmlContent}
                    ${htmlImages}
                    ${htmlButtonDelete}
                `;

                chatBody.appendChild(elementChat);

                // Tự độg scroll xuống cuối
                chatBody.scrollTop = chatBody.scrollHeight;

                // Zoom ảnh
                new Viewer(elementChat);
                 
                // Xóa tin nhắn
                const buttonDelete = elementChat.querySelector(".button-delete");
                if (buttonDelete) {
                    buttonDelete.addEventListener("click", () => {
                        remove(ref(db, "chats/" + key));
                    });
                }
            } 

        }).catch((error) => {
            console.error(error);
        });
    });
      
    onChildRemoved(chatsRef, (data) => {
        const key = data.key;
        const chatItem = chatBody.querySelector(`[chat-key="${key}"]`);
        chatItem.remove();
    });
}
// Hết lấy ra danh sách tin nhắn

// Chèn icon
const emojiPicker = document.querySelector("emoji-picker");
if (emojiPicker) {
    const inputChat = document.querySelector(".chat .inner-form input[name='content']")
    emojiPicker.addEventListener("emoji-click", event => {
        const icon = event.detail.unicode;
        inputChat.value = inputChat.value + icon;

    })
}
// Hết chèn icon

// Hiển thị Icon Tooltip
const buttonIcon = document.querySelector(".button-icon");
if (buttonIcon) {
    const tooltip = document.querySelector(".tooltip");
    Popper.createPopper(buttonIcon, tooltip);
    buttonIcon.addEventListener("click", () => {
        tooltip.classList.toggle("show");
    })
}
// Hết hiển thị Icon Tooltip

