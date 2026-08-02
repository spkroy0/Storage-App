import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, provider, db } from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
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
  arrayRemove,
  getDocs,
  where
} from "firebase/firestore";

// SVG Icons import from Lucide React
import { 
  Home, LayoutDashboard, User, LogOut, Shield,
  Search, Calendar, UploadCloud, FileText, Download, Copy, Edit, Trash2,
  Heart, MessageCircle, Send, Crown, Award, CheckCircle, XCircle, Info, Ban, UserX, AlertTriangle, ExternalLink, Check, GraduationCap, Bell, Activity, Building, KeyRound, CheckCheck, Image as ImageIcon
} from "lucide-react";

// PDF.js for converting PDF pages to images
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const BOOK_LIST = [
  "Notice for Students ★",
  "ফান্ডামেন্টাল অব ম্যাথমেটিক্স (Fundamentals of Mathematics) – কোড: ২১৩৭০১",
  "ক্যালকুলাস-১ (Calculus-I) – কোড: ২১৩৭০৩",
  "লিনিয়ার অ্যালজেব্রা অ্যান্ড অ্যানালিটিক জিওমেট্রি (Linear Algebra and Analytic Geometry) – কোড: ২১৩৭০৫",
  "ম্যাথ ল্যাব-প্র্যাকটিক্যাল (Math Lab-Practical I: Mathematica) – কোড: ২১৩৭০৬",
  "ফিজিক্স-১ (Physics I - Mechanics, Properties of Matter, Waves and Optics) – কোড: ২১২৭০৭",
  "ফিজিক্স-২ (Physics II - Heat, Thermodynamics, and Radiation) – কোড: ২১২৭০৯",
  "তথ্য ও যোগাযোগ প্রযুক্তি (ICT) ",
  "Chemistry-I (212807)",
  "ফান্ডামেন্টাল অব স্ট্যাটিস্টিক্স -1 (Fundamentals of Statistics) – কোড: ২১৩৬০৭",
  "স্ট্যাটিস্টিক্স ল্যাব (Lab-1: Fundamentals of Statistics) – কোড: ২১৩৬১০",
  "প্রিন্সিপালস অব ইকোনমিক্স (Principles of Economics) – কোড: ২১২২০৯",
  "বাংলাদেশের অভ্যুদয়ের ইতিহাস (History of the Emergence of Independent Bangladesh) – কোড: ২১২১১১",
  "ক্যালকুলাস-২ (Calculus-II) – কোড: ২২৩৭০১",
  "অর্ডিনারি ডিফারেনশিয়াল ইকুয়েশনস (Ordinary Differential Equations) – কোড: ২২৩৭০৩",
  "কম্পিউটার প্রোগ্রামিং (ফোরট্রান - Fortran) – কোড: ২২৩৭০৫",
  "ম্যাথ ল্যাব (Math Lab Practical) – কোড: ২২৩৭০৬",
  "ফিজিক্স -3",
  "কেমিস্ট্রি -2",
  "স্ট্যাটিস্টিক্স- 2",
  "ইংরেজি (আবশ্যিক - অবৈতনিক/নন-ক্রেডিট)",
  "অ্যাবস্ট্রাক্ট অ্যালজেব্রা (Abstract Algebra) – কোড: ২৩৩৭০১",
  "রিয়েল অ্যানালিসিস (Real Analysis) – কোড: ২৩৩৭০৩",
  "নিউমেরিক্যাল অ্যানালিসিস (Numerical Analysis) – কোড: ২৩৩৭০৫",
  "কমপ্লেক্স অ্যানালিসিস (Complex Analysis) – কোড: ২৩৩৭০৭",
  "ডিফারেনশিয়াল জিওমেট্রি (Differential Geometry) – কোড: ২৩৩৭০৯",
  "মেকানিক্স (Mechanics) – কোড: ২৩3৭১১",
  "লিনিয়ার প্রোগ্রামিং (Linear Programming) – কোড: ২৩3৭১৩",
  "ভাইভা-ভেসিলি / মৌখিক পরীক্ষা (Viva-Voce) – কোড: ২৩৩৭২০",
  "থিওরি অব নাম্বারস (Theory of Numbers) – কোড: ২৪৩৭০১",
  "টপোলজি অ্যান্ড ফাংশনাল অ্যানালিসিস (Topology & Functional Analysis) – কোড: ২৪৩৭০৩",
  "মেথডস অব অ্যাপ্লায়েড ম্যাথমেটিক্স (Methods of Applied Mathematics) – কোড: ২৪৩৭০৫",
  "টেন্সর অ্যানালিসিস (Tensor Analysis) – কোড: ২৪৩৭০৭",
  "পারশিয়াল ডিফারেনশিয়াল ইকুয়েশনস (Partial Differential Equations) – কোড: ২৪৩৭০৯",
  "হাইড্রোডাইনামিক্স (Hydrodynamics) – কোড: ২৪3৭১১",
  "ভাইভা-ভেসিলি (Viva-Voce) – কোড: ২৪৩৭২০",
  "ডিসক্রিট ম্যাথমেটিক্স (Discrete Mathematics) – কোড: ২৪3৭১৩",
  "অ্যাস্ট্রোনমি (Astronomy) – কোড: ২৪3৭১৫",
  "ম্যাথমেটিক্যাল মডেলিং ইন বায়োলজি (Mathematical Modeling in Biology) – কোড: ২৪3৭১৭",
  "ম্যাথ ল্যাব প্র্যাকটিক্যাল (Math Lab - Practical) – কোড: ২৪৩৭১৮"
];

// Permanent Admin Email List
const ADMIN_EMAILS = ["spkroy2006@gmail.com"];

// WHATSAPP CLICK TO COPY COMPONENT
function WhatsAppCopyButton({ number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!number) return <span>N/A</span>;

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      {copied && (
        <span style={styles.copyToast}>Copied!</span>
      )}
      <button 
        type="button" 
        onClick={handleCopy} 
        style={styles.waCopyBtn}
        title="Click to copy WhatsApp number"
      >
        <span>{number}</span>
        {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color="#22c55e" />}
      </button>
    </div>
  );
}

// ROLE BADGE COMPONENT
function RoleBadge({ role }) {
  if (role === "Admin") {
    return <span style={styles.adminBadge} className="rgb-pulse"><Crown size={11} /> Admin</span>;
  }
  if (role === "Moderator") {
    return <span style={styles.modBadge}><Shield size={11} /> Moderator</span>;
  }
  return <span style={styles.studentBadge}>Student</span>;
}

