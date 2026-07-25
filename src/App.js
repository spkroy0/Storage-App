import React, { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [allNotes, setAllNotes] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [authMode, setAuthMode] = useState("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  // ImgBB API Key
  const FILE_HOST_API_KEY = "5bbd692b6ba3cbb1ce420857c904c34b"; 

  // 👑 শুধুমাত্র আপনার ইমেইলকে Admin হিসেবে সেট করা হলো
  const ADMIN_EMAIL = "spkroy2006@gmail.com";
  const isAdmin = user && user.email === ADMIN_EMAIL;

  // Contact Info
  const WHATSAPP_NUMBER = "8801522107909";
  const FACEBOOK_URL = "https://www.facebook.com/spk.roy.02/";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const notesQuery = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      setAllNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotes();
    };
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subject || !noteDate) {
      alert("অনুগ্রহ করে ফাইল, বিষয় এবং তারিখ প্রদান করুন!");
      return;
    }

    const MAX_SIZE_MB = 30;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`ফাইলের সাইজ সর্বোচ্চ ${MAX_SIZE_MB} MB হতে পারবে!`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success || result.data?.url) {
        const downloadURL = result.data.url;

        await addDoc(collection(db, "notes"), {
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
        alert("নোট/PDF সফলভাবে আপলোড হয়েছে!");
      } else {
        throw new Error(result.error?.message || "আপলোডে সমস্যা হয়েছে।");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploading(false);
      alert(`আপলোড ব্যর্থ হয়েছে! এরর: ${error.message}`);
    }
  };

  // 👑 Admin Control: ফাইল মুছে ফেলা
  const handleDelete = async (noteId) => {
    if (!isAdmin) {
      alert("শুধুমাত্র সাইট এডমিন এই কাজ করতে পারবে!");
      return;
    }
    const confirmDelete = window.confirm("অ্যাডমিন প্যানেল: আপনি কি এই ফাইলটি পুরোপুরি মুছে ফেলতে চান?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "notes", noteId));
        alert("ফাইলটি মুছে ফেলা হয়েছে!");
      } catch (error) {
        alert("ডিলিট করতে ব্যর্থ হয়েছে!");
      }
    }
  };

  // 👑 Admin Control: ফাইল ও বিষয়ের নাম পরিবর্তন করা
  const handleRename = async (noteId, currentFileName, currentSubject) => {
    if (!isAdmin) {
      alert("শুধুমাত্র সাইট এডমিন এই কাজ করতে পারবে!");
      return;
    }
    const newFileName = prompt("নতুন ফাইলের নাম লিখুন:", currentFileName);
    const newSubject = prompt("নতুন বিষয়ের নাম লিখুন:", currentSubject);

    if (newFileName && newSubject) {
      try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
          fileName: newFileName,
          subject: newSubject
        });
        alert("ফাইলের তথ্য সফলভাবে আপডেট করা হয়েছে!");
      } catch (error) {
        alert("আপডেট করতে ব্যর্থ হয়েছে!");
      }
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("নোটের লিংক কপি করা হয়েছে!");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>KGC Math '26 Hub</h1>
          <p style={styles.subLogo}>Kurigram Govt. College • Mathematics Dept.</p>
        </div>
        <div style={styles.branding}>
          Designed by{" "}
          <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={styles.brandLink}>
            Anondo
          </a>
        </div>
      </header>

      {!user ? (
        <div style={styles.heroSection}>
          <div style={styles.welcomeBox}>
            <h2 style={{ color: "#1e293b", marginBottom: "10px" }}>স্বাগতম ম্যাথ ডিপার্টমেন্ট ২০২৬ ব্যাচ! 📚</h2>
            <p style={{ color: "#64748b", lineHeight: "1.6" }}>
              এখানে ক্লাসের বিষয়ভিত্তিক নোট এবং ফাইল আপলোড ও শেয়ার করা যাবে। সাইটে প্রবেশ করতে লগইন করুন।
            </p>
          </div>

          <div style={styles.authCard}>
            <h3 style={{ marginBottom: "15px", color: "#0f172a" }}>অ্যাকাউন্টে প্রবেশ করুন</h3>
            
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
        <div style={styles.mainFeed}>
          <div style={styles.userBar}>
            <div>
              <span style={{ fontWeight: "bold", color: "#1e293b" }}>👤 {user.displayName || user.email}</span>
              <span style={isAdmin ? styles.adminBadge : styles.badge}>
                {isAdmin ? "👑 Admin" : "Student"}
              </span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>লগ-আউট</button>
          </div>

          <div style={styles.uploadCard}>
            <h3 style={{ color: "#0f172a", marginBottom: "15px" }}>📌 নতুন ক্লাসের PDF / নোট আপলোড করুন</h3>
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
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files[0])} 
                required
                style={{ margin: "15px 0" }}
              />
              <small style={{ color: "#64748b", marginBottom: "15px", display: "block" }}>
                * সর্বোচ্চ ফাইল সাইজ: <b>30 MB</b> (PDF/Image)
              </small>
              
              <button 
                type="submit" 
                disabled={uploading}
                style={styles.uploadBtn}
              >
                {uploading ? "আপলোড হচ্ছে..." : "📤 নোট আপলোড করুন"}
              </button>
            </form>
          </div>

          <h2 style={{ color: "#0f172a", marginBottom: "15px", fontSize: "20px" }}>📖 সব ক্লাসের নোটস ({allNotes.length})</h2>
          
          <div style={styles.notesGrid}>
            {allNotes.length === 0 ? (
              <p style={{ color: "#64748b" }}>এখনো কোনো নোট শেয়ার করা হয়নি।</p>
            ) : (
              allNotes.map((n) => (
                <div key={n.id} style={styles.noteCard}>
                  <div>
                    <div style={styles.cardHeader}>
                      <span style={styles.subjectTag}>{n.subject}</span>
                      <span style={styles.dateTag}>🗓️ {n.date}</span>
                    </div>
                    <h4 style={styles.fileName}>{n.fileName}</h4>
                    <p style={styles.uploaderText}>Uploaded by: <b>{n.uploadedBy}</b></p>
                  </div>
                  
                  <div style={styles.cardActions}>
                    <a href={n.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>
                      📄 দেখুন
                    </a>
                    <button onClick={() => copyLink(n.fileUrl)} style={styles.copyBtn}>
                      🔗 শেয়ার
                    </button>

                    {/* 👑 শুধুমাত্র অ্যাডমিনের জন্য (spkroy2006@gmail.com) Rename ও Delete বাটন */}
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleRename(n.id, n.fileName, n.subject)} 
                          style={styles.renameBtn}
                          title="Rename / Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(n.id)} 
                          style={styles.deleteBtn}
                          title="Delete File"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <p>© 2026 Kurigram Govt. College (Math Dept) | Developed with ❤️ by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={{color: "#2563eb", fontWeight: "bold"}}>Anondo</a></p>
        
        {/* Contact Information with Icons */}
        <div style={styles.contactContainer}>
          <div style={styles.contactItem}>
            {/* WhatsApp Icon */}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.iconLink}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.51 1.039 3.531l-.683 2.493 2.562-.672c.983.537 2.109.845 3.303.846 3.18 0 5.767-2.586 5.768-5.766.001-3.181-2.585-5.798-5.766-5.798zm3.383 8.163c-.141.397-.822.771-1.134.818-.313.048-.718.082-2.316-.543-1.898-.742-3.111-2.679-3.206-2.806-.095-.127-.768-1.021-.768-1.948 0-.927.487-1.381.66-1.571.173-.19.378-.238.504-.238.126 0 .252.001.362.007.116.006.273-.044.425.321.157.378.536 1.309.584 1.405.048.096.08.209.016.335-.064.126-.096.205-.189.315-.095.109-.199.244-.284.328-.096.095-.196.198-.085.388.111.19.493.813 1.058 1.317.727.648 1.341.849 1.531.944.19.095.301.079.412-.048.111-.127.473-.552.6-.741.127-.19.252-.158.425-.095.173.063 1.103.52 1.293.615.19.095.316.142.363.221.047.079.047.458-.094.855z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.178L1.8 22.2l5.143-1.587C8.384 21.492 10.125 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.71 0-3.32-.472-4.707-1.291l-.337-.2-3.048.941.956-2.972-.224-.352C3.785 14.73 3.2 13.42 3.2 12c0-4.852 3.948-8.8 8.8-8.8s8.8 3.948 8.8 8.8-3.948 8.8-8.8 8.8z"/>
              </svg>
            </a>
            <span style={styles.phoneText}>(+8801522107909) only for message</span>
          </div>

          <div style={styles.contactItem}>
            {/* Facebook Icon */}
            <a 
              href={FACEBOOK_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.iconLink}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={styles.fbText}>Facebook Profile</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  header: { backgroundColor: "#ffffff", padding: "15px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderBottom: "1px solid #e2e8f0" },
  logo: { fontSize: "22px", color: "#2563eb", margin: 0, fontWeight: "bold" },
  subLogo: { fontSize: "12px", color: "#64748b", margin: 0 },
  branding: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  brandLink: { color: "#16a34a", textDecoration: "none", fontWeight: "bold" },
  heroSection: { maxWidth: "450px", margin: "40px auto", padding: "0 20px" },
  welcomeBox: { textAlign: "center", marginBottom: "25px" },
  authCard: { backgroundColor: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)", textAlign: "center" },
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
  adminBadge: { backgroundColor: "#fef3c7", color: "#d97706", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", marginLeft: "10px", fontWeight: "bold" },
  logoutBtn: { backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" },
  uploadCard: { backgroundColor: "#fff", padding: "25px", borderRadius: "16px", marginBottom: "30px", border: "1px solid #e2e8f0" },
  uploadForm: { display: "flex", flexDirection: "column" },
  inputGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  uploadBtn: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  noteCard: { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  subjectTag: { backgroundColor: "#f1f5f9", color: "#0f172a", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  dateTag: { fontSize: "12px", color: "#64748b" },
  fileName: { fontSize: "15px", color: "#1e293b", margin: "10px 0 5px 0", wordBreak: "break-all" },
  uploaderText: { fontSize: "12px", color: "#94a3b8", marginBottom: "15px" },
  cardActions: { display: "flex", gap: "5px" },
  viewBtn: { flex: 2, backgroundColor: "#0284c7", color: "#fff", textDecoration: "none", textAlign: "center", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  copyBtn: { flex: 1, backgroundColor: "#f1f5f9", color: "#334155", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" },
  renameBtn: { backgroundColor: "#fef3c7", color: "#d97706", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" },
  deleteBtn: { backgroundColor: "#fee2e2", color: "#ef4444", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" },
  footer: { textAlign: "center", padding: "20px", backgroundColor: "#fff", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" },
  contactContainer: { marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap" },
  contactItem: { display: "flex", alignItems: "center", gap: "6px" },
  iconLink: { display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" },
  phoneText: { fontSize: "13px", color: "#334155", fontWeight: "500" },
  fbText: { fontSize: "13px", color: "#1877F2", fontWeight: "600" }
};

export default App;
