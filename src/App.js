import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, provider, db } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc, 
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

const BOOK_LIST = [
  "বাংলাদেশের ইতিহাস: ভাষা, সংস্কৃতি ও পরিচয় [219901]",
  "তথ্য ও যোগাযোগ প্রযুক্তি (ICT) [219903]",
  "মৌলিক গণিত [213701]",
  "ক্যালকুলাস-I [213703]",
  "যোগাশ্রয়ী বীজগণিত ও বৈশ্লেষিক জ্যামিতি [213705]",
  "গণিত (Lab-Practical) [213706]",
  "রসায়ন (ব্যবহারিক-I) [212810]",
  "পরিসংখ্যান (Lab) [213610]",
  "রসায়ন-I [212807]",
  "পদার্থবিজ্ঞান-I (বলবিদ্যা, পদার্থের ধর্ম, তরঙ্গ ও আলোকবিদ্যা) [212707]",
  "পদার্থবিজ্ঞান-II (তাপ, তাপগতিবিদ্যা ও বিকিরণ) [212709]",
  "মৌলিক পরিসংখ্যান [213607]",
  "অর্থনীতির মূলনীতি [212209]",
  "বাংলাদেশের কৃষি অর্থনীতি [212211]"
];

// Permanent Admin Email List
const ADMIN_EMAILS = ["spkroy2006@gmail.com"];

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // 'home', 'dashboard', 'profile'
  
  // App Data States
  const [allNotes, setAllNotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Public Profile View Modal State
  const [viewingProfile, setViewingProfile] = useState(null);

  // Edit Note Modal States
  const [editingNote, setEditingNote] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [editPdfInfo, setEditPdfInfo] = useState("");

  // Upload Note States
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState(BOOK_LIST[0]);
  const [noteDate, setNoteDate] = useState("");
  const [pdfInfo, setPdfInfo] = useState(""); 
  
  // Auth States
  const [authMode, setAuthMode] = useState("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  // Profile Edit States
  const [myProfile, setMyProfile] = useState({
    displayName: "",
    whatsapp: "",
    email: "",
    facebook: "",
    dob: "",
    address: "",
    deptRoll: "",
    photoUrl: "",
    points: 0,
    role: "Student"
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Dashboard Selected User State
  const [selectedDashboardUid, setSelectedDashboardUid] = useState(null);
  const [commentText, setCommentText] = useState({});

  const FILE_HOST_API_KEY = "5bbd692b6ba3cbb1ce420857c904c34b"; 

  // Dynamic Role Resolver
  const getUserRole = (uEmail, uUid) => {
    if (uEmail && ADMIN_EMAILS.includes(uEmail.toLowerCase())) return "Admin";
    const foundUser = allUsers.find(u => u.uid === uUid || u.email === uEmail);
    return foundUser?.role || "Student";
  };

  const currentUserRole = user ? getUserRole(user.email, user.uid) : "Student";
  const isAdmin = currentUserRole === "Admin";
  const isModOrAdmin = currentUserRole === "Admin" || currentUserRole === "Moderator";

  const updateUserScore = async (uid, points) => {
    if (!uid) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { points: increment(points) });
    } catch (e) {
      console.error("Score update error:", e);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email.split("@")[0],
          email: currentUser.email,
        }, { merge: true });
      }
    });

    const notesQuery = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      setAllNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(uList);

      if (auth.currentUser) {
        const foundMe = uList.find(u => u.uid === auth.currentUser.uid);
        if (foundMe) {
          setMyProfile({
            displayName: foundMe.displayName || auth.currentUser.displayName || "",
            whatsapp: foundMe.whatsapp || "",
            email: foundMe.email || auth.currentUser.email || "",
            facebook: foundMe.facebook || "",
            dob: foundMe.dob || "",
            address: foundMe.address || "",
            deptRoll: foundMe.deptRoll || "",
            photoUrl: foundMe.photoUrl || "",
            points: foundMe.points || 0,
            role: foundMe.role || "Student"
          });
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotes();
      unsubscribeUsers();
    };
  }, []);

  const leaderboardUsers = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));

  const getUserRank = (targetUid) => {
    const rankIndex = leaderboardUsers.findIndex(u => u.uid === targetUid);
    return rankIndex !== -1 ? `#${rankIndex + 1}` : "N/A";
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider).catch(err => setAuthError(err.message));
  };

  const handleEmailAuth = (e) => {
    e.preventDefault();
    setAuthError("");

    if (isSignUp) {
      if (password !== confirmPassword) {
        setAuthError("পাসওয়ার্ড দুটি মিলছে না!");
        return;
      }
      createUserWithEmailAndPassword(auth, email, password)
        .catch(err => setAuthError(err.message));
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch(err => setAuthError(err.message));
    }
  };

  const handleLogout = () => signOut(auth);

  const handleToggleModerator = async (targetUser) => {
    if (!isAdmin) return;
    const currentRole = getUserRole(targetUser.email, targetUser.uid);
    if (currentRole === "Admin") {
      alert("অ্যাডমিনের রোল পরিবর্তন করা সম্ভব নয়!");
      return;
    }

    const newRole = currentRole === "Moderator" ? "Student" : "Moderator";
    const confirmMsg = newRole === "Moderator" 
      ? `আপনি কি ${targetUser.displayName || targetUser.email}-কে মডারেটর বানাতে চান?` 
      : `আপনি কি ${targetUser.displayName || targetUser.email}-কে মডারেটর থেকে স্টুডেন্ট রোল-এ ফেরত নিতে চান?`;

    if (window.confirm(confirmMsg)) {
      try {
        const userRef = doc(db, "users", targetUser.uid);
        await updateDoc(userRef, { role: newRole });
        alert(`সফলভাবে রোল পরিবর্তন করা হয়েছে: ${newRole}`);
      } catch (error) {
        console.error("Role update failed:", error);
        alert("রোল আপডেট করতে সমস্যা হয়েছে!");
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let finalPhotoUrl = myProfile.photoUrl;

      if (profilePicFile) {
        if (profilePicFile.size > 5 * 1024 * 1024) {
          alert("প্রোফাইল পিকচারের সাইজ সর্বোচ্চ 5 MB হতে পারবে!");
          setSavingProfile(false);
          return;
        }

        const formData = new FormData();
        formData.append("image", profilePicFile);

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
          method: "POST",
          body: formData,
        });

        const resData = await res.json();
        if (resData.success) {
          finalPhotoUrl = resData.data.url;
        }
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: myProfile.displayName,
        whatsapp: myProfile.whatsapp,
        email: myProfile.email,
        facebook: myProfile.facebook,
        dob: myProfile.dob,
        address: myProfile.address,
        deptRoll: myProfile.deptRoll,
        photoUrl: finalPhotoUrl
      });

      setSavingProfile(false);
      alert("আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
    } catch (error) {
      console.error(error);
      setSavingProfile(false);
      alert("প্রোফাইল আপডেট করতে সমস্যা হয়েছে!");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subject || !noteDate) {
      alert("অনুগ্রহ করে ফাইল, বিষয় এবং তারিখ প্রদান করুন!");
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
        const uName = myProfile.displayName || user.displayName || user.email.split('@')[0];

        await addDoc(collection(db, "notes"), {
          fileName: file.name,
          subject: subject,
          date: noteDate,
          pdfInfo: pdfInfo.trim(),
          fileUrl: downloadURL,
          uploadedBy: uName,
          uploaderUid: user.uid,
          uploaderEmail: user.email,
          loves: [],
          cares: [],
          lovedPointUsers: [],
          caredPointUsers: [],
          comments: [],
          commentedPointUsers: [],
          isPendingDelete: false,
          deletedByModName: "",
          createdAt: new Date()
        });

        await updateUserScore(user.uid, 100);

        setUploading(false);
        setFile(null);
        setSubject(BOOK_LIST[0]);
        setNoteDate("");
        setPdfInfo("");
        alert("নোট/PDF সফলভাবে আপলোড হয়েছে! আপনি ১০০ পয়েন্ট পেলেন! 🎉");
      } else {
        throw new Error("আপলোডে সমস্যা হয়েছে।");
      }
    } catch (error) {
      setUploading(false);
      alert(`আপলোড ব্যর্থ হয়েছে!`);
    }
  };

  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setEditFileName(note.fileName || "");
    setEditPdfInfo(note.pdfInfo || "");
  };

  const handleSaveNoteEdit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const noteRef = doc(db, "notes", editingNote.id);
      await updateDoc(noteRef, {
        fileName: editFileName.trim(),
        pdfInfo: editPdfInfo.trim()
      });
      alert("ফাইলের নাম সফলভাবে পরিবর্তন করা হয়েছে!");
      setEditingNote(null);
    } catch (error) {
      console.error("Rename error:", error);
      alert("ফাইলের নাম পরিবর্তন করতে ব্যর্থ হয়েছে!");
    }
  };

  // ❤️ LOVE and 🥰 CARE REACTION TOGGLE
  const handleReactionToggle = async (note, type) => {
    if (!user) return;
    const noteRef = doc(db, "notes", note.id);
    const isOwnPost = note.uploaderUid === user.uid;

    if (type === "love") {
      const hasLoved = note.loves?.includes(user.uid);
      if (hasLoved) {
        await updateDoc(noteRef, { loves: arrayRemove(user.uid) });
      } else {
        await updateDoc(noteRef, { 
          loves: arrayUnion(user.uid),
          cares: arrayRemove(user.uid) 
        });
        if (!isOwnPost && !note.lovedPointUsers?.includes(user.uid)) {
          await updateUserScore(user.uid, 3);
          await updateUserScore(note.uploaderUid, 5);
          await updateDoc(noteRef, { lovedPointUsers: arrayUnion(user.uid) });
        }
      }
    } else if (type === "care") {
      const hasCared = note.cares?.includes(user.uid);
      if (hasCared) {
        await updateDoc(noteRef, { cares: arrayRemove(user.uid) });
      } else {
        await updateDoc(noteRef, { 
          cares: arrayUnion(user.uid),
          loves: arrayRemove(user.uid) 
        });
        if (!isOwnPost && !note.caredPointUsers?.includes(user.uid)) {
          await updateUserScore(user.uid, 3);
          await updateUserScore(note.uploaderUid, 5);
          await updateDoc(noteRef, { caredPointUsers: arrayUnion(user.uid) });
        }
      }
    }
  };

  const handleAddComment = async (e, note) => {
    e.preventDefault();
    const text = commentText[note.id];
    if (!text || !text.trim()) return;

    const uName = myProfile.displayName || user.displayName || user.email.split('@')[0];
    const newComment = {
      id: Date.now().toString(),
      userName: uName,
      userUid: user.uid,
      userEmail: user.email,
      text: text.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const noteRef = doc(db, "notes", note.id);
    await updateDoc(noteRef, { comments: arrayUnion(newComment) });

    const isOwnPost = note.uploaderUid === user.uid;
    const rewardedCommenters = note.commentedPointUsers || [];

    if (!isOwnPost && !rewardedCommenters.includes(user.uid)) {
      await updateUserScore(user.uid, 5);
      await updateUserScore(note.uploaderUid, 7);
      await updateDoc(noteRef, { commentedPointUsers: arrayUnion(user.uid) });
    }

    setCommentText(prev => ({ ...prev, [note.id]: "" }));
  };

  const handleDeleteComment = async (noteId, commentObj) => {
    if (!isModOrAdmin) return;
    if (window.confirm("আপনি কি এই কমেন্টটি মুছে ফেলতে চান?")) {
      try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
          comments: arrayRemove(commentObj)
        });
      } catch (error) {
        console.error("Comment delete error:", error);
        alert("কমেন্ট ডিলিট করতে সমস্যা হয়েছে!");
      }
    }
  };

  // MODERATOR / ADMIN DELETE LOGIC HANDLER
  const handleDelete = async (note) => {
    if (!isModOrAdmin) return;

    if (isAdmin) {
      if (window.confirm("অ্যাডমিন হিসেবে আপনি কি এই ফাইলটি স্থায়ীভাবে ডিলিট করতে চান?")) {
        await deleteDoc(doc(db, "notes", note.id));
      }
    } else if (currentUserRole === "Moderator") {
      if (window.confirm("মডারেটর হিসেবে আপনি এটি ডিলিট করার অনুরোধ পাঠাতে চান? এটি অ্যাডমিন রিভিউ করার পর ডিলিট হবে।")) {
        try {
          const noteRef = doc(db, "notes", note.id);
          const modName = myProfile.displayName || user.displayName || user.email.split('@')[0];
          await updateDoc(noteRef, {
            isPendingDelete: true,
            deletedByModName: modName
          });
          alert("ডিলিটের অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে!");
        } catch (error) {
          console.error("Mod delete request error:", error);
          alert("অনুরোধ পাঠাতে সমস্যা হয়েছে!");
        }
      }
    }
  };

  const handleAdminApproveDelete = async (noteId) => {
    if (!isAdmin) return;
    if (window.confirm("আপনি কি মডারেটরের এই ডিলিট অনুরোধ অনুমোদন করতে চান? পোস্টটি চিরতরে মুছে যাবে।")) {
      await deleteDoc(doc(db, "notes", noteId));
    }
  };

  const handleAdminCancelDeleteRequest = async (noteId) => {
    if (!isAdmin) return;
    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        isPendingDelete: false,
        deletedByModName: ""
      });
      alert("ডিলিট অনুরোধ বাতিল করা হয়েছে, পোস্টটি আবার স্বাভাবিক হলো।");
    } catch (error) {
      console.error(error);
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("লিংক কপি হয়েছে!");
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "Note-File";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      window.open(fileUrl, "_blank");
    }
  };

  const suggestedBooks = BOOK_LIST.filter(book => 
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = allNotes.filter(note => {
    const matchesSubject = selectedSubjectFilter ? note.subject.toLowerCase() === selectedSubjectFilter.toLowerCase() : true;
    const matchesDate = selectedDateFilter ? note.date === selectedDateFilter : true;
    return matchesSubject && matchesDate;
  });

  const dashboardFilteredNotes = selectedDashboardUid 
    ? allNotes.filter(n => n.uploaderUid === selectedDashboardUid)
    : allNotes;

  const pendingDeleteNotes = allNotes.filter(n => n.isPendingDelete);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>KGC Math '26 Hub</h1>
          <p style={styles.subLogo}>Kurigram Govt. College • Mathematics Dept.</p>
        </div>

        {user && (
          <div style={styles.navTabs}>
            <button onClick={() => setCurrentView("home")} style={{ ...styles.navBtn, ...(currentView === "home" ? styles.activeNavBtn : {}) }}>
              🏠 Home
            </button>
            <button onClick={() => setCurrentView("dashboard")} style={{ ...styles.navBtn, ...(currentView === "dashboard" ? styles.activeNavBtn : {}) }}>
              📊 Dashboard
            </button>
            <button onClick={() => setCurrentView("profile")} style={{ ...styles.navBtn, ...(currentView === "profile" ? styles.activeNavBtn : {}) }}>
              👤 My Profile
            </button>
          </div>
        )}

        <div style={styles.branding}>
          Designed by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={styles.brandLink}>Anondo</a>
        </div>
      </header>

      {!user ? (
        <div style={styles.heroSection}>
          <div style={styles.welcomeBox}>
            <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>স্বাগতম ম্যাথ ডিপার্টমেন্ট ২০২৪-২৫! 📚</h2>
            <p style={{ color: "#cbd5e1" }}>নোট দেখতে ও স্কোর জমা করতে প্রবেশ করুন।</p>
          </div>

          <div style={styles.authCard}>
            <h3 style={{ marginBottom: "15px", color: "#f8fafc" }}>অ্যাকাউন্টে প্রবেশ করুন</h3>
            <div style={styles.tabContainer}>
              <button onClick={() => setAuthMode("google")} style={{...styles.tab, ...(authMode === "google" ? styles.activeTab : {})}}>Google</button>
              <button onClick={() => setAuthMode("email")} style={{...styles.tab, ...(authMode === "email" ? styles.activeTab : {})}}>Email</button>
            </div>

            {authError && <p style={{ color: "#f87171", fontSize: "13px" }}>{authError}</p>}

            {authMode === "google" && (
              <button onClick={handleGoogleLogin} style={styles.googleBtn}>🌐 Continue with Google</button>
            )}

            {authMode === "email" && (
              <form onSubmit={handleEmailAuth} style={styles.form}>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
                {isSignUp && (
                  <input type="password" placeholder="Retype Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
                )}
                <button type="submit" style={styles.submitBtn}>{isSignUp ? "Sign Up" : "Log In"}</button>
                <p onClick={() => setIsSignUp(!isSignUp)} style={{ cursor: "pointer", color: "#38bdf8", marginTop: "10px", fontSize: "13px" }}>
                  {isSignUp ? "Account আছে? Log In করুন" : "Account নেই? Sign Up করুন"}
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.mainFeed}>
          
          <div style={styles.userBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img 
                src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" }}
              />
              <div>
                <span style={{ fontWeight: "bold", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                  {myProfile.displayName || user.displayName || user.email}
                  <RoleBadge role={currentUserRole} />
                </span>
                <span style={{ fontSize: "11px", color: "#cbd5e1" }}>
                  ⭐ {myProfile.points} Points | 🏆 Rank {getUserRank(user.uid)}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>লগ-আউট</button>
          </div>

          <div style={styles.animatedNoticeBanner}>
            <span style={styles.noticeIcon}>📢 <strong>জরুরি নোটিশ:</strong></span>
            <span style={styles.animatedNoticeText}>
              "৩ জন মডারেটর লাগবে, যারা ১-৩০ আগস্ট টপ leaderboard এ থাকবে তাদের নিয়োগ দেওয়া হবে website পরিচালনা করার জন্য।"
            </span>
          </div>

          {/* EDIT MY PROFILE VIEW */}
          {currentView === "profile" && (
            <div style={styles.profileSection}>
              <h2 style={{ color: "#38bdf8", marginBottom: "15px" }}>✏️ আমার প্রোফাইল তথ্য</h2>
              
              <div style={styles.scoreSummaryBox}>
                <div style={styles.scoreBoxItem}>
                  <span style={styles.scoreBoxLabel}>⭐ Total Points</span>
                  <span style={styles.scoreBoxValue}>{myProfile.points}</span>
                </div>
                <div style={styles.scoreBoxDivider}></div>
                <div style={styles.scoreBoxItem}>
                  <span style={styles.scoreBoxLabel}>🏆 Leaderboard Rank</span>
                  <span style={styles.scoreBoxValue}>{getUserRank(user.uid)}</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={styles.profileForm}>
                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <img 
                    src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Preview" 
                    style={{ width: "95px", height: "95px", borderRadius: "50%", objectFit: "cover", border: "3px solid #38bdf8", marginBottom: "8px" }}
                  />
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "10px" }}>
                    <RoleBadge role={currentUserRole} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1" }}>প্রোফাইল পিকচার (Max 5MB):</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setProfilePicFile(e.target.files[0])}
                      style={{ marginTop: "5px", color: "#94a3b8", display: "block", margin: "5px auto", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div style={styles.inputGrid}>
                  <div>
                    <label style={styles.label}>নাম:</label>
                    <input type="text" value={myProfile.displayName} onChange={(e) => setMyProfile({...myProfile, displayName: e.target.value})} required style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Department Roll No.:</label>
                    <input type="text" placeholder="e.g. 240105" value={myProfile.deptRoll} onChange={(e) => setMyProfile({...myProfile, deptRoll: e.target.value})} required style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>WhatsApp Number (Optional):</label>
                    <input type="text" placeholder="+88017xxxxxxxx" value={myProfile.whatsapp} onChange={(e) => setMyProfile({...myProfile, whatsapp: e.target.value})} style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Email Address:</label>
                    <input type="email" value={myProfile.email} onChange={(e) => setMyProfile({...myProfile, email: e.target.value})} required style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Facebook ID / Link (Optional):</label>
                    <input type="text" placeholder="https://facebook.com/yourid" value={myProfile.facebook} onChange={(e) => setMyProfile({...myProfile, facebook: e.target.value})} style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Date of Birth:</label>
                    <input type="date" value={myProfile.dob} onChange={(e) => setMyProfile({...myProfile, dob: e.target.value})} required style={styles.input} />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={styles.label}>Address / বাসস্থান:</label>
                    <input type="text" placeholder="e.g. Kurigram Sadar, Kurigram" value={myProfile.address} onChange={(e) => setMyProfile({...myProfile, address: e.target.value})} required style={styles.input} />
                  </div>
                </div>

                <button type="submit" disabled={savingProfile} style={styles.saveProfileBtn}>
                  {savingProfile ? "সেভ হচ্ছে..." : "💾 প্রোফাইল সেভ করুন"}
                </button>
              </form>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {currentView === "dashboard" && (
            <div style={styles.dashboardSection}>
              
              {isAdmin && pendingDeleteNotes.length > 0 && (
                <div style={styles.adminReviewBox}>
                  <h3 style={{ color: "#ef4444", margin: "0 0 10px 0", fontSize: "16px" }}>
                    ⚠️ Admin Review: মডারেটরদের ডিলিট করা রিকোয়েস্ট ({pendingDeleteNotes.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {pendingDeleteNotes.map(note => (
                      <div key={note.id} style={styles.reviewItem}>
                        <div>
                          <b style={{ color: "#fff" }}>{note.fileName}</b>
                          <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "2px 0" }}>
                            বিষয়: {note.subject} | রিকোয়েস্ট করেছেন মডারেটর: <span style={{ color: "#facc15" }}>{note.deletedByModName}</span>
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleAdminApproveDelete(note.id)} style={styles.approveBtn}>কনফার্ম ডিলিট ✅</button>
                          <button onClick={() => handleAdminCancelDeleteRequest(note.id)} style={styles.cancelReviewBtn}>বাতিল ❌</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.scoreBoardCard}>
                <h3 style={{ color: "#fbbf24", margin: "0 0 15px 0", fontSize: "18px" }}>
                  🏆 টপ স্কোরবোর্ড (Leaderboard)
                </h3>
                <div style={styles.leaderboardList}>
                  {leaderboardUsers.map((u, index) => {
                    const uRole = getUserRole(u.email, u.uid);
                    return (
                      <div key={u.id} style={styles.leaderItem}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "bold", color: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "#cbd5e1" }}>
                            #{index + 1}
                          </span>
                          <img src={u.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="u" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                          <span 
                            onClick={() => setViewingProfile(u)} 
                            style={{ color: "#38bdf8", cursor: "pointer", textDecoration: "underline", display: "flex", alignItems: "center", gap: "5px" }}
                          >
                            {u.displayName || "User"}
                            <RoleBadge role={uRole} />
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={styles.scoreBadge}>⭐ {u.points || 0} Pts</span>
                          {isAdmin && uRole !== "Admin" && (
                            <button 
                              onClick={() => handleToggleModerator(u)}
                              style={styles.makeModBtn}
                              title="Toggle Moderator Role"
                            >
                              {uRole === "Moderator" ? "Remove Mod 🛡️" : "Make Mod 🛡️"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.searchSection}>
                <h3 style={{ color: "#38bdf8", marginBottom: "12px", fontSize: "16px" }}>
                  👥 সকল রেজিস্টার্ড স্টুডেন্টস
                </h3>
                <div style={styles.userListGrid}>
                  <button 
                    onClick={() => setSelectedDashboardUid(null)}
                    style={{ ...styles.userCardBtn, backgroundColor: !selectedDashboardUid ? "#0284c7" : "#1e293b" }}
                  >
                    🌐 সকল ইউজার
                  </button>
                  {allUsers.map(u => {
                    return (
                      <div key={u.id} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button 
                          onClick={() => setSelectedDashboardUid(u.uid)}
                          style={{ 
                            ...styles.userCardBtn, 
                            backgroundColor: selectedDashboardUid === u.uid ? "#0284c7" : "#1e293b" 
                          }}
                        >
                          👤 {u.displayName || u.email.split('@')[0]}
                        </button>
                        <button 
                          onClick={() => setViewingProfile(u)}
                          style={styles.infoIconBtn}
                          title="View Profile Details"
                        >
                          ℹ️
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 style={{ color: "#f8fafc", margin: "20px 0 15px 0" }}>
                📁 {selectedDashboardUid ? "নির্বাচিত ইউজারের ফাইলসমূহ" : "সকল ফাইলসমূহ"} ({dashboardFilteredNotes.length})
              </h3>

              <div style={styles.notesGrid}>
                {dashboardFilteredNotes.map((n) => (
                  <NoteCardItem 
                    key={n.id} 
                    note={n} 
                    user={user} 
                    allUsers={allUsers}
                    isModOrAdmin={isModOrAdmin}
                    isAdmin={isAdmin}
                    handleReactionToggle={handleReactionToggle}
                    handleAddComment={handleAddComment}
                    handleDeleteComment={handleDeleteComment}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    handleDownload={handleDownload}
                    copyLink={copyLink}
                    handleDelete={handleDelete}
                    handleOpenEditModal={handleOpenEditModal}
                    setViewingProfile={setViewingProfile}
                    getUserRole={getUserRole}
                  />
                ))}
              </div>
            </div>
          )}

          {/* HOME VIEW */}
          {currentView === "home" && (
            <>
              <div style={styles.searchSection}>
                <h3 style={{ color: "#38bdf8", marginBottom: "12px", fontSize: "16px" }}>🔍 বিষয় ও তারিখ দিয়ে নোট খুঁজুন</h3>
                <div style={styles.filterGrid}>
                  <div style={{ position: "relative", flex: 2, minWidth: "220px" }}>
                    <input 
                      type="text" 
                      placeholder="বইয়ের নাম বা কোড দিয়ে খুঁজুন..." 
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      style={styles.searchInput}
                    />
                    {showSuggestions && searchQuery.trim() !== "" && (
                      <div style={styles.suggestionBox}>
                        {suggestedBooks.map((book, idx) => (
                          <div 
                            key={idx} 
                            style={styles.suggestionItem}
                            onClick={() => {
                              setSelectedSubjectFilter(book);
                              setSearchQuery(book);
                              setShowSuggestions(false);
                            }}
                          >
                            📖 {book}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <input 
                      type="date" 
                      value={selectedDateFilter}
                      onChange={(e) => setSelectedDateFilter(e.target.value)}
                      style={styles.dateFilterInput}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.uploadCard}>
                <h3 style={{ color: "#38bdf8", marginBottom: "15px" }}>📌 নতুন PDF / ছবি আপলোড করুন (+100 Points)</h3>
                <form onSubmit={handleUpload} style={styles.uploadForm}>
                  <div style={styles.inputGroup}>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} required>
                      {BOOK_LIST.map((item, index) => (
                        <option key={index} value={item} style={{ backgroundColor: "#1e293b", color: "#fff" }}>{item}</option>
                      ))}
                    </select>

                    <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} required style={styles.input} />
                  </div>

                  <input type="text" placeholder="write pdf info" value={pdfInfo} onChange={(e) => setPdfInfo(e.target.value)} style={{ ...styles.input, marginTop: "12px" }} />

                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} required style={{ margin: "15px 0", color: "#cbd5e1" }} />
                  
                  <button type="submit" disabled={uploading} style={styles.uploadBtn}>
                    {uploading ? "আপলোড হচ্ছে..." : "📤 নোট আপলোড করুন"}
                  </button>
                </form>
              </div>

              <h2 style={{ color: "#f8fafc", marginBottom: "15px", fontSize: "20px" }}>📖 সকল নোটস ({filteredNotes.length})</h2>
              
              <div style={styles.notesGrid}>
                {filteredNotes.map((n) => (
                  <NoteCardItem 
                    key={n.id} 
                    note={n} 
                    user={user} 
                    allUsers={allUsers}
                    isModOrAdmin={isModOrAdmin}
                    isAdmin={isAdmin}
                    handleReactionToggle={handleReactionToggle}
                    handleAddComment={handleAddComment}
                    handleDeleteComment={handleDeleteComment}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    handleDownload={handleDownload}
                    copyLink={copyLink}
                    handleDelete={handleDelete}
                    handleOpenEditModal={handleOpenEditModal}
                    setViewingProfile={setViewingProfile}
                    getUserRole={getUserRole}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* EDIT NOTE / RENAME MODAL */}
      {editingNote && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button onClick={() => setEditingNote(null)} style={styles.closeModalBtn}>✖</button>
            <h3 style={{ color: "#38bdf8", marginBottom: "15px" }}>✏️ ফাইলের নাম ও তথ্য পরিবর্তন করুন</h3>
            <form onSubmit={handleSaveNoteEdit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={styles.label}>ফাইলের নাম (File Name):</label>
                <input 
                  type="text" 
                  value={editFileName} 
                  onChange={(e) => setEditFileName(e.target.value)} 
                  required 
                  style={styles.input} 
                />
              </div>

              <div>
                <label style={styles.label}>PDF/নোট সংক্রান্ত তথ্য (Info):</label>
                <input 
                  type="text" 
                  value={editPdfInfo} 
                  onChange={(e) => setEditPdfInfo(e.target.value)} 
                  style={styles.input} 
                />
              </div>

              <button type="submit" style={styles.saveProfileBtn}>💾 সেভ করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC PROFILE VIEW MODAL */}
      {viewingProfile && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button onClick={() => setViewingProfile(null)} style={styles.closeModalBtn}>✖</button>
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <img 
                src={viewingProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                style={{ width: "85px", height: "85px", borderRadius: "50%", objectFit: "cover", border: "3px solid #38bdf8" }}
              />
              <h3 style={{ margin: "8px 0 4px 0", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {viewingProfile.displayName || "User Profile"}
                <RoleBadge role={getUserRole(viewingProfile.email, viewingProfile.uid)} />
              </h3>

              <div style={styles.modalScoreBar}>
                <span style={styles.modalBadge}>⭐ {viewingProfile.points || 0} Points</span>
                <span style={styles.modalBadgeRank}>🏆 Leaderboard Rank: {getUserRank(viewingProfile.uid)}</span>
              </div>
            </div>

            <div style={styles.profileDetailsList}>
              <p><b>🎓 Dept. Roll:</b> {viewingProfile.deptRoll || "N/A"}</p>
              <p><b>📱 WhatsApp:</b> {viewingProfile.whatsapp ? <a href={`https://wa.me/${viewingProfile.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: "#22c55e" }}>{viewingProfile.whatsapp}</a> : "N/A"}</p>
              <p><b>✉️ Email:</b> {viewingProfile.email || "N/A"}</p>
              <p><b>🎂 Date of Birth:</b> {viewingProfile.dob || "N/A"}</p>
              <p><b>📍 Address:</b> {viewingProfile.address || "N/A"}</p>
              {viewingProfile.facebook && (
                <p><b>🌐 Facebook:</b> <a href={viewingProfile.facebook} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>Profile Link</a></p>
              )}
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <p>© 2026 Kurigram Govt. College (Math Dept) | Developed with ❤️ by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={{color: "#38bdf8"}}>Anondo</a></p>
      </footer>
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === "Admin") {
    return <span style={styles.adminBadge}>👑 Admin</span>;
  }
  if (role === "Moderator") {
    return <span style={styles.modBadge}>🛡️ Moderator</span>;
  }
  return <span style={styles.studentBadge}>Student</span>;
}

function NoteCardItem({ note, user, allUsers, isModOrAdmin, isAdmin, handleReactionToggle, handleAddComment, handleDeleteComment, commentText, setCommentText, handleDownload, copyLink, handleDelete, handleOpenEditModal, setViewingProfile, getUserRole }) {
  const hasLoved = note.loves?.includes(user?.uid);
  const hasCared = note.cares?.includes(user?.uid);

  const uploaderProfile = allUsers.find(u => u.uid === note.uploaderUid);
  const uploaderRole = getUserRole(note.uploaderEmail || uploaderProfile?.email, note.uploaderUid);

  const isOwner = user && note.uploaderUid === user.uid;
  const canEdit = isOwner || isModOrAdmin;

  return (
    <div style={styles.noteCard}>
      <div>
        <div style={styles.cardHeader}>
          <span style={styles.subjectTag}>📖 {note.subject}</span>
          <span style={styles.dateTag}>🗓️ {note.date}</span>
        </div>

        <h4 style={styles.fileName}>{note.fileName}</h4>
        {note.pdfInfo && <p style={styles.pdfInfoTag}>ℹ️ {note.pdfInfo}</p>}
        
        {note.isPendingDelete && (
          <div style={styles.pendingAlertTag}>
            ⚠️ ডিলিট রিভিউ অপেক্ষায় (মডারেটর: {note.deletedByModName})
          </div>
        )}

        <p style={styles.uploaderText}>
          Uploaded by:{" "}
          <b 
            onClick={() => uploaderProfile && setViewingProfile(uploaderProfile)} 
            style={{ color: "#38bdf8", cursor: "pointer", textDecoration: "underline" }}
          >
            {note.uploadedBy}
          </b>
          {" "}<RoleBadge role={uploaderRole} />
        </p>
      </div>

      <div style={styles.cardActions}>
        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>👁️ দেখুন</a>
        <button onClick={() => handleDownload(note.fileUrl, note.fileName)} style={styles.downloadBtn}>📥 ডাউনলোড</button>
        <button onClick={() => copyLink(note.fileUrl)} style={styles.copyBtn}>🔗</button>
        
        {canEdit && (
          <button onClick={() => handleOpenEditModal(note)} style={styles.editBtn} title="Rename / Edit Note">
            ✏️
          </button>
        )}

        {isModOrAdmin && (
          <button onClick={() => handleDelete(note)} style={styles.deleteBtn} title={isAdmin ? "Delete Note" : "Request Delete"}>
            {isAdmin ? "🗑️" : "🗑️(Req)"}
          </button>
        )}
      </div>

      <div style={styles.interactiveBox}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          
          {/* ❤️ LOVE BUTTON WITH ANIMATION CLASS */}
          <button 
            onClick={() => handleReactionToggle(note, "love")} 
            className={hasLoved ? "reaction-btn active-pop" : "reaction-btn"}
            style={{ 
              ...styles.reactionStyleBtn, 
              backgroundColor: hasLoved ? "#ef4444" : "#334155",
              border: hasLoved ? "1px solid #f87171" : "none"
            }}
          >
            ❤️ {note.loves?.length || 0}
          </button>

          {/* 🥰 CARE BUTTON WITH ANIMATION CLASS */}
          <button 
            onClick={() => handleReactionToggle(note, "care")} 
            className={hasCared ? "reaction-btn active-pop" : "reaction-btn"}
            style={{ 
              ...styles.reactionStyleBtn, 
              backgroundColor: hasCared ? "#f59e0b" : "#334155",
              border: hasCared ? "1px solid #fbbf24" : "none"
            }}
          >
            🥰 {note.cares?.length || 0}
          </button>

          <span style={{ fontSize: "11px", color: "#cbd5e1", marginLeft: "auto" }}>💬 {note.comments?.length || 0} Comments</span>
        </div>

        <div style={styles.commentList}>
          {note.comments?.map((c) => {
            const commentUserRole = getUserRole(c.userEmail, c.userUid);
            return (
              <div key={c.id} style={styles.singleComment}>
                <div style={{ flex: 1 }}>
                  <b>{c.userName}</b> <RoleBadge role={commentUserRole} />: {c.text}
                </div>
                {isModOrAdmin && (
                  <button 
                    onClick={() => handleDeleteComment(note.id, c)} 
                    style={styles.deleteCommentBtn}
                    title="Delete Comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={(e) => handleAddComment(e, note)} style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
          <input 
            type="text" 
            placeholder="কমেন্ট লিখুন..." 
            value={commentText[note.id] || ""} 
            onChange={(e) => setCommentText({ ...commentText, [note.id]: e.target.value })}
            style={styles.commentInput}
          />
          <button type="submit" style={styles.sendCommentBtn}>পাঠান</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#0f172a", minHeight: "100vh", color: "#f8fafc" },
  header: { backgroundColor: "rgba(15, 23, 42, 0.9)", padding: "15px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(56, 189, 248, 0.2)", flexWrap: "wrap", gap: "10px" },
  logo: { fontSize: "20px", color: "#38bdf8", margin: 0, fontWeight: "bold" },
  subLogo: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  branding: { fontSize: "12px", color: "#cbd5e1" },
  brandLink: { color: "#4ade80", textDecoration: "none", fontWeight: "bold" },
  navTabs: { display: "flex", gap: "8px" },
  navBtn: { padding: "8px 14px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#cbd5e1", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  activeNavBtn: { backgroundColor: "#0284c7", color: "#fff", borderColor: "#38bdf8" },

  heroSection: { maxWidth: "450px", margin: "40px auto", padding: "0 20px" },
  welcomeBox: { textAlign: "center", marginBottom: "25px" },
  authCard: { backgroundColor: "#1e293b", padding: "25px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "center" },
  tabContainer: { display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" },
  tab: { padding: "8px 20px", border: "none", background: "#334155", color: "#cbd5e1", borderRadius: "8px", cursor: "pointer" },
  activeTab: { background: "#0284c7", color: "#fff" },
  googleBtn: { width: "100%", padding: "12px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "#0f172a", color: "#fff", fontSize: "13px", width: "100%", boxSizing: "border-box" },
  label: { display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" },
  submitBtn: { padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  
  mainFeed: { maxWidth: "900px", margin: "20px auto", padding: "0 15px" },
  userBar: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", padding: "12px 15px", borderRadius: "12px", marginBottom: "15px" },
  
  animatedNoticeBanner: {
    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 50%, #854d0e 100%)",
    border: "2px solid #facc15",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
    animation: "noticeBlink 2.5s infinite ease-in-out"
  },
  noticeIcon: { color: "#facc15", fontSize: "14px", flexShrink: 0 },
  animatedNoticeText: { color: "#ffffff", fontSize: "13px", fontWeight: "bold", lineHeight: "1.4", animation: "textGlow 2s infinite" },

  studentBadge: { backgroundColor: "#0284c7", color: "#fff", padding: "2px 6px", borderRadius: "6px", fontSize: "10px" },
  adminBadge: { backgroundColor: "#f59e0b", color: "#000", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", boxShadow: "0 0 6px rgba(245, 158, 11, 0.6)" },
  modBadge: { backgroundColor: "#8b5cf6", color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", boxShadow: "0 0 6px rgba(139, 92, 246, 0.6)" },

  logoutBtn: { backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },

  profileSection: { backgroundColor: "#1e293b", padding: "20px", borderRadius: "16px", marginBottom: "25px" },
  scoreSummaryBox: { display: "flex", justifyContent: "space-around", alignItems: "center", backgroundColor: "#0f172a", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid rgba(56, 189, 248, 0.3)" },
  scoreBoxItem: { textAlign: "center", display: "flex", flexDirection: "column" },
  scoreBoxLabel: { fontSize: "12px", color: "#cbd5e1" },
  scoreBoxValue: { fontSize: "20px", fontWeight: "bold", color: "#fbbf24", marginTop: "4px" },
  scoreBoxDivider: { width: "1px", height: "35px", backgroundColor: "#334155" },

  profileForm: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" },
  saveProfileBtn: { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", marginTop: "10px" },

  adminReviewBox: { backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", padding: "15px", borderRadius: "12px", marginBottom: "20px" },
  reviewItem: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "10px", borderRadius: "8px", flexWrap: "wrap", gap: "8px" },
  approveBtn: { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  cancelReviewBtn: { backgroundColor: "#334155", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },

  scoreBoardCard: { backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #f59e0b" },
  leaderboardList: { display: "flex", flexDirection: "column", gap: "8px" },
  leaderItem: { display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#0f172a", borderRadius: "8px", fontSize: "13px", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  scoreBadge: { color: "#4ade80", fontWeight: "bold" },
  makeModBtn: { backgroundColor: "#8b5cf6", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" },

  userListGrid: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" },
  userCardBtn: { border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  infoIconBtn: { backgroundColor: "#334155", color: "#fff", border: "none", padding: "6px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },

  dashboardSection: { marginBottom: "30px" },
  searchSection: { backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", marginBottom: "20px" },
  filterGrid: { display: "flex", gap: "10px", flexWrap: "wrap" },
  searchInput: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "#0f172a", color: "#fff", fontSize: "13px" },
  dateFilterInput: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "#0f172a", color: "#fff", fontSize: "13px" },
  suggestionBox: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", zIndex: 10, maxHeight: "150px", overflowY: "auto" },
  suggestionItem: { padding: "8px", cursor: "pointer", fontSize: "12px", color: "#cbd5e1" },

  uploadCard: { backgroundColor: "#1e293b", padding: "20px", borderRadius: "16px", marginBottom: "25px" },
  uploadForm: { display: "flex", flexDirection: "column" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  uploadBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" },
  noteCard: { backgroundColor: "#1e293b", padding: "16px", borderRadius: "12px", border: "1px solid rgba(56, 189, 248, 0.2)", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" },
  subjectTag: { backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "5px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" },
  dateTag: { color: "#94a3b8", fontSize: "11px" },
  fileName: { fontSize: "14px", color: "#f8fafc", margin: "5px 0" },
  pdfInfoTag: { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "4px", borderRadius: "6px", fontSize: "12px", marginBottom: "6px" },
  pendingAlertTag: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "5px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", marginBottom: "6px", border: "1px solid #ef4444" },
  uploaderText: { fontSize: "12px", color: "#64748b", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px" },
  
  cardActions: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" },
  viewBtn: { flex: "1", backgroundColor: "#0284c7", color: "#fff", textDecoration: "none", textAlign: "center", padding: "6px", borderRadius: "6px", fontSize: "12px" },
  downloadBtn: { flex: "1", backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" },
  copyBtn: { backgroundColor: "#334155", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  editBtn: { backgroundColor: "#eab308", color: "#000", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  deleteBtn: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" },

  interactiveBox: { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" },
  reactionStyleBtn: { color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" },
  commentList: { maxHeight: "95px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#0f172a", padding: "6px", borderRadius: "6px" },
  singleComment: { fontSize: "11px", color: "#cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" },
  deleteCommentBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "11px", opacity: 0.8 },
  commentInput: { flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#fff", fontSize: "12px" },
  sendCommentBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "15px" },
  modalCard: { backgroundColor: "#1e293b", padding: "20px", borderRadius: "16px", maxWidth: "380px", width: "100%", position: "relative", border: "1px solid rgba(56,189,248,0.3)" },
  closeModalBtn: { position: "absolute", top: "12px", right: "12px", backgroundColor: "transparent", border: "none", color: "#f87171", fontSize: "16px", cursor: "pointer" },
  modalScoreBar: { display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" },
  modalBadge: { backgroundColor: "#16a34a", color: "#fff", padding: "3px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" },
  modalBadgeRank: { backgroundColor: "#0284c7", color: "#fff", padding: "3px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" },
  profileDetailsList: { backgroundColor: "#0f172a", padding: "12px", borderRadius: "10px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" },

  footer: { textAlign: "center", padding: "20px 15px", backgroundColor: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "12px", color: "#94a3b8" }
};

export default App;