function NoteCardItem({ 
  note, 
  user, 
  allUsers, 
  isModOrAdmin, 
  isAdmin, 
  isCurrentUserBanned, 
  handleReactionToggle, 
  handleAddComment, 
  handleDeleteComment, 
  commentText, 
  setCommentText, 
  handleDownload, 
  copyLink, 
  handleDelete, 
  handleOpenEditModal, 
  setViewingProfile, 
  getUserRole 
}) {
  const hasLoved = note.loves?.includes(user?.uid);

  const uploaderProfile = allUsers.find(u => u.uid === note.uploaderUid);
  const uploaderRole = getUserRole(note.uploaderEmail || uploaderProfile?.email, note.uploaderUid);

  const isOwner = user && note.uploaderUid === user.uid;
  const canEdit = isOwner || isModOrAdmin;

  return (
    <div style={styles.noteCard}>
      <div>
        <div style={styles.cardHeader}>
          <span style={styles.subjectTag}>{note.subject}</span>
          <span style={styles.dateTag}><Calendar size={12} /> {note.date}</span>
        </div>

        <h4 style={styles.fileName}>{note.fileName}</h4>
        {note.pdfInfo && <p style={styles.pdfInfoTag}><Info size={12} /> {note.pdfInfo}</p>}
        
        {note.isPendingDelete && (
          <div style={styles.pendingAlertTag}>
            <AlertTriangle size={12} /> ডিলিট পেন্ডিং (মডারেটর: {note.deletedByModName})
          </div>
        )}

        <p style={styles.uploaderText}>
          Uploaded by:{" "}
          <b 
            onClick={() => uploaderProfile && setViewingProfile(uploaderProfile)} 
            style={{ color: "#38bdf8", cursor: "pointer", fontWeight: "500" }}
          >
            {note.uploadedBy}
          </b>
          {" "}<RoleBadge role={uploaderRole} />
        </p>
      </div>

      <div style={styles.cardActions}>
        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>দেখুন</a>
        <button onClick={() => handleDownload(note.fileUrl, note.fileName, note.pages)} style={styles.downloadBtn}><Download size={13} /></button>
        <button onClick={() => copyLink(note.fileUrl)} style={styles.copyBtn}><Copy size={13} /></button>
        
        {canEdit && (
          <button onClick={() => handleOpenEditModal(note)} style={styles.editBtn} title="Edit Note">
            <Edit size={13} />
          </button>
        )}

        {isModOrAdmin && (
          <button onClick={() => handleDelete(note)} style={styles.deleteBtn} title={isAdmin ? "Delete Note" : "Request Delete"}>
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div style={styles.interactiveBox}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <button 
            onClick={() => handleReactionToggle(note, "love")} 
            disabled={isCurrentUserBanned}
            style={{ 
              ...styles.reactionStyleBtn, 
              backgroundColor: hasLoved ? "#ef4444" : "#1e293b",
              color: hasLoved ? "#fff" : "#94a3b8",
              border: hasLoved ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <Heart size={14} fill={hasLoved ? "#fff" : "none"} /> {note.loves?.length || 0}
          </button>

          <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            <MessageCircle size={13} /> {note.comments?.length || 0}
          </span>
        </div>

        <div style={styles.commentList}>
          {note.comments?.map((c, index) => {
            const commentUserRole = getUserRole(c.userEmail, c.userUid);
            return (
              <div key={c.id || index} style={styles.singleComment}>
                <div style={{ flex: 1 }}>
                  <b>{c.userName}</b> <RoleBadge role={commentUserRole} />: {c.text}
                </div>
                {isModOrAdmin && (
                  <button 
                    onClick={() => handleDeleteComment(note.id, c)} 
                    style={styles.deleteCommentBtn}
                  >
                    <Trash2 size={11} color="#f87171" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isCurrentUserBanned && (
          <form onSubmit={(e) => handleAddComment(e, note)} style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <input 
              type="text" 
              placeholder="কমেন্ট করুন..." 
              value={commentText[note.id] || ""} 
              onChange={(e) => setCommentText({ ...commentText, [note.id]: e.target.value })}
              style={styles.commentInput}
            />
            <button type="submit" style={styles.sendCommentBtn}><Send size={12} /></button>
          </form>
        )}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home"); 
  
  const [allNotes, setAllNotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [uploadedBytesText, setUploadedBytesText] = useState("");
  
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [viewingProfile, setViewingProfile] = useState(null);

  const [editingNote, setEditingNote] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [editPdfInfo, setEditPdfInfo] = useState("");

  const [files, setFiles] = useState([]); // Multiple files/images state with custom customName & file object
  const [subject, setSubject] = useState(BOOK_LIST[0]);
  const [noteDate, setNoteDate] = useState("");
  const [pdfInfo, setPdfInfo] = useState(""); 
  
  const [authMode, setAuthMode] = useState("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const [showWelcomeMsg, setShowWelcomeMsg] = useState(false);

  const [deviceMode, setDeviceMode] = useState("auto"); 
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      if (deviceMode === "auto") {
        setIsMobileView(window.innerWidth <= 768);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [deviceMode]);

  const activeIsMobile = deviceMode === "mobile" ? true : deviceMode === "desktop" ? false : isMobileView;

  const [myProfile, setMyProfile] = useState({
    displayName: "",
    whatsapp: "",
    email: "",
    facebook: "",
    dob: "",
    address: "",
    deptRoll: "",
    instituteName: "", 
    hscCollege: "",
    hscYear: "",
    hscGpa: "",
    photoUrl: "",
    points: 0,
    role: "Student",
    isBanned: false
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedDashboardUid, setSelectedDashboardUid] = useState(null);
  const [commentText, setCommentText] = useState({});

  const FILE_HOST_API_KEY = (typeof process !== "undefined" && process.env?.REACT_APP_IMGBB_API_KEY) || 
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_IMGBB_API_KEY) || 
    "5bbd692b6ba3cbb1ce420857c904c34b"; 

  const getUserRole = (uEmail, uUid) => {
    if (uEmail && ADMIN_EMAILS.includes(uEmail.toLowerCase())) return "Admin";
    const foundUser = allUsers.find(u => u.uid === uUid || (uEmail && u.email === uEmail));
    return foundUser?.role || "Student";
  };

  const currentUserObj = allUsers.find(u => u.uid === user?.uid);
  const isCurrentUserBanned = currentUserObj?.isBanned || false;

  const currentUserRole = user ? getUserRole(user.email, user.uid) : "Student";
  const isAdmin = currentUserRole === "Admin";
  const isModOrAdmin = currentUserRole === "Admin" || currentUserRole === "Moderator";

  const isProfileIncomplete = user && (
    !myProfile.displayName?.trim() ||
    !myProfile.instituteName?.trim() ||
    !myProfile.deptRoll?.trim() ||
    !myProfile.address?.trim()
  );

  const logActivity = async (action, details) => {
    try {
      const uName = myProfile.displayName || user?.displayName || user?.email?.split("@")[0] || "System";
      await addDoc(collection(db, "activity_logs"), {
        userUid: user?.uid || "system",
        userName: uName,
        userRole: currentUserRole,
        action: action,
        details: details,
        createdAt: new Date()
      });
    } catch (e) {
      console.error("Log Activity Error:", e);
    }
  };

  const pushNotification = async (targetUid, title, message, type = "info", fileUrl = null) => {
    try {
      await addDoc(collection(db, "notifications"), {
        targetUid: targetUid, 
        title: title,
        message: message,
        type: type,
        fileUrl: fileUrl,
        createdAt: new Date(),
        readBy: []
      });
    } catch (e) {
      console.error("Push Notification Error:", e);
    }
  };

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
      if (currentUser && !user) {
        setShowWelcomeMsg(true);
        setTimeout(() => {
          setShowWelcomeMsg(false);
        }, 5000);
      }

      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          email: currentUser.email,
        }, { merge: true });
      }
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSiteLogoUrl(docSnap.data().logoUrl || "");
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
            instituteName: foundMe.instituteName || "",
            hscCollege: foundMe.hscCollege || "",
            hscYear: foundMe.hscYear || "",
            hscGpa: foundMe.hscGpa || "",
            photoUrl: foundMe.photoUrl || "",
            points: foundMe.points || 0,
            role: foundMe.role || "Student",
            isBanned: foundMe.isBanned || false
          });
        }
      }
    });

    const logsQuery = query(collection(db, "activity_logs"), orderBy("createdAt", "desc"));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const notifQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribeNotifs = onSnapshot(notifQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeNotes();
      unsubscribeUsers();
      unsubscribeLogs();
      unsubscribeNotifs();
    };
  }, []);

  const handleLogoUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("শুধুমাত্র অ্যাডমিন লোগো পরিবর্তন করতে পারবেন!");
      return;
    }
    if (!newLogoFile) {
      alert("অনুগ্রহ করে একটি লোগো ছবি সিলেক্ট করুন!");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", newLogoFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success || result.data?.url) {
        const logoUrl = result.data.url;
        const settingsRef = doc(db, "settings", "general");
        await setDoc(settingsRef, { logoUrl: logoUrl }, { merge: true });

        await logActivity("Logo Updated", "অ্যাডমিন ওয়েবসাইটের লোগো পরিবর্তন করেছেন।");
        setNewLogoFile(null);
        setUploadingLogo(false);
        alert("লোগো সফলভাবে আপডেট করা হয়েছে!");
      } else {
        throw new Error("Logo upload failed");
      }
    } catch (err) {
      console.error(err);
      setUploadingLogo(false);
      alert("লোগো আপলোড করতে সমস্যা হয়েছে!");
    }
  };

  const visibleUsers = allUsers.filter(u => isAdmin ? true : !u.isBanned);

  const leaderboardEligibleUsers = visibleUsers.filter(u => !u.isBanned);
  const admins = leaderboardEligibleUsers.filter(u => getUserRole(u.email, u.uid) === "Admin");
  const nonAdmins = leaderboardEligibleUsers
    .filter(u => getUserRole(u.email, u.uid) !== "Admin")
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const leaderboardUsers = [...admins, ...nonAdmins];

  const getUserRank = (targetUid, targetEmail) => {
    if (getUserRole(targetEmail, targetUid) === "Admin") return "Admin";
    const rankIndex = nonAdmins.findIndex(u => u.uid === targetUid);
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

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setAuthError("");
    setResetMessage("");

    if (!email || !email.trim()) {
      setAuthError("অনুগ্রহ করে আপনার ইমেইল এড্রেসটি লিখুন!");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setResetMessage("আপনার ইমেইলে রিসেট কোড/লিংক পাঠানো হয়েছে! ইমেইলের Inbox বা Spam ফোল্ডার চেক করুন।");
      })
      .catch((err) => {
        setAuthError(err.message);
      });
  };

  const handleLogout = () => signOut(auth);

  const handleToggleBanUser = async (targetUser) => {
    if (!isAdmin) return;
    if (getUserRole(targetUser.email, targetUser.uid) === "Admin") {
      alert("অ্যাডমিনকে ব্যান করা সম্ভব নয়!");
      return;
    }

    const nextBanState = !targetUser.isBanned;
    const confirmMsg = nextBanState 
      ? `আপনি কি ${targetUser.displayName || targetUser.email}-কে ব্যান করতে চান?`
      : `আপনি কি ${targetUser.displayName || targetUser.email}-কে আনব্যান করতে চান?`;

    if (window.confirm(confirmMsg)) {
      try {
        const userRef = doc(db, "users", targetUser.id);
        await updateDoc(userRef, { isBanned: nextBanState });

        const statusText = nextBanState ? "ব্যান করা হয়েছে" : "আনব্যান করা হয়েছে";
        await logActivity("Ban Status Changed", `${targetUser.displayName || targetUser.email}-কে ${statusText}`);

        await pushNotification(
          targetUser.uid, 
          nextBanState ? "Account Suspended!" : "Account Re-activated!",
          nextBanState 
            ? "আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক ব্যান করা হয়েছে।" 
            : "আপনার অ্যাকাউন্টটি সফলভাবে আনব্যান করা হয়েছে।",
          nextBanState ? "error" : "success"
        );

        alert(nextBanState ? "ইউজার ব্যান করা হয়েছে।" : "ইউজার আনব্যান করা হয়েছে।");
      } catch (err) {
        console.error(err);
        alert("অপারেশন ব্যর্থ হয়েছে!");
      }
    }
  };

  const handlePermanentlyRemoveUser = async (targetUser) => {
    if (!isAdmin) return;
    if (getUserRole(targetUser.email, targetUser.uid) === "Admin") {
      alert("অ্যাডমিনকে রিমুভ করা সম্ভব নয়!");
      return;
    }

    if (window.confirm(`আপনি কি স্থায়ীভাবে ${targetUser.displayName || targetUser.email}-কে রিমুভ করতে চান? এর ফলে তার পোস্ট, কমেন্ট এবং সকল ডাটা মুছে যাবে!`)) {
      try {
        const targetUid = targetUser.uid;

        const notesQuery = query(collection(db, "notes"), where("uploaderUid", "==", targetUid));
        const userNotesSnap = await getDocs(notesQuery);
        const noteDeletePromises = userNotesSnap.docs.map(docSnap => deleteDoc(doc(db, "notes", docSnap.id)));
        await Promise.all(noteDeletePromises);

        const commentUpdatePromises = allNotes.map(async (n) => {
          const userComments = n.comments?.filter(c => c.userUid === targetUid) || [];
          if (userComments.length > 0) {
            const noteRef = doc(db, "notes", n.id);
            for (let c of userComments) {
              await updateDoc(noteRef, { comments: arrayRemove(c) });
            }
          }
        });
        await Promise.all(commentUpdatePromises);

        const logsQuery = query(collection(db, "activity_logs"), where("userUid", "==", targetUid));
        const logsSnap = await getDocs(logsQuery);
        const logDeletePromises = logsSnap.docs.map(docSnap => deleteDoc(doc(db, "activity_logs", docSnap.id)));
        await Promise.all(logDeletePromises);

        await deleteDoc(doc(db, "users", targetUser.id));

        await logActivity("User Permanently Removed", `${targetUser.displayName || targetUser.email}-কে স্থায়ীভাবে সিস্টেম থেকে মুছে ফেলা হয়েছে।`);

        alert("ইউজার ও তার তৈরি সকল ডাটা স্থায়ীভাবে রিমুভ করা হয়েছে!");
      } catch (err) {
        console.error(err);
        alert("ইউজার রিমুভ করতে সমস্যা হয়েছে!");
      }
    }
  };

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
      : `আপনি কি ${targetUser.displayName || targetUser.email}-কে মডারেটর থেকে ফেরত নিতে চান?`;

    if (window.confirm(confirmMsg)) {
      try {
        const userRef = doc(db, "users", targetUser.id);
        await updateDoc(userRef, { role: newRole });

        await logActivity("Role Change", `${targetUser.displayName || targetUser.email}-এর রোল পরিবর্তন করা হয়েছে: ${newRole}`);
        
        await pushNotification(
          targetUser.uid,
          "Role Updated!",
          `আপনার রোল আপডেট করা হয়েছে। বর্তমান রোল: ${newRole}`,
          "info"
        );

        alert(`রোল সফলভাবে আপডেট হয়েছে: ${newRole}`);
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
        } else {
          throw new Error("Image Upload Failed");
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
        instituteName: myProfile.instituteName,
        hscCollege: myProfile.hscCollege,
        hscYear: myProfile.hscYear,
        hscGpa: myProfile.hscGpa,
        photoUrl: finalPhotoUrl
      });

      await logActivity("Profile Updated", "ইউজার তার প্রোফাইল তথ্য আপডেট করেছেন।");

      setSavingProfile(false);
      alert("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
    } catch (error) {
      console.error(error);
      setSavingProfile(false);
      alert("প্রোফাইল আপডেট করতে সমস্যা হয়েছে!");
    }
  };

  // Handle files selection with preview and name mapping
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFileEntries = selectedFiles.map((file) => ({
      file: file,
      name: file.name,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFileEntries]);
    e.target.value = null; // Reset input so same file can be chosen again if needed
  };

  // Remove a specific selected file before upload
  const handleRemoveSelectedFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Rename a specific selected file before upload
  const handleRenameSelectedFile = (indexToRename, newName) => {
    setFiles(prev => prev.map((item, index) => {
      if (index === indexToRename) {
        return { ...item, name: newName };
      }
      return item;
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (isCurrentUserBanned) {
      alert("আপনার অ্যাকাউন্টটি ব্যান রয়েছে।");
      return;
    }

    if (files.length === 0 || !subject || !noteDate) {
      alert("অনুগ্রহ করে ফাইল/ছবি, বিষয় এবং তারিখ প্রদান করুন!");
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadSpeed("প্রক্রিয়াকরণ হচ্ছে...");
    setUploadedBytesText("0%");

    try {
      let imageUrls = [];
      const totalFiles = files.length;

      for (let index = 0; index < totalFiles; index++) {
        const currentFileObj = files[index];
        const currentFile = currentFileObj.file;
        
        if (currentFile.type === "application/pdf" || currentFile.name.endsWith(".pdf")) {
          const arrayBuffer = await currentFile.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;

          for (let i = 1; i <= numPages; i++) {
            setUploadSpeed(`ফাইল ${index + 1}/${totalFiles} (পেজ ${i}/${numPages}) প্রসেস হচ্ছে...`);
            setUploadProgress(Math.round(((index + (i / numPages)) / totalFiles) * 80));

            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            const blob = await (await fetch(dataUrl)).blob();

            const formData = new FormData();
            formData.append("image", blob, `file_${index}_page_${i}.jpg`);

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
              method: "POST",
              body: formData,
            });
            const jsonRes = await res.json();
            if (jsonRes.success || jsonRes.data?.url) {
              imageUrls.push(jsonRes.data.url);
            }
          }
        } else {
          setUploadSpeed(`ছবি ${index + 1}/${totalFiles} আপলোড হচ্ছে...`);
          setUploadProgress(Math.round(((index + 1) / totalFiles) * 80));
          
          const formData = new FormData();
          formData.append("image", currentFile);

          const res = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
            method: "POST",
            body: formData,
          });
          const jsonRes = await res.json();
          if (jsonRes.success || jsonRes.data?.url) {
            imageUrls.push(jsonRes.data.url);
          }
        }
      }

      setUploadProgress(90);
      setUploadSpeed("ডাটাবেসে সেভ হচ্ছে...");

      const downloadURL = imageUrls[0]; 
      const uName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "User";
      const mainFileName = files.length > 1 ? `${files[0].name} এবং আরও ${files.length - 1}টি ফাইল` : files[0].name;

      await addDoc(collection(db, "notes"), {
        fileName: mainFileName,
        subject: subject,
        date: noteDate,
        pdfInfo: pdfInfo.trim(),
        fileUrl: downloadURL,
        pages: imageUrls, // Serialized image URLs array
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

      const notifTitle = subject.includes("Notice") ? "নতুন নোটিশ প্রকাশিত হয়েছে!" : "নতুন নোট আপলোড হয়েছে!";
      await pushNotification("all", notifTitle, `${uName} নতুন ফাইল আপলোড করেছেন: ${mainFileName}`, "info", downloadURL);
      await logActivity("File Uploaded", `আপলোড করেছেন: ${mainFileName} (বিষয়: ${subject})`);

      setUploading(false);
      setFiles([]);
      setSubject(BOOK_LIST[0]);
      setNoteDate("");
      setPdfInfo("");
      setUploadProgress(0);
      alert("নোট/ফাইল সফলভাবে আপলোড হয়েছে! (+100 Points)");

    } catch (error) {
      console.error(error);
      setUploading(false);
      alert("আপলোড ব্যর্থ হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।");
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

      await logActivity("Note Edited", `নোট এডিট করা হয়েছে: ${editFileName}`);

      alert("ফাইলের তথ্য সফলভাবে আপডেট করা হয়েছে!");
      setEditingNote(null);
    } catch (error) {
      console.error("Rename error:", error);
      alert("ফাইলের নাম পরিবর্তন করতে ব্যর্থ হয়েছে!");
    }
  };

  const handleReactionToggle = async (note, type) => {
    if (!user || isCurrentUserBanned) return;
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

        const uName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "User";

        if (!isOwnPost) {
          await pushNotification(
            note.uploaderUid,
            "নতুন রিঅ্যাকশন!",
            `${uName} আপনার পোস্টে Love রিঅ্যাক্ট দিয়েছে।`,
            "info",
            note.fileUrl
          );
        }

        if (!isOwnPost && !note.lovedPointUsers?.includes(user.uid)) {
          await updateUserScore(user.uid, 3);
          await updateUserScore(note.uploaderUid, 5);
          await updateDoc(noteRef, { lovedPointUsers: arrayUnion(user.uid) });
        }
      }
    }
  };

  const handleAddComment = async (e, note) => {
    e.preventDefault();
    if (isCurrentUserBanned) {
      alert("আপনার অ্যাকাউন্টটি ব্যান রয়েছে!");
      return;
    }

    const text = commentText[note.id];
    if (!text || !text.trim()) return;

    const uName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "User";
    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      userName: uName,
      userUid: user.uid,
      userEmail: user.email,
      text: text.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const noteRef = doc(db, "notes", note.id);
    await updateDoc(noteRef, { comments: arrayUnion(newComment) });

    const isOwnPost = note.uploaderUid === user.uid;

    if (!isOwnPost) {
      await pushNotification(
        note.uploaderUid,
        "নতুন কমেন্ট!",
        `${uName} আপনার পোস্টে কমেন্ট করেছে: "${text.trim().substring(0, 30)}..."`,
        "info",
        note.fileUrl
      );
    }

    await logActivity("New Comment", `${note.fileName}-এ কমেন্ট করা হয়েছে: ${text.trim().substring(0, 20)}...`);

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
        await updateDoc(noteRef, { comments: arrayRemove(commentObj) });
        await logActivity("Comment Deleted", `একটি কমেন্ট মুছে ফেলা হয়েছে।`);
      } catch (error) {
        console.error("Comment delete error:", error);
      }
    }
  };

  const handleDelete = async (note) => {
    if (!isModOrAdmin) return;

    if (isAdmin) {
      if (window.confirm("অ্যাডমিন হিসেবে আপনি কি এই ফাইলটি ডিলিট করতে চান?")) {
        await deleteDoc(doc(db, "notes", note.id));
        await logActivity("Note Deleted", `নোট ডিলিট করা হয়েছে: ${note.fileName}`);
      }
    } else if (currentUserRole === "Moderator") {
      if (window.confirm("মডারেটর হিসেবে আপনি এটি ডিলিট করার অনুরোধ পাঠাতে চান?")) {
        try {
          const noteRef = doc(db, "notes", note.id);
          const modName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "Mod";
          await updateDoc(noteRef, {
            isPendingDelete: true,
            deletedByModName: modName
          });

          await logActivity("Delete Request", `মডারেটর ${modName} নোট ডিলিটের অনুরোধ করেছে: ${note.fileName}`);
          alert("ডিলিটের অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে!");
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleAdminApproveDelete = async (noteId) => {
    if (!isAdmin) return;
    if (window.confirm("ডিলিট অনুরোধ অনুমোদন করতে চান?")) {
      await deleteDoc(doc(db, "notes", noteId));
      await logActivity("Delete Request Approved", `অ্যাডমিন মডারেটরের ডিলিট অনুরোধ অনুমোদন করেছে।`);
    }
  };

  const handleAdminCancelDeleteRequest = async (noteId) => {
    if (!isAdmin) return;
    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, { isPendingDelete: false, deletedByModName: "" });
      alert("ডিলিট অনুরোধ বাতিল করা হয়েছে।");
    } catch (error) {
      console.error(error);
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("লিংক কপি হয়েছে!");
  };

  const handleDownload = async (fileUrl, fileName, pages) => {
    try {
      if (pages && pages.length > 0) {
        const pdf = new jsPDF();
        for (let i = 0; i < pages.length; i++) {
          const imgUrl = pages[i];
          const img = new Image();
          img.crossOrigin = "Anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imgUrl;
          });

          const imgWidth = 210;
          const pageHeight = 295;
          const imgHeight = (img.height * imgWidth) / img.width;
          let heightLeft = imgHeight;
          let position = 0;

          if (i > 0) pdf.addPage();
          pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
        }
        pdf.save(`${fileName.replace(/\.[^/.]+$/, "")}.pdf`);
      } else {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "Note-File.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error(error);
      window.open(fileUrl, "_blank");
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (user && (!notif.readBy || !notif.readBy.includes(user.uid))) {
        const notifRef = doc(db, "notifications", notif.id);
        await updateDoc(notifRef, {
          readBy: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }

    if (notif.fileUrl) {
      window.open(notif.fileUrl, "_blank");
    } else {
      setCurrentView("home");
    }
    setShowNotifDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const unreadNotifs = notifications.filter(n => n.targetUid === "all" || n.targetUid === user?.uid).filter(n => !n.readBy || !n.readBy.includes(user?.uid));
      
      for (const notif of unreadNotifs) {
        const notifRef = doc(db, "notifications", notif.id);
        await updateDoc(notifRef, {
          readBy: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      alert("সকল নোটিফিকেশন রিড করতে সমস্যা হয়েছে!");
    }
  };

  const filterNotesNotFromBanned = (notesList) => {
    if (isAdmin) return notesList;
    const bannedUids = allUsers.filter(u => u.isBanned).map(u => u.uid);
    return notesList.filter(n => !bannedUids.includes(n.uploaderUid));
  };

  const visibleNotes = filterNotesNotFromBanned(allNotes);

  const suggestedBooks = BOOK_LIST.filter(book => 
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = visibleNotes.filter(note => {
    const matchesSubject = selectedSubjectFilter ? note.subject.toLowerCase() === selectedSubjectFilter.toLowerCase() : true;
    const matchesDate = selectedDateFilter ? note.date === selectedDateFilter : true;
    return matchesSubject && matchesDate;
  });

  const dashboardFilteredNotes = selectedDashboardUid 
    ? visibleNotes.filter(n => n.uploaderUid === selectedDashboardUid)
    : visibleNotes;

  const pendingDeleteNotes = visibleNotes.filter(n => n.isPendingDelete);

  const userNotifications = notifications.filter(n => n.targetUid === "all" || n.targetUid === user?.uid);
  const unreadNotifCount = userNotifications.filter(n => !n.readBy || !n.readBy.includes(user?.uid)).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#090d16", color: "#38bdf8", fontFamily: "sans-serif" }}>
        <h3>লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</h3>
      </div>
    );
  }

  const containerStyle = {
    ...styles.container,
    maxWidth: activeIsMobile ? "100%" : "1200px",
    margin: "0 auto",
    padding: activeIsMobile ? "0 8px" : "0 16px",
    boxShadow: activeIsMobile ? "none" : "0 0 20px rgba(0,0,0,0.5)"
  };

  return (
    <div style={containerStyle}>
      <div style={styles.deviceToggleBar}>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Device Layout Mode:</span>
        <div style={{ display: "flex", gap: "5px" }}>
          <button 
            onClick={() => setDeviceMode("auto")} 
            style={{ ...styles.modeBtn, ...(deviceMode === "auto" ? styles.activeModeBtn : {}) }}
          >
            Auto (Device Default)
          </button>
          <button 
            onClick={() => setDeviceMode("mobile")} 
            style={{ ...styles.modeBtn, ...(deviceMode === "mobile" ? styles.activeModeBtn : {}) }}
          >
            📱 Mobile Mode
          </button>
          <button 
            onClick={() => setDeviceMode("desktop")} 
            style={{ ...styles.modeBtn, ...(deviceMode === "desktop" ? styles.activeModeBtn : {}) }}
          >
            💻 Computer Mode
          </button>
        </div>
      </div>

      <header style={{ ...styles.header, padding: activeIsMobile ? "10px 3%" : "10px 6%" }}>
        <div style={{ width: "100%", marginBottom: "8px" }}>
          <marquee behavior="scroll" direction="left" scrollamount="5" style={{ color: "#facc15", fontWeight: "600", fontSize: activeIsMobile ? "12px" : "14px", backgroundColor: "#1e293b", padding: "4px 0", borderRadius: "4px" }}>
            website টির কাজ চলমান,সাময়িক ত্রুটি হতে পারে। যেকোনো সমস্যা admin কে whatsapp (✉ +8801522107909) only message করুন
          </marquee>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={styles.logoContainer}>
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt="Site Logo" style={styles.logoImageStyle} />
              ) : (
                <div style={styles.logoPlaceholderStyle}>
                  <ImageIcon size={24} color="#38bdf8" />
                </div>
              )}
            </div>
            <div>
              <h1 style={{ ...styles.logo, fontSize: activeIsMobile ? "18px" : "20px" }} className="rgb-text-glow">Math Note HUB</h1>
              <p style={styles.subLogo}>Academic & Departmental Notes Repository</p>
            </div>
          </div>

          {user && (
            <div style={{ ...styles.navTabs, width: activeIsMobile ? "100%" : "auto", justifyContent: activeIsMobile ? "space-between" : "flex-start" }}>
              <button onClick={() => setCurrentView("home")} style={{ ...styles.navBtn, ...(currentView === "home" ? styles.activeNavBtn : {}) }}>
                <Home size={16} /> Home
              </button>
              <button onClick={() => setCurrentView("dashboard")} style={{ ...styles.navBtn, ...(currentView === "dashboard" ? styles.activeNavBtn : {}) }}>
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button onClick={() => setCurrentView("profile")} style={{ ...styles.navBtn, ...(currentView === "profile" ? styles.activeNavBtn : {}) }}>
                <User size={16} /> My Profile
              </button>

              {isModOrAdmin && (
                <button onClick={() => setShowLogsModal(true)} style={styles.logsNavBtn} title="Check Activity Logs">
                  <Activity size={16} /> Logs
                </button>
              )}

              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={styles.notifIconBtn}>
                  <Bell size={16} />
                  {unreadNotifCount > 0 && <span style={styles.notifBadge}>{unreadNotifCount}</span>}
                </button>

                {showNotifDropdown && (
                  <div style={{ ...styles.notifDropdown, width: activeIsMobile ? "260px" : "310px", right: activeIsMobile ? "-40px" : 0 }}>
                    <div style={styles.notifHeader}>
                      <b>Notifications ({userNotifications.length})</b>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {unreadNotifCount > 0 && (
                          <span onClick={handleMarkAllAsRead} style={{ cursor: "pointer", fontSize: "11px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "2px" }} title="Mark all as read">
                            <CheckCheck size={12} /> Mark all read
                          </span>
                        )}
                        <span onClick={() => setShowNotifDropdown(false)} style={{ cursor: "pointer", fontSize: "11px", color: "#94a3b8" }}>Close</span>
                      </div>
                    </div>
                    <div style={styles.notifList}>
                      {userNotifications.length === 0 ? (
                        <p style={{ padding: "10px", color: "#64748b", fontSize: "12px", textAlign: "center" }}>কোনো নোটিফিকেশন নেই</p>
                      ) : (
                        userNotifications.map(n => {
                          const isUnread = !n.readBy || !n.readBy.includes(user?.uid);
                          return (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationClick(n)}
                              className="notification-item"
                              style={{
                                ...styles.notifItem,
                                backgroundColor: isUnread ? "#132238" : "#090d16",
                                borderLeft: n.type === "error" ? "3px solid #ef4444" : n.type === "success" ? "3px solid #22c55e" : "3px solid #38bdf8",
                                cursor: "pointer"
                              }}
                              title={n.fileUrl ? "ফাইলটি দেখতে ক্লিক করুন" : ""}
                            >
                              <b style={{ color: "#f8fafc", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {n.title}
                                {n.fileUrl && <ExternalLink size={12} color="#00e5ff" />}
                              </b>
                              <p style={{ margin: "2px 0 0 0", color: "#cbd5e1", fontSize: "11px" }}>{n.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={styles.branding}>
            Designed by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={styles.brandLink}>Anondo</a>
          </div>
        </div>
      </header>

      {showWelcomeMsg && (
        <div style={styles.rgbFloatingWelcome} className="rgb-floating-msg">
          🎉 MATH HUB এ স্বাগতম! সফলভাবে লগইন সম্পন্ন হয়েছে।
        </div>
      )}

      {user && isCurrentUserBanned && (
        <div style={styles.bannedBanner}>
          <AlertTriangle size={20} color="#f87171" />
          <span>আপনার অ্যাকাউন্টটি স্থগিত (Banned) করা হয়েছে। আপনি কেবল দেখতে পারবেন, কোনো পোস্ট/কমেন্ট করতে পারবেন না।</span>
        </div>
      )}

      {user && isProfileIncomplete && (
        <div className="floating-notice">
          <p className="notice-text">
            <AlertTriangle size={16} /> অনুগ্রহ করে আপনার প্রোফাইল ফিল্ডগুলো (University/College Name ইত্যাদি) পূর্ণাঙ্গ আপডেট করুন!
          </p>
          <button onClick={() => setCurrentView("profile")} className="notice-btn">
            প্রোফাইল আপডেট করুন
          </button>
        </div>
      )}

      {!user ? (
        <div style={{ ...styles.heroSection, maxWidth: activeIsMobile ? "100%" : "480px" }}>
          <div style={styles.welcomeBox}>
            <h2 style={{ color: "#38bdf8", marginBottom: "12px", fontWeight: "700", fontSize: activeIsMobile ? "16px" : "18px", lineHeight: "1.5" }}>
              BSc Math-এর জটিল প্রমাণ আর থিওরেম নিয়ে চিন্তিত? এক ক্লিকেই সমাধান তোমার হাতের মুঠোয়। 
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: "0 0 10px 0" }}>
              পাস মার্ক নয়, BSc Mathematics-এ টপ করার প্রস্তুতি শুরু হোক এখান থেকেই! টপ গ্র্যাজুয়েটদের তৈরি নোট ও ক্লাসরুমের খাতার সহজ সমাধান—একদম বিনামূল্যে।
            </p>
            <p style={{ color: "#f8fafc", fontSize: "15px", fontWeight: "600", backgroundColor: "#1e293b", padding: "8px 12px", borderRadius: "6px", display: "inline-block", border: "1px solid #38bdf8" }}>
              পরীক্ষার আগের রাতের সবচেয়ে বড় সঙ্গী: <span style={{ color: "#38bdf8" }}>" Math Note HUB "</span>
            </p>
          </div>

          <div style={{ ...styles.authCard, padding: activeIsMobile ? "18px" : "28px" }}>
            <h3 style={{ marginBottom: "20px", color: "#f8fafc", fontSize: "18px", fontWeight: "600" }}>
              {isResetMode ? "পাসওয়ার্ড রিসেট করুন" : "প্রবেশ করুন"}
            </h3>
            
            {!isResetMode && (
              <div style={styles.tabContainer}>
                <button onClick={() => setAuthMode("google")} style={{...styles.tab, ...(authMode === "google" ? styles.activeTab : {})}}>Google</button>
                <button onClick={() => setAuthMode("email")} style={{...styles.tab, ...(authMode === "email" ? styles.activeTab : {})}}>Email</button>
              </div>
            )}

            {authError && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "10px" }}>{authError}</p>}
            {resetMessage && <p style={{ color: "#22c55e", fontSize: "13px", marginBottom: "10px" }}>{resetMessage}</p>}

            {!isResetMode && authMode === "google" && (
              <button onClick={handleGoogleLogin} style={styles.googleBtn}>Continue with Google</button>
            )}

            {!isResetMode && authMode === "email" && (
              <form onSubmit={handleEmailAuth} style={styles.form}>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
                {isSignUp && (
                  <input type="password" placeholder="Retype Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
                )}
                <button type="submit" style={styles.submitBtn}>{isSignUp ? "Sign Up" : "Log In"}</button>
                
                {!isSignUp && (
                  <p 
                    onClick={() => { setIsResetMode(true); setAuthError(""); setResetMessage(""); }} 
                    style={{ cursor: "pointer", color: "#f87171", marginTop: "8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  >
                    <KeyRound size={12} /> পাসওয়ার্ড ভুলে গেছেন? (Forgot Password?)
                  </p>
                )}

                <p onClick={() => setIsSignUp(!isSignUp)} style={{ cursor: "pointer", color: "#38bdf8", marginTop: "8px", fontSize: "13px" }}>
                  {isSignUp ? "Account আছে? Log In করুন" : "Account নেই? Sign Up করুন"}
                </p>
              </form>
            )}

            {isResetMode && (
              <form onSubmit={handleForgotPassword} style={styles.form}>
                <p style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "5px" }}>
                  আপনার ইমেইল এড্রেসটি দিন। আমরা আপনার ইমেইলে পাসওয়ার্ড রিসেট করার একটি কোড/লিংক পাঠাবো।
                </p>
                <input 
                  type="email" 
                  placeholder="আপনার রেজিস্টার্ড Email লিখুন" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={styles.input} 
                />
                <button type="submit" style={styles.submitBtn}>
                  রিসেট লিংক/কোড পাঠান
                </button>
                <p 
                  onClick={() => { setIsResetMode(false); setAuthError(""); setResetMessage(""); }} 
                  style={{ cursor: "pointer", color: "#38bdf8", marginTop: "12px", fontSize: "13px" }}
                >
                  ← লগইন পেজে ফিরে যান
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...styles.mainFeed, maxWidth: activeIsMobile ? "100%" : "860px" }}>
          
          <div style={styles.userBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img 
                src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #0284c7" }}
              />
              <div>
                <span style={{ fontWeight: "600", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                  {myProfile.displayName || user.displayName || user.email?.split('@')[0]}
                  <RoleBadge role={currentUserRole} />
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {isAdmin ? "Website Owner" : `Points: ${myProfile.points} | Rank: ${getUserRank(user.uid, user.email)}`}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <LogOut size={14} /> লগ-আউট
            </button>
          </div>

          {currentView === "profile" && (
            <div style={styles.profileSection}>
              <h2 style={{ color: "#f8fafc", marginBottom: "20px", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={20} color="#38bdf8" /> প্রোফাইল তথ্য
              </h2>
              
              <div style={styles.scoreSummaryBox}>
                <div style={styles.scoreBoxItem}>
                  <span style={styles.scoreBoxLabel}>Status / Points</span>
                  <span style={styles.scoreBoxValue}>{isAdmin ? "Admin" : myProfile.points}</span>
                </div>
                <div style={styles.scoreBoxDivider}></div>
                <div style={styles.scoreBoxItem}>
                  <span style={styles.scoreBoxLabel}>Leaderboard Rank</span>
                  <span style={styles.scoreBoxValue}>{getUserRank(user.uid, user.email)}</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} style={styles.profileForm}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img 
                    src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Preview" 
                    style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "2px solid #0284c7", marginBottom: "10px" }}
                  />
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "10px" }}>
                    <RoleBadge role={currentUserRole} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#94a3b8" }}>প্রোফাইল ছবি পরিবর্তন (Max 5MB):</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setProfilePicFile(e.target.files[0])}
                      style={{ marginTop: "6px", color: "#94a3b8", display: "block", margin: "6px auto", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ ...styles.inputGrid, gridTemplateColumns: activeIsMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  <div>
                    <label style={styles.label}>নাম:</label>
                    <input type="text" value={myProfile.displayName} onChange={(e) => setMyProfile({...myProfile, displayName: e.target.value})} required style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>University / College Name:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Kurigram Govt. College" 
                      value={myProfile.instituteName} 
                      onChange={(e) => setMyProfile({...myProfile, instituteName: e.target.value})} 
                      required 
                      style={styles.input} 
                    />
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
                    <label style={styles.label}>Facebook Link:</label>
                    <input type="text" placeholder="https://facebook.com/yourid" value={myProfile.facebook} onChange={(e) => setMyProfile({...myProfile, facebook: e.target.value})} style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Date of Birth:</label>
                    <input type="date" value={myProfile.dob} onChange={(e) => setMyProfile({...myProfile, dob: e.target.value})} required style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>College Name:</label>
                    <input type="text" placeholder="e.g. Kurigram Govt. College" value={myProfile.hscCollege} onChange={(e) => setMyProfile({...myProfile, hscCollege: e.target.value})} style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>Passing Year:</label>
                    <input type="text" placeholder="e.g. 2025" value={myProfile.hscYear} onChange={(e) => setMyProfile({...myProfile, hscYear: e.target.value})} style={styles.input} />
                  </div>

                  <div>
                    <label style={styles.label}>GPA / Status:</label>
                    <input type="text" placeholder="e.g. GPA / Student" value={myProfile.hscGpa} onChange={(e) => setMyProfile({...myProfile, hscGpa: e.target.value})} style={styles.input} />
                  </div>

                  <div style={{ gridColumn: activeIsMobile ? "span 1" : "1 / -1" }}>
                    <label style={styles.label}>ঠিকানা / Residence:</label>
                    <input type="text" placeholder="Kurigram Sadar, Kurigram" value={myProfile.address} onChange={(e) => setMyProfile({...myProfile, address: e.target.value})} required style={styles.input} />
                  </div>
                </div>

                <button type="submit" disabled={savingProfile} style={styles.saveProfileBtn}>
                  {savingProfile ? "সেভ হচ্ছে..." : "প্রোফাইল সেভ করুন"}
                </button>
              </form>
            </div>
          )}

          {currentView === "dashboard" && (
            <div style={styles.dashboardSection}>
              
              {isAdmin && (
                <div style={styles.adminLogoBox}>
                  <h3 style={{ color: "#38bdf8", margin: "0 0 10px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ImageIcon size={18} /> Website Logo Control (Admin Only)
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
                    এখানে নতুন লোগো আপলোড করলে সাথে সাথে ওয়েবসাইটের হেডার লোগো আপডেট হয়ে যাবে।
                  </p>
                  <form onSubmit={handleLogoUpdate} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setNewLogoFile(e.target.files[0])} 
                      style={{ color: "#94a3b8", fontSize: "12px" }}
                      required
                    />
                    <button type="submit" disabled={uploadingLogo} style={styles.logoUploadBtn}>
                      {uploadingLogo ? "আপলোড হচ্ছে..." : "লোগো আপডেট করুন"}
                    </button>
                  </form>
                </div>
              )}

              {isAdmin && pendingDeleteNotes.length > 0 && (
                <div style={styles.adminReviewBox}>
                  <h3 style={{ color: "#f87171", margin: "0 0 12px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={18} /> Admin Review: মডারেটরদের ডিলিট রিকোয়েস্ট ({pendingDeleteNotes.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {pendingDeleteNotes.map(note => (
                      <div key={note.id} style={styles.reviewItem}>
                        <div>
                          <b style={{ color: "#f8fafc" }}>{note.fileName}</b>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0" }}>
                            বিষয়: {note.subject} | মডারেটর: <span style={{ color: "#38bdf8" }}>{note.deletedByModName}</span>
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleAdminApproveDelete(note.id)} style={styles.approveBtn}><CheckCircle size={14} /> কনফার্ম ডিলিট</button>
                          <button onClick={() => handleAdminCancelDeleteRequest(note.id)} style={styles.cancelReviewBtn}><XCircle size={14} /> বাতিল</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.scoreBoardCard}>
                <h3 style={{ color: "#f8fafc", margin: "0 0 15px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={20} color="#38bdf8" /> লিডারবোর্ড (Top Members)
                </h3>
                <div style={styles.leaderboardList}>
                  {leaderboardUsers.map((u, index) => {
                    const uRole = getUserRole(u.email, u.uid);
                    const isUserAdmin = uRole === "Admin";

                    return (
                      <div key={u.id} style={{ 
                        ...styles.leaderItem,
                        backgroundColor: isUserAdmin ? "rgba(56, 189, 248, 0.08)" : "#0f172a",
                        border: isUserAdmin ? "1px solid rgba(56, 189, 248, 0.3)" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: "600", fontSize: "13px", width: "32px", color: isUserAdmin ? "#38bdf8" : "#94a3b8" }}>
                            {isUserAdmin ? <Crown size={18} color="#38bdf8" /> : `#${index - admins.length + 1}`}
                          </span>
                          <img src={u.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="u" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                          <span 
                            onClick={() => setViewingProfile(u)} 
                            style={{ color: "#f8fafc", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            {u.displayName || u.email?.split('@')[0] || "User"}
                            <RoleBadge role={uRole} />
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {!isUserAdmin && (
                            <span style={styles.scoreBadge}>{u.points || 0} Pts</span>
                          )}
                          {isAdmin && !isUserAdmin && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                onClick={() => handleToggleModerator(u)}
                                style={styles.makeModBtn}
                              >
                                {uRole === "Moderator" ? "Remove Mod" : "Make Mod"}
                              </button>
                              <button 
                                onClick={() => handleToggleBanUser(u)}
                                style={{ ...styles.banBtn, backgroundColor: u.isBanned ? "#16a34a" : "#dc2626" }}
                                title={u.isBanned ? "Unban User" : "Ban User"}
                              >
                                {u.isBanned ? "Unban" : <Ban size={14} />}
                              </button>
                              <button 
                                onClick={() => handlePermanentlyRemoveUser(u)}
                                style={styles.removeUserBtn}
                                title="Permanently Delete User"
                              >
                                <UserX size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.searchSection}>
                <h3 style={{ color: "#f8fafc", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                  সকল রেজিস্টার্ড মেম্বার
                </h3>
                <div style={styles.userListGrid}>
                  <button 
                    onClick={() => setSelectedDashboardUid(null)}
                    style={{ ...styles.userCardBtn, backgroundColor: !selectedDashboardUid ? "#0284c7" : "#1e293b" }}
                  >
                    সকল ইউজার
                  </button>
                  {visibleUsers.map(u => {
                    return (
                      <div key={u.id} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button 
                          onClick={() => setSelectedDashboardUid(u.uid)}
                          style={{ 
                            ...styles.userCardBtn, 
                            backgroundColor: selectedDashboardUid === u.uid ? "#0284c7" : "#1e293b",
                            borderColor: u.isBanned ? "#ef4444" : "rgba(255,255,255,0.1)"
                          }}
                        >
                          {u.displayName || u.email?.split('@')[0] || "User"}
                          {u.isBanned && <span style={{ color: "#ef4444", marginLeft: "4px", fontSize: "10px" }}>(Banned)</span>}
                        </button>
                        <button 
                          onClick={() => setViewingProfile(u)}
                          style={styles.infoIconBtn}
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 style={{ color: "#f8fafc", margin: "25px 0 15px 0", fontSize: "16px" }}>
                {selectedDashboardUid ? "নির্বাচিত সদস্যের ফাইলসমূহ" : "সকল সংগৃহীত ফাইলসমূহ"} ({dashboardFilteredNotes.length})
              </h3>

              <div style={{ ...styles.notesGrid, gridTemplateColumns: activeIsMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))" }}>
                {dashboardFilteredNotes.map((n) => (
                  <NoteCardItem 
                    key={n.id} 
                    note={n} 
                    user={user} 
                    allUsers={allUsers}
                    isModOrAdmin={isModOrAdmin}
                    isAdmin={isAdmin}
                    isCurrentUserBanned={isCurrentUserBanned}
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

          {currentView === "home" && (
            <>
              <div style={styles.searchSection}>
                <h3 style={{ color: "#f8fafc", marginBottom: "12px", fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Search size={16} color="#38bdf8" /> বিষয় ও তারিখ দিয়ে ফিল্টার করুন
                </h3>
                <div style={{ ...styles.filterGrid, flexDirection: activeIsMobile ? "column" : "row" }}>
                  <div style={{ position: "relative", flex: 2, minWidth: "220px" }}>
                    <input 
                      type="text" 
                      placeholder="বইয়ের নাম বা বিষয় লিখে সার্চ করুন..." 
                      value={searchQuery}
                      onChange={(e) => { 
                        setSearchQuery(e.target.value); 
                        setSelectedSubjectFilter(e.target.value);
                        setShowSuggestions(true); 
                      }}
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
                            <FileText size={14} color="#94a3b8" /> {book}
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
                <h3 style={{ color: "#f8fafc", marginBottom: "15px", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <UploadCloud size={20} color="#38bdf8" /> একাধিক ছবি বা PDF একসাথে আপলোড করুন (+100 Points)
                </h3>
                <form onSubmit={handleUpload} style={styles.uploadForm}>
                  <div style={{ ...styles.inputGroup, flexDirection: activeIsMobile ? "column" : "row" }}>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} required>
                      {BOOK_LIST.map((item, index) => (
                        <option key={index} value={item} style={{ backgroundColor: "#0f172a", color: "#fff" }}>{item}</option>
                      ))}
                    </select>

                    <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} required style={styles.input} />
                  </div>

                  <input type="text" placeholder="নোট সংক্রান্ত অতিরিক্ত তথ্য (PDF Info)" value={pdfInfo} onChange={(e) => setPdfInfo(e.target.value)} style={{ ...styles.input, marginTop: "12px" }} />

                  {/* Multiple file/image selection input */}
                  <div style={{ margin: "15px 0" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>
                      ফাইল বা ছবি সিলেক্ট করুন (একাধিক সিলেক্ট করা যাবে):
                    </label>
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      onChange={handleFileSelect} 
                      style={{ color: "#94a3b8", fontSize: "13px" }} 
                    />
                  </div>

                  {/* Selected Files Preview, Rename, and Delete section */}
                  {files.length > 0 && (
                    <div style={styles.selectedFilesContainer}>
                      <h4 style={{ color: "#38bdf8", fontSize: "13px", marginBottom: "8px" }}>
                        নির্বাচিত ফাইলসমূহ ({files.length}টি) - প্রিভিউ ও রিনেম করুন:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                        {files.map((item, idx) => (
                          <div key={idx} style={styles.selectedFileItem}>
                            {item.file.type.startsWith("image/") || item.file.name.match(/\.(jpg|jpeg|png)$/i) ? (
                              <img src={item.previewUrl} alt="preview" style={styles.previewThumb} />
                            ) : (
                              <div style={styles.pdfThumbPlaceholder}>PDF</div>
                            )}

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                              <label style={{ fontSize: "10px", color: "#94a3b8" }}>ফাইলের নাম পরিবর্তন করুন:</label>
                              <input 
                                type="text" 
                                value={item.name} 
                                onChange={(e) => handleRenameSelectedFile(idx, e.target.value)}
                                style={styles.renameInput}
                              />
                            </div>

                            <button 
                              type="button" 
                              onClick={() => handleRemoveSelectedFile(idx)}
                              style={styles.removeFileBtn}
                              title="Cancel / Remove File"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div style={{ marginBottom: "15px", backgroundColor: "#090d16", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b", marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>
                        <span>আপলোড ও কনভার্ট হচ্ছে... {uploadProgress}%</span>
                        <span>{uploadSpeed}</span>
                      </div>
                      <div style={{ width: "100%", backgroundColor: "#1e293b", borderRadius: "4px", height: "8px", overflow: "hidden", marginBottom: "6px" }}>
                        <div style={{ width: `${uploadProgress}%`, backgroundColor: "#22c55e", height: "100%", transition: "width 0.2s ease" }}></div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={uploading || isCurrentUserBanned || files.length === 0} 
                    style={{...styles.uploadBtn, marginTop: "12px", opacity: (uploading || isCurrentUserBanned || files.length === 0) ? 0.5 : 1}}
                  >
                    {uploading ? "প্রসেসিং ও আপলোড হচ্ছে..." : "নোট আপলোড করুন"}
                  </button>
                </form>
              </div>

              <h2 style={{ color: "#f8fafc", marginBottom: "15px", fontSize: "18px", fontWeight: "600" }}>
                সংগৃহীত নোটস ({filteredNotes.length})
              </h2>
              
              <div style={{ ...styles.notesGrid, gridTemplateColumns: activeIsMobile ? "1fr" : "repeat(auto-fill, minmax(270px, 1fr))" }}>
                {filteredNotes.map((n) => (
                  <NoteCardItem 
                    key={n.id} 
                    note={n} 
                    user={user} 
                    allUsers={allUsers}
                    isModOrAdmin={isModOrAdmin}
                    isAdmin={isAdmin}
                    isCurrentUserBanned={isCurrentUserBanned}
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

      {showLogsModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: activeIsMobile ? "92%" : "550px" }}>
            <button onClick={() => setShowLogsModal(false)} style={styles.closeModalBtn}><XCircle size={18} /></button>
            <h3 style={{ color: "#38bdf8", marginBottom: "15px", fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={18} /> Activity Logs (সর্বশেষ কার্যক্রম)
            </h3>

            <div style={styles.activityLogList}>
              {activityLogs.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", fontSize: "13px" }}>কোনো অ্যাক্টিভিটি পাওয়া যায়নি</p>
              ) : (
                activityLogs.map(log => (
                  <div key={log.id} style={styles.activityItem}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600", color: "#f8fafc", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                        {log.userName} <RoleBadge role={log.userRole} />
                      </span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : "Just now"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "500" }}>{log.action}</div>
                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px" }}>{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editingNote && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: activeIsMobile ? "92%" : "380px" }}>
            <button onClick={() => setEditingNote(null)} style={styles.closeModalBtn}><XCircle size={18} /></button>
            <h3 style={{ color: "#f8fafc", marginBottom: "15px", fontSize: "16px" }}>ফাইলের নাম ও তথ্য পরিবর্তন</h3>
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
                <label style={styles.label}>PDF/নোট তথ্য (Info):</label>
                <input 
                  type="text" 
                  value={editPdfInfo} 
                  onChange={(e) => setEditPdfInfo(e.target.value)} 
                  style={styles.input} 
                />
              </div>

              <button type="submit" style={styles.saveProfileBtn}>সেভ করুন</button>
            </form>
          </div>
        </div>
      )}

      {viewingProfile && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: activeIsMobile ? "92%" : "380px" }}>
            <button onClick={() => setViewingProfile(null)} style={styles.closeModalBtn}><XCircle size={18} /></button>
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <img 
                src={viewingProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #0284c7" }}
              />
              <h3 style={{ margin: "8px 0 4px 0", color: "#f8fafc", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {viewingProfile.displayName || "User Profile"}
                <RoleBadge role={getUserRole(viewingProfile.email, viewingProfile.uid)} />
              </h3>

              <div style={styles.modalScoreBar}>
                {getUserRole(viewingProfile.email, viewingProfile.uid) === "Admin" ? (
                  <span style={styles.modalBadgeAdmin}>Website Owner</span>
                ) : (
                  <>
                    <span style={styles.modalBadge}>Points: {viewingProfile.points || 0}</span>
                    <span style={styles.modalBadgeRank}>Rank: {getUserRank(viewingProfile.uid, viewingProfile.email)}</span>
                  </>
                )}
              </div>
            </div>

            <div style={styles.profileDetailsList}>
              <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Building size={14} color="#38bdf8" /> <b>Institution:</b> {viewingProfile.instituteName || "N/A"}
              </p>
              <p><b>Dept. Roll:</b> {viewingProfile.deptRoll || "N/A"}</p>
              <p>
                <b>WhatsApp:</b> <WhatsAppCopyButton number={viewingProfile.whatsapp} />
              </p>
              <p><b>Email:</b> {viewingProfile.email || "N/A"}</p>
              <p><b>Date of Birth:</b> {viewingProfile.dob || "N/A"}</p>
              <p><b>Address:</b> {viewingProfile.address || "N/A"}</p>

              <p style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8", marginTop: "4px", fontWeight: "600" }}>
                <GraduationCap size={14} /> Academic Information:
              </p>
              <p style={{ paddingLeft: "8px" }}><b>College:</b> {viewingProfile.hscCollege || "N/A"}</p>
              <p style={{ paddingLeft: "8px" }}><b>Passing Year:</b> {viewingProfile.hscYear || "N/A"}</p>
              <p style={{ paddingLeft: "8px" }}><b>GPA/Status:</b> {viewingProfile.hscGpa || "N/A"}</p>

              {viewingProfile.facebook && (
                <p><b>Facebook:</b> <a href={viewingProfile.facebook} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "4px" }}>Profile Link <ExternalLink size={12} /></a></p>
              )}
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <p>© 2026 Math Note HUB | Developed by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" style={{color: "#38bdf8"}}>Anondo</a></p>
      </footer>
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Hind Siliguri', 'Poppins', sans-serif", backgroundColor: "#090d16", minHeight: "100vh", color: "#f8fafc", transition: "all 0.3s ease" },
  deviceToggleBar: { backgroundColor: "#0f172a", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", flexWrap: "wrap", gap: "8px" },
  modeBtn: { backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "500" },
  activeModeBtn: { backgroundColor: "#0284c7", color: "#fff", borderColor: "#0284c7" },

  header: { backgroundColor: "#0f172a", display: "flex", flexDirection: "column", borderBottom: "1px solid #1e293b" },
  logoContainer: { width: "42px", height: "42px", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b", border: "1px solid #334155" },
  logoImageStyle: { width: "100%", height: "100%", objectFit: "cover" },
  logoPlaceholderStyle: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  logo: { color: "#f8fafc", margin: 0, fontWeight: "800", letterSpacing: "0.5px" },
  subLogo: { fontSize: "11px", color: "#64748b", margin: 0 },
  branding: { fontSize: "12px", color: "#64748b" },
  brandLink: { color: "#38bdf8", textDecoration: "none", fontWeight: "600" },
  navTabs: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  navBtn: { padding: "7px 14px", border: "1px solid transparent", background: "transparent", color: "#94a3b8", borderRadius: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "500", transition: "0.2s" },
  activeNavBtn: { backgroundColor: "#1e293b", color: "#38bdf8", border: "1px solid #334155" },

  logsNavBtn: { padding: "7px 12px", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#c084fc", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500" },

  notifIconBtn: { backgroundColor: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", padding: "7px 10px", borderRadius: "6px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center" },
  notifBadge: { position: "absolute", top: "-4px", right: "-4px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "50%", padding: "1px 5px", fontSize: "10px", fontWeight: "bold" },
  notifDropdown: { position: "absolute", top: "110%", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 50 },
  notifHeader: { padding: "10px 12px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#f8fafc" },
  notifList: { maxHeight: "250px", overflowY: "auto" },
  notifItem: { padding: "10px 12px", borderBottom: "1px solid #1e293b", transition: "background 0.2s" },

  bannedBanner: { backgroundColor: "rgba(220, 38, 38, 0.15)", borderBottom: "1px solid #dc2626", color: "#f87171", padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },

  rgbFloatingWelcome: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    background: "#111",
    padding: "15px 25px",
    borderRadius: "8px",
    border: "3px solid red",
    fontWeight: "bold",
    fontSize: "16px",
    animation: "rgbGlow 1.5s infinite"
  },

  heroSection: { margin: "40px auto", padding: "0 20px" },
  welcomeBox: { textAlign: "center", marginBottom: "25px" },
  authCard: { backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", textAlign: "center" },
  tabContainer: { display: "flex", justifyContent: "center", marginBottom: "20px", gap: "8px" },
  tab: { padding: "8px 20px", border: "none", background: "#1e293b", color: "#94a3b8", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  activeTab: { background: "#0284c7", color: "#fff", fontWeight: "500" },
  googleBtn: { width: "100%", padding: "11px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "10px 12px", borderRadius: "6px", border: "1px solid #1e293b", backgroundColor: "#090d16", color: "#fff", fontSize: "13px", width: "100%", boxSizing: "border-box" },
  label: { display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" },
  submitBtn: { padding: "11px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500", fontSize: "14px" },
  
  mainFeed: { margin: "25px auto", padding: "0 16px" },
  userBar: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "12px 18px", borderRadius: "10px", border: "1px solid #1e293b", marginBottom: "16px", flexWrap: "wrap", gap: "10px" },

  studentBadge: { backgroundColor: "#1e293b", color: "#94a3b8", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "500" },
  adminBadge: { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", border: "1px solid rgba(239, 68, 68, 0.4)", display: "inline-flex", alignItems: "center", gap: "3px" },
  modBadge: { backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", border: "1px solid rgba(59, 130, 246, 0.4)", display: "inline-flex", alignItems: "center", gap: "3px" },

  logoutBtn: { backgroundColor: "transparent", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.2)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" },

  profileSection: { backgroundColor: "#0f172a", padding: "24px", borderRadius: "12px", border: "1px solid #1e293b", marginBottom: "25px" },
  scoreSummaryBox: { display: "flex", justifyContent: "space-around", alignItems: "center", backgroundColor: "#090d16", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #1e293b" },
  scoreBoxItem: { textAlign: "center", display: "flex", flexDirection: "column" },
  scoreBoxLabel: { fontSize: "12px", color: "#64748b" },
  scoreBoxValue: { fontSize: "18px", fontWeight: "600", color: "#38bdf8", marginTop: "2px" },
  scoreBoxDivider: { width: "1px", height: "30px", backgroundColor: "#1e293b" },

  profileForm: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGrid: { display: "grid", gap: "12px" },
  saveProfileBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "11px", borderRadius: "6px", cursor: "pointer", fontWeight: "500", fontSize: "14px", marginTop: "10px" },

  adminLogoBox: { backgroundColor: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "16px", borderRadius: "10px", marginBottom: "20px" },
  logoUploadBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" },

  adminReviewBox: { backgroundColor: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.3)", padding: "16px", borderRadius: "10px", marginBottom: "20px" },
  reviewItem: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "10px 14px", borderRadius: "8px", flexWrap: "wrap", gap: "8px" },
  approveBtn: { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" },
  cancelReviewBtn: { backgroundColor: "#334155", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" },

  scoreBoardCard: { backgroundColor: "#0f172a", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #1e293b" },
  leaderboardList: { display: "flex", flexDirection: "column", gap: "6px" },
  leaderItem: { display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  scoreBadge: { color: "#38bdf8", fontWeight: "600", fontSize: "12px" },
  makeModBtn: { backgroundColor: "rgba(139, 92, 246, 0.2)", color: "#c084fc", border: "1px solid rgba(139, 92, 246, 0.4)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" },
  banBtn: { color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center" },
  removeUserBtn: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center" },

  userListGrid: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" },
  userCardBtn: { border: "1px solid #1e293b", color: "#cbd5e1", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  infoIconBtn: { backgroundColor: "#1e293b", color: "#94a3b8", border: "none", padding: "6px 8px", borderRadius: "6px", cursor: "pointer" },

  dashboardSection: { marginBottom: "30px" },
  searchSection: { backgroundColor: "#0f172a", padding: "18px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #1e293b" },
  filterGrid: { display: "flex", gap: "10px" },
  searchInput: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b", backgroundColor: "#090d16", color: "#fff", fontSize: "13px", boxSizing: "border-box" },
  dateFilterInput: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b", backgroundColor: "#090d16", color: "#fff", fontSize: "13px", boxSizing: "border-box" },
  suggestionBox: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", zIndex: 10, maxHeight: "150px", overflowY: "auto" },
  suggestionItem: { padding: "10px", cursor: "pointer", fontSize: "12px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #1e293b" },

  uploadCard: { backgroundColor: "#0f172a", padding: "20px", borderRadius: "12px", marginBottom: "25px", border: "1px solid #1e293b" },
  uploadForm: { display: "flex", flexDirection: "column" },
  inputGroup: { display: "flex", gap: "10px" },
  uploadBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "11px", borderRadius: "6px", cursor: "pointer", fontWeight: "500", fontSize: "14px" },
  
  selectedFilesContainer: { backgroundColor: "#090d16", border: "1px solid #1e293b", borderRadius: "8px", padding: "10px", marginTop: "10px" },
  selectedFileItem: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#1e293b", padding: "8px", borderRadius: "6px" },
  previewThumb: { width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #334155" },
  pdfThumbPlaceholder: { width: "36px", height: "36px", backgroundColor: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" },
  renameInput: { padding: "5px 8px", borderRadius: "4px", border: "1px solid #334155", backgroundColor: "#090d16", color: "#fff", fontSize: "12px", width: "100%" },
  removeFileBtn: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", padding: "6px 8px", borderRadius: "4px", cursor: "pointer" },

  notesGrid: { display: "grid", gap: "16px" },
  noteCard: { backgroundColor: "#0f172a", padding: "16px", borderRadius: "10px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  subjectTag: { color: "#38bdf8", fontSize: "12px", fontWeight: "500" },
  dateTag: { color: "#64748b", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" },
  fileName: { fontSize: "14px", color: "#f8fafc", margin: "4px 0 8px 0", fontWeight: "500" },
  pdfInfoTag: { color: "#94a3b8", fontSize: "12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" },
  pendingAlertTag: { color: "#f87171", fontSize: "11px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" },
  uploaderText: { fontSize: "12px", color: "#64748b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" },
  
  cardActions: { display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" },
  viewBtn: { flex: "1", backgroundColor: "#1e293b", color: "#38bdf8", textDecoration: "none", textAlign: "center", padding: "6px", borderRadius: "6px", fontSize: "12px", border: "1px solid #334155" },
  downloadBtn: { backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  copyBtn: { backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  editBtn: { backgroundColor: "#1e293b", color: "#facc15", border: "1px solid #334155", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  deleteBtn: { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },

  interactiveBox: { borderTop: "1px solid #1e293b", paddingTop: "10px" },
  reactionStyleBtn: { padding: "5px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  commentList: { maxHeight: "90px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#090d16", padding: "8px", borderRadius: "6px", marginBottom: "8px" },
  singleComment: { fontSize: "11px", color: "#cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" },
  deleteCommentBtn: { background: "none", border: "none", cursor: "pointer" },
  commentInput: { flex: 1, padding: "6px 10px", borderRadius: "4px", border: "1px solid #1e293b", backgroundColor: "#090d16", color: "#fff", fontSize: "12px" },
  sendCommentBtn: { backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "15px" },
  modalCard: { backgroundColor: "#0f172a", padding: "20px", borderRadius: "12px", width: "100%", position: "relative", border: "1px solid #1e293b" },
  closeModalBtn: { position: "absolute", top: "12px", right: "12px", backgroundColor: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" },
  modalScoreBar: { display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px" },
  modalBadge: { backgroundColor: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" },
  modalBadgeAdmin: { backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid rgba(56, 189, 248, 0.3)" },
  modalBadgeRank: { backgroundColor: "#0284c7", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" },
  profileDetailsList: { backgroundColor: "#090d16", padding: "12px", borderRadius: "8px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px", color: "#cbd5e1" },

  activityLogList: { maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" },
  activityItem: { backgroundColor: "#090d16", padding: "10px 12px", borderRadius: "8px", border: "1px solid #1e293b" },

  waCopyBtn: { backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" },
  copyToast: { position: "absolute", top: "-28px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0284c7", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" },

  footer: { textAlign: "center", padding: "20px", borderTop: "1px solid #1e293b", color: "#64748b", fontSize: "12px", marginTop: "40px" }
};

export default App;
