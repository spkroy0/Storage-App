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
  Heart, MessageCircle, Send, Crown, Award, CheckCircle, XCircle, Info, Ban, UserX, AlertTriangle, ExternalLink, Check, GraduationCap, Bell, Activity, Building, KeyRound
} from "lucide-react";

const BOOK_LIST = [
  "Notice For Student ★",
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
    <div className="wa-copy-wrapper">
      {copied && <span className="copy-toast">Copied!</span>}
      <button 
        type="button" 
        onClick={handleCopy} 
        className="wa-copy-btn"
        title="Click to copy WhatsApp number"
      >
        <span>{number}</span>
        {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color="#22c55e" />}
      </button>
    </div>
  );
}

// ROLE BADGE COMPONENT WITH ANIMATED GLOW
function RoleBadge({ role }) {
  if (role === "Admin") {
    return <span className="badge badge-admin rgb-pulse"><Crown size={11} /> Admin</span>;
  }
  if (role === "Moderator") {
    return <span className="badge badge-mod"><Shield size={11} /> Moderator</span>;
  }
  return <span className="badge badge-student">Student</span>;
}

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // 'home', 'dashboard', 'profile'
  
  // App Data States
  const [allNotes, setAllNotes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
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

  // Password Reset States
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Profile Edit States
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

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Dashboard Selected User State
  const [selectedDashboardUid, setSelectedDashboardUid] = useState(null);
  const [commentText, setCommentText] = useState({});

  const FILE_HOST_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || "5bbd692b6ba3cbb1ce420857c904c34b"; 

  // Dynamic Role Resolver
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

  // Check if profile is incomplete
  const isProfileIncomplete = user && (
    !myProfile.displayName?.trim() ||
    !myProfile.instituteName?.trim() ||
    !myProfile.deptRoll?.trim() ||
    !myProfile.whatsapp?.trim() ||
    !myProfile.address?.trim()
  );

  // Helper to Log Activity
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

  // Helper to Push Notification
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
      unsubscribeNotes();
      unsubscribeUsers();
      unsubscribeLogs();
      unsubscribeNotifs();
    };
  }, []);

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

  // Password Reset Handler
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (isCurrentUserBanned) {
      alert("আপনার অ্যাকাউন্টটি ব্যান রয়েছে।");
      return;
    }

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

        const notifTitle = subject.includes("Notice") ? "নতুন নোটিশ প্রকাশিত হয়েছে!" : "নতুন নোট আপলোড হয়েছে!";
        await pushNotification("all", notifTitle, `${uName} নতুন ফাইল আপলোড করেছেন: ${file.name}`, "info", downloadURL);
        await logActivity("File Uploaded", `আপলোড করেছেন: ${file.name} (বিষয়: ${subject})`);

        setUploading(false);
        setFile(null);
        setSubject(BOOK_LIST[0]);
        setNoteDate("");
        setPdfInfo("");
        alert("নোট/PDF সফলভাবে আপলোড হয়েছে! (+100 Points)");
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

        const uName = myProfile.displayName || user.displayName || user.email.split('@')[0];

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

    const uName = myProfile.displayName || user.displayName || user.email.split('@')[0];
    const newComment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
          const modName = myProfile.displayName || user.displayName || user.email.split('@')[0];
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

  const handleNotificationClick = (notif) => {
    if (notif.fileUrl) {
      window.open(notif.fileUrl, "_blank");
    } else {
      setCurrentView("home");
    }
    setShowNotifDropdown(false);
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

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div>
          <h1 className="logo-title rgb-text-glow">Math Note HUB</h1>
          <p className="logo-subtitle">Academic & Departmental Notes Repository</p>
        </div>

        {user && (
          <nav className="nav-tabs">
            <button 
              onClick={() => setCurrentView("home")} 
              className={`nav-btn ${currentView === "home" ? "active" : ""}`}
            >
              <Home size={16} /> Home
            </button>
            <button 
              onClick={() => setCurrentView("dashboard")} 
              className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setCurrentView("profile")} 
              className={`nav-btn ${currentView === "profile" ? "active" : ""}`}
            >
              <User size={16} /> My Profile
            </button>

            {isModOrAdmin && (
              <button onClick={() => setShowLogsModal(true)} className="logs-nav-btn" title="Check Activity Logs">
                <Activity size={16} /> Logs
              </button>
            )}

            <div className="notif-wrapper">
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="notif-btn">
                <Bell size={16} />
                {userNotifications.length > 0 && <span className="notif-badge">{userNotifications.length}</span>}
              </button>

              {showNotifDropdown && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <b>Notifications ({userNotifications.length})</b>
                    <span onClick={() => setShowNotifDropdown(false)} className="close-notif">Close</span>
                  </div>
                  <div className="notif-list">
                    {userNotifications.length === 0 ? (
                      <p className="no-notif">কোনো নোটিফিকেশন নেই</p>
                    ) : (
                      userNotifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`notif-item ${n.type}`}
                          title={n.fileUrl ? "ফাইলটি দেখতে ক্লিক করুন" : ""}
                        >
                          <b className="notif-item-title">
                            {n.title}
                            {n.fileUrl && <ExternalLink size={12} color="#00e5ff" />}
                          </b>
                          <p className="notif-item-msg">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        )}

        <div className="branding">
          Designed by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer" className="brand-link">Anondo</a>
        </div>
      </header>

      {user && isCurrentUserBanned && (
        <div className="banned-banner">
          <AlertTriangle size={20} color="#f87171" />
          <span>আপনার অ্যাকাউন্টটি স্থগিত (Banned) করা হয়েছে। আপনি কেবল তথ্য দেখতে পারবেন, কোনো পোস্ট/কমেন্ট করতে পারবেন না।</span>
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
        <div className="hero-section">
          <div className="welcome-box">
            <h2>স্বাগতম Math Note HUB-এ</h2>
            <p>নোট দেখতে ও পয়েন্ট অর্জন করতে অ্যাকাউন্টে লগইন করুন।</p>
          </div>

          <div className="auth-card">
            <h3>{isResetMode ? "পাসওয়ার্ড রিসেট করুন" : "প্রবেশ করুন"}</h3>
            
            {!isResetMode && (
              <div className="tab-container">
                <button onClick={() => setAuthMode("google")} className={`tab ${authMode === "google" ? "active" : ""}`}>Google</button>
                <button onClick={() => setAuthMode("email")} className={`tab ${authMode === "email" ? "active" : ""}`}>Email</button>
              </div>
            )}

            {authError && <p className="auth-error-msg">{authError}</p>}
            {resetMessage && <p className="auth-success-msg">{resetMessage}</p>}

            {!isResetMode && authMode === "google" && (
              <button onClick={handleGoogleLogin} className="google-btn">Continue with Google</button>
            )}

            {!isResetMode && authMode === "email" && (
              <form onSubmit={handleEmailAuth} className="form-layout">
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" />
                {isSignUp && (
                  <input type="password" placeholder="Retype Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="form-input" />
                )}
                <button type="submit" className="submit-btn">{isSignUp ? "Sign Up" : "Log In"}</button>
                
                {!isSignUp && (
                  <p 
                    onClick={() => { setIsResetMode(true); setAuthError(""); setResetMessage(""); }} 
                    className="forgot-password-link"
                  >
                    <KeyRound size={12} /> পাসওয়ার্ড ভুলে গেছেন? (Forgot Password?)
                  </p>
                )}

                <p onClick={() => setIsSignUp(!isSignUp)} className="auth-toggle-link">
                  {isSignUp ? "Account আছে? Log In করুন" : "Account নেই? Sign Up করুন"}
                </p>
              </form>
            )}

            {/* PASSWORD RESET FORM */}
            {isResetMode && (
              <form onSubmit={handleForgotPassword} className="form-layout">
                <p className="reset-instruction">
                  আপনার ইমেইল এড্রেসটি দিন। আমরা আপনার ইমেইলে পাসওয়ার্ড রিসেট করার একটি কোড/লিংক পাঠাবো।
                </p>
                <input 
                  type="email" 
                  placeholder="আপনার রেজিস্টার্ড Email লিখুন" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="form-input" 
                />
                <button type="submit" className="submit-btn">
                  রিসেট লিংক/কোড পাঠান
                </button>
                <p 
                  onClick={() => { setIsResetMode(false); setAuthError(""); setResetMessage(""); }} 
                  className="auth-toggle-link"
                >
                  ← লগইন পেজে ফিরে যান
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        <main className="main-feed">
          
          {/* USER QUICK BAR */}
          <div className="user-bar">
            <div className="user-bar-profile">
              <img 
                src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                className="user-avatar"
              />
              <div>
                <span className="user-name">
                  {myProfile.displayName || user.displayName || user.email}
                  <RoleBadge role={currentUserRole} />
                </span>
                <span className="user-rank-info">
                  {isAdmin ? "Website Owner" : `Points: ${myProfile.points} | Rank: ${getUserRank(user.uid, user.email)}`}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={14} /> লগ-আউট
            </button>
          </div>

          <div className="notice-banner">
            <Info size={18} color="#38bdf8" />
            <span className="notice-banner-text">
              ৩ জন মডারেটর প্রয়োজন! যারা ১-৩০ আগস্ট টপ লিডারবোর্ডে থাকবেন তাদের নিয়োগ দেওয়া হবে।
            </span>
          </div>

          {/* EDIT PROFILE VIEW */}
          {currentView === "profile" && (
            <div className="content-card">
              <h2 className="card-heading">
                <User size={20} color="#38bdf8" /> প্রোফাইল তথ্য
              </h2>
              
              <div className="score-summary-box">
                <div className="score-item">
                  <span className="score-label">Status / Points</span>
                  <span className="score-val">{isAdmin ? "Admin" : myProfile.points}</span>
                </div>
                <div className="score-divider"></div>
                <div className="score-item">
                  <span className="score-label">Leaderboard Rank</span>
                  <span className="score-val">{getUserRank(user.uid, user.email)}</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="form-layout">
                <div className="avatar-upload-section">
                  <img 
                    src={myProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Preview" 
                    className="avatar-preview"
                  />
                  <div className="badge-wrapper">
                    <RoleBadge role={currentUserRole} />
                  </div>
                  <div>
                    <label className="form-label">প্রোফাইল ছবি পরিবর্তন (Max 5MB):</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setProfilePicFile(e.target.files[0])}
                      className="file-input-inline"
                    />
                  </div>
                </div>

                <div className="input-grid">
                  <div>
                    <label className="form-label">নাম:</label>
                    <input type="text" value={myProfile.displayName} onChange={(e) => setMyProfile({...myProfile, displayName: e.target.value})} required className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">University / College Name:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Kurigram Govt. College" 
                      value={myProfile.instituteName} 
                      onChange={(e) => setMyProfile({...myProfile, instituteName: e.target.value})} 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div>
                    <label className="form-label">Department Roll No.:</label>
                    <input type="text" placeholder="e.g. 240105" value={myProfile.deptRoll} onChange={(e) => setMyProfile({...myProfile, deptRoll: e.target.value})} required className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">WhatsApp Number:</label>
                    <input type="text" placeholder="+88017xxxxxxxx" value={myProfile.whatsapp} onChange={(e) => setMyProfile({...myProfile, whatsapp: e.target.value})} required className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Email Address:</label>
                    <input type="email" value={myProfile.email} onChange={(e) => setMyProfile({...myProfile, email: e.target.value})} required className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Facebook Link:</label>
                    <input type="text" placeholder="https://facebook.com/yourid" value={myProfile.facebook} onChange={(e) => setMyProfile({...myProfile, facebook: e.target.value})} className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Date of Birth:</label>
                    <input type="date" value={myProfile.dob} onChange={(e) => setMyProfile({...myProfile, dob: e.target.value})} required className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">HSC College Name (Optional):</label>
                    <input type="text" placeholder="e.g. Kurigram Govt. College" value={myProfile.hscCollege} onChange={(e) => setMyProfile({...myProfile, hscCollege: e.target.value})} className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">HSC Passing Year (Optional):</label>
                    <input type="text" placeholder="e.g. 2024" value={myProfile.hscYear} onChange={(e) => setMyProfile({...myProfile, hscYear: e.target.value})} className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">HSC GPA (Optional):</label>
                    <input type="text" placeholder="e.g. 5.00" value={myProfile.hscGpa} onChange={(e) => setMyProfile({...myProfile, hscGpa: e.target.value})} className="form-input" />
                  </div>

                  <div className="full-width-grid">
                    <label className="form-label">ঠিকানা / Residence:</label>
                    <input type="text" placeholder="Kurigram Sadar, Kurigram" value={myProfile.address} onChange={(e) => setMyProfile({...myProfile, address: e.target.value})} required className="form-input" />
                  </div>
                </div>

                <button type="submit" disabled={savingProfile} className="submit-btn full-btn">
                  {savingProfile ? "সেভ হচ্ছে..." : "প্রোফাইল সেভ করুন"}
                </button>
              </form>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {currentView === "dashboard" && (
            <div className="dashboard-section">
              
              {isAdmin && pendingDeleteNotes.length > 0 && (
                <div className="admin-review-box">
                  <h3 className="review-title">
                    <AlertTriangle size={18} /> Admin Review: মডারেটরদের ডিলিট রিকোয়েস্ট ({pendingDeleteNotes.length})
                  </h3>
                  <div className="review-list">
                    {pendingDeleteNotes.map(note => (
                      <div key={note.id} className="review-item">
                        <div>
                          <b className="review-file-name">{note.fileName}</b>
                          <p className="review-file-meta">
                            বিষয়: {note.subject} | মডারেটর: <span className="highlight-text">{note.deletedByModName}</span>
                          </p>
                        </div>
                        <div className="btn-group">
                          <button onClick={() => handleAdminApproveDelete(note.id)} className="btn btn-success"><CheckCircle size={14} /> কনফার্ম ডিলিট</button>
                          <button onClick={() => handleAdminCancelDeleteRequest(note.id)} className="btn btn-secondary"><XCircle size={14} /> বাতিল</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="content-card">
                <h3 className="card-heading">
                  <Award size={20} color="#38bdf8" /> লিডারবোর্ড (Top Members)
                </h3>
                <div className="leaderboard-list">
                  {leaderboardUsers.map((u, index) => {
                    const uRole = getUserRole(u.email, u.uid);
                    const isUserAdmin = uRole === "Admin";

                    return (
                      <div key={u.id} className={`leader-item ${isUserAdmin ? "admin-item" : ""}`}>
                        <div className="leader-info">
                          <span className={`rank-tag ${isUserAdmin ? "admin-rank" : ""}`}>
                            {isUserAdmin ? <Crown size={18} color="#38bdf8" /> : `#${index - admins.length + 1}`}
                          </span>
                          <img src={u.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="u" className="small-avatar" />
                          <span 
                            onClick={() => setViewingProfile(u)} 
                            className="clickable-user"
                          >
                            {u.displayName || "User"}
                            <RoleBadge role={uRole} />
                          </span>
                        </div>
                        <div className="leader-actions">
                          {!isUserAdmin && (
                            <span className="pts-badge">{u.points || 0} Pts</span>
                          )}
                          {isAdmin && !isUserAdmin && (
                            <div className="btn-group">
                              <button onClick={() => handleToggleModerator(u)} className="mod-toggle-btn">
                                {uRole === "Moderator" ? "Remove Mod" : "Make Mod"}
                              </button>
                              <button 
                                onClick={() => handleToggleBanUser(u)}
                                className={`ban-toggle-btn ${u.isBanned ? "unban" : "ban"}`}
                                title={u.isBanned ? "Unban User" : "Ban User"}
                              >
                                {u.isBanned ? "Unban" : <Ban size={14} />}
                              </button>
                              <button 
                                onClick={() => handlePermanentlyRemoveUser(u)}
                                className="delete-user-btn"
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

              <div className="content-card">
                <h3 className="card-heading">
                  সকল রেজিস্টার্ড মেম্বার
                </h3>
                <div className="user-chips-grid">
                  <button 
                    onClick={() => setSelectedDashboardUid(null)}
                    className={`user-chip ${!selectedDashboardUid ? "active" : ""}`}
                  >
                    সকল ইউজার
                  </button>
                  {visibleUsers.map(u => {
                    return (
                      <div key={u.id} className="user-chip-wrapper">
                        <button 
                          onClick={() => setSelectedDashboardUid(u.uid)}
                          className={`user-chip ${selectedDashboardUid === u.uid ? "active" : ""} ${u.isBanned ? "banned" : ""}`}
                        >
                          {u.displayName || u.email.split('@')[0]}
                          {u.isBanned && <span className="banned-tag">(Banned)</span>}
                        </button>
                        <button 
                          onClick={() => setViewingProfile(u)}
                          className="info-icon-btn"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="section-title">
                {selectedDashboardUid ? "নির্বাচিত সদস্যের ফাইলসমূহ" : "সকল সংগৃহীত ফাইলসমূহ"} ({dashboardFilteredNotes.length})
              </h3>

              <div className="notes-grid">
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

          {/* HOME VIEW */}
          {currentView === "home" && (
            <>
              <div className="content-card">
                <h3 className="card-heading">
                  <Search size={16} color="#38bdf8" /> বিষয় ও তারিখ দিয়ে ফিল্টার করুন
                </h3>
                <div className="filter-grid">
                  <div className="search-input-wrapper">
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
                      className="form-input"
                    />
                    {showSuggestions && searchQuery.trim() !== "" && (
                      <div className="suggestion-box">
                        {suggestedBooks.map((book, idx) => (
                          <div 
                            key={idx} 
                            className="suggestion-item"
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

                  <div className="date-input-wrapper">
                    <input 
                      type="date" 
                      value={selectedDateFilter}
                      onChange={(e) => setSelectedDateFilter(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h3 className="card-heading">
                  <UploadCloud size={20} color="#38bdf8" /> নতুন PDF / ছবি শেয়ার করুন (+100 Points)
                </h3>
                <form onSubmit={handleUpload} className="upload-form">
                  <div className="input-grid">
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="form-input" required>
                      {BOOK_LIST.map((item, index) => (
                        <option key={index} value={item} style={{ backgroundColor: "#0f172a", color: "#fff" }}>{item}</option>
                      ))}
                    </select>

                    <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} required className="form-input" />
                  </div>

                  <input type="text" placeholder="নোট সংক্রান্ত অতিরিক্ত তথ্য (PDF Info)" value={pdfInfo} onChange={(e) => setPdfInfo(e.target.value)} className="form-input full-width-input" />

                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} required className="file-select-input" />
                  
                  <button type="submit" disabled={uploading || isCurrentUserBanned} className={`submit-btn full-btn ${isCurrentUserBanned ? "disabled" : ""}`}>
                    {uploading ? "আপলোড হচ্ছে..." : "নোট আপলোড করুন"}
                  </button>
                </form>
              </div>

              <h2 className="section-title">
                সংগৃহীত নোটস ({filteredNotes.length})
              </h2>
              
              <div className="notes-grid">
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
        </main>
      )}

      {/* ACTIVITY LOGS MODAL */}
      {showLogsModal && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <button onClick={() => setShowLogsModal(false)} className="close-modal-btn"><XCircle size={18} /></button>
            <h3 className="modal-title">
              <Activity size={18} /> Activity Logs (সর্বশেষ কার্যক্রম)
            </h3>

            <div className="activity-log-list">
              {activityLogs.length === 0 ? (
                <p className="empty-msg">কোনো অ্যাক্টিভিটি পাওয়া যায়নি</p>
              ) : (
                activityLogs.map(log => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-item-header">
                      <span className="user-name">
                        {log.userName} <RoleBadge role={log.userRole} />
                      </span>
                      <span className="log-time">
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : "Just now"}
                      </span>
                    </div>
                    <div className="log-action">{log.action}</div>
                    <div className="log-details">{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button onClick={() => setEditingNote(null)} className="close-modal-btn"><XCircle size={18} /></button>
            <h3 className="modal-title">ফাইলের নাম ও তথ্য পরিবর্তন</h3>
            <form onSubmit={handleSaveNoteEdit} className="form-layout">
              <div>
                <label className="form-label">ফাইলের নাম (File Name):</label>
                <input 
                  type="text" 
                  value={editFileName} 
                  onChange={(e) => setEditFileName(e.target.value)} 
                  required 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">PDF/নোট তথ্য (Info):</label>
                <input 
                  type="text" 
                  value={editPdfInfo} 
                  onChange={(e) => setEditPdfInfo(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <button type="submit" className="submit-btn full-btn">সেভ করুন</button>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC PROFILE VIEW MODAL */}
      {viewingProfile && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button onClick={() => setViewingProfile(null)} className="close-modal-btn"><XCircle size={18} /></button>
            <div className="profile-modal-header">
              <img 
                src={viewingProfile.photoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="Profile" 
                className="modal-avatar"
              />
              <h3 className="profile-modal-title">
                {viewingProfile.displayName || "User Profile"}
                <RoleBadge role={getUserRole(viewingProfile.email, viewingProfile.uid)} />
              </h3>

              <div className="modal-score-bar">
                {getUserRole(viewingProfile.email, viewingProfile.uid) === "Admin" ? (
                  <span className="badge badge-admin">Website Owner</span>
                ) : (
                  <>
                    <span className="badge badge-success">Points: {viewingProfile.points || 0}</span>
                    <span className="badge badge-primary">Rank: {getUserRank(viewingProfile.uid, viewingProfile.email)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="profile-details-list">
              <p>
                <Building size={14} color="#38bdf8" /> <b>Institution:</b> {viewingProfile.instituteName || "N/A"}
              </p>
              <p><b>Dept. Roll:</b> {viewingProfile.deptRoll || "N/A"}</p>
              <p>
                <b>WhatsApp:</b> <WhatsAppCopyButton number={viewingProfile.whatsapp} />
              </p>
              <p><b>Email:</b> {viewingProfile.email || "N/A"}</p>
              <p><b>Date of Birth:</b> {viewingProfile.dob || "N/A"}</p>
              <p><b>Address:</b> {viewingProfile.address || "N/A"}</p>

              <p className="hsc-section-title">
                <GraduationCap size={14} /> HSC Information:
              </p>
              <p className="indented"><b>College:</b> {viewingProfile.hscCollege || "N/A"}</p>
              <p className="indented"><b>Year:</b> {viewingProfile.hscYear || "N/A"}</p>
              <p className="indented"><b>GPA:</b> {viewingProfile.hscGpa || "N/A"}</p>

              {viewingProfile.facebook && (
                <p><b>Facebook:</b> <a href={viewingProfile.facebook} target="_blank" rel="noreferrer" className="external-link">Profile Link <ExternalLink size={12} /></a></p>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>© 2026 Math Note HUB | Developed by <a href="https://Anondo.bro.bd" target="_blank" rel="noopener noreferrer">Anondo</a></p>
      </footer>
    </div>
  );
}

// SINGLE NOTE CARD COMPONENT
function NoteCardItem({ note, user, allUsers, isModOrAdmin, isAdmin, isCurrentUserBanned, handleReactionToggle, handleAddComment, handleDeleteComment, commentText, setCommentText, handleDownload, copyLink, handleDelete, handleOpenEditModal, setViewingProfile, getUserRole }) {
  const hasLoved = note.loves?.includes(user?.uid);

  const uploaderProfile = allUsers.find(u => u.uid === note.uploaderUid);
  const uploaderRole = getUserRole(note.uploaderEmail || uploaderProfile?.email, note.uploaderUid);

  const isOwner = user && note.uploaderUid === user.uid;
  const canEdit = isOwner || isModOrAdmin;

  return (
    <div className="note-card">
      <div>
        <div className="card-header">
          <span className="subject-tag">{note.subject}</span>
          <span className="date-tag"><Calendar size={12} /> {note.date}</span>
        </div>

        <h4 className="file-name">{note.fileName}</h4>
        {note.pdfInfo && <p className="pdf-info-tag"><Info size={12} /> {note.pdfInfo}</p>}
        
        {note.isPendingDelete && (
          <div className="pending-alert-tag">
            <AlertTriangle size={12} /> ডিলিট পেন্ডিং (মডারেটর: {note.deletedByModName})
          </div>
        )}

        <p className="uploader-text">
          Uploaded by:{" "}
          <b 
            onClick={() => uploaderProfile && setViewingProfile(uploaderProfile)} 
            className="uploader-link"
          >
            {note.uploadedBy}
          </b>
          {" "}<RoleBadge role={uploaderRole} />
        </p>
      </div>

      <div className="card-actions">
        <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-view">দেখুন</a>
        <button onClick={() => handleDownload(note.fileUrl, note.fileName)} className="btn btn-download"><Download size={13} /></button>
        <button onClick={() => copyLink(note.fileUrl)} className="btn btn-copy"><Copy size={13} /></button>
        
        {canEdit && (
          <button onClick={() => handleOpenEditModal(note)} className="btn btn-edit" title="Edit Note">
            <Edit size={13} />
          </button>
        )}

        {isModOrAdmin && (
          <button onClick={() => handleDelete(note)} className="btn btn-delete" title={isAdmin ? "Delete Note" : "Request Delete"}>
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="interactive-box">
        <div className="reaction-bar">
          <button 
            onClick={() => handleReactionToggle(note, "love")} 
            disabled={isCurrentUserBanned}
            className={`reaction-btn ${hasLoved ? "loved" : ""}`}
          >
            <Heart size={14} fill={hasLoved ? "#fff" : "none"} /> {note.loves?.length || 0}
          </button>

          <span className="comment-count">
            <MessageCircle size={13} /> {note.comments?.length || 0}
          </span>
        </div>

        <div className="comment-list">
          {note.comments?.map((c) => {
            const commentUserRole = getUserRole(c.userEmail, c.userUid);
            return (
              <div key={c.id || Math.random()} className="single-comment">
                <div className="comment-body">
                  <b>{c.userName}</b> <RoleBadge role={commentUserRole} />: {c.text}
                </div>
                {isModOrAdmin && (
                  <button 
                    onClick={() => handleDeleteComment(note.id, c)} 
                    className="delete-comment-btn"
                  >
                    <Trash2 size={11} color="#f87171" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isCurrentUserBanned && (
          <form onSubmit={(e) => handleAddComment(e, note)} className="comment-form">
            <input 
              type="text" 
              placeholder="কমেন্ট করুন..." 
              value={commentText[note.id] || ""} 
              onChange={(e) => setCommentText({ ...commentText, [note.id]: e.target.value })}
              className="comment-input"
            />
            <button type="submit" className="send-comment-btn"><Send size={12} /></button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
