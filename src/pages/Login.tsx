
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import MotionToast, { Toast, MotionSwap } from "../components/MotionToast";
import HelpModal from '../components/HelpModal';
import { useLanguage } from "../LanguageProvider";

// ...existing code...

const aboutTextEn = "We are a company specialized in managing residential complexes and providing modern billing and service solutions for communities. Our platform helps residents and managers streamline payments, announcements, and communication efficiently and securely.";
const aboutTextAr = "نحن شركة متخصصة في إدارة المجمعات السكنية وتقديم حلول حديثة للفوترة والخدمات للمجتمعات. منصتنا تساعد السكان والمديرين على تبسيط المدفوعات والإعلانات والتواصل بكفاءة وأمان.";

const Login = () => {
	const { lang, toggleLang } = useLanguage();
	const isAr = lang === 'ar';
	const [showAbout, setShowAbout] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [helpOpen, setHelpOpen] = useState(false);
	const navigate = useNavigate();

	const pushToast = useCallback((type: Toast["type"], message: string) => {
		setToasts((prev) => [...prev, { id: Date.now() + Math.random(), type, message }]);
	}, []);

	const dismissToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter(t => t.id !== id));
	}, []);

	// Show flash toast after redirects (e.g., logout)
	useEffect(() => {
		try {
			const raw = sessionStorage.getItem('flashToast');
			if (raw) {
				const parsed = JSON.parse(raw) as { type: Toast["type"]; message: string };
				pushToast(parsed.type, parsed.message);
				sessionStorage.removeItem('flashToast');
			}
		} catch {}
	}, [pushToast]);

	// Load remembered phone and preference
	useEffect(() => {
		try {
		const savedPhone = localStorage.getItem('rememberPhone') || '';
		const savedRemember = localStorage.getItem('rememberMe') === 'true';
		if (savedPhone) setPhone(savedPhone);
		setRememberMe(savedRemember);
		} catch {}
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-cover bg-center relative" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
			{/* طبقة زجاجية مع تدرج لوني */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-white/30 to-blue-400/30 backdrop-blur-xl z-0" />
				{/* منطقة المحتوى الأساسية في الوسط */}
				<div className="relative z-10 flex-1 w-full flex items-center justify-center mb-4">
					<div className="relative z-10 flex flex-col items-center w-full max-w-md px-10 py-14 rounded-3xl shadow-2xl bg-white/30 border border-blue-200 animate-fade-in-slow" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
						{/* Language toggle inside the card */}
						<button
							className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-20 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/80 backdrop-blur border border-white/60 shadow hover:bg-white transition`}
							onClick={toggleLang}
							aria-label="Toggle language"
						>
							<MotionSwap switchKey={lang}>
								{lang === 'ar' ? 'AR' : 'EN'}
							</MotionSwap>
						</button>
				{/* صورة الشعار مستطيلة بحواف ناعمة وظل قوي وحجم أكبر جداً جداً */}
				<div className="overflow-hidden rounded-2xl shadow-2xl mb-10 w-80 h-52 flex items-center justify-center bg-white ring-4 ring-blue-200 border border-blue-100">
					<img src="/background/login-bg.jpg" alt="header" className="w-full h-full object-cover rounded-2xl" />
				</div>
				<h1 className="text-3xl font-bold text-blue-800 mb-2 tracking-wide font-sans drop-shadow">
					<MotionSwap switchKey={lang}>
						{lang === 'ar' ? 'مركز الفواتير' : 'Billing Hub'}
					</MotionSwap>
				</h1>
				<p className="text-gray-700 mb-8 text-center text-base font-normal">
					<MotionSwap switchKey={lang}>
						{lang === 'ar' ? 'مرحباً بعودتك! قم بإدارة فواتيرك وخدماتك بسهولة.' : 'Welcome back! Manage your bills and services easily.'}
					</MotionSwap>
				</p>
					<button
					className="w-full py-3 bg-blue-700/80 text-white rounded-lg font-bold text-lg shadow-md hover:bg-blue-800/90 transition-all duration-200 mb-4 focus:ring-2 focus:ring-blue-400"
					onClick={() => setShowLoginModal(true)}
				>
					<MotionSwap switchKey={lang}>
						{lang === 'ar' ? 'تسجيل الدخول' : 'LOGIN'}
					</MotionSwap>
				</button>

			{/* نافذة منبثقة لتسجيل الدخول */}
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
					<div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-blue-200">
						<button
							className="absolute top-3 right-3 text-gray-400 hover:text-blue-700 text-xl font-bold"
							onClick={() => setShowLoginModal(false)}
							aria-label="Close"
						>
							×
						</button>
									<form noValidate className="flex flex-col gap-6" onSubmit={async (e) => {
										e.preventDefault();
										setError("");
										// تحقق الحقول قبل النداء على قاعدة البيانات
										if (!phone.trim()) {
											pushToast('warning', isAr ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number');
											return;
										}
										if (!password) {
											pushToast('warning', isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
											return;
										}
										try {
											// البحث عن المستخدم برقم الهاتف
											const q = query(collection(db, "Users"), where("phone", "==", phone));
											const querySnapshot = await getDocs(q);
											if (querySnapshot.empty) {
												setError(isAr ? 'رقم الهاتف غير مسجل.' : 'Phone number is not registered.');
												pushToast('error', isAr ? 'رقم الهاتف غير مسجل' : 'Phone number is not registered');
												return;
											}
											let found = false;
											querySnapshot.forEach((doc) => {
												const data = doc.data();
												if (data.password === password) {
													found = true;
												}
											});
											if (found) {
												// Persist login token-ish and remember preference/phone
												localStorage.setItem('rememberMe', String(rememberMe));
												if (rememberMe) {
													localStorage.setItem('rememberPhone', phone);
													localStorage.setItem("userPhone", phone);
													try { sessionStorage.removeItem("userPhone"); } catch {}
												} else {
													try {
														sessionStorage.setItem("userPhone", phone);
														localStorage.removeItem("userPhone");
														localStorage.removeItem('rememberPhone');
													} catch {}
												}
												pushToast('success', isAr ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully');
												setShowLoginModal(false);
												setTimeout(() => navigate("/home"), 900);
											} else {
												setError(isAr ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.');
												pushToast('error', isAr ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
											}
										} catch (err) {
											setError(isAr ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred while signing in.');
											pushToast('error', isAr ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred while signing in');
										}
									}}>
										<div>
																<label className="block text-gray-700 font-semibold mb-1">
																	<MotionSwap switchKey={lang}>{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</MotionSwap>
																</label>
											<div className="flex items-center border-b border-gray-300 py-2">
												<span className="material-icons text-gray-400 mr-2" style={{ fontSize: '22px' }}>call</span>
																	<input type="text" placeholder={lang === 'ar' ? 'ادخل رقم الهاتف' : 'Enter Phone Number'} className="w-full outline-none bg-transparent" value={phone} onChange={e => setPhone(e.target.value)} />
											</div>
										</div>
										<div>
																<label className="block text-gray-700 font-semibold mb-1">
																	<MotionSwap switchKey={lang}>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</MotionSwap>
																</label>
											<div className="flex items-center border-b border-gray-300 py-2">
												<span className="material-icons text-gray-400 mr-2" style={{ fontSize: '22px' }}>lock</span>
																	<input type="password" placeholder={lang === 'ar' ? 'ادخل كلمة المرور' : 'Enter Password'} className="w-full outline-none bg-transparent" value={password} onChange={e => setPassword(e.target.value)} />
											</div>
										</div>
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												id="remember"
												className="accent-blue-600"
												checked={rememberMe}
												onChange={(e) => {
													const v = e.target.checked;
													setRememberMe(v);
													try { localStorage.setItem('rememberMe', String(v)); } catch {}
												}}
											/>
																<label htmlFor="remember" className="text-gray-700 text-sm">
																	<MotionSwap switchKey={lang}>{lang === 'ar' ? 'تذكرني' : 'Remember me'}</MotionSwap>
																</label>
										</div>
															{error && <div className="text-red-500 text-sm text-center">{error}</div>}
																<button type="submit" className="w-full py-3 bg-blue-700 text-white rounded-full font-bold text-lg shadow-md hover:bg-blue-800 transition-all duration-200 mt-2">
																	<MotionSwap switchKey={lang}>{lang === 'ar' ? 'تسجيل الدخول' : 'SIGN IN'}</MotionSwap>
																</button>
																<button type="button" onClick={() => setHelpOpen(true)} className="block mx-auto text-center text-purple-600 mt-4 underline">
																	<MotionSwap switchKey={lang}>{lang === 'ar' ? 'مساعدة' : 'Get help'}</MotionSwap>
																</button>
									</form>
														<footer className="w-full text-center text-[11px] text-gray-500 mt-6 opacity-90">
															<div>
																<MotionSwap switchKey={lang}>© 2025 ForgeMind. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}</MotionSwap>
															</div>
															<div className="opacity-90">
																<MotionSwap switchKey={lang}>{lang === 'ar' ? 'تصميم عبدالرحمن و محمد' : 'Designed by Abdalrahman & Mohammed'}</MotionSwap>
															</div>
						</footer>
					</div>
				</div>
			)}

						{/* Toasts moved outside this container to avoid being clipped by sibling stacking contexts */}
						<div className="flex justify-center gap-8 mb-8 w-full">
							<div className="flex flex-col items-center">
								<button
									className="flex items-center gap-1 text-purple-700 text-sm underline hover:text-purple-900 transition font-semibold"
									onMouseEnter={() => setShowAbout(true)}
									onMouseLeave={() => setShowAbout(false)}
								>
									{lang === 'ar' ? 'من نحن' : 'About Us'}
								</button>
							</div>
							<button onClick={() => setHelpOpen(true)} className="text-purple-700 text-sm underline hover:text-purple-900 transition font-semibold">{lang === 'ar' ? 'مساعدة' : 'Get help'}</button>
						</div>
						<HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
					</div>
				</div>

			{/* Footer أسفل الصفحة (مخفي عند فتح نافذة تسجيل الدخول) */}
			{!showLoginModal && (
				<footer className="relative z-10 w-full flex justify-center mb-6 px-4" aria-label="page-rights">
					<div className="px-5 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-lg text-[11px] leading-tight text-gray-700 text-center w-[76vw] max-w-[360px] sm:max-w-[400px]">
						<div className="font-medium">
							<MotionSwap switchKey={lang}>© 2025 ForgeMind. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}</MotionSwap>
						</div>
						<div className="text-[10px] opacity-80">
							<MotionSwap switchKey={lang}>{lang === 'ar' ? 'تصميم عبدالرحمن و محمد' : 'Designed by Abdalrahman & Mohammed'}</MotionSwap>
						</div>
					</div>
				</footer>
			)}

			{/* نافذة منبثقة عصرية لعرض About Us عند Hover مع زر إغلاق */}
			{showAbout && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
					onMouseEnter={() => setShowAbout(true)}
					onMouseLeave={() => setShowAbout(false)}
				>
					<div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-purple-200">
						<button
							className="absolute top-3 right-3 text-gray-400 hover:text-purple-700 text-xl font-bold"
							onClick={() => setShowAbout(false)}
							aria-label="Close"
						>
							×
						</button>
						<div className="flex flex-col items-center mb-4">
							<img src="/background/login-bg.jpg" alt="header" className="w-12 h-12 rounded-full shadow border border-purple-200 mb-2" />
							<span className="font-bold text-purple-700 text-lg">{lang === 'ar' ? 'من نحن' : 'About Us'}</span>
						</div>
						<p className="text-gray-700 text-sm text-center">{lang === 'ar' ? aboutTextAr : aboutTextEn}</p>
					</div>
				</div>
			)}

			{/* Toasts placed at root level for highest stacking over footer and overlays */}
			<MotionToast toasts={toasts} onDismiss={dismissToast} />
		</div>
	);
};

export default Login;
