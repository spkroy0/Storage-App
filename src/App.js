import React, { useState, useEffect } from "react";
import { auth, provider, db, storage } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Email and Auth Mode States
  const [authMode, setAuthMode] = useState("google"); // 'google', 'email', 'phone'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "files"), where("userId", "==", currentUser.uid));
        onSnapshot(q, (snapshot) => {
          setUserFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    });
  }, []);

  // Auth Handlers
  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider).catch(err => setAuthError(err.message));
  };

  const handleEmailAuth = (e) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      createUserWithEmailAndPassword(auth, email, password)
        .catch(err => setAuthError(err.message));
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch(err => setAuthError(err.message));
    }
  };

  const handleLogout = () => signOut(auth);

  // File Upload Logic
  const handleUpload = () => {
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_SIZE) {
      alert("ফাইলের সাইজ ৫০ MB এর বেশি হতে পারবে না!");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error(error);
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          await addDoc(collection(db, "files"), {
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2), // MB তে সেভ
            url: downloadURL,
            userId: user.uid,
            createdAt: new Date()
          });
          setUploading(false);
          setFile(null);
          alert("ফাইল সফলভাবে আপলোড হয়েছে!");
        });
      }
    );
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("ফাইলের লিংক কপি করা হয়েছে!");
  };

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Cloud Drive</h1>
        {user && (
          <div style={styles.branding}>
            Website by{" "}
            <a 
              href="https://Anondo.bro.bd" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={styles.brandLink}
            >
              Anondo
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      {!user ? (
        <div style={styles.authCard}>
          <h2 style={{ marginBottom: "10px", color: "#333" }}>অ্যাকাউন্টে প্রবেশ করুন</h2>
          <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>আপনার ফাইল নিরাপদে সংরক্ষণ করুন</p>
          
          {/* Option Switcher */}
          <div style={styles.tabContainer}>
            <button 
              onClick={() => setAuthMode("google")} 
              style={{...styles.tab, ...(authMode === "google" ? styles.activeTab : {})}}
            >
              Google
            </button>
            <button 
              onClick={() => setAuthMode("email")} 
              style={{...styles.tab, ...(authMode === "email" ? styles.activeTab : {})}}
            >
              Email
            </button>
            <button 
              onClick={() => setAuthMode("phone")} 
              style={{...styles.tab, ...(authMode === "phone" ? styles.activeTab : {})}}
            >
              Phone
            </button>
          </div>

          {authError && <p style={{ color: "red", fontSize: "13px" }}>{authError}</p>}

          {/* Google Sign In */}
          {authMode === "google" && (
            <button onClick={handleGoogleLogin} style={styles.googleBtn}>
              🌐 Continue with Google
            </button>
          )}

          {/* Email Sign In */}
          {authMode === "email" && (
            <form onSubmit={handleEmailAuth} style={styles.form}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.submitBtn}>
                {isSignUp ? "Sign Up" : "Log In"}
              </button>
              <p 
                onClick={() => setIsSignUp(!isSignUp)} 
                style={{ cursor: "pointer", color: "#007bff", marginTop: "10px", fontSize: "13px" }}
              >
                {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
              </p>
            </form>
          )}

          {/* Phone Sign In Notice */}
          {authMode === "phone" && (
            <div style={{ padding: "10px", fontSize: "14px", color: "#555" }}>
              <p>📱 ফোন নম্বর দিয়ে লগইন করতে ফায়ারবেস কনসোলে SMS সার্ভিস এনাবল করতে হবে।</p>
            </div>
          )}
        </div>
      ) : (
        /* Dashboard Layout */
        <div style={styles.dashboard}>
          {/* User Profile Bar */}
          <div style={styles.userBar}>
            <div>
              <h3>স্বাগতম, {user.displayName || user.email || "User"}</h3>
              <p style={{ fontSize: "12px", color: "#666" }}>{user.email}</p>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>লগ-আউট</button>
          </div>

          {/* Upload Section */}
          <div style={styles.uploadCard}>
            <h3>নতুন ফাইল আপলোড করুন</h3>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "15px" }}>সর্বোচ্চ ফাইলের সাইজ: ৫০ MB</p>
            
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              style={{ marginBottom: "10px" }}
            />
            <br />
            <button 
              onClick={handleUpload} 
              disabled={uploading}
              style={styles.uploadBtn}
            >
              {uploading ? "আপলোড হচ্ছে..." : "📤 আপলোড করুন"}
            </button>
          </div>

          {/* File Grid */}
          <h3>আপনার ফাইলসমূহ ({userFiles.length})</h3>
          <div style={styles.fileGrid}>
            {userFiles.length === 0 ? (
              <p style={{ color: "#888" }}>কোনো ফাইল পাওয়া যায়নি।</p>
            ) : (
              userFiles.map((f) => (
                <div key={f.id} style={styles.fileCard}>
                  <div style={{ fontSize: "24px" }}>📄</div>
                  <div style={styles.fileName}>{f.name}</div>
                  <div style={{ fontSize: "12px", color: "#888", margin: "5px 0" }}>{f.size ? `${f.size} MB` : ""}</div>
                  <button onClick={() => copyLink(f.url)} style={styles.shareBtn}>
                    🔗 লিংক কপি করুন
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Object
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
    paddingBottom: "40px"
  },
  header: {
    backgroundColor: "#ffffff",
    padding: "15px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
  },
  logo: { fontSize: "20px", color: "#007bff", margin: 0 },
  branding: { fontSize: "14px", fontWeight: "bold", color: "#555" },
  brandLink: { color: "#28a745", textDecoration: "none", borderBottom: "2px solid #28a745" },
  
  authCard: {
    maxWidth: "400px",
    margin: "50px auto",
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  tabContainer: { display: "flex", justifyContent: "center", marginBottom: "20px", gap: "5px" },
  tab: { padding: "8px 16px", border: "none", background: "#e9ecef", borderRadius: "5px", cursor: "pointer" },
  activeTab: { background: "#007bff", color: "#fff" },
  
  googleBtn: { width: "100%", padding: "12px", backgroundColor: "#4285F4", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" },
  submitBtn: { padding: "10px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" },

  dashboard: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" },
  userBar: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "15px 20px", borderRadius: "10px", marginBottom: "20px" },
  logoutBtn: { backgroundColor: "#dc3545", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" },
  
  uploadCard: { backgroundColor: "#fff", padding: "20px", borderRadius: "10px", marginBottom: "30px", textAlign: "center" },
  uploadBtn: { backgroundColor: "#007bff", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },

  fileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" },
  fileCard: { backgroundColor: "#fff", padding: "15px", borderRadius: "8px", textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  fileName: { fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "5px 0" },
  shareBtn: { backgroundColor: "#17a2b8", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }
};

export default App;
