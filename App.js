import React, { useState, useEffect } from "react";
import { auth, provider, db, storage } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  const handleLogin = () => signInWithPopup(auth, provider);
  const handleLogout = () => signOut(auth);

  const handleUpload = () => {
    if (!file) return;

    // ৫০ MB সীমা নির্ধারণ (৫০ * ১০২৪ * ১০২৪ বাইট)
    const MAX_SIZE = 50 * 1024 * 1024;
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
    <div style={{ padding: "20px", fontFamily: "Arial", textAlign: "center" }}>
      {!user ? (
        <div>
          <h2>ফাইল ড্রাইভে স্বাগতম</h2>
          <button onClick={handleLogin} style={{ padding: "10px 20px", fontSize: "16px" }}>
            Google দিয়ে সাইন-ইন করুন
          </button>
        </div>
      ) : (
        <div>
          <h2>স্বাগতম, {user.displayName}</h2>
          <button onClick={handleLogout}>লগ-আউট</button>

          <hr />

          <h3>ফাইল আপলোড করুন (সর্বোচ্চ ৫০ MB)</h3>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? "আপলোড হচ্ছে..." : "আপলোড করুন"}
          </button>

          <hr />

          <h3>আপনার সংরক্ষিত ফাইলসমূহ:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {userFiles.map((f) => (
              <li key={f.id} style={{ marginBottom: "10px" }}>
                <span>{f.name} </span>
                <button onClick={() => copyLink(f.url)}>লিংক কপি করুন</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
