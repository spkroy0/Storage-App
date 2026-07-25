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
import { collection, addDoc, query, orderBy, onSnapshot } from "firestore/firebase" // fallback safe import
import { collection as col, query as qry, orderBy as ord, onSnapshot as snap } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [allNotes, setAllNotes] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Auth States
  const [authMode, setAuthMode] = useState("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // পাবলীকভাবে সবার আপলোড করা নোট লোড হবে
    const notesQuery = qry(col(db, "notes"), ord("createdAt", "desc"));
    const unsubscribe = snap(notesQuery, (snapshot) => {
      setAllNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

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

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file || !subject || !noteDate) {
      alert("অনুগ্রহ করে ফাইল, বিষয় এবং তারিখ প্রদান করুন!");
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("ফাইলের সাইজ ৫০ MB এর বেশি হতে পারবে না!");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error(error);
        setUploading(false);
        alert("আপলোড ব্যর্থ হয়েছে!");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          await addDoc(col(db, "notes"), {
            fileName: file.name,
            subject: subject,
            date: noteDate,
            fileUrl: downloadURL,
            uploadedBy: user.displayName || user.email.split('@')[0],
            uploaderUid: user.uid,
            createdAt: new Date()
          });
          setUploading(false);
          setFile(null);
          setSubject("");
          setNoteDate("");
          alert("নোট সফলভাবে আপলোড হয়েছে!");
        });
      }
    );
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("নোটের লিংক কপি করা হয়েছে!");
  };

  return (
    <div style={styles.container}>
      {/* Navbar Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>KGC Math '26 Hub</h1>
          <p style={styles.subLogo}>Kurigram Govt. College • Mathematics Dept.</p>
        </div>
        <div style={styles.branding}>
          Designed by{" "}
          <a 
            href="https://Anondo.bro.bd" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.brandLink}
          >
            Anondo
          </a>
        </div>
      </header>

      {/* Main Content */}
      {!user ? (
        <div style={styles.heroSection}>
          <div style={styles.welcomeBox}>
            <h2 style={{ color: "#1e293b", marginBottom: "10px" }}>স্বাগতম ম্যাথ ডিপার্টমেন্ট ২০২৬ ব্যাচ! 📚</h2>
            <p style={{ color: "#64748b", lineHeight: "1.6" }}>
              এখানে ক্লাসের বিষয়ভিত্তিক নোট এবং ফাইল আপলোড ও শেয়ার করা যাবে। সাইটে প্রবেশ করতে নিচে লগইন করুন।
            </p>
          </div>

          <div style={styles.authCard}>
            <h3 style={{ marginBottom: "15px", color: "#0f172a" }}>অ্যাকাউন্টে লগইন করুন</h3>
            
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
            </div>

            {authError && <p style={{ color: "#ef4444", fontSize: "13px" }}>{authError}</p>}

            {authMode === "google" && (
              <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                🌐 Continue with Google
              </button>
            )}

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
                  style={{ cursor: "pointer", color: "#2563eb", marginTop: "10px", fontSize: "13px" }}
                >
                  {isSignUp ? "Account আছে? Log In করুন" : "Account নেই? Sign Up করুন"}
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Logged In Feed & Upload */
        <div style={styles.mainFeed}>
          {/* User Info Bar */}
          <div style={styles.userBar}>
            <div>
              <span style={{ fontWeight: "bold", color: "#1e293b" }}>👤 {user.displayName || user.email}</span>
              <span style={styles.badge}>Batch 2026</span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>লগ-আউট</button>
          </div>

          {/* Upload Form */}
          <div style={styles.uploadCard}>
            <h3 style={{ color: "#0f172a", marginBottom: "15px" }}>📌 নতুন ক্লাসের নোট আপলোড করুন</h3>
            <form onSubmit={handleUpload} style={styles.uploadForm}>
              <div style={styles.inputGroup}>
                <input 
                  type="text" 
                  placeholder="Subject / বিষয় (যেমন: Calculus)" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={styles.input}
                />
                <input 
                  type="date" 
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])} 
                required
                style={{ margin: "10px 0" }}
              />
              
              <button 
                type="submit" 
                disabled={uploading}
                style={styles.uploadBtn}
              >
                {uploading ? "আপলোড হচ্ছে..." : "📤 নোট শেয়ার করুন"}
              </button>
            </form>
          </div>

          {/* Public Notes Feed */}
          <h2 style={{ color: "#0f172a", marginBottom: "15px", fontSize: "20px" }}>📖 সব ক্লাসের নোটস ({allNotes.length})</h2>
          
          <div style={styles.notesGrid}>
            {allNotes.length === 0 ? (
              <p style={{ color: "#64748b" }}>এখনো কোনো নোট শেয়ার করা হয়নি। প্রথম নোটটি আপনিই আপলোড করুন!</p>
            ) : (
              allNotes.map((n) => (
                <div key={n.id} style={styles.noteCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.subjectTag}>{n.subject}</span>
                    <span style={styles.dateTag}>🗓️ {n.date}</span>
                  </div>
                  <h4 style={styles.fileName}>{n.fileName}</h4>
                  <p style={styles.uploaderText}>Uploaded by: <b>{n.uploadedBy}</b></p>
                  
                  <div style={styles.cardActions}>
                    <a href={n.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>
                      👁️ দেখুন / ডাউনলোড
                    </a>
                    <button onClick={() => copyLink(n.fileUrl)} style={styles.copyBtn}>
                      🔗 শেয়ার
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Kurigram Govt. College (Math Dept) | Developed with ❤️ by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={{color: "#2563eb"}}>Anondo</a></p>
      </footer>
    </div>
  );
}

// Custom CSS Styles
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  header: {
    backgroundColor: "#ffffff",
    padding: "15px 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #e2e8f0"
  },
  logo: { fontSize: "22px", color: "#2563eb", margin: 0, fontWeight: "bold" },
  subLogo: { fontSize: "12px", color: "#64748b", margin: 0 },
  branding: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  brandLink: { color: "#16a34a", textDecoration: "none", fontWeight: "bold" },

  heroSection: { maxWidth: "450px", margin: "40px auto", padding: "0 20px" },
  welcomeBox: { textAlign: "center", marginBottom: "25px" },
  
  authCard: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
    textAlign: "center"
  },
  tabContainer: { display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" },
  tab: { padding: "8px 20px", border: "none", background: "#f1f5f9", borderRadius: "8px", cursor: "pointer", fontWeight: "500" },
  activeTab: { background: "#2563eb", color: "#fff" },
  googleBtn: { width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" },
  submitBtn: { padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },

  mainFeed: { maxWidth: "900px", margin: "30px auto", padding: "0 20px", width: "100%" },
  userBar: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "15px 20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e2e8f0" },
  badge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", marginLeft: "10px" },
  logoutBtn: { backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" },

  uploadCard: { backgroundColor: "#fff", padding: "25px", borderRadius: "16px", marginBottom: "30px", border: "1px solid #e2e8f0" },
  uploadForm: { display: "flex", flexDirection: "column" },
  inputGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  uploadBtn: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },

  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  noteCard: { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  subjectTag: { backgroundColor: "#f1f5f9", color: "#0f172a", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  dateTag: { fontSize: "12px", color: "#64748b" },
  fileName: { fontSize: "15px", color: "#1e293b", margin: "10px 0 5px 0", wordBreak: "break-all" },
  uploaderText: { fontSize: "12px", color: "#94a3b8", marginBottom: "15px" },
  cardActions: { display: "flex", gap: "8px" },
  viewBtn: { flex: 2, backgroundColor: "#0284c7", color: "#fff", textDecoration: "none", textAlign: "center", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  copyBtn: { flex: 1, backgroundColor: "#f1f5f9", color: "#334155", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" },

  footer: { textAlign: "center", padding: "20px", backgroundColor: "#fff", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" }
};

export default App;
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
