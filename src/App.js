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
  arrayRemove
} from "firebase/firestore";
import { PDFDocument } from "pdf-lib";

// SVG Icons import from Lucide React
import { 
  Home, LayoutDashboard, User, Shield,
  Calendar, FileText, Download, Copy, Edit, Trash2,
  Heart, MessageCircle, Send, Crown, Info, AlertTriangle, Check, Activity, Image as ImageIcon, XCircle
} from "lucide-react";

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
          <b onClick={() => uploaderProfile && setViewingProfile(uploaderProfile)} style={{ color: "#38bdf8", cursor: "pointer", fontWeight: "500" }}>
            {note.uploadedBy}
          </b>
          {" "}<RoleBadge role={uploaderRole} />
        </p>
      </div>

      <div style={styles.cardActions}>
        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>দেখুন</a>
        <button onClick={() => handleDownload(note.fileUrl, note.fileName)} style={styles.downloadBtn}><Download size={13} /></button>
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
          {note.comments?.map((c) => {
            const commentUserRole = getUserRole(c.userEmail, c.userUid);
            return (
              <div key={c.id || Math.random()} style={styles.singleComment}>
                <div style={{ flex: 1 }}>
                  <b>{c.userName}</b> <RoleBadge role={commentUserRole} />: {c.text}
                </div>
                {isModOrAdmin && (
                  <button onClick={() => handleDeleteComment(note.id, c)} style={styles.deleteCommentBtn}>
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
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);

  const [viewingProfile, setViewingProfile] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [editPdfInfo, setEditPdfInfo] = useState("");

  const [files, setFiles] = useState([]); 
  const [subject, setSubject] = useState(BOOK_LIST[0]);
  const [noteDate, setNoteDate] = useState("");
  const [pdfInfo, setPdfInfo] = useState(""); 
  
  const [authMode, setAuthMode] = useState("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

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

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      unsubscribeNotes();
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  const handleLogoUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newLogoFile) {
      alert("অনুগ্রহ করে একটি লোগো ছবি সিলেক্ট করুন!");
      return;
    }

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
        await setDoc(doc(db, "settings", "general"), { logoUrl: logoUrl }, { merge: true });
        await logActivity("Logo Updated", "অ্যাডমিন ওয়েবসাইটের লোগো পরিবর্তন করেছেন।");
        setNewLogoFile(null);
        alert("লোগো সফলভাবে আপডেট করা হয়েছে!");
      } else {
        throw new Error("Logo upload failed");
      }
    } catch (err) {
      console.error(err);
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

  const handleGoogleLogin = () => signInWithPopup(auth, provider).catch(err => setAuthError(err.message));

  const handleEmailAuth = (e) => {
    e.preventDefault();
    setAuthError("");
    if (isSignUp) {
      if (password !== confirmPassword) {
        setAuthError("পাসওয়ার্ড দুটি মিলছে না!");
        return;
      }
      createUserWithEmailAndPassword(auth, email, password).catch(err => setAuthError(err.message));
    } else {
      signInWithEmailAndPassword(auth, email, password).catch(err => setAuthError(err.message));
    }
  };

  const handleLogout = () => signOut(auth);

  const handleToggleBanUser = async (targetUser) => {
    if (!isAdmin) return;
    if (getUserRole(targetUser.email, targetUser.uid) === "Admin") return;

    const nextBanState = !targetUser.isBanned;
    if (window.confirm(nextBanState ? "ব্যান করতে চান?" : "আনব্যান করতে চান?")) {
      try {
        await updateDoc(doc(db, "users", targetUser.id), { isBanned: nextBanState });
        await logActivity("Ban Status Changed", `${targetUser.displayName || targetUser.email}-এর ব্যান স্ট্যাটাস পরিবর্তিত হয়েছে।`);
        alert("সফল হয়েছে।");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePermanentlyRemoveUser = async (targetUser) => {
    if (!isAdmin) return;
    if (getUserRole(targetUser.email, targetUser.uid) === "Admin") return;

    if (window.confirm("স্থায়ীভাবে ইউজার ডিলিট করতে চান?")) {
      try {
        await deleteDoc(doc(db, "users", targetUser.id));
        alert("ইউজার রিমুভ করা হয়েছে!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleModerator = async (targetUser) => {
    if (!isAdmin) return;
    const currentRole = getUserRole(targetUser.email, targetUser.uid);
    if (currentRole === "Admin") return;

    const newRole = currentRole === "Moderator" ? "Student" : "Moderator";
    try {
      await updateDoc(doc(db, "users", targetUser.id), { role: newRole });
      alert(`রোল আপডেট হয়েছে: ${newRole}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let finalPhotoUrl = myProfile.photoUrl;
      if (profilePicFile) {
        const formData = new FormData();
        formData.append("image", profilePicFile);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, { method: "POST", body: formData });
        const resData = await res.json();
        if (resData.success) finalPhotoUrl = resData.data.url;
      }

      await updateDoc(doc(db, "users", user.uid), {
        ...myProfile,
        photoUrl: finalPhotoUrl
      });
      setSavingProfile(false);
      alert("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
    } catch (error) {
      setSavingProfile(false);
      alert("সমস্যা হয়েছে!");
    }
  };

  // MULTIPLE IMAGES TO PDF SEQUENTIAL UPLOAD LOGIC
  const handleUpload = async (e) => {
    e.preventDefault();
    if (isCurrentUserBanned) {
      alert("আপনার অ্যাকাউন্টটি ব্যান রয়েছে।");
      return;
    }

    if (!files || files.length === 0 || !subject || !noteDate) {
      alert("অনুগ্রহ করে ফাইল, বিষয় এবং তারিখ প্রদান করুন!");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let fileToUpload = files[0];
      const isMultipleImages = files.length > 1 && Array.from(files).every(f => f.type.startsWith("image/"));

      // সিরিয়াল মেইনটেইন করে একাধিক ছবিকে একটিমাত্র PDF ফাইলে কনভার্ট করা
      if (isMultipleImages) {
        const pdfDoc = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const imgFile = files[i];
          const arrayBuffer = await imgFile.arrayBuffer();
          let embeddedImage;
          if (imgFile.type === "image/png") {
            embeddedImage = await pdfDoc.embedPng(arrayBuffer);
          } else {
            embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
          }
          const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
          page.drawImage(embeddedImage, { x: 0, y: 0, width: embeddedImage.width, height: embeddedImage.height });
        }
        const pdfBytes = await pdfDoc.save();
        fileToUpload = new File([pdfBytes], `${subject.substring(0, 15)}_sequential_notes.pdf`, { type: "application/pdf" });
      }

      setUploadProgress(40);
      const formData = new FormData();
      formData.append("image", fileToUpload);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${FILE_HOST_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success || result.data?.url) {
        setUploadProgress(90);
        const downloadURL = result.data.url;
        const uName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "User";

        await addDoc(collection(db, "notes"), {
          fileName: fileToUpload.name,
          subject: subject,
          date: noteDate,
          pdfInfo: pdfInfo.trim(),
          fileUrl: downloadURL,
          uploadedBy: uName,
          uploaderUid: user.uid,
          uploaderEmail: user.email,
          loves: [],
          comments: [],
          isPendingDelete: false,
          deletedByModName: "",
          createdAt: new Date()
        });

        await updateUserScore(user.uid, 100);
        await logActivity("File Uploaded", `আপলোড করেছেন: ${fileToUpload.name}`);

        setUploading(false);
        setFiles([]);
        setSubject(BOOK_LIST[0]);
        setNoteDate("");
        setPdfInfo("");
        setUploadProgress(0);
        alert("সফলভাবে আপলোড হয়েছে! (+100 Points)");
      } else {
        throw new Error("Upload error");
      }
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert("আপলোড ব্যর্থ হয়েছে!");
    }
  };

  const handleReactionToggle = async (note, type) => {
    if (!user || isCurrentUserBanned) return;
    const noteRef = doc(db, "notes", note.id);
    const hasLoved = note.loves?.includes(user.uid);
    if (hasLoved) {
      await updateDoc(noteRef, { loves: arrayRemove(user.uid) });
    } else {
      await updateDoc(noteRef, { loves: arrayUnion(user.uid) });
    }
  };

  const handleAddComment = async (e, note) => {
    e.preventDefault();
    if (isCurrentUserBanned) return;
    const text = commentText[note.id];
    if (!text || !text.trim()) return;

    const uName = myProfile.displayName || user.displayName || user.email?.split('@')[0] || "User";
    const newComment = {
      id: Date.now().toString(),
      userName: uName,
      userUid: user.uid,
      userEmail: user.email,
      text: text.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await updateDoc(doc(db, "notes", note.id), { comments: arrayUnion(newComment) });
    setCommentText(prev => ({ ...prev, [note.id]: "" }));
  };

  const handleDeleteComment = async (noteId, commentObj) => {
    if (!isModOrAdmin) return;
    await updateDoc(doc(db, "notes", noteId), { comments: arrayRemove(commentObj) });
  };

  const handleDelete = async (note) => {
    if (!isModOrAdmin) return;
    if (isAdmin) {
      if (window.confirm("ডিলিট করতে চান?")) {
        await deleteDoc(doc(db, "notes", note.id));
      }
    } else {
      await updateDoc(doc(db, "notes", note.id), { isPendingDelete: true, deletedByModName: myProfile.displayName || "Mod" });
      alert("রিকোয়েস্ট পাঠানো হয়েছে!");
    }
  };

  // PDF Download functionality
  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "Document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("লিংক কপি হয়েছে!");
  };

  const visibleNotes = allNotes.filter(n => isAdmin || !allUsers.find(u => u.uid === n.uploaderUid)?.isBanned);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#090d16", color: "#38bdf8" }}>
        <h3>লোড হচ্ছে...</h3>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, maxWidth: activeIsMobile ? "100%" : "1200px" }}>
      <header style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.logoContainer}>
              {siteLogoUrl ? <img src={siteLogoUrl} alt="Logo" style={styles.logoImageStyle} /> : <ImageIcon size={24} color="#38bdf8" />}
            </div>
            <h1 style={styles.logo}>Math Note HUB</h1>
          </div>

          {user && (
            <div style={styles.navTabs}>
              <button onClick={() => setCurrentView("home")} style={{ ...styles.navBtn, ...(currentView === "home" ? styles.activeNavBtn : {}) }}><Home size={16} /> Home</button>
              <button onClick={() => setCurrentView("dashboard")} style={{ ...styles.navBtn, ...(currentView === "dashboard" ? styles.activeNavBtn : {}) }}><LayoutDashboard size={16} /> Dashboard</button>
              <button onClick={() => setCurrentView("profile")} style={{ ...styles.navBtn, ...(currentView === "profile" ? styles.activeNavBtn : {}) }}><User size={16} /> Profile</button>
              
              {/* ডেভেলপার টুলস ও লগস শুধুমাত্র অ্যাডমিনের জন্য দৃশ্যমান এবং লুকানো থাকবে */}
              {isAdmin && (
                <button onClick={() => setShowLogsModal(true)} style={styles.logsNavBtn}><Activity size={16} /> Developer Tools / Logs</button>
              )}
            </div>
          )}
        </div>
      </header>

      {!user ? (
        <div style={styles.heroSection}>
          <div style={styles.authCard}>
            <h3>প্রবেশ করুন</h3>
            {authError && <p style={{ color: "#f87171" }}>{authError}</p>}
            {authMode === "google" ? (
              <button onClick={handleGoogleLogin} style={styles.googleBtn}>Google দিয়ে লগইন করুন</button>
            ) : (
              <form onSubmit={handleEmailAuth} style={styles.form}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
                <button type="submit" style={styles.submitBtn}>সাবমিট</button>
              </form>
            )}
            <button onClick={() => setAuthMode(authMode === "google" ? "email" : "google")} style={{ background: "none", border: "none", color: "#38bdf8", marginTop: "10px", cursor: "pointer" }}>
              লগইন পদ্ধতি পরিবর্তন করুন
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.mainFeed}>
          {currentView === "home" && (
            <>
              {/* আপলোড সেকশন যেখানে একাধিক ছবি সিলেক্ট করলে সিকোয়েন্সিয়াল পিডিএফ তৈরি হবে */}
              <div style={styles.uploadCard}>
                <h3>নতুন নোট বা একাধিক ছবি (Sequential PDF) আপলোড করুন (+100 Pts)</h3>
                <form onSubmit={handleUpload} style={styles.uploadForm}>
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.input} required>
                    {BOOK_LIST.map((item, idx) => <option key={idx} value={item}>{item}</option>)}
                  </select>
                  <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} required style={styles.input} />
                  <input type="text" placeholder="নোট সংক্রান্ত তথ্য" value={pdfInfo} onChange={e => setPdfInfo(e.target.value)} style={styles.input} />
                  
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFiles(e.target.files)} required style={{ margin: "10px 0" }} />
                  
                  {uploading && <p style={{ color: "#38bdf8" }}>আপলোড হচ্ছে... {uploadProgress}%</p>}
                  <button type="submit" disabled={uploading} style={styles.uploadBtn}>আপলোড করুন</button>
                </form>
              </div>

              <h2>সংগৃহীত নোটস ({visibleNotes.length})</h2>
              <div style={styles.notesGrid}>
                {visibleNotes.map(n => (
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
                    handleOpenEditModal={setEditingNote}
                    setViewingProfile={setViewingProfile}
                    getUserRole={getUserRole}
                  />
                ))}
              </div>
            </>
          )}

          {currentView === "dashboard" && (
            <div>
              {/* অ্যাডমিন প্যানেল কনট্রোল */}
              {isAdmin && (
                <div style={styles.adminLogoBox}>
                  <h3>অ্যাডমিন কন্ট্রোল প্যানেল</h3>
                  <form onSubmit={handleLogoUpdate} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <input type="file" accept="image/*" onChange={e => setNewLogoFile(e.target.files[0])} required />
                    <button type="submit" style={styles.uploadBtn}>লোগো আপডেট</button>
                  </form>
                </div>
              )}
              <h3>মেম্বার লিডারবোর্ড</h3>
              {leaderboardUsers.map(u => (
                <div key={u.id} style={styles.leaderItem}>
                  <span>{u.displayName || u.email} <RoleBadge role={getUserRole(u.email, u.uid)} /></span>
                  {isAdmin && getUserRole(u.email, u.uid) !== "Admin" && (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button onClick={() => handleToggleModerator(u)}>মডারেটর টগল</button>
                      <button onClick={() => handleToggleBanUser(u)}>ব্যান</button>
                      <button onClick={() => handlePermanentlyRemoveUser(u)}>রিমুভ</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentView === "profile" && (
            <div style={styles.profileSection}>
              <h2>প্রোফাইল</h2>
              <form onSubmit={handleSaveProfile} style={styles.form}>
                <input type="text" value={myProfile.displayName} onChange={e => setMyProfile({...myProfile, displayName: e.target.value})} placeholder="নাম" required style={styles.input} />
                <input type="text" value={myProfile.instituteName} onChange={e => setMyProfile({...myProfile, instituteName: e.target.value})} placeholder="প্রতিষ্ঠান" required style={styles.input} />
                <button type="submit" style={styles.uploadBtn}>সেভ করুন</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ডেভেলপার লগ মোডাল - শুধুমাত্র অ্যাডমিনের জন্য দৃশ্যমান */}
      {showLogsModal && isAdmin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button onClick={() => setShowLogsModal(false)} style={styles.closeModalBtn}><XCircle /></button>
            <h3>অ্যাক্টিভিটি লগস ও ডেভেলপার টুলস</h3>
            {activityLogs.map(l => (
              <div key={l.id} style={styles.activityItem}>
                <b>{l.userName}</b>: {l.action} ({l.details})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: "sans-serif", backgroundColor: "#090d16", minHeight: "100vh", color: "#f8fafc", margin: "0 auto", padding: "10px" },
  header: { backgroundColor: "#0f172a", padding: "10px", borderRadius: "8px", marginBottom: "20px" },
  logoContainer: { width: "36px", height: "36px", overflow: "hidden", borderRadius: "6px" },
  logoImageStyle: { width: "100%", height: "100%", objectFit: "cover" },
  logo: { fontSize: "18px", color: "#f8fafc", margin: 0 },
  navTabs: { display: "flex", gap: "6px" },
  navBtn: { background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "4px" },
  activeNavBtn: { background: "#1e293b", color: "#38bdf8" },
  logsNavBtn: { background: "#8b5cf6", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" },
  heroSection: { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" },
  authCard: { background: "#0f172a", padding: "30px", borderRadius: "10px", textAlign: "center", width: "350px" },
  googleBtn: { background: "#0284c7", color: "#fff", border: "none", padding: "10px", width: "100%", borderRadius: "6px", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", background: "#090d16", border: "1px solid #1e293b", color: "#fff", borderRadius: "6px" },
  submitBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer" },
  mainFeed: { display: "flex", flexDirection: "column", gap: "20px" },
  uploadCard: { background: "#0f172a", padding: "20px", borderRadius: "10px" },
  uploadForm: { display: "flex", flexDirection: "column", gap: "10px" },
  uploadBtn: { background: "#0284c7", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer" },
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" },
  noteCard: { background: "#0f172a", padding: "15px", borderRadius: "8px", border: "1px solid #1e293b" },
  cardHeader: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "8px" },
  subjectTag: { color: "#38bdf8", fontWeight: "600" },
  dateTag: { display: "flex", alignItems: "center", gap: "3px" },
  fileName: { fontSize: "14px", fontWeight: "600", marginBottom: "8px" },
  pdfInfoTag: { fontSize: "12px", color: "#94a3b8", marginBottom: "8px" },
  pendingAlertTag: { fontSize: "11px", color: "#f87171", marginBottom: "8px" },
  uploaderText: { fontSize: "12px", color: "#64748b", marginBottom: "10px" },
  cardActions: { display: "flex", gap: "5px", marginBottom: "10px" },
  viewBtn: { background: "#1e293b", color: "#38bdf8", padding: "5px 10px", textDecoration: "none", borderRadius: "4px", fontSize: "12px" },
  downloadBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" },
  copyBtn: { background: "#1e293b", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" },
  editBtn: { background: "#facc15", color: "#000", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" },
  deleteBtn: { background: "#dc2626", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" },
  interactiveBox: { borderTop: "1px solid #1e293b", paddingTop: "8px" },
  reactionStyleBtn: { background: "#1e293b", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  commentList: { maxHeight: "80px", overflowY: "auto", fontSize: "11px", marginBottom: "6px" },
  singleComment: { display: "flex", justifyContent: "space-between", marginBottom: "3px" },
  deleteCommentBtn: { background: "none", border: "none", cursor: "pointer" },
  commentInput: { background: "#090d16", border: "1px solid #1e293b", color: "#fff", padding: "5px", fontSize: "11px", borderRadius: "4px", flex: 1 },
  sendCommentBtn: { background: "#0284c7", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" },
  adminLogoBox: { background: "#0f172a", padding: "15px", borderRadius: "8px", marginBottom: "15px" },
  leaderItem: { background: "#0f172a", padding: "10px", borderRadius: "6px", marginBottom: "6px", display: "flex", justifyContent: "space-between" },
  profileSection: { background: "#0f172a", padding: "20px", borderRadius: "10px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#0f172a", padding: "20px", borderRadius: "10px", width: "90%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto", position: "relative" },
  closeModalBtn: { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#fff", cursor: "pointer" },
  activityItem: { background: "#090d16", padding: "8px", borderRadius: "4px", marginBottom: "6px", fontSize: "12px" },
  studentBadge: { background: "#334155", color: "#cbd5e1", padding: "2px 5px", borderRadius: "3px", fontSize: "10px" },
  adminBadge: { background: "#ef4444", color: "#fff", padding: "2px 5px", borderRadius: "3px", fontSize: "10px" },
  modBadge: { background: "#3b82f6", color: "#fff", padding: "2px 5px", borderRadius: "3px", fontSize: "10px" }
};

export default App;
