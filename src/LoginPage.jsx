export default function LoginPage() {
  return (
    <div className="app-container">
      {/* লগইন ক্যাপশন ও প্রোমো কার্ড (App.css এর ক্লাসের সাথে সামঞ্জস্যপূর্ণ) */}
      <div className="login-caption-card">
        <h3 className="login-caption-title">
          <span>📚</span> BSc Math-এর জটিল প্রমাণ ও থিওরেম?
        </h3>
        <p className="login-caption-text">
          এক ক্লিকেই সমাধান তোমার হাতের মুঠোয়। পাস মার্ক নয়, BSc Mathematics-এ টপ করার প্রস্তুতি শুরু হোক এখান থেকেই!
        </p>
        <p className="login-caption-text">
          টপ গ্র্যাজুয়েটদের তৈরি নোট ও ক্লাসরুমের খাতার সহজ সমাধান—একদম বিনামূল্যে।
        </p>
        <div className="login-caption-highlight">
          পরীক্ষার আগের রাতের সবচেয়ে বড় সঙ্গী: <span className="login-caption-brand">Math Note HUB</span>
        </div>
      </div>

      {/* ডান বা নিচের দিকে লগইন ফর্ম */}
      <div className="login-form-box">
        {/* Login Form Code Here */}
      </div>
    </div>
  );
}
