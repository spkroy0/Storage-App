import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Upload, FileText, Trash2, Download } from "lucide-react";

export default function PdfUploader() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // একাধিক ছবি সিলেক্ট করার হ্যান্ডলার
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // ফাইলগুলোকে প্রিভিউ করার জন্য ইউআরএল এ রূপান্তর করা
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    // আগেরগুলোর সাথে নতুন ছবিগুলো সিরিয়ালি যোগ করা
    setImages((prev) => [...prev, ...newImages]);
  };

  // নির্দিষ্ট কোনো ছবি লিস্ট থেকে ডিলিট করার ফাংশন
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ছবিগুলোকে সিরিয়ালি পিডিএফ-এ কনভার্ট করে ডাউনলোড করার ফাংশন
  const generatePDF = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const imgData = await readImageAsDataURL(images[i].file);

        // যদি এটি ২য় বা তার বেশি পেজ হয়, তবে নতুন পেজ অ্যাড করবো
        if (i > 0) {
          pdf.addPage();
        }

        // ক্যানভাস বা ইমেজ প্রপোশন ঠিক রেখে পিডিএফে বসানো
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

        let heightToUse = imgHeight;
        if (heightToUse > pageHeight) {
          heightToUse = pageHeight;
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, heightToUse);
      }

      // পিডিএফ ফাইল ডাউনলোড করা
      pdf.save("Math-Note-HUB-Document.pdf");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("পিডিএফ তৈরি করার সময় সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  // হেল্পার ফাংশন: ফাইলকে Base64 এ কনভার্ট করার জন্য
  const readImageAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="profile-card" style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h3 className="user-name" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FileText color="#00e5ff" /> একসাথে একাধিক ছবি আপলোড ও পিডিএফ তৈরি
      </h3>

      {/* ফাইল সিলেক্ট করার ইনপুট (multiple অ্যাট্রিবিউটসহ) */}
      <div className="form-group">
        <label className="save-btn" style={{ textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <Upload size={18} /> ছবিগুলো সিলেক্ট করুন (একাধিক)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* আপলোড করা ছবিগুলোর সিরিয়াল প্রিভিউ */}
      {images.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "8px" }}>
            সিরিয়াল অনুযায়ী সাজানো ছবি ({images.length}টি):
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
            {images.map((img, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#0f172a",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#00e5ff", fontWeight: "bold" }}>#{index + 1}</span>
                  <img src={img.preview} alt="preview" style={{ width: "35px", height: "35px", objectFit: "cover", borderRadius: "4px" }} />
                  <span style={{ fontSize: "0.8rem", color: "#f8fafc", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {img.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveImage(index)}
                  style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* পিডিএফ ডাউনলোড বাটন */}
          <button
            onClick={generatePDF}
            disabled={loading}
            className="save-btn"
            style={{ width: "100%", marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Download size={18} /> {loading ? "পিডিএফ তৈরি হচ্ছে..." : "সব ছবি একসাথে PDF ডাউনলোড করুন"}
          </button>
        </div>
      )}
    </div>
  );
}
