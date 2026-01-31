// --- AUTHENTICATION & LOGIN ---
const SESSION_KEY = "isAdminLoggedIn";

window.onload = function() {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
        document.getElementById('adminLoginOverlay').style.display = 'none';
        startOrderListener();
    }
};

async function checkAdminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');

    errorMsg.innerText = "";

    try {
        const doc = await db.collection("config").doc("admin_credentials").get();

        if (doc.exists) {
            const credentials = doc.data();
            
            if (user === credentials.username && pass === credentials.password) {
                document.getElementById('adminLoginOverlay').style.display = 'none';
                sessionStorage.setItem(SESSION_KEY, "true");
                startOrderListener();
            } else {
                errorMsg.innerText = "Invalid Username or Password!";
                document.getElementById('adminPass').value = "";
            }
        } else {
            errorMsg.innerText = "Admin configuration not found in Firestore!";
        }
    } catch (error) {
        errorMsg.innerText = "Login error: Check console/network.";
        console.error("Login Error:", error);
    }
}

function logoutAdmin() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
}

function togglePasswordWithCheckbox() {
    const passwordInput = document.getElementById('adminPass');
    const checkbox = document.getElementById('showPassCheck');
    passwordInput.type = checkbox.checked ? 'text' : 'password';
}

console.log('Auth Module Loaded');
